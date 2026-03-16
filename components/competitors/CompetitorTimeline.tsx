'use client';

import SignalFeed from '@/components/signals/SignalFeed';

export default function CompetitorTimeline({
  competitorId,
}: {
  competitorId: string;
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-text mb-3">Signal Timeline</h3>
      <SignalFeed competitorId={competitorId} />
    </div>
  );
}
