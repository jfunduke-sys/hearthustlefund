"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  countersignOrganizationAgreement,
  setAgreementEstimatedGross,
} from "@/app/actions/organization-agreement";
import {
  DEFAULT_HH_COUNTERSIGNER_NAME,
  DEFAULT_HH_COUNTERSIGNER_TITLE,
} from "../hh-countersign-defaults";

export {
  DEFAULT_HH_COUNTERSIGNER_NAME,
  DEFAULT_HH_COUNTERSIGNER_TITLE,
} from "../hh-countersign-defaults";

type Props = {
  agreementId: string;
  alreadyCountersigned: boolean;
  defaultSigner?: string;
  defaultTitle?: string;
  estimatedTargetGross?: number | null;
};

/** SuperAdmin-only controls (hidden when printing): budget, print + record H&H countersignature. */
export function AgreementPrintControls({
  agreementId,
  alreadyCountersigned,
  defaultSigner = DEFAULT_HH_COUNTERSIGNER_NAME,
  defaultTitle = DEFAULT_HH_COUNTERSIGNER_TITLE,
  estimatedTargetGross,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState(defaultSigner);
  const [title, setTitle] = useState(defaultTitle);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gross, setGross] = useState(
    estimatedTargetGross != null ? String(estimatedTargetGross) : ""
  );
  const [grossBusy, setGrossBusy] = useState(false);
  const [grossError, setGrossError] = useState<string | null>(null);
  const [grossSaved, setGrossSaved] = useState(false);

  async function onSaveGross() {
    setGrossError(null);
    setGrossSaved(false);
    const amount = Number(gross.replace(/[$,]/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) {
      setGrossError("Enter a valid estimated target gross (dollars).");
      return;
    }
    setGrossBusy(true);
    const res = await setAgreementEstimatedGross({
      id: agreementId,
      estimated_target_gross: amount,
    });
    setGrossBusy(false);
    if (!res.ok) {
      setGrossError(res.error);
      return;
    }
    setGrossSaved(true);
    router.refresh();
  }

  async function onCountersign() {
    setError(null);
    setBusy(true);
    const res = await countersignOrganizationAgreement({
      id: agreementId,
      countersigned_by: name.trim() || DEFAULT_HH_COUNTERSIGNER_NAME,
      countersigned_title: title.trim() || DEFAULT_HH_COUNTERSIGNER_TITLE,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  /** Print PDF; if not yet countersigned, save the (default or edited) H&H signature first. */
  async function onPrint() {
    setError(null);
    if (!alreadyCountersigned) {
      setBusy(true);
      const res = await countersignOrganizationAgreement({
        id: agreementId,
        countersigned_by: name.trim() || DEFAULT_HH_COUNTERSIGNER_NAME,
        countersigned_title: title.trim() || DEFAULT_HH_COUNTERSIGNER_TITLE,
      });
      setBusy(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
      // Brief pause so the printed page includes the saved countersignature.
      await new Promise((r) => setTimeout(r, 400));
    }
    window.print();
  }

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 print:hidden">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={() => void onPrint()} disabled={busy}>
          {busy ? "Saving…" : "Print / Save as PDF"}
        </Button>
        <a
          href="/admin"
          className="text-sm font-medium text-hh-primary hover:underline"
        >
          ← Back to admin
        </a>
      </div>

      <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
        <p className="text-sm font-semibold text-hh-dark">
          Estimated target gross (Exhibit A budget)
        </p>
        <p className="text-xs text-slate-600">
          Seeded from this campaign&apos;s intake estimate. Adjust only if the
          filed budget should differ, then save. Drives the 90/10 budget on the
          filed copy.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="est_gross">Estimated target gross ($)</Label>
            <Input
              id="est_gross"
              inputMode="numeric"
              value={gross}
              onChange={(e) => setGross(e.target.value)}
              placeholder="e.g. 10000"
              className="w-40"
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void onSaveGross()}
            disabled={grossBusy}
          >
            {grossBusy ? "Saving…" : "Save target gross"}
          </Button>
        </div>
        {grossError ? (
          <p className="text-sm text-red-600" role="alert">
            {grossError}
          </p>
        ) : null}
        {grossSaved && !grossError ? (
          <p className="text-sm text-emerald-700">Saved.</p>
        ) : null}
      </div>

      {!alreadyCountersigned ? (
        <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
          <p className="text-sm font-semibold text-hh-dark">
            Heart &amp; Hustle countersignature
          </p>
          <p className="text-xs text-slate-600">
            Defaults to {DEFAULT_HH_COUNTERSIGNER_NAME}. Edit if needed, or just
            print — Print / Save as PDF will record this countersignature
            automatically.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="hh_signer">H&amp;H signer name</Label>
              <Input
                id="hh_signer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={DEFAULT_HH_COUNTERSIGNER_NAME}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="hh_title">Title</Label>
              <Input
                id="hh_title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={DEFAULT_HH_COUNTERSIGNER_TITLE}
              />
            </div>
          </div>
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            onClick={() => void onCountersign()}
            disabled={busy}
          >
            {busy ? "Saving…" : "Save countersignature"}
          </Button>
        </div>
      ) : (
        <p className="mt-3 text-sm text-emerald-700">
          Countersigned by Heart &amp; Hustle. Use{" "}
          <strong>Print / Save as PDF</strong> to download the filed copy.
        </p>
      )}
    </div>
  );
}
