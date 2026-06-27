import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { "Cache-Control": "no-cache" } } }
  );

  const { data, error } = await supabase.rpc('get_leaderboard');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}