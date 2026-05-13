import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sapore di Carne | Box Degustazione",
  description:
    "Landing mono-prodotto con configuratore guidato per la Box Degustazione di Sapore di Carne.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
