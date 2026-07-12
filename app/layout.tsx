import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | The 2AM Club",
    default: "The 2AM Club — Where Hunger Never Sleeps",
  },
  description:
    "Premium late-night food ordering for engineering college hostels. Browse live inventory, pay online, and collect your order. Open 10 PM – 4 AM.",
  keywords: [
    "hostel food",
    "late night food",
    "2am food",
    "engineering college canteen",
    "online food ordering",
  ],
  authors: [{ name: "The 2AM Club" }],
  creator: "The 2AM Club",
  openGraph: {
    type: "website",
    locale: "en_IN",
    title: "The 2AM Club — Where Hunger Never Sleeps",
    description:
      "Premium late-night food ordering for engineering college hostels.",
    siteName: "The 2AM Club",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body className="font-body antialiased min-h-dvh">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {/* Content */}
          {children}
          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              className: "bg-background text-foreground border-border",
              style: {
                fontFamily: "var(--font-inter)",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
