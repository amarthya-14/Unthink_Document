const OPTIONS = [
  { value: 'short', label: 'Short' },
  { value: 'medium', label: 'Medium' },
  { value: 'long', label: 'Long' },
]

export default function LengthToggle({ value, onChange, disabled }) {
  const activeIndex = OPTIONS.findIndex((o) => o.value === value)

  return (
    <div
      className={`relative inline-flex rounded-md border border-ink-700 bg-ink-800/60 p-1 ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      }`}
      role="radiogroup"
      aria-label="Summary length"
    >
      {/* sliding highlight */}
      <span
        className="absolute top-1 bottom-1 rounded transition-all duration-300 ease-out bg-brass-500 shadow-[0_0_16px_-2px_rgba(201,162,39,0.7)]"
        style={{
          width: `calc(${100 / OPTIONS.length}% - 4px)`,
          left: `calc(${(activeIndex * 100) / OPTIONS.length}% + 2px)`,
        }}
      />
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={`
            relative z-10 px-3.5 py-1.5 text-sm font-body rounded transition-colors duration-200
            ${value === opt.value ? 'text-ink-950 font-medium' : 'text-paper-100/55 hover:text-paper-100'}
          `}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
