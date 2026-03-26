import { Suspense } from "react";
import { AuthPageLayout } from "@/components/auth-page-layout";
import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthPageLayout
      title="Set New Password"
      subtitle="Choose a new password for your account"
      showLogo={false}
    >
      <Suspense fallback={<div className="text-center text-muted-foreground">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthPageLayout>
  );
}
