import { useEffect, useState } from "react";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { HeaderLogOut } from "../../components/header-log-out";
import { getSessionUser } from "../../lib/auth-user";
import { subscribeSessionPresence } from "../../lib/auth-session-listener";
import { supabase } from "../../lib/supabase";
import { isCoachAccount } from "../../lib/coach-account";

export default function CoachTabsLayout() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(false);
  const [isCoach, setIsCoach] = useState<boolean | null>(null);

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
      setIsCoach(null);
      return;
    }
    void (async () => {
      const user = await getSessionUser();
      if (!user) {
        setIsCoach(false);
        return;
      }
      setIsCoach(await isCoachAccount(user.id));
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

  if (isCoach === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#C0392B" />
      </View>
    );
  }

  if (!isCoach) {
    return <Redirect href="/(tabs)/dashboard" />;
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
      <Tabs.Screen name="text" options={{ title: "Text" }} />
      <Tabs.Screen name="reminders" options={{ title: "Reminders" }} />
      <Tabs.Screen name="donations" options={{ title: "Donations" }} />
    </Tabs>
  );
}
