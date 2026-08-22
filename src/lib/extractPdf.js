import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

/**
 * Extracts text from a PDF file, page by page, preserving rough
 * paragraph structure by joining text items with line breaks
 * where vertical position jumps significantly.
 *
 * For large PDFs, pages are accumulated into an array and joined once at
 * the end (much faster than repeated string concatenation), and progress
 * is reported at each page so the UI can show real movement instead of
 * appearing to hang on big documents.
 */
export async function extractPdfText(file, onProgress) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const totalPages = pdf.numPages
  const pageTexts = new Array(totalPages)

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()

    let lastY = null
    const lineParts = []

    for (const item of content.items) {
      if (lastY !== null && Math.abs(item.transform[5] - lastY) > 4) {
        lineParts.push('\n')
      }
      lineParts.push(item.str)
      lastY = item.transform[5]
    }

    pageTexts[pageNum - 1] = lineParts.join('')
    // Free the page's resources as we go — matters for large multi-page PDFs.
    page.cleanup?.()

    onProgress?.(Math.round((pageNum / totalPages) * 100), pageNum, totalPages)
  }

  return pageTexts.join('\n\n').trim()
}

/** Rough heuristic: does this PDF have an extractable text layer at all? */
export function isTextMeaningful(text) {
  const cleaned = text.replace(/\s/g, '')
  return cleaned.length > 40
}
