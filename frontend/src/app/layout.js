import "./globals.css";
import { WalletProvider } from "../context/WalletContext";
import SharedLayout from "../components/SharedLayout";

export const metadata = {
  title: "Windfall | Stellar Soroban prize pool dApp",
  description: "Buy tickets into a shared prize pool during a timed round. One ticket is selected via on-chain pseudo-randomness, paying out the jackpot to the winner.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col bg-cream text-charcoal">
        <WalletProvider>
          <SharedLayout>{children}</SharedLayout>
        </WalletProvider>
      </body>
    </html>
  );
}
