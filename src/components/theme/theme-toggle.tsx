"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const themeOrder = ["light", "dark", "system"] as const;
const themeIcons = { light: Sun, dark: Moon, system: Monitor };

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Button variant="ghost" size="icon" className="h-9 w-9" disabled />;
  }

  const currentIndex = themeOrder.indexOf(
    (theme as (typeof themeOrder)[number]) ?? "system"
  );
  const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length];
  const Icon = themeIcons[(theme as keyof typeof themeIcons) ?? "system"];

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      onClick={() => setTheme(nextTheme)}
      aria-label={`Switch to ${nextTheme} theme`}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
