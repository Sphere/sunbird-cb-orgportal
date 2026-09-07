import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { Subject, of, throwError } from 'rxjs'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { MatSnackBar } from '@angular/material/snack-bar'
import { createSpyObj } from 'src/test-utils/create-spy-obj'
import { BtnPlaylistService, WidgetContentService, NsPlaylist } from '@sunbird-cb/collection'
import { HorizontalScrollerModule } from '@sunbird-cb/utils'
import { InterestComponent } from './interest.component'

describe('InterestComponent', () => {
  let component: InterestComponent
  let fixture: ComponentFixture<InterestComponent>
  let playlistSvc: { [key: string]: jest.Mock }
  let contentSvc: { [key: string]: jest.Mock }
  let snackbar: { [key: string]: jest.Mock }
  let router: { [key: string]: jest.Mock }
  let playlists$: Subject<any>

  const build = (pageData: any = { topic: ['c1', 'c2'] }) => {
    playlists$ = new Subject<any>()
    playlistSvc = createSpyObj('BtnPlaylistService', [
      'getAllPlaylists', 'deletePlaylistContent', 'addPlaylistContent', 'upsertPlaylist',
    ] as any)
    playlistSvc['getAllPlaylists'].mockReturnValue(playlists$.asObservable())
    contentSvc = createSpyObj('WidgetContentService', ['fetchMultipleContent'] as any)
    contentSvc['fetchMultipleContent'].mockReturnValue(of([]))
    snackbar = createSpyObj('MatSnackBar', ['open'] as any)
    router = createSpyObj('Router', ['navigate'] as any)

    TestBed.configureTestingModule({
      declarations: [InterestComponent],
      imports: [HttpClientTestingModule, HorizontalScrollerModule],
      providers: [
        { provide: MatSnackBar, useValue: snackbar },
        { provide: BtnPlaylistService, useValue: playlistSvc },
        { provide: WidgetContentService, useValue: contentSvc },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ pageData: { data: pageData } }),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    fixture = TestBed.createComponent(InterestComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    component.createPlaylistSuccessMessage = { nativeElement: { value: 'Success!' } } as any
    component.createPlaylistErrorMessage = { nativeElement: { value: 'Error!' } } as any
  }

  afterEach(() => TestBed.resetTestingModule())

  it('should create and load interestsData/select the first interest', () => {
    build()
    expect(component).toBeTruthy()
    expect(component.interestsData).toEqual(['topic'])
    expect(component.selectedInterest).toBe('topic')
  })

  it('should capture the Learn Later playlist and its already-added content', () => {
    build()
    playlists$.next([
      { name: 'Other', contents: [{ identifier: 'x' }] },
      { name: 'Learn Later', contents: [{ identifier: 'c1' }] },
    ])
    expect(component.playlistForInterest?.name).toBe('Learn Later')
    expect(component.addedInterest.has('c1')).toBe(true)
    expect(component.alreadyAddedInterest.has('c1')).toBe(true)
  })

  describe('selectInterest', () => {
    it('should ignore a re-entrant call while already fetching', () => {
      build()
      contentSvc.fetchMultipleContent.mockClear()
      component.fetchStatus = 'fetching'
      component.selectInterest(0)
      expect(contentSvc.fetchMultipleContent).not.toHaveBeenCalled()
    })

    it('should populate interestContent on success', () => {
      build()
      contentSvc.fetchMultipleContent.mockReturnValue(of([{ identifier: 'c1' }]))
      component.selectInterest(0)
      expect(component.interestContent).toEqual([{ identifier: 'c1' }])
      expect(component.fetchStatus).toBe('done')
    })

    it('should set fetchStatus to error on failure', () => {
      build()
      contentSvc.fetchMultipleContent.mockReturnValue(throwError(new Error('boom')))
      component.selectInterest(0)
      expect(component.fetchStatus).toBe('error')
    })
  })

  describe('interestAdd / isInterestAdded', () => {
    it('should add and remove identifiers from addedInterest', () => {
      build()
      component.interestAdd('c9', true)
      expect(component.addedInterest.has('c9')).toBe(true)
      component.interestAdd('c9', false)
      expect(component.addedInterest.has('c9')).toBe(false)
    })

    it('should report true when any content id for the interest is added', () => {
      build()
      component.addedInterest.add('c1')
      expect(component.isInterestAdded('topic')).toBe(true)
    })

    it('should report false when no content id for the interest is added', () => {
      build()
      component.addedInterest.clear()
      expect(component.isInterestAdded('topic')).toBe(false)
    })
  })

  describe('addInterest', () => {
    it('should navigate straight through when nothing was ever added', () => {
      build()
      component.addedInterest.clear()
      component.alreadyAddedInterest.clear()
      component.addInterest()
      expect(router.navigate).toHaveBeenCalledWith(['/app/setup/home/done'])
    })

    it('should upsert a new playlist and navigate on success when none exists yet', () => {
      build()
      component.addedInterest.add('c1')
      component.playlistForInterest = null
      playlistSvc.upsertPlaylist.mockReturnValue(of({}))
      component.addInterest()
      expect(playlistSvc.upsertPlaylist).toHaveBeenCalled()
      expect(snackbar.open).toHaveBeenCalledWith('Success!')
      expect(router.navigate).toHaveBeenCalledWith(['/app/setup/home/done'])
    })

    it('should show the error message and still navigate when the new-playlist upsert fails', () => {
      build()
      component.addedInterest.add('c1')
      component.playlistForInterest = null
      playlistSvc.upsertPlaylist.mockReturnValue(throwError(new Error('boom')))
      component.addInterest()
      expect(snackbar.open).toHaveBeenCalledWith('Error!')
    })

    it('should add/remove content on an existing playlist and navigate on success', () => {
      build()
      component.playlistForInterest = { name: 'Learn Later', contents: [] } as unknown as NsPlaylist.IPlaylist
      component.alreadyAddedInterest = new Set(['c2'])
      component.addedInterest = new Set(['c1'])
      playlistSvc.deletePlaylistContent.mockReturnValue(of({}))
      playlistSvc.addPlaylistContent.mockReturnValue(of({}))
      component.addInterest()
      expect(playlistSvc.deletePlaylistContent).toHaveBeenCalled()
      expect(playlistSvc.addPlaylistContent).toHaveBeenCalled()
      expect(snackbar.open).toHaveBeenCalledWith('Success!')
    })

    it('should skip the delete call when nothing needs removing from the existing playlist', () => {
      build()
      component.playlistForInterest = { name: 'Learn Later', contents: [] } as unknown as NsPlaylist.IPlaylist
      component.alreadyAddedInterest = new Set(['c1'])
      component.addedInterest = new Set(['c1'])
      playlistSvc.addPlaylistContent.mockReturnValue(of({}))
      component.addInterest()
      expect(playlistSvc.deletePlaylistContent).not.toHaveBeenCalled()
    })

    it('should show the error message when updating the existing playlist fails', () => {
      build()
      component.playlistForInterest = { name: 'Learn Later', contents: [] } as unknown as NsPlaylist.IPlaylist
      component.alreadyAddedInterest = new Set(['c2'])
      component.addedInterest = new Set(['c1'])
      playlistSvc.deletePlaylistContent.mockReturnValue(of({}))
      playlistSvc.addPlaylistContent.mockReturnValue(throwError(new Error('boom')))
      component.addInterest()
      expect(snackbar.open).toHaveBeenCalledWith('Error!')
    })

    it('should still process when addedInterest is empty but alreadyAddedInterest had entries', () => {
      build()
      component.addedInterest.clear()
      component.alreadyAddedInterest = new Set(['c1'])
      component.playlistForInterest = { name: 'Learn Later', contents: [] } as unknown as NsPlaylist.IPlaylist
      playlistSvc.deletePlaylistContent.mockReturnValue(of({}))
      playlistSvc.addPlaylistContent.mockReturnValue(of({}))
      component.addInterest()
      expect(playlistSvc.deletePlaylistContent).toHaveBeenCalled()
    })
  })

  it('ngOnDestroy should complete the destroy subject', () => {
    build()
    const completeSpy = jest.spyOn((component as any).destroy$, 'complete')
    component.ngOnDestroy()
    expect(completeSpy).toHaveBeenCalled()
  })
})
