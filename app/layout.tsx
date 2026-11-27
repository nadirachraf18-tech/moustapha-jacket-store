import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Moustapha Shop | Veste simili cuir",
  description: "Veste femme simili cuir à 150 DH. Tailles M à XXL. Commande directe sur WhatsApp.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
