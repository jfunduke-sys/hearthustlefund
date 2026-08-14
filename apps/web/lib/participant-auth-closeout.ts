import type { createAdminClient } from "@/lib/supabase/admin";
import { isFundraiserOpenForParticipantAccess } from "@heart-and-hustle/shared";

type AdminClient = ReturnType<typeof createAdminClient>;

/** Participant auth user ids linked to this fundraiser before closeout unlink. */
export async function collectParticipantUserIdsForFundraiser(
  admin: AdminClient,
  fundraiserId: string
): Promise<string[]> {
  const { data, error } = await admin
    .from("athletes")
    .select("user_id")
    .eq("fundraiser_id", fundraiserId)
    .not("user_id", "is", null);
  if (error) throw new Error(error.message);
  const ids = new Set<string>();
  for (const row of data ?? []) {
    const id = row.user_id as string | null;
    if (id) ids.add(id);
  }
  return Array.from(ids);
}

/**
 * Deletes Supabase Auth users who were participants on a closed fundraiser and
 * have no remaining active campaign ties (coach, group manager, or athlete on
 * another active fundraiser). Lets the same email register fresh next campaign.
 */
export async function deleteParticipantAuthUsersAfterCloseout(
  admin: AdminClient,
  participantUserIds: string[]
): Promise<void> {
  if (participantUserIds.length === 0) return;

  const candidates = Array.from(new Set(participantUserIds));
  const superadminEmail = process.env.SUPERADMIN_EMAIL?.toLowerCase().trim();

  const { data: coachRows, error: coachErr } = await admin
    .from("fundraisers")
    .select("coach_id")
    .in("coach_id", candidates);
  if (coachErr) throw new Error(coachErr.message);
  const coachUserIds = new Set(
    (coachRows ?? [])
      .map((r) => r.coach_id as string | null)
      .filter((id): id is string => !!id)
  );

  const { data: athleteLinks, error: linkErr } = await admin
    .from("athletes")
    .select("user_id, fundraiser_id")
    .in("user_id", candidates)
    .not("user_id", "is", null);
  if (linkErr) throw new Error(linkErr.message);

  const linkedFundraiserIds = Array.from(
    new Set(
      (athleteLinks ?? [])
        .map((r) => r.fundraiser_id as string)
        .filter(Boolean)
    )
  );

  const activeFundraiserIds = new Set<string>();
  if (linkedFundraiserIds.length > 0) {
    const { data: activeFr, error: frErr } = await admin
      .from("fundraisers")
      .select("id, status, start_date, end_date")
      .in("id", linkedFundraiserIds)
      .eq("status", "active");
    if (frErr) throw new Error(frErr.message);
    for (const row of activeFr ?? []) {
      if (isFundraiserOpenForParticipantAccess(row)) {
        activeFundraiserIds.add(row.id as string);
      }
    }
  }

  const usersWithActiveAthleteLink = new Set<string>();
  for (const row of athleteLinks ?? []) {
    if (
      row.user_id &&
      activeFundraiserIds.has(row.fundraiser_id as string)
    ) {
      usersWithActiveAthleteLink.add(row.user_id as string);
    }
  }

  const { data: managerRows, error: mgrErr } = await admin
    .from("fundraiser_group_managers")
    .select("user_id, fundraiser_id")
    .in("user_id", candidates);
  if (mgrErr) throw new Error(mgrErr.message);

  const managerFundraiserIds = Array.from(
    new Set(
      (managerRows ?? [])
        .map((r) => r.fundraiser_id as string)
        .filter(Boolean)
    )
  );

  const activeManagerFundraiserIds = new Set<string>();
  if (managerFundraiserIds.length > 0) {
    const { data: activeMgrFr, error: mgrFrErr } = await admin
      .from("fundraisers")
      .select("id, status, start_date, end_date")
      .in("id", managerFundraiserIds)
      .eq("status", "active");
    if (mgrFrErr) throw new Error(mgrFrErr.message);
    for (const row of activeMgrFr ?? []) {
      if (isFundraiserOpenForParticipantAccess(row)) {
        activeManagerFundraiserIds.add(row.id as string);
      }
    }
  }

  const usersWithActiveManagerRole = new Set<string>();
  for (const row of managerRows ?? []) {
    if (
      row.user_id &&
      activeManagerFundraiserIds.has(row.fundraiser_id as string)
    ) {
      usersWithActiveManagerRole.add(row.user_id as string);
    }
  }

  for (const userId of candidates) {
    if (coachUserIds.has(userId)) continue;
    if (usersWithActiveAthleteLink.has(userId)) continue;
    if (usersWithActiveManagerRole.has(userId)) continue;

    if (superadminEmail) {
      const { data: authUser, error: getErr } =
        await admin.auth.admin.getUserById(userId);
      if (getErr) throw new Error(getErr.message);
      const email = authUser.user.email?.toLowerCase().trim();
      if (email && email === superadminEmail) continue;
    }

    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) {
      const msg = delErr.message.toLowerCase();
      if (msg.includes("not found") || msg.includes("does not exist")) continue;
      throw new Error(delErr.message);
    }
  }
}
