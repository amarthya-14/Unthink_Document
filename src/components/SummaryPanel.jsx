import { useState } from 'react'

function SkeletonPanel() {
  return (
    <div className="rounded-lg border border-ink-700 bg-paper-100 p-6 sm:p-8 space-y-5 animate-[fadeIn_0.3s_ease-out]">
      <div className="space-y-2">
        <div className="h-4 w-24 rounded bg-ink-900/10 animate-pulseSoft" />
        <div className="h-7 w-3/4 rounded bg-ink-900/10 animate-pulseSoft" />
      </div>
      <div className="space-y-2">
        <div className="h-3.5 w-full rounded bg-ink-900/10 animate-pulseSoft" />
        <div className="h-3.5 w-full rounded bg-ink-900/10 animate-pulseSoft" />
        <div className="h-3.5 w-2/3 rounded bg-ink-900/10 animate-pulseSoft" />
      </div>
      <div className="space-y-2 pt-2">
        <div className="h-3 w-20 rounded bg-ink-900/10 animate-pulseSoft" />
        <div className="h-3.5 w-5/6 rounded bg-ink-900/10 animate-pulseSoft" />
        <div className="h-3.5 w-4/6 rounded bg-ink-900/10 animate-pulseSoft" />
        <div className="h-3.5 w-3/6 rounded bg-ink-900/10 animate-pulseSoft" />
      </div>
    </div>
  )
}

function IconButton({ onClick, label, children, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`
        inline-flex items-center justify-center w-9 h-9 rounded-md
        transition-all duration-200 active:scale-90
        ${active ? 'bg-brass-500 text-ink-950' : 'text-ink-800/50 hover:text-ink-900 hover:bg-ink-900/5'}
      `}
    >
      {children}
    </button>
  )
}

export default function SummaryPanel({ result, error, isLoading }) {
  const [copied, setCopied] = useState(false)

  if (error) {
    return (
      <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-6 animate-[fadeIn_0.3s_ease-out]">
        <p className="font-display text-lg text-red-300 mb-1">The agent hit a snag</p>
        <p className="text-sm text-red-200/70 font-mono">{error}</p>
      </div>
    )
  }

  if (isLoading) return <SkeletonPanel />

  if (!result) {
    return (
      <div className="rounded-lg border border-dashed border-ink-700 bg-ink-800/40 p-8 flex items-center justify-center text-center min-h-[240px] transition-colors duration-300">
        <p className="text-paper-100/30 font-body text-sm">
          Your summary will appear here once a document has been processed.
        </p>
      </div>
    )
  }

  const plainText = [
    result.title,
    '',
    result.summary,
    '',
    'Key points:',
    ...result.key_points.map((p) => `- ${p}`),
  ].join('\n')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(plainText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // clipboard access denied — fail silently, button just won't confirm
    }
  }

  const handleDownload = () => {
    const blob = new Blob([plainText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${result.title.replace(/[^\w\- ]+/g, '').trim() || 'summary'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="group rounded-lg border border-ink-700 bg-paper-100 text-ink-900 p-6 sm:p-8 space-y-5 transition-all duration-300 hover:shadow-[0_20px_44px_-22px_rgba(0,0,0,0.5)] hover:-translate-y-0.5 animate-[fadeIn_0.4s_ease-out]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-block text-[11px] uppercase tracking-wider font-mono text-steel-600 bg-steel-400/10 px-2 py-0.5 rounded mb-2 transition-colors duration-200 group-hover:bg-steel-400/20">
            {result.document_type}
          </span>
          <h3 className="font-display text-2xl leading-snug">{result.title}</h3>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <IconButton onClick={handleCopy} label={copied ? 'Copied!' : 'Copy summary'} active={copied}>
            {copied ? (
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <rect x="5.5" y="5.5" width="8" height="8" rx="1.3" stroke="currentColor" strokeWidth="1.4" />
                <path d="M3 10.5V3.8A1.3 1.3 0 014.3 2.5h6.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            )}
          </IconButton>
          <IconButton onClick={handleDownload} label="Download as .txt">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v8.5M8 10.5L5 7.5M8 10.5l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 12.5v.8A1.7 1.7 0 004.7 15h6.6a1.7 1.7 0 001.7-1.7v-.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </IconButton>
        </div>
      </div>

      <p className="font-body text-[15px] leading-relaxed text-ink-800">{result.summary}</p>

      {result.key_points?.length > 0 && (
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-ink-800/50 mb-2">
            Key points
          </p>
          <ul className="space-y-1.5">
            {result.key_points.map((point, i) => (
              <li
                key={i}
                className="flex gap-2 text-sm font-body text-ink-800 rounded px-1.5 py-1 -mx-1.5 transition-colors duration-150 hover:bg-brass-500/10 animate-[fadeIn_0.3s_ease-out]"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}
              >
                <span className="text-brass-600 shrink-0">—</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
