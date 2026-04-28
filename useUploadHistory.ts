// FILE: hooks/useUploadHistory.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, QUERY_KEYS } from "@/lib/query-client";
import { toast } from "sonner";
import type { ApiResponse, UploadRecord } from "@/types";

interface UploadHistoryParams {
  page?: number;
  limit?: number;
  type?: "DAILY" | "MONTHLY";
  branchId?: string;
}

interface UploadHistoryResponse {
  uploads: UploadRecord[];
  total: number;
  page: number;
  totalPages: number;
}

export function useUploadHistory(params: UploadHistoryParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.type) searchParams.set("type", params.type);
  if (params.branchId) searchParams.set("branchId", params.branchId);

  return useQuery({
    queryKey: QUERY_KEYS.uploadHistory(params),
    queryFn: () =>
      apiFetch<UploadHistoryResponse>(`/api/upload?${searchParams.toString()}`),
    staleTime: 30 * 1000,
  });
}

interface UploadMutationVars {
  file: File;
  branchName: string;
  uploadType: "DAILY" | "MONTHLY";
  date: string;
}

export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, branchName, uploadType, date }: UploadMutationVars) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("branchName", branchName);
      formData.append("uploadType", uploadType);
      formData.append("date", date);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json: ApiResponse<UploadRecord> = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Upload failed");
      return json.data!;
    },
    onSuccess: () => {
      toast.success("File uploaded successfully");
      queryClient.invalidateQueries({ queryKey: ["uploads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: Error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });
}
