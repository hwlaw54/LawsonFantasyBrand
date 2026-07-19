---
name: lawson-league
description: Produce on-brand content for the Lawson Family & Friends Fantasy Football League — weekly newsletters (The Lawson Ledger), power rankings, standings, draft boards, event flyers, transaction cards, season awards, season wrap-ups, and phone-sized chat cards for the group chat. Use whenever Henry asks for league content, a recap, rankings, an announcement, a graphic for the league, or anything referencing the Lawson League, LFF, or his fantasy football commissioner duties.
---

# Lawson League content

Henry is the commissioner of the Lawson Family & Friends Fantasy Football League
— 12 teams, established 2020, currently in its sixth season. This skill turns a
request like *"make Week 5 power rankings"* into a finished, on-brand PNG.

## How it works

Every deliverable is an HTML template plus a JSON data file, rendered by
`scripts/render.js` and screenshotted with headless Chrome/Edge.

```bash
node scripts/render.js <template> <data.json> --png
```

That writes `output/<template>.html` and `output/<template>.png`.
Add `--pdf` for a print-ready PDF, `--out DIR` to redirect.

**Never hand-write a finished graphic.** Never inline the brand colours or
retype the crest. Fill a template. If no template fits, say so and propose
adding one rather than improvising a one-off that drifts from the system.

## The workflow

1. **Work out which template.** See the table below.
2. **Read the template's header comment.** Each file opens with its exact data
   contract. That comment is the source of truth, not this page.
3. **Copy the matching `data/example-*.json`** as your starting shape.
4. **Write the copy.** This is the part that matters — see
   [references/voice.md](references/voice.md). Get the facts from Henry; never
   invent scores, records, or player news.
5. **Render with `--png`.**
6. **Check the render.** Actually look at the PNG. Confirm no `{{PLACEHOLDER}}`
   survived — the renderer warns, but read the output.
7. **Save to `output/<season>/week-<n>/`** for anything Henry will reuse.

## Templates

| Template | Use it for | Data |
|---|---|---|
| `newsletter` | The Lawson Ledger — the weekly recap | `example-newsletter.json` |
| `email-newsletter` | Same content, for the inbox | `example-newsletter.json` |
| `power-rankings` | 1–12 with movement and a roast per team | `example-power-rankings.json` |
| `standings` | Full table, W-L, PF/PA, playoff cut line | `example-standings.json` |
| `draft-board` | Draft order, round 1 | `example-draft-board.json` |
| `flyer` | Draft night, playoff kickoff, any event | `example-flyer.json` |
| `transaction-card` | Trades, waivers, drops | `example-transactions.json` |
| `awards` | End-of-season hardware | `example-awards.json` |
| `season-wrap` | The long season-in-review | `example-season-wrap.json` |
| `chat-card` | **Phone-sized cards for the group chat** | `example-chat-cards.json` |

### Chat cards are the workhorse

Most league chatter happens in the group chat, and a chat card is the thing
Henry will actually send. `chat-card.html` holds five square 800×800 variants —
result, high score, alert, trade, quote. The data file's `_clips` array selects
which ones get exported:

```json
"_clips": ["#card-result", "#card-quote"]
```

Each clip writes `chat-card-card-<name>.png`. Reach for these by default when
the ask is short and immediate ("post that Blitz won"); reach for the
newsletter when it's a weekly wrap.

## Data file conventions

- **`_class` on a repeated item** applies a row modifier: `is-first` for rank 1,
  `is-cut` for the last playoff team in standings, `is-out` below the line,
  `is-honor`/`is-shame` on awards, `is-trade`/`is-waiver`/`is-drop` on
  transactions. The template header lists what it accepts.
- **Movement and streak colours are automatic.** Write `"move": "⬇ 3"` or
  `"streak": "L2"` and the renderer derives the colour. Do not set
  `move_class` by hand — a green down-arrow is exactly the bug this prevents.
- **A key ending `_HTML` is inserted unescaped**, for deliberate `<br>` breaks
  in a headline. Everything else is escaped, so apostrophes and `&` are safe.
- **Repeated blocks pull from the plural key**: `<!-- REPEAT:team -->` reads
  `data.teams`.

## Facts about the league

Pull these from `tokens.json` → `brand` rather than retyping:

- 12 teams, established 2020, currently Season VI
- Yahoo Fantasy, snake draft, 15 rounds
- Top 6 make the playoffs
- Last place buys the trophy — and wears it

Henry is the commissioner and writes in the first person as "the Commissioner"
when the piece needs a byline.

## Brand quick reference

Navy `#10233F` · Gold `#C8A04B` · Cream `#F4EEE1` · Blood red `#B0303C`
Cinzel (crest/names) · Oswald (display/numbers) · Barlow Condensed (labels) ·
Barlow (body)

Full detail in [references/brand.md](references/brand.md). Never hardcode these
in a template — use the `var(--token)` names from `tokens/tokens.css`.

## Don't

- Don't invent scores, records, player injuries, or transactions. Ask.
- Don't restyle a template inline to "make this one pop." The system is the
  point; a one-off that looks different is a broken brand, not a bonus.
- Don't use the crest below 48px — use `favicon.svg`, which is drawn for it.
- Don't put real money amounts or anyone's contact details into a graphic that
  might get posted publicly.
