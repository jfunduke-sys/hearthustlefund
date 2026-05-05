import { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NEW_PASSWORD_REQUIREMENT_COPY } from "@heart-and-hustle/shared";
import { getApiBase, supabase } from "../lib/supabase";
import { getPostAuthHrefForCurrentUser } from "../lib/post-auth-route";

function first(v: string | string[] | undefined) {
  if (Array.isArray(v)) return v[0];
  return v;
}

export default function SetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  /** Stack header (~44) + status bar — keeps focused fields above keyboard on iOS. */
  const keyboardVerticalOffset =
    Platform.OS === "ios" ? insets.top + 52 : 0;
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

  const fullNameRef = useRef<TextInput>(null);
  const jerseyRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
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
    Keyboard.dismiss();
    setLoading(true);
    try {
      const base = getApiBase();
      const loginEmail = email.trim().toLowerCase();

      let res: Response;
      try {
        res = await fetch(`${base}/api/public/athlete-signup`, {
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
      } catch (fetchErr) {
        const msg =
          fetchErr instanceof Error ? fetchErr.message.toLowerCase() : "";
        const looksNetwork =
          msg.includes("network") ||
          msg.includes("internet") ||
          msg.includes("failed to fetch") ||
          msg.includes("not available") ||
          msg.includes("unreachable");
        throw new Error(
          looksNetwork
            ? "Couldn't reach the server. Check Wi‑Fi or cellular data. If you already tapped Create once, your account may still exist—go back, open the Sign in tab, and try this email and password before creating again."
            : "Could not reach the server. Try again in a moment."
        );
      }

      const payload = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(payload.error || "Could not create your account.");
      }

      // Clear any partial/stale GoTrue session in AsyncStorage so auto-refresh does not
      // run against a missing or invalid refresh token (common after reinstall / Expo Go).
      await supabase.auth.signOut({ scope: "local" });

      const { data: signInData, error: signErr } =
        await supabase.auth.signInWithPassword({
          email: loginEmail,
          password,
        });
      if (signErr) {
        const sm = signErr.message.toLowerCase();
        const looksNetwork =
          sm.includes("network") ||
          sm.includes("fetch") ||
          sm.includes("internet") ||
          sm.includes("not available") ||
          sm.includes("unreachable");
        throw new Error(
          looksNetwork
            ? "Your account may be ready, but we couldn't finish signing in (connection issue). Go back, open the Sign in tab, and use this same email and password—do not create the account again."
            : `Couldn't sign you in (${signErr.message}). Try the Sign in tab with this email and password.`
        );
      }
      if (!signInData.session) {
        throw new Error(
          "Session did not start. Open the Sign in tab and use this email and password."
        );
      }

      router.replace(await getPostAuthHrefForCurrentUser());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Setup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
      >
        <Text style={styles.hint}>
          {teamName ?? ""} · {schoolName ?? ""}
        </Text>
        <Text style={styles.label}>Full name</Text>
        <TextInput
          ref={fullNameRef}
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          textContentType="name"
          autoComplete="name"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => jerseyRef.current?.focus()}
        />
        <Text style={styles.label}>Team name (confirm)</Text>
        <TextInput style={styles.input} value={teamName ?? ""} editable={false} />
        <Text style={styles.label}>Jersey number</Text>
        <TextInput
          ref={jerseyRef}
          style={styles.input}
          value={jersey}
          onChangeText={setJersey}
          textContentType="none"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => emailRef.current?.focus()}
        />
        <Text style={styles.label}>Email (account)</Text>
        <TextInput
          ref={emailRef}
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <Text style={styles.label}>Password</Text>
        <Text style={styles.fieldHint}>{NEW_PASSWORD_REQUIREMENT_COPY}</Text>
        <TextInput
          ref={passwordRef}
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          blurOnSubmit={false}
          onSubmitEditing={() => void onSubmit()}
        />

        <Text style={[styles.fieldHint, styles.afterPasswordHint]}>
          After you&apos;re in, optional fundraiser reminder texts are under
          Dashboard → Your Contact Info (separate from creating your account).
        </Text>

        {error ? <Text style={styles.err}>{error}</Text> : null}
        <Pressable style={styles.btn} onPress={() => void onSubmit()} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Create account & join</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#f8fafc" },
  scrollContent: {
    padding: 20,
    paddingBottom: 48,
    flexGrow: 1,
  },
  hint: { fontSize: 15, color: "#64748b", marginBottom: 16 },
  label: { fontWeight: "600", color: "#1A1A2E", marginTop: 10, marginBottom: 4 },
  fieldHint: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 6,
    lineHeight: 18,
  },
  afterPasswordHint: {
    marginTop: 14,
    marginBottom: 0,
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
