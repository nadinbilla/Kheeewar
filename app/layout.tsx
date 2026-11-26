import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "حِوَارِي | Belajar Percakapan Bahasa Arab",
  description: "Latih percakapan bahasa Arab bersama AI. Belajar dari contoh dan praktik langsung.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id" dir="rtl"><body>{children}</body></html>;
}
