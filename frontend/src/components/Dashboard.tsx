"use client";

import { useMemo, useState } from "react";
import type { AnalysisResponse } from "@/types";
import type { LineId } from "@/services/api";
import KPICard from "./KPICard";
import VoltageTrendChart from "./charts/VoltageTrendChart";
import HistogramChart from "./charts/HistogramChart";
import BoxplotChart from "./charts/BoxplotChart";
import StdDevChart from "./charts/StdDevChart";
import PassFailChart from "./charts/PassFailChart";

interface Props {
  analysis: AnalysisResponse;
  line: LineId;
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-800">
        <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function DatasetKPIs({
  label,
  analysis,
  color,
}: {
  label: string;
  analysis: AnalysisResponse["busbar_anterior"];
  color: "blue" | "emerald";
}) {
  const accent = color === "blue" ? "text-blue-400" : "text-emerald-400";
  const dot = color === "blue" ? "bg-blue-500" : "bg-emerald-500";

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
        <h2 className="text-sm font-semibold text-slate-200">{label}</h2>
        <span className="ml-auto text-xs text-slate-500">{analysis.total_records} mediciones</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <KPICard label="Total" value={analysis.total_records} />
        <KPICard label="PASS" value={analysis.pass_count} accent="text-emerald-400" />
        <KPICard label="FAIL" value={analysis.fail_count} accent={analysis.fail_count > 0 ? "text-red-400" : "text-slate-400"} />
        <KPICard
          label="Yield"
          value={`${analysis.yield_pct.toFixed(1)}%`}
          accent={analysis.yield_pct >= 99 ? "text-emerald-400" : analysis.yield_pct >= 95 ? "text-yellow-400" : "text-red-400"}
        />
        <KPICard
          label="Media V"
          value={analysis.overall_stats.mean.toFixed(4)}
          sub="voltios"
          accent={accent}
        />
        <KPICard
          label="Std Dev"
          value={analysis.overall_stats.std.toFixed(6)}
          sub="voltios"
        />
        <KPICard
          label="Mín V"
          value={analysis.overall_stats.min.toFixed(4)}
          sub="voltios"
        />
        <KPICard
          label="Máx V"
          value={analysis.overall_stats.max.toFixed(4)}
          sub="voltios"
        />
      </div>
    </div>
  );
}

/** Short label for 31XX full Prueba paths — joins last 2 segments when last is a bare number. */
function shortLabel(testName: string): string {
  const parts = testName.split("_");
  if (!parts.length) return testName;
  const last = parts[parts.length - 1].trim();
  if (/^\d+$/.test(last) && parts.length >= 2) {
    return `${parts[parts.length - 2]}_${last}`;
  }
  return last;
}

export default function Dashboard({ analysis, line }: Props) {
  const { busbar_anterior: ant, busbar_nuevo: nue } = analysis;
  const lineLabel = line.toUpperCase();
  const is31xx = line === "31xx";

  const testNames = useMemo(() => {
    const names = new Set<string>();
    ant.test_stats.forEach((t) => names.add(t.test_name));
    nue.test_stats.forEach((t) => names.add(t.test_name));
    return Array.from(names).sort();
  }, [ant, nue]);

  const [selectedTest, setSelectedTest] = useState("all");
  const [testSearch, setTestSearch] = useState("");

  const filteredNames = useMemo(() => {
    if (!testSearch.trim()) return testNames;
    const q = testSearch.toLowerCase();
    return testNames.filter((n) => n.toLowerCase().includes(q) || shortLabel(n).toLowerCase().includes(q));
  }, [testNames, testSearch]);

  // Extract spec limits for the selected test (31XX only)
  const selectedLimits = useMemo(() => {
    if (selectedTest === "all") return null;
    const m = ant.measurements.find(
      (m) => m.test_name === selectedTest && m.limit_inf != null
    );
    if (!m) return null;
    return { inf: m.limit_inf as number, sup: m.limit_sup as number };
  }, [selectedTest, ant]);

  return (
    <div className="space-y-6">
      {/* Line badge + KPI rows */}
      <div className="flex items-center gap-2 -mb-2">
        <span className="text-xs font-mono bg-slate-800 border border-slate-700 text-blue-400 px-2 py-0.5 rounded">
          Línea {lineLabel}
        </span>
        <span className="text-xs text-slate-500">
          {ant.total_records + nue.total_records} mediciones de voltaje totales
          {is31xx && ` · ${testNames.length} pruebas únicas`}
        </span>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <DatasetKPIs label="Busbar Anterior" analysis={ant} color="blue" />
        <DatasetKPIs label="Busbar Nuevo" analysis={nue} color="emerald" />
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-xs font-medium text-slate-400 flex-shrink-0">Filtrar prueba:</label>

          {/* Search input — shown for 31xx or when there are many tests */}
          {(is31xx || testNames.length > 20) && (
            <input
              type="text"
              placeholder={`Buscar entre ${testNames.length} pruebas…`}
              value={testSearch}
              onChange={(e) => setTestSearch(e.target.value)}
              className="text-sm bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
            />
          )}

          <select
            value={selectedTest}
            onChange={(e) => setSelectedTest(e.target.value)}
            className="text-sm bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-xs"
          >
            <option value="all">Todas las pruebas ({filteredNames.length})</option>
            {filteredNames.map((name) => (
              <option key={name} value={name} title={name}>
                {is31xx ? shortLabel(name) : name}
              </option>
            ))}
          </select>

          <button
            onClick={() => { setSelectedTest("all"); setTestSearch(""); }}
            className={`text-xs px-2 py-1 rounded border transition-colors ${
              selectedTest === "all" && !testSearch
                ? "border-slate-700 text-slate-600 cursor-default"
                : "border-blue-800 text-blue-400 hover:bg-blue-950"
            }`}
            disabled={selectedTest === "all" && !testSearch}
          >
            Limpiar
          </button>
        </div>

        {/* Stats row for selected test */}
        {selectedTest !== "all" && (
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 border-t border-slate-800 pt-2">
            {is31xx && (
              <span className="font-mono text-slate-400 text-xs truncate max-w-xs" title={selectedTest}>
                {selectedTest}
              </span>
            )}
            {[
              { label: "Ant. media", val: ant.test_stats.find((t) => t.test_name === selectedTest)?.mean, color: "text-blue-400" },
              { label: "Nue. media", val: nue.test_stats.find((t) => t.test_name === selectedTest)?.mean, color: "text-emerald-400" },
              { label: "Ant. σ", val: ant.test_stats.find((t) => t.test_name === selectedTest)?.std, color: "text-blue-300" },
              { label: "Nue. σ", val: nue.test_stats.find((t) => t.test_name === selectedTest)?.std, color: "text-emerald-300" },
            ].map(({ label, val, color }) =>
              val !== undefined ? (
                <span key={label}>
                  {label}: <span className={`font-mono font-semibold ${color}`}>{val.toFixed(6)} V</span>
                </span>
              ) : null
            )}
            {selectedLimits && (
              <span className="ml-auto text-slate-500">
                Límites:{" "}
                <span className="font-mono text-yellow-400">[{selectedLimits.inf.toFixed(3)}, {selectedLimits.sup.toFixed(3)}] V</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Tendencia de Voltaje">
          <VoltageTrendChart
            anterior={ant}
            nuevo={nue}
            selectedTest={selectedTest}
            limitInf={selectedLimits?.inf}
            limitSup={selectedLimits?.sup}
          />
        </ChartCard>

        <ChartCard title="Distribución de Voltajes (Histograma)">
          <HistogramChart anterior={ant} nuevo={nue} selectedTest={selectedTest} />
        </ChartCard>

        <ChartCard title="Boxplot Comparativo">
          <BoxplotChart anterior={ant} nuevo={nue} selectedTest={selectedTest} />
        </ChartCard>

        <ChartCard title="Desviación Estándar por Prueba">
          <StdDevChart anterior={ant} nuevo={nue} selectedTest={selectedTest} />
        </ChartCard>

        <ChartCard title="Resultados PASS / FAIL">
          <PassFailChart anterior={ant} nuevo={nue} />
        </ChartCard>

        {/* Stats table */}
        <ChartCard title="Estadísticas por Prueba">
          <div className="overflow-auto max-h-72">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800">
                  <th className="text-left py-1.5 pr-3 font-medium">Prueba</th>
                  <th className="text-right py-1.5 pr-3 font-medium">Ant. Media</th>
                  <th className="text-right py-1.5 pr-3 font-medium">Ant. σ</th>
                  <th className="text-right py-1.5 pr-3 font-medium">Nue. Media</th>
                  <th className="text-right py-1.5 font-medium">Nue. σ</th>
                </tr>
              </thead>
              <tbody>
                {(selectedTest === "all" ? filteredNames : filteredNames.filter((n) => n === selectedTest))
                  .map((name) => {
                    const a = ant.test_stats.find((t) => t.test_name === name);
                    const b = nue.test_stats.find((t) => t.test_name === name);
                    const diffMean = a && b ? Math.abs(a.mean - b.mean) : null;
                    const displayName = is31xx ? shortLabel(name) : name;
                    return (
                      <tr
                        key={name}
                        onClick={() => setSelectedTest(name)}
                        title={name}
                        className={`border-b border-slate-800/50 cursor-pointer hover:bg-slate-800/30 ${
                          name === selectedTest ? "bg-slate-800/50" : ""
                        }`}
                      >
                        <td className="py-1.5 pr-3 font-mono text-slate-300 max-w-[160px] truncate">{displayName}</td>
                        <td className="py-1.5 pr-3 text-right text-blue-400 font-mono">
                          {a ? a.mean.toFixed(4) : "—"}
                        </td>
                        <td className="py-1.5 pr-3 text-right text-blue-300 font-mono">
                          {a ? a.std.toFixed(5) : "—"}
                        </td>
                        <td className="py-1.5 pr-3 text-right text-emerald-400 font-mono">
                          {b ? b.mean.toFixed(4) : "—"}
                        </td>
                        <td
                          className={`py-1.5 text-right font-mono ${
                            diffMean !== null && diffMean > 0.05
                              ? "text-yellow-400"
                              : "text-emerald-300"
                          }`}
                        >
                          {b ? b.std.toFixed(5) : "—"}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
