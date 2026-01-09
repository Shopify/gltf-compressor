import fs from "fs";
import path from "path";

import react from "@vitejs/plugin-react";
import { defineConfig, Plugin } from "vite";
import glsl from "vite-plugin-glsl";

const staticFiles = new Map([
  [
    "/basis/basis_transcoder.js",
    "node_modules/three/examples/jsm/libs/basis/basis_transcoder.js",
  ],
  [
    "/basis/basis_transcoder.wasm",
    "node_modules/three/examples/jsm/libs/basis/basis_transcoder.wasm",
  ],
  [
    "/basis/basis_encoder.js",
    "node_modules/ktx2-encoder/dist/basis/basis_encoder.js",
  ],
  [
    "/basis/basis_encoder.wasm",
    "node_modules/ktx2-encoder/dist/basis/basis_encoder.wasm",
  ],
]);

const mimeTypes = new Map([
  [".js", "application/javascript"],
  [".wasm", "application/wasm"],
]);

function staticCopyPlugin(): Plugin {
  return {
    name: "static-copy",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const src = staticFiles.get(req.url!);
        if (!src) return next();

        const mimeType =
          mimeTypes.get(path.extname(src)) ?? "application/octet-stream";
        res.setHeader("Content-Type", mimeType);
        res.end(fs.readFileSync(path.resolve(__dirname, src)));
      });
    },
    writeBundle() {
      for (const [dest, src] of staticFiles) {
        const destPath = path.resolve(__dirname, "dist", dest.slice(1));
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.copyFileSync(path.resolve(__dirname, src), destPath);
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), glsl(), staticCopyPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ["ktx2-encoder"],
  },
  worker: {
    format: "es",
  },
});
