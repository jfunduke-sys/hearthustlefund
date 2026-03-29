import Image from "next/image";
import { BRAND } from "@/lib/brand";

type Props = {
  /** Tailwind height class (e.g. h-9) — image scales width automatically */
  className?: string;
  priority?: boolean;
};

/** Matches `heart-hustle-logo.png` (shield + Heart & / Hustle / Fundraising wordmark). */
const intrinsic = { width: 680, height: 150 };

export function BrandLogo({ className = "h-10 w-auto sm:h-11", priority }: Props) {
  return (
    <Image
      src="/heart-hustle-logo.png"
      alt={BRAND.name}
      {...intrinsic}
      className={className}
      priority={priority}
    />
  );
}
