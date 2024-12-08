import "@rainbow-me/rainbowkit/styles.css";
import {
  getDefaultConfig,
  RainbowKitProvider,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import React from "react";
import App from "./App";

// Définir la chaîne Sonic Blaze en JavaScript sans types TypeScript
const sonicBlaze = {
  id: 57054,
  name: "Sonic Blaze Testnet",
  network: "sonic",
  rpcUrls: {
    default: { http: ["https://rpc.blaze.soniclabs.com"] },
  },
  blockExplorers: {
    default: { name: "Sonic Explorer", url: "https://sonic.explorer" }, // Remplacez avec l'URL de l'explorateur de blocs si disponible
  },
  nativeCurrency: {
    name: "SONIC",
    symbol: "S",
    decimals: 18,
  },
};

const queryClient = new QueryClient();

const config = getDefaultConfig({
  appName: "My RainbowKit App",
  projectId: "YOUR_PROJECT_ID",
  chains: [sonicBlaze], // Ajoutez Sonic Blaze à la liste des chaînes
  ssr: true,
});

function AppProvider() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider locale="zh-En"
          theme={lightTheme({
            accentColor: "#0553F7",
            accentColorForeground: "white",
            fontStack: "system",
            overlayBlur: "small",
          })}
        >
          <div style={{ display: "flex", justifyContent: "flex-start"}}>
          <App /></div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default AppProvider;