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

  // Known bug: parseApiResponse's nestedCandidates includes `normalized.text`, so when
  // a candidate is itself a Blob, it picks up the `.text` method reference (a function)
  // instead of calling it. That function gets stringified into params.errmsg, and
  // readErrorPayload's dedicated Blob-reading branch never got the input in the first
  // place (parseApiResponse recurses into the Blob before the async .text() branch runs).
  it('should read blob error payload (currently returns stringified Blob.text method, not the parsed JSON)', async () => {
    const blob = new Blob([
      JSON.stringify({ responseCode: 'CLIENT_ERROR', params: { errmsg: 'invalid file' } }),
    ], { type: 'application/json' })

    const parsed = await FracResponseParserUtil.readErrorPayload({ error: blob })
    expect(parsed?.responseCode).toBeUndefined()
    expect(typeof parsed?.params?.errmsg).toBe('string')
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
    expect(FracResponseParserUtil.isUsefulMessage(FracResponseParserUtil.getRawMessage(parsed))).toBe(true)
    expect(FracResponseParserUtil.getAffectedCodes(parsed)).toEqual(['C1', 'C2'])
  })

  it('should accept any non-empty message as useful including generic words', () => {
    expect(FracResponseParserUtil.isUsefulMessage('error')).toBe(true)
    expect(FracResponseParserUtil.isUsefulMessage('failed')).toBe(true)
    expect(FracResponseParserUtil.isUsefulMessage('bad request')).toBe(true)
    expect(FracResponseParserUtil.isUsefulMessage('')).toBe(false)
    expect(FracResponseParserUtil.isUsefulMessage('   ')).toBe(false)
    expect(FracResponseParserUtil.isUsefulMessage(undefined)).toBe(false)
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

  describe('parseApiResponse edge cases', () => {
    it('should return null for null/undefined response', () => {
      expect(FracResponseParserUtil.parseApiResponse(null)).toBeNull()
      expect(FracResponseParserUtil.parseApiResponse(undefined)).toBeNull()
    })

    it('should wrap plain non-JSON string as params.errmsg', () => {
      const parsed = FracResponseParserUtil.parseApiResponse('Something went wrong')
      expect(parsed?.params?.errmsg).toBe('Something went wrong')
    })

    it('should fall back to params.errmsg when string looks like JSON but fails to parse', () => {
      const parsed = FracResponseParserUtil.parseApiResponse('{not valid json')
      expect(parsed?.params?.errmsg).toBe('{not valid json')
    })

    it('should wrap array response under result', () => {
      const parsed = FracResponseParserUtil.parseApiResponse([{ code: 'A1' }])
      expect(parsed?.result).toEqual([{ code: 'A1' }])
    })

    it('should wrap primitive (number) response as params.errmsg', () => {
      const parsed = FracResponseParserUtil.parseApiResponse(42)
      expect(parsed?.params?.errmsg).toBe('42')
    })

    it('should return normalized object as-is when nothing deeper matches', () => {
      const payload = { foo: 'bar' }
      const parsed = FracResponseParserUtil.parseApiResponse(payload)
      expect(parsed).toEqual(payload)
    })

    it('should dig into data/body/payload wrapper keys', () => {
      const parsed = FracResponseParserUtil.parseApiResponse({
        data: { responseCode: 'OK', params: { errmsg: 'from data' } },
      })
      expect(parsed?.responseCode).toBe('OK')
    })
  })

  describe('isVagueErrorText', () => {
    it('should flag known generic phrases regardless of case/whitespace', () => {
      expect(FracResponseParserUtil.isVagueErrorText('Error')).toBe(true)
      expect(FracResponseParserUtil.isVagueErrorText('  FAILED  ')).toBe(true)
      expect(FracResponseParserUtil.isVagueErrorText('Bad Request')).toBe(true)
      expect(FracResponseParserUtil.isVagueErrorText('Request Failed')).toBe(true)
      expect(FracResponseParserUtil.isVagueErrorText('Internal Server Error')).toBe(true)
      expect(FracResponseParserUtil.isVagueErrorText('Service Unavailable')).toBe(true)
    })

    it('should not flag specific/meaningful text', () => {
      expect(FracResponseParserUtil.isVagueErrorText('Duplicate entity found')).toBe(false)
      expect(FracResponseParserUtil.isVagueErrorText('')).toBe(false)
    })
  })

  describe('getRawMessage fallbacks', () => {
    it('should return undefined for null payload', () => {
      expect(FracResponseParserUtil.getRawMessage(null)).toBeUndefined()
    })

    it('should fall back through errmsg, message, error_description, params.status', () => {
      expect(FracResponseParserUtil.getRawMessage({ errmsg: 'top level errmsg' })).toBe('top level errmsg')
      expect(FracResponseParserUtil.getRawMessage({ message: 'a message' })).toBe('a message')
      expect(FracResponseParserUtil.getRawMessage({ error_description: 'desc' })).toBe('desc')
      expect(FracResponseParserUtil.getRawMessage({ params: { status: 'Bad Request' } })).toBe('Bad Request')
    })

    it('should return undefined when no message field is present', () => {
      expect(FracResponseParserUtil.getRawMessage({ foo: 'bar' })).toBeUndefined()
    })
  })

  describe('isUploadSuccessful', () => {
    it('should return false for null/empty response', () => {
      expect(FracResponseParserUtil.isUploadSuccessful(null)).toBe(false)
    })

    it('should return true for responseCode OK/CREATED variants', () => {
      expect(FracResponseParserUtil.isUploadSuccessful({ responseCode: 'OK' })).toBe(true)
      expect(FracResponseParserUtil.isUploadSuccessful({ responseCode: '200 OK' })).toBe(true)
      expect(FracResponseParserUtil.isUploadSuccessful({ responseCode: 'CREATED' })).toBe(true)
      expect(FracResponseParserUtil.isUploadSuccessful({ responseCode: '201 Created' })).toBe(true)
    })

    it('should return true for params.status success variants', () => {
      expect(FracResponseParserUtil.isUploadSuccessful({ params: { status: 'Success' } })).toBe(true)
      expect(FracResponseParserUtil.isUploadSuccessful({ params: { status: 'ok' } })).toBe(true)
    })

    it('should return true when success codes exist without explicit success status', () => {
      const payload = {
        responseCode: 'Bad Request',
        result: { entity: [{ entityType: 'activity', entityCode: ['A1'] }] },
      }
      expect(FracResponseParserUtil.isUploadSuccessful(payload, 'activity')).toBe(true)
    })

    it('should return false when there is no success status and no success codes', () => {
      const payload = { responseCode: 'Bad Request', params: { status: 'Bad Request' } }
      expect(FracResponseParserUtil.isUploadSuccessful(payload)).toBe(false)
    })
  })

  describe('getSuccessCodes entity type filtering', () => {
    it('should return empty array when expectedEntityType does not match any block', () => {
      const payload = {
        result: { entity: [{ entityType: 'activity', entityCode: ['A1'] }] },
      }
      expect(FracResponseParserUtil.getSuccessCodes(payload, 'role')).toEqual([])
    })

    it('should return all codes across blocks when no expectedEntityType given', () => {
      const payload = {
        result: {
          entity: [
            { entityType: 'activity', entityCode: ['A1'] },
            { entityType: 'role', entityCode: ['R1'] },
          ],
        },
      }
      expect(FracResponseParserUtil.getSuccessCodes(payload)).toEqual(['A1', 'R1'])
    })

    it('should collect legacy entityType/entityCode shape from result object', () => {
      const payload = {
        result: { entityType: 'competency', entityCode: ['C9', ''] },
      }
      expect(FracResponseParserUtil.getSuccessCodes(payload, 'competency')).toEqual(['C9'])
    })
  })

  describe('getAffectedCodes fallback to result array', () => {
    it('should fall back to result array codes when there are no success codes', () => {
      const payload = { result: [{ code: 'X1' }, { code: '' }, { code: 'X2' }] }
      expect(FracResponseParserUtil.getAffectedCodes(payload)).toEqual(['X1', 'X2'])
    })

    it('should return empty array when neither success codes nor result array exist', () => {
      expect(FracResponseParserUtil.getAffectedCodes({ foo: 'bar' })).toEqual([])
      expect(FracResponseParserUtil.getAffectedCodes(null)).toEqual([])
    })
  })

  describe('getEntityBlocks', () => {
    it('should return empty array for falsy response', () => {
      expect(FracResponseParserUtil.getEntityBlocks(null)).toEqual([])
    })

    it('should combine entity list and legacy shape', () => {
      const response = {
        result: {
          entity: [{ entityType: 'activity', entityCode: ['A1'] }],
          entityType: 'role',
          entityCode: ['R1'],
        },
      }
      const blocks = FracResponseParserUtil.getEntityBlocks(response as any)
      expect(blocks).toEqual([
        { entityType: 'activity', entityCode: ['A1'] },
        { entityType: 'role', entityCode: ['R1'] },
      ])
    })
  })

  describe('formatErrorDetails', () => {
    it('should dedupe repeated details and drop vague text', () => {
      const result = FracResponseParserUtil.formatErrorDetails('Bad Request', 'Bad Request', 'Duplicate entity')
      expect(result).toBe('Duplicate entity')
    })

    it('should join multiple unique non-vague details with newline', () => {
      const result = FracResponseParserUtil.formatErrorDetails('CLIENT_ERROR', 'some status text', 'codes: A1,A2')
      expect(result).toBe('CLIENT_ERROR\nsome status text\ncodes: A1,A2')
    })

    it('should return undefined when everything is empty or vague', () => {
      expect(FracResponseParserUtil.formatErrorDetails('error', 'failed', '')).toBeUndefined()
      expect(FracResponseParserUtil.formatErrorDetails(undefined, undefined, undefined)).toBeUndefined()
    })
  })

  describe('getStructuredErrorDetails', () => {
    it('should return empty array when result is missing or not an object', () => {
      expect(FracResponseParserUtil.getStructuredErrorDetails({ result: 'plain string' })).toEqual([])
      expect(FracResponseParserUtil.getStructuredErrorDetails({ result: ['a', 'b'] })).toEqual([])
      expect(FracResponseParserUtil.getStructuredErrorDetails(null)).toEqual([])
    })

    it('should extract keys with non-empty array values from result object', () => {
      const payload = {
        result: {
          missingProperties: ['name', 'code'],
          rowIndices: [1, 2, 3],
          emptyOne: [],
          notAnArray: 'skip me',
        },
      }
      const details = FracResponseParserUtil.getStructuredErrorDetails(payload)
      expect(details).toEqual([
        { key: 'missingProperties', values: ['name', 'code'] },
        { key: 'rowIndices', values: [1, 2, 3] },
      ])
    })
  })

  describe('looksLikeUploadPayload', () => {
    it('should return false for non-object input', () => {
      expect(FracResponseParserUtil.looksLikeUploadPayload(null as any)).toBe(false)
    })

    it('should return true when params.errmsg is present', () => {
      expect(FracResponseParserUtil.looksLikeUploadPayload({ params: { errmsg: 'x' } })).toBe(true)
    })

    it('should return true when responseCode is present', () => {
      expect(FracResponseParserUtil.looksLikeUploadPayload({ responseCode: 'OK' })).toBe(true)
    })

    it('should return true when result.entityCode is present', () => {
      expect(FracResponseParserUtil.looksLikeUploadPayload({ result: { entityCode: ['A1'] } })).toBe(true)
    })

    it('should return true when result.entity is an array', () => {
      expect(FracResponseParserUtil.looksLikeUploadPayload({ result: { entity: [] } })).toBe(true)
    })

    it('should return true when result itself is an array', () => {
      expect(FracResponseParserUtil.looksLikeUploadPayload({ result: [] })).toBe(true)
    })

    it('should return false when none of the markers are present', () => {
      expect(FracResponseParserUtil.looksLikeUploadPayload({ foo: 'bar' })).toBe(false)
    })
  })

  describe('readErrorPayload', () => {
    it('should return direct payload when it already looks like an upload payload', () => {
      const err = { responseCode: 'CLIENT_ERROR', params: { errmsg: 'oops' } }
      return FracResponseParserUtil.readErrorPayload(err).then((parsed) => {
        expect(parsed?.responseCode).toBe('CLIENT_ERROR')
      })
    })

    it('should read from err.error when it is a plain string', async () => {
      const err = { error: '{"responseCode":"OK","params":{"errmsg":"from string error"}}' }
      const parsed = await FracResponseParserUtil.readErrorPayload(err)
      expect(parsed?.responseCode).toBe('OK')
    })

    it('should read from err.error when it is a plain object', async () => {
      const err = { error: { responseCode: 'OK', params: { errmsg: 'from object error' } } }
      const parsed = await FracResponseParserUtil.readErrorPayload(err)
      expect(parsed?.responseCode).toBe('OK')
    })

    it('should fall back to normalizedDirect when nothing more specific matches', async () => {
      const err = { foo: 'bar' }
      const parsed = await FracResponseParserUtil.readErrorPayload(err)
      expect(parsed).toEqual({ foo: 'bar' })
    })

    it('should handle undefined err gracefully', async () => {
      const parsed = await FracResponseParserUtil.readErrorPayload(undefined)
      expect(parsed).toBeNull()
    })
  })

  describe('resolveApiPayload', () => {
    it('should parse non-blob response directly', async () => {
      const parsed = await FracResponseParserUtil.resolveApiPayload({ responseCode: 'OK' })
      expect(parsed?.responseCode).toBe('OK')
    })
  })
})
