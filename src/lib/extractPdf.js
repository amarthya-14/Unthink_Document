import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

/**
 * Extracts text from a PDF file, page by page, preserving rough
 * paragraph structure by joining text items with line breaks
 * where vertical position jumps significantly.
 */
export async function extractPdfText(file, onProgress) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  let fullText = ''
  const totalPages = pdf.numPages

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()

    let lastY = null
    let pageText = ''

    for (const item of content.items) {
      if (lastY !== null && Math.abs(item.transform[5] - lastY) > 4) {
        pageText += '\n'
      }
      pageText += item.str
      lastY = item.transform[5]
    }

    fullText += pageText + '\n\n'
    onProgress?.(Math.round((pageNum / totalPages) * 100))
  }

  return fullText.trim()
}

/** Rough heuristic: does this PDF have an extractable text layer at all? */
export function isTextMeaningful(text) {
  const cleaned = text.replace(/\s/g, '')
  return cleaned.length > 40
}
