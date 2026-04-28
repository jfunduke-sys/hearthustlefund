import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getApiBase, supabase } from "../lib/supabase";
import { getPostAuthHrefForCurrentUser } from "../lib/post-auth-route";
import {
  TEAM_JOIN_CHARSET,
  TEAM_JOIN_CODE_LENGTH,
  isLegacyNumericJoinCode,
  isValidTeamJoinCodeFormat,
  normalizeTeamJoinCode,
} from "@heart-and-hustle/shared";

const APP_LOGO = require("../assets/heart-logo.png");

type Fr = {
  id: string;
  school_name: string;
  team_name: string;
  school_logo_url: string | null;
  team_logo_url: string | null;
};

function toApiJoinSegment(code: string): string {
  if (isLegacyNumericJoinCode(code)) {
    return code.replace(/\D/g, "").slice(0, 6);
  }
  return normalizeTeamJoinCode(code);
}

function canLookup(code: string): boolean {
  return isValidTeamJoinCodeFormat(code) || isLegacyNumericJoinCode(code);
}

/** Unique logo URLs (school + team often share the same image after single upload). */
function uniqueLogoUrls(fr: Fr): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of [fr.school_logo_url, fr.team_logo_url]) {
    const t = u?.trim();
    if (t && !seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  return out;
}

function parseJoinDeepLink(url: string | null): {
  code?: string;
  slug?: string;
} {
  if (!url) return {};
  const u = url.replace(/^heartandhustle:\/\//i, "https://");
  try {
    const parsed = new URL(u);
    const q = parsed.searchParams.get("code");
    if (q) {
      const n = normalizeTeamJoinCode(q);
      if (isValidTeamJoinCodeFormat(n) || isLegacyNumericJoinCode(q)) {
        return { code: toApiJoinSegment(q) };
      }
    }
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts[0] === "join" && parts[1]) {
      const seg = parts[1];
      if (isValidTeamJoinCodeFormat(seg) || isLegacyNumericJoinCode(seg)) {
        return { code: toApiJoinSegment(seg) };
      }
      return { slug: seg };
    }
  } catch {
    /* ignore */
  }
  return {};
}

type Props = {
  initialTab?: "join" | "signin";
  prefilledCode?: string;
};

export default function AthleteEntry({
  initialTab = "join",
  prefilledCode,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  /** Match setup screen — status bar + typical stack/header inset so fields stay above the keyboard. */
  const keyboardVerticalOffset =
    Platform.OS === "ios" ? insets.top + 52 : 0;
  const scrollRef = useRef<ScrollView>(null);
  const [tab, setTab] = useState<"join" | "signin">(initialTab);
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signError, setSignError] = useState<string | null>(null);
  const [fundraiser, setFundraiser] = useState<Fr | null>(null);
  const signInEmailRef = useRef<TextInput>(null);
  const signInPasswordRef = useRef<TextInput>(null);

  const fundraiserLogoUris = useMemo(
    () => (fundraiser ? uniqueLogoUrls(fundraiser) : []),
    [fundraiser]
  );

  const fetchFundraiser = useCallback(async (segment: string) => {
    const base = getApiBase();
    const res = await fetch(
      `${base}/api/public/fundraiser/${encodeURIComponent(segment)}`
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Fundraiser not found");
    return data as Fr;
  }, []);

  useEffect(() => {
    if (prefilledCode) {
      setCode(
        isLegacyNumericJoinCode(prefilledCode)
          ? prefilledCode.replace(/\D/g, "").slice(0, 6)
          : normalizeTeamJoinCode(prefilledCode).slice(0, TEAM_JOIN_CODE_LENGTH)
      );
    }
  }, [prefilledCode]);

  useEffect(() => {
    if (initialTab === "signin") setTab("signin");
  }, [initialTab]);

  useEffect(() => {
    async function fromUrl(url: string | null) {
      const { code: c, slug } = parseJoinDeepLink(url);
      if (c) {
        setTab("join");
        setCode(c);
        return;
      }
      if (slug) {
        setLoading(true);
        setError(null);
        try {
          const fr = await fetchFundraiser(slug);
          setFundraiser(fr);
          setTab("join");
        } catch (e: unknown) {
          setError(e instanceof Error ? e.message : "Could not open link");
        } finally {
          setLoading(false);
        }
      }
    }
    void Linking.getInitialURL().then((u) => void fromUrl(u));
    const sub = Linking.addEventListener("url", ({ url }) =>
      void fromUrl(url)
    );
    return () => sub.remove();
  }, [fetchFundraiser]);

  async function lookup() {
    setError(null);
    setFundraiser(null);
    if (!canLookup(code)) {
      setError(
        `Enter the ${TEAM_JOIN_CODE_LENGTH}-character code from your coach (letters & numbers).`
      );
      return;
    }
    setLoading(true);
    try {
      const fr = await fetchFundraiser(toApiJoinSegment(code));
      setFundraiser(fr);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not load fundraiser");
    } finally {
      setLoading(false);
    }
  }

  async function onSignIn() {
    setSignError(null);
    setLoading(true);
    try {
      await supabase.auth.signOut({ scope: "local" });
      const { data, error: e } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (e) throw e;
      if (!data.session) {
        throw new Error("Session did not start. Try again.");
      }
      router.replace(await getPostAuthHrefForCurrentUser());
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Sign in failed";
      const low = msg.toLowerCase();
      const looksNetwork =
        low.includes("network") ||
        low.includes("fetch") ||
        low.includes("internet") ||
        low.includes("not available") ||
        low.includes("unreachable");
      setSignError(
        looksNetwork
          ? "Couldn't reach the account service (not your Railway site). Try cellular or different Wi‑Fi. If it persists, check Expo → Environment variables → production: EXPO_PUBLIC_SUPABASE_URL must be your https://…supabase.co URL with no spaces, then create a new TestFlight build."
          : msg
      );
    } finally {
      setLoading(false);
    }
  }

  function openForgotPassword() {
    const base = getApiBase().replace(/\/$/, "");
    void Linking.openURL(`${base}/forgot-password`);
  }

  function onChangeCode(t: string) {
    setFundraiser(null);
    setError(null);
    const u = t.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const digitsOnly = u.replace(/\D/g, "");
    if (digitsOnly.length === u.length && u.length <= 6) {
      setCode(digitsOnly.slice(0, 6));
      return;
    }
    let out = "";
    for (const c of u.slice(0, TEAM_JOIN_CODE_LENGTH)) {
      if (TEAM_JOIN_CHARSET.includes(c)) out += c;
    }
    setCode(out);
  }

  function clearTeamChoice() {
    setFundraiser(null);
    setError(null);
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
      >
        <Image source={APP_LOGO} style={styles.appLogo} resizeMode="contain" />
        <Text style={styles.title}>Heart & Hustle</Text>
        <Text style={styles.sub}>Fundraising for your team</Text>

        <View style={styles.segment}>
          <Pressable
            style={[styles.segBtn, tab === "join" && styles.segBtnActive]}
            onPress={() => setTab("join")}
          >
            <Text
              style={[styles.segText, tab === "join" && styles.segTextActive]}
            >
              Enter Team Code
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segBtn, tab === "signin" && styles.segBtnActive]}
            onPress={() => setTab("signin")}
          >
            <Text
              style={[styles.segText, tab === "signin" && styles.segTextActive]}
            >
              Sign In
            </Text>
          </Pressable>
        </View>

        {tab === "join" ? (
          <View style={styles.panel}>
            {!fundraiser ? (
              <>
                <Text style={styles.hint}>
                  Your coach/sponsor shares a 7-character team code. Open the
                  Heart &amp; Hustle app, enter the code, then create your email
                  and password to get your personal donation link and texting
                  tools. Passwords must be at least 8 characters.
                </Text>
                <Text style={styles.label}>Team Code</Text>
                <TextInput
                  value={code}
                  onChangeText={onChangeCode}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  placeholder={Array(TEAM_JOIN_CODE_LENGTH).fill("•").join("")}
                  style={styles.codeInput}
                />
                <Pressable
                  style={styles.btnDark}
                  onPress={() => void lookup()}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>Continue</Text>
                  )}
                </Pressable>
                {error ? <Text style={styles.err}>{error}</Text> : null}
              </>
            ) : (
              <View style={styles.card}>
                <Text style={styles.foundLabel}>Team found</Text>
                <Text style={styles.school}>{fundraiser.school_name}</Text>
                <Text style={styles.team}>{fundraiser.team_name}</Text>
                {fundraiserLogoUris.length > 0 ? (
                  <View style={styles.logos}>
                    {fundraiserLogoUris.map((uri) => (
                      <Image
                        key={uri}
                        source={{ uri }}
                        style={
                          fundraiserLogoUris.length === 1
                            ? styles.logoLarge
                            : styles.logo
                        }
                        resizeMode="contain"
                      />
                    ))}
                  </View>
                ) : null}
                <Text style={styles.createHint}>
                  Create your account to join this fundraiser.
                </Text>
                <Pressable
                  style={styles.btnPrimary}
                  onPress={() =>
                    router.push({
                      pathname: "/setup",
                      params: {
                        fundraiserId: fundraiser.id,
                        schoolName: fundraiser.school_name,
                        teamName: fundraiser.team_name,
                      },
                    })
                  }
                >
                  <Text style={styles.btnText}>Create Account</Text>
                </Pressable>
                <Pressable
                  style={styles.linkBtn}
                  onPress={clearTeamChoice}
                  hitSlop={12}
                >
                  <Text style={styles.linkBtnText}>Use a Different Team Code</Text>
                </Pressable>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.panel}>
            <Text style={styles.hint}>
              Welcome back. Sign in with the email and password you created when
              you joined your fundraising campaign.
            </Text>
            <Text style={styles.label}>Email</Text>
            <TextInput
              ref={signInEmailRef}
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="username"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => signInPasswordRef.current?.focus()}
            />
            <Text style={styles.label}>Password</Text>
            <TextInput
              ref={signInPasswordRef}
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={() => void onSignIn()}
              onFocus={() => {
                requestAnimationFrame(() => {
                  setTimeout(() => {
                    scrollRef.current?.scrollToEnd({ animated: true });
                  }, 120);
                });
              }}
            />
            {signError ? <Text style={styles.err}>{signError}</Text> : null}
            <Pressable
              onPress={openForgotPassword}
              hitSlop={10}
              style={styles.forgotWrap}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </Pressable>
            <Pressable
              style={styles.btnDark}
              onPress={() => void onSignIn()}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Sign In</Text>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#f8fafc" },
  scroll: {
    padding: 24,
    paddingTop: 48,
    paddingBottom: 48,
    flexGrow: 1,
  },
  appLogo: {
    width: 56,
    height: 56,
    alignSelf: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A1A2E",
    textAlign: "center",
  },
  sub: {
    marginTop: 6,
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  segBtnActive: { backgroundColor: "#fff", shadowOpacity: 0.06, shadowRadius: 4 },
  segText: { fontWeight: "600", color: "#64748b", fontSize: 15 },
  segTextActive: { color: "#1A1A2E" },
  panel: { marginTop: 4 },
  hint: { fontSize: 14, color: "#475569", lineHeight: 21, marginBottom: 10 },
  label: { fontSize: 14, fontWeight: "600", color: "#1A1A2E", marginBottom: 6 },
  codeInput: {
    borderWidth: 2,
    borderColor: "#C0392B",
    borderRadius: 12,
    padding: 14,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 4,
    textAlign: "center",
    backgroundColor: "#fff",
    color: "#1A1A2E",
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#fff",
    marginBottom: 4,
  },
  btnDark: {
    marginTop: 16,
    backgroundColor: "#1A1A2E",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  btnPrimary: {
    marginTop: 16,
    backgroundColor: "#C0392B",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  err: { color: "#b91c1c", marginTop: 12, fontSize: 14 },
  forgotWrap: { marginTop: 10, alignSelf: "flex-end" },
  forgotText: {
    color: "#C0392B",
    fontSize: 13,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  card: {
    marginTop: 4,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  foundLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  createHint: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
    marginTop: 4,
    marginBottom: 4,
  },
  linkBtn: {
    marginTop: 14,
    paddingVertical: 8,
    alignItems: "center",
  },
  linkBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748b",
  },
  school: { fontSize: 17, fontWeight: "700", color: "#1A1A2E" },
  team: { fontSize: 15, color: "#C0392B", marginTop: 4, fontWeight: "600" },
  logos: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 12,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  logo: { width: 56, height: 56, borderRadius: 8, backgroundColor: "#f1f5f9" },
  logoLarge: {
    width: 104,
    height: 104,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
  },
});
