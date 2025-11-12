import { Pipe, PipeTransform } from '@angular/core'

@Pipe({
  name: 'wordWrap'
})
export class WordWrapPipe implements PipeTransform {
  transform(value: string, wordsPerLine: number = 30): string {
    if (!value) return ''

    const words = value.split(/\s+/) // split by spaces
    let result = ''
    for (let i = 0; i < words.length; i++) {
      result += words[i] + ' '
      // Insert a <br> after every N words
      if ((i + 1) % wordsPerLine === 0) {
        result = result.trim() + '<br>'
      }

    }

    return result.trim()
  }
}
