"use client";

import { ResetPasswordForm } from "@/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <ResetPasswordForm
      title="Set a new password"
      loginHref="/coach/login"
      forgotHref="/forgot-password"
      successMessage="Password updated. Redirecting to login…"
    />
  );
}
