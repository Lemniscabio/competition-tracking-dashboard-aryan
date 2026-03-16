export default function LoadingState({
  variant = 'card',
}: {
  variant?: 'card' | 'text' | 'full';
}) {
  if (variant === 'text') {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-4 bg-bg-elevated rounded w-3/4" />
        <div className="h-4 bg-bg-elevated rounded w-1/2" />
        <div className="h-4 bg-bg-elevated rounded w-5/6" />
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-text-muted text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // card variant
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-bg-card border border-border rounded-lg p-4 animate-pulse"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-3 bg-bg-elevated rounded w-20" />
            <div className="h-3 bg-bg-elevated rounded w-16" />
          </div>
          <div className="h-4 bg-bg-elevated rounded w-3/4 mb-2" />
          <div className="h-3 bg-bg-elevated rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
