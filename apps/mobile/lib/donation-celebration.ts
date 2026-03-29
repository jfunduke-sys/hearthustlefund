import AsyncStorage from "@react-native-async-storage/async-storage";

function storageKey(athleteId: string) {
  return `hh_athlete_raised_baseline_${athleteId}`;
}

/**
 * Persists the latest personal total and returns whether it increased since the
 * last stored visit (new donations since last session / refresh).
 */
export async function evaluateAndPersistDonationCelebration(
  athleteId: string,
  raisedSelf: number
): Promise<boolean> {
  const k = storageKey(athleteId);
  const raw = await AsyncStorage.getItem(k);
  const prev = raw != null ? Number(raw) : null;
  await AsyncStorage.setItem(k, raisedSelf.toFixed(2));
  if (prev === null || Number.isNaN(prev)) {
    return false;
  }
  return raisedSelf > prev + 0.005;
}

export const DONATION_CELEBRATION_MESSAGES = [
  "Nice — your total moved up. Keep the momentum going.",
  "Supporters are showing up for you. Every bit helps the team.",
  "You're making a difference. Thank you for putting in the work.",
  "Momentum is building. Keep sharing your link when it feels right.",
  "Progress adds up. Nice work out there.",
] as const;

export function randomDonationCelebrationMessage(): string {
  const list = DONATION_CELEBRATION_MESSAGES;
  return list[Math.floor(Math.random() * list.length)]!;
}

/** Progress ratios vs personal goal: 50%, 75%, 90%, 100%, 110%. */
const GOAL_TIERS = [0.5, 0.75, 0.9, 1, 1.1] as const;

const GOAL_MILESTONE_MESSAGES: readonly string[] = [
  "Halfway to your personal goal — you've got this.",
  "Three-quarters there — keep the momentum going.",
  "You're at 90% — finish strong!",
  "You hit your personal goal!",
  "You're past your goal — amazing work!",
];

function goalMilestoneKey(athleteId: string) {
  return `hh_athlete_goal_milestone_${athleteId}`;
}

function highestGoalTierIndex(ratio: number): number {
  let hi = -1;
  for (let i = 0; i < GOAL_TIERS.length; i++) {
    if (ratio + 1e-9 >= GOAL_TIERS[i]) hi = i;
  }
  return hi;
}

export type GoalMilestoneResult = { tierIndex: number; message: string };

/**
 * When the athlete has a positive personal goal, celebrates the first time they
 * reach each tier (50% → 75% → 90% → 100% → 110%+). Persists the highest tier
 * acknowledged so we don't repeat. Returns null if no new tier this visit.
 */
export async function evaluateAndPersistGoalMilestone(
  athleteId: string,
  raisedSelf: number,
  personalGoal: number | null
): Promise<GoalMilestoneResult | null> {
  if (
    personalGoal == null ||
    !Number.isFinite(personalGoal) ||
    personalGoal <= 0
  ) {
    return null;
  }
  const ratio = raisedSelf / personalGoal;
  const current = highestGoalTierIndex(ratio);
  if (current < 0) {
    return null;
  }

  const k = goalMilestoneKey(athleteId);
  const raw = await AsyncStorage.getItem(k);
  let last = raw != null ? parseInt(raw, 10) : -1;
  if (Number.isNaN(last)) last = -1;

  const newStored = Math.max(last, current);
  await AsyncStorage.setItem(k, String(newStored));

  if (current <= last) {
    return null;
  }

  return {
    tierIndex: current,
    message: GOAL_MILESTONE_MESSAGES[current]!,
  };
}
