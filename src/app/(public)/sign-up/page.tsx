import { AuthPageLayout } from "@/components/auth-page-layout";
import { SignUpForm } from "./sign-up-form";

export default function SignUpPage() {
  return (
    <AuthPageLayout title="Create account" subtitle="Join Palaka Fermentation">
      <SignUpForm />
    </AuthPageLayout>
  );
}
