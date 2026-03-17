import { getServiceClient } from '@/lib/supabase/server';
import { scanForSignals } from '@/lib/llm/signals';

export async function runCompetitorScan(): Promise<{ newSignals: number }> {
  const supabase = getServiceClient();
  console.log('[Scan] Starting competitor scan...');

  const { data: competitors } = await supabase
    .from('competitors')
    .select('*');
  if (!competitors?.length) return { newSignals: 0 };

  console.log(`[Scan] Found ${competitors.length} competitors to scan`);

  const { data: categories } = await supabase
    .from('signal_categories')
    .select('id, name');
  const categoryMap = new Map(
    categories?.map((c) => [c.name, c.id]) || []
  );

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)
    .toISOString()
    .split('T')[0];

  // Build scan inputs with recent headlines for dedup
  const inputs = await Promise.all(
    competitors.map(async (competitor) => {
      const { data: sources } = await supabase
        .from('competitor_sources')
        .select('*')
        .eq('competitor_id', competitor.id);

      const { data: recentSignals } = await supabase
        .from('signals')
        .select('headline')
        .eq('competitor_id', competitor.id)
        .gte('date_observed', thirtyDaysAgo)
        .limit(50);

      return {
        competitor,
        trackedSources: sources || [],
        recentHeadlines: recentSignals?.map((s) => s.headline) || [],
      };
    })
  );

  console.log(`[Scan] Calling Gemini for signal scanning...`);
  const startTime = Date.now();

  const scannedSignals = await scanForSignals(inputs);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[Scan] Gemini returned ${scannedSignals.length} signals in ${elapsed}s`);

  if (scannedSignals.length > 0) {
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
    console.log(`[Scan] Inserted ${scannedSignals.length} signals into database`);
  }

  console.log(`[Scan] Scan complete: ${scannedSignals.length} new signals`);
  return { newSignals: scannedSignals.length };
}
