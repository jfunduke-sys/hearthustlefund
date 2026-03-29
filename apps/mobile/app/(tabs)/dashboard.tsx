import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  RefreshControl,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import * as SMS from "expo-sms";
import { useRouter, useFocusEffect } from "expo-router";
import {
  buildReminderSms,
  formatDisplayDateTime,
} from "@heart-and-hustle/shared";
import { DonationConfetti } from "../../components/donation-confetti";
import {
  fetchAthleteViaWebApi,
  fetchLatestAthleteForUser,
} from "../../lib/athlete-profile";
import { getSessionUser } from "../../lib/auth-user";
import { hasSupabaseConfig, supabase, donateUrl } from "../../lib/supabase";
import {
  evaluateAndPersistDonationCelebration,
  evaluateAndPersistGoalMilestone,
  randomDonationCelebrationMessage,
} from "../../lib/donation-celebration";

type DonationRow = {
  id: string;
  amount: number;
  donor_name: string | null;
  anonymous: boolean;
  created_at: string;
};

type ReminderContact = {
  id: string;
  contact_name: string | null;
  phone_number: string;
};

type TeamPeer = {
  id: string;
  full_name: string;
  jersey_number: string | null;
};

type Row = {
  athlete: {
    id: string;
    full_name: string;
    unique_link_token: string;
    personal_goal: number | null;
    jersey_number: string | null;
    fundraiser_id: string;
  };
  fundraiser: {
    team_name: string;
    school_name: string;
    total_goal: number;
  };
  raisedSelf: number;
  raisedTeam: number;
  allDonations: DonationRow[];
  reminderContacts: ReminderContact[];
  teamPeers: TeamPeer[];
};

export default function DashboardScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [data, setData] = useState<Row | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [celebrationLine, setCelebrationLine] = useState<string | null>(null);
  const celebrationTokenRef = useRef<string | null>(null);
  const [reminderSelected, setReminderSelected] = useState<Record<string, boolean>>(
    {}
  );
  const [reminderStatus, setReminderStatus] = useState<string | null>(null);
  const [reminderSending, setReminderSending] = useState(false);
  const [profileHelp, setProfileHelp] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!hasSupabaseConfig()) {
      setData(null);
      setProfileHelp(
        "App config: add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to apps/mobile/.env (same project as the website), then restart Expo."
      );
      setShowConfetti(false);
      setCelebrationLine(null);
      setReminderSelected({});
      return;
    }

    const user = await getSessionUser();
    if (!user) {
      setData(null);
      setProfileHelp(null);
      setShowConfetti(false);
      setCelebrationLine(null);
      setReminderSelected({});
      return;
    }

    const { athlete: athleteRaw, queryError } = await fetchLatestAthleteForUser(
      user.id
    );
    let athlete = athleteRaw as Row["athlete"] | undefined;
    let apiFallbackError: string | null = null;
    if (!athlete) {
      const { data: sess } = await supabase.auth.getSession();
      const tok = sess.session?.access_token;
      if (tok) {
        const api = await fetchAthleteViaWebApi(tok);
        apiFallbackError = api.error;
        if (api.athlete) {
          athlete = api.athlete as Row["athlete"];
        }
      }
    }
    if (!athlete) {
      setData(null);
      setShowConfetti(false);
      setCelebrationLine(null);
      setReminderSelected({});
      const bits = [
        queryError ? `Database: ${queryError}` : null,
        apiFallbackError ? `Profile check: ${apiFallbackError}` : null,
      ].filter(Boolean);
      setProfileHelp(
        bits.length > 0
          ? bits.join("\n\n")
          : "No athlete record for this account. Use the same email you used to join the team, or enter your team code again from the home screen. Set EXPO_PUBLIC_API_URL to your Next.js app (http://localhost:3000 in the simulator) so your profile can load if the phone still cannot read the database."
      );
      return;
    }
    setProfileHelp(null);

    const { data: fr } = await supabase
      .from("fundraisers")
      .select("team_name, school_name, total_goal")
      .eq("id", athlete.fundraiser_id)
      .single();

    const { data: selfDons } = await supabase
      .from("donations")
      .select("amount")
      .eq("athlete_id", athlete.id);
    const raisedSelf =
      selfDons?.reduce((s, d) => s + Number(d.amount), 0) ?? 0;

    const donationCelebrate = await evaluateAndPersistDonationCelebration(
      athlete.id,
      raisedSelf
    );
    const pg =
      athlete.personal_goal != null ? Number(athlete.personal_goal) : null;
    const milestone = await evaluateAndPersistGoalMilestone(
      athlete.id,
      raisedSelf,
      pg != null && pg > 0 ? pg : null
    );

    if (milestone) {
      const token = `milestone-${athlete.id}-${milestone.tierIndex}`;
      if (celebrationTokenRef.current !== token) {
        celebrationTokenRef.current = token;
        setShowConfetti(true);
        setCelebrationLine(milestone.message);
      }
    } else if (donationCelebrate) {
      const token = `${athlete.id}:${raisedSelf.toFixed(2)}`;
      if (celebrationTokenRef.current !== token) {
        celebrationTokenRef.current = token;
        setShowConfetti(true);
        setCelebrationLine(randomDonationCelebrationMessage());
      }
    }

    const { data: teamDons } = await supabase
      .from("donations")
      .select("amount")
      .eq("fundraiser_id", athlete.fundraiser_id);
    const raisedTeam =
      teamDons?.reduce((s, d) => s + Number(d.amount), 0) ?? 0;

    const { data: donationsData } = await supabase
      .from("donations")
      .select("id, amount, donor_name, anonymous, created_at")
      .eq("athlete_id", athlete.id)
      .order("created_at", { ascending: false });

    const { data: reminderData } = await supabase
      .from("athlete_contacts")
      .select("id, contact_name, phone_number")
      .eq("athlete_id", athlete.id)
      .eq("donated", false)
      .not("texted_at", "is", null);

    const { data: peerRows, error: peerErr } = await supabase
      .from("athletes")
      .select("id, full_name, jersey_number")
      .eq("fundraiser_id", athlete.fundraiser_id)
      .eq("show_on_team_roster", true)
      .order("full_name");
    if (peerErr && __DEV__) {
      console.warn("[athletes team list]", peerErr.message);
    }

    const allDonations = (donationsData ?? []) as DonationRow[];
    const reminderContacts = (reminderData ?? []) as ReminderContact[];
    const sel: Record<string, boolean> = {};
    for (const r of reminderContacts) sel[r.id] = true;
    setReminderSelected(sel);

    setData({
      athlete,
      fundraiser: fr as Row["fundraiser"],
      raisedSelf,
      raisedTeam,
      allDonations,
      reminderContacts,
      teamPeers: peerErr ? [] : ((peerRows ?? []) as TeamPeer[]),
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (
        event === "SIGNED_IN" ||
        event === "INITIAL_SESSION" ||
        event === "TOKEN_REFRESHED"
      ) {
        void load();
      }
      if (event === "SIGNED_OUT") {
        setData(null);
        setShowConfetti(false);
        setCelebrationLine(null);
        setReminderSelected({});
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  useEffect(() => {
    if (!showConfetti) return;
    const t = setTimeout(() => setShowConfetti(false), 4200);
    return () => clearTimeout(t);
  }, [showConfetti]);

  useEffect(() => {
    if (!celebrationLine) return;
    const t = setTimeout(() => setCelebrationLine(null), 5000);
    return () => clearTimeout(t);
  }, [celebrationLine]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function toggleReminder(id: string) {
    setReminderSelected((s) => ({ ...s, [id]: !s[id] }));
  }

  async function sendReminders() {
    if (!data) return;
    setReminderStatus(null);
    const picked = data.reminderContacts.filter((r) => reminderSelected[r.id]);
    if (picked.length === 0) {
      setReminderStatus("Select at least one contact to remind.");
      return;
    }

    const user = await getSessionUser();
    if (!user) return;

    const { data: fr } = await supabase
      .from("fundraisers")
      .select("team_name")
      .eq("id", data.athlete.fundraiser_id)
      .single();

    const team = fr?.team_name ?? "";
    const link = donateUrl(data.athlete.unique_link_token);

    setReminderSending(true);
    try {
      const ok = await SMS.isAvailableAsync();
      if (!ok) {
        setReminderStatus("SMS is not available on this device.");
        return;
      }
      for (const c of picked) {
        const greeting =
          (c.contact_name || "there").split(" ")[0] ?? "there";
        const body = buildReminderSms({
          contactFirstName: greeting,
          teamName: team,
          donateUrl: link,
        });
        await SMS.sendSMSAsync([c.phone_number], body);
      }
      setReminderStatus("Messages opened — send from your SMS app.");
      void load();
    } catch (e: unknown) {
      setReminderStatus(e instanceof Error ? e.message : "Failed");
    } finally {
      setReminderSending(false);
    }
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>No athlete profile found.</Text>
        {profileHelp ? (
          <Text style={styles.helpText}>{profileHelp}</Text>
        ) : null}
        <Pressable style={styles.btn} onPress={() => router.replace("/")}>
          <Text style={styles.btnText}>Enter team code</Text>
        </Pressable>
      </View>
    );
  }

  const pg = data.athlete.personal_goal
    ? Number(data.athlete.personal_goal)
    : null;
  const selfPct =
    pg && pg > 0 ? Math.min(100, (data.raisedSelf / pg) * 100) : null;
  const teamGoal = Number(data.fundraiser.total_goal);
  const teamPct =
    teamGoal > 0 ? Math.min(100, (data.raisedTeam / teamGoal) * 100) : 0;
  const reminderCount = data.reminderContacts.length;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
      >
        <Text style={styles.greet}>Hey {data.athlete.full_name}! 👋</Text>
        <Text style={styles.sub}>
          {data.fundraiser.team_name} · {data.fundraiser.school_name}
        </Text>
        {celebrationLine ? (
          <Text style={styles.celebration}>{celebrationLine}</Text>
        ) : null}

        {reminderCount > 0 ? (
          <View style={styles.noticeBanner}>
            <Text style={styles.noticeBannerText}>
              🔔 {reminderCount} contact
              {reminderCount === 1 ? "" : "s"} texted before — still need a nudge.
              Send a reminder below.
            </Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your progress</Text>
          <Text style={styles.stat}>
            ${data.raisedSelf.toFixed(2)}
            {pg != null ? ` / $${pg.toFixed(2)} goal` : ""}
          </Text>
          {selfPct != null ? (
            <View style={styles.barBg}>
              <View style={[styles.barFg, { width: `${selfPct}%` }]} />
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Team total</Text>
          <Text style={styles.stat}>
            ${data.raisedTeam.toFixed(2)} / ${teamGoal.toFixed(2)}
          </Text>
          <View style={styles.barBg}>
            <View style={[styles.barFgGold, { width: `${teamPct}%` }]} />
          </View>
        </View>

        <Text style={[styles.section, { marginTop: 4 }]}>Team participants</Text>
        <Text style={styles.sectionHint}>
          People on this campaign who chose to appear on the team list. Coaches
          can turn this on from the web dashboard.
        </Text>
        {data.teamPeers.length === 0 ? (
          <Text style={styles.muted}>
            No one is on the shared list yet, or the list hasn&apos;t loaded.
          </Text>
        ) : (
          data.teamPeers.map((p) => (
            <View key={p.id} style={styles.peerRow}>
              <Text style={styles.peerName}>{p.full_name}</Text>
              {p.jersey_number ? (
                <Text style={styles.peerJersey}>#{p.jersey_number}</Text>
              ) : null}
            </View>
          ))
        )}

        <Text style={styles.section}>Your donations</Text>
        <Text style={styles.sectionHint}>
          Total from your personal link: ${data.raisedSelf.toFixed(2)}
        </Text>
        {data.allDonations.length === 0 ? (
          <Text style={styles.muted}>No donations yet — share your link!</Text>
        ) : (
          data.allDonations.map((d) => (
            <View key={d.id} style={styles.donationRow}>
              <Text style={styles.donationDate}>
                {formatDisplayDateTime(d.created_at)}
              </Text>
              <Text style={styles.donationName}>
                {d.anonymous ? "Anonymous" : d.donor_name ?? "Supporter"}
              </Text>
              <Text style={styles.donationAmt}>
                ${Number(d.amount).toFixed(2)}
              </Text>
            </View>
          ))
        )}

        <Text style={[styles.section, { marginTop: 20 }]}>Reminder texts</Text>
        <Text style={styles.sectionHint}>
          People you already texted who have not donated yet — tap to select, then
          send a follow-up.
        </Text>
        {data.reminderContacts.length === 0 ? (
          <Text style={styles.muted}>
            No reminders due. After you text people from the{" "}
            <Text style={styles.inlineStrong}>Send Messages</Text> tab, they show
            up here when they still have not donated.
          </Text>
        ) : (
          data.reminderContacts.map((item) => (
            <Pressable
              key={item.id}
              style={[
                styles.reminderRow,
                reminderSelected[item.id] && styles.reminderRowOn,
              ]}
              onPress={() => toggleReminder(item.id)}
            >
              <Text style={styles.reminderName}>
                {item.contact_name || "Contact"}
              </Text>
              <Text style={styles.reminderPhone}>{item.phone_number}</Text>
            </Pressable>
          ))
        )}
        {reminderStatus ? (
          <Text style={styles.reminderStatus}>{reminderStatus}</Text>
        ) : null}
        <Pressable
          style={[
            styles.reminderBtn,
            data.reminderContacts.length === 0 && styles.reminderBtnDisabled,
          ]}
          onPress={() => void sendReminders()}
          disabled={reminderSending || data.reminderContacts.length === 0}
        >
          {reminderSending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.reminderBtnText}>
              Send reminder{reminderCount === 1 ? "" : "s"} to selected
            </Text>
          )}
        </Pressable>

        <Text style={styles.linkSmall} selectable>
          Your donation link: {donateUrl(data.athlete.unique_link_token)}
        </Text>
      </ScrollView>
      {showConfetti ? (
        <View style={styles.confettiLayer} pointerEvents="none">
          <DonationConfetti
            count={56}
            origin={{ x: width - 24, y: 14 }}
            explosionSpeed={480}
            fallSpeed={3400}
            fadeOut
            colors={[
              "#C0392B",
              "#e74c3c",
              "#F39C12",
              "#fcd34d",
              "#1A1A2E",
              "#94a3b8",
            ]}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    elevation: 10,
  },
  container: { padding: 20, paddingBottom: 48 },
  center: { flex: 1, justifyContent: "center", padding: 24 },
  helpText: {
    marginTop: 14,
    fontSize: 14,
    color: "#475569",
    lineHeight: 21,
    textAlign: "center",
  },
  celebration: {
    fontSize: 14,
    lineHeight: 20,
    color: "#0f766e",
    fontStyle: "italic",
    marginBottom: 14,
  },
  noticeBanner: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  noticeBannerText: { fontSize: 14, color: "#78350f", lineHeight: 20 },
  greet: { fontSize: 24, fontWeight: "800", color: "#1A1A2E" },
  sub: { fontSize: 15, color: "#64748b", marginTop: 4, marginBottom: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardTitle: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  stat: { fontSize: 20, fontWeight: "800", color: "#1A1A2E", marginTop: 4 },
  barBg: {
    height: 8,
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
    marginTop: 8,
    overflow: "hidden",
  },
  barFg: { height: 8, backgroundColor: "#C0392B", borderRadius: 4 },
  barFgGold: { height: 8, backgroundColor: "#F39C12", borderRadius: 4 },
  section: {
    marginTop: 8,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 4,
    fontSize: 17,
  },
  sectionHint: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 10,
    lineHeight: 18,
  },
  donationRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  donationDate: { fontSize: 11, color: "#94a3b8" },
  donationName: { fontWeight: "600", color: "#1A1A2E", marginTop: 2 },
  donationAmt: { fontWeight: "800", color: "#C0392B", marginTop: 4 },
  peerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  peerName: { fontWeight: "600", color: "#1A1A2E", flex: 1 },
  peerJersey: { fontSize: 14, color: "#64748b", marginLeft: 8 },
  row: { color: "#334155", marginBottom: 4 },
  muted: { color: "#64748b", lineHeight: 20 },
  inlineStrong: { fontWeight: "700", color: "#1A1A2E" },
  linkSmall: { marginTop: 20, fontSize: 11, color: "#94a3b8" },
  reminderRow: {
    padding: 12,
    marginBottom: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  reminderRowOn: { backgroundColor: "#fef3c7", borderColor: "#fcd34d" },
  reminderName: { fontWeight: "700", color: "#1A1A2E" },
  reminderPhone: { color: "#64748b", marginTop: 2, fontSize: 14 },
  reminderStatus: { color: "#b45309", marginVertical: 8, fontSize: 14 },
  reminderBtn: {
    marginTop: 10,
    backgroundColor: "#1A1A2E",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  reminderBtnDisabled: { opacity: 0.45 },
  reminderBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  btn: {
    marginTop: 16,
    backgroundColor: "#C0392B",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700" },
});
