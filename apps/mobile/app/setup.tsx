import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { NEW_PASSWORD_REQUIREMENT_COPY } from "@heart-and-hustle/shared";
import { getApiBase, supabase } from "../lib/supabase";
import { getPostAuthHrefForCurrentUser } from "../lib/post-auth-route";

function first(v: string | string[] | undefined) {
  if (Array.isArray(v)) return v[0];
  return v;
}

export default function SetupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    fundraiserId?: string | string[];
    schoolName?: string | string[];
    teamName?: string | string[];
  }>();
  const fundraiserId = first(params.fundraiserId);
  const schoolName = first(params.schoolName);
  const teamName = first(params.teamName);
  const [fullName, setFullName] = useState("");
  const [jersey, setJersey] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    if (!fundraiserId || !teamName) {
      setError("Missing fundraiser. Go back and join again.");
      return;
    }
    if (!fullName.trim() || !email.trim()) {
      setError("Please enter your full name and email.");
      return;
    }
    if (password.length < 8) {
      setError(NEW_PASSWORD_REQUIREMENT_COPY);
      return;
    }
    setLoading(true);
    try {
      const base = getApiBase();
      const loginEmail = email.trim().toLowerCase();
      const res = await fetch(`${base}/api/public/athlete-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fundraiserId,
          email: loginEmail,
          password,
          fullName: fullName.trim(),
          teamName: teamName ?? "",
          jerseyNumber: jersey.trim() || null,
        }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error || "Could not create your account.");
      }

      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });
      if (signErr) throw signErr;

      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        throw new Error("Session did not start. Try signing in from the home screen.");
      }

      router.replace(await getPostAuthHrefForCurrentUser());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Setup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>
        {teamName ?? ""} · {schoolName ?? ""}
      </Text>
      <Text style={styles.label}>Full name</Text>
      <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />
      <Text style={styles.label}>Team name (confirm)</Text>
      <TextInput style={styles.input} value={teamName ?? ""} editable={false} />
      <Text style={styles.label}>Jersey number</Text>
      <TextInput style={styles.input} value={jersey} onChangeText={setJersey} />
      <Text style={styles.label}>Email (account)</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Text style={styles.label}>Password</Text>
      <Text style={styles.fieldHint}>{NEW_PASSWORD_REQUIREMENT_COPY}</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
      />
      {error ? <Text style={styles.err}>{error}</Text> : null}
      <Pressable style={styles.btn} onPress={() => void onSubmit()} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Create account &amp; join</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  hint: { fontSize: 15, color: "#64748b", marginBottom: 16 },
  label: { fontWeight: "600", color: "#1A1A2E", marginTop: 10, marginBottom: 4 },
  fieldHint: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 6,
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  err: { color: "#b91c1c", marginTop: 12 },
  btn: {
    marginTop: 20,
    backgroundColor: "#C0392B",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
