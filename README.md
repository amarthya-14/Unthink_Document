## 🚀 Live Demo

You can access the deployed application here:

**[Scanline — Document Summary Agent](https://unthink-document-kcvj4vm5a-amarthya-14s-projects.vercel.app/)**

> The application is deployed on Vercel and can be used directly from the browser without any local setup.

# Scanline — Document Summary Agent

Upload a PDF or a scanned image and a single AI agent extracts the text,
falls back to OCR when there's no text layer, and reasons its way to a
structured summary — with every step visible as it happens.

## Stack

| Layer | Tool | Why |
|---|---|---|
| Frontend | React + Vite + Tailwind | Fast build, no backend needed |
| PDF parsing | `pdfjs-dist` | Runs entirely client-side |
| OCR | `tesseract.js` | Runs entirely client-side, no API cost |
| Agent | Gemini 2.5 Flash (default) or Groq Llama, via tool calling | Free tier, no card required, structured output |
| Hosting | Vercel / Netlify | One-click, free static hosting |

Everything runs in the browser except the single call to the AI provider for
summarization — no backend server, no file ever leaves the user's machine
except the extracted text sent to the model.

## Why this counts as an "agent," not just a prompt

`src/lib/agent.js` gives the model one tool, `emit_summary`, with a strict
schema, and lets the model decide the content — title, summary, key points,
and document type — from open-ended text rather than following a fixed
template. Providers (`src/lib/providers/gemini.js`, `groq.js`) share the same
schema, so swapping the underlying model doesn't change the app's data shape
or the calling code — the actual point of a tool-calling agent over a single
hardcoded prompt.

## Setup

```bash
npm install
cp .env.example .env
```

Get a free Gemini key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
(no billing card required) and paste it into `.env` as `VITE_GEMINI_API_KEY`.

```bash
npm run dev
```

### Switching providers

Set `VITE_AI_PROVIDER=groq` in `.env` and provide `VITE_GROQ_API_KEY` to use
Groq's Llama models instead — faster inference, but generally slightly less
polished summaries on the free-tier models. Gemini is the default because it
tends to produce noticeably better structured output for this use case.

## Deploying

Push to GitHub, then import the repo into Vercel. Add `VITE_AI_PROVIDER` and
`VITE_GEMINI_API_KEY` (or the Groq equivalents) as environment variables in
the Vercel project settings, then redeploy. No other config needed —
`vite build` is the default build command, and every push to `main`
auto-redeploys once the repo is connected.

## Known limitation

Scanned PDFs with no embedded text layer are OCR'd directly via
`tesseract.js`'s PDF support. If you hit issues with a particular scanned
PDF in your environment, the more robust fix is rendering each PDF page
to a `<canvas>` with `pdf.js` first and OCR-ing the resulting images —
left as a straightforward extension given the time budget.

## Approach (write-up, <200 words)

I kept the whole pipeline client-side to avoid backend cost and hosting
complexity: `pdf.js` extracts text directly in-browser, and `tesseract.js`
handles OCR for images or scanned PDFs with no text layer, so nothing is
uploaded anywhere except the final extracted text sent to the summarizer.

For summarization, I used a real tool-calling agent (Gemini 2.5 Flash by
default, Groq Llama as a swappable alternative) rather than a single
freeform prompt — the model must call `emit_summary` with a strict schema
(title, summary, key points, document type), which keeps output structured
and makes the agent easy to extend with more tools later without changing
the UI. Both providers share one schema, so the provider is just a
configuration choice, not a rewrite.

The interface treats the agent's reasoning as part of the product: a visual
stepper plus a detailed log shows extraction → OCR fallback → summarization
as it happens, so the "agent" isn't a black box — you can see it deciding
what to do. I chose free tiers requiring no billing card for both providers,
which matters for a reproducible take-home submission.
