import { useCallback, useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import GroupManagerPanel from "../../components/group-manager-panel";
import { getSessionUser } from "../../lib/auth-user";
import {
  fetchAthleteViaWebApi,
  fetchLatestAthleteForUser,
} from "../../lib/athlete-profile";
import { supabase } from "../../lib/supabase";

export default function AthleteTeamsTabScreen() {
  const [fundId, setFundId] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const resolveAthleteFundraiser = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    const user = await getSessionUser();
    if (!user) {
      setFundId(null);
      setMessage("Sign in to view group info.");
      setBusy(false);
      return;
    }
    let { athlete, queryError } = await fetchLatestAthleteForUser(user.id);
    if (!athlete) {
      const { data: sess } = await supabase.auth.getSession();
      const tok = sess.session?.access_token;
      if (tok) {
        const api = await fetchAthleteViaWebApi(tok);
        if (api.athlete) athlete = api.athlete;
        else if (api.error && queryError) {
          setMessage(`${queryError}\n${api.error}`);
        }
      }
    }
    if (!athlete?.fundraiser_id) {
      setFundId(null);
      setMessage(
        queryError
          ? `Could not load your team profile (${queryError}).`
          : "No team profile for this login. Join with your team code first."
      );
      setBusy(false);
      return;
    }
    setFundId(String(athlete.fundraiser_id));
    setBusy(false);
  }, []);

  useEffect(() => {
    void resolveAthleteFundraiser();
  }, [resolveAthleteFundraiser]);

  useFocusEffect(
    useCallback(() => {
      void resolveAthleteFundraiser();
    }, [resolveAthleteFundraiser])
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
