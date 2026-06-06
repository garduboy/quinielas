import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .order("kickoff", { ascending: true });

  if (error) {
    console.error("Failed to fetch matches:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
