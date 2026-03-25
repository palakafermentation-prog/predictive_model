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
        </div>
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <div className="text-4xl">{success ? "✅" : "❌"}</div>
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
            <Link href="/sign-in" className="w-full">
              <Button className={success ? "w-full" : "w-full"} variant={success ? "default" : "outline"}>
                {success ? "Sign In" : "Back to Sign In"}
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
