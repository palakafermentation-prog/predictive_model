import { AuthPageLayout } from "@/components/auth-page-layout";
import { SignInForm } from "./sign-in-form";

export default function SignInPage() {
  return (
    <AuthPageLayout title="Palaka Fermentation" subtitle="Sign in to your account">
      <SignInForm />
    </AuthPageLayout>
  );
}
