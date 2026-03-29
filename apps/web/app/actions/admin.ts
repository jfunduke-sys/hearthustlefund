"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function assertSuperAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const expected = process.env.SUPERADMIN_EMAIL?.toLowerCase().trim();
  if (!user?.email || !expected || user.email.toLowerCase().trim() !== expected) {
    throw new Error("Unauthorized");
  }
  return user;
}

function randomCodeSegment(len: number) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) {
    s += chars[Math.floor(Math.random() * chars.length)]!;
  }
  return s;
}

async function uniqueFundraiserCode(admin: ReturnType<typeof createAdminClient>) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = `HH-${randomCodeSegment(4)}-${randomCodeSegment(4)}`;
    const { data } = await admin
      .from("fundraiser_codes")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (!data) return code;
  }
  throw new Error("Could not generate a unique code");
}

export async function approveAndGenerateCode(requestId: string) {
  const user = await assertSuperAdmin();
  const admin = createAdminClient();
  const { data: req, error: reqErr } = await admin
    .from("school_requests")
    .select("*")
    .eq("id", requestId)
    .single();
  if (reqErr || !req) throw new Error(reqErr?.message || "Request not found");

  const coachEmail = req.admin_email?.trim().toLowerCase();
  if (!coachEmail) {
    throw new Error(
      "School request has no lead coach / contact email. Update the request before approving."
    );
  }

  const code = await uniqueFundraiserCode(admin);
  const { error: codeErr } = await admin.from("fundraiser_codes").insert({
    code,
    created_by: user.id,
    assigned_to_email: coachEmail,
    school_request_id: req.id,
    used: false,
  });
  if (codeErr) throw new Error(codeErr.message);

  const { error: upErr } = await admin
    .from("school_requests")
    .update({ status: "approved", paperwork_returned: true })
    .eq("id", requestId);
  if (upErr) throw new Error(upErr.message);

  revalidatePath("/admin");
  return { code };
}

export async function rejectRequest(requestId: string, notes: string) {
  await assertSuperAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("school_requests")
    .update({ status: "rejected", notes: notes.trim() || null })
    .eq("id", requestId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

function isValidCoachEmail(raw: string) {
  const e = raw.trim().toLowerCase();
  if (!e || e.length > 254) return null;
  // pragmatic email check — coach must use this exact address at signup
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  return e;
}

export async function generateStandaloneCode(assignedEmail: string) {
  const user = await assertSuperAdmin();
  const coachEmail = isValidCoachEmail(assignedEmail);
  if (!coachEmail) {
    throw new Error("Enter a valid coach email. The code only works for that account.");
  }
  const admin = createAdminClient();
  const code = await uniqueFundraiserCode(admin);
  const { error } = await admin.from("fundraiser_codes").insert({
    code,
    created_by: user.id,
    assigned_to_email: coachEmail,
    school_request_id: null,
    used: false,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  return { code };
}

export async function setFundraiserStatus(
  fundraiserId: string,
  status: "active" | "completed" | "cancelled"
) {
  await assertSuperAdmin();
  const admin = createAdminClient();
  const closedAt =
    status === "completed" || status === "cancelled"
      ? new Date().toISOString()
      : null;
  const { error } = await admin
    .from("fundraisers")
    .update({
      status,
      closed_at: status === "active" ? null : closedAt,
    })
    .eq("id", fundraiserId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath(`/admin/fundraisers/${fundraiserId}`);
}

export async function updateFundraiserComplianceNotes(
  fundraiserId: string,
  notes: string
) {
  await assertSuperAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("fundraisers")
    .update({ admin_compliance_notes: notes.trim() || null })
    .eq("id", fundraiserId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath(`/admin/fundraisers/${fundraiserId}`);
}
