import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

export interface StorageProvider {
  upload(key: string, buffer: Buffer): Promise<void>;
  getSignedUrl(key: string, ttlSeconds: number): Promise<string>;
}

/**
 * Dev-only local storage adapter.
 * Stores files under LOCAL_UPLOAD_DIR or /tmp/uploads.
 */
export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor(baseDir = process.env.LOCAL_UPLOAD_DIR ?? "/tmp/uploads") {
    this.baseDir = baseDir;
  }

  async upload(key: string, buffer: Buffer): Promise<void> {
    const fullPath = path.join(this.baseDir, key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, buffer);
  }

  async getSignedUrl(key: string, ttlSeconds: number): Promise<string> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    const token = randomUUID();

    return `/api/uploads/file?key=${encodeURIComponent(
      key
    )}&token=${token}&expires=${expiresAt}`;
  }
}

let storage: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!storage) {
    storage = new LocalStorageProvider();
  }

  return storage;
}
