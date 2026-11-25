import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { PlaylistApiService, PlaylistType, PLAYLIST_IDS } from './playlist-api.service'
import { Playlist, PlaylistCompetencyPayload, PlaylistFilters } from '../models/playlist.model'

describe('PlaylistApiService', () => {
  let service: PlaylistApiService
  let httpMock: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PlaylistApiService],
    })
    service = TestBed.inject(PlaylistApiService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
  })

  describe('searchOrganizations', () => {
    it('posts to org search API and maps orgs using orgName', () => {
      let result: { value: string, label: string }[] | undefined
      service.searchOrganizations().subscribe(res => (result = res))

      const req = httpMock.expectOne('/apis/proxies/v8/org/v1/search')
      expect(req.request.method).toBe('POST')
      expect(req.request.body.request.limit).toBe(9999)

      req.flush({
        result: {
          response: {
            content: [
              { id: 'org1', orgName: 'Org One' },
              { id: 'org2', channel: 'chan2' },
              { id: 'org3' },
            ],
          },
        },
      })

      expect(result).toEqual([
        { value: 'org1', label: 'Org One' },
        { value: 'org2', label: 'chan2' },
        { value: 'org3', label: 'Unknown Organization' },
      ])
    })

    it('returns empty array when response has no content', () => {
      let result: { value: string, label: string }[] | undefined
      service.searchOrganizations().subscribe(res => (result = res))

      const req = httpMock.expectOne('/apis/proxies/v8/org/v1/search')
      req.flush({ result: { response: {} } })

      expect(result).toEqual([])
    })
  })

  describe('searchPositions', () => {
    it('posts to entity search API with default language and dedupes/sorts case-insensitively', () => {
      let result: { value: string, label: string }[] | undefined
      service.searchPositions().subscribe(res => (result = res))

      const req = httpMock.expectOne('/apis/proxies/v8/entity/v1/search')
      expect(req.request.method).toBe('POST')
      expect(req.request.body.language).toBe('en')

      req.flush({
        result: {
          entity: [
            { name: 'Teacher' },
            { name: '  teacher  ' },
            { name: 'Admin' },
            { name: '' },
            {},
          ],
        },
      })

      expect(result).toEqual([
        { value: 'Admin', label: 'Admin' },
        { value: 'Teacher', label: 'Teacher' },
      ])
    })

    it('uses a custom language when provided', () => {
      service.searchPositions('hi').subscribe()
      const req = httpMock.expectOne('/apis/proxies/v8/entity/v1/search')
      expect(req.request.body.language).toBe('hi')
      req.flush({ result: { entity: [] } })
    })
  })

  describe('searchPlaylist', () => {
    it('builds request with playlistId for given type and normalizes results', () => {
      const filters: PlaylistFilters = { orgId: 'org1', role: ['teacher'], language: 'en' }
      let result: Playlist[] | undefined

      service.searchPlaylist(filters, PlaylistType.COMPETENCY).subscribe(res => (result = res))

      const req = httpMock.expectOne('/apis/protected/v8/playlist/search')
      expect(req.request.method).toBe('POST')
      expect(req.request.body.request.filters.playlistId).toBe(PLAYLIST_IDS[PlaylistType.COMPETENCY])

      const rawPlaylist = {
        id: 'p1',
        scope: { orgId: 'org1', roles: ['teacher'], language: 'en', state: ['KA'], district: ['Bangalore'] },
        dataSource: { type: 'competency', payload: [] },
      }
      req.flush({ result: { playlist: [rawPlaylist] } })

      expect(result).toHaveLength(1)
      expect(result?.[0].orgId).toBe('org1')
      expect(result?.[0].role).toEqual(['teacher'])
      expect(result?.[0].state).toEqual(['KA'])
      expect(result?.[0].district).toEqual(['Bangalore'])
      expect(result?.[0].language).toBe('en')
    })

    it('defaults to COURSE playlist type when not specified', () => {
      const filters: PlaylistFilters = { orgId: 'org1', role: [], language: 'en' }
      service.searchPlaylist(filters).subscribe()

      const req = httpMock.expectOne('/apis/protected/v8/playlist/search')
      expect(req.request.body.request.filters.playlistId).toBe(PLAYLIST_IDS[PlaylistType.COURSE])
      req.flush({ result: { playlist: [] } })
    })

    it('returns empty array when result has no playlist field', () => {
      const filters: PlaylistFilters = { orgId: 'org1', role: [], language: 'en' }
      let result: Playlist[] | undefined
      service.searchPlaylist(filters).subscribe(res => (result = res))

      const req = httpMock.expectOne('/apis/protected/v8/playlist/search')
      req.flush({ result: {} })

      expect(result).toEqual([])
    })

    it('normalizes role/state/district from top-level fields when scope is absent', () => {
      const filters: PlaylistFilters = { orgId: 'org1', role: [], language: 'en' }
      let result: Playlist[] | undefined
      service.searchPlaylist(filters).subscribe(res => (result = res))

      const req = httpMock.expectOne('/apis/protected/v8/playlist/search')
      const rawPlaylist = {
        id: 'p1',
        role: ['principal'],
        state: ['TN'],
        district: ['Chennai'],
        orgId: 'org9',
        language: 'ta',
        dataSource: { type: 'static', payload: [] },
      }
      req.flush({ result: { playlist: [rawPlaylist] } })

      expect(result?.[0].role).toEqual(['principal'])
      expect(result?.[0].state).toEqual(['TN'])
      expect(result?.[0].district).toEqual(['Chennai'])
      expect(result?.[0].orgId).toBe('org9')
      expect(result?.[0].language).toBe('ta')
    })
  })

  describe('extractCourseIds', () => {
    it('returns empty array for empty/null input', () => {
      expect(service.extractCourseIds([])).toEqual([])
      expect(service.extractCourseIds(null as unknown as Playlist[])).toEqual([])
    })

    it('extracts unique course ids from static playlists only', () => {
      const playlists = [
        { dataSource: { type: 'static', payload: ['c1', 'c2', 'c1', ''] } },
        { dataSource: { type: 'competency', payload: ['c3'] } },
        { dataSource: { type: 'static', payload: [123, 'c4'] } },
        {},
      ] as unknown as Playlist[]

      expect(service.extractCourseIds(playlists)).toEqual(['c1', 'c2', 'c4'])
    })
  })

  describe('extractCompetencyIds', () => {
    it('returns empty array for empty/null input', () => {
      expect(service.extractCompetencyIds([])).toEqual([])
      expect(service.extractCompetencyIds(null as unknown as Playlist[])).toEqual([])
    })

    it('extracts ids (including duplicates) from flat and wrapped competency payload items', () => {
      const playlists = [
        {
          dataSource: {
            type: 'competency',
            payload: [
              { id: 100, code: 'C1' },
              { wrapper: { id: 200, code: 'C2' } },
              { id: 100 },
              'invalid',
              null,
            ],
          },
        },
        { dataSource: { type: 'static', payload: [{ id: 999 }] } },
      ] as unknown as Playlist[]

      expect(service.extractCompetencyIds(playlists)).toEqual(['100', '200', '100'])
    })
  })

  describe('extractCompetencyCodes', () => {
    it('returns empty array for empty/null input', () => {
      expect(service.extractCompetencyCodes([])).toEqual([])
      expect(service.extractCompetencyCodes(undefined as unknown as Playlist[])).toEqual([])
    })

    it('extracts unique uppercased codes, falling back to additionalProperties.Code', () => {
      const playlists = [
        {
          dataSource: {
            type: 'competency',
            payload: [
              { id: 1, code: 'c1' },
              { id: 2, additionalProperties: { Code: 'c2' } },
              { id: 3, code: 'C1' },
              { id: 4 },
            ],
          },
        },
      ] as unknown as Playlist[]

      expect(service.extractCompetencyCodes(playlists)).toEqual(['C1', 'C2'])
    })
  })

  describe('extractCompetencyData', () => {
    it('returns empty array for empty/null input', () => {
      expect(service.extractCompetencyData([])).toEqual([])
    })

    it('builds full competency objects with fallback defaults', () => {
      const playlists = [
        {
          dataSource: {
            type: 'competency',
            payload: [
              { id: 1, name: 'Comp1' },
              { id: 2, code: 'C2', name: 'Comp2', description: 'd', type: 'Skill', levels: [{ level: 1 }] },
            ],
          },
        },
      ] as unknown as Playlist[]

      const result = service.extractCompetencyData(playlists)
      expect(result).toEqual([
        { id: '1', code: 'C1', name: 'Comp1', description: '', type: 'Domain', levels: [] },
        { id: '2', code: 'C2', name: 'Comp2', description: 'd', type: 'Skill', levels: [{ level: 1 }] },
      ])
    })
  })

  describe('buildCompetencyPayload', () => {
    it('formats competencies into c1, c2... keyed objects', () => {
      const competencies: PlaylistCompetencyPayload[] = [
        { id: 1, name: 'Comp1', code: 'C1', levels: [{ level: 1 }] },
        { id: 2, name: 'Comp2' },
      ]

      const result = service.buildCompetencyPayload(competencies)

      expect(result[0]).toEqual({
        c1: {
          id: 1,
          name: 'Comp1',
          type: 'Competency',
          description: '',
          additionalProperties: { Code: 'C1', competencyLevelDescription: [{ level: 1 }] },
        },
      })
      expect(result[1]).toEqual({
        c2: {
          id: 2,
          name: 'Comp2',
          type: 'Competency',
          description: '',
          additionalProperties: { Code: 'C2', competencyLevelDescription: [] },
        },
      })
    })
  })

  describe('createPlaylist', () => {
    const filters: PlaylistFilters = { orgId: 'org1', role: ['teacher'], state: ['KA'], district: [], language: 'en' }

    it('posts to create endpoint with static dataSource for COURSE type and built scope', () => {
      let result: unknown
      service.createPlaylist(filters, ['c1', 'c2']).subscribe(res => (result = res))

      const req = httpMock.expectOne('/apis/protected/v8/playlist/create')
      expect(req.request.method).toBe('POST')
      expect(req.request.body.request.playlist.playlistId).toBe(PLAYLIST_IDS[PlaylistType.COURSE])
      expect(req.request.body.request.playlist.dataSource).toEqual({ type: 'static', payload: ['c1', 'c2'] })
      expect(req.request.body.request.playlist.scope).toEqual({ orgId: 'org1', role: ['teacher'], state: ['KA'], language: 'en' })

      const response = { responseCode: 'OK', result: {} }
      req.flush(response)
      expect(result).toEqual(response)
    })

    it('builds a competency dataSource for COMPETENCY type', () => {
      const competencies: PlaylistCompetencyPayload[] = [{ id: 1 }]
      service.createPlaylist(filters, competencies, PlaylistType.COMPETENCY).subscribe()

      const req = httpMock.expectOne('/apis/protected/v8/playlist/create')
      expect(req.request.body.request.playlist.dataSource).toEqual({ type: 'competency', payload: competencies })
      expect(req.request.body.request.playlist.playlistId).toBe(PLAYLIST_IDS[PlaylistType.COMPETENCY])
      req.flush({ responseCode: 'SUCCESS' })
    })

    it('builds a query dataSource for SEARCH type', () => {
      service.createPlaylist(filters, { q: 'x' }, PlaylistType.SEARCH).subscribe()

      const req = httpMock.expectOne('/apis/protected/v8/playlist/create')
      expect(req.request.body.request.playlist.dataSource).toEqual({ type: 'query', payload: { q: 'x' } })
      req.flush({ responseCode: 'OK' })
    })

    it('throws when responseCode is not OK/SUCCESS', () => {
      let error: unknown
      service.createPlaylist(filters, ['c1']).subscribe({
        next: () => fail('should not emit next'),
        error: err => (error = err),
      })

      const req = httpMock.expectOne('/apis/protected/v8/playlist/create')
      const failResponse = { responseCode: 'FAILED' }
      req.flush(failResponse)

      expect(error).toEqual(failResponse)
    })
  })

  describe('updatePlaylist', () => {
    const filters: PlaylistFilters = { orgId: 'org1', role: ['teacher'], language: 'en' }
    const existingPlaylist: Playlist = {
      id: 'p1',
      playlistId: 'existingPlaylistId',
      orgId: 'org1',
      role: ['teacher'],
      language: 'en',
      dataSource: { type: 'static', payload: [] },
    }

    it('puts to update endpoint using existing playlistId', () => {
      let result: unknown
      service.updatePlaylist(existingPlaylist, filters, ['c1']).subscribe(res => (result = res))

      const req = httpMock.expectOne('/apis/protected/v8/playlist/update')
      expect(req.request.method).toBe('PUT')
      expect(req.request.body.request.playlist.id).toBe('p1')
      expect(req.request.body.request.playlist.playlistId).toBe('existingPlaylistId')
      expect(req.request.body.request.playlist.dataSource).toEqual({ type: 'static', payload: ['c1'] })

      const response = { responseCode: 'OK' }
      req.flush(response)
      expect(result).toEqual(response)
    })

    it('falls back to name then generated id when playlistId missing', () => {
      const playlistNoId: Playlist = { ...existingPlaylist, playlistId: undefined, name: 'myName' }
      service.updatePlaylist(playlistNoId, filters, ['c1']).subscribe()

      const req = httpMock.expectOne('/apis/protected/v8/playlist/update')
      expect(req.request.body.request.playlist.playlistId).toBe('myName')
      req.flush({ responseCode: 'OK' })
    })

    it('generates playlistN id when neither playlistId nor name exist', () => {
      const playlistNoIdOrName: Playlist = { ...existingPlaylist, playlistId: undefined, name: undefined, id: '42' }
      service.updatePlaylist(playlistNoIdOrName, filters, ['c1']).subscribe()

      const req = httpMock.expectOne('/apis/protected/v8/playlist/update')
      expect(req.request.body.request.playlist.playlistId).toBe('playlist42')
      req.flush({ responseCode: 'OK' })
    })

    it('throws when responseCode indicates failure', () => {
      let error: unknown
      service.updatePlaylist(existingPlaylist, filters, ['c1']).subscribe({
        next: () => fail('should not emit next'),
        error: err => (error = err),
      })

      const req = httpMock.expectOne('/apis/protected/v8/playlist/update')
      const failResponse = { responseCode: 'ERROR' }
      req.flush(failResponse)

      expect(error).toEqual(failResponse)
    })
  })

  describe('savePlaylist', () => {
    const filters: PlaylistFilters = { orgId: 'org1', role: ['teacher'], language: 'en' }

    it('calls createPlaylist when no existing playlist is provided', () => {
      const createSpy = jest.spyOn(service, 'createPlaylist')
      const updateSpy = jest.spyOn(service, 'updatePlaylist')

      service.savePlaylist(filters, ['c1']).subscribe()

      const req = httpMock.expectOne('/apis/protected/v8/playlist/create')
      req.flush({ responseCode: 'OK' })

      expect(createSpy).toHaveBeenCalled()
      expect(updateSpy).not.toHaveBeenCalled()
    })

    it('calls updatePlaylist when an existing playlist is provided', () => {
      const existingPlaylist: Playlist = {
        id: 'p1',
        orgId: 'org1',
        role: ['teacher'],
        language: 'en',
        dataSource: { type: 'static', payload: [] },
      }
      const createSpy = jest.spyOn(service, 'createPlaylist')
      const updateSpy = jest.spyOn(service, 'updatePlaylist')

      service.savePlaylist(filters, ['c1'], existingPlaylist).subscribe()

      const req = httpMock.expectOne('/apis/protected/v8/playlist/update')
      req.flush({ responseCode: 'OK' })

      expect(updateSpy).toHaveBeenCalled()
      expect(createSpy).not.toHaveBeenCalled()
    })
  })
})
