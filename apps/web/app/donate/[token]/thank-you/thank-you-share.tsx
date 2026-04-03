"use client";

import { useCallback, useEffect, useState } from "react";
import { PLATFORM } from "@heart-and-hustle/shared";
import { Button } from "@/components/ui/button";

type Props = {
  shareUrl: string;
  athleteName: string | null;
};

export function ThankYouShareSection({ shareUrl, athleteName }: Props) {
  const [supportsShare, setSupportsShare] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSupportsShare(
      typeof navigator !== "undefined" &&
        typeof navigator.share === "function",
    );
  }, []);

  const shareText =
    athleteName != null
      ? `I'm supporting ${athleteName}'s fundraiser through ${PLATFORM.displayName}. Chip in if you can!`
      : `Chip in and support this fundraiser through ${PLATFORM.displayName} if you can!`;

  const flashCopied = useCallback(() => {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, []);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      flashCopied();
    } catch {
      /* ignore */
    }
  }, [shareUrl, flashCopied]);

  const openShare = useCallback(async () => {
    if (typeof navigator.share !== "function") {
      await copyLink();
      return;
    }
    try {
      await navigator.share({
        title:
          athleteName != null
            ? `Support ${athleteName}'s fundraiser`
            : "Support this fundraiser",
        text: shareText,
        url: shareUrl,
      });
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      await copyLink();
    }
  }, [athleteName, copyLink, shareText, shareUrl]);

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/80 p-4">
      <p className="font-medium text-slate-800">Share this fundraiser</p>
      <p className="text-xs leading-relaxed text-slate-600">
        Use your phone or computer&apos;s share menu (Messages, Mail, social
        apps, etc.) or copy the link.
      </p>
      <div className="flex flex-wrap gap-2">
        {supportsShare ? (
          <Button type="button" onClick={() => void openShare()}>
            Share…
          </Button>
        ) : null}
        <Button
          type="button"
          variant={supportsShare ? "outline" : "default"}
          onClick={() => void copyLink()}
        >
          {copied ? "Copied!" : "Copy link"}
        </Button>
      </div>
      <p className="break-all font-mono text-xs text-slate-600">{shareUrl}</p>
    </div>
  );
}
