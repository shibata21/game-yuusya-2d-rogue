"use strict";

export function assetUrl(path, fallbackVersion = "") {
  const deployVersion = String(import.meta.env?.VITE_ASSET_VERSION || "").trim();
  const version = deployVersion || String(fallbackVersion || "").trim();
  if (!version) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}v=${encodeURIComponent(version)}`;
}
