import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = getServiceClient();
  const { searchParams } = new URL(request.url);

  let query = supabase
    .from('signals')
    .select(
      '*, competitor:competitors(id, name, type), category:signal_categories(id, name)'
    )
    .order('date_observed', { ascending: false })
    .order('created_at', { ascending: false });

  const competitorId = searchParams.get('competitor_id');
  const categoryId = searchParams.get('category_id');
  const isRead = searchParams.get('is_read');
  const isFlagged = searchParams.get('is_flagged');
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');
  const limit = searchParams.get('limit');

  if (competitorId) query = query.eq('competitor_id', competitorId);
  if (categoryId) query = query.eq('category_id', categoryId);
  if (isRead !== null && isRead !== undefined && isRead !== '')
    query = query.eq('is_read', isRead === 'true');
  if (isFlagged === 'true') query = query.eq('is_flagged', true);
  if (dateFrom) query = query.gte('date_observed', dateFrom);
  if (dateTo) query = query.lte('date_observed', dateTo);
  if (limit) query = query.limit(parseInt(limit));

  const { data, error } = await query;

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = getServiceClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from('signals')
    .insert({
      competitor_id: body.competitor_id,
      headline: body.headline,
      category_id: body.category_id,
      date_observed:
        body.date_observed || new Date().toISOString().split('T')[0],
      source_urls: body.source_urls || [],
      source_type: body.source_type,
      llm_summary: body.llm_summary || null,
      strategic_note: body.strategic_note || null,
      source: 'manual',
      is_read: true,
    })
    .select(
      '*, competitor:competitors(id, name, type), category:signal_categories(id, name)'
    )
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
