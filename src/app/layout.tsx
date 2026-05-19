import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Beauty Clinic",
  description: "Sistema de gestão para clínicas de estética",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Beauty Clinic" },
  icons: {
    apple: [{ url: "/api/icons/192", sizes: "192x192" }],
    icon: [{ url: "/api/icons/192", sizes: "192x192" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#B89968",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} h-full`}>
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
