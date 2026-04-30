---
name: review-content
description: "Review the content quality of a video, presentation, or long-form narration on 18 axes — structure (hook / SCQA / logic / pacing), content (accuracy / coverage / specificity / redundancy), delivery (clarity / audience-fit / engagement / emotion / memorable phrases / visual-narration sync), and persuasion (credibility / counterargument handling / takeaway / title match). Outputs an A/B/C/D scorecard and concrete improvement actions. Trigger on: \"review my content\", \"check my narration\", \"is this video good\", \"feedback on my talk\", \"score my presentation\", \"review my script\". This skill evaluates *your own* content — for studying *external* reference videos, use an analyze-video skill."
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
3. **Source-of-truth comparison** (when `--source` is enabled and Project Integration declares a source)
   - Read source files / notes
   - Identify: missing key info, distorted meaning, inaccurate quotes/numbers
4. **18-axis evaluation** → [evaluation-axes](references/evaluation-axes.md)
   - Each axis: A/B/C/D + concrete rationale + improvement suggestion
   - Axis 14 (visual-narration sync) is **conditional** — only evaluated when `Visual Assets` is declared
5. **Compute total** following the rule in evaluation-axes.md
   - Mode of the axis grades; axis 5 (accuracy) of D forces total D
6. **Write report** with the structure below
7. **Lint** if Project Integration defines a lint command
8. **QA check** → [qa-checklist](references/qa-checklist.md)

## Output Rules

### Report Structure

```markdown
# Content Review: <project name>

## Scorecard

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

**Total: <A/B/C/D>**
(rule: mode of axes; axis 5=D forces total D)

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
- **Don't seek perfection**: A×12 (2/3 of axes) is "good enough to ship"
- **Don't compromise on accuracy**: a single factual error → axis 5 = D → total = D
- **Quote directly**: when describing strengths/weaknesses, quote the narration

## Project Integration

This skill works standalone, but is dramatically more useful with these declarations.

### Narration Source (required for non-trivial use)

Declare where to fetch the narration script. Without this, the skill must ask the user every time.

```markdown
- Type: shell-array | text-files | code-comments | yaml | manual
- Path / pattern: <e.g., scripts/generate-audio.sh>
- Variable / key (if applicable): <e.g., narrations[]>
- Order: <how to assemble fragments — array key order, file name sort, etc.>
```

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

## Dependencies

None required. All evaluation is performed by Claude using the bundled axis definitions.
