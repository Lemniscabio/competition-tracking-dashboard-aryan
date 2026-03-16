import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = getServiceClient();
  const body = await request.json();

  const allowedFields: Record<string, any> = {};
  if ('is_flagged' in body) allowedFields.is_flagged = body.is_flagged;
  if ('is_read' in body) allowedFields.is_read = body.is_read;
  if ('feedback' in body) allowedFields.feedback = body.feedback;
  if ('strategic_note' in body)
    allowedFields.strategic_note = body.strategic_note;

  allowedFields.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('signals')
    .update(allowedFields)
    .eq('id', params.id)
    .select(
      '*, competitor:competitors(id, name, type), category:signal_categories(id, name)'
    )
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
