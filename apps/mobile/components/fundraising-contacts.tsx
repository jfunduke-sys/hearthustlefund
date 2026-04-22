import { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Swipeable } from "react-native-gesture-handler";
import * as Contacts from "expo-contacts";
import * as SMS from "expo-sms";
import { useFocusEffect } from "expo-router";
import { getSessionUser } from "../lib/auth-user";
import { supabase, donateUrl } from "../lib/supabase";
import {
  hasListablePhoneDigits,
  isPlausiblePhoneDigits,
  normalizePhoneDigits,
} from "../lib/phone";
import type { CampaignWindowPhase } from "@heart-and-hustle/shared";
import {
  buildInitialFundraisingSms,
  campaignOutreachBlockedMessage,
  getCampaignWindowPhase,
} from "@heart-and-hustle/shared";

type ContactRow = {
  id: string;
  name: string;
  phone: string;
};

/** iOS/Android often store given/family name without populating composite `name`. */
function contactDisplayName(c: Contacts.Contact): string {
  const structured = [
    c.namePrefix,
    c.firstName,
    c.middleName,
    c.lastName,
    c.nameSuffix,
  ]
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (structured) return structured;
  const n = (c.name ?? "").trim();
  if (n) return n;
  const nick = (c.nickname ?? "").trim();
  if (nick) return nick;
  const co = (c.company ?? "").trim();
  if (co) return co;
  return "Contact";
}

function rowsFromExistingContact(c: Contacts.ExistingContact): ContactRow[] {
  const name = contactDisplayName(c);
  const out: ContactRow[] = [];
  for (const p of c.phoneNumbers ?? []) {
    const phone = (p.number || "").trim();
    if (!phone) continue;
    const digits = normalizePhoneDigits(phone);
    if (!hasListablePhoneDigits(digits)) continue;
    out.push({ id: `${c.id}-${phone}`, name, phone });
  }
  return out;
}

function mergeContactRows(prev: ContactRow[], added: ContactRow[]): ContactRow[] {
  const byId = new Map<string, ContactRow>();
  for (const r of prev) byId.set(r.id, r);
  for (const r of added) byId.set(r.id, r);
  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
}

const HIDDEN_IDS_PREFIX = "@hh/fundraising_contact_row_hidden/";

/** Fields for list + paging — native APIs may paginate; one page can look like “one contact”. */
const DEVICE_CONTACT_FIELDS: Contacts.FieldType[] = [
  Contacts.Fields.Name,
  Contacts.Fields.FirstName,
  Contacts.Fields.MiddleName,
  Contacts.Fields.LastName,
  Contacts.Fields.NamePrefix,
  Contacts.Fields.NameSuffix,
  Contacts.Fields.Nickname,
  Contacts.Fields.Company,
  Contacts.Fields.PhoneNumbers,
];

/**
 * Loads every page from the OS. A single `getContactsAsync` call can return only the
 * first page (`hasNextPage`) depending on platform defaults.
 */
async function fetchAllDeviceContacts(): Promise<Contacts.ExistingContact[]> {
  const merged: Contacts.ExistingContact[] = [];
  const pageSize = 300;
  let pageOffset = 0;
  for (let i = 0; i < 400; i++) {
    const res = await Contacts.getContactsAsync({
      fields: DEVICE_CONTACT_FIELDS,
      pageSize,
      pageOffset,
    });
    merged.push(...res.data);
    if (!res.hasNextPage) break;
    if (res.data.length === 0) break;
    pageOffset += res.data.length;
  }
  return merged;
}

async function loadHiddenContactRowIds(
  athleteId: string | null
): Promise<Set<string>> {
  if (!athleteId) return new Set();
  try {
    const raw = await AsyncStorage.getItem(`${HIDDEN_IDS_PREFIX}${athleteId}`);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

export type FundraisingContactsVariant = "athlete" | "coach";

type Props = { variant?: FundraisingContactsVariant };

export default function FundraisingContactsScreen({ variant = "athlete" }: Props) {
  const [rows, setRows] = useState<ContactRow[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [pickingContact, setPickingContact] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  /** iOS 18+: user chose “selected contacts only” for this app — OS may expose just a few. */
  const [contactsAccessNote, setContactsAccessNote] = useState<string | null>(null);
  const [coachNeedsParticipant, setCoachNeedsParticipant] = useState(false);
  const [messagingMeta, setMessagingMeta] = useState<{
    phase: CampaignWindowPhase;
    start: string;
    end: string;
  }>({ phase: "active", start: "", end: "" });
  /** Clears checkmarks when the user switches to a different athlete / fundraiser. */
  const prevAthleteIdRef = useRef<string | null>(null);
  const currentAthleteIdRef = useRef<string | null>(null);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    setStatus(null);
    try {
      const { data: sessionWrap } = await supabase.auth.getSession();
      const userId = sessionWrap.session?.user?.id ?? null;

      let currentAthleteId: string | null = null;
      if (userId) {
        const { data: athleteRows } = await supabase
          .from("athletes")
          .select("id, fundraiser_id")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1);
        const ath0 = athleteRows?.[0];
        currentAthleteId = ath0?.id ?? null;
        if (ath0?.fundraiser_id) {
          const { data: fr } = await supabase
            .from("fundraisers")
            .select("start_date, end_date")
            .eq("id", ath0.fundraiser_id)
            .single();
          const s = String(fr?.start_date ?? "");
          const e = String(fr?.end_date ?? "");
          setMessagingMeta({
            phase: getCampaignWindowPhase(s, e),
            start: s,
            end: e,
          });
        } else {
          setMessagingMeta({ phase: "active", start: "", end: "" });
        }
      } else {
        setMessagingMeta({ phase: "active", start: "", end: "" });
      }

      if (prevAthleteIdRef.current !== currentAthleteId) {
        prevAthleteIdRef.current = currentAthleteId;
        setSelected({});
      }
      currentAthleteIdRef.current = currentAthleteId;

      if (variant === "coach") {
        setCoachNeedsParticipant(!currentAthleteId);
      }

      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        setContactsAccessNote(null);
        setStatus("Contacts permission is required to send texts.");
        setLoading(false);
        return;
      }

      const perm = await Contacts.getPermissionsAsync();
      if (perm.accessPrivileges === "limited") {
        setContactsAccessNote(
          Platform.OS === "ios"
            ? "iOS is only sharing the contacts you picked for Expo Go — not your full address book. To change that: Settings → Privacy & Security → Contacts → Expo Go (full access or add contacts)."
            : "This app can only see contacts you allowed. Grant full Contacts access for Expo Go in system settings if the list looks too short."
        );
      } else {
        setContactsAccessNote(null);
      }

      const data = await fetchAllDeviceContacts();
      const out: ContactRow[] = [];
      for (const c of data) {
        out.push(...rowsFromExistingContact(c));
      }
      out.sort((a, b) => a.name.localeCompare(b.name));
      const hidden = await loadHiddenContactRowIds(currentAthleteId);
      setRows(out.filter((r) => !hidden.has(r.id)));
    } catch {
      setStatus("Could not load contacts.");
    } finally {
      setLoading(false);
    }
  }, [variant]);

  useFocusEffect(
    useCallback(() => {
      void loadContacts();
    }, [loadContacts])
  );

  const openContactPicker = useCallback(async () => {
    setStatus(null);
    setPickingContact(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        setStatus("Contacts permission is required.");
        return;
      }
      const picked = await Contacts.presentContactPickerAsync();
      if (!picked) return;

      const newRows = rowsFromExistingContact(picked);
      if (newRows.length === 0) {
        setStatus(
          "That contact has no phone number we can use (need at least 7 digits)."
        );
        return;
      }

      setRows((prev) => mergeContactRows(prev, newRows));
      setSelected((s) => {
        const next = { ...s };
        for (const r of newRows) {
          next[r.id] = true;
        }
        return next;
      });

      const aid = currentAthleteIdRef.current;
      if (aid && newRows.length > 0) {
        try {
          const key = `${HIDDEN_IDS_PREFIX}${aid}`;
          const raw = await AsyncStorage.getItem(key);
          const arr = raw ? (JSON.parse(raw) as string[]) : [];
          if (Array.isArray(arr) && arr.length > 0) {
            const pickedIds = new Set(newRows.map((r) => r.id));
            const nextHidden = arr.filter((id) => !pickedIds.has(id));
            if (nextHidden.length !== arr.length) {
              await AsyncStorage.setItem(key, JSON.stringify(nextHidden));
            }
          }
        } catch {
          /* ignore */
        }
      }
    } catch (e: unknown) {
      setStatus(
        e instanceof Error ? e.message : "Could not open your contacts list."
      );
    } finally {
      setPickingContact(false);
    }
  }, []);

  const onPullRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadContacts();
    } finally {
      setRefreshing(false);
    }
  }, [loadContacts]);

  function toggle(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }

  function selectAll() {
    const next: Record<string, boolean> = {};
    for (const r of rows) next[r.id] = true;
    setSelected(next);
  }

  function deselectAll() {
    setSelected({});
  }

  const hideContactRow = useCallback(async (rowId: string) => {
    setRows((prev) => prev.filter((r) => r.id !== rowId));
    setSelected((s) => {
      const next = { ...s };
      delete next[rowId];
      return next;
    });
    const aid = currentAthleteIdRef.current;
    if (!aid) return;
    try {
      const key = `${HIDDEN_IDS_PREFIX}${aid}`;
      const raw = await AsyncStorage.getItem(key);
      const arr = raw ? (JSON.parse(raw) as string[]) : [];
      if (!Array.isArray(arr)) return;
      if (!arr.includes(rowId)) {
        arr.push(rowId);
        await AsyncStorage.setItem(key, JSON.stringify(arr));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const selectedCount = Object.values(selected).filter(Boolean).length;

  async function saveAndSend() {
    setStatus(null);
    const picked = rows.filter((r) => selected[r.id]);
    if (picked.length === 0) {
      setStatus("Select at least one contact.");
      return;
    }

    const user = await getSessionUser();
    if (!user) {
      setStatus("Not signed in.");
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
      setStatus(
        variant === "coach"
          ? "Add yourself as a participant from the Dashboard tab first (coach tools), then return here."
          : "No athlete profile."
      );
      return;
    }

    const { data: fr } = await supabase
      .from("fundraisers")
      .select("team_name, school_name, start_date, end_date")
      .eq("id", athlete.fundraiser_id)
      .single();

    const winPhase = getCampaignWindowPhase(
      String(fr?.start_date ?? ""),
      String(fr?.end_date ?? "")
    );
    if (winPhase !== "active") {
      setStatus(
        campaignOutreachBlockedMessage(
          winPhase,
          String(fr?.start_date ?? ""),
          String(fr?.end_date ?? "")
        )
      );
      return;
    }

    const team = fr?.team_name ?? "";
    const school = fr?.school_name ?? "";
    const link = donateUrl(athlete.unique_link_token);
    const now = new Date().toISOString();

    type ContactUpsertRow = {
      athlete_id: string;
      contact_name: string;
      phone_number: string;
      phone_normalized: string;
      texted_at: string;
    };

    const mapped = picked.map((c) => {
      const phone_normalized = normalizePhoneDigits(c.phone);
      if (!isPlausiblePhoneDigits(phone_normalized)) return null;
      return {
        athlete_id: athlete.id,
        contact_name: c.name,
        phone_number: c.phone,
        phone_normalized,
        texted_at: now,
      } satisfies ContactUpsertRow;
    });

    const validRows = mapped.filter(
      (r): r is ContactUpsertRow => r != null
    );
    const invalidPickCount = picked.length - validRows.length;

    /** One DB row per (athlete, normalized phone); duplicates in the picker collapse here. */
    const byNormalized = new Map<string, ContactUpsertRow>();
    for (const r of validRows) {
      if (!byNormalized.has(r.phone_normalized)) byNormalized.set(r.phone_normalized, r);
    }
    const insertRows = Array.from(byNormalized.values());
    const duplicateNormalizedCount = validRows.length - insertRows.length;

    if (insertRows.length === 0) {
      setStatus("Selected contacts need a valid phone (at least 10 digits).");
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.from("athlete_contacts").upsert(insertRows, {
        onConflict: "athlete_id,phone_normalized",
      });
      if (error) throw error;

      const isAvailable = await SMS.isAvailableAsync();
      if (!isAvailable) {
        setStatus("SMS is not available on this device.");
        return;
      }

      const body = buildInitialFundraisingSms({
        athleteFullName: athlete.full_name,
        teamName: team,
        schoolName: school,
        donateUrl: link,
      });
      /** Match DB: one composer per unique normalized number (not per picker row). */
      for (const row of insertRows) {
        await SMS.sendSMSAsync([row.phone_number], body);
      }
      const parts = [
        "Done — separate private texts for each person. (Tap Send in Messages for each one when prompted.)",
      ];
      if (invalidPickCount > 0) {
        parts.push(
          invalidPickCount === 1
            ? "1 pick was skipped (phone did not look valid)."
            : `${invalidPickCount} picks were skipped (phones did not look valid).`
        );
      }
      if (duplicateNormalizedCount > 0) {
        parts.push(
          duplicateNormalizedCount === 1
            ? "1 pick was the same number as another — one logged text."
            : `${duplicateNormalizedCount} picks were the same number as another — one logged text per unique number.`
        );
      }
      setStatus(parts.join(" "));
      setSelected({});
    } catch (e: unknown) {
      setStatus(e instanceof Error ? e.message : "Failed");
    } finally {
      setSending(false);
    }
  }

  if (loading && rows.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#C0392B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {variant === "coach" && coachNeedsParticipant ? (
        <Text style={styles.coachBanner}>
          Add yourself as a participant on your campaign from the Dashboard tab.
          You&apos;ll get a personal donate link for texts, same as athletes.
        </Text>
      ) : null}
      {messagingMeta.phase !== "active" ? (
        <Text style={styles.windowBanner}>
          {campaignOutreachBlockedMessage(
            messagingMeta.phase,
            messagingMeta.start,
            messagingMeta.end
          )}
        </Text>
      ) : null}
      {contactsAccessNote ? (
        <Text style={styles.accessBanner}>{contactsAccessNote}</Text>
      ) : null}
      <Pressable
        style={[styles.addMoreBtn, pickingContact && styles.addMoreBtnDisabled]}
        onPress={() => void openContactPicker()}
        disabled={pickingContact}
      >
        {pickingContact ? (
          <ActivityIndicator color="#C0392B" />
        ) : (
          <Text style={styles.addMoreBtnText}>Choose from contacts</Text>
        )}
      </Pressable>
      <Text style={styles.listIntro}>
        Tap <Text style={styles.listIntroStrong}>Choose from contacts</Text> to pick
        people from your Contacts app, or select rows below (from numbers shared with
        this app). No one is added to the fundraiser until you check them and send.
      </Text>
      <View style={styles.toolbar}>
        <Pressable onPress={selectAll}>
          <Text style={styles.link}>Select all</Text>
        </Pressable>
        <Pressable onPress={deselectAll}>
          <Text style={styles.link}>Deselect all</Text>
        </Pressable>
      </View>
      <Text style={styles.count}>{selectedCount} contacts selected</Text>
      <Text style={styles.countHint}>
        Swipe left to hide someone from this screen only (they stay in your Contacts
        app). Send to contacts opens a private text per person (not a group chat).
        Your phone will open Messages once per contact — tap Send each time.
      </Text>
      {status ? <Text style={styles.status}>{status}</Text> : null}
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onPullRefresh()}
            tintColor="#C0392B"
          />
        }
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
                    onPress={() => void hideContactRow(item.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${item.name} from list`}
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
                    <Text style={styles.name} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.phone} numberOfLines={1}>
                      {item.phone}
                    </Text>
                  </View>
                  <View style={styles.checkSlot}>
                    {on ? <Text style={styles.checkMark}>✓</Text> : null}
                  </View>
                </Pressable>
              </View>
            </Swipeable>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.muted}>
            No contacts loaded here yet. Tap Choose from contacts to pick people
            from your address book, or pull down to refresh if your phone shares a
            contact list with this app.
          </Text>
        }
      />
      <Pressable
        style={styles.btn}
        onPress={() => void saveAndSend()}
        disabled={sending || messagingMeta.phase !== "active"}
      >
        {sending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Send to contacts</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 12, paddingBottom: 12 },
  center: { flex: 1, justifyContent: "center" },
  windowBanner: {
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#f59e0b",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    color: "#78350f",
    fontSize: 14,
    lineHeight: 20,
  },
  coachBanner: {
    backgroundColor: "#fef3c7",
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
    color: "#78350f",
    fontSize: 14,
    lineHeight: 20,
  },
  accessBanner: {
    backgroundColor: "#e0f2fe",
    borderWidth: 1,
    borderColor: "#7dd3fc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    color: "#0c4a6e",
    fontSize: 13,
    lineHeight: 18,
  },
  addMoreBtn: {
    borderWidth: 2,
    borderColor: "#C0392B",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  addMoreBtnDisabled: { opacity: 0.7 },
  addMoreBtnText: { color: "#C0392B", fontWeight: "700", fontSize: 15 },
  toolbar: { flexDirection: "row", justifyContent: "space-between" },
  link: { color: "#C0392B", fontWeight: "600" },
  listIntro: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
    marginBottom: 8,
  },
  listIntroStrong: { fontWeight: "800", color: "#1A1A2E" },
  count: { marginVertical: 6, color: "#64748b" },
  countHint: {
    fontSize: 12,
    color: "#94a3b8",
    lineHeight: 17,
    marginBottom: 4,
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
  status: { color: "#b45309", marginBottom: 6 },
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
  muted: { textAlign: "center", color: "#94a3b8", marginTop: 24 },
  btn: {
    marginTop: 8,
    backgroundColor: "#C0392B",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
