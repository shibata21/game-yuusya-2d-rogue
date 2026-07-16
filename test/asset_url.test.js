"use strict";

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { assetUrl } from "../src/assetUrl.js";
import { PIXEL_ASSET_VERSION, pixelAssetUrl } from "../src/gameCore.js";

const repoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("固定素材URL", () => {
  it("デプロイ版がない場合は呼び出し元の版を使う", () => {
    vi.stubEnv("VITE_ASSET_VERSION", "   ");

    expect(assetUrl("assets/audio/dig.wav", "v2-audio")).toBe("assets/audio/dig.wav?v=v2-audio");
    expect(pixelAssetUrl("tiles.png")).toBe(`assets/pixel/tiles.png?v=${PIXEL_ASSET_VERSION}`);
  });

  it("デプロイ版をPNGとWAVの共通版として優先する", () => {
    vi.stubEnv("VITE_ASSET_VERSION", "deploy-sha-123");

    expect(assetUrl("assets/audio/dig.wav", "v2-audio")).toBe("assets/audio/dig.wav?v=deploy-sha-123");
    expect(pixelAssetUrl("tiles.png")).toBe("assets/pixel/tiles.png?v=deploy-sha-123");
  });

  it("版をURL用にエンコードし、既存クエリを維持する", () => {
    vi.stubEnv("VITE_ASSET_VERSION", "release/2026 07");

    expect(assetUrl("assets/audio/dig.wav?channel=se", "v2-audio")).toBe(
      "assets/audio/dig.wav?channel=se&v=release%2F2026%2007",
    );
  });

  it("PagesビルドへコミットSHAを渡す", () => {
    const workflow = fs.readFileSync(path.join(repoDir, ".github/workflows/deploy-pages.yml"), "utf8");

    expect(workflow).toMatch(/- name: Build Web app\s+env:\s+VITE_ASSET_VERSION: \$\{\{ github\.sha \}\}\s+run: npm run build/);
  });
});
