#!/usr/bin/env node
/**
 * generate-icons.mjs
 * Generates PWA icon sizes from AppThumbnail.png using sharp.
 * Preserves transparency. No background added.
 */

import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const src = path.join(root, "src/frontend/public/AppThumbnail.png");
const outDir = path.join(root, "src/frontend/public/assets");

async function main() {
  console.log("Source:", src);

  const meta = await sharp(src).metadata();
  console.log(`Source dimensions: ${meta.width}x${meta.height}, channels: ${meta.channels}`);

  // icon-192x192.png — plain resize, keep transparency
  await sharp(src)
    .resize(192, 192, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(path.join(outDir, "icon-192x192.png"));
  console.log("✓ icon-192x192.png");

  // icon-512x512.png — plain resize, keep transparency
  await sharp(src)
    .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(path.join(outDir, "icon-512x512.png"));
  console.log("✓ icon-512x512.png");

  // icon-512x512-maskable.png — 20% safe zone padding (~51px each side), keep transparency
  // Content fills 80% of 512 = 409px, centered with 51px padding on each side
  const contentSize = Math.round(512 * 0.8); // 410
  const padding = Math.floor((512 - contentSize) / 2); // 51

  await sharp(src)
    .resize(contentSize, contentSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: padding,
      bottom: 512 - contentSize - padding,
      left: padding,
      right: 512 - contentSize - padding,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toFile(path.join(outDir, "icon-512x512-maskable.png"));
  console.log("✓ icon-512x512-maskable.png");

  console.log("Done. All icons generated with transparent backgrounds.");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
