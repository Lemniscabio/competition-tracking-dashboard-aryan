'use client';

import type { LandscapeData } from '@/lib/types';

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
          {/* Grid lines */}
          <line
            x1={padding}
            y1={padding + innerH / 2}
            x2={padding + innerW}
            y2={padding + innerH / 2}
            stroke="#1a1a2e"
            strokeWidth={1}
            strokeDasharray="4,4"
          />
          <line
            x1={padding + innerW / 2}
            y1={padding}
            x2={padding + innerW / 2}
            y2={padding + innerH}
            stroke="#1a1a2e"
            strokeWidth={1}
            strokeDasharray="4,4"
          />

          {/* Axes */}
          <line
            x1={padding}
            y1={padding + innerH}
            x2={padding + innerW}
            y2={padding + innerH}
            stroke="#252540"
            strokeWidth={1}
          />
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={padding + innerH}
            stroke="#252540"
            strokeWidth={1}
          />

          {/* Axis labels */}
          <text
            x={padding + innerW / 2}
            y={height - 5}
            textAnchor="middle"
            className="fill-text-dim"
            fontSize={compact ? 9 : 11}
          >
            {data.axes.x}
          </text>
          <text
            x={12}
            y={padding + innerH / 2}
            textAnchor="middle"
            className="fill-text-dim"
            fontSize={compact ? 9 : 11}
            transform={`rotate(-90, 12, ${padding + innerH / 2})`}
          >
            {data.axes.y}
          </text>

          {/* Entities */}
          {data.entities.map((entity, i) => {
            const cx = padding + (entity.x / 100) * innerW;
            const cy = padding + innerH - (entity.y / 100) * innerH;
            const r = compact ? 5 : 7;

            return (
              <g key={i}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  className={
                    entity.isLemnisca
                      ? 'fill-accent stroke-accent/40'
                      : 'fill-text-dim stroke-border-light'
                  }
                  strokeWidth={2}
                />
                <text
                  x={cx}
                  y={cy - r - 4}
                  textAnchor="middle"
                  className={
                    entity.isLemnisca ? 'fill-accent' : 'fill-text-muted'
                  }
                  fontSize={compact ? 8 : 10}
                  fontWeight={entity.isLemnisca ? 600 : 400}
                >
                  {entity.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
