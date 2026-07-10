import "./globals.css";
import { AetherWalletProvider } from "../modules/wallet/WalletProvider";
import AppLayout from "../modules/layout/AppLayout";

export const metadata = {
  title: "Aether Sweepstakes | Stellar Soroban yield pool dApp",
  description: "Acquire entries into a shared premium sweepstakes yield pool. The contract draws the winner on-chain via pseudo-randomness, distributing accumulated yields.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col bg-bone text-ink">
        <AetherWalletProvider>
          <AppLayout>{children}</AppLayout>
        </AetherWalletProvider>
      </body>
    </html>
  );
}
