"use client";

import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const NAV_LINKS = [
  { href: "/predict", label: "Predict" },
  { href: "/batches", label: "Batches" },
  { href: "/sign-in", label: "Sign In" },
];

export function OpenNav() {
  return (
    <div className="flex items-center gap-2">
      <NavigationMenu>
        <NavigationMenuList>
          {NAV_LINKS.map(({ href, label }) => (
            <NavigationMenuItem key={href}>
              <NavigationMenuLink asChild>
                <Link
                  href={href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
                >
                  {label}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
      <ThemeToggle />
    </div>
  );
}
