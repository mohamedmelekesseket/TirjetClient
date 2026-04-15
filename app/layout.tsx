import type { Metadata } from "next";
import "./globals.css";
import PageTransition from "@/components/PageTransition";
import Providers from "@/components/Providers";
import LayoutWrapper from "@/components/LayoutWrapper";
import AppToaster from "@/components/AppToaster";
import { fontDisplay, fontSans } from "@/lib/font";

export const metadata: Metadata = {
  title: "Tirjet",
  description: "Artisanat Tunisie",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`site-root ${fontSans.variable} ${fontDisplay.variable}`}
    >
      <body
        className={`site-body ${fontSans.className}`}
        suppressHydrationWarning
      >
        <Providers>
          <LayoutWrapper>
            <div className="site-main">
              <PageTransition>{children}</PageTransition>
            </div>
          </LayoutWrapper>
          <AppToaster />
        </Providers>
      </body>
    </html>
  );
}