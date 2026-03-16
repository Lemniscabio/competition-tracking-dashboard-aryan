'use client';

import type { HeatmapEntry } from '@/lib/types';
import LoadingState from '@/components/shared/LoadingState';

export default function ActivityHeatmap({
  data,
  loading,
}: {
  data: HeatmapEntry[] | null;
  loading: boolean;
}) {
  if (loading) return <LoadingState variant="text" />;

  if (!data || data.length === 0) {
    return (
      <div className="bg-bg-card border border-border rounded-lg p-6 text-center">
        <p className="text-text-muted text-sm">No activity data yet.</p>
        <p className="text-text-dim text-xs mt-1">
          Signals will populate this heatmap.
        </p>
      </div>
    );
  }

  // Build grid: rows = competitors, columns = weeks
  const competitorMap = new Map<string, string>();
  const weekSet = new Set<string>();

  for (const entry of data) {
    competitorMap.set(entry.competitor_id, entry.competitor_name);
    weekSet.add(entry.week);
  }

  const competitors = Array.from(competitorMap.entries());
  const weeks = Array.from(weekSet).sort();

  // Find max count for intensity scaling
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  function getCount(competitorId: string, week: string): number {
    return (
      data?.find(
        (d) => d.competitor_id === competitorId && d.week === week
      )?.count || 0
    );
  }

  function getIntensityClass(count: number): string {
    if (count === 0) return 'bg-bg-elevated';
    const ratio = count / maxCount;
    if (ratio <= 0.25) return 'bg-accent/20';
    if (ratio <= 0.5) return 'bg-accent/40';
    if (ratio <= 0.75) return 'bg-accent/60';
    return 'bg-accent/80';
  }

  return (
    <div className="bg-bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-medium text-text mb-3">
        Competitor Activity
      </h3>
      <div className="overflow-x-auto">
        <div className="min-w-[400px]">
          {/* Week headers */}
          <div className="flex items-center mb-1">
            <div className="w-28 flex-shrink-0" />
            {weeks.map((week) => (
              <div
                key={week}
                className="flex-1 text-center text-[10px] text-text-dim px-0.5"
              >
                {new Date(week).toLocaleDateString('en', {
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            ))}
          </div>
          {/* Rows */}
          {competitors.map(([id, name]) => (
            <div key={id} className="flex items-center mb-1">
              <div className="w-28 flex-shrink-0 text-xs text-text-muted truncate pr-2">
                {name}
              </div>
              {weeks.map((week) => {
                const count = getCount(id, week);
                return (
                  <div key={week} className="flex-1 px-0.5" title={`${name}: ${count} signals (week of ${week})`}>
                    <div
                      className={`h-6 rounded-sm ${getIntensityClass(count)} transition-colors`}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
