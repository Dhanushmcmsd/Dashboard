import * as XLSX from "xlsx";

export type ParseSkippedRow = {
  row: number;
  reason: string;
};

export type ParseFieldError = {
  field: string;
  count: number;
};

export type ParseResult<T> = {
  parsed: T[];
  skipped: ParseSkippedRow[];
  errors: ParseFieldError[];
};

export type ParserColumn<TField extends string = string> = {
  field: TField;
  aliases: string[];
  required?: boolean;
};

export type ExtractedSpreadsheet<TField extends string = string> = {
  rows: SpreadsheetRow[];
  headerRow: number;
  columnMap: Map<TField, number>;
};

export type SpreadsheetRow = {
  rowNumber: number;
  values: Map<number, unknown>;
};

export function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function levenshteinDistance(a: string, b: string): number {
  const left = normalizeHeader(a);
  const right = normalizeHeader(b);
  const previous = Array.from({ length: right.length + 1 }, (_, i) => i);

  for (let i = 1; i <= left.length; i++) {
    let lastDiagonal = previous[0];
    previous[0] = i;

    for (let j = 1; j <= right.length; j++) {
      const previousAbove = previous[j];
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        lastDiagonal + cost
      );
      lastDiagonal = previousAbove;
    }
  }

  return previous[right.length];
}

export function buildFuzzyColumnMap<TField extends string>(
  headers: unknown[],
  columns: ParserColumn<TField>[],
  threshold = 2
): Map<TField, number> {
  const normalizedHeaders = headers.map(normalizeHeader);
  const columnMap = new Map<TField, number>();

  for (const column of columns) {
    let bestIndex = -1;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const alias of column.aliases) {
      const normalizedAlias = normalizeHeader(alias);

      for (let i = 0; i < normalizedHeaders.length; i++) {
        const header = normalizedHeaders[i];
        if (!header) continue;

        const distance = levenshteinDistance(header, normalizedAlias);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = i;
        }
      }
    }

    if (bestIndex !== -1 && bestDistance <= threshold) {
      columnMap.set(column.field, bestIndex + 1);
    }
  }

  return columnMap;
}

export function missingRequiredColumns<TField extends string>(
  columnMap: Map<TField, number>,
  columns: ParserColumn<TField>[]
): TField[] {
  return columns
    .filter((column) => column.required !== false && !columnMap.has(column.field))
    .map((column) => column.field);
}

export async function extractSpreadsheetRows<TField extends string>(
  buffer: Buffer,
  columns: ParserColumn<TField>[],
  threshold = 2
): Promise<ExtractedSpreadsheet<TField>> {
  const worksheetRows = readWorksheetRows(buffer);

  if (worksheetRows.length === 0) {
    throw new Error("Spreadsheet has no sheets.");
  }

  let best:
    | { headerRow: number; columnMap: Map<TField, number>; matchedCount: number }
    | null = null;
  const maxScanRow = Math.min(worksheetRows.length, 20);

  for (let rowNumber = 1; rowNumber <= maxScanRow; rowNumber++) {
    const headers = worksheetRows[rowNumber - 1] ?? [];
    const columnMap = buildFuzzyColumnMap(headers, columns, threshold);
    const matchedCount = columnMap.size;

    if (!best || matchedCount > best.matchedCount) {
      best = { headerRow: rowNumber, columnMap, matchedCount };
    }
  }

  if (!best || best.matchedCount === 0) {
    throw new Error("Could not find a matching header row.");
  }

  const rows: SpreadsheetRow[] = [];
  for (let rowNumber = best.headerRow + 1; rowNumber <= worksheetRows.length; rowNumber++) {
    const values = getRowValueMap(worksheetRows[rowNumber - 1] ?? []);
    if (isBlankRow(values)) continue;
    rows.push({ rowNumber, values });
  }

  return {
    rows,
    headerRow: best.headerRow,
    columnMap: best.columnMap,
  };
}

export function getMappedValue<TField extends string>(
  row: SpreadsheetRow,
  columnMap: Map<TField, number>,
  field: TField
): unknown {
  const columnIndex = columnMap.get(field);
  if (!columnIndex) return undefined;

  return row.values.get(columnIndex);
}

export function createErrorSummary(errors: string[]): ParseFieldError[] {
  const counts = new Map<string, number>();
  for (const error of errors) {
    counts.set(error, (counts.get(error) ?? 0) + 1);
  }

  return [...counts.entries()].map(([field, count]) => ({ field, count }));
}

export function coerceRequiredString(value: unknown): string | null {
  const text = cellToText(value);
  return text ? text : null;
}

export function coerceNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const text = cellToText(value);
  if (!text) return null;

  const numeric = text.replace(/[^0-9.-]/g, "");
  if (!numeric || numeric === "-" || numeric === "." || numeric === "-.") {
    return null;
  }

  const parsed = Number(numeric);
  return Number.isFinite(parsed) ? parsed : null;
}

export function coerceDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number") {
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const text = cellToText(value);
  if (!text) return null;

  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    return validDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }

  const slash = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slash) {
    return validDate(Number(slash[3]), Number(slash[2]), Number(slash[1]));
  }

  const dash = text.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dash) {
    return validDate(Number(dash[3]), Number(dash[2]), Number(dash[1]));
  }

  return null;
}

export function cellToText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();

  if (typeof value === "object") {
    if ("result" in value) return cellToText(value.result);
    if ("text" in value) return cellToText(value.text);
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part: { text?: string }) => part.text ?? "").join("");
    }
  }

  return String(value).trim();
}

function getRowValueMap(row: unknown[]): Map<number, unknown> {
  const values = new Map<number, unknown>();
  row.forEach((value, index) => {
    values.set(index + 1, value);
  });
  return values;
}

function isBlankRow(values: Map<number, unknown>): boolean {
  return [...values.values()].every((value) => cellToText(value) === "");
}

function validDate(year: number, month: number, day: number): Date | null {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function readWorksheetRows(buffer: Buffer): unknown[][] {
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: true,
    raw: true,
  });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    blankrows: false,
    raw: true,
  });
}
