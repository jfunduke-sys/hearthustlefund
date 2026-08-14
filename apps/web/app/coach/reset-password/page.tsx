"use client";

import { ResetPasswordForm } from "@/components/reset-password-form";

export default function CoachResetPasswordPage() {
  return (
    <ResetPasswordForm
      title="Set new Organizer password"
      loginHref="/coach/login"
      forgotHref="/coach/forgot-password"
      successMessage="Password updated. Redirecting to Organizer login…"
    />
  );
}
