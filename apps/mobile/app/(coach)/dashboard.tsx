import { useCallback, useEffect, useState } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { useFocusEffect } from "expo-router";
import { getApiBase, supabase } from "../../lib/supabase";

export default function CoachDashboardWebScreen() {
  const [uri, setUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buildUri = useCallback(async () => {
    setError(null);
    const { data, error: sessErr } = await supabase.auth.getSession();
    if (sessErr || !data.session) {
      setUri(null);
      setError("Not signed in.");
      return;
    }
    const { access_token, refresh_token } = data.session;
    const base = getApiBase();
    const hash = new URLSearchParams({
      access_token,
      refresh_token,
    }).toString();
    setUri(`${base}/coach/app-bridge#${hash}`);
  }, []);

  useEffect(() => {
    void buildUri();
  }, [buildUri]);

  useFocusEffect(
    useCallback(() => {
      void buildUri();
    }, [buildUri])
  );

  if (error && !uri) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>{error}</Text>
      </View>
    );
  }

  if (!uri) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#C0392B" />
      </View>
    );
  }

  return (
    <WebView
      source={{ uri }}
      style={styles.web}
      startInLoadingState
      scalesPageToFit
      setBuiltInZoomControls={false}
      renderLoading={() => (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#C0392B" />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  web: { flex: 1, backgroundColor: "#f8fafc" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  err: { color: "#b45309", padding: 16, textAlign: "center" },
});
