import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM Net Strategy",
  description: "Gestion de la relation client - Net Strategy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
