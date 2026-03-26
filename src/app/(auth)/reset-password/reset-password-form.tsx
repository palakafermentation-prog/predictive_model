"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ResetPasswordFormSchema, type ResetPasswordForm } from "@pferm/shared-schemas";
import { resetPassword } from "@/services/frontend/auth";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => router.push("/sign-in"), 2000);
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(ResetPasswordFormSchema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: ResetPasswordForm) => {
    try {
      await resetPassword(data.token, data.password, data.confirmPassword);
      setSuccess(true);
      toast.success("Password reset successfully! Redirecting to sign in...");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reset password");
    }
  };

  if (!token) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="rounded-md bg-red-50 border border-red-200 p-4 text-red-800 text-sm">
            Invalid or missing reset token. Please request a new password reset link.
          </div>
        </CardContent>
        <CardFooter>
          <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-foreground w-full text-center">
            Request new reset link
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <input type="hidden" {...form.register("token")} value={token} />
          <CardContent className="space-y-6 pt-6">
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FloatingLabelInput label="New Password" type="password" autoComplete="new-password" {...field} />
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="confirmPassword" render={({ field }) => (
              <FormItem>
                <FloatingLabelInput label="Confirm Password" type="password" autoComplete="new-password" {...field} />
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || success}>
              {form.formState.isSubmitting ? "Resetting..." : success ? "Password Reset!" : "Reset Password"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
