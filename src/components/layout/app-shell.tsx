import Image from "next/image";
import Link from "next/link";
import { OpenNav } from "@/components/layout/open-nav";
import { SessionInit } from "@/components/session-init";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <SessionInit />
      <header className="z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <Link href="/predict" className="flex items-center gap-2.5 text-foreground">
            <Image src="/logo.png" alt="Palaka Fermentation" width={52} height={52} className="brightness-200 dark:brightness-0 dark:invert" />
            <span className="text-2xl font-semibold tracking-tight">Palaka Fermentation</span>
          </Link>
          <OpenNav />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto [scrollbar-gutter:stable]">
        <div className="flex min-h-full flex-col">
          <main className="flex-1">
            <div className="mx-auto max-w-4xl px-4 py-8">
              {children}
            </div>
          </main>

          <footer className="border-t py-6">
            <p className="text-center text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Palaka Fermentation
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
