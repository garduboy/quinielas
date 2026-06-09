"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabase";

interface RevealRow {
  match_id: string;
  home_team: string;
  away_team: string;
  league: string;
  kickoff: string;
  user_id: string;
  display_name: string;
  pick: string;
}

interface MatchGroup {
  match_id: string;
  home_team: string;
  away_team: string;
  league: string;
  kickoff: string;
  picks: { user_id: string; display_name: string; pick: string }[];
}

const PICK_COLORS: Record<string, string> = {
  home: "bg-emerald-100 text-emerald-800 border-emerald-300",
  draw: "bg-blue-100 text-blue-800 border-blue-300",
  away: "bg-orange-100 text-orange-800 border-orange-300",
};

export default function RevealPage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const [matches, setMatches] = useState<MatchGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetch("/api/picks-reveal", {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      })
        .then((r) => r.json())
        .then((data: RevealRow[]) => {
          if (!Array.isArray(data)) { setLoading(false); return; }

          // Group by match
          const grouped: Record<string, MatchGroup> = {};
          data.forEach((row) => {
            if (!grouped[row.match_id]) {
              grouped[row.match_id] = {
                match_id: row.match_id,
                home_team: row.home_team,
                away_team: row.away_team,
                league: row.league,
                kickoff: row.kickoff,
                picks: [],
              };
            }
            grouped[row.match_id].picks.push({
              user_id: row.user_id,
              display_name: row.display_name,
              pick: row.pick,
            });
          });

          setMatches(Object.values(grouped));
          setLoading(false);
        });
    });
  }, [user]);

  if (authLoading || !user) return <p className="text-gray-500 text-sm">Loading…</p>;
  if (loading) return <p className="text-gray-500 text-sm">Loading picks…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Everyone's picks</h1>
        <p className="text-sm text-gray-500 mt-1">Visible once the 24hr cutoff has passed.</p>
      </div>

      {matches.length === 0 && (
        <p className="text-sm text-gray-500">No matches in the reveal window right now.</p>
      )}

      {matches.map((m) => (
        <div key={m.match_id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">{m.league}</span>
            <span className="text-xs text-gray-400">
              {new Date(m.kickoff).toLocaleString("en-GB", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <p className="text-sm font-semibold text-center text-gray-900">
            {m.home_team} <span className="text-gray-400 font-normal">vs</span> {m.away_team}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {m.picks.map((p) => (
              <div key={p.user_id} className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium ${PICK_COLORS[p.pick]}`}>
                <span>{p.display_name}</span>
                <span>{p.pick === "home" ? m.home_team : p.pick === "away" ? m.away_team : "Draw"}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}