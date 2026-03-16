import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; sourceId: string } }
) {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from('competitor_sources')
    .delete()
    .eq('id', params.sourceId)
    .eq('competitor_id', params.id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
