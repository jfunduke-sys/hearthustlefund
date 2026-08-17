export type SchoolRequestStatus =
  | "pending"
  | "paperwork_sent"
  | "approved"
  | "rejected";

/** School request intake: how the organizer wants to prepare for launch. */
export type KickoffSetupPreference =
  | "virtual_setup"
  | "self_run"
  /** @deprecated Legacy in-person option; retained for older requests. */
  | "hh_rep_in_person";

export type FundraiserStatus = "active" | "completed" | "cancelled";

export interface SchoolRequest {
  id: string;
  school_name: string;
  school_district: string;
  school_street?: string | null;
  school_city?: string | null;
  school_state?: string | null;
  school_zip?: string | null;
  /** Formatted full address (legacy + display). */
  school_address: string;
  /** Sport, club, or activity the fundraiser supports (e.g. varsity football, drama). */
  sport_club_activity?: string | null;
  admin_name: string;
  admin_first_name?: string | null;
  admin_last_name?: string | null;
  admin_email: string;
  admin_phone: string;
  estimated_athletes: number | null;
  /** Good-faith estimated fundraising goal (total gross $) from intake. */
  estimated_goal?: number | null;
  /**
   * Intake: whether the program wants to split the campaign into teams/groups
   * with group managers after approval (Head Organizer completes group setup on the web).
   */
  wants_campaign_groups?: boolean | null;
  paperwork_sent: boolean;
  paperwork_returned: boolean;
  status: SchoolRequestStatus;
  notes: string | null;
  /** Proposed campaign window (from intake; ISO date YYYY-MM-DD). */
  fundraiser_start_date?: string | null;
  fundraiser_end_date?: string | null;
  kickoff_setup_preference?: KickoffSetupPreference | null;
  /**
   * Standard fundraiser terms on the intake form — version string (e.g. "1")
   * when the submitter agreed; see `fundraiser_terms_acknowledged_at`.
   */
  fundraiser_terms_version?: string | null;
  /** When the submitter agreed to the standard fundraiser terms (ISO timestamp). */
  fundraiser_terms_acknowledged_at?: string | null;
  /**
   * Fundraising Services Agreement (main program contract) — doc version, e.g. "3".
   * @see fsa_intake_acknowledged_at
   */
  fsa_intake_version?: string | null;
  /** When the submitter acknowledged the FSA on intake (ISO timestamp). */
  fsa_intake_acknowledged_at?: string | null;
  /** The signed Fundraising Services Agreement for this campaign request. */
  organization_agreement_id?: string | null;
  /** Typed electronic signature (full legal name) captured on this submission (audit). */
  signer_name?: string | null;
  /** Signer title/role captured on this submission (audit). */
  signer_title?: string | null;
  /**
   * Fee structure chosen on intake and locked into the signed agreement:
   * split_90_10 | keep_100.
   */
  fee_model?: import("./fee-model").FeeModel | null;
  created_at: string;
}

/** Human-readable kickoff choice for admin / detail views. */
export function formatKickoffSetupPreference(
  p: KickoffSetupPreference | null | undefined
): string {
  if (p === "virtual_setup") {
    return "Virtual setup meeting (before campaign start)";
  }
  if (p === "self_run") {
    return "Handle our own launch";
  }
  if (p === "hh_rep_in_person") {
    return "In-person kickoff (legacy request)";
  }
  return "—";
}

/** Coach / lead name from split fields, falling back to legacy `admin_name`. */
export function schoolRequestLeadDisplayName(r: SchoolRequest): string {
  const f = r.admin_first_name?.trim();
  const l = r.admin_last_name?.trim();
  if (f || l) return [f, l].filter(Boolean).join(" ");
  return r.admin_name?.trim() || "—";
}

export interface FundraiserCode {
  id: string;
  code: string;
  created_by: string | null;
  /** Coach email that must sign in to redeem (fundraiser admin). Always set on new codes. */
  assigned_to_email: string | null;
  school_request_id: string | null;
  used: boolean;
  used_at: string | null;
  used_by: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface Fundraiser {
  id: string;
  code_used: string | null;
  coach_id: string | null;
  school_name: string;
  team_name: string;
  total_goal: number;
  goal_per_athlete: number | null;
  /** Expected participant count from coach setup (intake or adjusted). */
  expected_participants?: number | null;
  school_logo_url: string | null;
  team_logo_url: string | null;
  start_date: string;
  end_date: string;
  status: FundraiserStatus;
  unique_slug: string;
  /** 7-character athlete team join code (legacy rows may still be 6-digit numeric). */
  join_code: string | null;
  /** SuperAdmin-only notes (tax, legal, internal). */
  admin_compliance_notes?: string | null;
  /** Set when the fundraiser is closed (completed or cancelled). */
  closed_at?: string | null;
  /**
   * When participant auth was unlinked/deleted after end+grace (cron) or
   * SuperAdmin closeout. Idempotency for auto-revoke; not a substitute for status.
   */
  participant_access_revoked_at?: string | null;
  /** Optional copy for public donate page (“About this fundraiser”). */
  donor_page_about?: string | null;
  /**
   * When true, campaign uses `fundraiser_groups` / group managers. Lead Organizer
   * can toggle off on the web dashboard (clears all group data). Copied from intake
   * at fundraiser creation when applicable.
   */
  uses_campaign_groups?: boolean | null;
  /**
   * Pricing model for this campaign.
   * - split_90_10 (default): existing 90% org / 10% H&H
   * - keep_100: no 10% commission; Electronic Payment Fee + optional H&H Support
   */
  fee_model?: import("./fee-model").FeeModel | null;
  created_at: string;
}

export interface Athlete {
  id: string;
  fundraiser_id: string;
  user_id: string | null;
  full_name: string;
  team_name: string;
  jersey_number: string | null;
  personal_goal: number | null;
  /** When true, other participants on the same campaign can see this person in the app team list. */
  show_on_team_roster: boolean;
  unique_link_token: string;
  created_at: string;
}

export interface Donation {
  id: string;
  fundraiser_id: string;
  athlete_id: string;
  stripe_payment_id: string;
  /** Stripe processing fee in cents when known (from balance transaction). */
  stripe_fee_cents?: number | null;
  /**
   * Amount credited to the organization (team progress / payout basis).
   * 90/10: equals total charged. keep_100: org allocation after fee mode.
   */
  amount: number;
  /** Donor-selected gift (keep_100); often equals amount for 90/10. */
  stated_donation_amount?: number | null;
  electronic_payment_fee_amount?: number | null;
  fee_payment_mode?: import("./fee-model").FeePaymentMode | null;
  hh_support_amount?: number | null;
  total_charged_amount?: number | null;
  checkout_payment_method?: import("./fee-model").CheckoutPaymentMethod | null;
  fee_model?: import("./fee-model").FeeModel | null;
  donor_name: string | null;
  donor_email: string | null;
  donor_phone: string | null;
  anonymous: boolean;
  created_at: string;
}

/** SuperAdmin: gross vs Stripe processing fees for one fundraiser. */
export type FundraiserStripeFinancialBreakdown = {
  stripeConfigured: boolean;
  donationCount: number;
  grossDollars: number;
  stripeFeesDollars: number;
  netAfterStripeFeesDollars: number;
  effectiveFeePercentOfGross: number | null;
  unresolvedCount: number;
  resolvedFeeCount: number;
};

export interface AthleteContact {
  id: string;
  athlete_id: string;
  contact_name: string | null;
  phone_number: string;
  /** Digits-only key for deduping per athlete (same as DB). */
  phone_normalized: string;
  texted_at: string | null;
  donated: boolean;
  created_at: string;
}
