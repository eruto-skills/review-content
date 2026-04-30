# review-content

A Claude Code skill that reviews the content quality of a video, presentation, or long-form narration on 18 axes and outputs an A/B/C/D scorecard with concrete improvement actions. Useful for content creators who want a structural critique of their own work — not a "looks good" pat on the back.

## Features

- **18 axes across 4 categories** — structure / content / delivery / persuasion
- **A/B/C/D grading** with concrete rationale and per-axis improvement suggestions
- **Source-of-truth comparison** — checks the narration against the underlying notes/research (`--source`)
- **Rewrite mode** — generates concrete rewrite drafts for low-scoring sections (`--rewrite`)
- **Audience-aware** — anchors the audience-fit axis to a declared persona
- **Visual-sync axis** — optional evaluation when slide/scene assets are declared (Remotion / Marp / PPTX)
- **Accuracy is sacred** — a single factual error forces total = D

## Installation

### Via marketplace (recommended)

```
/plugin marketplace add eruto-skills/marketplace
/plugin install review-content@eruto-skills
```

### Manual

```bash
git clone https://github.com/eruto-skills/review-content.git
cp -r review-content /path/to/your-project/.claude/skills/review-content
```

## Usage

### Slash command

```
/review-content my-talk
/review-content my-talk --rewrite
/review-content my-talk --source
```

### Natural language triggers

- "Review my content"
- "Check my narration"
- "Is this video good?"
- "Feedback on my talk"
- "Score my presentation"

## Project Integration

This skill becomes dramatically more useful with a few declarations in `SKILL.md`:

|Declaration|Effect|
|-|-|
|`Narration Source`|Skill auto-fetches the script (otherwise asks every time)|
|`Source of Truth`|Enables `--source` cross-check against research notes|
|`Audience`|Anchors axis 10 (audience fit) instead of inferring|
|`Visual Assets`|Enables axis 14 (visual-narration sync)|
|`Lint`|Runs your linter on the saved review report|

See `SKILL.md` Project Integration section for the exact format.

## File Structure

```
review-content/
├── README.md
├── LICENSE
├── SKILL.md
├── .claude-plugin/
│   └── plugin.json
└── references/
    ├── evaluation-axes.md     # Full 18-axis criteria
    ├── narration-sources.md   # Per-type acquisition commands
    └── qa-checklist.md        # Pre-output verification
```

## Why "review-content" and not "review-script" or "review-talk"?

Because the same 18 axes apply to videos, presentations, podcast scripts, lecture transcripts, and long-form blog posts. Anything narrative.

## License

MIT License. See [LICENSE](LICENSE).

## Support

If this skill is useful to you, consider supporting development:

- [GitHub Sponsors](https://github.com/sponsors/erutobusiness)
- [Ko-fi](https://ko-fi.com/eruto)
