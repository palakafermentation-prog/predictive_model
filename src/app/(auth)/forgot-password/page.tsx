import { AuthPageLayout } from "@/components/auth-page-layout";
import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthPageLayout
      title="Reset Password"
      subtitle="Enter your email and we'll send you a reset link"
      showLogo={false}
    >
      <ForgotPasswordForm />
    </AuthPageLayout>
  );
}
