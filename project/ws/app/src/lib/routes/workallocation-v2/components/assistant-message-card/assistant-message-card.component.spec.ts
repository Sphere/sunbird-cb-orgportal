import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { WatStoreService } from '../../services/wat.store.service'

import { AssistantMessageCardComponent } from './assistant-message-card.component'

describe('AssistantMessageCardComponent', () => {
  let component: AssistantMessageCardComponent
  let fixture: ComponentFixture<AssistantMessageCardComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AssistantMessageCardComponent],
      providers: [WatStoreService],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AssistantMessageCardComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})

describe('AssistantMessageCardComponent (unit, mocked store)', () => {
  let component: AssistantMessageCardComponent
  let activitiesSubject: BehaviorSubject<any>
  let competencySubject: BehaviorSubject<any>
  let compGroupOSubject: BehaviorSubject<any>
  let officerSubject: BehaviorSubject<any>
  let mockWatStore: any

  beforeEach(() => {
    activitiesSubject = new BehaviorSubject<any>([])
    competencySubject = new BehaviorSubject<any>([])
    compGroupOSubject = new BehaviorSubject<any>(null)
    officerSubject = new BehaviorSubject<any>(null)

    mockWatStore = {
      getactivitiesGroup: activitiesSubject.asObservable(),
      getcompetencyGroup: competencySubject.asObservable(),
      getUpdateCompGroupO: compGroupOSubject.asObservable(),
      getOfficerGroup: officerSubject.asObservable(),
      setErrorCount: jest.fn(),
      setCurrentProgress: jest.fn(),
    }

    component = new AssistantMessageCardComponent(mockWatStore)
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit / fetchFormsData', () => {
    it('subscribes to all store observables', () => {
      component.ngOnInit()
      expect(component['activitySubscription']).toBeTruthy()
      expect(component['groupSubscription']).toBeTruthy()
      expect(component['compDetailsSubscription']).toBeTruthy()
      expect(component['officerFormSubscription']).toBeTruthy()
    })

    it('sets dataStructure.activityGroups and calls validationsCombined when activities emitted', () => {
      component.ngOnInit()
      const spy = jest.spyOn(component, 'validationsCombined')
      const activities = [{ activities: [] }]
      activitiesSubject.next(activities)
      expect(component.dataStructure.activityGroups).toBe(activities)
      expect(spy).toHaveBeenCalled()
    })

    it('does not set activityGroups when emitted activities array is empty', () => {
      component.ngOnInit()
      activitiesSubject.next([])
      expect(component.dataStructure.activityGroups).toBeUndefined()
    })

    it('sets dataStructure.compGroups when competency emitted', () => {
      component.ngOnInit()
      const comp = [{ competincies: [] }]
      competencySubject.next(comp)
      expect(component.dataStructure.compGroups).toBe(comp)
    })

    it('sets dataStructure.compDetails when comp group O emitted with length', () => {
      component.ngOnInit()
      const details = [{ compLevel: '1' }]
      compGroupOSubject.next(details)
      expect(component.dataStructure.compDetails).toBe(details)
    })

    it('ignores compDetails emission when null/empty', () => {
      component.ngOnInit()
      compGroupOSubject.next([])
      expect(component.dataStructure.compDetails).toBeUndefined()
    })

    it('sets dataStructure.officerFormData whenever officer group emits (even falsy)', () => {
      component.ngOnInit()
      const officer = { officerName: 'John' }
      officerSubject.next(officer)
      expect(component.dataStructure.officerFormData).toBe(officer)
    })
  })

  describe('ngOnDestroy', () => {
    it('unsubscribes all subscriptions', () => {
      component.ngOnInit()
      const unsubs = [
        jest.spyOn(component['activitySubscription'], 'unsubscribe'),
        jest.spyOn(component['groupSubscription'], 'unsubscribe'),
        jest.spyOn(component['officerFormSubscription'], 'unsubscribe'),
        jest.spyOn(component['compDetailsSubscription'], 'unsubscribe'),
      ]
      component.ngOnDestroy()
      unsubs.forEach(spy => expect(spy).toHaveBeenCalled())
    })
  })

  describe('progressColor / currentProgress', () => {
    it('returns red for low progress', () => {
      jest.spyOn(component, 'calculatePercentage').mockReturnValue(10)
      expect(component.progressColor()).toBe('#D13924')
    })

    it('returns orange for mid progress', () => {
      jest.spyOn(component, 'calculatePercentage').mockReturnValue(50)
      expect(component.progressColor()).toBe('#E99E38')
    })

    it('returns green for high progress', () => {
      jest.spyOn(component, 'calculatePercentage').mockReturnValue(90)
      expect(component.progressColor()).toBe('#1D8923')
    })

    it('returns empty string when progress out of range', () => {
      jest.spyOn(component, 'calculatePercentage').mockReturnValue(150)
      expect(component.progressColor()).toBe('')
    })

    it('currentProgress getter delegates to calculatePercentage', () => {
      jest.spyOn(component, 'calculatePercentage').mockReturnValue(42)
      expect(component.currentProgress).toBe(42)
    })
  })

  describe('validationsCombined', () => {
    it('groups messages by type and sets error count via store', () => {
      component.dataStructure = {
        officerFormData: { officerName: '', position: 'p', positionDescription: 'd' },
      }
      component.validationsCombined()
      expect(component.validations.error).toBeDefined()
      expect(mockWatStore.setErrorCount).toHaveBeenCalledWith(1)
    })

    it('sets zero error count when no validation issues', () => {
      component.dataStructure = {}
      component.validationsCombined()
      expect(mockWatStore.setErrorCount).toHaveBeenCalledWith(0)
    })
  })

  describe('individualValidations', () => {
    it('returns empty array when dataStructure is empty', () => {
      component.dataStructure = {}
      expect(component.individualValidations()).toEqual([])
    })

    it('aggregates validations from all four sub-validators when data present', () => {
      component.dataStructure = {
        officerFormData: { officerName: '', position: 'p', positionDescription: 'd' },
        activityGroups: [
          { activities: [{ activityDescription: 'a', assignedTo: 'b' }] },
          { groupName: 'Role', groupDescription: 'desc', activities: [{ activityDescription: 'a', assignedTo: 'b' }] },
        ],
        compGroups: [
          { competincies: [{ compDescription: 'a', compName: 'b' }] },
          { competincies: [{ compDescription: 'a', compName: 'b' }] },
        ],
        compDetails: [{ compLevel: '1', compType: '2', compArea: '3' }],
      }
      const result = component.individualValidations()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('calculateOfficerErrors', () => {
    it('flags missing officer name when others filled', () => {
      const res = component.calculateOfficerErrors({ officerName: '', position: 'p', positionDescription: 'd' })
      expect(res.some(r => r.label === 'Officer name is empty')).toBe(true)
    })

    it('flags missing position when others filled', () => {
      const res = component.calculateOfficerErrors({ officerName: 'n', position: '', positionDescription: 'd' })
      expect(res.some(r => r.label === 'Postion missing')).toBe(true)
    })

    it('flags missing position description', () => {
      const res = component.calculateOfficerErrors({ officerName: 'n', position: 'p', positionDescription: '' })
      expect(res.some(r => r.label === 'Position description missing')).toBe(true)
    })

    it('returns empty array for fully filled data', () => {
      const res = component.calculateOfficerErrors({ officerName: 'n', position: 'p', positionDescription: 'd' })
      expect(res).toEqual([])
    })

    it('returns empty array for falsy data', () => {
      expect(component.calculateOfficerErrors(null)).toEqual([])
    })
  })

  describe('calculateActivityError', () => {
    it('flags unmapped activities and missing details in roles', () => {
      const data = [
        { activities: [{ activityDescription: '', assignedTo: '' }] },
        {
          groupName: '',
          groupDescription: '',
          activities: [],
        },
        {
          groupName: 'Untitled role',
          groupDescription: 'd',
          activities: [{ activityDescription: '', assignedTo: '' }],
        },
      ]
      const res = component.calculateActivityError(data)
      expect(res.some(r => r.label === 'Unmapped activities')).toBe(true)
      expect(res.some(r => r.label === 'Submit to is missing')).toBe(true)
      expect(res.some(r => r.label === 'Activity description missing')).toBe(true)
      expect(res.some(r => r.label === 'No activities mapped')).toBe(true)
      expect(res.some(r => r.label === 'Role label missing')).toBe(true)
      expect(res.some(r => r.label === 'Role description missing')).toBe(true)
    })

    it('returns empty array when all data is complete (no unmapped activities)', () => {
      const data = [
        { activities: [] },
        {
          groupName: 'Role A',
          groupDescription: 'desc',
          activities: [{ activityDescription: 'x', assignedTo: 'y' }],
        },
      ]
      const res = component.calculateActivityError(data)
      expect(res).toEqual([])
    })
  })

  describe('calculateCompError', () => {
    it('flags unmapped competencies and missing details', () => {
      const data = [
        { competincies: [{ compDescription: '', compName: '' }] },
        { competincies: [] },
      ]
      const res = component.calculateCompError(data)
      expect(res.some(r => r.label === 'Unmapped competencies')).toBe(true)
      expect(res.some(r => r.label === 'No competencies mapped')).toBe(true)
      expect(res.some(r => r.label === 'Competency label missing')).toBe(true)
      expect(res.some(r => r.label === 'Competency description missing')).toBe(true)
    })

    it('returns empty array for complete data (no unmapped competencies)', () => {
      const data = [
        { competincies: [] },
        { competincies: [{ compDescription: 'd', compName: 'n' }] },
      ]
      const res = component.calculateCompError(data)
      expect(res).toEqual([])
    })
  })

  describe('calculateCompDetailsError', () => {
    it('flags missing level/area/type', () => {
      const res = component.calculateCompDetailsError([{ compLevel: '', compType: '', compArea: '' }])
      expect(res.some(r => r.label === 'Competency level missing')).toBe(true)
      expect(res.some(r => r.label === 'Competency area missing')).toBe(true)
      expect(res.some(r => r.label === 'Competency type missing')).toBe(true)
    })

    it('returns empty array when data is empty', () => {
      expect(component.calculateCompDetailsError([])).toEqual([])
    })

    it('returns empty array when data is complete', () => {
      const res = component.calculateCompDetailsError([{ compLevel: 'l', compType: 't', compArea: 'a' }])
      expect(res).toEqual([])
    })
  })

  describe('calculatePercentage', () => {
    it('returns 0 when dataStructure is empty', () => {
      component.dataStructure = {}
      expect(component.calculatePercentage()).toBe(0)
    })

    it('computes combined weighted progress and calls setCurrentProgress', () => {
      component.dataStructure = {
        officerFormData: { officerName: 'n', position: 'p', positionDescription: 'd' },
        activityGroups: [
          { activities: [{ activityDescription: 'a', assignedTo: 'b' }] },
          {
            groupName: 'Role',
            groupDescription: 'desc',
            activities: [{ activityDescription: 'a', assignedTo: 'b' }],
          },
        ],
        compGroups: [
          { competincies: [{ compDescription: 'a', compName: 'b' }] },
          { competincies: [{ compDescription: 'a', compName: 'b' }] },
        ],
        compDetails: [{ compLevel: '1', compType: '2', compArea: '3' }],
      }
      const progress = component.calculatePercentage()
      expect(progress).toBeGreaterThan(0)
      expect(mockWatStore.setCurrentProgress).toHaveBeenCalledWith(progress)
    })

    it('returns 0 when isNaN guards neutralize NaN progress values', () => {
      component.dataStructure = { officerFormData: {} }
      jest.spyOn(component, 'calculateOfficerProgress').mockReturnValue(NaN)
      expect(component.calculatePercentage()).toBe(0)
    })
  })

  describe('calculateOfficerProgress', () => {
    it('sums progress for each filled field', () => {
      const p = component.calculateOfficerProgress({ officerName: 'n', position: 'p', positionDescription: 'd' })
      expect(p).toBe(100)
    })

    it('returns 0 for empty data', () => {
      expect(component.calculateOfficerProgress({})).toBe(0)
    })

    it('returns 0 for null data', () => {
      expect(component.calculateOfficerProgress(null)).toBe(0)
    })
  })

  describe('calculateActivityProgress', () => {
    it('computes progress across roles and activities', () => {
      const data = [
        { activities: [] },
        {
          groupName: 'Role A',
          groupDescription: 'desc',
          activities: [{ activityDescription: 'a', assignedTo: 'b' }],
        },
      ]
      const p = component.calculateActivityProgress(data)
      expect(p).toBeGreaterThan(0)
    })

    it('caps progress at 100', () => {
      const data = [
        { activities: [] },
        {
          groupName: 'Role A',
          groupDescription: 'desc',
          activities: [{ activityDescription: 'a', assignedTo: 'b' }],
        },
      ]
      const p = component.calculateActivityProgress(data)
      expect(p).toBeLessThanOrEqual(100)
    })

    it('returns 0 when only unmapped section present', () => {
      const data = [{ activities: [] }]
      expect(component.calculateActivityProgress(data)).toBe(0)
    })
  })

  describe('calculateCompProgress', () => {
    it('computes progress across competency roles', () => {
      const data = [
        { competincies: [] },
        { competincies: [{ compDescription: 'd', compName: 'n' }] },
      ]
      const p = component.calculateCompProgress(data)
      expect(p).toBeGreaterThan(0)
    })

    it('returns 0 when only unmapped section present', () => {
      const data = [{ competincies: [] }]
      expect(component.calculateCompProgress(data)).toBe(0)
    })
  })

  describe('calculateCompDetailsProgress', () => {
    it('computes progress proportional to filled fields', () => {
      const p = component.calculateCompDetailsProgress([{ compLevel: 'l', compType: 't', compArea: 'a' }])
      expect(p).toBe(100)
    })

    it('returns 0 for empty data', () => {
      expect(component.calculateCompDetailsProgress([])).toBe(0)
    })

    it('returns 0 for undefined data', () => {
      expect(component.calculateCompDetailsProgress(undefined)).toBe(0)
    })
  })
})
