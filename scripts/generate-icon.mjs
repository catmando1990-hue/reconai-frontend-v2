// Generate Windows .ico (and a PNG) from a wide source logo by padding it onto
// a square black canvas. Run: node scripts/generate-icon.mjs
import sharp from "sharp";
import pngToIco from "png-to-ico";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const SOURCE = path.resolve("electron/Logo 1.png");
const OUT_DIR = path.resolve("electron/build");
const ICO_OUT = path.join(OUT_DIR, "icon.ico");
const PNG_OUT = path.join(OUT_DIR, "icon.png");

const SIZES = [16, 32, 48, 64, 128, 256];

async function makeSquarePng(size) {
  // Resize logo to fit within ~85% of the square, then pad on a black canvas.
  const inner = Math.round(size * 0.85);
  const resized = await sharp(SOURCE)
    .resize({ width: inner, height: inner, fit: "inside" })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .composite([{ input: resized, gravity: "center" }])
    .png()
    .toBuffer();
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const buffers = await Promise.all(SIZES.map(makeSquarePng));

  // Save the largest as icon.png (used by Linux builds later).
  await writeFile(PNG_OUT, buffers[buffers.length - 1]);

  // Combine all sizes into a multi-resolution .ico.
  const ico = await pngToIco(buffers);
  await writeFile(ICO_OUT, ico);

  console.log(`Wrote ${ICO_OUT} and ${PNG_OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
