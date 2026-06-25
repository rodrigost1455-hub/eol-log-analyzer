export type DatasetType = "busbar_anterior" | "busbar_nuevo";

export interface Measurement {
  serie: string;
  modelo: string;
  fecha: string;
  tiempo_total: number;
  test_name: string;
  test_label?: string;
  result: "PASS" | "FAIL";
  measurement: number;
  unit: string;
  limit_inf?: number | null;
  limit_sup?: number | null;
  test_time: number;
  file_index: number;
  dataset: DatasetType;
  line?: string;
}

export interface Stats {
  count: number;
  mean: number;
  std: number;
  min: number;
  max: number;
  q1: number;
  median: number;
  q3: number;
}

export interface TestStats extends Stats {
  test_name: string;
  pass_count: number;
  fail_count: number;
}

export interface DatasetAnalysis {
  total_records: number;
  pass_count: number;
  fail_count: number;
  yield_pct: number;
  overall_stats: Stats;
  test_stats: TestStats[];
  measurements: Measurement[];
}

export interface AnalysisResponse {
  busbar_anterior: DatasetAnalysis;
  busbar_nuevo: DatasetAnalysis;
}
