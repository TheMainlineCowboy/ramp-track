#!/usr/bin/env node
/**
 * Generate PWA icons from AppThumbnail.png using sharp.
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SRC = '/home/ubuntu/workspace/app/src/frontend/public/assets/AppThumbnail.png';
const OUT_DIR = '/home/ubuntu/workspace/app/src/frontend/public/assets';

async function main() {
  // Verify source exists
  if (!fs.existsSync(SRC)) {
    console.error('ERROR: Source file not found:', SRC);
    process.exit(1);
  }

  const srcStat = fs.statSync(SRC);
  console.log(`Source image: ${SRC} (${srcStat.size.toLocaleString()} bytes)`);

  // Get source image metadata
  const meta = await sharp(SRC).metadata();
  console.log(`Source dimensions: ${meta.width}x${meta.height}`);

  // --- Icon 1: icon-192x192.png ---
  const out192 = path.join(OUT_DIR, 'icon-192x192.png');
  await sharp(SRC)
    .resize(192, 192, { fit: 'fill' })
    .png({ compressionLevel: 9 })
    .toFile(out192);
  const size192 = fs.statSync(out192).size;
  console.log(`icon-192x192.png: ${size192.toLocaleString()} bytes`);
  if (size192 < 1024) throw new Error('icon-192x192.png too small - likely corrupted');

  // --- Icon 2: icon-512x512.png ---
  const out512 = path.join(OUT_DIR, 'icon-512x512.png');
  await sharp(SRC)
    .resize(512, 512, { fit: 'fill' })
    .png({ compressionLevel: 9 })
    .toFile(out512);
  const size512 = fs.statSync(out512).size;
  console.log(`icon-512x512.png: ${size512.toLocaleString()} bytes`);
  if (size512 < 1024) throw new Error('icon-512x512.png too small - likely corrupted');

  // --- Icon 3: icon-512x512-maskable.png ---
  // Sample the dominant background color from corners of the source image
  // Get the raw pixels from a small top-left corner crop
  const cornerData = await sharp(SRC)
    .extract({ left: 0, top: 0, width: 20, height: 20 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data: cornerPixels, info: cornerInfo } = cornerData;
  const channels = cornerInfo.channels; // 3 or 4

  // Count pixel colors from corners to find background
  const colorMap = {};
  for (let i = 0; i < cornerPixels.length; i += channels) {
    const r = cornerPixels[i];
    const g = cornerPixels[i + 1];
    const b = cornerPixels[i + 2];
    const a = channels === 4 ? cornerPixels[i + 3] : 255;
    if (a > 128) {
      const key = `${r},${g},${b}`;
      colorMap[key] = (colorMap[key] || 0) + 1;
    }
  }

  // Also sample bottom-right corner
  const cornerData2 = await sharp(SRC)
    .extract({ left: meta.width - 20, top: meta.height - 20, width: 20, height: 20 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { data: cornerPixels2, info: cornerInfo2 } = cornerData2;
  const channels2 = cornerInfo2.channels;
  for (let i = 0; i < cornerPixels2.length; i += channels2) {
    const r = cornerPixels2[i];
    const g = cornerPixels2[i + 1];
    const b = cornerPixels2[i + 2];
    const a = channels2 === 4 ? cornerPixels2[i + 3] : 255;
    if (a > 128) {
      const key = `${r},${g},${b}`;
      colorMap[key] = (colorMap[key] || 0) + 1;
    }
  }

  // Find most common background color
  let bgColor = { r: 0, g: 98, b: 170 }; // fallback blue
  let maxCount = 0;
  for (const [key, count] of Object.entries(colorMap)) {
    if (count > maxCount) {
      maxCount = count;
      const [r, g, b] = key.split(',').map(Number);
      bgColor = { r, g, b };
    }
  }
  console.log(`Detected background color: rgb(${bgColor.r}, ${bgColor.g}, ${bgColor.b})`);

  // Resize tug to 60% of 512 = ~307px
  const tugSize = Math.floor(512 * 0.60);
  const offset = Math.floor((512 - tugSize) / 2);

  // Resize the source to tugSize x tugSize
  const tugBuf = await sharp(SRC)
    .resize(tugSize, tugSize, { fit: 'fill' })
    .png()
    .toBuffer();

  // Create canvas with background color and overlay the tug centered
  const outMaskable = path.join(OUT_DIR, 'icon-512x512-maskable.png');
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: bgColor.r, g: bgColor.g, b: bgColor.b, alpha: 1 }
    }
  })
    .composite([{
      input: tugBuf,
      top: offset,
      left: offset
    }])
    .png({ compressionLevel: 9 })
    .toFile(outMaskable);

  const sizeMaskable = fs.statSync(outMaskable).size;
  console.log(`icon-512x512-maskable.png: ${sizeMaskable.toLocaleString()} bytes`);
  if (sizeMaskable < 1024) throw new Error('icon-512x512-maskable.png too small - likely corrupted');

  console.log('\n✅ All icons generated successfully!');
  console.log(`  icon-192x192.png          : ${size192.toLocaleString()} bytes`);
  console.log(`  icon-512x512.png          : ${size512.toLocaleString()} bytes`);
  console.log(`  icon-512x512-maskable.png : ${sizeMaskable.toLocaleString()} bytes`);
}

main().catch(err => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
