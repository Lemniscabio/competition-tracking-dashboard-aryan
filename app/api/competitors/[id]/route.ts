import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = getServiceClient();

  const { data: competitor, error } = await supabase
    .from('competitors')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !competitor) {
    return NextResponse.json(
      { error: 'Competitor not found' },
      { status: 404 }
    );
  }

  // Get latest analysis
  const { data: analysis } = await supabase
    .from('competitor_analyses')
    .select('*')
    .eq('competitor_id', params.id)
    .order('generated_at', { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json({ ...competitor, analysis });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = getServiceClient();

  const { error } = await supabase
    .from('competitors')
    .delete()
    .eq('id', params.id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
