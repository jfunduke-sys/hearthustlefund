"use client";

import { useState } from "react";

const SHOTS = [
  {
    src: "/sms-opt-in/app-opt-in-unchecked.png",
    alt: "Heart and Hustle app Dashboard Your Contact Info screen showing unchecked SMS consent checkbox and phone field",
  },
  {
    src: "/sms-opt-in/app-opt-in-checked.png",
    alt: "Heart and Hustle app Dashboard Your Contact Info screen showing checked SMS consent checkbox before Save",
  },
] as const;

function Screenshot({ src, alt }: { src: string; alt: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static public PNG for Twilio reviewers
    <img
      src={src}
      alt={alt}
      className="w-full rounded-lg border border-slate-200"
      width={390}
      height={844}
      onError={() => setOk(false)}
    />
  );
}

/** Optional live app PNGs in public/sms-opt-in/ — each image hidden if not deployed. */
export function SmsOptInScreenshots() {
  return (
    <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
      <p className="text-xs font-semibold text-slate-600">
        Live app screenshots (same screen):
      </p>
      {SHOTS.map((s) => (
        <Screenshot key={s.src} src={s.src} alt={s.alt} />
      ))}
      <p className="text-[11px] text-slate-500">
        If images do not appear, the hosted form reproduction above is the reviewer
        reference for consent language and disclosures.
      </p>
    </div>
  );
}
