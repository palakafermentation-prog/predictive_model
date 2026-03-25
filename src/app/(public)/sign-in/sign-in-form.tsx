"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { SigninFormSchema, type SigninForm } from "@pferm/shared-schemas";
import { signin } from "@/services/frontend/auth";
import { useUserStore } from "@/stores/user-store";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export function SignInForm() {
  const router = useRouter();
  const { setUser } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SigninForm>({
    resolver: zodResolver(SigninFormSchema),
  });

  const onSubmit = async (data: SigninForm) => {
    setIsLoading(true);
    try {
      const result = await signin(data.email, data.password);
      setUser(result.user);
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6 pt-6">
          <FloatingLabelInput
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <FloatingLabelInput
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
          <Link
            href="/forgot-password"
            className="text-sm text-muted-foreground hover:text-foreground text-center"
          >
            Forgot your password?
          </Link>
          <Link
            href="/sign-up"
            className="text-sm text-muted-foreground hover:text-foreground text-center"
          >
            Don&apos;t have an account? Create one
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
