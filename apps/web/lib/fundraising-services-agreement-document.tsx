import Link from "next/link";
import { BRAND } from "@/lib/brand";

/** Bump when the document body text changes (SuperAdmin + public /terms). */
export const FUNDRAISING_SERVICES_AGREEMENT_DOC_VERSION = "8" as const;

type Props = {
  pfrReg: string;
  /** When set (e.g. "/privacy"), Section 9 links to the public Privacy policy. */
  privacyPolicyHref?: string;
};

/**
 * Full Fundraising Services Agreement — used on public /terms and in SuperAdmin (print/copy).
 */
export function FundraisingServicesAgreementBody({
  pfrReg,
  privacyPolicyHref,
}: Props) {
  return (
    <section className="space-y-6 text-sm leading-relaxed text-slate-800 print:text-black">
      <p>
        This Fundraising Services Agreement (&quot;Agreement&quot;) is entered
        into by and between Heart and Hustle Fundraising LLC
        (&quot;Company&quot;) and the undersigned organization, school, team,
        booster club, or affiliated representative
        (&quot;Organization&quot;).
      </p>
      <p>
        By signing below or accessing the Company&apos;s platform, the
        Organization agrees to the following terms:
      </p>

      <section>
        <h3 className="text-base font-semibold text-hh-dark print:font-bold">
          1. PURPOSE
        </h3>
        <p className="mt-2">
          Company provides a digital fundraising platform that enables
          organizations, teams, and participants to conduct fundraising
          campaigns. Organization desires to use the platform for such
          purposes.
        </p>
        <p className="mt-2">
          Company operates as a registered Professional Fund Raiser with the
          Illinois Attorney General&apos;s Office, registration number{" "}
          <span className="font-mono text-xs not-italic">{pfrReg}</span>
          , and conducts fundraising activities in compliance with the Illinois
          Solicitation for Charity Act (225 ILCS 460).
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-hh-dark print:font-bold">
          2. ORGANIZATION ELIGIBILITY &amp; CLASSIFICATION
        </h3>
        <h4 className="mt-3 text-sm font-semibold text-slate-800 print:font-bold">
          Tier 1 — Eligible Organizations
        </h4>
        <ul className="mt-1 list-outside list-disc pl-5">
          <li>
            Accredited public and private elementary and secondary schools
            recognized by the Illinois State Board of Education
          </li>
          <li>
            Interscholastic athletic programs and booster clubs affiliated with
            such schools
          </li>
          <li>
            School-sanctioned activity clubs, including bands, dramatic
            organizations, and academic teams
          </li>
          <li>
            Parent-teacher organizations (PTOs) affiliated with an accredited
            school
          </li>
        </ul>
        <h4 className="mt-4 text-sm font-semibold text-slate-800 print:font-bold">
          Tier 2 — Qualified Organizations (Subject to Review)
        </h4>
        <p className="mt-1">Subject to Company approval prior to participation:</p>
        <ul className="mt-1 list-outside list-disc pl-5">
          <li>Youth athletic associations</li>
          <li>Travel sports programs</li>
          <li>Recreational leagues serving minors</li>
          <li>Community youth organizations</li>
          <li>
            Organizations exempt from federal income tax under Sections 501(c)(3),
            501(c)(4), or 501(c)(6) whose primary purpose includes youth,
            education, or athletic development
          </li>
        </ul>
        <h4 className="mt-4 text-sm font-semibold text-slate-800 print:font-bold">
          Tier 3 — Ineligible Organizations (Prohibited)
        </h4>
        <p className="mt-1">The following are not permitted to use the platform:</p>
        <ul className="mt-1 list-outside list-disc pl-5">
          <li>Political organizations, candidates, or political action committees</li>
          <li>For-profit businesses</li>
          <li>
            Organizations whose primary purpose is religious worship or
            proselytization
          </li>
          <li>Any individual acting in a personal capacity</li>
        </ul>
        <h4 className="mt-4 text-sm font-semibold text-slate-800 print:font-bold">
          Verification
        </h4>
        <p className="mt-1">
          Organization represents that it meets the above requirements. Company
          reserves the right to request documentation, approve or deny
          participation, and terminate access if misrepresentation is
          discovered.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-hh-dark print:font-bold">
          3. FUNDRAISING STRUCTURE
        </h3>
        <p className="mt-2">A 90/10 revenue split applies:</p>
        <ul className="mt-1 list-outside list-disc pl-5">
          <li>90% of funds raised are allocated to Organization</li>
          <li>10% is retained by Company as its service fee</li>
        </ul>
        <p className="mt-2">
          Payment processing fees shall be the sole responsibility of Company and
          will be paid from Company&apos;s 10% service fee. The
          Organization&apos;s 90% share shall not be reduced by such fees.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-hh-dark print:font-bold">
          4. FUNDRAISER CONTROL
        </h3>
        <p className="mt-2">
          Organization, through its designated Organizer (&quot;Organizer&quot;)—the
          coach, program sponsor, or lead fundraising representative the Organization
          authorizes to request and manage campaigns for the team, club, or
          activity—is solely responsible for:
        </p>
        <ul className="mt-1 list-outside list-disc pl-5">
          <li>Requesting fundraisers</li>
          <li>Setting fundraiser dates</li>
          <li>Establishing team and/or individual goals</li>
        </ul>
        <p className="mt-2">Company does not control or manage fundraising campaigns.</p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-hh-dark print:font-bold">
          5. ORGANIZATION RESPONSIBILITIES
        </h3>
        <p className="mt-2">Organization agrees to:</p>
        <ul className="mt-1 list-outside list-disc pl-5">
          <li>Recruit and onboard all participants</li>
          <li>Oversee participant use of the platform</li>
          <li>
            Ensure compliance with all school, district, and applicable legal
            requirements
          </li>
          <li>Obtain any required approvals from schools or governing bodies</li>
        </ul>
        <p className="mt-2">
          Organization assumes full responsibility for all participant actions.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-hh-dark print:font-bold">
          6. PARTICIPANT COMMUNICATIONS
        </h3>
        <p className="mt-2">Company may provide preset messaging templates.</p>
        <p className="mt-2">Organization acknowledges that:</p>
        <ul className="mt-1 list-outside list-disc pl-5">
          <li>Participants may alter or modify such messages</li>
          <li>
            Company has no control over participant-generated or modified
            communications
          </li>
        </ul>
        <p className="mt-2">
          Organization is solely responsible for all communications sent by
          participants.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-hh-dark print:font-bold">
          7. PAYMENTS &amp; USE OF FUNDS
        </h3>
        <p className="mt-2">
          Following the close of a campaign (or other agreed payout trigger),
          Company will initiate disbursement of Organization&apos;s share of net
          proceeds within <strong>three (3) business days</strong> after all
          applicable donation amounts have <strong>cleared</strong> through
          Stripe&apos;s payment processing (i.e., settled and available for payout
          under Stripe&apos;s rules and timelines). Bank settlement, weekends,
          holidays, account verification, chargebacks, or other events outside
          Company&apos;s control may affect when funds are received by
          Organization, but Company will use commercially reasonable efforts to
          meet the foregoing initiation standard.
        </p>
        <p className="mt-2">
          Organization is solely responsible for:
        </p>
        <ul className="mt-1 list-outside list-disc pl-5">
          <li>Allocation and use of funds</li>
          <li>Distribution to participants or teams</li>
        </ul>
      </section>

      <section>
        <h3 className="text-base font-semibold text-hh-dark print:font-bold">
          8. TAX DEDUCTIBILITY OF DONATIONS
        </h3>
        <p className="mt-2">
          Heart &amp; Hustle Fundraising, LLC is a registered Professional Fund
          Raiser with the Illinois Attorney General&apos;s Office and is not a
          charitable organization or tax-exempt entity under Section 501(c)(3) or
          any other provision of the Internal Revenue Code. Company makes no
          representation, warranty, or guarantee regarding the tax deductibility
          of any donation processed through its platform.
        </p>
        <p className="mt-2">
          The tax deductibility of a donation is determined solely by the
          tax-exempt status of the receiving Organization and the donor&apos;s
          individual tax circumstances. It is the sole responsibility of the
          donor and the participating Organization to determine whether a
          contribution qualifies as a tax-deductible charitable donation under
          applicable federal, state, and local tax laws.
        </p>
        <p className="mt-2">
          Company facilitates payment processing through Stripe, Inc. Donors who
          provide an email address at the time of donation may receive a
          payment receipt directly from Stripe. This receipt confirms that a
          payment was processed and does not constitute a charitable contribution
          acknowledgment, tax receipt, or representation of tax deductibility.
        </p>
        <p className="mt-2">
          Participating organizations that hold 501(c)(3) or other applicable
          tax-exempt status are solely responsible for issuing any required
          charitable contribution acknowledgments to donors in accordance with
          IRS requirements, including written acknowledgments for donations of
          $250 or more.
        </p>
        <p className="mt-2">
          Company expressly disclaims any liability arising from a donor&apos;s
          reliance on the tax deductibility of any donation made through its
          platform. Donors and participating organizations are encouraged to
          consult a qualified tax professional regarding their specific
          circumstances.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-hh-dark print:font-bold">
          9. DATA USE &amp; PRIVACY
        </h3>
        <p className="mt-2">Company does not sell personal data.</p>
        <p className="mt-2">Data is used only for:</p>
        <ul className="mt-1 list-outside list-disc pl-5">
          <li>Platform functionality</li>
          <li>Payment processing</li>
          <li>Legal and tax compliance</li>
        </ul>
        <p className="mt-2">
          Company shares personal data with service providers (for example, payment
          processors and hosting or authentication services) only as needed to
          operate the platform and as described in the publicly posted{" "}
          {privacyPolicyHref ? (
            <Link
              href={privacyPolicyHref}
              className="font-semibold text-hh-primary underline underline-offset-2"
            >
              Privacy policy
            </Link>
          ) : (
            <strong>Privacy policy</strong>
          )}{" "}
          for {BRAND.name}. That policy and this Section are written to be
          consistent. Company retains only data necessary to meet legal and
          financial obligations.
        </p>
        <p className="mt-2">
          Optional fundraiser reminder SMS to participants—consent, frequency,
          opt-out (STOP), and related disclosures—is described on our publicly
          posted{" "}
          <Link
            href="/sms-reminders"
            className="font-semibold text-hh-primary underline underline-offset-2"
          >
            SMS reminders
          </Link>{" "}
          page.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-hh-dark print:font-bold">
          10. LIMITATION OF LIABILITY
        </h3>
        <p className="mt-2">
          To the fullest extent permitted by law, Company shall not be liable
          for:
        </p>
        <ul className="mt-1 list-outside list-disc pl-5">
          <li>Participant conduct or misuse of the platform</li>
          <li>Altered or unauthorized communications</li>
          <li>Fundraising performance or outcomes</li>
          <li>Actions of Organization, Sponsor, or participants</li>
        </ul>
        <p className="mt-2">
          Company&apos;s liability is strictly limited to issues directly related
          to the technical functionality of the platform.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-hh-dark print:font-bold">
          11. INDEMNIFICATION / HOLD HARMLESS
        </h3>
        <p className="mt-2">
          Organization agrees to defend, indemnify, and hold harmless Company and
          its affiliates from any claims, damages, or liabilities arising from:
        </p>
        <ul className="mt-1 list-outside list-disc pl-5">
          <li>Participant actions or communications</li>
          <li>Misuse of the platform</li>
          <li>Violation of laws or policies</li>
          <li>Misrepresentation of eligibility</li>
          <li>Disputes regarding funds or fundraising activities</li>
        </ul>
      </section>

      <section>
        <h3 className="text-base font-semibold text-hh-dark print:font-bold">
          12. TERM &amp; TERMINATION
        </h3>
        <p className="mt-2">
          This Agreement is effective upon acceptance and continues through the
          fundraiser period. Either party may terminate at any time. Company may
          immediately terminate for:
        </p>
        <ul className="mt-1 list-outside list-disc pl-5">
          <li>Ineligibility</li>
          <li>Misrepresentation</li>
          <li>Policy violations</li>
        </ul>
        <p className="mt-2">
          Funds raised prior to termination will be distributed in accordance
          with this Agreement.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-hh-dark print:font-bold">
          13. INDEPENDENT RELATIONSHIP
        </h3>
        <p className="mt-2">
          Company is an independent contractor and is not an employee, agent, or
          partner of Organization.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-hh-dark print:font-bold">
          14. GOVERNING LAW
        </h3>
        <p className="mt-2">
          This Agreement shall be governed by the laws of the State of Illinois.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-hh-dark print:font-bold">
          15. FORCE MAJEURE
        </h3>
        <p className="mt-2">
          Neither party is liable for delay or failure to perform (except for
          payment of money when funds are available) due to events beyond that
          party&apos;s reasonable control, including natural disasters, fire, flood,
          epidemic or pandemic, war, terrorism, civil unrest, acts of government
          or regulatory authority, labor disputes, power, telecommunications, or
          internet failures not caused by the party, or other similar causes,
          provided the affected party uses commercially reasonable efforts to
          resume performance. If such a condition continues for more than
          thirty (30) days, either party may terminate the program relationship
          upon written notice, subject to Section 12 regarding distribution of
          funds already raised.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-hh-dark print:font-bold">
          16. ELECTRONIC COMMUNICATIONS &amp; CONSENT
        </h3>
        <p className="mt-2">
          Organization consents to receive from Company, at the contact points
          Organization provides (including email addresses and, where
          applicable, phone numbers for SMS), electronic communications
          including: (a) service, account, and security notices; (b) donation and
          payment-related receipts and confirmations, including those delivered
          by or through our payment processor (e.g. Stripe); (c) campaign,
          program, and platform updates; and (d) operational messages related
          to active or recent fundraisers, consistent with our publicly posted
          terms and privacy practices. Organization is responsible for keeping
          contact information accurate. Organization agrees that (i) this
          Agreement and related documents may be accepted and signed
          electronically where offered, and (ii) electronic records and
          notices satisfy any legal requirement that communications be in
          writing, to the extent permitted by applicable law.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-hh-dark print:font-bold">
          17. INTELLECTUAL PROPERTY
        </h3>
        <p className="mt-2">
          Company retains all right, title, and interest in and to the
          platform, software, user interface, documentation, trade names, logos,
          and other materials made available to Organization (the &quot;Company
          IP&quot;), subject only to the limited right for Organization, Sponsor,
          and participants to use the Service for approved program fundraising
          as permitted by this Agreement. Organization shall not, and shall not
          permit others to, reverse engineer, decompile, disassemble, or
          attempt to derive source code from the Service; copy, frame, or
          mirror the Service except as needed for normal use; scrape or use
          automated means to access the Service beyond what we expressly allow;
          remove proprietary notices; or use knowledge of the Service to
          develop or assist in developing a competing product or service.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-hh-dark print:font-bold">
          18. FEEDBACK
        </h3>
        <p className="mt-2">
          If Organization or its representatives provide Company with any
          feedback, suggestions, ideas, or know-how about the Service
          (collectively, &quot;Feedback&quot;), Organization grants Company a
          royalty-free, perpetual, irrevocable, worldwide license to use,
          disclose, and incorporate that Feedback in Company&apos;s products and
          services without obligation or compensation to Organization.
          Organization represents it has the right to grant this license. To the
          extent Feedback includes anything assignable, Organization assigns
          all right, title, and interest in such Feedback to Company.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-hh-dark print:font-bold">
          19. SEVERABILITY
        </h3>
        <p className="mt-2">
          If any provision of this Agreement is found unenforceable, the
          remaining provisions continue in full force and effect.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-hh-dark print:font-bold">
          20. ACCEPTANCE
        </h3>
        <p className="mt-2">
          To complete enrollment, the Organization will provide the information
          and signatures (including a W-9 and this Agreement as applicable)
          required by Company.
        </p>
      </section>
    </section>
  );
}
