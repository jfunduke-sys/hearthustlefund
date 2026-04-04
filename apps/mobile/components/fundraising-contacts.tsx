import { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
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
import { buildInitialFundraisingSms } from "@heart-and-hustle/shared";

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
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<ContactRow[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [pickingContact, setPickingContact] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [coachNeedsParticipant, setCoachNeedsParticipant] = useState(false);
  /** Clears checkmarks when the user switches to a different athlete / fundraiser. */
  const prevAthleteIdRef = useRef<string | null>(null);
  const currentAthleteIdRef = useRef<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) || r.phone.replace(/\D/g, "").includes(q)
    );
  }, [rows, query]);

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
          .select("id")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1);
        currentAthleteId = athleteRows?.[0]?.id ?? null;
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
        setStatus("Contacts permission is required to send texts.");
        setLoading(false);
        return;
      }
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.FirstName,
          Contacts.Fields.MiddleName,
          Contacts.Fields.LastName,
          Contacts.Fields.NamePrefix,
          Contacts.Fields.NameSuffix,
          Contacts.Fields.Nickname,
          Contacts.Fields.Company,
          Contacts.Fields.PhoneNumbers,
        ],
      });
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
    for (const r of filtered) next[r.id] = true;
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
    const picked = filtered.filter((r) => selected[r.id]);
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
      .select("team_name, school_name")
      .eq("id", athlete.fundraiser_id)
      .single();

    const team = fr?.team_name ?? "";
    const school = fr?.school_name ?? "";
    const link = donateUrl(athlete.unique_link_token);
    const now = new Date().toISOString();

    const insertRows = picked
      .map((c) => {
        const phone_normalized = normalizePhoneDigits(c.phone);
        if (!isPlausiblePhoneDigits(phone_normalized)) return null;
        return {
          athlete_id: athlete.id,
          contact_name: c.name,
          phone_number: c.phone,
          phone_normalized,
          texted_at: now,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r != null);

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

      for (const c of picked) {
        const body = buildInitialFundraisingSms({
          athleteFullName: athlete.full_name,
          teamName: team,
          schoolName: school,
          donateUrl: link,
        });
        await SMS.sendSMSAsync([c.phone], body);
      }
      setStatus("Messages composer opened. Send from your SMS app.");
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
      <TextInput
        placeholder="Search contacts (with phone numbers)"
        value={query}
        onChangeText={setQuery}
        style={styles.search}
      />
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
        Swipe left on a row to remove it from this list (your phone contacts are
        unchanged).
      </Text>
      {status ? <Text style={styles.status}>{status}</Text> : null}
      <FlatList
        data={filtered}
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
            {rows.length === 0
              ? "No contacts with phone numbers found. Tap Choose from contacts to pick someone, or swipe down to refresh after updating the Contacts app."
              : "No contacts with phone numbers match your search."}
          </Text>
        }
      />
      <Pressable
        style={styles.btn}
        onPress={() => void saveAndSend()}
        disabled={sending}
      >
        {sending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Save & send texts</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 12, paddingBottom: 12 },
  center: { flex: 1, justifyContent: "center" },
  coachBanner: {
    backgroundColor: "#fef3c7",
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
    color: "#78350f",
    fontSize: 14,
    lineHeight: 20,
  },
  search: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: "#fff",
  },
  addMoreBtn: {
    borderWidth: 2,
    borderColor: "#C0392B",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  addMoreBtnDisabled: { opacity: 0.7 },
  addMoreBtnText: { color: "#C0392B", fontWeight: "700", fontSize: 15 },
  toolbar: { flexDirection: "row", justifyContent: "space-between" },
  link: { color: "#C0392B", fontWeight: "600" },
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
