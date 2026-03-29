import { useLocalSearchParams } from "expo-router";
import AthleteEntry from "../components/athlete-entry";

export default function HomeScreen() {
  const p = useLocalSearchParams<{
    signIn?: string;
    code?: string;
  }>();
  const initialTab =
    p.signIn === "1" || p.signIn === "true" ? "signin" : "join";
  const prefilledCode = typeof p.code === "string" ? p.code : undefined;

  return (
    <AthleteEntry initialTab={initialTab} prefilledCode={prefilledCode} />
  );
}
