import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { generateLandscapeData } from '@/lib/llm/landscape';

export async function POST(request: Request) {
  const supabase = getServiceClient();
  const body = await request.json().catch(() => ({}));
  const customAxes = body.customAxes as string | undefined;

  const { data: competitors } = await supabase
    .from('competitors')
    .select('*');

  if (!competitors?.length) {
    return NextResponse.json(
      { error: 'No competitors to plot' },
      { status: 400 }
    );
  }

  // Get latest analysis for each competitor
  const analyses = await Promise.all(
    competitors.map(async (c) => {
      const { data } = await supabase
        .from('competitor_analyses')
        .select('*')
        .eq('competitor_id', c.id)
        .order('generated_at', { ascending: false })
        .limit(1)
        .single();
      return data;
    })
  );

  const { data: lemnisca } = await supabase
    .from('lemnisca_profile')
    .select('*')
    .single();

  try {
    const landscape = await generateLandscapeData(
      competitors,
      analyses.filter(Boolean) as any[],
      lemnisca!,
      customAxes
    );
    return NextResponse.json(landscape);
  } catch (error) {
    console.error('Landscape generation failed:', error);
    return NextResponse.json(
      { error: 'Landscape generation failed', details: String(error) },
      { status: 500 }
    );
  }
}
