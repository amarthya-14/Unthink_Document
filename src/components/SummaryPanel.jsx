export default function SummaryPanel({ result, error }) {
  if (error) {
    return (
      <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-6 animate-[fadeIn_0.3s_ease-out]">
        <p className="font-display text-lg text-red-300 mb-1">The agent hit a snag</p>
        <p className="text-sm text-red-200/70 font-mono">{error}</p>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="rounded-lg border border-dashed border-ink-700 bg-ink-800/40 p-8 flex items-center justify-center text-center min-h-[240px] transition-colors duration-300">
        <p className="text-paper-100/30 font-body text-sm">
          Your summary will appear here once a document has been processed.
        </p>
      </div>
    )
  }

  return (
    <div className="group rounded-lg border border-ink-700 bg-paper-100 text-ink-900 p-6 sm:p-8 space-y-5 transition-all duration-300 hover:shadow-[0_20px_44px_-22px_rgba(0,0,0,0.5)] hover:-translate-y-0.5 animate-[fadeIn_0.4s_ease-out]">
      <div>
        <span className="inline-block text-[11px] uppercase tracking-wider font-mono text-steel-600 bg-steel-400/10 px-2 py-0.5 rounded mb-2 transition-colors duration-200 group-hover:bg-steel-400/20">
          {result.document_type}
        </span>
        <h3 className="font-display text-2xl leading-snug">{result.title}</h3>
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
