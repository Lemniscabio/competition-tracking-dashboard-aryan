import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { generateLandscapeData } from '@/lib/llm/landscape';

// In-memory cache for default landscape (reset on redeploy)
let cachedLandscape: { fingerprint: string; data: any } | null = null;

function buildFingerprint(competitorIds: string[], analysisTimestamps: string[]): string {
  return [...competitorIds.sort(), ...analysisTimestamps.sort()].join('|');
}

export async function POST(request: Request) {
  const supabase = getServiceClient();
  const body = await request.json().catch(() => ({}));
  const customAxes = body.customAxes as string | undefined;
  const forceRefresh = body.forceRefresh === true;

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

  // For default axes, check cache — skip LLM if nothing changed
  if (!customAxes && !forceRefresh) {
    const fingerprint = buildFingerprint(
      competitors.map((c) => c.id),
      analyses.filter(Boolean).map((a: any) => a.generated_at)
    );

    if (cachedLandscape && cachedLandscape.fingerprint === fingerprint) {
      return NextResponse.json(cachedLandscape.data);
    }
  }

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

    // Cache default axes result
    if (!customAxes) {
      const fingerprint = buildFingerprint(
        competitors.map((c) => c.id),
        analyses.filter(Boolean).map((a: any) => a.generated_at)
      );
      cachedLandscape = { fingerprint, data: landscape };
    }

    return NextResponse.json(landscape);
  } catch (error) {
    console.error('Landscape generation failed:', error);
    return NextResponse.json(
      { error: 'Landscape generation failed', details: String(error) },
      { status: 500 }
    );
  }
}
