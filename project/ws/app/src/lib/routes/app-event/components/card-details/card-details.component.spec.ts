import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { of } from 'rxjs'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { createSpyObj } from 'src/test-utils/create-spy-obj'
import { CardDetailsComponent } from './card-details.component'

describe('CardDetailsComponent', () => {
  let component: CardDetailsComponent
  let fixture: ComponentFixture<CardDetailsComponent>
  let router: ReturnType<typeof createSpyObj>

  beforeEach(async(() => {
    router = createSpyObj('Router', ['navigate'])
    TestBed.configureTestingModule({
      declarations: [CardDetailsComponent],
    imports: [HttpClientTestingModule],
    providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ pageData: { data: {} }, eventdata: { data: {} } }),
            paramMap: of({ get: () => null }),
            params: of({}),
            snapshot: { paramMap: { get: () => null }, queryParamMap: { get: () => null }, data: {}, params: {} },
            parent: { data: of({ eventdata: { data: {} } }), params: of({}) },
          },
        },
        { provide: Router, useValue: router },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(CardDetailsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('sortSpeaker', () => {
    it('should sort ascending by startRemainingTime', () => {
      expect(component.sortSpeaker({ startRemainingTime: 1 } as any, { startRemainingTime: 2 } as any)).toBe(-1)
      expect(component.sortSpeaker({ startRemainingTime: 2 } as any, { startRemainingTime: 1 } as any)).toBe(1)
    })

    it('should return 0 for equal or missing times', () => {
      expect(component.sortSpeaker({ startRemainingTime: 1 } as any, { startRemainingTime: 1 } as any)).toBe(0)
      expect(component.sortSpeaker({} as any, {} as any)).toBe(0)
    })
  })

  it('convertMinutes should compute hours/mins including whole days', () => {
    // 25 hours 30 minutes, expressed in the ms-based unit the method expects
    const ms = (25 * 60 + 30) * 60 * 1000
    expect(component.convertMinutes(ms)).toEqual({ mins: 30, hours: 25 })
  })

  describe('ngAfterViewChecked', () => {
    it('should sort and rebuild sortedSpeaker when speakerDetails has entries', () => {
      component.speakerDetails = [{ startRemainingTime: 2 } as any, { startRemainingTime: 1 } as any]
      component.ngAfterViewChecked()
      expect(component.speakerDetails[0].startRemainingTime).toBe(1)
    })

    it('should do nothing to sortedSpeaker when speakerDetails is empty', () => {
      component.speakerDetails = []
      component.sortedSpeaker = [{ sessionID: 'x' } as any]
      component.ngAfterViewChecked()
      expect(component.sortedSpeaker).toEqual([{ sessionID: 'x' }])
    })
  })

  describe('sortedSpeakerFunction', () => {
    it('should exclude an in-progress speaker (started, not ended) entirely', () => {
      component.speakerDetails = [{ startRemainingTime: -1, endRemaningTime: 5 } as any]
      component.sortedSpeakerFunction()
      expect(component.sortedSpeaker).toEqual([])
    })

    it('should push a not-yet-started speaker into sortedSpeaker', () => {
      component.speakerDetails = [{ startRemainingTime: 5, endRemaningTime: 10 } as any]
      component.sortedSpeakerFunction()
      expect(component.sortedSpeaker).toEqual([{ startRemainingTime: 5, endRemaningTime: 10 }])
    })

    it('should route an ended speaker into the tail via sessionEnded', () => {
      const ended = { startRemainingTime: -10, endRemaningTime: -5 }
      const upcoming = { startRemainingTime: 5, endRemaningTime: 10 }
      component.speakerDetails = [ended as any, upcoming as any]
      component.sortedSpeakerFunction()
      expect(component.sortedSpeaker).toEqual([upcoming, ended])
    })

    it('should set navigationExtras with the final sortedSpeaker list', () => {
      component.speakerDetails = []
      component.sortedSpeakerFunction()
      expect(component.navigationExtras).toEqual({ state: { speakerDetails: [] } })
    })
  })

  describe('onClickSessionCard', () => {
    it('should navigate to session-details for a valid index', () => {
      component.sortedSpeaker = [{ sessionID: 's1' } as any]
      component.onClickSessionCard(0)
      expect(router.navigate).toHaveBeenCalledWith(
        ['../session-details', 1],
        expect.objectContaining({ state: { sessionID: 's1' } }),
      )
    })

    it('should do nothing for an out-of-range index', () => {
      component.sortedSpeaker = []
      component.onClickSessionCard(0)
      expect(router.navigate).not.toHaveBeenCalled()
    })
  })
})
