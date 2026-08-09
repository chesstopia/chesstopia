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
  test: {
    // Ebene 2 aus ADR-0019 braucht ein DOM. Reine Unit-Tests (fen.test.ts) laufen
    // unter jsdom unverändert; der Aufpreis rechtfertigt keine zweite Projektdatei.
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
