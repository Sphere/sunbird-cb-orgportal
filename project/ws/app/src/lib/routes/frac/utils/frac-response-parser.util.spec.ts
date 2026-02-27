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
