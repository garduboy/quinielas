"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import type { LeaderboardEntry } from "@/lib/types";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/leaderboard", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => { setPlayers(Array.isArray(data) ? data : []); setLoading(false); });
  }, [user]);

  if (authLoading || !user) return <p className="text-gray-500 text-sm">Loading…</p>;
  if (loading) return <p className="text-gray-500 text-sm">Loading standings…</p>;

  // Compute ranks accounting for ties (1,2,2,2,5,...)
  const ranks: number[] = [];
  players.forEach((p, i) => {
    if (i === 0) { ranks.push(1); return; }
    ranks.push(players[i - 1].total_points === p.total_points ? ranks[i - 1] : i + 1);
  });

  const myRank = (() => {
    const idx = players.findIndex(p => p.user_id === user.id);
    return idx === -1 ? null : ranks[idx];
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Pool standings</h1>
        <p className="text-sm text-gray-500 mt-1">Updated after each match.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Players", value: players.length },
          { label: "Top score", value: players[0]?.total_points ?? 0 },
          { label: "Your rank", value: myRank ?? "—" },
        ].map((s) => (
          <div key={s.label} className="bg-gray-100 rounded-xl p-3 text-center">
            <p className="text-2xl font-medium text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {players.length === 0 && <p className="text-sm text-gray-500">No predictions submitted yet.</p>}
        {players.map((p, i) => (
          <div key={p.user_id} className={`bg-white rounded-xl border p-3 flex items-center gap-3 ${p.user_id === user.id ? "border-[#1D9E75]" : "border-gray-200"}`}>
            <span className="w-6 text-center text-sm">{ranks[i] <= 3 ? MEDALS[ranks[i] - 1] : ranks[i]}</span>
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium flex items-center justify-center">
              {p.display_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <span className="flex-1 text-sm font-medium text-gray-900">
              {p.display_name} {p.user_id === user.id ? "(you)" : ""}
            </span>
            <span className="text-xs text-gray-400">
              {p.total_picks > 0 ? Math.round((p.correct_picks / p.total_picks) * 100) : 0}%
            </span>
            <span className="text-sm font-medium text-gray-900">{p.total_points} <span className="text-xs text-gray-400">pts</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}
