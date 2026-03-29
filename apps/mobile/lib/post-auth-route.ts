import { getSessionUser } from "./auth-user";
import { isCoachAccount } from "./coach-account";

export type PostAuthHref = "/(coach)/dashboard" | "/(tabs)/dashboard";

export async function getPostAuthHrefForCurrentUser(): Promise<PostAuthHref> {
  const user = await getSessionUser();
  if (!user) return "/(tabs)/dashboard";
  const coach = await isCoachAccount(user.id);
  return coach ? "/(coach)/dashboard" : "/(tabs)/dashboard";
}
