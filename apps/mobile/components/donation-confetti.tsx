import type { ComponentType } from "react";
import Explosion from "react-native-confetti-cannon";

type Props = {
  count: number;
  origin: { x: number; y: number };
  explosionSpeed?: number;
  fallSpeed?: number;
  fadeOut?: boolean;
  colors?: string[];
};

const ExplosionCompat = Explosion as unknown as ComponentType<Props>;

/** Wrapper so TS accepts the package’s legacy class component. */
export function DonationConfetti(props: Props) {
  return <ExplosionCompat {...props} />;
}
