import type { Athlete, Fundraiser } from "./types";

export function impliedGoalPerAthleteFromFundraiser(
  f: Pick<Fundraiser, "goal_per_athlete" | "expected_participants" | "total_goal">
): number | null {
  const gpa =
    f.goal_per_athlete != null ? Number(f.goal_per_athlete) : NaN;
  if (Number.isFinite(gpa) && gpa > 0) return gpa;
  const exp = f.expected_participants;
  const total = Number(f.total_goal);
  if (exp != null && exp > 0 && Number.isFinite(total) && total > 0) {
    return total / exp;
  }
  return null;
}

/** Personal goal for donor-page progress: athlete override, else campaign default. */
export function effectiveAthleteGoalForDonorPage(
  athlete: Pick<Athlete, "personal_goal">,
  fundraiser: Pick<
    Fundraiser,
    "goal_per_athlete" | "expected_participants" | "total_goal"
  >
): number | null {
  const pg =
    athlete.personal_goal != null ? Number(athlete.personal_goal) : NaN;
  if (Number.isFinite(pg) && pg > 0) return pg;
  return impliedGoalPerAthleteFromFundraiser(fundraiser);
}
