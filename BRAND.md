# Lawson League — Brand Guidelines

The Lawson Family &amp; Friends Fantasy Football League. Twelve teams,
established 2020. Henry Lawson is commissioner.

The identity has one job: make a family fantasy league feel like a broadcast
property that has been running for decades — and then undercut that gravity
with the meanest possible power rankings. **Prestige, played straight, so the
trash talk lands harder.**

---

## 1. The crest

The crest is a shield: navy field, gold trim, a gold football above the `LFF`
monogram, `EST. 2020` beneath it, and a gold ribbon reading `FAMILY & FRIENDS`.

### Variants

| Variant | When |
|---|---|
| `crest-full.svg` | Default. Anywhere the gradient will render. |
| `crest-flat.svg` | Screen print, embroidery digitising, anywhere gradients band. |
| `crest-mono-gold` / `-navy` / `-cream` / `-white` / `-black` | One-colour reproduction. The ribbon becomes an outline so the text survives. |
| `favicon.svg` | **Under 48px.** Shield + LFF only. |

### Clear space

Keep clear space on all four sides equal to the cap height of the `LFF`
lettering — roughly 27% of the crest's width. Nothing intrudes: no text, no
rules, no photo edges.

### Minimum sizes

| Mark | Minimum |
|---|---|
| Full crest | 48px / 0.5in |
| Monogram badge | 32px |
| `favicon.svg` | 16px |
| Primary lockup | 180px wide |

Below 48px the ribbon and `EST. 2020` line collapse into noise. Switch marks
rather than shrinking further.

### Misuse

Do not:

- recolour the crest, or fill the shield with anything but navy, cream, or one flat brand colour
- stretch, squash, skew, or rotate it
- add drop shadows, glows, bevels, or strokes
- rebuild it from live text — **use the supplied files**, whose lettering is outlined
- place it on a busy photograph without a solid or scrimmed panel behind it
- put it inside another shape, badge, or container
- pair it with a second logo inside its clear space

> The crest carries its own navy field, so it reads correctly on navy, cream,
> and white without swapping variants. Reach for a mono version only when the
> reproduction method demands one colour.

---

## 2. Colour

### Navy — the ground

| Token | Hex | Use |
|---|---|---|
| `--navy-900` | `#081121` | Deepest — page background, table interiors |
| `--navy-800` | `#0a1424` | Sheet background |
| `--navy-700` | `#10233F` | **The brand navy** |
| `--navy-600` | `#16305a` | Card surfaces |
| `--navy-500` | `#1d3d6e` | Raised surfaces, hover |

### Gold — the accent

| Token | Hex | Use |
|---|---|---|
| `--gold-600` | `#a8823a` | Shadowed gold, gradient end |
| `--gold-500` | `#C8A04B` | **The brand gold** |
| `--gold-400` | `#E0BD6D` | Highlight, gradient start |

### Cream — the reading surface

| Token | Hex | Use |
|---|---|---|
| `--cream-100` | `#F4EEE1` | Headings, text on navy |
| `--cream-200` | `#e6dcc6` | Secondary warm text |

### Blood red — the knife

| Token | Hex | Use |
|---|---|---|
| `--red-500` | `#B0303C` | Alerts, losses, shame awards, playoff cut line |
| `--red-600` | `#7d1f2b` | Deeper red |

### Support

`--positive` `#4a9d6a` (wins, upward movement) · `--text-body` `#d7dce4` ·
`--text-muted` `#9aa0ab` · `--slate-500` `#6b7280`

### Rules

**Gold is a spice, not a surface.** It marks the single most important element
in a view — rank 1, the winning score, a section rule. Large gold fills are
reserved for the ribbon, the flyer CTA, and the chat-card top rule.

**Cream does the reading.** Body copy is `--text-body`; headings are cream.
Gold body text fails contrast and looks cheap.

**Red means consequence.** Losses, alerts, the cut line, shame awards. Never
decorative.

**Contrast:** cream on navy-700 is about 12:1, comfortably AA. Gold on navy-700
is about 5.9:1 — fine for labels and large type, but do not set long body copy
in gold, and never put gold on cream.

---

## 3. Typography

| Role | Family | Weight | Treatment |
|---|---|---|---|
| Crest | Cinzel | 800–900 | Names, titles, champion. Engraved, formal. |
| Display | Oswald | 500–600 | UPPERCASE broadcast headlines |
| Label | Barlow Condensed | 700 | UPPERCASE, `letter-spacing: .18em` |
| Body | Barlow | 400 | `line-height: 1.6` |
| Numeral | Oswald | 600 | `font-variant-numeric: tabular-nums` |

### The signature label

The wide-tracked condensed all-caps label is the most recognisable element in
the system after the crest. It is the eyebrow above every headline, every
column header, every footer.

```css
font-family: var(--font-condensed);
font-weight: 700;
text-transform: uppercase;
letter-spacing: .18em;
font-size: 13px;
color: var(--gold-500);
```

Available as `.lff-eyebrow` in `tokens.css` and `.ey` in `templates/_shared.css`.

### Scale

`--fs-display` 64 · `--fs-h1` 40 · `--fs-h2` 28 · `--fs-h3` 20 ·
`--fs-body` 16 · `--fs-label` 13 · `--fs-small` 13

### Rules

- **Numbers are always tabular.** Scores in a column must align.
- **Cinzel is for names, not paragraphs.** It's a display serif; it becomes
  unreadable below ~16px and exhausting at length.
- **Never fake a weight.** No synthetic bold or italic — use a real weight.
- All four families are self-hosted under SIL OFL. Don't add a fifth typeface.

---

## 4. Layout

**Space scale:** 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96px. Use the steps.

**Radii:** 2px tags · 6px cards · 12px large panels · 999px pills.

**Sheet widths** are fixed so PNG export is deterministic:

| Format | Size |
|---|---|
| Documents (newsletter, rankings, standings, draft, awards, wrap, transactions) | 860px wide |
| Event flyer | 680 × 960 |
| Chat cards | 800 × 800 |
| Email | 600px |

**Structure:** a masthead with a 3px gold bottom rule, content, then a footer
with a wide-tracked line. Consistent across every document template — that
repetition is what makes twelve different assets read as one property.

---

## 5. Voice

**Prestige + ESPN broadcast + trash talk.**

> ✓ "Reigning champ opens with a 38-point beatdown. Everyone else is playing for second."
>
> ✕ "Team A won their matchup this week with a good score. Nice job to them."

The full guide, including register per template and the house phrases, is in
[`.claude/skills/lawson-league/references/voice.md`](.claude/skills/lawson-league/references/voice.md).

The short version:

1. **Name names and use numbers.** Specificity is the engine.
2. **Every line takes a position.** A recap is not a box score.
3. **Punch at the record, never the person.** This is Henry's actual family.
4. **Let the format be the joke.** Play the gravity straight; the contrast does the work.
5. **Ration praise.** It only lands because it's rare.

---

## 6. Applying it

Anything new should link the tokens rather than copy values:

```html
<link rel="stylesheet" href="assets/fonts/fonts.css">
<link rel="stylesheet" href="tokens/tokens.css">
```

Then use `var(--gold-500)`, never `#C8A04B`. If a value is wrong it gets fixed
in `tokens/tokens.css` and every asset in the repo follows. A hardcoded hex is
a future inconsistency.

For anything routine, use the templates — see [`README.md`](README.md).
