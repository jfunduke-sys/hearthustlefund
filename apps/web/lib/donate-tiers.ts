export type DonateTier = {
  amount: number;
  title: string;
  subtitle?: string;
};

/** Ordered high → low; $50 / $25 use short subtitles only. */
export const DONATE_TIERS: DonateTier[] = [
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
    subtitle: "Makes a strong impact for our athletes.",
  },
  { amount: 50, title: "$50", subtitle: "Every gift moves us forward." },
  { amount: 25, title: "$25", subtitle: "Adds up fast with community support." },
];
