import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";

function copyDir(src, dest, options = {}) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (options.skipNames && options.skipNames.has(entry.name)) continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to, options);
    else fs.copyFileSync(from, to);
  }
}

function copyStaticAssets() {
  return {
    name: "copy-static-assets",
    closeBundle() {
      copyDir("assets/pixel", "dist/assets/pixel", { skipNames: new Set(["source"]) });
      copyDir("assets/audio", "dist/assets/audio");
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [copyStaticAssets()],
  build: {
    chunkSizeWarningLimit: 1600,
  },
});
