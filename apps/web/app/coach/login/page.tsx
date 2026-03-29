import { Suspense } from "react";
import CoachLoginInner from "./coach-login-inner";

export default function CoachLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-slate-600">
          Loading…
        </div>
      }
    >
      <CoachLoginInner />
    </Suspense>
  );
}
