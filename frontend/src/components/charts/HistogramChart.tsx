"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { DatasetAnalysis } from "@/types";

interface Props {
  anterior: DatasetAnalysis;
  nuevo: DatasetAnalysis;
  selectedTest: string;
}

function getVoltages(analysis: DatasetAnalysis, test: string) {
  const ms = analysis.measurements;
  return (test === "all" ? ms : ms.filter((m) => m.test_name === test)).map(
    (m) => m.measurement
  );
}

function makeBins(values: number[], binCount: number) {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const step = (max - min) / binCount || 1;
  const bins: number[] = Array(binCount).fill(0);
  values.forEach((v) => {
    const i = Math.min(Math.floor((v - min) / step), binCount - 1);
    bins[i]++;
  });
  return bins.map((count, i) => ({
    range: (min + i * step).toFixed(4),
    count,
  }));
}

const BINS = 20;

export default function HistogramChart({ anterior, nuevo, selectedTest }: Props) {
  const antV = getVoltages(anterior, selectedTest);
  const nueV = getVoltages(nuevo, selectedTest);

  const allV = [...antV, ...nueV];
  if (!allV.length) {
    return <div className="flex items-center justify-center h-64 text-slate-600 text-sm">Sin datos</div>;
  }

  const globalMin = Math.min(...allV);
  const globalMax = Math.max(...allV);
  const step = (globalMax - globalMin) / BINS || 1;

  const binLabels = Array.from({ length: BINS }, (_, i) =>
    (globalMin + i * step).toFixed(4)
  );

  function toBins(vs: number[]) {
    const bins: number[] = Array(BINS).fill(0);
    vs.forEach((v) => {
      const i = Math.min(Math.floor((v - globalMin) / step), BINS - 1);
      bins[i]++;
    });
    return bins;
  }

  const antBins = toBins(antV);
  const nueBins = toBins(nueV);

  const data = binLabels.map((label, i) => ({
    label,
    anterior: antBins[i],
    nuevo: nueBins[i],
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis
          dataKey="label"
          tick={false}
          label={{ value: "Voltaje (V)", position: "insideBottom", offset: -2, fill: "#64748b", fontSize: 11 }}
        />
        <YAxis
          tick={{ fill: "#64748b", fontSize: 11 }}
          label={{ value: "Frecuencia", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 11 }}
        />
        <Tooltip
          contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, fontSize: 12 }}
          labelFormatter={(l) => `~${l} V`}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="anterior" name="Busbar Anterior" fill="#3b82f6" opacity={0.8} />
        <Bar dataKey="nuevo" name="Busbar Nuevo" fill="#10b981" opacity={0.8} />
      </BarChart>
    </ResponsiveContainer>
  );
}
