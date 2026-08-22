import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

export default function UploadZone({ onFileAccepted, disabled }) {
  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles.length > 0) onFileAccepted(acceptedFiles[0])
    },
    [onFileAccepted]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled,
    maxFiles: 1,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
    },
  })

  return (
    <div
      {...getRootProps()}
      className={`
        group relative overflow-hidden rounded-lg border-2 border-dashed
        transition-all duration-300 ease-out cursor-pointer
        flex flex-col items-center justify-center text-center
        px-6 py-16 sm:py-20
        ${
          isDragActive
            ? 'border-brass-500 bg-ink-800 scale-[1.01] shadow-[0_0_0_4px_rgba(201,162,39,0.12),0_20px_40px_-20px_rgba(0,0,0,0.6)]'
            : 'border-ink-700 bg-ink-800/60 hover:border-steel-400 hover:bg-ink-800 hover:shadow-[0_16px_32px_-18px_rgba(0,0,0,0.6)] hover:-translate-y-0.5'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed hover:translate-y-0 hover:border-ink-700 hover:bg-ink-800/60 hover:shadow-none' : ''}
      `}
    >
      <input {...getInputProps()} />

      {/* soft ambient glow that appears on hover */}
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_50%_30%,rgba(76,122,146,0.12),transparent_60%)]" />

      {/* viewfinder corner brackets — echoes the intro screen's scanner motif */}
      {[
        { pos: 'top-3 left-3', rotate: 0 },
        { pos: 'top-3 right-3', rotate: 90 },
        { pos: 'bottom-3 right-3', rotate: 180 },
        { pos: 'bottom-3 left-3', rotate: 270 },
      ].map((c, i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 28 28"
          fill="none"
          className={`pointer-events-none absolute ${c.pos} text-brass-500 opacity-0 ${
            isDragActive ? 'opacity-70' : 'group-hover:opacity-40'
          } transition-opacity duration-300`}
          style={{ transform: `rotate(${c.rotate}deg)` }}
        >
          <path d="M2 12V4a2 2 0 012-2h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ))}

      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        className={`mb-5 text-brass-500 transition-transform duration-300 ease-out ${
          isDragActive ? '-translate-y-1' : 'group-hover:-translate-y-0.5'
        }`}
        aria-hidden="true"
      >
        <path
          d="M12 16V4M12 4L7 9M12 4l5 5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="font-display text-xl text-paper-100 mb-1 transition-colors duration-200">
        {isDragActive ? 'Drop it on the glass' : 'Place a document on the scanner'}
      </p>
      <p className="text-sm text-paper-100/50 font-body">
        PDF, PNG, JPG, or WEBP — drag in, or click to browse
      </p>
    </div>
  )
}
