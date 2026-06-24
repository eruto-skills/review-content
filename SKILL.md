---
name: review-content
description: "Review your video, presentation, or narration script's content quality on a sourced rubric — a gate 'central message (throughline)' axis + 18 axes (structure / content / delivery / persuasion) + a conditional time-budget axis. Outputs an A/B/C/D scorecard (gate + threshold aggregation) with concrete improvements. Trigger on: \"review my content\", \"check my narration\", \"score my presentation\", \"feedback on my talk\". For studying *external* reference videos, use analyze-video."
user-invocable: true
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, Task
argument-hint: [project-name] [--source] [--rewrite]
---

# review-content

Reviews narration / script content on 18 axes and outputs an A/B/C/D scorecard with concrete improvements.

## Workflow

1. **Parse arguments**
   - Optional positional: project name (defaults to current working directory if omitted)
   - `--source` (default ON): cross-check against the source-of-truth defined in Project Integration
   - `--rewrite`: include rewrite suggestions for low-scoring sections
2. **Acquire narration** following `Narration Source` declaration → [narration-sources](references/narration-sources.md)
   - Reads all narration fragments and assembles them into one chronological script
   - If no declaration exists, asks the user for the narration path
   - **remotion-scenes**: run `scripts/extract-remotion-narration.js` (see narration-sources.md) to get slide texts in chronological order
2b. **Detect unimplemented slides** (when Narration Source is `remotion-scenes`)
   - Slides with `isPlaceholder: true` are reported in `## Unimplemented Slides` before the Scorecard
   - Do **not** penalize content axes for content that belongs to unimplemented slides
   - Do note in Axis 6 (coverage) how many and which slides are unimplemented
   - Scope restriction: state "Evaluated N slides; M slides were Placeholder and excluded" at the top of the Scorecard
3. **Source-of-truth comparison** (when `--source` is enabled and Project Integration declares a source)
   - Read source files / notes
   - Identify: missing key info, distorted meaning, inaccurate quotes/numbers
4. **Rubric evaluation** → [evaluation-axes](references/evaluation-axes.md)
   - Gate `throughline` axis + 18 axes + conditional axes; each: A/B/C/D + concrete rationale + improvement, **with a quoted trigger line from the script**
   - Axis 14 (visual-narration sync) and axis 19 (time-budget) are **conditional** — evaluated only when `Visual Assets` / a runtime are declared; otherwise skipped and noted
   - **Axis 14 — remotion-scenes**: code-review-only evaluation is NOT acceptable.
     1. Generate PNG stills: run `scripts/generate-remotion-stills.js` from the Remotion project root (see narration-sources.md for args)
     2. Read each PNG with the Read tool and visually inspect visual-narration alignment
     3. Grade based on the actual visual inspection result, not TSX code inference
5. **Compute total** following the gate + threshold rule in evaluation-axes.md
   - Gate axes = `throughline` / logic(3) / accuracy(5) / coverage(6); a single non-accuracy D or throughline ≤C caps the grade; axis 5 (accuracy) = D forces total D
6. **Write report** with the structure below
7. **Lint** if Project Integration defines a lint command
8. **QA check** → [qa-checklist](references/qa-checklist.md)

## Output Rules

### Report Structure

```markdown
# Content Review: <project name>

## Unimplemented Slides   <!-- only when remotion-scenes and placeholders exist -->
> Evaluated N slides; M slides were Placeholder and excluded from scoring.

| Key | Topic |
|-|-|
| xxx | ... |

## Scorecard

### Gate
| Axis | Grade | One-liner |
|-|-|-|
| 0. Throughline (≤15-word central message) | A | ... |

### Structure
| Axis | Grade | One-liner |
|-|-|-|
| 1. Hook | A | ... |
| 2. Narrative arc (SCQA) | B | ... |
| 3. Logic flow | A | ... |
| 4. Pacing | B | ... |

### Content
| Axis | Grade | One-liner |
|-|-|-|
| 5. Accuracy | A | ... |
| 6. Coverage | B | ... |
| 7. Specificity | A | ... |
| 8. Redundancy | A | ... |

### Delivery
| Axis | Grade | One-liner |
|-|-|-|
| 9. Clarity | B | ... |
| 10. Audience fit | A | ... |
| 11. Engagement | A | ... |
| 12. Emotional dynamics | B | ... |
| 13. Memorable phrases | A | ... |
| 14. Visual sync | A / N/A | ... |

### Persuasion
| Axis | Grade | One-liner |
|-|-|-|
| 15. Credibility | A | ... |
| 16. Counterargument handling | B | ... |
| 17. Takeaway | A | ... |
| 18. Title match | A | ... |

### Conditional
| Axis | Grade | One-liner |
|-|-|-|
| 19. Time-budget (only if runtime declared) | A / N/A | ... |

**Total: <A/B/C/D>**
(rule: gate + threshold — gates = throughline / logic(3) / accuracy(5) / coverage(6); a single non-accuracy D or throughline ≤C caps the grade; accuracy=D → total D; A needs A-count ≥12 + zero D + all gates ≥B. Full rule in evaluation-axes.md)

## Greatest Strength
<the highest-scoring axis and *why* it works, with quotes>

## Biggest Improvement
<the lowest-scoring axis and *exactly* what to change>

## Section-by-Section Feedback

### <section name / slide ID>
- Strengths: ...
- Improvements: ...   (if --rewrite, add rewrite draft)

## Source Diff   <!-- only if --source -->
| Info | Source | Narration | Verdict |
|-|-|-|-|
| ... | ... | ... | OK / verify / OK to omit |

## Next Actions
1. <highest priority concrete change>
2. ...
```

### Evaluation Rules

- **Be specific**: replace "the structure is good" with "the intro poses 3 questions and the body resolves them in order"
- **Gate axes cap the grade**: `throughline` / logic(3) / accuracy(5) / coverage(6). A single non-accuracy D, or throughline ≤ C, limits the total regardless of the A-count. Cosmetic-leaning axes (12 emotion, 13 phrasing) feed the A-count but never gate.
- **Don't seek perfection**: A-count ≥ 12 (with zero D and all gates ≥ B) is "good enough to ship"; write B as the realistic competent target
- **Don't compromise on accuracy**: a single factual error → axis 5 = D → total = D
- **Quote every grade**: each axis grade cites the exact script sentence that triggered it; an A requires a quotable exemplar line (a grade with no quotable trigger is itself a defect to flag)

## Project Integration

This skill works standalone, but is dramatically more useful with these declarations.

### Narration Source (required for non-trivial use)

Declare where to fetch the narration script. Without this, the skill must ask the user every time.

```markdown
- Type: shell-array | text-files | code-comments | yaml | remotion-scenes | manual
- Path / pattern: <e.g., scripts/generate-audio.sh>
- Variable / key (if applicable): <e.g., narrations[]>
- Order: <how to assemble fragments — array key order, file name sort, etc.>
```

For `remotion-scenes`, Path / pattern should point to the Remotion project root (e.g., `slides/llm-sampling/video`).

→ See [narration-sources](references/narration-sources.md) for per-type acquisition commands.

### Source of Truth (optional — used by `--source`)

Declare the path to source material the narration is based on (notes, slides, research).

```markdown
- Path: <e.g., ../docs/projects/my-talk/>
- Format: markdown | yaml | mixed
- Description: <short context>
```

If not declared, `--source` is silently disabled.

### Audience (optional — used by axis 10)

Declare the intended audience to anchor the audience-fit evaluation.

```markdown
- Profile: <e.g., "intermediate Japanese software engineers familiar with TypeScript">
- Prerequisites: <what they already know>
- Anti-profile: <who this is NOT for>
```

If not declared, the skill infers the audience from the source material.

### Visual Assets (optional — enables axis 14)

Declare where visual assets (slides / scenes / video composition) live so axis 14 (visual-narration sync) can be evaluated.

```markdown
- Type: remotion-scenes | marp-md | pptx | manual
- Path / pattern: <e.g., src/scenes/*.tsx>
- Sampling: full | per-act | manual   (default: per-act for long projects)
```

If not declared, axis 14 is skipped and the report notes the omission.

### Lint (optional)

If your project uses a Markdown linter, specify the command. The skill runs it on the saved review report.

```markdown
npx textlint <path>
```

### Cross-Skill Integration

- **Reference video study**: when you want to *learn* from external videos rather than *review* your own, hand off to an analyze-video skill
- **Slide creation / editing**: when the review proposes structural changes that should be reflected in the slides themselves, hand off to a slide skill

These integrations depend on which skills are installed. No specific skill names are assumed.

## 自己改善ループ（指摘 → ルール → 横展開 → 再発防止）

レビューで指摘を受けたら、その場の修正で終わらせない:

1. **判断**: その指摘が「一般化できるパターン」か「その場限りの好み」か。**パターンだけルール化**する（その場限りはその箇所だけ直す＝評価軸/チェックリストの肥大化を防ぐ）。
2. **ルール更新**: パターンなら evaluation-axes / qa-checklist の該当ルールを抽象化して追加・修正する。
3. **横展開（全体再走査）**: 更新したルールで成果物**全体を再走査**し、同種の箇所をすべて直す（silent な見逃しを防ぐ）。
4. **再発防止**: 成果物側の事実誤り等は通常どおり是正。**レビュアー自身の誤り**（指摘の取り違え・誤帰属・誤判定）は下の「よくある誤読・落とし穴」に記録し、次回最初に確認する。

## よくある誤読・落とし穴（次回まずチェック）

- **指摘の取り違え**: 発表者の言葉を別の意味に解釈していないか（例:「赤文字が下に行きすぎ」を「下の余白を埋める」と誤読した）。曖昧なら1問だけ確認してから動く。
- **事実の誤帰属**: 引用・主張を別人/別出典に取り違えない（例: EMH批判を Siegel に誤帰属したが、実際の Siegel は擁護側）。一次で確認する。
- **単一ソースの数値を事実扱い**: 裏取りできない数値はラベル付き範囲に留める（軸5・正確性のゲートに直結）。

## Dependencies

None required. All evaluation is performed by Claude using the bundled axis definitions.
