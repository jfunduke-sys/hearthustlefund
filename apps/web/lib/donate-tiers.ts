export type DonateTier = {
  amount: number;
  title: string;
  subtitle?: string;
};

/** Large tiles: $1000 → $100 */
export const DONATE_MAJOR_TIERS: DonateTier[] = [
  {
    amount: 1000,
    title: "G.O.A.T",
    subtitle: "A transformational gift for the whole program.",
  },
  {
    amount: 500,
    title: "Hall of Fame",
    subtitle: "Helps us fund major priorities this season.",
  },
  {
    amount: 250,
    title: "Champion",
    subtitle: "Lifts the team toward its goal.",
  },
  {
    amount: 100,
    title: "Hero",
    subtitle: "Makes a strong impact for our participants.",
  },
];

/** Compact row: $50 and $25 */
export const DONATE_QUICK_AMOUNTS: readonly { amount: number; label: string }[] =
  [
    { amount: 50, label: "$50" },
    { amount: 25, label: "$25" },
  ];
