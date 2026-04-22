#!/usr/bin/env node
'use strict';

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SRC = '/home/ubuntu/workspace/app/src/frontend/public/assets/AppThumbnail.png';
const OUT_DIR = '/home/ubuntu/workspace/app/src/frontend/public/assets';

async function main() {
  const meta = await sharp(SRC).metadata();
  console.log('Source:', meta.width + 'x' + meta.height, meta.format);

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
  // The source image is: dark gray outer bg -> blue circle -> white tug
  // For maskable: fill the FULL 512x512 canvas with blue (the circle color)
  // then center the tug at 60% scale so the blue extends to all edges
  // This ensures Android adaptive icon cropping looks correct

  // Blue background color from the circular badge area of the source
  const BLUE_BG = { r: 14, g: 109, b: 153, alpha: 1 };

  // Resize source to 60% of 512 = 307px (safe-zone compliant)
  const tugSize = Math.floor(512 * 0.60); // 307
  const offset = Math.floor((512 - tugSize) / 2); // 102

  // Resize the original source to tugSize - the tug will include its own bg
  // But since we want the blue to extend fully, we need to composite differently.
  // Strategy: create blue canvas, then paste the source resized to tugSize centered
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
      background: BLUE_BG
    }
  })
    .composite([{ input: tugBuf, top: offset, left: offset }])
    .png({ compressionLevel: 9 })
    .toFile(outMaskable);

  const sizeMaskable = fs.statSync(outMaskable).size;
  console.log('icon-512x512-maskable.png:', sizeMaskable.toLocaleString(), 'bytes');
  if (sizeMaskable < 1024) throw new Error('icon-512x512-maskable.png too small');

  console.log('\n[OK] All icons regenerated from new AppThumbnail.png');
  console.log('  Background fill used for maskable: rgb(14, 109, 153) [blue]');
  console.log('  Tug scaled to', tugSize + 'x' + tugSize, 'at offset', offset + ',', offset);
  console.log('  icon-192x192.png          :', size192.toLocaleString(), 'bytes');
  console.log('  icon-512x512.png          :', size512.toLocaleString(), 'bytes');
  console.log('  icon-512x512-maskable.png :', sizeMaskable.toLocaleString(), 'bytes');
}

main().catch(function(err) {
  console.error('FAILED:', err.message);
  process.exit(1);
});
