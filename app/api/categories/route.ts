import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('signal_categories')
    .select('*')
    .order('name');

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = getServiceClient();
  const { name } = await request.json();

  const { data, error } = await supabase
    .from('signal_categories')
    .insert({ name, is_default: false })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
