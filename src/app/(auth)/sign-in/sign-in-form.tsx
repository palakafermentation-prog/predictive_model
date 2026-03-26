"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { SigninFormSchema, type SigninForm } from "@pferm/shared-schemas";
import { signin, resendVerification, AuthError } from "@/services/frontend/auth";
import { useUserStore } from "@/stores/user-store";
import { Button } from "@/components/ui/button";
import { KeyRound, UserPlus, ArrowLeft } from "lucide-react";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export function SignInForm() {
  const router = useRouter();
  const { setUser } = useUserStore();
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);

  const form = useForm<SigninForm>({
    resolver: zodResolver(SigninFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SigninForm) => {
    setUnverifiedEmail(null);
    try {
      const result = await signin(data.email, data.password);
      setUser(result.user);
      router.push("/batches");
    } catch (error) {
      if (error instanceof AuthError && error.code === "EMAIL_NOT_VERIFIED") {
        setUnverifiedEmail(data.email);
      } else {
        toast.error(error instanceof Error ? error.message : "Sign in failed");
      }
    }
  };

  const handleResend = async () => {
    if (!unverifiedEmail) return;
    setResendLoading(true);
    try {
      await resendVerification(unverifiedEmail);
      toast.success("Verification email sent. Please check your inbox.");
    } catch {
      toast.error("Failed to resend verification email. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 pt-6">
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FloatingLabelInput label="Email" type="email" autoComplete="email" {...field} />
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FloatingLabelInput label="Password" type="password" autoComplete="current-password" {...field} />
                <FormMessage />
              </FormItem>
            )} />
            {unverifiedEmail && (
              <div role="alert" className="rounded-md border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950 p-3 space-y-2">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Please verify your email before signing in.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={resendLoading}
                  onClick={handleResend}
                >
                  {resendLoading ? "Sending..." : "Resend verification email"}
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-3">
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
            <div className="flex flex-col items-start gap-3">
              <Link
                href="/forgot-password"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                Forgot your password?
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
                Don&apos;t have an account? Create one
              </Link>
              <Link
                href="/predict"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Back to predictions
              </Link>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
