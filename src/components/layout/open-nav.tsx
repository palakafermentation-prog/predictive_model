"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useSession } from "@/hooks/use-session";
import { useAuthGateStore } from "@/stores/auth-gate-store";
import { signout } from "@/services/frontend/auth";
import { useUserStore } from "@/stores/user-store";

const NAV_LINKS = [
  { href: "/predict", label: "Predict" },
  { href: "/batches", label: "Batches", requiresAuth: true },
];

const desktopLinkClasses =
  "text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2";
const mobileLinkClasses =
  "flex w-full items-center rounded-md px-3 py-3 text-base text-foreground hover:bg-accent hover:text-accent-foreground transition-colors";

export function OpenNav() {
  const router = useRouter();
  const { user } = useSession();
  const openAuthGate = useAuthGateStore((s) => s.openAuthGate);
  const clearUser = useUserStore((s) => s.clearUser);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  async function handleSignOut() {
    setMobileOpen(false);
    await signout();
    clearUser();
    router.push("/predict");
    router.refresh();
  }

  function handleAuthGateMobile() {
    setMobileOpen(false);
    openAuthGate();
  }

  return (
    <>
      {/* Desktop nav — sm and up */}
      <div className="hidden sm:flex sm:items-center sm:gap-2">
        <NavigationMenu>
          <NavigationMenuList>
            {NAV_LINKS.map(({ href, label, requiresAuth }) => (
              <NavigationMenuItem key={href}>
                {requiresAuth && !user ? (
                  <NavigationMenuLink asChild>
                    <button type="button" onClick={openAuthGate} className={desktopLinkClasses}>
                      {label}
                    </button>
                  </NavigationMenuLink>
                ) : (
                  <NavigationMenuLink asChild>
                    <Link href={href} className={desktopLinkClasses}>{label}</Link>
                  </NavigationMenuLink>
                )}
              </NavigationMenuItem>
            ))}
            <NavigationMenuItem>
              {user ? (
                <NavigationMenuLink asChild>
                  <button type="button" onClick={handleSignOut} className={desktopLinkClasses}>
                    Sign Out
                  </button>
                </NavigationMenuLink>
              ) : (
                <NavigationMenuLink asChild>
                  <Link href="/sign-in" className={desktopLinkClasses}>Sign In</Link>
                </NavigationMenuLink>
              )}
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <ThemeToggle />
      </div>

      {/* Mobile nav — below sm */}
      <div className="sm:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
              <SheetDescription className="sr-only">
                Site navigation and account actions
              </SheetDescription>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-1" aria-label="Main navigation">
              {NAV_LINKS.map(({ href, label, requiresAuth }) =>
                requiresAuth && !user ? (
                  <button
                    key={href}
                    type="button"
                    onClick={handleAuthGateMobile}
                    className={mobileLinkClasses}
                  >
                    {label}
                  </button>
                ) : (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={mobileLinkClasses}
                  >
                    {label}
                  </Link>
                )
              )}
              <div className="my-2 border-t" />
              {user ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className={mobileLinkClasses}
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  href="/sign-in"
                  onClick={() => setMobileOpen(false)}
                  className={mobileLinkClasses}
                >
                  Sign In
                </Link>
              )}
            </nav>
            <div className="mt-4 flex items-center gap-2 border-t pt-4">
              <span className="text-base text-foreground px-3">Theme</span>
              <ThemeToggle />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
