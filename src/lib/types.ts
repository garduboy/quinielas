export type Pick = "home" | "draw" | "away";

export interface Match {
  id: string;
  round: string;
  home_team: string;
  away_team: string;
  league: string;
  kickoff: string;
  home_score: number | null;
  away_score: number | null;
  status: "upcoming" | "live" | "finished";
}

export interface Prediction {
  id: string;
  user_id: string;
  match_id: string;
  pick: Pick;
  points_earned: number | null;
}

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  total_points: number;
  correct_picks: number;
  total_picks: number;
}
