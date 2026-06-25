const colorMap: Record<string, string> = {
  Fundraising: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Hiring: 'bg-blue-50 text-blue-700 border-blue-200',
  Leadership: 'bg-purple-50 text-purple-700 border-purple-200',
  Partnership: 'bg-amber-50 text-amber-700 border-amber-200',
  Launch: 'bg-rose-50 text-rose-700 border-rose-200',
  'Pilot/Customer': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Plant/Infrastructure': 'bg-orange-50 text-orange-700 border-orange-200',
  Positioning: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Regulatory/IP': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'Media/PR': 'bg-pink-50 text-pink-700 border-pink-200',
  Litigation: 'bg-red-50 text-red-700 border-red-200',
};

const defaultColor = 'bg-slate-50 text-slate-600 border-slate-200';

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
