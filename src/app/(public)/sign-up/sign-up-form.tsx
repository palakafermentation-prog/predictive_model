"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";
import { SignupFormSchema, type SignupForm } from "@pferm/shared-schemas";
import { signup, AuthError } from "@/services/frontend/auth";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export function SignUpForm() {
  const [emailSent, setEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(SignupFormSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    try {
      await signup(data.email, data.password, data.confirmPassword, data.firstName, data.lastName);
      setSubmittedEmail(data.email);
      setEmailSent(true);
    } catch (error) {
      if (error instanceof AuthError) {
        if (error.code === "CONFLICT") {
          setError("email", { type: "server", message: "An account with that email already exists." });
          return;
        }
        if (error.fieldErrors) {
          for (const [field, messages] of Object.entries(error.fieldErrors)) {
            if (messages.length > 0) {
              setError(field as keyof SignupForm, { type: "server", message: messages[0] });
            }
          }
          return;
        }
        toast.error(error.message);
      } else {
        toast.error("Failed to create account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <Card>
        <CardContent className="pt-6 text-center space-y-4">
          <div className="text-4xl">📧</div>
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
          <Link href="/sign-in" className="w-full">
            <Button variant="outline" className="w-full">Back to Sign In</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6 pt-6">
          <FloatingLabelInput
            id="firstName"
            label="First Name *"
            type="text"
            autoComplete="given-name"
            error={errors.firstName?.message}
            {...register("firstName")}
          />
          <FloatingLabelInput
            id="lastName"
            label="Last Name"
            type="text"
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...register("lastName")}
          />
          <FloatingLabelInput
            id="email"
            label="Email *"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <FloatingLabelInput
            id="password"
            label="Password *"
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <FloatingLabelInput
            id="confirmPassword"
            label="Confirm Password *"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>
          <Link
            href="/sign-in"
            className="text-sm text-muted-foreground hover:text-foreground text-center"
          >
            Already have an account? Sign in
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
