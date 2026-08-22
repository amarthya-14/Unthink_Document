# Scanline — Document Summary Agent

Live demo: **[unthink-document.vercel.app](https://unthink-document.vercel.app/)**

Upload a PDF or a scanned image, and an agent reads it, falls back to OCR when there's no text layer to pull from, and works its way to a summary — you can watch every step happen in real time instead of just staring at a spinner.

## Stack

- **React + Vite + Tailwind** for the frontend — no backend to host or pay for
- **pdf.js** for PDF text extraction, running entirely in the browser
- **Tesseract.js** for OCR on images and scanned PDFs, also fully client-side
- **Gemini 2.5 Flash** as the default summarization model, with **Groq (Llama)** as an automatic fallback if Gemini's ever unavailable
- **Vercel** for hosting — free tier, deploys on every push

Nothing gets uploaded to a server. The only network call in the whole app is the extracted text going to whichever AI provider is doing the summarizing.

## Why it's an agent and not just a prompt

The model isn't asked to "write a summary" in free text — it's given one tool, `emit_summary`, with a strict schema (title, summary, key points, document type), and it has to call that tool to produce output. That constraint is what makes the output structured and predictable instead of a wall of text I'd have to parse myself.

Gemini and Groq both plug into the exact same schema, so switching providers is a config change, not a rewrite — useful because free-tier model availability shifts around more than you'd think, and I didn't want the whole thing to break every time a model got renamed.

## Running it locally

```bash
npm install
cp .env.example .env
```

Grab a free Gemini key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — no card needed — and drop it into `.env` as `VITE_GEMINI_API_KEY`.

```bash
npm run dev
```

Want to use Groq instead? Set `VITE_AI_PROVIDER=groq` and add `VITE_GROQ_API_KEY`. Gemini's the default because it's noticeably better at sticking to the schema, but Groq's faster and works fine as a backup.

## Deploying

Push to GitHub, import into Vercel, add your env vars under Project Settings → Environment Variables, deploy. That's it — every push to `main` redeploys automatically after that.

## A known rough edge

Scanned PDFs with no embedded text layer get OCR'd directly through Tesseract's PDF support. It works, but the more bulletproof approach would be rendering each page to a canvas first and OCR-ing the resulting images individually — I scoped that out to keep things moving, but it's the obvious next improvement if OCR accuracy becomes an issue on a particular file.

## The approach, briefly

I kept everything client-side on purpose — no backend meant no hosting cost and nothing to keep alive. pdf.js handles text extraction, Tesseract handles OCR when there's nothing to extract, and the only thing that ever leaves the browser is the extracted text going to the summarizer.

For the summarization itself, I didn't want a single hardcoded prompt — I wanted something that would hold up if I swapped models later, which is why it's built around one shared tool schema that both Gemini and Groq call into. If one provider goes down or a model gets deprecated, the app just tries the next one instead of falling over.

The interface treats the agent's reasoning as part of the product: a visual
stepper plus a detailed log shows extraction → OCR fallback → summarization
as it happens, so the "agent" isn't a black box — you can see it deciding
what to do. I chose free tiers requiring no billing card for both providers,
which matters for a reproducible take-home submission.
