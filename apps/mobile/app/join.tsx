import { useLocalSearchParams } from "expo-router";
import AthleteEntry from "../components/athlete-entry";

/**
 * Deep-link target: heartandhustle://join?code=XXXXXXX or …/join/CODE
 */
export default function JoinDeepLinkScreen() {
  const p = useLocalSearchParams<{ code?: string }>();
  const prefilledCode = typeof p.code === "string" ? p.code : undefined;
  return <AthleteEntry initialTab="join" prefilledCode={prefilledCode} />;
}
