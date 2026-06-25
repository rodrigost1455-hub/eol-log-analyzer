"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchAnalysis, type LineId } from "@/services/api";
import type { AnalysisResponse } from "@/types";
import FileUpload from "@/components/FileUpload";
import Dashboard from "@/components/Dashboard";

const LINES: { id: LineId; label: string; description: string }[] = [
  { id: "mp",   label: "MP",   description: "Línea MP — Busbar anterior vs nuevo" },
  { id: "ds",   label: "DS",   description: "Línea DS — Busbar anterior vs nuevo" },
  { id: "31xx", label: "31XX", description: "Línea 31XX — Voltage Drop & Continuity Tests" },
];

export default function Home() {
  const [line, setLine] = useState<LineId>("mp");
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (selectedLine: LineId = line) => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchAnalysis(selectedLine);
        setAnalysis(data);
      } catch {
        setError(
          "No se pudo conectar al backend. Asegúrate de que FastAPI esté corriendo en el puerto 8000."
        );
      } finally {
        setLoading(false);
      }
    },
    [line]
  );

  useEffect(() => {
    load(line);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line]);

  function handleLineChange(id: LineId) {
    setLine(id);
    setAnalysis(null);
  }

  const activeLineInfo = LINES.find((l) => l.id === line)!;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-slate-100">EOL Log Analyzer</h1>
              <p className="text-xs text-slate-500">End of Line Test Analysis System</p>
            </div>
          </div>

          {/* Line selector */}
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1 ml-4">
            {LINES.map((l) => (
              <button
                key={l.id}
                onClick={() => handleLineChange(l.id)}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                  line === l.id
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-500 hidden md:block">{activeLineInfo.description}</span>

          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => load(line)}
              disabled={loading}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded border border-slate-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Cargando..." : "Actualizar"}
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-screen-2xl mx-auto px-6 py-6 space-y-6">
        <FileUpload onComplete={() => load(line)} line={line} />

        {error && (
          <div className="rounded-lg border border-red-800 bg-red-950/50 p-4 text-sm text-red-300">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}

        {loading && !error && (
          <div className="flex items-center justify-center py-24 text-slate-500 text-sm gap-3">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Cargando datos línea {line.toUpperCase()}...
          </div>
        )}

        {analysis && !loading && <Dashboard analysis={analysis} line={line} />}
      </main>
    </div>
  );
}
