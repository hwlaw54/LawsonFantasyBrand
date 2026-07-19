# Brand reference

Everything here is defined in `tokens/tokens.css` and mirrored in
`tokens/tokens.json`. **Use the token names, not the hex values.** If a value
needs to change it changes in one file and every asset follows.

## Colour

| Token | Hex | Use |
|---|---|---|
| `--navy-700` | `#10233F` | The brand navy. Primary ground. |
| `--navy-900` | `#081121` | Deepest ground — table interiors, page background. |
| `--navy-600` | `#16305a` | Card surfaces. |
| `--gold-500` | `#C8A04B` | The brand gold. Accents, rules, rank 1, key numbers. |
| `--gold-400` | `#E0BD6D` | Hover / lighter gold, secondary lines. |
| `--cream-100` | `#F4EEE1` | Headings and primary text on navy. |
| `--red-500` | `#B0303C` | Alerts, losses, shame awards, the playoff cut line. |
| `--positive` | `#4a9d6a` | Wins, upward movement. |
| `--text-body` | `#d7dce4` | Running copy. |
| `--text-muted` | `#9aa0ab` | Secondary detail, losing teams. |

**Gold is a spice.** It marks the single most important thing in a view — the
rank-1 row, the winning score, a section rule. When everything is gold, nothing
is. Cream carries the actual reading.

## Type

| Role | Family | Where |
|---|---|---|
| `--font-crest` | Cinzel 800–900 | Crest, team names in the Ledger, champion name, anything that should feel engraved |
| `--font-display` | Oswald 500–600 | Uppercase broadcast headlines, big numbers |
| `--font-condensed` | Barlow Condensed 700 | **The signature move:** all-caps labels at `letter-spacing: .18em` |
| `--font-body` | Barlow 400 | Running copy |
| `--font-numeral` | Oswald 600 | Scores, ranks, records — always `tabular-nums` so columns align |

The wide-tracked condensed label is the brand's most recognisable element. It
appears as `.ey` in every template. Don't substitute it.

All four are self-hosted in `assets/fonts/` under the SIL Open Font License.
Link `assets/fonts/fonts.css` before `tokens/tokens.css`.

## The crest

Everything in `assets/logo/` is **vector with outlined lettering** — no live
text, no font dependency. They render identically in a browser, in Illustrator,
in email, and at a print shop.

| File | Use |
|---|---|
| `crest-full.svg` | Primary. Navy gradient field. |
| `crest-flat.svg` | Print / screen print, where gradients misbehave. |
| `crest-mono-*.svg` | One colour — embroidery, stamps, watermarks. |
| `lockup-primary.svg` | Crest + wordmark, horizontal. The default full signature. |
| `lockup-stacked.svg` | Crest above wordmark, for narrow or centred layouts. |
| `wordmark-on-dark/light.svg` | Type only, no crest. |
| `monogram-badge.svg` | Circular LFF badge — avatars, mastheads, small marks. |
| `favicon.svg` | **Below 48px, use this**, not the crest. |

PNGs at 256/512/1024/2048 plus `-on-navy` and `-on-cream` flattened copies are
in `assets/logo/png/`.

### Rules

- **Clear space:** at least the height of the "LFF" letterform on all sides.
- **Minimum size:** the full crest reads down to about 48px. Below that the
  ribbon and EST line turn to mush — switch to `favicon.svg`.
- **Never** recolour it, stretch it, add effects, rotate it, or set the crest
  on a busy photo without a scrim.
- The crest carries its own navy field, so it sits correctly on navy, cream, or
  white without a variant swap.

## Layout

Space scale is `--space-1` (4px) through `--space-9` (96px) — use the steps,
don't invent values. Radii: `--radius-md` (6px) for cards, `--radius-lg` (12px)
for large panels, `--radius-sm` (2px) for tags.

Sheets are fixed-width for deterministic export: 860px for documents, 680×960
for the flyer, 800×800 for chat cards.
