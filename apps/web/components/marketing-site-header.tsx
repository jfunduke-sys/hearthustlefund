"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

export function MarketingSiteHeader({
  className,
  overlay = false,
}: {
  /** Optional wrapper classes (e.g. border) */
  className?: string;
  /** Sit on top of a photographic hero instead of a separate bar */
  overlay?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const close = () => setMenuOpen(false);

  const navLinks = (
    <>
      <Link
        href="/how-it-works"
        onClick={close}
        className={cn(
          "text-[13px] font-medium tracking-[0.04em]",
          overlay
            ? "text-white/90 hover:text-white"
            : "text-hh-dark hover:text-hh-primary"
        )}
      >
        How it works
      </Link>
      <Link
        href="/coach/login"
        onClick={close}
        className={cn(
          "text-[13px] font-medium tracking-[0.04em]",
          overlay
            ? "text-white/90 hover:text-white"
            : "text-hh-dark hover:text-hh-primary"
        )}
      >
        Organizer login
      </Link>
      <Link
        href="/request-fundraiser"
        onClick={close}
        className="inline-flex items-center justify-center bg-hh-primary px-4 py-2 text-[13px] font-medium tracking-[0.04em] text-white hover:bg-[#a33225]"
      >
        Request fundraiser
      </Link>
    </>
  );

  const mobileMenu =
    mounted && menuOpen ? (
      <div className="lg:hidden">
        <button
          type="button"
          className="fixed inset-0 z-[200] bg-black/50"
          aria-hidden
          tabIndex={-1}
          onClick={close}
        />
        <div
          id="marketing-site-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="fixed inset-y-0 right-0 z-[210] flex w-[min(22rem,100vw)] max-w-full flex-col border-l border-black/10 bg-[#f3efe6]"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-black/10 px-5 py-4">
            <span className="text-sm font-medium text-hh-dark">Menu</span>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center text-hh-dark hover:text-hh-primary"
              aria-label="Close menu"
              onClick={close}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav
            className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-5 pb-8"
            aria-label="Main"
          >
            <Link
              href="/"
              onClick={close}
              className="text-base font-medium text-hh-dark"
            >
              Home
            </Link>
            <div className="flex flex-col items-start gap-5">
              <Link
                href="/how-it-works"
                onClick={close}
                className="text-[13px] font-medium tracking-[0.04em] text-hh-dark hover:text-hh-primary"
              >
                How it works
              </Link>
              <Link
                href="/coach/login"
                onClick={close}
                className="text-[13px] font-medium tracking-[0.04em] text-hh-dark hover:text-hh-primary"
              >
                Organizer login
              </Link>
              <Link
                href="/request-fundraiser"
                onClick={close}
                className="inline-flex items-center justify-center bg-hh-primary px-4 py-2 text-[13px] font-medium tracking-[0.04em] text-white hover:bg-[#a33225]"
              >
                Request fundraiser
              </Link>
            </div>
          </nav>
        </div>
      </div>
    ) : null;

  return (
    <header
      className={cn(
        overlay
          ? "absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-black/70 via-black/25 to-transparent"
          : "relative z-30 border-b border-black/10 bg-[#f3efe6]",
        className
      )}
    >
      <div className="mx-auto flex h-[4.5rem] max-w-[90rem] items-center justify-between gap-4 px-4 sm:px-8 lg:h-28 lg:items-stretch lg:px-10 xl:h-[7.5rem]">
        <Link
          href="/"
          className="flex min-h-0 min-w-0 max-w-[62%] items-center overflow-hidden sm:max-w-[55%] lg:h-full lg:max-w-[min(92%,42rem)] lg:overflow-visible"
          onClick={close}
        >
          <BrandLogo
            priority
            className={cn(
              "h-[3.25rem] w-auto max-h-[3.25rem] max-w-full object-contain object-left sm:h-14 sm:max-h-14 md:h-[3.75rem] md:max-h-[3.75rem] lg:h-full lg:max-h-full lg:w-auto lg:min-w-0 lg:max-w-full",
              overlay && "drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]"
            )}
          />
        </Link>

        <nav
          className="hidden items-center justify-end gap-8 self-center lg:flex"
          aria-label="Main"
        >
          {navLinks}
        </nav>

        <button
          type="button"
          className={cn(
            "inline-flex h-11 w-11 shrink-0 items-center justify-center self-center lg:hidden",
            overlay ? "text-white" : "text-hh-dark"
          )}
          aria-expanded={menuOpen}
          aria-controls="marketing-site-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {mobileMenu ? createPortal(mobileMenu, document.body) : null}
    </header>
  );
}
