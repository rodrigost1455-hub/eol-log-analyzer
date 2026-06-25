interface Props {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}

export default function KPICard({ label, value, sub, accent = "text-slate-100" }: Props) {
  return (
    <div className="rounded-lg bg-slate-900 border border-slate-800 px-4 py-3">
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${accent}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}
