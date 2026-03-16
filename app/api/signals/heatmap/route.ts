import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = getServiceClient();

  const eightWeeksAgo = new Date(Date.now() - 56 * 86400000)
    .toISOString()
    .split('T')[0];

  const { data: signals, error } = await supabase
    .from('signals')
    .select('competitor_id, date_observed, competitor:competitors(name)')
    .gte('date_observed', eightWeeksAgo)
    .order('date_observed', { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Aggregate by competitor + week
  const weekMap = new Map<string, number>();
  const nameMap = new Map<string, string>();

  for (const signal of signals || []) {
    const d = new Date(signal.date_observed);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const weekKey = `${signal.competitor_id}:${weekStart.toISOString().split('T')[0]}`;

    weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + 1);

    if (!nameMap.has(signal.competitor_id)) {
      nameMap.set(
        signal.competitor_id,
        (signal.competitor as any)?.name || ''
      );
    }
  }

  const result = Array.from(weekMap.entries()).map(([key, count]) => {
    const [competitor_id, week] = key.split(':');
    return {
      competitor_id,
      competitor_name: nameMap.get(competitor_id) || '',
      week,
      count,
    };
  });

  return NextResponse.json(result);
}
