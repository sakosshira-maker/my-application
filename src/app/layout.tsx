import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mon petit cahier — Carnet d'études ENS Français",
  description:
    "Le carnet d'étude doux et organisé des futures professeures de français au secondaire : emploi du temps interactif, cahiers numériques, cartes flash, quiz, moyennes, compagnon d'étude et Pomodoro.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" dir="ltr">
      <body className="antialiased text-[#5B4A6F]">{children}</body>
    </html>
  );
}
