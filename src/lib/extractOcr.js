import { createWorker } from 'tesseract.js'

/**
 * Runs OCR on an image file (or a rendered PDF page canvas) and
 * returns the recognized text. Reports 0-100 progress via callback.
 */
export async function extractImageText(file, onProgress) {
  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        onProgress?.(Math.round(m.progress * 100))
      }
    },
  })

  try {
    const {
      data: { text },
    } = await worker.recognize(file)
    return text.trim()
  } finally {
    await worker.terminate()
  }
}
