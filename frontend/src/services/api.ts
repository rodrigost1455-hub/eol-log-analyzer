import type { AnalysisResponse } from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type LineId = "mp" | "ds" | "31xx";

export async function fetchAnalysis(line: LineId): Promise<AnalysisResponse> {
  const res = await fetch(`${BASE}/api/${line}/analysis`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function uploadFiles(
  files: File[],
  datasetType: "busbar_anterior" | "busbar_nuevo",
  line: LineId
): Promise<{ message: string; count: number }> {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  const res = await fetch(`${BASE}/api/${line}/upload/${datasetType}`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`Upload failed ${res.status}`);
  return res.json();
}
