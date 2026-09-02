import path from "path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["@chesstopia/chess-engine"],
  },
  server: {
    // Der generierte Client ruft /api/v1/… same-origin auf (openapi.yaml servers[0] = /).
    // In Prod routet Caddy /api/* ans Backend; im Dev übernimmt das dieser Proxy.
    proxy: {
      "/api": "http://localhost:8080",
    },
  },
  test: {
    // Ebene 2 aus ADR-0019 braucht ein DOM. Reine Unit-Tests (fen.test.ts) laufen
    // unter jsdom unverändert; der Aufpreis rechtfertigt keine zweite Projektdatei.
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    // Ohne diese Zeile räumt die Testing Library nicht auf — Vitest läuft hier ohne
    // `globals: true`, und ihr automatisches Cleanup hängt an einem globalen afterEach.
    setupFiles: ["./src/test/setup.ts"],
  },
});
