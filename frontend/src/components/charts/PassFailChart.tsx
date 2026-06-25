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
}

export default function PassFailChart({ anterior, nuevo }: Props) {
  const data = [
    {
      dataset: "Busbar Anterior",
      PASS: anterior.pass_count,
      FAIL: anterior.fail_count,
      yield: anterior.yield_pct,
    },
    {
      dataset: "Busbar Nuevo",
      PASS: nuevo.pass_count,
      FAIL: nuevo.fail_count,
      yield: nuevo.yield_pct,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Yield badges */}
      <div className="flex gap-4">
        {data.map((d) => (
          <div key={d.dataset} className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-center">
            <p className="text-xs text-slate-500 mb-0.5">{d.dataset}</p>
            <p
              className={`text-lg font-bold tabular-nums ${
                d.yield >= 99 ? "text-emerald-400" : d.yield >= 95 ? "text-yellow-400" : "text-red-400"
              }`}
            >
              {d.yield.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500">Yield</p>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="dataset" tick={{ fill: "#64748b", fontSize: 11 }} />
          <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="PASS" fill="#10b981" opacity={0.85} radius={[3, 3, 0, 0]} />
          <Bar dataKey="FAIL" fill="#ef4444" opacity={0.85} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
