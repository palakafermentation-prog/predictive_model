import Image from "next/image";
import Link from "next/link";
import { OpenNav } from "@/components/layout/open-nav";

export default function OpenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <Link href="/predict" className="flex items-center gap-2.5 text-foreground">
            <Image src="/logo.png" alt="Palaka Fermentation" width={52} height={52} className="dark:brightness-0 dark:invert" />
            <span className="text-2xl font-semibold tracking-tight">Palaka Fermentation</span>
          </Link>
          <OpenNav />
        </div>
      </header>

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
  );
}
