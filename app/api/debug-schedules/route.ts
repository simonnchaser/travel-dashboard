import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  }

  const { data: schedules, error } = await supabase
    .from('schedules')
    .select('id, title, category, google_maps_url, departure_google_maps_url, arrival_google_maps_url')
    .eq('project_id', projectId)
    .order('date', { ascending: true })
    .order('time', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ schedules }, { status: 200 });
}
