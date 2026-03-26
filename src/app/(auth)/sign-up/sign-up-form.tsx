"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";
import { SignupFormSchema, type SignupForm } from "@pferm/shared-schemas";
import { signup, AuthError } from "@/services/frontend/auth";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { FloatingLabelInput } from "@/components/floating-label-input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export function SignUpForm() {
  const [emailSent, setEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const form = useForm<SignupForm>({
    resolver: zodResolver(SignupFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignupForm) => {
    try {
      await signup(data.email, data.password, data.confirmPassword, data.firstName, data.lastName);
      setSubmittedEmail(data.email);
      setEmailSent(true);
    } catch (error) {
      if (error instanceof AuthError) {
        if (error.code === "CONFLICT") {
          form.setError("email", { type: "server", message: "An account with that email already exists." });
          return;
        }
        if (error.fieldErrors) {
          for (const [field, messages] of Object.entries(error.fieldErrors)) {
            if (messages.length > 0) {
              form.setError(field as keyof SignupForm, { type: "server", message: messages[0] });
            }
          }
          return;
        }
        toast.error(error.message);
      } else {
        toast.error("Failed to create account. Please try again.");
      }
    }
  };

  if (emailSent) {
    return (
      <Card>
        <CardContent className="pt-6 text-center space-y-4">
          <div className="text-4xl" aria-hidden="true">📧</div>
          <h2 className="text-lg font-semibold">Check your email</h2>
          <p className="text-muted-foreground text-sm">
            We sent a verification link to <strong>{submittedEmail}</strong>.
            Click the link in the email to activate your account.
          </p>
          <p className="text-muted-foreground text-xs">
            Didn&apos;t receive the email? Check your spam folder.
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild variant="outline" className="w-full">
            <Link href="/sign-in">Back to Sign In</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 pt-6">
            <FormField control={form.control} name="firstName" render={({ field }) => (
              <FormItem>
                <FloatingLabelInput label="First Name *" type="text" autoComplete="given-name" {...field} />
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="lastName" render={({ field }) => (
              <FormItem>
                <FloatingLabelInput label="Last Name" type="text" autoComplete="family-name" {...field} />
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FloatingLabelInput label="Email *" type="email" autoComplete="email" {...field} />
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FloatingLabelInput label="Password *" type="password" autoComplete="new-password" {...field} />
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="confirmPassword" render={({ field }) => (
              <FormItem>
                <FloatingLabelInput label="Confirm Password *" type="password" autoComplete="new-password" {...field} />
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Creating account..." : "Create Account"}
            </Button>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
              Already have an account? Sign in
            </Link>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
