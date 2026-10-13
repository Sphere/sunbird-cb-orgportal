import { WordWrapPipe } from './word-wrap.pipe'

describe('WordWrapPipe', () => {
  let pipe: WordWrapPipe

  beforeEach(() => {
    pipe = new WordWrapPipe()
  })

  it('should return an empty string for a falsy value', () => {
    expect(pipe.transform('')).toBe('')
    expect(pipe.transform(undefined as any)).toBe('')
    expect(pipe.transform(null as any)).toBe('')
  })

  it('should return trimmed text unchanged when within the char limit', () => {
    expect(pipe.transform('  short text  ', 20)).toBe('short text')
  })

  it('should wrap a single long line into multiple <br>-joined segments', () => {
    const result = pipe.transform('one two three four five', 10)
    expect(result).toBe('one two<br>three four<br>five')
  })

  it('should preserve existing line breaks and only wrap lines that exceed the limit', () => {
    const result = pipe.transform('short line\nthis line is quite long and should wrap', 15)
    expect(result).toBe('short line<br>this line is<br>quite long and<br>should wrap')
  })

  it('should keep a single word longer than the limit on its own line', () => {
    const result = pipe.transform('supercalifragilisticexpialidocious short', 10)
    expect(result).toBe('supercalifragilisticexpialidocious<br>short')
  })

  it('should use the default char limit when none is provided', () => {
    const shortText = 'a'.repeat(20)
    expect(pipe.transform(shortText)).toBe(shortText)
  })
})
