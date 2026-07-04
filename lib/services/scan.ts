import { getServiceClient } from '@/lib/supabase/server';
import { scanForSignals } from '@/lib/llm/signals';
import { startScan, progressScan, finishScan } from '@/lib/services/scan-state';

export async function runCompetitorScan(): Promise<{ newSignals: number }> {
  const supabase = getServiceClient();
  console.log('[Scan] Starting competitor scan...');

  const { data: competitors } = await supabase
    .from('competitors')
    .select('*');
  if (!competitors?.length) {
    finishScan();
    return { newSignals: 0 };
  }

  console.log(`[Scan] Found ${competitors.length} competitors to scan`);
  startScan(competitors.length);

  const { data: categories } = await supabase
    .from('signal_categories')
    .select('id, name');
  const categoryMap = new Map(
    categories?.map((c) => [c.name, c.id]) || []
  );

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)
    .toISOString()
    .split('T')[0];

  let totalNew = 0;

  try {
    // Scan and save one competitor at a time so partial progress survives a
    // timeout/disconnect and signals appear in the feed incrementally.
    for (let i = 0; i < competitors.length; i++) {
      const competitor = competitors[i];

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

      let scanned: Awaited<ReturnType<typeof scanForSignals>> = [];
      try {
        scanned = await scanForSignals([
          {
            competitor,
            trackedSources: sources || [],
            recentHeadlines: recentSignals?.map((s) => s.headline) || [],
          },
        ]);
      } catch (err) {
        console.error(`[Scan] ${competitor.name} failed:`, err);
      }

      if (scanned.length > 0) {
        const { error: insertError } = await supabase.from('signals').insert(
          scanned.map((s) => ({
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
        if (insertError) {
          console.error(`[Scan] insert failed for ${competitor.name}:`, insertError.message);
        } else {
          totalNew += scanned.length;
          console.log(`[Scan] Saved ${scanned.length} signals for ${competitor.name}`);
        }
      }

      progressScan(scanned.length);

      // Brief pause between competitors to ease rate limits.
      if (i < competitors.length - 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    console.log(`[Scan] Scan complete: ${totalNew} new signals`);
    finishScan();
    return { newSignals: totalNew };
  } catch (error) {
    console.error('[Scan] Scan aborted:', error);
    finishScan(String(error));
    return { newSignals: totalNew };
  }
}
