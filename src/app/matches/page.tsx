"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Match, Pick } from "@/lib/types";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabase";

const PICK_LABELS: Record<Pick, string> = {
  home: "Home win",
  draw: "Draw",
  away: "Away win",
};

const PICK_COLORS: Record<Pick, string> = {
  home: "bg-emerald-100 border-emerald-500 text-emerald-900",
  draw: "bg-blue-100 border-blue-500 text-blue-900",
  away: "bg-orange-100 border-orange-500 text-orange-900",
};

export default function MatchesPage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [picks, setPicks] = useState<Record<string, Pick>>({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
  
    fetch("/api/matches")
      .then((r) => r.json())
      .then((data) => { setMatches(Array.isArray(data) ? data : []); setLoading(false); });
  
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetch("/api/predictions", {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      })
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const existing: Record<string, Pick> = {};
            data.forEach((p: any) => { existing[p.match_id] = p.pick; });
            setPicks(existing);
          }
        });
    });
  }, [user]);

  function select(matchId: string, pick: Pick) {
    setPicks((prev) => ({ ...prev, [matchId]: pick }));
  }

  async function savePredictions() {
    const { data: { session } } = await supabase.auth.getSession();
    console.log("session:", session);
    
    await fetch("/api/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ picks }),
    });
  }

  if (authLoading || !user) return <p className="text-gray-500 text-sm">Loading…</p>;
  if (loading) return <p className="text-gray-500 text-sm">Loading matches…</p>;

  const upcoming = matches.filter((m) => m.status === "upcoming");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">This week's matches</h1>
        <p className="text-sm text-gray-500 mt-1">Pick a winner for each match before kickoff.</p>
      </div>

      <div className="space-y-3">
        {upcoming.length === 0 && (
          <p className="text-sm text-gray-500">No upcoming matches right now.</p>
        )}
        {upcoming.map((match) => (
          <div key={match.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex justify-between text-xs text-gray-400 mb-3">
              <span>{match.league}</span>
              <span>{new Date(match.kickoff).toLocaleString("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <div className="grid grid-cols-3 items-center gap-3 mb-4">
              <p className="font-medium text-center text-sm">{match.home_team}</p>
              <p className="text-xs text-gray-400 text-center">vs</p>
              <p className="font-medium text-center text-sm">{match.away_team}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["home", "draw", "away"] as Pick[]).map((opt) => {
                const active = picks[match.id] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => select(match.id, opt)}
                    className={`py-2 px-1 text-xs font-medium rounded-lg border transition-all ${
                      active ? PICK_COLORS[opt] + " border-2" : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {opt === "home" ? match.home_team : opt === "away" ? match.away_team : "Draw"}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {upcoming.length > 0 && (
        <button
          onClick={savePredictions}
          className="w-full py-3 bg-[#1D9E75] hover:bg-[#0F6E56] text-white font-medium rounded-xl transition-colors"
        >
          {saved ? "✓ Predictions saved!" : `Save ${Object.keys(picks).length}/${upcoming.length} predictions`}
        </button>
      )}
    </div>
  );
}
