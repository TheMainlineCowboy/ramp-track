#!/usr/bin/env node
/**
 * prune-unused-images.js
 *
 * Removes images from src/frontend/public/assets/ that are not referenced
 * anywhere in the compiled output (JS/CSS bundles, index.html, manifest.json).
 *
 * Files in ALWAYS_KEEP are never deleted regardless of references.
 */

import fs from "fs/promises";
import path from "path";

// These files are ALWAYS preserved — never deleted, regardless of scan results.
const ALWAYS_KEEP = new Set([
  "icon-192x192.png",
  "icon-512x512.png",
  "icon-512x512-maskable.png",
  "operator-home-screenshot.png",
  "admin-dashboard-screenshot.png",
]);

const ASSETS_DIR = "src/frontend/public/assets";
const DIST_DIR = "src/frontend/dist";

async function pruneUnusedImages() {
  // Collect all text content from compiled JS/CSS bundles
  let contents = [];
  try {
    const distAssets = path.join(DIST_DIR, "assets");
    const distFiles = await fs.readdir(distAssets);
    for (const file of distFiles) {
      if (file.endsWith(".js") || file.endsWith(".css")) {
        const content = await fs.readFile(path.join(distAssets, file), "utf-8").catch(() => "");
        contents.push(content);
      }
    }
  } catch {
    // dist/assets may not exist on first run — skip silently
  }

  // Also scan dist/index.html and dist/manifest.json so icons and screenshots
  // referenced there are never pruned.
  const htmlContent = await fs.readFile(path.join(DIST_DIR, "index.html"), "utf-8").catch(() => "");
  const manifestContent = await fs.readFile(path.join(DIST_DIR, "manifest.json"), "utf-8").catch(() => "");

  const combinedContent = [...contents, htmlContent, manifestContent].join("\n");

  // List all files in public/assets
  let assetFiles;
  try {
    assetFiles = await fs.readdir(ASSETS_DIR);
  } catch {
    console.log("No assets directory found — skipping prune.");
    return;
  }

  let pruned = 0;
  for (const file of assetFiles) {
    const basename = path.basename(file);

    // Never delete explicitly protected files
    if (ALWAYS_KEEP.has(basename)) {
      continue;
    }

    // Keep if referenced anywhere in the compiled output
    if (combinedContent.includes(file)) {
      continue;
    }

    // Delete unreferenced file
    try {
      await fs.unlink(path.join(ASSETS_DIR, file));
      console.log(`Pruned: ${file}`);
      pruned++;
    } catch {
      // ignore errors on individual files
    }
  }

  console.log(`Prune complete. Removed ${pruned} unused image(s).`);
}

pruneUnusedImages().catch((err) => {
  console.error("prune-unused-images error:", err);
  process.exit(1);
});
