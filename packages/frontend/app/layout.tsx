import type { Metadata } from "next";
import { Syne, Mulish } from "next/font/google";
import { headers } from "next/headers";
import { Toaster } from "sonner";

import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { PonderClientProvider } from "@/lib/ponder-provider";
import ContextProvider from "@/context";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

// Syne for titles - Bold, innovative, "Tech-Couture" feel
const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap", // Prevent font blocking
});

// Mulish for body - Rounded, welcoming, easy to read
const mulish = Mulish({
  variable: "--font-mulish",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap", // Prevent font blocking
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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://nomad-nodes-frontend.vercel.app"
  ),

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
        url: "/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "NomadNodes - Decentralized Vacation Rentals",
      },
    ],
  },

  // Twitter
  twitter: {
    card: "summary",
    title: "NomadNodes - Decentralized Vacation Rentals",
    description:
      "Book unique stays powered by blockchain. Transparent, secure, and truly peer-to-peer.",
    creator: "@nomadnodes",
    images: ["/android-chrome-512x512.png"],
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
      <body className={`${syne.variable} ${mulish.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ContextProvider cookies={cookies}>
            <PonderClientProvider>
              <div className="relative flex min-h-screen flex-col">
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
              <Toaster richColors position="top-right" />
            </PonderClientProvider>
          </ContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
