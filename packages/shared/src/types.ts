export type SchoolRequestStatus =
  | "pending"
  | "paperwork_sent"
  | "approved"
  | "rejected";

/** School request intake: who runs the on-site fundraiser kickoff. */
export type KickoffSetupPreference = "hh_rep_in_person" | "self_run";

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
  created_at: string;
}

/** Human-readable kickoff choice for admin / detail views. */
export function formatKickoffSetupPreference(
  p: KickoffSetupPreference | null | undefined
): string {
  if (p === "hh_rep_in_person") {
    return "In-person kickoff with a Heart & Hustle rep (on-site setup & launch)";
  }
  if (p === "self_run") {
    return "We'll handle our own kickoff (no HH rep on-site)";
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
  /** Optional copy for public donate page (“About this fundraiser”). */
  donor_page_about?: string | null;
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
  amount: number;
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
