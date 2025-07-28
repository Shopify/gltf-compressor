import path from "path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), glsl()],
  resolve: {
    alias: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
