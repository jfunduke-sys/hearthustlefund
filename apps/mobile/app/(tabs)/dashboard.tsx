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
  Clipboard,
  Platform,
  Image,
  Share,
  Linking,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Swipeable } from "react-native-gesture-handler";
import * as SMS from "expo-sms";
import { useRouter, useFocusEffect } from "expo-router";
import type { Fundraiser } from "@heart-and-hustle/shared";
import {
  athleteDashboardOutreachBannerMessage,
  buildReminderSms,
  formatDisplayDateTime,
  getCampaignDayBanner,
  getCampaignWindowPhase,
  PLATFORM,
} from "@heart-and-hustle/shared";
import { DonationConfetti } from "../../components/donation-confetti";
import {
  fetchAthleteViaWebApi,
  fetchLatestAthleteForUser,
  saveSmsPhoneViaWebApi,
} from "../../lib/athlete-profile";
import { getSessionUser } from "../../lib/auth-user";
import {
  getApiBase,
  hasSupabaseConfig,
  supabase,
  donateUrl,
} from "../../lib/supabase";
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

type Row = {
  athlete: {
    id: string;
    full_name: string;
    unique_link_token: string;
    personal_goal: number | null;
    jersey_number: string | null;
    fundraiser_id: string;
  };
  fundraiser: Pick<
    Fundraiser,
    | "team_name"
    | "school_name"
    | "total_goal"
    | "goal_per_athlete"
    | "expected_participants"
    | "school_logo_url"
    | "team_logo_url"
    | "start_date"
    | "end_date"
  >;
  raisedSelf: number;
  raisedTeam: number;
  allDonations: DonationRow[];
  reminderContacts: ReminderContact[];
};

function fundraiserImpliedPerAthleteGoal(fr: Row["fundraiser"]): number | null {
  const gpa =
    fr.goal_per_athlete != null ? Number(fr.goal_per_athlete) : NaN;
  if (Number.isFinite(gpa) && gpa > 0) return gpa;
  const exp = fr.expected_participants;
  const total = Number(fr.total_goal);
  if (exp != null && exp > 0 && Number.isFinite(total) && total > 0) {
    return total / exp;
  }
  return null;
}

function effectivePersonalGoalForAthlete(
  personalGoal: number | null | undefined,
  fr: Row["fundraiser"]
): number | null {
  const pg = personalGoal != null ? Number(personalGoal) : NaN;
  if (Number.isFinite(pg) && pg > 0) return pg;
  return fundraiserImpliedPerAthleteGoal(fr);
}

const PROGRESS_GRADIENT = ["#C0392B", "#EAB308", "#22C55E"] as const;

function ProgressBarGradient({ pct }: { pct: number }) {
  const w = Math.min(100, Math.max(0, pct));
  return (
    <View style={styles.barBg}>
      <View
        style={{
          width: `${w}%`,
          height: 8,
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <LinearGradient
          colors={[...PROGRESS_GRADIENT]}
          locations={[0, 0.42, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: "100%", height: "100%" }}
        />
      </View>
    </View>
  );
}

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
  const [donateLinkCopied, setDonateLinkCopied] = useState(false);
  const donateLinkCopyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const [smsPhone, setSmsPhone] = useState("");
  const [smsPhoneBusy, setSmsPhoneBusy] = useState(false);
  const [smsPhoneMsg, setSmsPhoneMsg] = useState<string | null>(null);
  /** sms_reminders_opt_in === false from account creation (can opt in again via Save). */
  const [smsDeclinedAtSignup, setSmsDeclinedAtSignup] = useState(false);

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
      setSmsPhone("");
      setSmsPhoneMsg(null);
      setSmsDeclinedAtSignup(false);
      return;
    }

    const smsMeta = user.user_metadata as {
      sms_phone?: string;
      sms_reminders_opt_in?: boolean;
    } | undefined;
    setSmsDeclinedAtSignup(smsMeta?.sms_reminders_opt_in === false);
    if (typeof smsMeta?.sms_phone === "string" && smsMeta.sms_phone) {
      const d = smsMeta.sms_phone.replace(/\D/g, "");
      setSmsPhone(
        d.length === 11 && d.startsWith("1")
          ? d.slice(1, 11)
          : d.length === 10
            ? d
            : ""
      );
    } else {
      setSmsPhone("");
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
      .select(
        "team_name, school_name, total_goal, goal_per_athlete, expected_participants, school_logo_url, team_logo_url, start_date, end_date"
      )
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

    const { data: teamTotalRaw, error: teamTotalErr } = await supabase.rpc(
      "fundraiser_total_raised",
      { p_fundraiser_id: athlete.fundraiser_id }
    );
    if (teamTotalErr && __DEV__) {
      console.warn("[fundraiser_total_raised]", teamTotalErr.message);
    }
    const raisedTeam =
      teamTotalRaw != null && teamTotalRaw !== ""
        ? Number(teamTotalRaw)
        : 0;

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
        setSmsPhone("");
        setSmsPhoneMsg(null);
        setSmsDeclinedAtSignup(false);
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

  useEffect(() => {
    return () => {
      if (donateLinkCopyTimerRef.current != null) {
        clearTimeout(donateLinkCopyTimerRef.current);
      }
    };
  }, []);

  async function saveSmsPhone() {
    setSmsPhoneMsg(null);
    if (!hasSupabaseConfig()) {
      setSmsPhoneMsg("App is missing Supabase config.");
      return;
    }
    const api = getApiBase();
    if (!api?.trim()) {
      setSmsPhoneMsg("Set EXPO_PUBLIC_API_URL to your website URL to save.");
      return;
    }
    const { data: sess } = await supabase.auth.getSession();
    const tok = sess.session?.access_token;
    if (!tok) {
      setSmsPhoneMsg("Not signed in.");
      return;
    }
    setSmsPhoneBusy(true);
    try {
      const res = await saveSmsPhoneViaWebApi(tok, smsPhone);
      if (res.ok) {
        setSmsPhoneMsg(`Saved (${res.phone}).`);
        await supabase.auth.refreshSession();
      } else {
        setSmsPhoneMsg(res.error);
      }
    } finally {
      setSmsPhoneBusy(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function toggleReminder(id: string) {
    setReminderSelected((s) => ({ ...s, [id]: !s[id] }));
  }

  async function removeReminderContact(contactId: string) {
    setReminderStatus(null);
    const { error } = await supabase
      .from("athlete_contacts")
      .delete()
      .eq("id", contactId);
    if (error) {
      setReminderStatus(error.message ?? "Could not remove contact.");
      return;
    }
    setReminderSelected((s) => {
      const next = { ...s };
      delete next[contactId];
      return next;
    });
    void load();
  }

  async function sendReminders() {
    if (!data) return;
    setReminderStatus(null);
    const picked = data.reminderContacts.filter((r) => reminderSelected[r.id]);
    if (picked.length === 0) {
      setReminderStatus("Select at least one contact to remind.");
      return;
    }

    const phase = getCampaignWindowPhase(
      data.fundraiser.start_date,
      data.fundraiser.end_date
    );
    if (phase !== "active") {
      setReminderStatus(
        athleteDashboardOutreachBannerMessage(
          phase,
          data.fundraiser.start_date,
          data.fundraiser.end_date
        )
      );
      return;
    }

    const user = await getSessionUser();
    if (!user) return;

    const team = data.fundraiser.team_name;
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

  const effectiveGoal = effectivePersonalGoalForAthlete(
    data.athlete.personal_goal,
    data.fundraiser
  );
  const selfPct =
    effectiveGoal != null && effectiveGoal > 0
      ? Math.min(100, (data.raisedSelf / effectiveGoal) * 100)
      : null;
  const teamGoal = Number(data.fundraiser.total_goal);
  const teamPct =
    teamGoal > 0 ? Math.min(100, (data.raisedTeam / teamGoal) * 100) : 0;
  const reminderCount = data.reminderContacts.length;
  const headerLogoUri =
    data.fundraiser.team_logo_url?.trim() ||
    data.fundraiser.school_logo_url?.trim() ||
    null;

  const campaignPhase = getCampaignWindowPhase(
    data.fundraiser.start_date,
    data.fundraiser.end_date
  );
  const activeDayBanner =
    campaignPhase === "active"
      ? getCampaignDayBanner(
          data.fundraiser.start_date,
          data.fundraiser.end_date
        )
      : null;

  const personalDonateUrl = donateUrl(data.athlete.unique_link_token);
  const shareText = `Support ${data.athlete.full_name} — ${data.fundraiser.team_name} (${data.fundraiser.school_name}). Give if you can: ${personalDonateUrl}`;
  const enc = encodeURIComponent;
  const shareEmailHref = `mailto:?subject=${enc(
    `Support ${data.athlete.full_name} — ${data.fundraiser.team_name}`
  )}&body=${enc(`${shareText}\n\n— ${PLATFORM.displayName}`)}`;
  const shareSmsHref = `sms:?&body=${enc(shareText)}`;
  const shareXHref = `https://twitter.com/intent/tweet?text=${enc(shareText)}&url=${enc(personalDonateUrl)}`;
  const shareFacebookHref = `https://www.facebook.com/sharer/sharer.php?u=${enc(personalDonateUrl)}`;
  const shareLinkedInHref = `https://www.linkedin.com/sharing/share-offsite/?url=${enc(personalDonateUrl)}`;

  async function openShareHref(href: string) {
    try {
      await Linking.openURL(href);
    } catch {
      /* ignore */
    }
  }

  async function openNativeShareSheet() {
    if (!data) return;
    try {
      await Share.share({
        title: `Support ${data.athlete.full_name}`,
        message: shareText,
        url: Platform.OS === "ios" ? personalDonateUrl : undefined,
      });
    } catch {
      /* dismissed or unavailable */
    }
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
      >
        <View style={styles.headerRow}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.greet}>Hey {data.athlete.full_name}!</Text>
            <Text style={styles.sub}>
              {data.fundraiser.team_name} · {data.fundraiser.school_name}
            </Text>
          </View>
          {headerLogoUri ? (
            <Image
              accessibilityLabel="Team or school logo"
              source={{ uri: headerLogoUri }}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          ) : null}
        </View>
        {celebrationLine ? (
          <Text style={styles.celebration}>{celebrationLine}</Text>
        ) : null}

        {campaignPhase !== "active" ? (
          <View style={styles.campaignWindowBanner}>
            <Text style={styles.campaignWindowBannerText}>
              {athleteDashboardOutreachBannerMessage(
                campaignPhase,
                data.fundraiser.start_date,
                data.fundraiser.end_date
              )}
            </Text>
          </View>
        ) : null}

        {activeDayBanner?.phase === "active" ? (
          <View style={styles.daysLeftPill}>
            <Text style={styles.daysLeftText}>
              {activeDayBanner.daysLeft} day
              {activeDayBanner.daysLeft === 1 ? "" : "s"} left
            </Text>
          </View>
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
          <Text style={styles.cardTitle}>Campaign text reminders</Text>
          {smsDeclinedAtSignup ? (
            <Text style={styles.smsDeclinedHint}>
              You chose not to receive texts when you created your account. Enter
              your number below and tap Save to opt in.
            </Text>
          ) : null}
          <Text style={styles.sectionHint}>
            Optional US mobile for Heart & Hustle SMS nudges during the campaign
            (about every 3 days + last day). Msg & data rates may apply. Reply STOP
            to opt out, HELP for help.
          </Text>
          <TextInput
            style={styles.smsPhoneInput}
            value={smsPhone}
            onChangeText={setSmsPhone}
            keyboardType="phone-pad"
            placeholder="10-digit mobile"
            maxLength={14}
          />
          <Pressable
            style={[
              styles.smsPhoneSave,
              smsPhoneBusy && styles.smsPhoneSaveDisabled,
            ]}
            disabled={smsPhoneBusy}
            onPress={() => void saveSmsPhone()}
          >
            {smsPhoneBusy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.smsPhoneSaveText}>Save number</Text>
            )}
          </Pressable>
          {smsPhoneMsg ? (
            <Text style={styles.smsPhoneFeedback}>{smsPhoneMsg}</Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your progress</Text>
          <Text style={styles.stat}>
            ${data.raisedSelf.toFixed(2)}
            {effectiveGoal != null
              ? ` / $${effectiveGoal.toFixed(2)} goal`
              : ""}
          </Text>
          {effectiveGoal != null ? (
            <ProgressBarGradient pct={selfPct ?? 0} />
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Team total</Text>
          <Text style={styles.stat}>
            ${data.raisedTeam.toFixed(2)} / ${teamGoal.toFixed(2)}
          </Text>
          <ProgressBarGradient pct={teamPct} />
        </View>

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
          People you already texted who have not donated yet — tap the checkmark
          to include them, then send a follow-up. Swipe left on a row to remove
          someone from this list.
        </Text>
        {data.reminderContacts.length === 0 ? (
          <Text style={styles.muted}>
            No reminders due. After you text people from the{" "}
            <Text style={styles.inlineStrong}>Send Messages</Text> tab, they show
            up here when they still have not donated.
          </Text>
        ) : (
          data.reminderContacts.map((item) => {
            const on = Boolean(reminderSelected[item.id]);
            return (
              <Swipeable
                key={item.id}
                friction={2}
                overshootRight={false}
                renderRightActions={() => (
                  <View style={styles.reminderSwipeRemoveWrap}>
                    <Pressable
                      style={styles.reminderSwipeRemoveBtn}
                      onPress={() => void removeReminderContact(item.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${
                        item.contact_name || "contact"
                      } from reminder list`}
                    >
                      <Text style={styles.reminderSwipeRemoveLabel}>Remove</Text>
                    </Pressable>
                  </View>
                )}
              >
                <View>
                  <Pressable
                    style={[styles.reminderRow, on && styles.reminderRowOn]}
                    onPress={() => toggleReminder(item.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                  >
                    <View style={styles.reminderRowMain}>
                      <Text style={styles.reminderName}>
                        {item.contact_name || "Contact"}
                      </Text>
                      <Text style={styles.reminderPhone}>{item.phone_number}</Text>
                    </View>
                    <View style={styles.reminderCheckSlot}>
                      {on ? <Text style={styles.reminderCheckMark}>✓</Text> : null}
                    </View>
                  </Pressable>
                </View>
              </Swipeable>
            );
          })
        )}
        {reminderStatus ? (
          <Text style={styles.reminderStatus}>{reminderStatus}</Text>
        ) : null}
        <Pressable
          style={[
            styles.reminderBtn,
            (data.reminderContacts.length === 0 ||
              campaignPhase !== "active") &&
              styles.reminderBtnDisabled,
          ]}
          onPress={() => void sendReminders()}
          disabled={
            reminderSending ||
            data.reminderContacts.length === 0 ||
            campaignPhase !== "active"
          }
        >
          {reminderSending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.reminderBtnText}>
              Send reminder{reminderCount === 1 ? "" : "s"} to selected
            </Text>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.donateLinkCard,
            pressed && styles.donateLinkCardPressed,
          ]}
          onPress={() => {
            Clipboard.setString(personalDonateUrl);
            if (donateLinkCopyTimerRef.current != null) {
              clearTimeout(donateLinkCopyTimerRef.current);
            }
            setDonateLinkCopied(true);
            donateLinkCopyTimerRef.current = setTimeout(() => {
              setDonateLinkCopied(false);
              donateLinkCopyTimerRef.current = null;
            }, 2200);
          }}
          accessibilityRole="button"
          accessibilityLabel="Copy personal donation link"
        >
          <Text style={styles.donateLinkTitle}>Your donation link</Text>
          <Text style={styles.donateLinkUrl} selectable>
            {personalDonateUrl}
          </Text>
          <Text
            style={[
              styles.donateLinkAction,
              donateLinkCopied && styles.donateLinkActionDone,
            ]}
          >
            {donateLinkCopied ? "Copied to clipboard" : "Tap to copy"}
          </Text>
        </Pressable>

        <View style={styles.shareSection}>
          <Text style={styles.shareHeading}>Share this link</Text>
          <Text style={styles.shareHint}>
            Help spread the word — no donation required. Anyone can use your link
            to contribute during the campaign.
          </Text>
          <View style={styles.shareChips}>
            <Pressable
              style={({ pressed }) => [
                styles.shareChip,
                pressed && styles.shareChipPressed,
              ]}
              onPress={() => void openNativeShareSheet()}
            >
              <Text style={styles.shareChipText}>Share…</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.shareChip,
                pressed && styles.shareChipPressed,
              ]}
              onPress={() => {
                Clipboard.setString(personalDonateUrl);
                if (donateLinkCopyTimerRef.current != null) {
                  clearTimeout(donateLinkCopyTimerRef.current);
                }
                setDonateLinkCopied(true);
                donateLinkCopyTimerRef.current = setTimeout(() => {
                  setDonateLinkCopied(false);
                  donateLinkCopyTimerRef.current = null;
                }, 2200);
              }}
            >
              <Text style={styles.shareChipText}>
                {donateLinkCopied ? "Copied!" : "Copy link"}
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.shareChip,
                pressed && styles.shareChipPressed,
              ]}
              onPress={() => void openShareHref(shareXHref)}
            >
              <Text style={styles.shareChipText}>X</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.shareChip,
                pressed && styles.shareChipPressed,
              ]}
              onPress={() => void openShareHref(shareFacebookHref)}
            >
              <Text style={styles.shareChipText}>Facebook</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.shareChip,
                pressed && styles.shareChipPressed,
              ]}
              onPress={() => void openShareHref(shareLinkedInHref)}
            >
              <Text style={styles.shareChipText}>LinkedIn</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.shareChip,
                pressed && styles.shareChipPressed,
              ]}
              onPress={() => void openShareHref(shareSmsHref)}
            >
              <Text style={styles.shareChipText}>Text</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.shareChip,
                pressed && styles.shareChipPressed,
              ]}
              onPress={() => void openShareHref(shareEmailHref)}
            >
              <Text style={styles.shareChipText}>Email</Text>
            </Pressable>
          </View>
        </View>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  headerTextBlock: { flex: 1, minWidth: 0 },
  headerLogo: {
    width: 63,
    height: 63,
    borderRadius: 13,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
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
  smsPhoneInput: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  smsPhoneSave: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#C0392B",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  smsPhoneSaveDisabled: { opacity: 0.65 },
  smsPhoneSaveText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  smsPhoneFeedback: {
    marginTop: 8,
    fontSize: 13,
    color: "#64748b",
  },
  smsDeclinedHint: {
    marginBottom: 8,
    fontSize: 13,
    lineHeight: 18,
    color: "#92400e",
    backgroundColor: "#fffbeb",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fcd34d",
  },
  campaignWindowBanner: {
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#f59e0b",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  campaignWindowBannerText: {
    fontSize: 14,
    color: "#78350f",
    lineHeight: 20,
  },
  daysLeftPill: {
    alignSelf: "flex-start",
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#6ee7b7",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  daysLeftText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#047857",
  },
  greet: { fontSize: 24, fontWeight: "800", color: "#1A1A2E" },
  sub: { fontSize: 15, color: "#64748b", marginTop: 4 },
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
  row: { color: "#334155", marginBottom: 4 },
  muted: { color: "#64748b", lineHeight: 20 },
  inlineStrong: { fontWeight: "700", color: "#1A1A2E" },
  donateLinkCard: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#C0392B",
    backgroundColor: "#fff",
  },
  donateLinkCardPressed: {
    backgroundColor: "#fef2f2",
    borderColor: "#a93226",
  },
  donateLinkTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  donateLinkUrl: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
    color: "#1A1A2E",
    lineHeight: 17,
  },
  donateLinkAction: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#C0392B",
  },
  donateLinkActionDone: {
    color: "#0f766e",
    fontWeight: "700",
  },
  shareSection: {
    marginTop: 14,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  shareHeading: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  shareHint: {
    marginTop: 6,
    fontSize: 13,
    color: "#64748b",
    lineHeight: 19,
  },
  shareChips: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  shareChip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  shareChipPressed: {
    backgroundColor: "#fff",
    borderColor: "#C0392B",
  },
  shareChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  reminderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 8,
    marginBottom: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  reminderRowOn: { backgroundColor: "#fef3c7", borderColor: "#fcd34d" },
  reminderRowMain: { flex: 1, minWidth: 0, paddingRight: 8 },
  reminderName: { fontWeight: "700", color: "#1A1A2E" },
  reminderPhone: { color: "#64748b", marginTop: 2, fontSize: 14 },
  reminderCheckSlot: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  reminderCheckMark: {
    fontSize: 22,
    fontWeight: "700",
    color: "#C0392B",
  },
  reminderSwipeRemoveWrap: {
    justifyContent: "center",
    backgroundColor: "#fee2e2",
    marginBottom: 6,
    borderRadius: 10,
    overflow: "hidden",
  },
  reminderSwipeRemoveBtn: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 18,
    minWidth: 88,
  },
  reminderSwipeRemoveLabel: {
    color: "#b91c1c",
    fontWeight: "800",
    fontSize: 14,
  },
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
