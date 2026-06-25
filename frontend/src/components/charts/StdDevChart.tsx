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
  Cell,
} from "recharts";
import type { DatasetAnalysis } from "@/types";

interface Props {
  anterior: DatasetAnalysis;
  nuevo: DatasetAnalysis;
  selectedTest: string;
}

const MAX_BARS = 30;

export default function StdDevChart({ anterior, nuevo, selectedTest }: Props) {
  const antMap = new Map(anterior.test_stats.map((t) => [t.test_name, t.std]));
  const nueMap = new Map(nuevo.test_stats.map((t) => [t.test_name, t.std]));

  const allNames = Array.from(new Set([...Array.from(antMap.keys()), ...Array.from(nueMap.keys())])).sort();

  let visibleNames: string[];
  if (selectedTest !== "all") {
    // If a specific test is selected, show it plus the top neighbours by std dev
    const ranked = [...allNames].sort(
      (a, b) => (nueMap.get(b) ?? 0) + (antMap.get(b) ?? 0) - ((nueMap.get(a) ?? 0) + (antMap.get(a) ?? 0))
    );
    // Always include the selected test, fill rest from top-variance tests
    const top = ranked.filter((n) => n !== selectedTest).slice(0, MAX_BARS - 1);
    visibleNames = [selectedTest, ...top].sort();
  } else if (allNames.length > MAX_BARS) {
    // When "all" and too many tests: show the top MAX_BARS by combined std dev
    visibleNames = [...allNames]
      .sort(
        (a, b) => (nueMap.get(b) ?? 0) + (antMap.get(b) ?? 0) - ((nueMap.get(a) ?? 0) + (antMap.get(a) ?? 0))
      )
      .slice(0, MAX_BARS);
  } else {
    visibleNames = allNames;
  }

  const data = visibleNames.map((name) => ({
    name,
    anterior: antMap.get(name) ?? 0,
    nuevo: nueMap.get(name) ?? 0,
    highlighted: selectedTest !== "all" && name === selectedTest,
  }));

  const truncated = allNames.length > MAX_BARS && selectedTest === "all";

  if (!data.length) {
    return <div className="flex items-center justify-center h-64 text-slate-600 text-sm">Sin datos</div>;
  }

  return (
    <div>
      {truncated && (
        <p className="text-xs text-slate-500 mb-1 px-1">
          Mostrando top {MAX_BARS} de {allNames.length} pruebas por mayor σ — selecciona una prueba para enfocar.
        </p>
      )}
      <ResponsiveContainer width="100%" height={truncated ? 260 : 280}>
        <BarChart data={data} margin={{ top: 4, right: 16, bottom: 24, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "#64748b", fontSize: 9 }}
            angle={-40}
            textAnchor="end"
            interval={0}
            height={54}
            tickFormatter={(v: string) => {
              // Shorten long test names in the axis
              const parts = v.split("_");
              const last = parts[parts.length - 1].trim();
              return /^\d+$/.test(last) && parts.length >= 2
                ? `${parts[parts.length - 2]}_${last}`
                : last.length > 18 ? last.slice(0, 16) + "…" : last;
            }}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickFormatter={(v) => v.toFixed(4)}
            width={72}
            label={{
              value: "Std Dev (V)",
              angle: -90,
              position: "insideLeft",
              fill: "#64748b",
              fontSize: 11,
            }}
          />
          <Tooltip
            contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, fontSize: 12 }}
            labelFormatter={(label: string) => label}
            formatter={(v: number) => [v.toFixed(6) + " V", ""]}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="anterior" name="Busbar Anterior" fill="#3b82f6" opacity={0.85}>
            {data.map((d, i) => (
              <Cell key={i} fill="#3b82f6" opacity={d.highlighted ? 1 : 0.6} />
            ))}
          </Bar>
          <Bar dataKey="nuevo" name="Busbar Nuevo" fill="#10b981" opacity={0.85}>
            {data.map((d, i) => (
              <Cell key={i} fill="#10b981" opacity={d.highlighted ? 1 : 0.6} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
