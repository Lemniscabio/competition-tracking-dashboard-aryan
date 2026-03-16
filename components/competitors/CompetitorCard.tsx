import Link from 'next/link';
import type { Competitor } from '@/lib/types';

export default function CompetitorCard({
  competitor,
}: {
  competitor: Competitor;
}) {
  return (
    <Link href={`/dashboard/competitors/${competitor.id}`}>
      <div className="bg-bg-card border border-border rounded-lg p-4 hover:border-border-light transition-colors cursor-pointer group">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-text group-hover:text-accent transition-colors">
            {competitor.name}
          </h3>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              competitor.type === 'direct'
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
            }`}
          >
            {competitor.type}
          </span>
        </div>
        {competitor.one_liner && (
          <p className="text-sm text-text-muted line-clamp-2 mb-3">
            {competitor.one_liner}
          </p>
        )}
        <div className="text-xs text-text-dim">
          Added{' '}
          {new Date(competitor.date_added).toLocaleDateString('en', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </div>
      </div>
    </Link>
  );
}
