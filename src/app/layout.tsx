import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ThemeProvider } from "@/components/theme-provider";
import { PageTransition } from "@/components/page-transition";
import { JsonLd } from "@/components/seo/JsonLd";
import { webApplicationJsonLd } from "@/lib/seo/json-ld";
import { rootLayoutMetadata } from "@/lib/seo/metadata";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = rootLayoutMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background`}
      >
        <JsonLd data={webApplicationJsonLd()} />
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            <Suspense
              fallback={
                <header className="h-16 border-b border-white/8 bg-zinc-900/95" />
              }
            >
              <Header />
            </Suspense>
            <div className="flex-1">
              <PageTransition>{children}</PageTransition>
            </div>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
