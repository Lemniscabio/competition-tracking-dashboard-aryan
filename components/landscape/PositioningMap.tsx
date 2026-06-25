'use client';

import type { LandscapeData } from '@/lib/types';

const COMPETITOR_COLORS = [
  '#db2777', // pink
  '#ea580c', // orange
  '#7c3aed', // violet
  '#059669', // emerald
  '#d97706', // amber
  '#dc2626', // red
  '#0284c7', // sky
  '#9333ea', // purple
  '#16a34a', // green
  '#c026d3', // fuchsia
];

export default function PositioningMap({
  data,
  compact = false,
}: {
  data: LandscapeData;
  compact?: boolean;
}) {
  const width = compact ? 300 : 500;
  const height = compact ? 300 : 500;
  const padding = compact ? 40 : 60;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const quadrantLabels = compact
    ? null
    : [
        { x: padding + innerW * 0.75, y: padding + innerH * 0.25, label: 'Leaders' },
        { x: padding + innerW * 0.25, y: padding + innerH * 0.25, label: 'Visionaries' },
        { x: padding + innerW * 0.75, y: padding + innerH * 0.75, label: 'Contenders' },
        { x: padding + innerW * 0.25, y: padding + innerH * 0.75, label: 'Emerging' },
      ];

  // Separate Lemnisca so it renders on top
  const competitors = data.entities.filter((e) => !e.isLemnisca);
  const lemnisca = data.entities.find((e) => e.isLemnisca);
  let colorIndex = 0;

  return (
    <div className="bg-bg-card border border-border rounded-lg p-4">
      {!compact && (
        <h3 className="text-sm font-medium text-text mb-3">
          Competitive Landscape
        </h3>
      )}
      <div className="flex justify-center overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className={compact ? 'w-full max-w-[300px]' : 'w-full max-w-[500px]'}
        >
          {/* Quadrant background fills */}
          <rect
            x={padding + innerW / 2}
            y={padding}
            width={innerW / 2}
            height={innerH / 2}
            fill="#0d9488"
            opacity={0.05}
          />

          {/* Dashed quadrant dividers */}
          <line
            x1={padding}
            y1={padding + innerH / 2}
            x2={padding + innerW}
            y2={padding + innerH / 2}
            stroke="#cbd5e1"
            strokeWidth={1}
            strokeDasharray="6,4"
          />
          <line
            x1={padding + innerW / 2}
            y1={padding}
            x2={padding + innerW / 2}
            y2={padding + innerH}
            stroke="#cbd5e1"
            strokeWidth={1}
            strokeDasharray="6,4"
          />

          {/* Quadrant labels */}
          {quadrantLabels?.map((q, i) => (
            <text
              key={i}
              x={q.x}
              y={q.y}
              textAnchor="middle"
              fill="#64748b"
              fontSize={11}
              fontWeight={500}
            >
              {q.label}
            </text>
          ))}

          {/* Axes */}
          <line
            x1={padding}
            y1={padding + innerH}
            x2={padding + innerW}
            y2={padding + innerH}
            stroke="#94a3b8"
            strokeWidth={1.5}
          />
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={padding + innerH}
            stroke="#94a3b8"
            strokeWidth={1.5}
          />

          {/* Axis labels */}
          <text
            x={padding + innerW / 2}
            y={height - (compact ? 2 : 5)}
            textAnchor="middle"
            fill="#64748b"
            fontSize={compact ? 9 : 11}
            fontWeight={500}
          >
            {data.axes.x}
          </text>
          <text
            x={compact ? 8 : 12}
            y={padding + innerH / 2}
            textAnchor="middle"
            fill="#64748b"
            fontSize={compact ? 9 : 11}
            fontWeight={500}
            transform={`rotate(-90, ${compact ? 8 : 12}, ${padding + innerH / 2})`}
          >
            {data.axes.y}
          </text>

          {/* Competitor entities */}
          {competitors.map((entity, i) => {
            const cx = padding + (entity.x / 100) * innerW;
            const cy = padding + innerH - (entity.y / 100) * innerH;
            const r = compact ? 5 : 8;
            const color = COMPETITOR_COLORS[colorIndex++ % COMPETITOR_COLORS.length];

            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r={r + 4} fill={color} opacity={0.12} />
                <circle cx={cx} cy={cy} r={r} fill={color} opacity={0.85} stroke={color} strokeWidth={1.5} strokeOpacity={0.4} />
                <text
                  x={cx}
                  y={cy - r - 5}
                  textAnchor="middle"
                  fill="#1e293b"
                  fontSize={compact ? 8 : 10}
                  fontWeight={500}
                >
                  {entity.name}
                </text>
              </g>
            );
          })}

          {/* Lemnisca — rendered last so it's on top */}
          {lemnisca && (() => {
            const cx = padding + (lemnisca.x / 100) * innerW;
            const cy = padding + innerH - (lemnisca.y / 100) * innerH;
            const r = compact ? 7 : 10;

            return (
              <g>
                {/* Glow ring */}
                <circle cx={cx} cy={cy} r={r + 8} fill="#0d9488" opacity={0.08} />
                <circle cx={cx} cy={cy} r={r + 4} fill="#0d9488" opacity={0.15} />
                {/* Main dot */}
                <circle cx={cx} cy={cy} r={r} fill="#0d9488" stroke="#0d9488" strokeWidth={2} strokeOpacity={0.5} />
                {/* Inner highlight */}
                <circle cx={cx - r * 0.25} cy={cy - r * 0.25} r={r * 0.3} fill="white" opacity={0.25} />
                {/* Label */}
                <text
                  x={cx}
                  y={cy - r - 6}
                  textAnchor="middle"
                  fill="#0d9488"
                  fontSize={compact ? 9 : 11}
                  fontWeight={700}
                >
                  Lemnisca
                </text>
              </g>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}
