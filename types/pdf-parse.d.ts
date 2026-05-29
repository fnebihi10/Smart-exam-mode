declare module 'pdf-parse' {
  type PdfParseResult = {
    text: string
  }

  type PdfParseOptions = {
    max?: number
  }

  export default function pdfParse(
    dataBuffer: Buffer,
    options?: PdfParseOptions
  ): Promise<PdfParseResult>
}
