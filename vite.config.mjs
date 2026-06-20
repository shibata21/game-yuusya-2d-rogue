import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function copyPixelAssets() {
  return {
    name: "copy-pixel-assets",
    closeBundle() {
      copyDir("assets/pixel", "dist/assets/pixel");
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [copyPixelAssets()],
  build: {
    chunkSizeWarningLimit: 1600,
  },
});
