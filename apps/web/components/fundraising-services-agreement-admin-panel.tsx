"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FUNDRAISING_SERVICES_AGREEMENT_DOC_VERSION,
  FundraisingServicesAgreementBody,
} from "@/lib/fundraising-services-agreement-document";

const pfrReg =
  (process.env.NEXT_PUBLIC_IL_PFR_REGISTRATION_NUMBER ?? "").trim() ||
  "[YOUR NUMBER]";

export function FundraisingServicesAgreementAdminPanel() {
  const printRef = useRef<HTMLDivElement>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "ok" | "err">("idle");

  const runPrint = useCallback(() => {
    window.print();
  }, []);

  const runCopy = useCallback(() => {
    const el = printRef.current;
    if (!el) return;
    const t = el.innerText.replace(/\n\n\n+/g, "\n\n").trim();
    if (!t) return;
    void navigator.clipboard
      .writeText(t)
      .then(() => {
        setCopyStatus("ok");
        setTimeout(() => setCopyStatus("idle"), 2000);
      })
      .catch(() => {
        setCopyStatus("err");
        setTimeout(() => setCopyStatus("idle"), 2000);
      });
  }, []);

  return (
    <Card>
      <CardHeader className="print:hidden">
        <CardTitle>Fundraising Services Agreement</CardTitle>
        <p className="text-sm text-slate-600">
          Same text as the public{" "}
          <strong>Terms of service</strong> page. Use print, copy, or
          print-to-PDF to email or collect wet signatures; DocuSign or similar can
          be added later if you want to reduce paper handling.
        </p>
        <p className="text-xs text-slate-500">
          Document version:{" "}
          <span className="font-mono">{FUNDRAISING_SERVICES_AGREEMENT_DOC_VERSION}</span>{" "}
          · PFR # from{" "}
          <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_IL_PFR_REGISTRATION_NUMBER</code>{" "}
          (set in hosting env if not showing below).
        </p>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button type="button" variant="default" onClick={runPrint}>
            Print
          </Button>
          <Button type="button" variant="secondary" onClick={runCopy}>
            {copyStatus === "ok"
              ? "Copied"
              : copyStatus === "err"
                ? "Copy failed"
                : "Copy text"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={printRef}
          className="rounded-lg border border-slate-200 bg-white p-4 text-slate-800 shadow-sm print:mx-0 print:max-w-none print:border-0 print:p-0 print:shadow-none sm:p-6"
        >
          <h2 className="text-xl font-bold text-hh-dark print:text-center">
            HEART AND HUSTLE FUNDRAISING LLC
          </h2>
          <h3 className="mt-2 text-lg font-bold text-hh-dark print:text-center">
            FUNDRAISING SERVICES AGREEMENT
          </h3>
          <p className="mt-1 text-sm text-slate-500 print:text-center">
            Internal copy — {FUNDRAISING_SERVICES_AGREEMENT_DOC_VERSION} — {new Date().toLocaleDateString("en-US", { timeZone: "UTC" })} (UTC)
          </p>
          <FundraisingServicesAgreementBody pfrReg={pfrReg} />
          <p className="mt-6 border-t border-slate-200 pt-3 text-xs text-slate-500 print:text-black">
            Internal working copy. The live agreement is also published as Terms
            of service; the{" "}
            <strong>Privacy policy</strong> remains a separate public page.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
