"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PLATFORM } from "@heart-and-hustle/shared";
import type { LucideIcon } from "lucide-react";
import { Facebook, Linkedin, Mail, MessageCircle, Share2 } from "lucide-react";

type Props = {
  shareUrl: string;
  athleteName: string;
  teamName: string;
  schoolName: string;
};

function encode(s: string) {
  return encodeURIComponent(s);
}

export function DonateShareRow({
  shareUrl,
  athleteName,
  teamName,
  schoolName,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [urlFromWindow, setUrlFromWindow] = useState("");

  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function"
    );
    if (!shareUrl && typeof window !== "undefined") {
      setUrlFromWindow(window.location.href);
    }
  }, [shareUrl]);

  const effectiveUrl = shareUrl || urlFromWindow;

  const shareText = useMemo(
    () =>
      `Support ${athleteName} — ${teamName} (${schoolName}). Give if you can: ${effectiveUrl}`,
    [athleteName, teamName, schoolName, effectiveUrl]
  );

  const flashCopied = useCallback(() => {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, []);

  const copyLink = useCallback(async () => {
    const u =
      effectiveUrl ||
      (typeof window !== "undefined" ? window.location.href : "");
    if (!u) return;
    try {
      await navigator.clipboard.writeText(u);
      flashCopied();
    } catch {
      /* ignore */
    }
  }, [effectiveUrl, flashCopied]);

  const nativeShare = useCallback(async () => {
    if (!effectiveUrl) return;
    try {
      await navigator.share({
        title: `Support ${athleteName}`,
        text: shareText,
        url: effectiveUrl,
      });
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      await copyLink();
    }
  }, [athleteName, shareText, effectiveUrl, copyLink]);

  const socialLinks = useMemo(() => {
    if (!effectiveUrl) return null;
    const links: {
      key: string;
      label: string;
      icon: LucideIcon;
      href: string;
    }[] = [
      {
        key: "facebook",
        label: "Facebook",
        icon: Facebook,
        href: `https://www.facebook.com/sharer/sharer.php?u=${encode(effectiveUrl)}`,
      },
      {
        key: "linkedin",
        label: "LinkedIn",
        icon: Linkedin,
        href: `https://www.linkedin.com/sharing/share-offsite/?url=${encode(effectiveUrl)}`,
      },
      {
        key: "email",
        label: "Email",
        icon: Mail,
        href: `mailto:?subject=${encode(
          `Support ${athleteName} — ${teamName}`
        )}&body=${encode(`${shareText}\n\n— ${PLATFORM.displayName}`)}`,
      },
      {
        key: "sms",
        label: "Text",
        icon: MessageCircle,
        href: `sms:?&body=${encode(shareText)}`,
      },
    ];
    const xHref = `https://twitter.com/intent/tweet?text=${encode(shareText)}&url=${encode(effectiveUrl)}`;
    return { links, xHref };
  }, [effectiveUrl, shareText, athleteName, teamName]);

  return (
    <section
      className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm"
      aria-labelledby="donate-share-heading"
    >
      <h2
        id="donate-share-heading"
        className="text-sm font-semibold uppercase tracking-wide text-slate-500"
      >
        Share this page
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">
        Help spread the word — no donation required. Anyone can use your link to
        contribute during the campaign.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {canNativeShare ? (
          <button
            type="button"
            onClick={() => void nativeShare()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800 transition hover:border-hh-primary/40 hover:bg-white"
          >
            <Share2 className="h-4 w-4 shrink-0 text-hh-primary" aria-hidden />
            Share…
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => void copyLink()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800 transition hover:border-hh-primary/40 hover:bg-white"
        >
          <Share2 className="h-4 w-4 shrink-0 text-hh-primary" aria-hidden />
          {copied ? "Copied!" : "Copy link"}
        </button>
        {socialLinks ? (
          <>
            <a
              href={socialLinks.xHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:border-hh-primary/35 hover:shadow-md"
            >
              <span
                className="flex h-4 w-4 shrink-0 items-center justify-center text-[10px] font-black text-hh-primary"
                aria-hidden
              >
                X
              </span>
              X (Twitter)
            </a>
            {socialLinks.links.map(({ key, label, icon: Icon, href }) => (
              <a
                key={key}
                href={href}
                target={key === "email" || key === "sms" ? undefined : "_blank"}
                rel={
                  key === "email" || key === "sms"
                    ? undefined
                    : "noopener noreferrer"
                }
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:border-hh-primary/35 hover:shadow-md"
              >
                <Icon className="h-4 w-4 shrink-0 text-hh-primary" aria-hidden />
                {label}
              </a>
            ))}
          </>
        ) : (
          <p className="w-full text-xs text-slate-500">
            Social buttons load once this page&apos;s link is available — use{" "}
            <strong>Copy link</strong> after it enables, or copy from your
            browser&apos;s address bar.
          </p>
        )}
      </div>
    </section>
  );
}
