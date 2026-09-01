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

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TrackTrade — Hot Wheels Trading Marketplace",
  description: "Trade and auction Hot Wheels and diecast cars with collectors near you.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950">
        <AuthProvider>
          <ListingsProvider>
            <ProposalsProvider>
              <BidsProvider>
                <FavoritesProvider>
                  <InventoryProvider>
                    <Header />
                    {children}
                    <Footer />
                  </InventoryProvider>
                </FavoritesProvider>
              </BidsProvider>
            </ProposalsProvider>
          </ListingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
