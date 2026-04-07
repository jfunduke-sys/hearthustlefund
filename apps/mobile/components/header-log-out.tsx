import { Pressable, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";

export function HeaderLogOut() {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Log out"
      hitSlop={10}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
      onPress={() => {
        void (async () => {
          await supabase.auth.signOut();
          router.replace("/");
        })();
      }}
    >
      <Text style={styles.label}>Log out</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginRight: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  pressed: { opacity: 0.75 },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
