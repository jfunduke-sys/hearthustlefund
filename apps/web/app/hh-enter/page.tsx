import { redirect } from "next/navigation";

/** Bookmark this URL for SuperAdmin sign-in (not linked from public nav). */
export default function HhEnterPage() {
  redirect("/admin/login");
}
