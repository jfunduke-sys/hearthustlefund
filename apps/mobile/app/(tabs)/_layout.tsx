import { useEffect, useState } from "react";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { HeaderLogOut } from "../../components/header-log-out";
import { getSessionUser } from "../../lib/auth-user";
import { subscribeSessionPresence } from "../../lib/auth-session-listener";
import { supabase } from "../../lib/supabase";
import { isCoachAccount } from "../../lib/coach-account";

type Branch = "pending" | "coach" | "athlete";

export default function TabsLayout() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(false);
  const [branch, setBranch] = useState<Branch>("pending");

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(!!data.session);
      setReady(true);
    });
    const { data: sub } = subscribeSessionPresence(setSession);
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!ready || !session) {
      setBranch("pending");
      return;
    }
    void (async () => {
      const user = await getSessionUser();
      if (!user) {
        setBranch("athlete");
        return;
      }
      const coach = await isCoachAccount(user.id);
      setBranch(coach ? "coach" : "athlete");
    })();
  }, [ready, session]);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#C0392B" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/" />;
  }

  if (branch === "pending") {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#C0392B" />
      </View>
    );
  }

  if (branch === "coach") {
    return <Redirect href="/(coach)/dashboard" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#C0392B",
        tabBarInactiveTintColor: "#64748b",
        headerStyle: { backgroundColor: "#1A1A2E" },
        headerTintColor: "#fff",
        headerRight: () => <HeaderLogOut />,
        tabBarStyle: { borderTopColor: "#e2e8f0" },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="messages" options={{ title: "Send Messages" }} />
    </Tabs>
  );
}
