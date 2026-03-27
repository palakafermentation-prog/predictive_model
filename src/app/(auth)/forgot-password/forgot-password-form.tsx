"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";
import { ForgotPasswordFormSchema, type ForgotPasswordForm } from "@pferm/shared-schemas";
import { forgotPassword } from "@/services/frontend/auth";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export function ForgotPasswordForm() {
  const [success, setSuccess] = useState(false);

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(ForgotPasswordFormSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      const result = await forgotPassword(data.email);
      if (result.emailFailed) {
        toast.error(result.message);
      } else {
        setSuccess(true);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    }
  };

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="rounded-md bg-green-50 border border-green-200 p-4 text-green-800 text-sm">
            If an account with that email exists, a password reset link has been sent. Check your
            inbox (and spam folder).
          </div>
        </CardContent>
        <CardFooter>
          <Link
            href="/sign-in"
            className="text-sm text-muted-foreground hover:text-foreground w-full text-center"
          >
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    );
  }

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
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Sending..." : "Send Reset Link"}
            </Button>
            <Link
              href="/sign-in"
              className="text-sm text-muted-foreground hover:text-foreground text-center"
            >
              Back to sign in
            </Link>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
