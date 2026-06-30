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
})

export const metadata: Metadata = {
  title: "Alexandria",
  description: "Thesis, Research, and Capstone Hub by DCISM Students, for DCISM Students",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${khula.variable} h-full`}
    >
      <body className="min-h-full bg-[#14181c] text-white antialiased">{children}</body>
    </html>
  );
}
