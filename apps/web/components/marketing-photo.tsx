import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  /** Subtle documentary black-and-white treatment */
  mono?: boolean;
  priority?: boolean;
  sizes?: string;
};

export function MarketingPhoto({
  src,
  alt,
  className,
  imageClassName,
  mono,
  priority,
  sizes,
}: Props) {
  return (
    <div className={cn("relative overflow-hidden bg-neutral-900", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes ?? "100vw"}
        className={cn(
          "object-cover",
          mono && "grayscale contrast-[1.06] brightness-[0.9]",
          imageClassName
        )}
      />
    </div>
  );
}
