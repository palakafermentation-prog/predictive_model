import Link from "next/link";
import Image from "next/image";
import { verifyEmail } from "@/services/backend/auth.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token } = await searchParams;

  let success = false;
  let errorMessage = "Invalid or expired verification link.";

  if (token) {
    try {
      await verifyEmail(token);
      success = true;
    } catch (error) {
      if (error instanceof Error) errorMessage = error.message;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="Palaka Fermentation" width={80} height={80} className="mx-auto mb-4 dark:brightness-0 dark:invert" />
          <h1 className="text-2xl font-semibold tracking-tight">Email Verification</h1>
        </div>
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <div className="text-4xl" aria-hidden="true">{success ? "✅" : "❌"}</div>
            <h2 className="text-lg font-semibold">
              {success ? "Email verified!" : "Verification failed"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {success
                ? "Your email has been verified. You can now sign in."
                : errorMessage}
            </p>
            {!success && (
              <p className="text-muted-foreground text-xs">
                Need a new link? Sign in and use the &ldquo;Resend verification email&rdquo; option.
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full" variant={success ? "default" : "outline"}>
              <Link href="/sign-in">
                {success ? "Sign In" : "Back to Sign In"}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
