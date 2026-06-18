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

function pointsForRound(round: string): number {
  switch (round) {
    case "round_of_32":
    case "round_of_16": return 2;
    case "quarterfinal":
    case "semifinal": return 3;
    case "final": return 4;
    default: return 1;
  }
}

export async function GET(req: NextRequest) {
  // Protect the route with a secret so only Vercel cron can call it
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch finished matches from football-data.org
  const res = await fetch(
    "https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED",
    { headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY! } }
  );
  const json = await res.json();
  const matches = json.matches ?? [];

  let updated = 0;

  for (const match of matches) {
    const homeScore = match.score.fullTime.home;
    const awayScore = match.score.fullTime.away;
    const externalId = String(match.id);
    const round = ROUND_MAP[match.stage] ?? "group";
    const result = getResult(homeScore, awayScore);
    const points = pointsForRound(round);

    // Find match in our DB by external_id or by team names
    const { data: dbMatches } = await supabase
      .from("matches")
      .select("id, status")
      .or(`external_id.eq.${externalId},and(home_team.ilike.%${match.homeTeam.name}%,away_team.ilike.%${match.awayTeam.name}%)`)
      .limit(1);

    const dbMatch = dbMatches?.[0];
    if (!dbMatch || dbMatch.status === "finished") continue;

    // Update match
    await supabase
      .from("matches")
      .update({
        home_score: homeScore,
        away_score: awayScore,
        status: "finished",
        external_id: externalId,
        round,
      })
      .eq("id", dbMatch.id);

    // Score predictions
    await supabase
      .from("predictions")
      .update({ points_earned: points })
      .eq("match_id", dbMatch.id)
      .eq("pick", result);

    // Zero out wrong predictions
    await supabase
      .from("predictions")
      .update({ points_earned: 0 })
      .eq("match_id", dbMatch.id)
      .neq("pick", result)
      .is("points_earned", null);

    updated++;
  }

  return NextResponse.json({ ok: true, updated, matches: matches.map((m: any) => ({
    home: m.homeTeam.name,
    away: m.awayTeam.name,
    status: m.status,
    score: m.score.fullTime,
  }))});
}