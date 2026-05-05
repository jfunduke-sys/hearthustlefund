import { useCallback, useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import GroupManagerPanel from "../../components/group-manager-panel";
import { getSessionUser } from "../../lib/auth-user";
import { supabase } from "../../lib/supabase";

async function coachFundraiserId(userId: string): Promise<string | null> {
  const { data: active } = await supabase
    .from("fundraisers")
    .select("id")
    .eq("coach_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (active?.id) return active.id as string;
  const { data: fallback } = await supabase
    .from("fundraisers")
    .select("id")
    .eq("coach_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (fallback?.id as string | undefined) ?? null;
}

export default function CoachTeamsTabScreen() {
  const [fundId, setFundId] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    const user = await getSessionUser();
    if (!user) {
      setFundId(null);
      setMessage("Not signed in.");
      setBusy(false);
      return;
    }
    const id = await coachFundraiserId(user.id);
    if (!id) {
      setFundId(null);
      setMessage("No fundraiser found for this Organizer account.");
      setBusy(false);
      return;
    }
    setFundId(id);
    setBusy(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  if (busy) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#C0392B" />
      </View>
    );
  }

  if (!fundId) {
    return (
      <View style={styles.pad}>
        <Text style={styles.title}>Teams</Text>
        <Text style={styles.body}>{message ?? "Unable to load campaign."}</Text>
      </View>
    );
  }

  return <GroupManagerPanel fundraiserId={fundId} title="Teams" />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  pad: { flex: 1, padding: 16, backgroundColor: "#f8fafc" },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A1A2E",
    marginBottom: 8,
  },
  body: { fontSize: 15, color: "#475569", lineHeight: 22 },
});
