import type { Pick } from "./types";

export function getResult(homeScore: number, awayScore: number): Pick {
  if (homeScore > awayScore) return "home";
  if (awayScore > homeScore) return "away";
  return "draw";
}

export function calcPoints(pick: Pick, homeScore: number, awayScore: number): number {
  return pick === getResult(homeScore, awayScore) ? 3 : 0;
}
