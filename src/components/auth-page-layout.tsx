import Image from "next/image";

interface AuthPageLayoutProps {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
  children: React.ReactNode;
}

export function AuthPageLayout({
  title,
  subtitle,
  showLogo = true,
  children,
}: AuthPageLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          {showLogo && (
            <Image
              src="/logo.png"
              alt="Palaka Fermentation"
              width={80}
              height={80}
              className="mx-auto mb-4 dark:brightness-0 dark:invert"
            />
          )}
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground mt-2">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
