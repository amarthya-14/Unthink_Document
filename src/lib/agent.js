/**
 * SummaryAgent
 * ------------
 * A single tool-using agent responsible for turning raw extracted document
 * text into a structured summary, with automatic provider fallback: if the
 * primary provider (Gemini, by default) is unavailable — key missing,
 * rate-limited, model retired, network hiccup — the agent transparently
 * retries with the next configured provider (Groq, the "basic" fallback)
 * rather than failing outright. Both providers implement the same
 * emit_summary schema, so the fallback is invisible to the rest of the app.
 *
 * Order is controlled by VITE_AI_PROVIDER ('gemini' | 'groq', default
 * 'gemini'). Only providers with a configured API key are tried.
 */

import { callGemini } from './providers/gemini'
import { callGroq } from './providers/groq'

const FUNCTION_SCHEMA = {
  name: 'emit_summary',
  description: 'Emit the final structured summary of the document once analysis is complete.',
  parameters: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'A short descriptive title for the document (max 8 words).',
      },
      summary: {
        type: 'string',
        description: 'The prose summary at the requested length.',
      },
      key_points: {
        type: 'array',
        items: { type: 'string' },
        description: '3-6 concise bullet points capturing the essential information.',
      },
      document_type: {
        type: 'string',
        description:
          'Best guess at document type, e.g. "invoice", "research paper", "email", "contract", "report".',
      },
    },
    required: ['title', 'summary', 'key_points', 'document_type'],
  },
}

const LENGTH_GUIDANCE = {
  short: 'about 2-3 sentences, only the most critical information',
  medium: 'about 1-2 short paragraphs, covering main ideas with light detail',
  long: 'about 3-4 paragraphs, thorough coverage of details, context, and implications',
}

const SYSTEM_PROMPT =
  'You are a precise document analysis agent. You read extracted document text ' +
  '(which may contain OCR noise or formatting artifacts) and produce a structured ' +
  'summary by calling the emit_summary tool exactly once. Do not include markdown ' +
  'formatting inside the tool arguments. If the text looks like OCR output with ' +
  'errors, silently work around minor noise rather than commenting on it. Write in ' +
  'clear, natural prose — avoid generic filler like "this document discusses".'

// Gemini's free-tier context window is far larger than Groq's, so a bigger
// document can be summarized more completely there before truncation kicks in.
const MAX_CHARS = { gemini: 120000, groq: 20000 }

const PREFERRED = import.meta.env.VITE_AI_PROVIDER === 'groq' ? 'groq' : 'gemini'

function buildProviderList() {
  const candidates = [
    { name: 'gemini', label: 'Gemini', key: import.meta.env.VITE_GEMINI_API_KEY, call: callGemini },
    { name: 'groq', label: 'Groq (basic)', key: import.meta.env.VITE_GROQ_API_KEY, call: callGroq },
  ].filter((p) => p.key)

  candidates.sort((a) => (a.name === PREFERRED ? -1 : 1))
  return candidates
}

export async function runSummaryAgent({ text, length = 'medium', onStep }) {
  const providers = buildProviderList()

  if (providers.length === 0) {
    throw new Error(
      'No AI provider configured. Add VITE_GEMINI_API_KEY and/or VITE_GROQ_API_KEY to your .env file.'
    )
  }

  onStep?.({ label: 'Agent received extracted text', detail: `${text.length.toLocaleString()} characters` })

  let lastError = null

  for (const provider of providers) {
    const maxChars = MAX_CHARS[provider.name] ?? 20000
    const truncated =
      text.length > maxChars ? text.slice(0, maxChars) + '\n[...truncated for length...]' : text
    const userPrompt = `Analyze the following document text and call emit_summary with a summary of ${LENGTH_GUIDANCE[length]}.\n\nDOCUMENT TEXT:\n"""\n${truncated}\n"""`

    onStep?.({ label: `Summarizing via ${provider.label}`, detail: `Target length: ${length}` })

    try {
      const parsed = await provider.call({
        apiKey: provider.key,
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        functionSchema: FUNCTION_SCHEMA,
        onStep,
      })
      onStep?.({ label: 'Agent generated structured summary', detail: `via ${provider.label}` })
      return parsed
    } catch (err) {
      lastError = err
      onStep?.({
        label: `${provider.label} unavailable`,
        detail: providers.length > 1 ? 'falling back to next provider' : err.message?.slice(0, 90),
      })
    }
  }

  throw new Error(`All configured providers failed. Last error: ${lastError?.message || 'unknown'}`)
}
