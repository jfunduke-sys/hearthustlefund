-- One signed Fundraising Services Agreement per CAMPAIGN (school request /
-- team/sport), filed with the state PFR. The coach/organizer e-signs on intake;
-- Heart & Hustle countersigns before filing.
create table if not exists public.organization_agreements (
  id uuid primary key default gen_random_uuid(),
  -- Display / filing identity (school or org name the campaign is for).
  organization_name text not null,
  school_state text,
  -- Campaign this contract covers (one request = one filed contract).
  school_name text,
  sport_club_activity text,
  campaign_start_date date,
  campaign_end_date date,
  -- Optional link back to the intake row (set after both inserts).
  school_request_id uuid references public.school_requests (id),
  -- FSA doc version at signing (matches FUNDRAISING_SERVICES_AGREEMENT_DOC_VERSION).
  agreement_version text not null,
  -- Organizer / coach typed electronic signature captured on the request form.
  signer_name text not null,
  signer_title text,
  signer_email text,
  signed_at timestamptz not null default now(),
  signed_ip text,
  signed_user_agent text,
  -- Heart & Hustle countersignature (recorded by SuperAdmin before filing).
  countersigned_by text,
  countersigned_title text,
  countersigned_at timestamptz,
  -- Estimated target GROSS for THIS campaign (225 ILCS 460/7(b)).
  estimated_target_gross numeric(12, 2),
  created_at timestamptz default now()
);

comment on table public.organization_agreements is
  'One signed Fundraising Services Agreement per campaign (school request). Organizer e-signs on intake; Heart & Hustle countersigns before filing with the state.';

-- Service-role only (server actions + admin reads). No anon/authenticated policies.
alter table public.organization_agreements enable row level security;

-- Idempotent column adds if an earlier draft of this migration already ran.
alter table public.organization_agreements
  add column if not exists school_name text,
  add column if not exists sport_club_activity text,
  add column if not exists campaign_start_date date,
  add column if not exists campaign_end_date date,
  add column if not exists school_request_id uuid references public.school_requests (id),
  add column if not exists estimated_target_gross numeric(12, 2);

-- Drop org-level dedupe key if an earlier draft created it.
alter table public.organization_agreements drop column if exists org_key;

alter table public.school_requests
  add column if not exists organization_agreement_id uuid references public.organization_agreements (id),
  add column if not exists signer_name text,
  add column if not exists signer_title text,
  add column if not exists estimated_goal numeric(12, 2);

comment on column public.school_requests.estimated_goal is
  'Good-faith estimated fundraising goal (total gross $) for this campaign; seeds the agreement estimated_target_gross for the 225 ILCS 460/7(b) budget.';
comment on column public.school_requests.organization_agreement_id is
  'Links this campaign request to its own signed Fundraising Services Agreement (one per team/campaign).';
comment on column public.school_requests.signer_name is
  'Typed electronic signature (full legal name) of the organizer/coach on this request (audit).';
comment on column public.school_requests.signer_title is
  'Signer title/role captured on this request submission (audit).';
