import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('competitor_sources')
    .select('*')
    .eq('competitor_id', params.id)
    .order('created_at');

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = getServiceClient();
  const { url, source_label } = await request.json();

  const { data, error } = await supabase
    .from('competitor_sources')
    .insert({ competitor_id: params.id, url, source_label })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
