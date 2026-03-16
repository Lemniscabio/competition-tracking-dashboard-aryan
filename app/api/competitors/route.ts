import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { generateCompetitorAnalysis } from '@/lib/llm/analysis';
import { scanForSignals } from '@/lib/llm/signals';

export async function GET() {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('competitors')
    .select('*')
    .order('date_added', { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = getServiceClient();
  const body = await request.json();

  // 1. Insert competitor
  const { data: competitor, error } = await supabase
    .from('competitors')
    .insert({
      name: body.name,
      type: body.type,
      one_liner: body.one_liner,
      strategic_context: body.strategic_context,
      additional_context: body.additional_context,
      website_url: body.website_url,
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // 2. Insert tracked sources if provided
  if (body.sources?.length > 0) {
    await supabase.from('competitor_sources').insert(
      body.sources.map((s: any) => ({
        competitor_id: competitor.id,
        url: s.url,
        source_label: s.source_label,
      }))
    );
  }

  // 3. Fetch Lemnisca profile for comparative analysis
  const { data: lemnisca } = await supabase
    .from('lemnisca_profile')
    .select('*')
    .single();

  // 4. Generate deep analysis
  try {
    const { analysis } = await generateCompetitorAnalysis(
      competitor.name,
      competitor.website_url,
      competitor.additional_context,
      lemnisca!
    );

    await supabase.from('competitor_analyses').insert({
      competitor_id: competitor.id,
      analysis_json: analysis,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Analysis generation failed:', err);
  }

  // 5. Run initial signal scan
  try {
    const { data: sources } = await supabase
      .from('competitor_sources')
      .select('*')
      .eq('competitor_id', competitor.id);

    const scannedSignals = await scanForSignals([
      {
        competitor,
        trackedSources: sources || [],
        recentHeadlines: [],
      },
    ]);

    if (scannedSignals.length > 0) {
      const { data: categories } = await supabase
        .from('signal_categories')
        .select('id, name');

      const categoryMap = new Map(
        categories?.map((c) => [c.name, c.id]) || []
      );

      await supabase.from('signals').insert(
        scannedSignals.map((s) => ({
          competitor_id: s.competitor_id,
          headline: s.headline,
          category_id: categoryMap.get(s.category_name) || null,
          date_observed: s.date_observed,
          source_urls: s.source_urls,
          source_type: s.source_type,
          llm_summary: s.llm_summary,
          source: 'automated' as const,
          is_read: false,
        }))
      );
    }
  } catch (err) {
    console.error('Initial scan failed:', err);
  }

  return NextResponse.json(competitor, { status: 201 });
}
