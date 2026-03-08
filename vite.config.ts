import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      // Build a SINGLE SW at origin root so it can:
      // - control the whole app scope (PWA)
      // - receive FCM pushes (Web Push background notifications)
      filename: "firebase-messaging-sw.ts",
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "smartcanteen-logo.png"],
      manifest: {
        name: "SmartCanteen",
        short_name: "SmartCanteen",
        description: "SmartCanteen - Smart Canteen System",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#ffffff",
        icons: [
          {
            src: "/smartcanteen-logo.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/smartcanteen-logo.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      devOptions: {
        enabled: true,
        // Required for injectManifest in dev.
        type: "module",
      },
    }),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
