import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isValidJoinCodeLookupSegment,
  segmentToStoredJoinCode,
} from "@/lib/join-code";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const segment = params.slug.trim();
  const admin = createAdminClient();
  const base = admin
    .from("fundraisers")
    .select(
      "id, school_name, team_name, school_logo_url, team_logo_url, unique_slug, join_code, status"
    )
    .eq("status", "active");

  const byCode = isValidJoinCodeLookupSegment(segment);
  const key = byCode ? segmentToStoredJoinCode(segment) : segment;
  const { data, error } = byCode
    ? await base.eq("join_code", key).maybeSingle()
    : await base.eq("unique_slug", segment).maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
