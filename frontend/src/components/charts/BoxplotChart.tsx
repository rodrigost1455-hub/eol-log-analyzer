"use client";

import type { DatasetAnalysis, TestStats, Stats } from "@/types";

interface Props {
  anterior: DatasetAnalysis;
  nuevo: DatasetAnalysis;
  selectedTest: string;
}

interface BoxData {
  label: string;
  color: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  mean: number;
}

function getBox(stats: TestStats | Stats | null, label: string, color: string): BoxData | null {
  if (!stats || stats.count === 0) return null;
  return { label, color, min: stats.min, q1: stats.q1, median: stats.median, q3: stats.q3, max: stats.max, mean: stats.mean };
}

function SvgBox({
  box,
  x,
  boxWidth,
  scaleY,
}: {
  box: BoxData;
  x: number;
  boxWidth: number;
  scaleY: (v: number) => number;
}) {
  const cx = x + boxWidth / 2;
  const half = boxWidth * 0.4;
  const capHalf = boxWidth * 0.2;

  const yMax = scaleY(box.max);
  const yQ3 = scaleY(box.q3);
  const yMed = scaleY(box.median);
  const yQ1 = scaleY(box.q1);
  const yMin = scaleY(box.min);
  const yMean = scaleY(box.mean);

  return (
    <g>
      {/* Upper whisker */}
      <line x1={cx} y1={yQ3} x2={cx} y2={yMax} stroke={box.color} strokeWidth={1.5} />
      <line x1={cx - capHalf} y1={yMax} x2={cx + capHalf} y2={yMax} stroke={box.color} strokeWidth={1.5} />

      {/* Box Q1-Q3 */}
      <rect
        x={cx - half}
        y={yQ3}
        width={half * 2}
        height={Math.abs(yQ1 - yQ3)}
        fill={box.color}
        fillOpacity={0.25}
        stroke={box.color}
        strokeWidth={1.5}
        rx={2}
      />

      {/* Median line */}
      <line x1={cx - half} y1={yMed} x2={cx + half} y2={yMed} stroke="white" strokeWidth={2} />

      {/* Mean dot */}
      <circle cx={cx} cy={yMean} r={3} fill={box.color} />

      {/* Lower whisker */}
      <line x1={cx} y1={yQ1} x2={cx} y2={yMin} stroke={box.color} strokeWidth={1.5} />
      <line x1={cx - capHalf} y1={yMin} x2={cx + capHalf} y2={yMin} stroke={box.color} strokeWidth={1.5} />

      {/* Label */}
      <text x={cx} y={yMin + 18} textAnchor="middle" fill={box.color} fontSize={10} fontWeight={600}>
        {box.label}
      </text>
    </g>
  );
}

export default function BoxplotChart({ anterior, nuevo, selectedTest }: Props) {
  const getStats = (analysis: DatasetAnalysis): TestStats | Stats | null => {
    if (selectedTest === "all") return analysis.overall_stats;
    return analysis.test_stats.find((t) => t.test_name === selectedTest) ?? null;
  };

  const antStats = getStats(anterior);
  const nueStats = getStats(nuevo);

  const antBox = getBox(antStats, "Ant.", "#3b82f6");
  const nueBox = getBox(nueStats, "Nue.", "#10b981");
  const boxes = [antBox, nueBox].filter(Boolean) as BoxData[];

  if (!boxes.length) {
    return <div className="flex items-center justify-center h-64 text-slate-600 text-sm">Sin datos</div>;
  }

  const allVals = boxes.flatMap((b) => [b.min, b.max]);
  const yMin = Math.min(...allVals);
  const yMax = Math.max(...allVals);
  const yPad = (yMax - yMin) * 0.1 || 0.01;

  const svgW = 340;
  const svgH = 240;
  const marginTop = 20;
  const marginBottom = 40;
  const marginLeft = 64;
  const marginRight = 16;
  const plotH = svgH - marginTop - marginBottom;
  const plotW = svgW - marginLeft - marginRight;

  const scaleY = (v: number) =>
    marginTop + plotH - ((v - (yMin - yPad)) / (yMax + yPad - (yMin - yPad))) * plotH;

  const boxWidth = Math.min(plotW / (boxes.length + 1), 60);
  const gap = plotW / (boxes.length + 1);

  // Y axis ticks
  const tickCount = 5;
  const ticks = Array.from({ length: tickCount }, (_, i) =>
    yMin - yPad + (i / (tickCount - 1)) * (yMax + yPad - (yMin - yPad))
  );

  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ maxHeight: 280 }}>
      {/* Y axis */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line
            x1={marginLeft}
            y1={scaleY(t)}
            x2={svgW - marginRight}
            y2={scaleY(t)}
            stroke="#1e293b"
            strokeWidth={1}
          />
          <text x={marginLeft - 4} y={scaleY(t) + 4} textAnchor="end" fill="#64748b" fontSize={10}>
            {t.toFixed(3)}
          </text>
        </g>
      ))}

      {/* Axis lines */}
      <line x1={marginLeft} y1={marginTop} x2={marginLeft} y2={svgH - marginBottom} stroke="#334155" strokeWidth={1} />
      <line x1={marginLeft} y1={svgH - marginBottom} x2={svgW - marginRight} y2={svgH - marginBottom} stroke="#334155" strokeWidth={1} />

      {/* Y label */}
      <text
        x={12}
        y={svgH / 2}
        textAnchor="middle"
        fill="#64748b"
        fontSize={10}
        transform={`rotate(-90, 12, ${svgH / 2})`}
      >
        Voltaje (V)
      </text>

      {/* Boxes */}
      {boxes.map((box, i) => (
        <SvgBox
          key={box.label}
          box={box}
          x={marginLeft + gap * (i + 1) - boxWidth / 2}
          boxWidth={boxWidth}
          scaleY={scaleY}
        />
      ))}

      {/* Legend */}
      <g transform={`translate(${marginLeft}, ${svgH - 12})`}>
        <rect x={0} y={-6} width={10} height={10} fill="#3b82f6" fillOpacity={0.7} rx={1} />
        <text x={14} y={4} fill="#94a3b8" fontSize={10}>Busbar Anterior</text>
        <rect x={110} y={-6} width={10} height={10} fill="#10b981" fillOpacity={0.7} rx={1} />
        <text x={124} y={4} fill="#94a3b8" fontSize={10}>Busbar Nuevo</text>
        <circle cx={230} cy={0} r={3} fill="#64748b" />
        <text x={238} y={4} fill="#94a3b8" fontSize={10}>Media</text>
        <line x1={268} y1={0} x2={278} y2={0} stroke="white" strokeWidth={2} />
        <text x={282} y={4} fill="#94a3b8" fontSize={10}>Mediana</text>
      </g>
    </svg>
  );
}
