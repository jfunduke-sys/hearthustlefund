import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  FUNDRAISING_SERVICES_AGREEMENT_DOC_VERSION,
  FundraisingServicesAgreementBody,
} from "@/lib/fundraising-services-agreement-document";
import {
  formatDisplayDateTime,
  computeAgreementBudget,
  formatAgreementCurrency,
} from "@heart-and-hustle/shared";
import type { OrganizationAgreement } from "@heart-and-hustle/shared";
import { AgreementPrintControls } from "./agreement-print-controls";

function formatDateOnly(iso: string | null | undefined): string {
  if (!iso) return "—";
  // Prefer YYYY-MM-DD dates without timezone shift.
  const m = String(iso).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

const pfrReg =
  (process.env.NEXT_PUBLIC_IL_PFR_REGISTRATION_NUMBER ?? "").trim() ||
  "[YOUR NUMBER]";

function SignatureLine({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="mt-4">
      <div className="min-h-[1.75rem] border-b border-slate-400 pb-1 text-sm text-slate-900">
        {value || "\u00A0"}
      </div>
      <div className="mt-1 text-xs uppercase tracking-wide text-slate-500">
        {label}
      </div>
    </div>
  );
}

export default async function OrganizationAgreementPage({
  params,
}: {
  params: { id: string };
}) {
  noStore();
  const admin = createAdminClient();
  const { data } = await admin
    .from("organization_agreements")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!data) notFound();
  const a = data as OrganizationAgreement;

  const signedDate = a.signed_at ? formatDisplayDateTime(a.signed_at) : "—";
  const counterDate = a.countersigned_at
    ? formatDisplayDateTime(a.countersigned_at)
    : null;

  const budget = computeAgreementBudget(a.estimated_target_gross);
  const hasGross =
    a.estimated_target_gross != null && a.estimated_target_gross > 0;
  const termStart = formatDateOnly(a.campaign_start_date);
  const termEnd = formatDateOnly(a.campaign_end_date);
  const campaignLabel = [a.school_name, a.sport_club_activity]
    .filter(Boolean)
    .join(" — ");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 text-slate-800 print:max-w-none print:px-0 print:py-0">
      <AgreementPrintControls
        agreementId={a.id}
        alreadyCountersigned={!!a.countersigned_at}
        estimatedTargetGross={a.estimated_target_gross}
      />

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <h1 className="text-center text-xl font-bold text-hh-dark">
          HEART AND HUSTLE FUNDRAISING LLC
        </h1>
        <h2 className="mt-1 text-center text-lg font-bold text-hh-dark">
          FUNDRAISING SERVICES AGREEMENT
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Organization: <strong>{a.organization_name}</strong>
          {a.school_state ? ` (${a.school_state})` : ""}
          {campaignLabel ? (
            <>
              {" "}
              · Campaign: <strong>{campaignLabel}</strong>
            </>
          ) : null}{" "}
          · Document version{" "}
          {a.agreement_version || FUNDRAISING_SERVICES_AGREEMENT_DOC_VERSION}
        </p>

        <div className="mt-6">
          <FundraisingServicesAgreementBody
            pfrReg={pfrReg}
            privacyPolicyHref="/privacy"
          />
        </div>

        <section className="mt-10 border-t border-slate-300 pt-6">
          <h3 className="text-base font-bold text-hh-dark">
            EXHIBIT A — ESTIMATED BUDGET &amp; TERM
          </h3>
          <p className="mt-2 text-sm text-slate-700">
            Required by the Illinois Solicitation for Charity Act (225 ILCS
            460/7(b)). Figures below are a good-faith estimate for{" "}
            <strong>this campaign</strong> based on the Organizer&apos;s
            submitted fundraising goal. Company is compensated by a service fee
            of {budget.serviceFeePercentLabel} of gross funds raised; the
            Organization receives {budget.netPercentLabel}.
          </p>

          {!hasGross ? (
            <p className="mt-3 rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 print:hidden">
              No estimated target gross is on file yet. Enter it in the controls
              above before printing for the state.
            </p>
          ) : null}

          <table className="mt-4 w-full border-collapse text-sm">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="py-2 pr-4 text-slate-600">School / program</td>
                <td className="py-2 text-right font-semibold text-slate-900">
                  {a.school_name || a.organization_name}
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-2 pr-4 text-slate-600">
                  Team / sport / activity
                </td>
                <td className="py-2 text-right font-semibold text-slate-900">
                  {a.sport_club_activity || "—"}
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-2 pr-4 text-slate-600">
                  Estimated target gross to be raised (this campaign)
                </td>
                <td className="py-2 text-right font-semibold text-slate-900">
                  {hasGross
                    ? formatAgreementCurrency(budget.targetGross)
                    : "—"}
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-2 pr-4 text-slate-600">
                  Projected fundraising expenses — Company service fee (
                  {budget.serviceFeePercentLabel}, inclusive of all payment
                  processing)
                </td>
                <td className="py-2 text-right font-semibold text-slate-900">
                  {hasGross ? formatAgreementCurrency(budget.serviceFee) : "—"}
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-2 pr-4 text-slate-600">
                  Projected amount paid to the Organization (
                  {budget.netPercentLabel})
                </td>
                <td className="py-2 text-right font-semibold text-slate-900">
                  {hasGross
                    ? formatAgreementCurrency(budget.netToOrganization)
                    : "—"}
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-2 pr-4 text-slate-600">
                  Contract term (campaign window)
                </td>
                <td className="py-2 text-right font-semibold text-slate-900">
                  {termStart} – {termEnd}
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-2 pr-4 text-slate-600">Geographic scope</td>
                <td className="py-2 text-right text-slate-900">
                  Administered in Illinois; online donations nationwide
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-slate-600">
                  Methods of fundraising
                </td>
                <td className="py-2 text-right text-slate-900">
                  Digital peer-to-peer platform (participant-shared donation
                  links; card payments via Stripe)
                </td>
              </tr>
            </tbody>
          </table>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            The Organization pays no separate payment-processing fees; such fees
            are borne by Company from its service fee. Actual amounts depend on
            funds actually raised. Full statutory disclosures appear in Section
            24 of the Agreement above.
          </p>
        </section>

        <section className="mt-10 border-t border-slate-300 pt-6">
          <h3 className="text-base font-bold text-hh-dark">SIGNATURES</h3>

          <div className="mt-4 rounded border border-slate-200 p-4 text-xs leading-relaxed text-slate-600 print:border-slate-300">
            This agreement was accepted and signed electronically by the
            Organizer (coach or authorized program representative) for this
            campaign via hearthustlefund.com. Electronic signatures are legally
            binding under the U.S. E-SIGN Act and applicable Illinois law.
          </div>

          <div className="mt-6 grid gap-8 sm:grid-cols-2">
            <div>
              <p className="text-sm font-bold text-hh-dark">
                ORGANIZATION / ORGANIZER
              </p>
              <SignatureLine label="Signature (typed)" value={a.signer_name} />
              <SignatureLine label="Name" value={a.signer_name} />
              <SignatureLine label="Title" value={a.signer_title} />
              <SignatureLine label="Organization" value={a.organization_name} />
              <SignatureLine label="School / program" value={a.school_name} />
              <SignatureLine
                label="Team / activity"
                value={a.sport_club_activity}
              />
              <SignatureLine label="Email" value={a.signer_email} />
              <SignatureLine label="Date signed" value={signedDate} />
              <p className="mt-2 text-[11px] text-slate-500">
                Signed electronically
                {a.signed_ip ? ` from IP ${a.signed_ip}` : ""}.
              </p>
            </div>

            <div>
              <p className="text-sm font-bold text-hh-dark">
                HEART AND HUSTLE FUNDRAISING LLC
              </p>
              <SignatureLine label="Signature" value={a.countersigned_by} />
              <SignatureLine label="Name" value={a.countersigned_by} />
              <SignatureLine label="Title" value={a.countersigned_title} />
              <SignatureLine label="Date signed" value={counterDate} />
              {!a.countersigned_at ? (
                <p className="mt-2 text-[11px] text-slate-500 print:hidden">
                  Record the Heart &amp; Hustle countersignature above, then
                  print.
                </p>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
