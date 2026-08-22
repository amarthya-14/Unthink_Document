import { motion } from 'framer-motion'

export default function ScanSweep({ onComplete }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-ink-900 overflow-hidden"
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
    >
      {/* soft light bloom that sweeps down the screen */}
      <motion.div
        className="absolute inset-x-0 h-[45vh]"
        style={{
          background:
            'linear-gradient(to bottom, transparent, rgba(217,184,74,0.16), rgba(217,184,74,0.05), transparent)',
        }}
        initial={{ top: '-45vh' }}
        animate={{ top: '100vh' }}
        transition={{ duration: 0.85, ease: [0.65, 0, 0.35, 1] }}
      />

      {/* the crisp scan line itself */}
      <motion.div
        className="absolute inset-x-0 h-px bg-brass-400 shadow-[0_0_20px_4px_rgba(217,184,74,0.6)]"
        initial={{ top: '-2%' }}
        animate={{ top: '102%' }}
        transition={{ duration: 0.85, ease: [0.65, 0, 0.35, 1] }}
        onAnimationComplete={onComplete}
      />

      {/* faint grid fade, echoing the intro's background instead of an unrelated box */}
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #F6F3EC 1px, transparent 1px), linear-gradient(to bottom, #F6F3EC 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
        initial={{ opacity: 0.04 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.85, ease: 'easeOut' }}
      />
    </motion.div>
  )
}
