import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Pick } from "@/lib/types";

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { data, error } = await supabase
    .from("predictions")
    .select("*, matches(*)")
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { picks } = await req.json() as { picks: Record<string, Pick> };

  const rows = Object.entries(picks).map(([match_id, pick]) => ({
    user_id: user.id,
    match_id,
    pick,
  }));

  const { error } = await supabase
    .from("predictions")
    .upsert(rows, { onConflict: "user_id,match_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, count: rows.length });
}
