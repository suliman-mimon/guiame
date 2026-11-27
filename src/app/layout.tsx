import type { Metadata } from "next";
import { Atkinson_Hyperlegible } from "next/font/google";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import "./globals.css";

// Tipografía de los bocetos de Figma (GM-20): legible para baja visión.
const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700"],
  variable: "--font-guiame",
});

export const metadata: Metadata = {
  title: "GuiaMe",
  description:
    "Agenda digital accesible y personalizable para el alumnado del CEE Fundación Purísima Concepción.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="es" className={atkinson.variable}>
        <body className="antialiased">
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
