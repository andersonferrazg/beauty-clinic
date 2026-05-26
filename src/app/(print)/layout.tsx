import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-playfair",
});

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={playfair.variable}>
      <body>{children}</body>
    </html>
  );
}
