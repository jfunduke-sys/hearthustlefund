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
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  NEW_PASSWORD_REQUIREMENT_COPY,
  SMS_REMINDER_CONSENT_CHECKBOX_COPY,
  SMS_REMINDER_PUBLIC_INFO_PATH,
} from "@heart-and-hustle/shared";
import { getApiBase, supabase } from "../lib/supabase";
import { getPostAuthHrefForCurrentUser } from "../lib/post-auth-route";
import { normalizePhoneDigits } from "../lib/phone";

function first(v: string | string[] | undefined) {
  if (Array.isArray(v)) return v[0];
  return v;
}

function openTermsUrl() {
  const base = getApiBase().replace(/\/$/, "");
  void Linking.openURL(`${base}/terms`);
}

function openPrivacyUrl() {
  const base = getApiBase().replace(/\/$/, "");
  void Linking.openURL(`${base}/privacy`);
}

function openSmsRemindersPage() {
  const base = getApiBase().replace(/\/$/, "");
  void Linking.openURL(`${base}${SMS_REMINDER_PUBLIC_INFO_PATH}`);
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
  const [mobilePhone, setMobilePhone] = useState("");
  const [smsRemindersOptIn, setSmsRemindersOptIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fullNameRef = useRef<TextInput>(null);
  const jerseyRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const mobilePhoneRef = useRef<TextInput>(null);

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
    if (smsRemindersOptIn) {
      const d = normalizePhoneDigits(mobilePhone);
      if (d.length < 10) {
        setError(
          "Enter a valid 10-digit US mobile number, or turn off text reminders."
        );
        return;
      }
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
            smsRemindersOptIn,
            mobilePhone: smsRemindersOptIn ? mobilePhone.trim() : null,
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
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => mobilePhoneRef.current?.focus()}
        />

        <Text style={styles.label}>Mobile phone (optional)</Text>
        <Text style={styles.fieldHint}>
          US number — only used if you opt in to texts below.
        </Text>
        <TextInput
          ref={mobilePhoneRef}
          style={styles.input}
          value={mobilePhone}
          onChangeText={setMobilePhone}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          placeholder="10-digit mobile"
          returnKeyType="done"
          onSubmitEditing={() => void onSubmit()}
        />

        <Pressable
          style={styles.checkRow}
          onPress={() => setSmsRemindersOptIn((v) => !v)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: smsRemindersOptIn }}
        >
          <View
            style={[styles.checkBox, smsRemindersOptIn && styles.checkBoxOn]}
          >
            {smsRemindersOptIn ? (
              <Text style={styles.checkMark} accessibilityLabel="">
                ✓
              </Text>
            ) : null}
          </View>
          <Text style={styles.checkLabel}>
            {SMS_REMINDER_CONSENT_CHECKBOX_COPY} See{" "}
            <Text style={styles.inlineLink} onPress={openTermsUrl}>
              Terms
            </Text>
            ,{" "}
            <Text style={styles.inlineLink} onPress={openPrivacyUrl}>
              Privacy
            </Text>
            , and our{" "}
            <Text style={styles.inlineLink} onPress={openSmsRemindersPage}>
              SMS program page
            </Text>
            .
          </Text>
        </Pressable>

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
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 16,
    paddingVertical: 4,
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#94a3b8",
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkBoxOn: {
    borderColor: "#C0392B",
    backgroundColor: "#fef2f2",
  },
  checkMark: {
    color: "#C0392B",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 18,
  },
  checkLabel: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: "#334155",
  },
  inlineLink: {
    color: "#C0392B",
    fontWeight: "600",
    textDecorationLine: "underline",
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
