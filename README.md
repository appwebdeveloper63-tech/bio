# Group 3 — Cell Biology Question Bank

A dark-neon interactive study site: two full question sets, a virtual
microscope with 50 specimens, flashcards (including AI-generated ones from
your own notes), an XP/level/badge system, sound, confetti, and an AI study
buddy chatbot with automatic model fallback.

## ⚠️ Rotate your API keys

Every key you've pasted into chat with me (OpenAI, Groq, Gemini, Perplexity,
Together, Fireworks, OpenRouter, HF, Bytez, Oxlo, LongCat, Google, Google
Search, weather, LiveKit) has been exposed in plain text in a conversation
log. Rotate/revoke all of them in each provider's dashboard. Use only fresh
keys below, and only as Cloudflare **environment variables** — never in a
file.

## Copy-paste: Cloudflare Pages environment variables

Settings → Environment variables → add each as **Encrypted**. You only need
**one** of these for the chatbot/flashcards to work — the rest are automatic
fallbacks, tried in this order:

| Name | Value | Notes |
|---|---|---|
| `GROQ_API_KEY` | your Groq key | Tried 1st — fast, generous free tier |
| `TOGETHER_API_KEY` | your Together key | Tried 2nd — free `Llama-3.3-70B-Turbo-Free` |
| `FIREWORKS_API_KEY` | your Fireworks key | Tried 3rd |
| `OPENROUTER_API_KEY` | your OpenRouter key | Tried 4th — free models |
| `HF_API_KEY` | your Hugging Face token | Tried 5th — needs "Inference Providers" permission on the token |
| `BYTEZ_AI_KEY` | your Bytez key | Tried 6th |
| `GEMINI_API_KEY` | your Gemini key | Tried 7th |
| `PERPLEXITY_API_KEY` | your Perplexity key | Tried 8th — usually needs paid credits |
| `OPENAI_API_KEY` | your OpenAI key | Tried 9th — no real free tier |
| `ANTHROPIC_API_KEY` | your Anthropic key | Tried last |

**Not wired:** `OXLO_AI_KEY` and `LONGCAT_API_KEY`. Both services exist, but
I could not find a verified base URL + working request example for either —
only marketing pages, no API spec. Guessing an endpoint is exactly how the
Gemini 1.5 bug happened before, so I'm not repeating that. If you can get me
their docs page or one working `curl` example, I'll wire them up properly.

Redeploy after adding/changing variables (Deployments → Retry).

## Why the AI kept "not working" — and what's fixed now

Both AI-backed features (`functions/api/chat.js` and
`functions/api/flashcards.js`) import a single shared module,
`functions/_shared/ai.js`. It tries **10 providers in order**, each with its
own model fallback list, so one retired/renamed model — or one down
provider — can't take the feature down:

1. Groq — `llama-3.1-8b-instant` → `llama-3.3-70b-versatile`
2. Together — `Llama-3.3-70B-Instruct-Turbo-Free` → `Meta-Llama-3.1-8B-Instruct-Turbo`
3. Fireworks — `llama-v3p1-8b-instruct` → `llama-v3p1-70b-instruct`
4. OpenRouter — `llama-3.3-70b-instruct:free` → `qwen3-235b-a22b:free`
5. Hugging Face — `DeepSeek-R1:fastest` → `gpt-oss-120b:cerebras`
6. Bytez — `google/gemma-3-4b-it` → `openai/gpt-4o-mini`
7. Gemini — `gemini-2.5-flash-lite` → `gemini-2.5-flash` (the old
   `gemini-1.5-*` family is fully retired by Google — that was the original bug)
8. Perplexity — `sonar` → `sonar-pro`
9. OpenAI — `gpt-4.1-mini` → `gpt-4o-mini`
10. Anthropic — `claude-haiku-4-5-20251001`

The chatbot now shows **which engine answered** under each reply ("via
groq", "via gemini", or "offline · question-bank search" if every provider
is unset/down). That tag is your diagnostic tool — if it always says
"offline," no key is configured or all of them are failing; check the
Cloudflare Function logs for the real reason.

Free-tier model IDs do rotate occasionally on the provider's end. If
something stops working again, check:
- Groq: https://console.groq.com/docs/models
- OpenRouter: https://openrouter.ai/models?max_price=0
- Gemini: https://ai.google.dev/gemini-api/docs/models

## Deploy (Cloudflare Pages, ~5 minutes)

1. https://dash.cloudflare.com → **Workers & Pages → Create → Pages →
   Upload assets** (or connect a GitHub repo instead).
2. Upload this whole folder — `index.html`, `app.js`, `data.js`,
   `_headers`, and the `functions/` folder (including `functions/_shared/`).
3. Add the environment variables above, then redeploy.
4. Visit your `*.pages.dev` URL.

## Feature tour

- **Set 1 / Set 2** — 60 questions total. Each MCQ now shows a short
  explanation after you reveal it, plus an Easy/Medium/Hard tag.
- **Speed Quiz** — Quick (10Q/15s) or Boss Mode (20Q/10s, double XP), with
  a difficulty filter and a live explanation after every answer.
- **Flashcards** — flip through every short-answer question, mark "Got it"
  or "Review again." Also: **paste or upload your own notes** (.txt) and
  it generates flashcards via your configured AI key — or, with no key
  set, an offline fill-in-the-blank generator built from your text, so it
  never just breaks.
- **Virtual Microscope** — 50 specimens (plant, animal, microorganism,
  tissue, and "everyday object" categories), each procedurally drawn as
  SVG (no real photos — avoids copyright issues and keeps the project
  network-independent). Pick a zoom tier, then use coarse + fine focus
  sliders to bring a randomized true-focus point into view, same as a real
  scope.
- **Organelle Match** — memory game pairing structures with their jobs.
- **XP / Levels / Badges** — every activity earns XP; 10 badges to unlock;
  visible on the **Stats** page. Stored in this browser's `localStorage`
  only (not shared, not sent anywhere).
- **My Notes** — a personal scratchpad, also local-only.
- **Quick Reference** — prokaryotic vs eukaryotic comparison table.
- **How Does Life Begin?** — links out to your group's NotebookLM
  artifacts. These open in a new tab rather than being embedded, because
  Google's NotebookLM share pages set frame restrictions that block
  embedding inside another site's `<iframe>` — a direct link is the
  reliable option.
- **Sound** — short synthesized tones (click/correct/wrong/level-up), no
  external audio files, so there's no copyright concern. Mute with the
  speaker icon in the nav.
- Background: twinkling stars + drifting glow orbs, a cursor trail, and
  3D tilt on cards — all respect `prefers-reduced-motion`.

## What "upload content" does and doesn't do

The notes feature reads **.txt files directly** in the browser, or you can
paste text from anything (PDF, Word doc, slides — just open it and copy the
text in). It does not parse PDFs/DOCX itself; that would require pulling in
a parsing library and loosening the security policy to fetch it from a CDN,
which isn't worth it for a "paste your notes" feature. If you specifically
want native PDF upload, tell me and I'll add `pdf.js` properly.

## Security notes (realistic, not magic)

- No API key is ever in a file the browser can see — only in Cloudflare's
  encrypted environment variables, read server-side by the Functions.
- Chat/flashcard text is always inserted via `textContent`, never
  `innerHTML` — no script injection from AI or user input.
- Input length limits, a CSP, and a best-effort per-isolate rate limiter
  are in place (see `_headers` and `functions/_shared/ai.js`).
- For real rate-limiting, also turn on **Bot Fight Mode** and add a **Rate
  Limiting Rule** on `/api/*` in the Cloudflare dashboard (Security tab) —
  both free, both better than anything code alone can guarantee.
- No site is "unhackable." This setup gives solid, practical protection for
  a class project — not a guarantee.

## Project structure

```
index.html                  → all screens/markup
app.js                       → all interactivity (~900 lines)
data.js                      → questions, badges, microscope specimens, reference table
functions/_shared/ai.js      → shared multi-provider, multi-model AI logic
functions/api/chat.js        → chatbot endpoint
functions/api/flashcards.js  → notes → flashcards endpoint
_headers                     → Cloudflare security headers
```
