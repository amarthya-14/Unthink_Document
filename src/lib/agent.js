/**
 * SummaryAgent
 * ------------
 * A single tool-using agent responsible for turning raw extracted document
 * text into a structured summary. It is a real agent rather than one
 * static prompt: given the extracted text and the user's requested length,
 * it decides how to call its one tool (`emit_summary`), and the same
 * function schema is shared across providers so swapping the underlying
 * model doesn't change the app's data shape.
 *
 * Provider is selected via VITE_AI_PROVIDER ('gemini' | 'groq'), default
 * 'gemini' — Gemini 2.5 Flash's free tier needs no billing card and
 * generally produces better-structured summaries than the small free
 * Groq models. Groq is kept available as a faster, alternate option.
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

export async function runSummaryAgent({ text, length = 'medium', apiKey, provider, onStep }) {
  if (!apiKey) {
    throw new Error(
      `Missing API key for ${provider}. Add it to your .env file (see README).`
    )
  }

  onStep?.({ label: 'Agent received extracted text', detail: `${text.length.toLocaleString()} characters` })

  const truncated = text.length > 18000 ? text.slice(0, 18000) + '\n[...truncated for length...]' : text
  const userPrompt = `Analyze the following document text and call emit_summary with a summary of ${LENGTH_GUIDANCE[length]}.\n\nDOCUMENT TEXT:\n"""\n${truncated}\n"""`

  onStep?.({ label: 'Agent deciding how to summarize', detail: `Target length: ${length} · via ${provider}` })

  const args = { apiKey, systemPrompt: SYSTEM_PROMPT, userPrompt, functionSchema: FUNCTION_SCHEMA, onStep }

  const parsed = provider === 'groq' ? await callGroq(args) : await callGemini(args)

  onStep?.({ label: 'Agent generated structured summary', detail: 'parsed successfully' })

  return parsed
}
