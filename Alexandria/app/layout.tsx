import type { Metadata } from "next";
import { Inter, Khula } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const khula = Khula({
  variable: "--font-khula",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Alexandria",
    template: "%s | Alexandria",
  },
  description: "DCISM thesis, research, and capstone repository.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${khula.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
