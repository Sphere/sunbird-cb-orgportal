import { Pipe, PipeTransform } from '@angular/core'

@Pipe({
  name: 'wordWrap'
})
export class WordWrapPipe implements PipeTransform {
  transform(value: string, charLimit: number = 40): string {
    if (!value) return ''

    const text = String(value).trim()

    // If text is already short, return as-is
    if (text.length <= charLimit) {
      return text
    }

    // Split by existing line breaks to preserve formatting
    const existingLines = text.split('\n')
    const result: string[] = []

    for (const line of existingLines) {
      if (line.length <= charLimit) {
        result.push(line)
      } else {
        // Wrap this line
        result.push(this.wrapLine(line, charLimit))
      }
    }

    // Join with <br> tags for HTML rendering
    return result.join('<br>')
  }

  private wrapLine(text: string, charLimit: number): string {
    const lines: string[] = []
    let currentLine = ''
    const words = text.split(/\s+/)

    for (const word of words) {
      const testLine = currentLine ? currentLine + ' ' + word : word

      if (testLine.length > charLimit) {
        if (currentLine) {
          lines.push(currentLine)
          currentLine = word
        } else {
          // Word is longer than limit, add it anyway
          lines.push(word)
          currentLine = ''
        }
      } else {
        currentLine = testLine
      }
    }

    if (currentLine) {
      lines.push(currentLine)
    }

    return lines.join('<br>')
  }
}
