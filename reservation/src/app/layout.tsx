import type { Metadata } from "next";
import { Bodoni_Moda, Lato } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

// Presti Display (charte graphique) n'existe pas en police web ; Bodoni Moda
// sert de substitut jusqu'à l'intégration de la vraie fonte sous licence.
const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
});

export const metadata: Metadata = {
  title: "Stigey — Head spa à Lyon",
  description:
    "Soins et massages du cuir chevelu, moments de relaxation et conseils personnalisés pour cheveux texturés et cuirs chevelus sensibles. Sur rendez-vous, à Lyon.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${bodoni.variable} ${lato.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
