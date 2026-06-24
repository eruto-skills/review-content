#!/usr/bin/env node
/**
 * extract-remotion-narration.js
 *
 * Remotion プロジェクトの slides.ts と scenes/*.tsx からテキストを抽出する。
 * review-content スキルの Narration Source: remotion-scenes 向け。
 *
 * Usage (Remotion プロジェクトルートから):
 *   node <path>/extract-remotion-narration.js \
 *     --slides=src/slides.ts \
 *     --scenes=src/scenes \
 *     --main=src/Main.tsx
 *
 * Output: JSON → stdout  /  サマリー → stderr
 */

const fs   = require('fs');
const path = require('path');

// ── 引数パース ────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {};
  for (const arg of argv.slice(2)) {
    const eqIdx = arg.replace(/^--/, '').indexOf('=');
    const key   = eqIdx === -1 ? arg.replace(/^--/, '') : arg.replace(/^--/, '').slice(0, eqIdx);
    const val   = eqIdx === -1 ? true : arg.slice(2 + eqIdx + 1);
    args[key] = val;
  }
  return args;
}

// ── slides.ts パーサ ──────────────────────────────────────────────────────

/**
 * slides.ts の sections 配列から全スライドを順番どおりに取得する。
 * { key, duration, topic? } の配列を返す。
 */
function parseSlides(content) {
  const slides = [];
  // { key: 'xxx', duration: N } or { key: 'xxx', duration: N, topic: '...' }
  const re = /\{\s*key:\s*['"]([^'"]+)['"][\s\S]*?duration:\s*(\d+)(?:[\s\S]*?topic:\s*['"]([^'"]*)'")?\s*\}/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    slides.push({
      key:      m[1],
      duration: parseInt(m[2], 10),
      topic:    m[3] || undefined,
    });
  }
  return slides;
}

// ── Main.tsx パーサ ───────────────────────────────────────────────────────

/**
 * renderSlide 関数の `if (key === '...')` から実装済みキーを取得する。
 */
function findImplementedKeys(mainContent) {
  const impl = new Set();
  const re = /if\s*\(\s*key\s*===\s*['"]([^'"]+)['"]\s*\)/g;
  let m;
  while ((m = re.exec(mainContent)) !== null) impl.add(m[1]);
  return impl;
}

// ── テキスト抽出 ──────────────────────────────────────────────────────────

/**
 * TSX ファイルから人間が読めるテキスト文字列を抽出する。
 * JSX テキストノード / JSX 文字列式 / データ配列のプロパティ値 を対象とする。
 */
function extractTexts(content) {
  const results = [];
  const seen    = new Set();

  function add(raw) {
    const t = raw.trim().replace(/\s+/g, ' ');
    if (t.length < 2) return;
    // 純粋な数値・記号・コード構文は除外
    if (/^[\d.,;:!?()\[\]{}\-+=*/\\@#$%^&|~<>\s]+$/.test(t)) return;
    if (/^(import|export|const|let|var|return|function|if|else)\b/.test(t)) return;
    if (seen.has(t)) return;
    seen.add(t);
    results.push(t);
  }

  // 1) データ配列内のテキストプロパティ: text/label/desc/body/answer/topic/header/badge/emoji
  const propRe = /(?:text|label|desc(?:ription)?|body|answer|topic|header|badge|emoji|number):\s*['"]([^'"]{2,})['"]/g;
  let m;
  while ((m = propRe.exec(content)) !== null) add(m[1]);

  // 2) JSX 文字列式: {'...'} or {"..."}
  const exprRe = /\{\s*['"]([^'"]{2,})['"]\s*\}/g;
  while ((m = exprRe.exec(content)) !== null) add(m[1]);

  // 3) JSX テキストノード: > テキスト < (改行なし・3文字以上)
  const nodeRe = />([^\n<>{}'"`]{3,})</g;
  while ((m = nodeRe.exec(content)) !== null) add(m[1]);

  // 4) SVG <text> 要素の文字列リテラル (変数展開は含まない)
  const svgRe = /<text[^>]*>([^{<]{2,})<\/text>/gs;
  while ((m = svgRe.exec(content)) !== null) add(m[1]);

  return results;
}

// ── スライドキー → シーンファイル名 ──────────────────────────────────────

/** snake_case → PascalCaseScene: e.g. min_p → MinPScene */
function keyToSceneName(key) {
  return key
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('') + 'Scene';
}

// ── エントリポイント ──────────────────────────────────────────────────────

const args      = parseArgs(process.argv);
const slidesPath = args.slides || 'src/slides.ts';
const scenesDir  = args.scenes || 'src/scenes';
const mainPath   = args.main   || 'src/Main.tsx';

if (!fs.existsSync(slidesPath)) {
  process.stderr.write(`ERROR: slides.ts not found: ${slidesPath}\n`);
  process.exit(1);
}

const slides = parseSlides(fs.readFileSync(slidesPath, 'utf8'));

const implementedKeys = fs.existsSync(mainPath)
  ? findImplementedKeys(fs.readFileSync(mainPath, 'utf8'))
  : null;

const output = slides.map(slide => {
  // Placeholder 判定: Main.tsx に if (key === '...) がなければ未実装
  const isImpl = implementedKeys
    ? implementedKeys.has(slide.key)
    : fs.existsSync(path.join(scenesDir, `${keyToSceneName(slide.key)}.tsx`));

  if (!isImpl) {
    return {
      key:           slide.key,
      topic:         slide.topic,
      duration:      slide.duration,
      isPlaceholder: true,
      texts:         [],
    };
  }

  const sceneName = keyToSceneName(slide.key);
  const sceneFile = path.join(scenesDir, `${sceneName}.tsx`);

  if (!fs.existsSync(sceneFile)) {
    return {
      key:           slide.key,
      topic:         slide.topic,
      duration:      slide.duration,
      isPlaceholder: false,
      sceneName,
      warning:       `Scene file not found: ${sceneFile}`,
      texts:         [],
    };
  }

  const texts = extractTexts(fs.readFileSync(sceneFile, 'utf8'));
  return {
    key:           slide.key,
    topic:         slide.topic,
    duration:      slide.duration,
    isPlaceholder: false,
    sceneName,
    texts,
  };
});

// stdout: JSON
process.stdout.write(JSON.stringify(output, null, 2) + '\n');

// stderr: サマリー
const implemented  = output.filter(s => !s.isPlaceholder).length;
const placeholders = output.filter(s => s.isPlaceholder);
process.stderr.write('\n=== Remotion Narration Extraction ===\n');
process.stderr.write(`Total:       ${output.length}\n`);
process.stderr.write(`Implemented: ${implemented}\n`);
process.stderr.write(`Placeholder: ${placeholders.length}\n`);
if (placeholders.length > 0) {
  process.stderr.write('\nPlaceholder slides:\n');
  placeholders.forEach(s =>
    process.stderr.write(`  - ${s.key}: ${s.topic || '(no topic)'}\n`)
  );
}
