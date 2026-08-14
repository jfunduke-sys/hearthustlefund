import { isPastParticipantAccessGrace } from "@heart-and-hustle/shared";
import { revokeParticipantAccessForFundraiser } from "@/lib/participant-auth-closeout";
import { createAdminClient } from "@/lib/supabase/admin";

export type ParticipantAccessRevokeRunResult = {
  fundraisersScanned: number;
  fundraisersRevoked: number;
  participantsUnlinked: number;
  errors: string[];
};

/**
 * For active fundraisers past end_date + 1 calendar day (Central) where SuperAdmin
 * has not closed out (and auth not yet revoked): unlink/delete participant logins.
 * Does not mark the campaign completed — payouts may still be pending.
 * Extending end_date before this runs keeps access; after revoke, athletes must re-join.
 */
export async function runParticipantAccessRevoke(): Promise<ParticipantAccessRevokeRunResult> {
  const admin = createAdminClient();
  const result: ParticipantAccessRevokeRunResult = {
    fundraisersScanned: 0,
    fundraisersRevoked: 0,
    participantsUnlinked: 0,
    errors: [],
  };

  const { data: rows, error } = await admin
    .from("fundraisers")
    .select("id, end_date, participant_access_revoked_at, school_name, team_name")
    .eq("status", "active")
    .is("participant_access_revoked_at", null);

  if (error) throw new Error(error.message);

  const due = (rows ?? []).filter((r) =>
    isPastParticipantAccessGrace(String(r.end_date ?? ""))
  );
  result.fundraisersScanned = due.length;

  for (const fr of due) {
    const id = fr.id as string;
    const label = `${fr.school_name ?? "?"} / ${fr.team_name ?? "?"} (${id})`;
    try {
      const { participantUserCount } = await revokeParticipantAccessForFundraiser(
        admin,
        id,
        { deleteContacts: false }
      );
      result.fundraisersRevoked += 1;
      result.participantsUnlinked += participantUserCount;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      result.errors.push(`${label}: ${msg}`);
    }
  }

  return result;
}
