import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { generateCompetitorAnalysis } from '@/lib/llm/analysis';

export async function POST(
  request: Request,
  { params }: { params: { competitor_id: string } }
) {
  const supabase = getServiceClient();
  console.log(`[Analysis] Starting analysis for competitor: ${params.competitor_id}`);

  const { data: competitor } = await supabase
    .from('competitors')
    .select('*')
    .eq('id', params.competitor_id)
    .single();

  if (!competitor) {
    console.log(`[Analysis] Competitor not found: ${params.competitor_id}`);
    return NextResponse.json(
      { error: 'Competitor not found' },
      { status: 404 }
    );
  }

  console.log(`[Analysis] Found competitor: ${competitor.name}`);

  const { data: lemnisca } = await supabase
    .from('lemnisca_profile')
    .select('*')
    .single();

  // Fetch tracked sources for this competitor
  const { data: trackedSources } = await supabase
    .from('competitor_sources')
    .select('url, source_label')
    .eq('competitor_id', params.competitor_id);

  console.log(`[Analysis] Found ${trackedSources?.length || 0} tracked sources`);
  console.log(`[Analysis] Calling Gemini API for "${competitor.name}"...`);
  const startTime = Date.now();

  try {
    const { analysis, sourceUrls } = await generateCompetitorAnalysis(
      competitor.name,
      competitor.website_url,
      competitor.additional_context,
      lemnisca!,
      trackedSources || []
    );

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Analysis] Gemini response received for "${competitor.name}" in ${elapsed}s`);

    // Inject source URLs into analysis_json so they persist with the analysis
    const analysisWithSources = {
      ...analysis,
      source_urls: sourceUrls || [],
    };

    const { data: analysisRow, error } = await supabase
      .from('competitor_analyses')
      .insert({
        competitor_id: params.competitor_id,
        analysis_json: analysisWithSources,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error(`[Analysis] Database insert failed:`, error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[Analysis] Analysis saved successfully for "${competitor.name}"`);
    return NextResponse.json(analysisRow);
  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`[Analysis] Generation failed after ${elapsed}s:`, error);
    return NextResponse.json(
      { error: 'Analysis generation failed', details: String(error) },
      { status: 500 }
    );
  }
}
