#!/usr/bin/env node
/**
 * Generate PWA icons from AppThumbnail.png using sharp.
 * CommonJS version.
 */

'use strict';

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SRC = '/home/ubuntu/workspace/app/src/frontend/public/assets/AppThumbnail.png';
const OUT_DIR = '/home/ubuntu/workspace/app/src/frontend/public/assets';

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error('ERROR: Source file not found:', SRC);
    process.exit(1);
  }

  const srcStat = fs.statSync(SRC);
  console.log('Source image:', SRC, '(' + srcStat.size.toLocaleString() + ' bytes)');

  const meta = await sharp(SRC).metadata();
  console.log('Source dimensions:', meta.width + 'x' + meta.height);

  // --- Icon 1: icon-192x192.png ---
  const out192 = path.join(OUT_DIR, 'icon-192x192.png');
  await sharp(SRC)
    .resize(192, 192, { fit: 'fill' })
    .png({ compressionLevel: 9 })
    .toFile(out192);
  const size192 = fs.statSync(out192).size;
  console.log('icon-192x192.png:', size192.toLocaleString(), 'bytes');
  if (size192 < 1024) throw new Error('icon-192x192.png too small');

  // --- Icon 2: icon-512x512.png ---
  const out512 = path.join(OUT_DIR, 'icon-512x512.png');
  await sharp(SRC)
    .resize(512, 512, { fit: 'fill' })
    .png({ compressionLevel: 9 })
    .toFile(out512);
  const size512 = fs.statSync(out512).size;
  console.log('icon-512x512.png:', size512.toLocaleString(), 'bytes');
  if (size512 < 1024) throw new Error('icon-512x512.png too small');

  // --- Icon 3: icon-512x512-maskable.png ---
  // Sample background color from corners
  const { data: cornerPixels, info: cornerInfo } = await sharp(SRC)
    .extract({ left: 0, top: 0, width: 20, height: 20 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = cornerInfo.channels;
  const colorMap = {};
  for (let i = 0; i < cornerPixels.length; i += channels) {
    const r = cornerPixels[i];
    const g = cornerPixels[i + 1];
    const b = cornerPixels[i + 2];
    const a = channels === 4 ? cornerPixels[i + 3] : 255;
    if (a > 128) {
      const key = r + ',' + g + ',' + b;
      colorMap[key] = (colorMap[key] || 0) + 1;
    }
  }

  // Sample bottom-right corner too
  const { data: cp2, info: ci2 } = await sharp(SRC)
    .extract({ left: meta.width - 20, top: meta.height - 20, width: 20, height: 20 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const ch2 = ci2.channels;
  for (let i = 0; i < cp2.length; i += ch2) {
    const r = cp2[i], g = cp2[i + 1], b = cp2[i + 2];
    const a = ch2 === 4 ? cp2[i + 3] : 255;
    if (a > 128) {
      const key = r + ',' + g + ',' + b;
      colorMap[key] = (colorMap[key] || 0) + 1;
    }
  }

  let bgColor = { r: 0, g: 98, b: 170 };
  let maxCount = 0;
  for (const [key, count] of Object.entries(colorMap)) {
    if (count > maxCount) {
      maxCount = count;
      const parts = key.split(',');
      bgColor = { r: Number(parts[0]), g: Number(parts[1]), b: Number(parts[2]) };
    }
  }
  console.log('Detected background color: rgb(' + bgColor.r + ', ' + bgColor.g + ', ' + bgColor.b + ')');

  // Resize tug to 60% of 512 = 307px, centered on background
  const tugSize = Math.floor(512 * 0.60);
  const offset = Math.floor((512 - tugSize) / 2);

  const tugBuf = await sharp(SRC)
    .resize(tugSize, tugSize, { fit: 'fill' })
    .png()
    .toBuffer();

  const outMaskable = path.join(OUT_DIR, 'icon-512x512-maskable.png');
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: bgColor.r, g: bgColor.g, b: bgColor.b, alpha: 1 }
    }
  })
    .composite([{ input: tugBuf, top: offset, left: offset }])
    .png({ compressionLevel: 9 })
    .toFile(outMaskable);

  const sizeMaskable = fs.statSync(outMaskable).size;
  console.log('icon-512x512-maskable.png:', sizeMaskable.toLocaleString(), 'bytes');
  if (sizeMaskable < 1024) throw new Error('icon-512x512-maskable.png too small');

  console.log('\n[OK] All icons generated successfully!');
  console.log('  icon-192x192.png          :', size192.toLocaleString(), 'bytes');
  console.log('  icon-512x512.png          :', size512.toLocaleString(), 'bytes');
  console.log('  icon-512x512-maskable.png :', sizeMaskable.toLocaleString(), 'bytes');
}

main().catch(function(err) {
  console.error('FAILED:', err.message);
  process.exit(1);
});
