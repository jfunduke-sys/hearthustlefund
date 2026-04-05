import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import * as SMS from "expo-sms";
import { useFocusEffect } from "expo-router";
import { getSessionUser } from "../lib/auth-user";
import { supabase, donateUrl } from "../lib/supabase";
import type { CampaignWindowPhase } from "@heart-and-hustle/shared";
import {
  athleteDashboardOutreachBannerMessage,
  buildReminderSms,
  campaignOutreachBlockedMessage,
  getCampaignWindowPhase,
} from "@heart-and-hustle/shared";

type Row = {
  id: string;
  contact_name: string | null;
  phone_number: string;
};

export type FundraisingRemindersVariant = "athlete" | "coach";

type Props = { variant?: FundraisingRemindersVariant };

export default function FundraisingRemindersScreen({
  variant = "athlete",
}: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [noAthlete, setNoAthlete] = useState(false);
  const [messagingMeta, setMessagingMeta] = useState<{
    phase: CampaignWindowPhase;
    start: string;
    end: string;
  }>({ phase: "active", start: "", end: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const user = await getSessionUser();
    if (!user) {
      setRows([]);
      setNoAthlete(false);
      setMessagingMeta({ phase: "active", start: "", end: "" });
      setLoading(false);
      return;
    }
    const { data: athleteRows, error: athleteErr } = await supabase
      .from("athletes")
      .select("id, full_name, unique_link_token, fundraiser_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);
    const athlete = athleteRows?.[0];
    if (athleteErr || !athlete) {
      setRows([]);
      setNoAthlete(variant === "coach");
      setMessagingMeta({ phase: "active", start: "", end: "" });
      setLoading(false);
      return;
    }
    setNoAthlete(false);

    const { data: fr } = await supabase
      .from("fundraisers")
      .select("start_date, end_date")
      .eq("id", athlete.fundraiser_id)
      .single();
    const s = String(fr?.start_date ?? "");
    const e = String(fr?.end_date ?? "");
    setMessagingMeta({
      phase: getCampaignWindowPhase(s, e),
      start: s,
      end: e,
    });

    const { data } = await supabase
      .from("athlete_contacts")
      .select("id, contact_name, phone_number")
      .eq("athlete_id", athlete.id)
      .eq("donated", false)
      .not("texted_at", "is", null);

    setRows((data ?? []) as Row[]);
    const sel: Record<string, boolean> = {};
    for (const r of data ?? []) sel[r.id] = true;
    setSelected(sel);
    setLoading(false);
  }, [variant]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  function toggle(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }

  async function removeRow(contactId: string) {
    setStatus(null);
    const { error } = await supabase
      .from("athlete_contacts")
      .delete()
      .eq("id", contactId);
    if (error) {
      setStatus(error.message ?? "Could not remove contact.");
      return;
    }
    setSelected((s) => {
      const next = { ...s };
      delete next[contactId];
      return next;
    });
    void load();
  }

  async function sendReminders() {
    setStatus(null);
    const picked = rows.filter((r) => selected[r.id]);
    if (picked.length === 0) {
      setStatus("Select contacts to remind.");
      return;
    }

    const user = await getSessionUser();
    if (!user) return;
    const { data: athleteRows, error: athleteErr } = await supabase
      .from("athletes")
      .select("full_name, unique_link_token, fundraiser_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);
    const athlete = athleteRows?.[0];
    if (athleteErr || !athlete) return;

    const { data: fr } = await supabase
      .from("fundraisers")
      .select("team_name, start_date, end_date")
      .eq("id", athlete.fundraiser_id)
      .single();

    const winPhase = getCampaignWindowPhase(
      String(fr?.start_date ?? ""),
      String(fr?.end_date ?? "")
    );
    if (winPhase !== "active") {
      setStatus(
        variant === "athlete"
          ? athleteDashboardOutreachBannerMessage(
              winPhase,
              String(fr?.start_date ?? ""),
              String(fr?.end_date ?? "")
            )
          : campaignOutreachBlockedMessage(
              winPhase,
              String(fr?.start_date ?? ""),
              String(fr?.end_date ?? "")
            )
      );
      return;
    }

    const team = fr?.team_name ?? "";
    const link = donateUrl(athlete.unique_link_token);

    setSending(true);
    try {
      const ok = await SMS.isAvailableAsync();
      if (!ok) {
        setStatus("SMS not available.");
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
      setStatus("Reminder composer opened.");
    } catch (e: unknown) {
      setStatus(e instanceof Error ? e.message : "Failed");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#C0392B" />
      </View>
    );
  }

  if (variant === "coach" && noAthlete) {
    return (
      <View style={styles.container}>
        <Text style={styles.coachHint}>
          Add yourself as a participant from the Dashboard tab to use reminders
          with your personal link.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {messagingMeta.phase !== "active" ? (
        <Text style={styles.windowBanner}>
          {variant === "athlete"
            ? athleteDashboardOutreachBannerMessage(
                messagingMeta.phase,
                messagingMeta.start,
                messagingMeta.end
              )
            : campaignOutreachBlockedMessage(
                messagingMeta.phase,
                messagingMeta.start,
                messagingMeta.end
              )}
        </Text>
      ) : null}
      <Text style={styles.head}>
        These contacts haven&apos;t donated yet (and were texted before).
      </Text>
      {rows.length === 0 ? (
        <Text style={styles.muted}>No reminder targets yet.</Text>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const on = Boolean(selected[item.id]);
            return (
              <Swipeable
                friction={2}
                overshootRight={false}
                renderRightActions={() => (
                  <View style={styles.swipeRemoveWrap}>
                    <Pressable
                      style={styles.swipeRemoveBtn}
                      onPress={() => void removeRow(item.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${
                        item.contact_name || "contact"
                      } from reminder list`}
                    >
                      <Text style={styles.swipeRemoveLabel}>Remove</Text>
                    </Pressable>
                  </View>
                )}
              >
                <View>
                  <Pressable
                    style={[styles.row, on && styles.rowOn]}
                    onPress={() => toggle(item.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                  >
                    <View style={styles.rowMain}>
                      <Text style={styles.name}>
                        {item.contact_name || "Contact"}
                      </Text>
                      <Text style={styles.phone}>{item.phone_number}</Text>
                    </View>
                    <View style={styles.checkSlot}>
                      {on ? <Text style={styles.checkMark}>✓</Text> : null}
                    </View>
                  </Pressable>
                </View>
              </Swipeable>
            );
          }}
        />
      )}
      {status ? <Text style={styles.status}>{status}</Text> : null}
      <Pressable
        style={styles.btn}
        onPress={() => void sendReminders()}
        disabled={
          sending || rows.length === 0 || messagingMeta.phase !== "active"
        }
      >
        {sending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Send reminders</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  center: { flex: 1, justifyContent: "center" },
  windowBanner: {
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#f59e0b",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    color: "#78350f",
    fontSize: 14,
    lineHeight: 20,
  },
  coachHint: {
    color: "#78350f",
    backgroundColor: "#fef3c7",
    padding: 14,
    borderRadius: 10,
    lineHeight: 22,
  },
  head: { color: "#475569", marginBottom: 12 },
  muted: { textAlign: "center", color: "#94a3b8", marginTop: 24 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  rowOn: { backgroundColor: "#fef3c7" },
  rowMain: { flex: 1, minWidth: 0, paddingRight: 8 },
  name: { fontWeight: "700", color: "#1A1A2E" },
  phone: { color: "#64748b", marginTop: 2 },
  checkSlot: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: {
    fontSize: 22,
    fontWeight: "700",
    color: "#C0392B",
  },
  swipeRemoveWrap: {
    justifyContent: "center",
    backgroundColor: "#fee2e2",
  },
  swipeRemoveBtn: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 18,
    minWidth: 88,
  },
  swipeRemoveLabel: {
    color: "#b91c1c",
    fontWeight: "800",
    fontSize: 14,
  },
  status: { color: "#b45309", marginVertical: 8 },
  btn: {
    marginTop: 8,
    backgroundColor: "#1A1A2E",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "800" },
});
