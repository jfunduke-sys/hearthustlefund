import { PLATFORM } from "@heart-and-hustle/shared";

export const BRAND = {
  name: PLATFORM.displayName,
  primary: "#C0392B",
  dark: "#1A1A2E",
  accent: "#F39C12",
} as const;

export const DONATION_PRESETS = [10, 25, 50, 100] as const;
export const MIN_DONATION_DOLLARS = 5;
