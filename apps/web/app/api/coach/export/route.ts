import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const fundraiserId = request.nextUrl.searchParams.get("fundraiserId");
  if (!fundraiserId) {
    return NextResponse.json({ error: "Missing fundraiserId" }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: fr } = await supabase
    .from("fundraisers")
    .select("id, coach_id, team_name")
    .eq("id", fundraiserId)
    .single();

  if (!fr || fr.coach_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: donations, error } = await supabase
    .from("donations")
    .select(
      "created_at, amount, donor_name, donor_email, anonymous, athlete_id"
    )
    .eq("fundraiser_id", fundraiserId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: athletes } = await supabase
    .from("athletes")
    .select("id, full_name")
    .eq("fundraiser_id", fundraiserId);

  const nameByAthlete = new Map(
    (athletes ?? []).map((a) => [a.id as string, a.full_name as string])
  );

  const rows = donations ?? [];
  const header = [
    "date",
    "amount",
    "donor_name",
    "donor_email",
    "anonymous",
    "athlete_name",
  ];
  const lines = [header.join(",")];
  for (const d of rows as {
    created_at: string;
    amount: number;
    donor_name: string | null;
    donor_email: string | null;
    anonymous: boolean;
    athlete_id: string;
  }[]) {
    const athleteName = nameByAthlete.get(d.athlete_id) ?? "";
    const name = d.anonymous ? "" : d.donor_name ?? "";
    const email = d.donor_email ?? "";
    lines.push(
      [
        new Date(d.created_at).toISOString(),
        Number(d.amount).toFixed(2),
        escapeCsv(name),
        escapeCsv(email),
        d.anonymous ? "yes" : "no",
        escapeCsv(athleteName),
      ].join(",")
    );
  }

  const csv = lines.join("\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="donations-${fr.team_name.replace(/[^\w]+/g, "-")}.csv"`,
    },
  });
}

function escapeCsv(s: string) {
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
