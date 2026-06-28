import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const ROUND_MAP: Record<string, string> = {
  "GROUP_STAGE": "group",
  "ROUND_OF_32": "round_of_32",
  "ROUND_OF_16": "round_of_16",
  "QUARTER_FINALS": "quarterfinal",
  "SEMI_FINALS": "semifinal",
  "FINAL": "final",
};

function getResult(homeScore: number, awayScore: number): string {
  if (homeScore > awayScore) return "home";
  if (awayScore > homeScore) return "away";
  return "draw";
}

export async function GET(req: NextRequest) {
  console.log("sync route called");

  const secret = req.nextUrl.searchParams.get("secret");
  console.log("secret check:", secret === process.env.CRON_SECRET ? "ok" : "fail");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("url:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("service key exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: test, error: testError } = await supabase
    .from("matches")
    .select("id, home_team, away_team")
    .limit(3);
  console.log("test query result:", JSON.stringify(test));
  console.log("test query error:", JSON.stringify(testError));

  console.log("fetching from football-data.org");
  const res = await fetch(
    "https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED",
    { 
      headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY! },
      cache: 'no-store'
    }
  );
  console.log("football-data response status:", res.status);
  const json = await res.json();
  console.log("total finished matches from API:", json.matches?.length);
  const matches = json.matches ?? [];

  let updated = 0;

  for (const match of matches) {
    const homeScore = match.score.fullTime.home;
    const awayScore = match.score.fullTime.away;
    const externalId = String(match.id);
    const round = ROUND_MAP[match.stage] ?? "group";
    console.log(`match: ${match.homeTeam.name} vs ${match.awayTeam.name}, stage: ${match.stage}, round: ${round}`);
    const result = getResult(homeScore, awayScore);

    console.log(`looking up: "${match.homeTeam.name}" vs "${match.awayTeam.name}"`);

    const { data: dbMatches, error: lookupError } = await supabase
      .from("matches")
      .select("id, status, home_team, away_team")
      .eq("home_team", match.homeTeam.name)
      .eq("away_team", match.awayTeam.name);

    console.log(`found: ${JSON.stringify(dbMatches)} error: ${JSON.stringify(lookupError)}`);

    const dbMatch = dbMatches?.[0];
    if (!dbMatch) { console.log("no match found, skipping"); continue; }
    if (dbMatch.status === "finished") { console.log("already finished, skipping"); continue; }

    console.log(`updating match ${dbMatch.id} with score ${homeScore}-${awayScore}`);
    const { error: updateError } = await supabase
      .from("matches")
      .update({ home_score: homeScore, away_score: awayScore, status: "finished", external_id: externalId })
      .eq("id", dbMatch.id);
    console.log("update error:", JSON.stringify(updateError));

    console.log(`scoring predictions for match ${dbMatch.id}, result: ${result}`);
    const { error: scoreError } = await supabase.rpc('score_predictions', {
      p_match_id: dbMatch.id,
      p_result: result,
    });
    console.log("score error:", JSON.stringify(scoreError));

    updated++;
  }

  console.log("sync complete, updated:", updated);
  return NextResponse.json({ ok: true, updated, matches: matches.map((m: any) => ({
    home: m.homeTeam.name,
    away: m.awayTeam.name,
    status: m.status,
    score: m.score.fullTime,
  }))});
}