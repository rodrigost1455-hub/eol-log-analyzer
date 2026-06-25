"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { DatasetAnalysis } from "@/types";

interface Props {
  anterior: DatasetAnalysis;
  nuevo: DatasetAnalysis;
  selectedTest: string;
  limitInf?: number;
  limitSup?: number;
}

interface Point {
  index: number;
  anterior?: number;
  nuevo?: number;
}

function filterMeasurements(analysis: DatasetAnalysis, test: string) {
  const ms = analysis.measurements;
  return test === "all" ? ms : ms.filter((m) => m.test_name === test);
}

export default function VoltageTrendChart({ anterior, nuevo, selectedTest, limitInf, limitSup }: Props) {
  const antMs = filterMeasurements(anterior, selectedTest);
  const nueMs = filterMeasurements(nuevo, selectedTest);
  const maxLen = Math.max(antMs.length, nueMs.length);

  const data: Point[] = Array.from({ length: maxLen }, (_, i) => ({
    index: i + 1,
    anterior: antMs[i]?.measurement,
    nuevo: nueMs[i]?.measurement,
  }));

  const fmt = (v: number) => v?.toFixed(4);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          dataKey="index"
          tick={{ fill: "#64748b", fontSize: 11 }}
          label={{ value: "Muestra", position: "insideBottom", offset: -2, fill: "#64748b", fontSize: 11 }}
        />
        <YAxis
          tick={{ fill: "#64748b", fontSize: 11 }}
          tickFormatter={fmt}
          width={72}
          label={{ value: "Voltaje (V)", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 11 }}
        />
        <Tooltip
          contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, fontSize: 12 }}
          labelStyle={{ color: "#94a3b8" }}
          formatter={(v: number) => [v?.toFixed(6) + " V", ""]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />

        {/* Spec limit reference lines — only shown when a test with limits is selected */}
        {limitInf != null && (
          <ReferenceLine
            y={limitInf}
            stroke="#f59e0b"
            strokeDasharray="5 3"
            strokeWidth={1}
            label={{ value: `L_inf ${limitInf}V`, position: "insideTopLeft", fill: "#f59e0b", fontSize: 10 }}
          />
        )}
        {limitSup != null && (
          <ReferenceLine
            y={limitSup}
            stroke="#f59e0b"
            strokeDasharray="5 3"
            strokeWidth={1}
            label={{ value: `L_sup ${limitSup}V`, position: "insideTopLeft", fill: "#f59e0b", fontSize: 10 }}
          />
        )}

        <Line
          type="monotone"
          dataKey="anterior"
          name="Busbar Anterior"
          stroke="#3b82f6"
          dot={false}
          strokeWidth={1.5}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="nuevo"
          name="Busbar Nuevo"
          stroke="#10b981"
          dot={false}
          strokeWidth={1.5}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
