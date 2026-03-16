import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('lemnisca_profile')
    .select('*')
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const supabase = getServiceClient();
  const body = await request.json();

  const { data: existing } = await supabase
    .from('lemnisca_profile')
    .select('id')
    .single();

  if (!existing)
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const { data, error } = await supabase
    .from('lemnisca_profile')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', existing.id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
