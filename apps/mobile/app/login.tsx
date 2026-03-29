import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

/** Legacy route — athlete sign-in lives on the home screen. */
export default function LoginRedirectScreen() {
  const router = useRouter();
  useEffect(() => {
    router.replace({ pathname: "/", params: { signIn: "1" } });
  }, [router]);
  return (
    <View style={styles.box}>
      <ActivityIndicator size="large" color="#C0392B" />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, justifyContent: "center", backgroundColor: "#f8fafc" },
});
