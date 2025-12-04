import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { Toaster } from "sonner";

import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { PonderClientProvider } from "@/lib/ponder-provider";
import ContextProvider from "@/context";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "NomadNodes - Decentralized Vacation Rentals",
    template: "%s | NomadNodes",
  },
  description:
    "Book unique stays powered by blockchain. Transparent, secure, and truly peer-to-peer rental platform.",
  keywords: [
    "vacation rental",
    "blockchain",
    "web3",
    "decentralized",
    "crypto",
    "airbnb alternative",
    "peer-to-peer",
    "smart contracts",
    "ethereum",
    "travel",
    "accommodation",
  ],
  authors: [{ name: "NomadNodes" }],
  creator: "NomadNodes",
  publisher: "NomadNodes",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://nomadnodes.com"),

  // Open Graph
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "NomadNodes - Decentralized Vacation Rentals",
    description:
      "Book unique stays powered by blockchain. Transparent, secure, and truly peer-to-peer rental platform.",
    siteName: "NomadNodes",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NomadNodes - Decentralized Vacation Rentals",
      },
    ],
  },

  // Twitter
  twitter: {
    card: "summary_large_image",
    title: "NomadNodes - Decentralized Vacation Rentals",
    description:
      "Book unique stays powered by blockchain. Transparent, secure, and truly peer-to-peer.",
    creator: "@nomadnodes",
    images: ["/og-image.png"],
  },

  // Icons
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },

  // Manifest
  manifest: "/site.webmanifest",

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Verification
  verification: {
    // google: "your-google-site-verification",
    // yandex: "your-yandex-verification",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersObj = await headers();
  const cookies = headersObj.get("cookie");

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PonderClientProvider>
            <ContextProvider cookies={cookies}>
              <div className="relative flex min-h-screen flex-col">
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
              <Toaster richColors position="top-right" />
            </ContextProvider>
          </PonderClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
