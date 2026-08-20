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
| Agent | Groq (`llama-3.3-70b-versatile`) via tool calling | Free tier, no card required, fast |
| Hosting | Vercel / Netlify | One-click, free static hosting |

Everything runs in the browser except the single call to Groq for
summarization — no backend server, no file ever leaves the user's machine
except the extracted text sent to the LLM.

## Why this counts as an "agent," not just a prompt

`src/lib/agent.js` gives the model one tool, `emit_summary`, with a strict
schema, and lets the model decide the content — title, summary, key points,
and document type — from open-ended text rather than following a fixed
template. It's built so a second tool (e.g. a table extractor or a
language detector) can be added without touching the calling code, which
is the actual point of a tool-calling agent over a single prompt.

## Setup

```bash
npm install
cp .env.example .env
# add your free Groq key to .env (https://console.groq.com/keys)
npm run dev
```

## Deploying

Push to GitHub, then import the repo into Vercel. Add `VITE_GROQ_API_KEY`
as an environment variable in the Vercel project settings. No other
config needed — `vite build` is the default build command.

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

For summarization, I used Groq's free-tier Llama 3.3 70B through a real
tool-calling agent rather than a single freeform prompt — the model must
call `emit_summary` with a strict schema (title, summary, key points,
document type), which keeps output structured and makes the agent easy to
extend with more tools later without changing the UI.

The interface treats the agent's reasoning as part of the product: a
step log shows extraction → OCR fallback → summarization as it happens,
so the "agent" isn't a black box — you can see it deciding what to do.
I chose Groq specifically because it needs no billing card on the free
tier, unlike some alternatives, which matters for a reproducible take-home
submission.
