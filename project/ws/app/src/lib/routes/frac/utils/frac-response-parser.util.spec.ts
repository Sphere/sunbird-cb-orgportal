import { FracResponseParserUtil } from './frac-response-parser.util'

describe('FracResponseParserUtil', () => {
  it('should parse JSON string payload', () => {
    const parsed = FracResponseParserUtil.parseApiResponse('{"responseCode":"OK"}')
    expect(parsed?.responseCode).toBe('OK')
  })

  it('should parse nested error payload shape', () => {
    const parsed = FracResponseParserUtil.parseApiResponse({
      error: {
        responseCode: 'CLIENT_ERROR',
        params: { errmsg: 'Duplicate entity' },
      },
    })

    expect(parsed?.responseCode).toBe('CLIENT_ERROR')
    expect((parsed?.params as any)?.errmsg).toBe('Duplicate entity')
  })

  it('should read blob error payload', async () => {
    const blob = new Blob([
      JSON.stringify({ responseCode: 'CLIENT_ERROR', params: { errmsg: 'invalid file' } }),
    ], { type: 'application/json' })

    const parsed = await FracResponseParserUtil.readErrorPayload({ error: blob })
    expect(parsed?.responseCode).toBe('CLIENT_ERROR')
  })

  it('should resolve blob payload returned in next handler', async () => {
    const blob = new Blob([
      JSON.stringify({
        responseCode: 'Bad Request',
        params: { status: 'Bad Request', errmsg: 'Duplicate entry found' },
        result: [{ code: 'C1', languageCode: 'en' }],
      }),
    ], { type: 'application/json' })

    const parsed = await FracResponseParserUtil.resolveApiPayload(blob)
    expect(parsed?.responseCode).toBe('Bad Request')
    expect((parsed?.params as any)?.errmsg).toBe('Duplicate entry found')
    expect(FracResponseParserUtil.getAffectedCodes(parsed)).toEqual(['C1'])
  })

  it('should extract duplicate message from stage-style payload', () => {
    const payload = {
      id: null,
      responseCode: 'Bad Request',
      params: {
        status: 'Bad Request',
        errmsg: 'Duplicate entry found',
      },
      result: [
        { code: 'C1', languageCode: 'en' },
        { code: 'C2', languageCode: 'en' },
      ],
    }

    const parsed = FracResponseParserUtil.parseApiResponse(payload)
    expect(FracResponseParserUtil.getRawMessage(parsed)).toBe('Duplicate entry found')
    expect(FracResponseParserUtil.isUsefulMessage(FracResponseParserUtil.getRawMessage(parsed))).toBeTrue()
    expect(FracResponseParserUtil.getAffectedCodes(parsed)).toEqual(['C1', 'C2'])
  })

  it('should collect success and affected codes', () => {
    const payload = {
      responseCode: 'OK',
      result: {
        entity: [
          { entityType: 'activity', entityCode: ['A1', 'A2'] },
        ],
      },
    }

    expect(FracResponseParserUtil.getSuccessCodes(payload, 'activity')).toEqual(['A1', 'A2'])
    expect(FracResponseParserUtil.getAffectedCodes(payload)).toEqual(['A1', 'A2'])
  })
})
