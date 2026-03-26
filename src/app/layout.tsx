import type { Metadata } from "next";
import { Source_Serif_4, DM_Sans, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { AppDrawer } from "@/components/layout/app-drawer";
import { AuthGateDialog } from "@/components/ui/auth-gate-dialog";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const fontHeading = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif-4",
  display: "swap",
});

const fontBody = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Palaka Fermentation",
  description: "AI-driven sake fermentation prediction platform",
  icons: {
    icon: [
      { url: "/favicon-dark.png", media: "(prefers-color-scheme: light)" },
      { url: "/favicon-light.png", media: "(prefers-color-scheme: dark)" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontHeading.variable} ${fontBody.variable} ${fontMono.variable} font-body`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <AppDrawer />
          <AuthGateDialog />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
