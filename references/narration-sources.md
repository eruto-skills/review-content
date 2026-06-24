# Narration Source Acquisition

レビュー対象のナレーション原稿を取得する手順。Project Integration の `Narration Source` 設定に従う。

## 設定例

Project Integrationで以下のように宣言する。

```markdown
### Narration Source

- Type: shell-array | text-files | code-comments | yaml | remotion-scenes | manual
- Path / pattern: <e.g., scripts/generate-audio.sh, narrations/*.txt>
- Variable / key (if applicable): <e.g., narrations[]>
- Order: <how to assemble multiple fragments into a single timeline>
```

## 取得パターン

### shell-array (シェルスクリプト内の配列変数)

例: `generate-audio.sh` 内の `narrations[1]="..."` のような連想配列。

```bash
# 配列キーで時系列順にソートして抽出
grep -E '^narrations\[' scripts/generate-audio.sh
```

時系列順は配列キーの昇順 or スクリプト内記述順のいずれかを Project Integration で明記する。

### text-files (個別テキストファイル)

例: `narrations/01-intro.txt`, `narrations/02-body.txt` のような連番ファイル。

```bash
# 番号順に連結
ls narrations/*.txt | sort | xargs cat
```

### code-comments (コード内のコメント)

例: `src/slides.ts` のスライド定義に紐づくコメント。

正規表現でコメントブロックを抽出し、スライド順に並べる。具体的なパターンは Project Integration で記述する。

### yaml (YAML/JSON 構造化原稿)

例: `narration.yaml` に `slides[].narration` のキーで格納。

```bash
# yqで抽出
yq -r '.slides[].narration' narration.yaml
```

### remotion-scenes (Remotion プロジェクト)

Remotion の `slides.ts`（スライド定義）と `src/scenes/*.tsx`（シーンファイル）からテキストを抽出する。

```bash
# Remotion プロジェクトルートから実行
node <eruto-skills>/review-content/scripts/extract-remotion-narration.js \
  --slides=src/slides.ts \
  --scenes=src/scenes \
  --main=src/Main.tsx
```

出力: JSON 配列 `[{ key, topic, duration, isPlaceholder, texts[] }]`

**スライド順序**: `slides.ts` の `sections[].slides[]` の記述順。  
**Placeholder 検出**: `Main.tsx` の `renderSlide` 関数に `if (key === '...')` エントリがない → `isPlaceholder: true`。

抽出後の台本組み立て手順:

1. `isPlaceholder: true` のスライドは除外し「未実装スライド」セクションに列挙する
2. 実装済みスライドの `texts[]` を key 順に連結して一本の台本とみなす
3. セクション境界（label）を記録して後段のセクション別フィードバックに活用する

### manual

ナレーション原稿が単一のMarkdown/テキストファイルとして渡される場合は、そのまま読む。

## 統合手順

1. 上記いずれかのパターンで全ナレーションを取得
2. 時系列順に並べて1つの「台本」として把握
3. セクション境界が明確なら、後段のセクション別フィードバックで使うため記録しておく
4. 全文の文字数・推定尺をメタ情報として保持（評価時の参考）

## 取得失敗時のフォールバック

- 設定通りに取得できない場合、ユーザーに直接ナレーション原稿のパスを尋ねる
- 部分的にしか取得できない場合、その範囲だけで評価し、欠落範囲をレポートに明記する
