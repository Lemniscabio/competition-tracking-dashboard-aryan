const colorMap: Record<string, string> = {
  Fundraising: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  Hiring: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  Leadership: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  Partnership: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  Launch: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
  'Pilot/Customer': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  'Plant/Infrastructure': 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  Positioning: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
  'Regulatory/IP': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  'Media/PR': 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  Litigation: 'bg-red-500/15 text-red-400 border-red-500/20',
};

const defaultColor = 'bg-slate-500/15 text-slate-400 border-slate-500/20';

export default function CategoryTag({
  name,
  size = 'sm',
}: {
  name: string;
  size?: 'sm' | 'md';
}) {
  const colors = colorMap[name] || defaultColor;
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium ${colors} ${sizeClasses}`}
    >
      {name}
    </span>
  );
}
