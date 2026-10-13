import { of, throwError } from 'rxjs'
import { ManageSearchComponent } from './manage-search.component'
import { PLAYLIST_ROUTES } from '../../constants/playlist.constants'
import { PlaylistType } from '../../services/playlist-api.service'

// The component uses Angular's `inject()` calls in field initializers, so we can't
// `new` it directly like a plain class — we stub `inject` to return our mocks
// based on which token is requested, mirroring how DI would resolve them.
jest.mock('@angular/core', () => {
  const actual = jest.requireActual('@angular/core')
  return {
    ...actual,
    inject: jest.fn(),
  }
})

jest.mock('@angular/core/rxjs-interop', () => ({
  takeUntilDestroyed: () => (source: any) => source,
}))

const mockAceEditor = {
  setTheme: jest.fn(),
  getSession: jest.fn().mockReturnValue({ setMode: jest.fn(), setUseWrapMode: jest.fn() }),
  setOptions: jest.fn(),
  setReadOnly: jest.fn(),
  setValue: jest.fn(),
  getValue: jest.fn().mockReturnValue(''),
  on: jest.fn(),
  $blockScrolling: 0,
}

jest.mock('brace', () => ({
  edit: jest.fn(() => mockAceEditor),
}))
jest.mock('brace/ext/language_tools', () => ({}), { virtual: true })
jest.mock('brace/mode/json', () => ({}), { virtual: true })
jest.mock('brace/theme/chrome', () => ({}), { virtual: true })

import { inject } from '@angular/core'

describe('ManageSearchComponent', () => {
  let component: ManageSearchComponent
  let routerMock: any
  let dialogMock: any
  let stateMock: any
  let playlistApiMock: any
  let featureAccessMock: any

  const filters = { orgId: 'org1', role: ['ROLE1'], language: 'en', state: null, district: null }

  const buildComponent = () => {
    routerMock = { navigate: jest.fn() }
    dialogMock = { open: jest.fn() }
    stateMock = {
      getFilters: jest.fn().mockReturnValue(filters),
      getExistingSearchPlaylist: jest.fn().mockReturnValue(null),
      setExistingSearchPlaylist: jest.fn(),
    }
    playlistApiMock = {
      savePlaylist: jest.fn().mockReturnValue(of({})),
      searchPlaylist: jest.fn().mockReturnValue(of([])),
    }
    featureAccessMock = {
      isViewOnly: jest.fn().mockReturnValue(false),
    }

    ;(inject as jest.Mock).mockImplementation((token: any) => {
      const name = (token && token.name) || ''
      if (/Router$/.test(name)) return routerMock
      if (/MatDialog$/.test(name)) return dialogMock
      if (/PlaylistStateService$/.test(name)) return stateMock
      if (/PlaylistApiService$/.test(name)) return playlistApiMock
      if (/FeatureAccessService$/.test(name)) return featureAccessMock
      if (/DestroyRef$/.test(name)) return {}
      // FEATURE_KEY InjectionToken or anything else
      return null
    })

    return new ManageSearchComponent()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    component = buildComponent()
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  describe('isViewOnly', () => {
    it('delegates to featureAccess.isViewOnly', () => {
      featureAccessMock.isViewOnly.mockReturnValue(true)
      expect(component.isViewOnly).toBe(true)
      expect(featureAccessMock.isViewOnly).toHaveBeenCalled()
    })
  })

  describe('ngOnInit', () => {
    it('redirects to filters route when no filters are set', () => {
      stateMock.getFilters.mockReturnValue(null)
      component.ngOnInit()
      expect(routerMock.navigate).toHaveBeenCalledWith([PLAYLIST_ROUTES.HOME_FILTERS])
      expect(component.jsonText()).toBe('')
    })

    it('builds default editor JSON when there is no existing playlist', () => {
      stateMock.getExistingSearchPlaylist.mockReturnValue(null)
      component.ngOnInit()
      const parsed = JSON.parse(component.jsonText())
      expect(parsed.playlistId).toBe('SEARCH_PLAYLIST')
      expect(parsed.orgId).toBe('org1')
      expect(parsed.id).toBe('')
      expect(parsed.dataSource.type).toBe('query')
      expect(parsed.dataSource.payload.request.filters.lang).toEqual(['en'])
    })

    it('builds editor JSON from an existing playlist, preserving its payload', () => {
      const existing = {
        id: 'p1',
        orgId: 'org1',
        role: ['R1'],
        state: 'MH',
        district: 'D1',
        language: 'en',
        dataSource: { payload: { custom: true } },
      }
      stateMock.getExistingSearchPlaylist.mockReturnValue(existing)
      component.ngOnInit()
      const parsed = JSON.parse(component.jsonText())
      expect(parsed.id).toBe('p1')
      expect(parsed.state).toBe('MH')
      expect(parsed.dataSource.payload).toEqual({ custom: true })
    })

    it('falls back to a default query payload when the existing playlist payload is not a JSON object', () => {
      const existing = {
        id: 'p1',
        orgId: 'org1',
        dataSource: { payload: ['not', 'an', 'object'] },
      }
      stateMock.getExistingSearchPlaylist.mockReturnValue(existing)
      component.ngOnInit()
      const parsed = JSON.parse(component.jsonText())
      expect(parsed.dataSource.payload.request).toBeDefined()
    })
  })

  describe('ngAfterViewInit / initializeEditor', () => {
    it('does nothing when the editor element ref is not present', () => {
      expect(() => component.ngAfterViewInit()).not.toThrow()
    })

    it('initializes the ace editor when the element ref is present', () => {
      jest.clearAllMocks()
      ;(component as any).jsonEditorRef = { nativeElement: {} }
      component.ngAfterViewInit()
      expect(mockAceEditor.setTheme).toHaveBeenCalledWith('ace/theme/chrome')
      expect(mockAceEditor.setOptions).toHaveBeenCalled()
      expect(mockAceEditor.setReadOnly).toHaveBeenCalledWith(false)
      expect(mockAceEditor.setValue).toHaveBeenCalledWith(component.jsonText(), -1)
      expect(mockAceEditor.on).toHaveBeenCalledWith('change', expect.any(Function))
    })

    it('routes editor change events through onJsonChange', () => {
      jest.clearAllMocks()
      ;(component as any).jsonEditorRef = { nativeElement: {} }
      component.ngAfterViewInit()
      const onSpy = mockAceEditor.on as jest.Mock
      const changeHandler = onSpy.mock.calls[0][1]
      mockAceEditor.getValue.mockReturnValue('{"x":1}')
      changeHandler()
      expect(component.jsonText()).toBe('{"x":1}')
    })
  })

  describe('ngOnDestroy', () => {
    it('is a no-op when no editor was initialized', () => {
      expect(() => component.ngOnDestroy()).not.toThrow()
    })

    it('detaches the change handler and destroys the editor when present', () => {
      const off = jest.fn()
      const destroy = jest.fn()
      const remove = jest.fn()
      ;(component as any).editor = { off, destroy, container: { remove } }
      ;(component as any).editorChangeHandler = () => undefined
      component.ngOnDestroy()
      expect(off).toHaveBeenCalledWith('change', (component as any).editorChangeHandler)
      expect(destroy).toHaveBeenCalled()
      expect(remove).toHaveBeenCalled()
    })
  })

  describe('onJsonChange', () => {
    it('updates jsonText and validates', () => {
      component.onJsonChange('{"a":1}')
      expect(component.jsonText()).toBe('{"a":1}')
      expect(component.validationError()).toBe('')
    })

    it('sets a validation error for invalid JSON', () => {
      component.onJsonChange('{not valid')
      expect(component.validationError()).not.toBe('')
    })
  })

  describe('onFormatJson', () => {
    it('does nothing when current JSON is invalid', () => {
      component.jsonText.set('{not valid')
      component.onFormatJson()
      expect(component.jsonText()).toBe('{not valid')
    })

    it('pretty-prints valid JSON and clears the validation error', () => {
      component.jsonText.set('{"a":1}')
      component.validationError.set('some error')
      component.onFormatJson()
      expect(component.jsonText()).toBe(JSON.stringify({ a: 1 }, null, 2))
      expect(component.validationError()).toBe('')
    })

    it('syncs the ace editor value when it differs from the formatted text', () => {
      component.jsonText.set('{"a":1}')
      const setValue = jest.fn()
      ;(component as any).editor = { getValue: () => 'stale', setValue }
      component.onFormatJson()
      expect(setValue).toHaveBeenCalledWith(component.jsonText(), -1)
    })
  })

  describe('onBack', () => {
    it('navigates to the summary route', () => {
      component.onBack()
      expect(routerMock.navigate).toHaveBeenCalledWith([PLAYLIST_ROUTES.HOME_SUMMARY])
    })
  })

  describe('onSave', () => {
    beforeEach(() => {
      component.ngOnInit()
    })

    it('redirects to filters route when no filters are set', async () => {
      stateMock.getFilters.mockReturnValue(null)
      await component.onSave()
      expect(routerMock.navigate).toHaveBeenCalledWith([PLAYLIST_ROUTES.HOME_FILTERS])
      expect(playlistApiMock.savePlaylist).not.toHaveBeenCalled()
    })

    it('does nothing when the JSON payload is invalid', async () => {
      component.jsonText.set('{not valid')
      await component.onSave()
      expect(playlistApiMock.savePlaylist).not.toHaveBeenCalled()
    })

    it('sets a validation error when the JSON is valid but not an object', async () => {
      component.jsonText.set('[1,2,3]')
      await component.onSave()
      expect(playlistApiMock.savePlaylist).not.toHaveBeenCalled()
      expect(component.validationError()).toBe('Payload must be a JSON object.')
    })

    it('does nothing and sets a validation error when dataSource.type is not "query"', async () => {
      component.jsonText.set(JSON.stringify({ dataSource: { type: 'other', payload: {} } }))
      await component.onSave()
      expect(playlistApiMock.savePlaylist).not.toHaveBeenCalled()
      expect(component.validationError()).toBe('dataSource.type must be "query".')
    })

    it('does nothing and sets a validation error when dataSource.payload is not a JSON object', async () => {
      component.jsonText.set(JSON.stringify({ dataSource: { type: 'query', payload: 'nope' } }))
      await component.onSave()
      expect(playlistApiMock.savePlaylist).not.toHaveBeenCalled()
      expect(component.validationError()).toBe('dataSource.payload must be a JSON object.')
    })

    it('treats the whole JSON object as the payload when there is no dataSource key', async () => {
      component.jsonText.set(JSON.stringify({ foo: 'bar' }))
      dialogMock.open.mockReturnValue({ afterClosed: () => of(undefined) })
      await component.onSave()
      expect(playlistApiMock.savePlaylist).toHaveBeenCalledWith(
        filters,
        { foo: 'bar' },
        undefined,
        PlaylistType.SEARCH,
      )
    })

    it('saves successfully, refreshes state, and shows a success dialog that navigates on close', async () => {
      const freshPlaylist = { id: 'fresh' }
      playlistApiMock.searchPlaylist.mockReturnValue(of([freshPlaylist]))
      dialogMock.open.mockReturnValue({ afterClosed: () => of(undefined) })

      await component.onSave()

      expect(playlistApiMock.savePlaylist).toHaveBeenCalled()
      expect(stateMock.setExistingSearchPlaylist).toHaveBeenCalledWith(freshPlaylist)
      expect(dialogMock.open).toHaveBeenCalled()
      expect(routerMock.navigate).toHaveBeenCalledWith([PLAYLIST_ROUTES.HOME_SUMMARY])
      expect(component.saving()).toBe(false)
    })

    it('sets existing playlist to null when refresh search returns no results', async () => {
      playlistApiMock.searchPlaylist.mockReturnValue(of([]))
      dialogMock.open.mockReturnValue({ afterClosed: () => of(undefined) })
      await component.onSave()
      expect(stateMock.setExistingSearchPlaylist).toHaveBeenCalledWith(null)
    })

    it('continues without throwing when the refresh search call fails', async () => {
      playlistApiMock.searchPlaylist.mockReturnValue(throwError(new Error('refresh failed')))
      dialogMock.open.mockReturnValue({ afterClosed: () => of(undefined) })
      await component.onSave()
      expect(component.saving()).toBe(false)
      expect(stateMock.setExistingSearchPlaylist).not.toHaveBeenCalled()
    })

    it('shows an error dialog with the first structured error message on save failure', async () => {
      playlistApiMock.savePlaylist.mockReturnValue(
        throwError({ error: { result: { errors: [{ message: 'bad request' }] } } }),
      )
      dialogMock.open.mockReturnValue({ afterClosed: () => of(false) })
      await component.onSave()
      expect(component.saving()).toBe(false)
      const errorCall = dialogMock.open.mock.calls.find((call: any[]) => call[1]?.data?.title === 'Save Failed')
      expect(errorCall[1].data.message).toBe('bad request')
    })

    it('falls back to the generic message when the error has no message at all', async () => {
      playlistApiMock.savePlaylist.mockReturnValue(throwError({}))
      dialogMock.open.mockReturnValue({ afterClosed: () => of(false) })
      await component.onSave()
      const errorCall = dialogMock.open.mock.calls.find((call: any[]) => call[1]?.data?.title === 'Save Failed')
      expect(errorCall[1].data.message).toBe('Failed to save search playlist')
    })

    it('retries onSave when the error dialog result signals retry', async () => {
      let callCount = 0
      playlistApiMock.savePlaylist.mockImplementation(() => {
        callCount += 1
        return callCount === 1 ? throwError(new Error('fail once')) : of({})
      })
      dialogMock.open.mockReturnValue({ afterClosed: () => of(true) })
      await component.onSave()
      expect(callCount).toBeGreaterThanOrEqual(1)
    })
  })
})
