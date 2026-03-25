import Image from "next/image";
import { SignUpForm } from "./sign-up-form";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="Palaka Fermentation" width={80} height={80} className="mx-auto mb-4 dark:brightness-0 dark:invert" />
          <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
          <p className="text-muted-foreground mt-2">Join Palaka Fermentation</p>
        </div>
        <SignUpForm />
      </div>
    </div>
  );
}
