"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MarketingSiteHeader({
  className,
}: {
  /** Optional wrapper classes (e.g. border) */
  className?: string;
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
      <Button
        variant="outline"
        size="default"
        className="w-full border-2 border-hh-primary bg-white text-sm text-hh-primary hover:bg-hh-primary/10 sm:w-auto sm:text-base lg:px-3 lg:text-sm xl:px-4 xl:text-base"
        asChild
      >
        <Link href="/request-fundraiser" onClick={close}>
          Request fundraiser
        </Link>
      </Button>
      <Button
        variant="outline"
        size="default"
        className="w-full text-sm sm:w-auto sm:text-base lg:px-3 lg:text-sm xl:px-4 xl:text-base"
        asChild
      >
        <Link href="/coach/login" onClick={close}>
          Organizer login
        </Link>
      </Button>
      <Button
        variant="secondary"
        size="default"
        className="w-full text-sm sm:w-auto sm:text-base lg:px-3 lg:text-sm xl:px-4 xl:text-base"
        asChild
      >
        <Link href="/how-it-works" onClick={close}>
          How it works
        </Link>
      </Button>
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
          className="fixed inset-y-0 right-0 z-[210] flex w-[min(22rem,100vw)] max-w-full flex-col border-l border-slate-200 bg-white shadow-2xl"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-semibold text-hh-dark">Menu</span>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-hh-dark"
              aria-label="Close menu"
              onClick={close}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav
            className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 pb-8"
            aria-label="Main"
          >
            <Button variant="ghost" className="h-12 shrink-0 justify-start text-base" asChild>
              <Link href="/" onClick={close}>
                Home
              </Link>
            </Button>
            <div className="shrink-0 border-t border-slate-100 pt-3">{navLinks}</div>
          </nav>
        </div>
      </div>
    ) : null;

  return (
    <header
      className={cn(
        "relative z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm",
        className
      )}
    >
      <div className="mx-auto flex h-[4.5rem] max-w-5xl flex-nowrap items-center justify-between gap-2 px-3 sm:gap-3 sm:px-6 lg:items-stretch lg:gap-4 lg:px-6 lg:py-2 lg:h-28 xl:h-[7.5rem] xl:py-2.5">
        <Link
          href="/"
          className="flex min-h-0 min-w-0 max-w-[58%] shrink items-center overflow-hidden py-0 sm:max-w-[55%] sm:py-0.5 md:py-1 lg:h-full lg:min-h-0 lg:max-w-[min(92%,42rem)] lg:items-center lg:overflow-visible lg:py-0"
          onClick={close}
        >
          <BrandLogo
            priority
            className="h-[3.25rem] w-auto max-h-[3.25rem] max-w-full object-contain object-left sm:h-14 sm:max-h-14 md:h-[3.75rem] md:max-h-[3.75rem] lg:h-full lg:max-h-full lg:w-auto lg:min-w-0 lg:max-w-full"
          />
        </Link>

        <nav
          className="hidden shrink-0 items-center justify-end gap-2 self-center lg:flex lg:gap-2 xl:gap-3"
          aria-label="Main"
        >
          {navLinks}
        </nav>

        <button
          type="button"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center self-center rounded-lg border-2 border-slate-200 bg-white text-hh-dark shadow-sm transition hover:border-hh-primary hover:bg-slate-50 lg:hidden"
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
