import { redirect } from "next/navigation";
import { getServerSession } from "@/services/backend/auth.service";
import { AppShell } from "@/components/layout/app-shell";

export default async function SecureLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }

  return <AppShell>{children}</AppShell>;
}
