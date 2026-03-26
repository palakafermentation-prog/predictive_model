"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useSession } from "@/hooks/use-session";
import { useAuthGateStore } from "@/stores/auth-gate-store";
import { signout } from "@/services/frontend/auth";
import { useUserStore } from "@/stores/user-store";

const NAV_LINKS = [
  { href: "/predict", label: "Predict" },
  { href: "/batches", label: "Batches", requiresAuth: true },
];

const linkClasses = "text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2";

export function OpenNav() {
  const router = useRouter();
  const { user } = useSession();
  const openAuthGate = useAuthGateStore((s) => s.openAuthGate);
  const clearUser = useUserStore((s) => s.clearUser);

  async function handleSignOut() {
    await signout();
    clearUser();
    router.push("/predict");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <NavigationMenu>
        <NavigationMenuList>
          {NAV_LINKS.map(({ href, label, requiresAuth }) => (
            <NavigationMenuItem key={href}>
              {requiresAuth && !user ? (
                <NavigationMenuLink asChild>
                  <button type="button" onClick={openAuthGate} className={linkClasses}>
                    {label}
                  </button>
                </NavigationMenuLink>
              ) : (
                <NavigationMenuLink asChild>
                  <Link href={href} className={linkClasses}>{label}</Link>
                </NavigationMenuLink>
              )}
            </NavigationMenuItem>
          ))}
          <NavigationMenuItem>
            {user ? (
              <NavigationMenuLink asChild>
                <button type="button" onClick={handleSignOut} className={linkClasses}>
                  Sign Out
                </button>
              </NavigationMenuLink>
            ) : (
              <NavigationMenuLink asChild>
                <Link href="/sign-in" className={linkClasses}>Sign In</Link>
              </NavigationMenuLink>
            )}
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <ThemeToggle />
    </div>
  );
}
