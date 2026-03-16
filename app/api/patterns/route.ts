import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { generatePatternSummary } from '@/lib/llm/patterns';

export async function GET() {
  const supabase = getServiceClient();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)
    .toISOString()
    .split('T')[0];

  const { data: signals, error } = await supabase
    .from('signals')
    .select(
      '*, competitor:competitors(name), category:signal_categories(name)'
    )
    .gte('date_observed', thirtyDaysAgo)
    .order('date_observed', { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const enriched = (signals || []).map((s) => ({
    ...s,
    competitor_name: (s.competitor as any)?.name || 'Unknown',
    category_name: (s.category as any)?.name || 'Uncategorized',
  }));

  try {
    const summary = await generatePatternSummary(enriched);
    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Pattern generation failed:', error);
    return NextResponse.json(
      { summary: 'Unable to generate pattern summary at this time.' },
      { status: 200 }
    );
  }
}
