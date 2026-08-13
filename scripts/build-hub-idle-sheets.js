/**
 * Build compact hub idle spritesheets for Knight + Dark Thief portraits.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const OUT_KNIGHT = path.join(ROOT, 'games/knights-quest/assets');
const THIEF_SRC = 'C:/Users/ARMANDO/Downloads/_thief_preview/The Female Dark Thief/A - Animations/idle a';
const OUT_THIEF = path.join(ROOT, 'games/dark-thief/assets');

async function trimFrame(buf) {
  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  let minX = width,
    minY = height,
    maxX = 0,
    maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = data[(y * width + x) * channels + 3];
      if (a > 8) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX) {
    return { buf: await sharp(buf).png().toBuffer(), w: width, h: height };
  }
  const pad = 4;
  const left = Math.max(0, minX - pad);
  const top = Math.max(0, minY - pad);
  const tw = Math.min(width - left, maxX - minX + 1 + pad * 2);
  const th = Math.min(height - top, maxY - minY + 1 + pad * 2);
  const out = await sharp(buf).extract({ left, top, width: tw, height: th }).png().toBuffer();
  return { buf: out, w: tw, h: th };
}

async function sheetFromFrames(framePaths, outFile, targetH) {
  const trimmed = [];
  for (const fp of framePaths) {
    const raw = await fs.promises.readFile(fp);
    trimmed.push(await trimFrame(raw));
  }
  const maxW = Math.max(...trimmed.map((t) => t.w));
  const maxH = Math.max(...trimmed.map((t) => t.h));
  const scale = targetH / maxH;
  const fw = Math.ceil(maxW * scale);
  const fh = Math.ceil(maxH * scale);
  const canvas = sharp({
    create: {
      width: fw * trimmed.length,
      height: fh,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  });
  const comps = [];
  for (let i = 0; i < trimmed.length; i++) {
    const resized = await sharp(trimmed[i].buf)
      .resize(fw, fh, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    comps.push({ input: resized, left: i * fw, top: 0 });
  }
  await canvas.composite(comps).png().toFile(outFile);
  return { frames: trimmed.length, fw, fh, file: outFile };
}

async function knightFromExistingSheet() {
  const src = path.join(OUT_KNIGHT, 'idle.png');
  const meta = await sharp(src).metadata();
  const frames = 12;
  const sw = meta.width / frames;
  const sh = meta.height;
  const frameBufs = [];
  for (let i = 0; i < frames; i++) {
    frameBufs.push(
      await sharp(src)
        .extract({ left: Math.round(i * sw), top: 0, width: Math.round(sw), height: sh })
        .png()
        .toBuffer()
    );
  }
  const tmp = path.join(OUT_KNIGHT, '_hub_frames');
  fs.mkdirSync(tmp, { recursive: true });
  const paths = [];
  for (let i = 0; i < frameBufs.length; i++) {
    const fp = path.join(tmp, `f${i}.png`);
    await fs.promises.writeFile(fp, frameBufs[i]);
    paths.push(fp);
  }
  const info = await sheetFromFrames(paths, path.join(OUT_KNIGHT, 'hub-idle.png'), 220);
  fs.rmSync(tmp, { recursive: true, force: true });
  // static fallback first frame
  await sharp(path.join(OUT_KNIGHT, 'hub-idle.png'))
    .extract({ left: 0, top: 0, width: info.fw, height: info.fh })
    .png()
    .toFile(path.join(OUT_KNIGHT, 'hub-knight.png'));
  return info;
}

async function thiefIdle() {
  fs.mkdirSync(OUT_THIEF, { recursive: true });
  const files = fs
    .readdirSync(THIEF_SRC)
    .filter((f) => /^idle a_\d+\.png$/i.test(f))
    .sort();
  const paths = files.map((f) => path.join(THIEF_SRC, f));
  const info = await sheetFromFrames(paths, path.join(OUT_THIEF, 'hub-idle.png'), 220);
  await sharp(path.join(OUT_THIEF, 'hub-idle.png'))
    .extract({ left: 0, top: 0, width: info.fw, height: info.fh })
    .png()
    .toFile(path.join(OUT_THIEF, 'hub-thief.png'));
  await sharp(path.join(OUT_THIEF, 'hub-thief.png'))
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(OUT_THIEF, 'icon.png'));
  fs.writeFileSync(
    path.join(OUT_THIEF, 'hub-manifest.json'),
    JSON.stringify({ idle: { file: 'hub-idle.png', frames: info.frames, w: info.fw, h: info.fh, fps: 10 } }, null, 2)
  );
  return info;
}

(async () => {
  const k = await knightFromExistingSheet();
  fs.writeFileSync(
    path.join(OUT_KNIGHT, 'hub-manifest.json'),
    JSON.stringify({ idle: { file: 'hub-idle.png', frames: k.frames, w: k.fw, h: k.fh, fps: 10 } }, null, 2)
  );
  console.log('knight', k);
  const t = await thiefIdle();
  console.log('thief', t);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
