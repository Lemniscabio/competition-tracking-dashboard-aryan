import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { generateCompetitorAnalysis } from '@/lib/llm/analysis';

export async function POST(
  request: Request,
  { params }: { params: { competitor_id: string } }
) {
  const supabase = getServiceClient();

  const { data: competitor } = await supabase
    .from('competitors')
    .select('*')
    .eq('id', params.competitor_id)
    .single();

  if (!competitor) {
    return NextResponse.json(
      { error: 'Competitor not found' },
      { status: 404 }
    );
  }

  const { data: lemnisca } = await supabase
    .from('lemnisca_profile')
    .select('*')
    .single();

  try {
    const { analysis } = await generateCompetitorAnalysis(
      competitor.name,
      competitor.website_url,
      competitor.additional_context,
      lemnisca!
    );

    const { data: analysisRow, error } = await supabase
      .from('competitor_analyses')
      .insert({
        competitor_id: params.competitor_id,
        analysis_json: analysis,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(analysisRow);
  } catch (error) {
    console.error('Analysis generation failed:', error);
    return NextResponse.json(
      { error: 'Analysis generation failed', details: String(error) },
      { status: 500 }
    );
  }
}
