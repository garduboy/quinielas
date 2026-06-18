"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabase";

interface PredictionWithMatch {
  id: string;
  pick: string;
  points_earned: number | null;
  matches: {
    home_team: string;
    away_team: string;
    home_score: number | null;
    away_score: number | null;
    status: string;
  };
}

export default function ResultsPage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const [predictions, setPredictions] = useState<PredictionWithMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetch("/api/predictions", {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      })
        .then((r) => r.json())
        .then((data) => { setPredictions(Array.isArray(data) ? data : []); setLoading(false); });
    });
  }, [user]);

  if (authLoading || !user) return <p className="text-gray-500 text-sm">Loading…</p>;
  if (loading) return <p className="text-gray-500 text-sm">Loading results…</p>;

  const finished = predictions
  .filter((p) => p.matches.status === "finished")
  .sort((a, b) => new Date(b.matches.kickoff).getTime() - new Date(a.matches.kickoff).getTime());
  const correct = finished.filter((p) => p.points_earned && p.points_earned > 0).length;
  const totalPoints = predictions.reduce((sum, p) => sum + (p.points_earned ?? 0), 0);
  const accuracy = finished.length > 0 ? Math.round((correct / finished.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Your results</h1>
        <p className="text-sm text-gray-500 mt-1">How you've been doing this season.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Points", value: totalPoints },
          { label: "Accuracy", value: accuracy + "%" },
          { label: "Correct", value: `${correct}/${finished.length}` },
        ].map((s) => (
          <div key={s.label} className="bg-gray-100 rounded-xl p-3 text-center">
            <p className="text-2xl font-medium text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Finished matches</p>
        {finished.length === 0 && <p className="text-sm text-gray-500">No finished matches yet.</p>}
        {finished.map((p) => {
          const m = p.matches;
          const isCorrect = p.points_earned && p.points_earned > 0;
          const pickLabel = p.pick === "home" ? m.home_team : p.pick === "away" ? m.away_team : "Draw";
          return (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="grid grid-cols-3 items-center gap-2 mb-3">
                <p className="text-sm font-medium text-center">{m.home_team}</p>
                <p className="text-lg font-semibold text-center text-gray-800">{m.home_score} – {m.away_score}</p>
                <p className="text-sm font-medium text-center">{m.away_team}</p>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Your pick: <span className="text-gray-600 font-medium">{pickLabel}</span></span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-orange-100 text-orange-800"}`}>
                  {isCorrect ? "✓ correct" : "✗ wrong"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
