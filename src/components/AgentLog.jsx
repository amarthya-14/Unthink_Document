export default function AgentLog({ steps, fileName, isActive }) {
  return (
    <div className="group rounded-lg border border-ink-700 bg-ink-800/60 overflow-hidden transition-all duration-300 hover:border-ink-700/80 hover:shadow-[0_16px_32px_-20px_rgba(0,0,0,0.6)]">
      <div className="relative bg-paper-100 h-28 sm:h-32 flex items-center justify-center overflow-hidden border-b border-ink-700">
        <span className="font-mono text-xs text-ink-800/60 px-4 text-center break-all transition-colors duration-200">
          {fileName || 'no document loaded'}
        </span>
        {isActive && (
          <div className="absolute inset-x-0 h-8 bg-gradient-to-b from-brass-500/0 via-brass-500/40 to-brass-500/0 animate-scan" />
        )}
      </div>

      <div className="p-4 font-mono text-xs space-y-2 max-h-48 overflow-y-auto">
        {steps.length === 0 && (
          <p className="text-paper-100/30">agent idle — waiting for a document</p>
        )}
        {steps.map((step, i) => (
          <div
            key={i}
            className="flex gap-2 animate-[fadeIn_0.35s_ease-out]"
            style={{ animationFillMode: 'backwards' }}
          >
            <span className="text-brass-500 shrink-0">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div>
              <span className="text-paper-100/90">{step.label}</span>
              {step.detail && (
                <span className="text-paper-100/40"> — {step.detail}</span>
              )}
            </div>
          </div>
        ))}
        {isActive && (
          <div className="flex gap-2 items-center text-steel-400">
            <span className="w-1.5 h-1.5 rounded-full bg-steel-400 animate-pulseSoft" />
            working…
          </div>
        )}
      </div>
    </div>
  )
}
