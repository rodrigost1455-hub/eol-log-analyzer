"use client";

import { useRef, useState } from "react";
import { uploadFiles, type LineId } from "@/services/api";

interface Props {
  onComplete: () => void;
  line: LineId;
}

function DropZone({
  label,
  color,
  dataset,
  onComplete,
  line,
}: {
  label: string;
  color: "blue" | "emerald";
  dataset: "busbar_anterior" | "busbar_nuevo";
  onComplete: () => void;
  line: LineId;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const ring = color === "blue" ? "ring-blue-600" : "ring-emerald-500";
  const accent = color === "blue" ? "text-blue-400" : "text-emerald-400";
  const badge =
    color === "blue"
      ? "bg-blue-950 text-blue-300 border-blue-800"
      : "bg-emerald-950 text-emerald-300 border-emerald-800";

  async function handle(files: FileList | null) {
    if (!files || files.length === 0) return;
    const csvFiles = Array.from(files).filter((f) => f.name.endsWith(".csv"));
    if (csvFiles.length === 0) {
      setStatus("Solo se aceptan archivos .csv");
      return;
    }
    try {
      setUploading(true);
      setStatus(null);
      const res = await uploadFiles(csvFiles, dataset, line);
      setStatus(`${res.count} mediciones cargadas de ${csvFiles.length} archivo(s)`);
      onComplete();
    } catch {
      setStatus("Error al cargar archivos.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className={`relative rounded-xl border-2 border-dashed p-6 transition-all cursor-pointer select-none
        ${dragOver ? `border-current ${ring} ring-2 bg-slate-800/60` : "border-slate-700 bg-slate-900/60 hover:border-slate-600"}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handle(e.dataTransfer.files); }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        multiple
        className="hidden"
        onChange={(e) => handle(e.target.files)}
      />
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
          ${color === "blue" ? "bg-blue-950" : "bg-emerald-950"}`}>
          <svg className={`w-5 h-5 ${accent}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-slate-200">{label}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded border font-mono ${badge}`}>
              {line.toUpperCase()} · {dataset}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {uploading ? "Cargando..." : "Arrastra archivos CSV o haz clic para seleccionar"}
          </p>
          {status && (
            <p className={`text-xs mt-1 ${status.startsWith("Error") ? "text-red-400" : accent}`}>
              {status}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FileUpload({ onComplete, line }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-3 text-sm text-slate-300 hover:bg-slate-800/40 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span className="font-medium">Cargar Archivos CSV</span>
          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
            Línea {line.toUpperCase()}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800">
          <DropZone
            label="Producción Anterior"
            color="blue"
            dataset="busbar_anterior"
            onComplete={onComplete}
            line={line}
          />
          <DropZone
            label="Producción Nueva"
            color="emerald"
            dataset="busbar_nuevo"
            onComplete={onComplete}
            line={line}
          />
        </div>
      )}
    </div>
  );
}
