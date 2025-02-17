import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), glsl()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
