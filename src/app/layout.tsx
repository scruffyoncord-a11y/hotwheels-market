import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ListingsProvider } from "@/lib/listings-store";
import { ProposalsProvider } from "@/lib/proposals-store";
import { BidsProvider } from "@/lib/bids-store";
import { FavoritesProvider } from "@/lib/favorites-store";
import { InventoryProvider } from "@/lib/inventory-store";
import { AuthProvider } from "@/lib/auth-store";
import { AccessProvider } from "@/lib/access-store";
import { ThemeProvider, ThemeInitScript } from "@/lib/theme-store";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LotClub — Hot Wheels Trading Marketplace",
  description: "Trade and auction Hot Wheels and diecast cars with collectors near you.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeInitScript />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <AuthProvider>
            <ListingsProvider>
              <ProposalsProvider>
                <BidsProvider>
                  <FavoritesProvider>
                    <InventoryProvider>
                      <AccessProvider>
                        <Header />
                        {children}
                        <Footer />
                      </AccessProvider>
                    </InventoryProvider>
                  </FavoritesProvider>
                </BidsProvider>
              </ProposalsProvider>
            </ListingsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
