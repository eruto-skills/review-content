#!/usr/bin/env node
/**
 * generate-remotion-stills.js
 *
 * Remotion プロジェクトの全スライドを PNG still として生成する。
 * 各スライドの最終フレーム（アニメーション完了後）を出力。
 * review-content スキルの Axis 14（Visual sync）評価に使用。
 *
 * Usage (Remotion プロジェクトルートから):
 *   node <path>/generate-remotion-stills.js \
 *     --slides=src/slides.ts \
 *     --out=stills \
 *     --entry=src/index.ts \
 *     --composition=Main \
 *     [--main=src/Main.tsx]
 *
 * Output:
 *   stills/<key>.png  — 各スライドの PNG
 *   stills/manifest.json  — 生成結果サマリー
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── 引数パース ────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {};
  for (const arg of argv.slice(2)) {
    const raw  = arg.replace(/^--/, '');
    const eqIdx = raw.indexOf('=');
    const key  = eqIdx === -1 ? raw : raw.slice(0, eqIdx);
    const val  = eqIdx === -1 ? true : raw.slice(eqIdx + 1);
    args[key] = val;
  }
  return args;
}

// ── slides.ts パーサ ──────────────────────────────────────────────────────

function parseSlides(content) {
  const slides = [];
  const re = /\{\s*key:\s*['"]([^'"]+)['"][\s\S]*?duration:\s*(\d+)(?:[\s\S]*?topic:\s*['"]([^'"]*)'")?\s*\}/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    slides.push({ key: m[1], duration: parseInt(m[2], 10), topic: m[3] || undefined });
  }
  return slides;
}

// ── Main.tsx パーサ ───────────────────────────────────────────────────────

function findImplementedKeys(mainContent) {
  const impl = new Set();
  const re   = /if\s*\(\s*key\s*===\s*['"]([^'"]+)['"]\s*\)/g;
  let m;
  while ((m = re.exec(mainContent)) !== null) impl.add(m[1]);
  return impl;
}

// ── エントリポイント ──────────────────────────────────────────────────────

const args       = parseArgs(process.argv);
const slidesPath = args.slides      || 'src/slides.ts';
const outDir     = args.out         || 'stills';
const entryFile  = args.entry       || 'src/index.ts';
const composition = args.composition || 'Main';
const mainPath   = args.main        || 'src/Main.tsx';

if (!fs.existsSync(slidesPath)) {
  process.stderr.write(`ERROR: slides.ts not found: ${slidesPath}\n`);
  process.exit(1);
}

const slides = parseSlides(fs.readFileSync(slidesPath, 'utf8'));
const implementedKeys = fs.existsSync(mainPath)
  ? findImplementedKeys(fs.readFileSync(mainPath, 'utf8'))
  : null;

fs.mkdirSync(outDir, { recursive: true });

let cumFrame = 0;
const results = [];

for (const slide of slides) {
  const lastFrame = cumFrame + slide.duration - 1;
  const isImpl    = implementedKeys ? implementedKeys.has(slide.key) : true;

  if (!isImpl) {
    console.log(`SKIP  ${slide.key} (Placeholder — frames ${cumFrame}–${lastFrame})`);
    results.push({ key: slide.key, isPlaceholder: true, startFrame: cumFrame, lastFrame });
    cumFrame += slide.duration;
    continue;
  }

  const outFile = path.join(outDir, `${slide.key}.png`);
  // npx remotion still <entry> <composition> <output> --frame=N
  const cmd = [
    'npx remotion still',
    `"${entryFile}"`,
    `"${composition}"`,
    `"${outFile}"`,
    `--frame=${lastFrame}`,
  ].join(' ');

  console.log(`→ ${slide.key} (frame ${lastFrame} / ${slide.duration}f)...`);
  try {
    execSync(cmd, { stdio: 'inherit' });
    results.push({
      key:        slide.key,
      topic:      slide.topic,
      startFrame: cumFrame,
      lastFrame,
      outFile,
      success:    true,
    });
  } catch (err) {
    process.stderr.write(`  FAILED: ${err.message}\n`);
    results.push({
      key:        slide.key,
      topic:      slide.topic,
      startFrame: cumFrame,
      lastFrame,
      success:    false,
      error:      err.message,
    });
  }

  cumFrame += slide.duration;
}

// manifest
const manifestPath = path.join(outDir, 'manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(results, null, 2));

const ok   = results.filter(r => r.success === true).length;
const skip = results.filter(r => r.isPlaceholder).length;
const fail = results.filter(r => r.success === false).length;

console.log(`\nManifest → ${manifestPath}`);
console.log(`Done: ${ok} generated, ${skip} skipped (placeholder), ${fail} failed`);
if (fail > 0) process.exit(1);
