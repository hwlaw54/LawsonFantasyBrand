# Template reference

Each template's own header comment is the authoritative data contract. This
page covers the cross-cutting mechanics.

## Rendering

```bash
node scripts/render.js <template> <data.json> [--png] [--pdf] [--out DIR]
```

Outputs land in `output/` unless `--out` says otherwise. The rendered HTML is
written alongside the image with asset paths rewritten to absolute file URLs,
so you can open it from anywhere.

**Requirements:** Node, and Chrome or Edge installed. `scripts/shoot.js` finds
the browser automatically; set `LFF_BROWSER` to override the path.

## Template syntax

### Placeholders

`{{UPPERCASE}}` resolves against the data file, case-insensitively. A key
ending in `_HTML` is inserted raw so you can control a line break:

```json
{ "lede_headline_HTML": "Grinches Choke Away a Tie<br>on a Missed Extra Point" }
```

Everything else is HTML-escaped, so `&`, `<`, and quotes in team names are safe.

Any placeholder left unfilled is reported at the end of the run. Treat that
warning as an error — a stray `{{TEAM}}` in something sent to twelve people is
worse than a failed build.

### Repeated blocks

```html
<!-- REPEAT:team -->
  <div class="rank-row is-first"> … {{RANK}} … </div>
<!-- /REPEAT:team -->
```

The block repeats once per item in `data.teams` (the plural of the marker
name). Inside, `{{FIELD}}` resolves against the item first, then falls back to
the top-level data — so `{{WEEK}}` works inside a row without repeating it on
every item.

The `is-first` in the template is a **demo modifier** so the raw file previews
sensibly in a browser. The renderer strips all `is-*` classes from each item's
first element and applies whatever that item's `_class` asks for.

### Derived classes

Fields named `move`, `streak`, or `trend` get a matching `*_class` computed
automatically from their leading character:

| Value starts with | Class | Colour |
|---|---|---|
| `⬆` `▲` `↑` `W` | `pos` | green |
| `⬇` `▼` `↓` `L` | `red` | red |
| anything else | `muted` | grey |

So `"streak": "L2"` renders red without you saying so. An explicit
`"streak_class"` in the data overrides it, but you should almost never need to.

## Per-template notes

**`newsletter`** — needs both `lede_headline_HTML` (with the `<br>`) and a plain
`lede_headline`; the email edition uses the plain one as inbox preview text.

**`email-newsletter`**, **`commissioner-letter`** — email-format templates, both
built the same way: tables and inline styles (Outlook ignores stylesheets, CSS
variables, and flexbox), a light cream/white canvas with navy/gold as contained
accent bands rather than a full-page background, and images by absolute GitHub
**Pages** URL (`hwlaw54.github.io/LawsonFantasyBrand/...`).

Two things about these that were learned the hard way:

*Light canvas is deliberate.* These used to be dark navy with light text. Gmail
strips `background-color` off `body`/`table` wrappers when it normalises pasted
or injected HTML, which stranded pale text on a white page. A light canvas is
legible no matter which backgrounds survive. Don't "modernise" either file back
toward a dark full-bleed background — that's the bug that was fixed. Every
background also carries a redundant `bgcolor` attribute for the same reason.

*Delivery is copy-paste, not the Gmail connector.* The `create_draft` connector
strips **every** `<img>` tag from the HTML body — confirmed by fetching a
delivered message and finding both an external-URL image and a CID inline
attachment had had their tags deleted outright. Hosting is not the variable;
GitHub Pages vs. `raw.githubusercontent.com` made no difference, and an earlier
note in this file claiming otherwise was wrong. Henry opens the rendered HTML
in Chrome, Ctrl+A / Ctrl+C, and pastes into Gmail Compose, which brings the
images in as inline attachments. See **Delivering it** in `SKILL.md`.

**`standings`** — `_class` does real work here. Put `is-cut` on the *last* team
that makes the playoffs; it draws the red line beneath them. Everything below
gets `is-out`. Move both as the picture changes.

**`chat-card`** — five variants in one file. `_clips` in the data selects which
get exported:

```json
"_clips": ["#card-result", "#card-high", "#card-quote"]
```

Writes `chat-card-card-result.png` etc. Everything is oversized on purpose —
these are read as thumbnails in a chat list. Don't shrink the type.

**`flyer`** — fixed 680×960 with a `min-height`; long detail values will push it
taller, which is fine.

**`season-wrap`** — the only template with four repeat blocks (`stats`,
`timelines`, `finals`, plus prose). Note the timeline key is `timelines`, since
the marker is `REPEAT:timeline`.

## Adding a template

1. Copy the closest existing file.
2. Link `fonts.css` → `tokens.css` → `_shared.css`, in that order.
3. Use `var(--token)` for every colour and size. No literal hex.
4. Put the data contract in a header comment.
5. Add a `data/example-<name>.json` that fills every placeholder.
6. Render it and look at the PNG before calling it done.
7. Add a row to the table in `SKILL.md` and to the README index.
