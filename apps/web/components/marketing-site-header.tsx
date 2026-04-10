"use client";

import { useEffect, useState } from "react";
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
        size="lg"
        className="w-full border-2 border-hh-primary bg-white text-base text-hh-primary hover:bg-hh-primary/10 sm:w-auto"
        asChild
      >
        <Link href="/request-fundraiser" onClick={close}>
          Request fundraiser
        </Link>
      </Button>
      <Button variant="outline" size="lg" className="w-full text-base sm:w-auto" asChild>
        <Link href="/coach/login" onClick={close}>
          Coach login
        </Link>
      </Button>
      <Button variant="secondary" size="lg" className="w-full text-base sm:w-auto" asChild>
        <Link href="/how-it-works" onClick={close}>
          How it works
        </Link>
      </Button>
    </>
  );

  return (
    <header
      className={cn(
        "border-b border-slate-200 bg-white/80 backdrop-blur",
        menuOpen && "relative z-50",
        className
      )}
    >
      <div
        className={cn(
          "mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-3 sm:h-[5.75rem] sm:gap-4 sm:px-6 lg:h-[6.5rem]",
          menuOpen && "relative z-[60] bg-white"
        )}
      >
        <Link
          href="/"
          className="flex min-h-0 min-w-0 shrink items-center py-1"
          onClick={close}
        >
          <BrandLogo
            priority
            className="h-9 w-auto max-w-[min(100%,12rem)] object-contain object-left sm:h-10 lg:h-full lg:max-h-full lg:min-h-0 lg:max-w-none"
          />
        </Link>

        <nav
          className="hidden min-h-0 items-center justify-end gap-2 lg:flex lg:gap-3 xl:gap-4"
          aria-label="Main"
        >
          {navLinks}
        </nav>

        <button
          type="button"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-slate-200 bg-white text-hh-dark shadow-sm transition hover:border-hh-primary hover:bg-slate-50 lg:hidden"
          aria-expanded={menuOpen}
          aria-controls="marketing-site-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            aria-hidden
            tabIndex={-1}
            onClick={close}
          />
          <div
            id="marketing-site-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className="fixed inset-y-0 right-0 z-50 flex w-[min(20rem,calc(100vw-1rem))] flex-col border-l border-slate-200 bg-white shadow-2xl lg:hidden"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
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
              className="flex flex-1 flex-col gap-3 overflow-y-auto p-4"
              aria-label="Main"
            >
              <Button variant="ghost" className="h-12 justify-start text-base" asChild>
                <Link href="/" onClick={close}>
                  Home
                </Link>
              </Button>
              <div className="border-t border-slate-100 pt-2">{navLinks}</div>
            </nav>
          </div>
        </>
      ) : null}
    </header>
  );
}
