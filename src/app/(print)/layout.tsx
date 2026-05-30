import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <div className={playfair.variable}>{children}</div>;
}
