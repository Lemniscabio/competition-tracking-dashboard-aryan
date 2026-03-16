import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { checkDuplicateSignal } from '@/lib/llm/duplicate';

export async function POST(request: Request) {
  const { headline, competitor_id } = await request.json();
  const supabase = getServiceClient();

  const { data: existing } = await supabase
    .from('signals')
    .select('*')
    .eq('competitor_id', competitor_id)
    .order('date_observed', { ascending: false })
    .limit(50);

  const result = await checkDuplicateSignal(headline, existing || []);
  return NextResponse.json(result);
}
