import Link from "next/link";
import { BRAND } from "@/lib/brand";
import type { FeeModel } from "@heart-and-hustle/shared";

/** Bump when the document body text changes (SuperAdmin + public /terms). */
export const FUNDRAISING_SERVICES_AGREEMENT_DOC_VERSION = "13" as const;

type Props = {
  pfrReg: string;
  /** When set (e.g. "/privacy"), Section 9 links to the public Privacy policy. */
  privacyPolicyHref?: string;
  /**
   * Campaign-specific structure from the signed request. Omit on public /terms
   * so both options are described; the signed campaign PDF prints only the one chosen.
   */
  feeModel?: FeeModel | null;
};

function FundraisingStructureSection({ feeModel }: { feeModel?: FeeModel | null }) {
  const split = (
    <>
      <p className="mt-2">
        <strong>90/10 split.</strong> 90% of funds raised are allocated to
        Organization. 10% is retained by Company as its service fee. Payment
        processing is the sole responsibility of Company and is paid from
        Company&apos;s 10% service fee. It is not charged to the donor and does
        not reduce Organization&apos;s 90% share.
      </p>
    </>
  );
  const keep100 = (
    <>
      <p className="mt-2">
        <strong>100% back.</strong> 100% of each stated donation is allocated to
        Organization. Donors pay a separate Electronic Payment Fee (card: 3.9% +
        $0.30; bank transfer: 1%) so processing is not taken from the stated
        gift. Donors may also add an optional contribution to Company at
        checkout to help provide a safe, secure fundraising platform.
      </p>
    </>
  );

  return (
    <section>
      <h3 className="text-base font-semibold text-hh-dark print:font-bold">
        3. FUNDRAISING STRUCTURE
      </h3>
      {feeModel === "keep_100" ? (
        keep100
      ) : feeModel === "split_90_10" ? (
        split
      ) : (
        <>
          <p className="mt-2">
            On the campaign request, Organization selects one fee structure for
            that campaign. The signed agreement for the campaign states which
            structure applies and cannot be changed after the campaign starts.
          </p>
          {split}
          {keep100}
        </>
      )}
    </section>
  );
}

/**
 * Full Fundraising Services Agreement — used on public /terms and in SuperAdmin (print/copy).
 */
export function FundraisingServicesAgreementBody({
  pfrReg,
  privacyPolicyHref,
  feeModel,
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

      <FundraisingStructureSection feeModel={feeModel} />

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
          5. ORGANIZATION RESPONSIBILITIES &amp; COMPLIANCE
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
          <li>
            Comply with all applicable federal, state, and local laws and
            regulations, including state charitable solicitation and fundraising
            laws where they apply to Organization&apos;s programs
          </li>
          <li>
            Comply with school district and institutional policies that govern
            fundraising, technology use, and student activities
          </li>
          <li>
            Comply with all laws relating to minors participating in fundraising,
            including when parental or guardian consent is required for
            collection or use of personal information or participation in
            communications
          </li>
        </ul>
        <p className="mt-2">
          Organization assumes full responsibility for all participant actions.
          Organization is solely responsible for the lawful collection, use, and
          sharing of participant and Organization information in connection with its
          programs, except as otherwise expressly handled by Company as described
          in this Agreement and the Privacy policy.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-hh-dark print:font-bold">
          6. PARTICIPANT COMMUNICATIONS &amp; MESSAGING COMPLIANCE
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
          participants using the platform, including obtaining any legally
          required consent before sending SMS or other messages to contacts,
          and for compliance with the Telephone Consumer Protection Act (TCPA),
          state telemarketing and privacy laws, and other applicable
          communication laws. Company provides tools and templates only;
          Organization and participants remain solely responsible for how those
          tools are used.
        </p>
        <p className="mt-2">
          Separately, the Service may send <strong>optional</strong>, consent-based
          automated fundraiser reminder SMS to users who opt in as described in
          the Service&apos;s SMS disclosures (including the publicly posted{" "}
          <Link
            href="/sms-reminders"
            className="font-semibold text-hh-primary underline underline-offset-2"
          >
            SMS reminders
          </Link>{" "}
          page). Those messages are operational reminders tied to an active
          campaign—not substitute for Organization&apos;s own compliance
          obligations for participant-originated outreach.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-hh-dark print:font-bold">
          7. PAYMENTS, CHARGEBACKS, FRAUD &amp; USE OF FUNDS
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
          Organization is responsible for disputes, claims, or chargebacks
          arising from or related to its campaign, participants, or third-party contributors to the
          extent not solely caused by Company&apos;s gross negligence or willful
          misconduct. Company may withhold, offset, or recover amounts from
          Organization&apos;s share (or pursue reimbursement) for chargebacks,
          refunds, reversals, fees, or suspected fraudulent or unauthorized
          transactions. Donations that are disputed, charged back, flagged as
          fraudulent, or under review must fully clear or resolve before the
          related amounts are treated as available for payout. Company may delay
          or withhold payouts pending investigation of fraud, compliance concerns,
          or payment-processor holds.
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
          8. PAYMENT PROCESSING RECORDS
        </h3>
        <p className="mt-2">
          Company facilitates campaign payment processing through Stripe, Inc.
          and maintains transaction records required for financial operations,
          reconciliation, fraud prevention, dispute handling, legal compliance,
          and payout administration.
        </p>
        <p className="mt-2">
          Organization is responsible for its own accounting and financial
          reporting obligations for campaign funds and for maintaining any
          records required under applicable school, district, nonprofit, or
          governmental rules.
        </p>
        <p className="mt-2">
          Third-party contributor legal disclosures, including tax-deductibility notices,
          are published on dedicated contributor landing pages and incorporated
          into contributor interactions at checkout.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-hh-dark print:font-bold">
          9. DATA USE &amp; PRIVACY
        </h3>
        <p className="mt-2">
          The publicly posted{" "}
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
          for {BRAND.name} is <strong>incorporated by reference</strong> into this
          Agreement. If there is a conflict between this Section and the Privacy
          policy as to data practices, the Privacy policy controls as to privacy
          matters; this Agreement controls as to commercial and program terms.
        </p>
        <p className="mt-2">Company does not sell personal data.</p>
        <p className="mt-2">Data is used only for:</p>
        <ul className="mt-1 list-outside list-disc pl-5">
          <li>Platform functionality</li>
          <li>Payment processing</li>
          <li>Legal and tax compliance</li>
        </ul>
        <p className="mt-2">
          Company shares personal data with service providers (including, without
          limitation, payment processors such as Stripe, hosting, authentication,
          and messaging vendors) only as needed to operate the platform and as
          described in the Privacy policy. Company retains only data necessary to
          meet legal and financial obligations.
        </p>
        <p className="mt-2">
          The platform may involve minors. Organization represents that it will
          comply with applicable laws regarding participation of minors in
          fundraising and the collection of personal information, including when
          parental or guardian consent is required.
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
          To the fullest extent permitted by law, Company shall not be liable for
          any indirect, incidental, special, consequential, or punitive damages,
          or for lost profits, lost revenue, lost data, or business interruption,
          whether based in contract, tort, strict liability, or otherwise, even if
          advised of the possibility of such damages.
        </p>
        <p className="mt-2">
          Except for claims arising from Company&apos;s gross negligence or
          willful misconduct, Company&apos;s aggregate liability arising out of
          or relating to this Agreement or the Service shall not exceed the
          aggregate service fees actually retained by Company from donations
          processed for Organization&apos;s campaigns during the twelve (12)
          months immediately preceding the event giving rise to the claim. If no
          such fees were retained in that period, this cap shall be zero except
          where a greater limitation is prohibited by applicable law.
        </p>
        <p className="mt-2">
          Company shall not be liable for:
        </p>
        <ul className="mt-1 list-outside list-disc pl-5">
          <li>Participant conduct or misuse of the platform</li>
          <li>Altered or unauthorized communications</li>
          <li>Fundraising performance or outcomes</li>
          <li>Actions of Organization, Organizer, or participants</li>
        </ul>
        <p className="mt-2">
          Company&apos;s liability is otherwise strictly limited to issues
          directly related to the technical functionality of the platform, subject
          to the cap above.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-hh-dark print:font-bold">
          11. INDEMNIFICATION / HOLD HARMLESS
        </h3>
        <p className="mt-2">
          At Company&apos;s request, Organization agrees to defend, indemnify,
          and hold harmless Company, its parent and affiliated entities, and all
          of their respective officers, directors, managers, members,
          shareholders, employees, contractors, agents, licensors, successors,
          and assigns (collectively, the <strong>Indemnified Parties</strong>)
          from and against any and all claims, demands, actions, proceedings,
          investigations, losses, damages, liabilities, judgments, settlements,
          fines, penalties, costs, and expenses (including reasonable
          attorneys&apos; fees and litigation/arbitration costs) arising out of or
          relating to:
        </p>
        <ul className="mt-1 list-outside list-disc pl-5">
          <li>Organization&apos;s or any participant&apos;s breach or alleged breach of this Agreement</li>
          <li>Any act, omission, negligence, willful misconduct, or unlawful conduct by Organization, Organizer, participants, or Organization-authorized users</li>
          <li>Campaign communications, contact uploads, messaging activity, fundraising solicitations, or use of campaign funds</li>
          <li>Violation of law, regulation, school/district policy, or third-party rights (including privacy, publicity, consumer-protection, and messaging laws)</li>
          <li>Inaccuracy, falsity, or misrepresentation in Organization-provided data, eligibility, authority, or compliance representations</li>
          <li>Disputes, complaints, chargebacks, reversals, refunds, or claims connected to Organization campaigns or participant activity</li>
        </ul>
        <p className="mt-2">
          Organization may not settle any indemnified matter, admit fault on
          behalf of any Indemnified Party, or create obligations for any
          Indemnified Party without Company&apos;s prior written consent.
          Company may assume the exclusive defense and control of any matter
          otherwise subject to indemnification, and Organization agrees to
          cooperate fully in that defense.
        </p>
        <p className="mt-2">
          These indemnification obligations are in addition to any other rights
          or remedies available to Company and survive suspension or termination
          of this Agreement.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-hh-dark print:font-bold">
          12. TERM &amp; TERMINATION
        </h3>
        <p className="mt-2">
          This Agreement is effective upon acceptance and continues through the
          fundraiser period. <strong>Either party may terminate this Agreement at
          any time.</strong> Company may immediately terminate for:
        </p>
        <ul className="mt-1 list-outside list-disc pl-5">
          <li>Ineligibility</li>
          <li>Misrepresentation</li>
          <li>Policy violations</li>
        </ul>
        <p className="mt-2">
          If a campaign ends early—whether because Organization or Company
          terminates or for any other reason—the fundraising structure described
          in Section 3 continues to apply to funds that have cleared and are not
          subject to chargeback, hold, or offset under Section 7. Company may delay
          or adjust payout as permitted in Section 7 for fraud, chargebacks,
          investigations, or compliance issues.
        </p>
        <p className="mt-2">
          Funds raised prior to termination will be distributed in accordance
          with this Agreement, subject to the foregoing.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-hh-dark print:font-bold">
          13. ACCOUNT SECURITY &amp; ACCESS
        </h3>
        <p className="mt-2">
          Organization and its Organizer(s) are responsible for maintaining the
          confidentiality of login credentials and for all activities that occur
          under Organization&apos;s accounts. Company is not liable for loss or
          damage arising from unauthorized access due to compromised credentials,
          sharing of passwords, or failure to secure devices. Organization must
          notify Company promptly of any suspected unauthorized use of an account
          or security breach.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-hh-dark print:font-bold">
          14. PLATFORM AVAILABILITY; DISCLAIMER OF WARRANTIES
        </h3>
        <p className="mt-2">
          The Service is provided on an <strong>&quot;as is&quot;</strong> and{" "}
          <strong>&quot;as available&quot;</strong> basis. Company does not
          guarantee uninterrupted, error-free, or secure operation; the Service
          may experience downtime, bugs, delays, or data loss. To the fullest
          extent permitted by law, Company disclaims all warranties, whether express,
          implied, or statutory, including implied warranties of merchantability,
          fitness for a particular purpose, title, and non-infringement. No oral or
          written advice from Company creates any warranty not expressly stated in
          this Agreement.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-hh-dark print:font-bold">
          15. INDEPENDENT RELATIONSHIP
        </h3>
        <p className="mt-2">
          Company is an independent contractor and is not an employee, agent, or
          partner of Organization.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-hh-dark print:font-bold">
          16. GOVERNING LAW
        </h3>
        <p className="mt-2">
          This Agreement shall be governed by the laws of the State of Illinois,
          without regard to conflict-of-law principles.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-hh-dark print:font-bold">
          17. DISPUTE RESOLUTION
        </h3>
        <p className="mt-2">
          <strong>Binding arbitration.</strong> Except for claims that may be
          brought in small claims court where jurisdiction and amount requirements
          are met, any dispute, claim, or controversy arising out of or relating to
          this Agreement or the Service shall be resolved by binding arbitration
          administered by the American Arbitration Association (&quot;AAA&quot;)
          under its Commercial Arbitration Rules. The Federal Arbitration Act
          applies. The seat of arbitration shall be Kankakee County, Illinois.
        </p>
        <p className="mt-2">
          <strong>Class action waiver.</strong> Organization and Company agree
          that each may bring claims against the other only in an individual
          capacity and not as a plaintiff or class member in any purported class,
          collective, or representative proceeding.
        </p>
        <p className="mt-2">
          <strong>Jury trial waiver.</strong> To the fullest extent permitted by
          law, the parties waive any right to a jury trial in any action or
          proceeding arising out of or relating to this Agreement.
        </p>
        <p className="mt-2">
          <strong>Fees.</strong> Each party shall bear its own attorneys&apos; fees
          and costs in connection with any dispute, unless the arbitrator awards
          fees to the prevailing party as permitted under applicable rules and law.
        </p>
        <p className="mt-2">
          Judgment on the arbitration award may be entered in any court of
          competent jurisdiction. Venue for any court proceeding permitted under
          this Section (including to confirm an award) shall be Kankakee County,
          Illinois, unless otherwise required by law.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-hh-dark print:font-bold">
          18. FORCE MAJEURE
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
          19. ELECTRONIC COMMUNICATIONS &amp; CONSENT
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
          terms and privacy practices. Where users have opted in as disclosed on
          the Service, Company may also send consent-based fundraiser reminder SMS
          through its messaging vendors. Organization is responsible for keeping
          contact information accurate. Organization agrees that (i) this
          Agreement and related documents may be accepted and signed
          electronically where offered, and (ii) electronic records and
          notices satisfy any legal requirement that communications be in
          writing, to the extent permitted by applicable law.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-hh-dark print:font-bold">
          20. INTELLECTUAL PROPERTY
        </h3>
        <p className="mt-2">
          Company retains all right, title, and interest in and to the
          platform, software, user interface, documentation, trade names, logos,
          and other materials made available to Organization (the &quot;Company
          IP&quot;), subject only to the limited right for Organization, Organizer,
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
          21. FEEDBACK
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
          22. SEVERABILITY
        </h3>
        <p className="mt-2">
          If any provision of this Agreement is found unenforceable, the
          remaining provisions continue in full force and effect.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-hh-dark print:font-bold">
          23. ACCEPTANCE
        </h3>
        <p className="mt-2">
          To complete enrollment, the Organization will provide the information
          and signatures (including a W-9 and this Agreement as applicable)
          required by Company.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold text-hh-dark print:font-bold">
          24. STATUTORY DISCLOSURES (225 ILCS 460/7)
        </h3>
        <p className="mt-2">
          These disclosures are made to satisfy the Illinois Solicitation for
          Charity Act. Where a dollar amount, target, or campaign window is
          required, the campaign-specific estimates are stated in{" "}
          <strong>Exhibit A — Estimated Budget &amp; Term</strong>, which is
          based on the Organizer&apos;s own good-faith estimate provided at
          signing and forms part of this Agreement.
        </p>

        <h4 className="mt-4 text-sm font-semibold text-slate-800 print:font-bold">
          (a) Methods of Fundraising
        </h4>
        <p className="mt-1">
          Fundraising is conducted through Company&apos;s digital,
          peer-to-peer fundraising platform. Participants affiliated with the
          Organization share personalized donation links and messages with their
          own contacts by text, email, and social media; contributions are made
          online by payment card and processed electronically through Stripe,
          Inc. Company does not conduct door-to-door, telephone, or in-person
          cash solicitation on the Organization&apos;s behalf.
        </p>

        <h4 className="mt-4 text-sm font-semibold text-slate-800 print:font-bold">
          (b) Geographic Scope
        </h4>
        <p className="mt-1">
          Fundraising campaigns are organized and administered from within the
          State of Illinois for Illinois-based organizations. Because
          solicitation occurs online, contributions may be received from donors
          located throughout the United States.
        </p>

        <h4 className="mt-4 text-sm font-semibold text-slate-800 print:font-bold">
          (c) Duration
        </h4>
        <p className="mt-1">
          This Agreement covers a <strong>single fundraising campaign</strong>{" "}
          for the team, club, or activity identified in Exhibit A. The contract
          term is the campaign window stated in Exhibit A (proposed start date
          through proposed end date). Either party may terminate earlier as
          provided in Section 12. A separate written agreement is required for
          each additional campaign. Company files a true and correct copy of
          each active contract with the Illinois Attorney General as required
          by law, including at annual re-registration.
        </p>

        <h4 className="mt-4 text-sm font-semibold text-slate-800 print:font-bold">
          (d) Compensation; Commissions, Salaries &amp; Fees
        </h4>
        <p className="mt-1">
          {feeModel === "keep_100" ? (
            <>
              Company does not retain a percentage of the stated donation.
              Organization receives one hundred percent (100%) of each stated
              gift. Donors pay a separate Electronic Payment Fee as described in
              Section 3, and may add an optional contribution to Company at
              checkout. Company does not use, employ, or pay outside solicitors,
              agents, or commissioned salespeople for the Organization&apos;s
              campaigns; participants are unpaid volunteers of the Organization
              and receive no commission, salary, or fee from Company. No other
              commissions, salaries, or fees are charged by Company or its agents
              or employees in connection with this Agreement, except the donor-paid
              amounts described in Section 3.
            </>
          ) : feeModel === "split_90_10" ? (
            <>
              Company&apos;s only compensation under this Agreement is a{" "}
              <strong>
                service fee equal to ten percent (10%) of the gross funds raised
              </strong>{" "}
              through the Organization&apos;s campaign(s), computed as 10% of
              gross contributions and retained at payout as described in Section
              3. All payment-processing fees are paid by Company out of its 10%
              service fee and are not charged to the Organization or the donor.
              Company does not use, employ, or pay outside solicitors, agents, or
              commissioned salespeople for the Organization&apos;s campaigns;
              participants are unpaid volunteers of the Organization and receive
              no commission, salary, or fee from Company. No other commissions,
              salaries, or fees are charged by Company or its agents or employees
              in connection with this Agreement.
            </>
          ) : (
            <>
              Company&apos;s compensation for a campaign is the structure
              Organization selected on the campaign request and stated in Section
              3 of that campaign&apos;s signed agreement (90/10 split or 100%
              back). Company does not use, employ, or pay outside solicitors,
              agents, or commissioned salespeople for the Organization&apos;s
              campaigns; participants are unpaid volunteers of the Organization
              and receive no commission, salary, or fee from Company.
            </>
          )}
        </p>

        <h4 className="mt-4 text-sm font-semibold text-slate-800 print:font-bold">
          (e) Interested-Party &amp; Vendor Disclosure
        </h4>
        <p className="mt-1">
          Neither Company nor its principals, agents, employees, solicitors, or
          members of their families own an interest in, manage, or act as a
          supplier or vendor of fundraising goods or services purchased for the
          Organization&apos;s campaigns. Payment processing is provided by
          Stripe, Inc., an unaffiliated third party, at Stripe&apos;s standard
          rates, which Company pays from its service fee.
        </p>

        <h4 className="mt-4 text-sm font-semibold text-slate-800 print:font-bold">
          (f) Educational Program Services
        </h4>
        <p className="mt-1">
          Company does not provide educational program services or disseminate
          educational materials as part of its fundraising for the Organization.
          If Company ever proposes to do so, it will first obtain the
          Organization&apos;s written approval.
        </p>

        <h4 className="mt-4 text-sm font-semibold text-slate-800 print:font-bold">
          (g) Recordkeeping &amp; Accountability
        </h4>
        <p className="mt-1">
          Company maintains transaction, payout, and campaign records for each
          fundraiser as described in Sections 7 and 8 and will account to the
          Organization for funds raised and disbursed. A true and correct copy
          of this Agreement is kept on file by both Company and the Organization
          during its term and for at least three (3) years after the related
          solicitation terminates, consistent with 225 ILCS 460/7.
        </p>
      </section>
    </section>
  );
}
