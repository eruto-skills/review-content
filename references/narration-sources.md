# Narration Source Acquisition

レビュー対象のナレーション原稿を取得する手順。Project Integration の `Narration Source` 設定に従う。

## 設定例

Project Integrationで以下のように宣言する。

```markdown
### Narration Source

- Type: shell-array | text-files | code-comments | yaml | manual
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
