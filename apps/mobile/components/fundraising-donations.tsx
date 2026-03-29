import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { getSessionUser } from "../lib/auth-user";
import { supabase } from "../lib/supabase";
import { formatDisplayDateTime } from "@heart-and-hustle/shared";

type D = {
  id: string;
  amount: number;
  donor_name: string | null;
  anonymous: boolean;
  created_at: string;
};

export type FundraisingDonationsVariant = "athlete" | "coach";

type Props = { variant?: FundraisingDonationsVariant };

export default function FundraisingDonationsScreen({
  variant = "athlete",
}: Props) {
  const [rows, setRows] = useState<D[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [noAthlete, setNoAthlete] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const user = await getSessionUser();
    if (!user) {
      setRows([]);
      setTotal(0);
      setNoAthlete(false);
      setLoading(false);
      return;
    }
    const { data: athleteRows, error: athleteErr } = await supabase
      .from("athletes")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);
    const athlete = athleteRows?.[0];
    if (athleteErr || !athlete) {
      setRows([]);
      setTotal(0);
      setNoAthlete(variant === "coach");
      setLoading(false);
      return;
    }
    setNoAthlete(false);
    const { data } = await supabase
      .from("donations")
      .select("id, amount, donor_name, anonymous, created_at")
      .eq("athlete_id", athlete.id)
      .order("created_at", { ascending: false });

    const list = (data ?? []) as D[];
    setRows(list);
    setTotal(list.reduce((s, d) => s + Number(d.amount), 0));
    setLoading(false);
  }, [variant]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

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
          Add yourself as a participant from the Dashboard tab to see
          donations tied to your personal link.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.total}>Total raised: ${total.toFixed(2)}</Text>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.date}>
              {formatDisplayDateTime(item.created_at)}
            </Text>
            <Text style={styles.name}>
              {item.anonymous ? "Anonymous" : item.donor_name ?? "Supporter"}
            </Text>
            <Text style={styles.amt}>${Number(item.amount).toFixed(2)}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.muted}>No donations yet.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  center: { flex: 1, justifyContent: "center" },
  coachHint: {
    color: "#78350f",
    backgroundColor: "#fef3c7",
    padding: 14,
    borderRadius: 10,
    lineHeight: 22,
  },
  total: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A2E",
    marginBottom: 12,
  },
  row: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  date: { fontSize: 12, color: "#94a3b8" },
  name: { fontWeight: "600", color: "#1A1A2E", marginTop: 2 },
  amt: { fontWeight: "800", color: "#C0392B", marginTop: 4 },
  muted: { textAlign: "center", color: "#94a3b8", marginTop: 24 },
});
