import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { createUpload } from "@/lib/upload/actions";
import type { SessionUser } from "@/types";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return errorResponse("Unauthorized", 401);
    }

    const user = session.user as SessionUser;
    if (user.role !== "employee" && user.role !== "company_admin" && user.role !== "super_admin") {
      return errorResponse("Forbidden", 403);
    }

    if (!user.companySlug) {
      return errorResponse("No company assigned.", 403);
    }

    const incoming = await req.formData();
    const file = incoming.get("file");
    const asOnDate = incoming.get("as_on_date");
    const statementType = incoming.get("statement_type");

    if (!(file instanceof File)) {
      return errorResponse("file is required", 400);
    }
    if (typeof asOnDate !== "string" || !asOnDate) {
      return errorResponse("as_on_date is required", 400);
    }
    if (typeof statementType !== "string" || !statementType) {
      return errorResponse("statement_type is required", 400);
    }

    const formData = new FormData();
    formData.set("file", file);
    formData.set("as_on_date", asOnDate);
    formData.set("company_slug", user.companySlug);
    formData.set("portfolio_type", "GOLD_LOAN");

    const upload = await createUpload(formData);
    return successResponse({
      id: upload.id,
      status: upload.status,
      fileName: upload.fileName,
      asOnDate: upload.asOnDate,
      statementType,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return errorResponse(message, 400);
  }
}
