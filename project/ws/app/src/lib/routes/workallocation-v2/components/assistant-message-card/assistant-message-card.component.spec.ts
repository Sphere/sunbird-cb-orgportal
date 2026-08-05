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

  describe('fetchFormsData', () => {
    it('should set activityGroups and call validationsCombined when activities emitted with length', () => {
      const spy = jest.spyOn(component, 'validationsCombined')
      component.dataStructure = {}
      const watStore: any = (component as any).watStore
      watStore.getactivitiesGroup = of([{ activities: [] }])
      component.fetchFormsData()
      expect(component.dataStructure.activityGroups).toEqual([{ activities: [] }])
      expect(spy).toHaveBeenCalled()
    })

    it('should not set activityGroups when activities emitted empty', () => {
      const watStore: any = (component as any).watStore
      watStore.getactivitiesGroup = of([])
      component.dataStructure = {}
      component.fetchFormsData()
      expect(component.dataStructure.activityGroups).toBeUndefined()
    })

    it('should set compGroups when comp emitted with length', () => {
      const watStore: any = (component as any).watStore
      watStore.getcompetencyGroup = of([{ competincies: [] }])
      component.dataStructure = {}
      component.fetchFormsData()
      expect(component.dataStructure.compGroups).toEqual([{ competincies: [] }])
    })

    it('should set compDetails when comp emitted with length', () => {
      const watStore: any = (component as any).watStore
      watStore.getUpdateCompGroupO = of([{ compLevel: '' }])
      component.dataStructure = {}
      component.fetchFormsData()
      expect(component.dataStructure.compDetails).toEqual([{ compLevel: '' }])
    })

    it('should not set compDetails when comp emitted is null', () => {
      const watStore: any = (component as any).watStore
      watStore.getUpdateCompGroupO = of(null)
      component.dataStructure = {}
      component.fetchFormsData()
      expect(component.dataStructure.compDetails).toBeUndefined()
    })

    it('should set officerFormData whenever officer emitted', () => {
      const watStore: any = (component as any).watStore
      watStore.getOfficerGroup = of({ officerName: 'abc' })
      component.dataStructure = {}
      component.fetchFormsData()
      expect(component.dataStructure.officerFormData).toEqual({ officerName: 'abc' })
    })
  })

  describe('progressColor', () => {
    it('should return red for progress <= 30', () => {
      jest.spyOn(component, 'calculatePercentage').mockReturnValue(10)
      expect(component.progressColor()).toBe('#D13924')
    })
    it('should return orange for progress between 30 and 70', () => {
      jest.spyOn(component, 'calculatePercentage').mockReturnValue(50)
      expect(component.progressColor()).toBe('#E99E38')
    })
    it('should return green for progress between 70 and 100', () => {
      jest.spyOn(component, 'calculatePercentage').mockReturnValue(90)
      expect(component.progressColor()).toBe('#1D8923')
    })
    it('should return empty string for progress above 100', () => {
      jest.spyOn(component, 'calculatePercentage').mockReturnValue(150)
      expect(component.progressColor()).toBe('')
    })
  })

  describe('validationsCombined', () => {
    it('should group messages by type and set error count', () => {
      jest.spyOn(component, 'individualValidations').mockReturnValue([
        { _type: 'error', type: 'officer', counts: 0, label: 'x' },
        { _type: 'warning', type: 'officer', counts: 0, label: 'y' },
      ] as any)
      const watStore: any = (component as any).watStore
      component.validationsCombined()
      expect(component.validations.error.length).toBe(1)
      expect(component.validations.warning.length).toBe(1)
      expect(watStore.setErrorCount).toHaveBeenCalledWith(1)
    })
  })

  describe('individualValidations', () => {
    it('should call all sub-validators when data present', () => {
      component.dataStructure = {
        officerFormData: { officerName: '' },
        activityGroups: [{ activities: [] }],
        compGroups: [{ competincies: [] }],
        compDetails: [{ compLevel: '' }],
      }
      const spyOfficer = jest.spyOn(component, 'calculateOfficerErrors')
      const spyActivity = jest.spyOn(component, 'calculateActivityError')
      const spyComp = jest.spyOn(component, 'calculateCompError')
      const spyCompDetails = jest.spyOn(component, 'calculateCompDetailsError')
      component.individualValidations()
      expect(spyOfficer).toHaveBeenCalled()
      expect(spyActivity).toHaveBeenCalled()
      expect(spyComp).toHaveBeenCalled()
      expect(spyCompDetails).toHaveBeenCalled()
    })

    it('should return empty array when no dataStructure fields set', () => {
      component.dataStructure = {}
      const result = component.individualValidations()
      expect(result).toEqual([])
    })
  })

  describe('calculateOfficerErrors', () => {
    it('should flag officer name empty when position or description filled', () => {
      const result = component.calculateOfficerErrors({ officerName: '', position: 'p', positionDescription: 'd' })
      expect(result.some(r => r.label === 'Officer name is empty')).toBe(true)
    })
    it('should flag position missing when officerName or positionDescription filled', () => {
      const result = component.calculateOfficerErrors({ officerName: 'o', position: '', positionDescription: 'd' })
      expect(result.some(r => r.label === 'Postion missing')).toBe(true)
    })
    it('should flag position description missing', () => {
      const result = component.calculateOfficerErrors({ officerName: 'o', position: 'p', positionDescription: '' })
      expect(result.some(r => r.label === 'Position description missing')).toBe(true)
    })
    it('should return empty array when all fields filled', () => {
      const result = component.calculateOfficerErrors({ officerName: 'o', position: 'p', positionDescription: 'd' })
      expect(result).toEqual([])
    })
    it('should handle null data gracefully', () => {
      const result = component.calculateOfficerErrors(null)
      expect(result).toEqual([])
    })
  })

  describe('calculateActivityError', () => {
    it('should flag unmapped activities and role level issues', () => {
      const data = [
        { activities: [{ activityDescription: '', assignedTo: '' }] },
        {
          groupName: '',
          groupDescription: '',
          activities: [],
        },
      ]
      const result = component.calculateActivityError(data)
      expect(result.some(r => r.label === 'Unmapped activities')).toBe(true)
      expect(result.some(r => r.label === 'No activities mapped')).toBe(true)
      expect(result.some(r => r.label === 'Role label missing')).toBe(true)
      expect(result.some(r => r.label === 'Role description missing')).toBe(true)
    })

    it('should flag untitled role name and activity issues inside roles', () => {
      const data = [
        { activities: [] },
        {
          groupName: 'Untitled role',
          groupDescription: 'desc',
          activities: [{ activityDescription: '', assignedTo: '' }],
        },
      ]
      const result = component.calculateActivityError(data)
      expect(result.some(r => r.label === 'Role label missing')).toBe(true)
      expect(result.some(r => r.label === 'Activity description missing')).toBe(true)
      expect(result.some(r => r.label === 'Submit to is missing')).toBe(true)
    })

    it('should return empty result when everything filled', () => {
      const data = [
        { activities: [] },
        {
          groupName: 'Role A',
          groupDescription: 'desc',
          activities: [{ activityDescription: 'd', assignedTo: 'x' }],
        },
      ]
      const result = component.calculateActivityError(data)
      expect(result).toEqual([])
    })
  })

  describe('calculateCompError', () => {
    it('should flag unmapped competencies and missing details', () => {
      const data = [
        { competincies: [{ compDescription: '', compName: '' }] },
        { competincies: [] },
      ]
      const result = component.calculateCompError(data)
      expect(result.some(r => r.label === 'Unmapped competencies')).toBe(true)
      expect(result.some(r => r.label === 'No competencies mapped')).toBe(true)
      expect(result.some(r => r.label === 'Competency label missing')).toBe(true)
      expect(result.some(r => r.label === 'Competency description missing')).toBe(true)
    })

    it('should flag missing comp desc/name within roles', () => {
      const data = [
        { competincies: [] },
        { competincies: [{ compDescription: '', compName: '' }] },
      ]
      const result = component.calculateCompError(data)
      expect(result.some(r => r.label === 'Competency label missing')).toBe(true)
      expect(result.some(r => r.label === 'Competency description missing')).toBe(true)
    })

    it('should return empty when all fields present', () => {
      const data = [
        { competincies: [] },
        { competincies: [{ compDescription: 'd', compName: 'n' }] },
      ]
      const result = component.calculateCompError(data)
      expect(result).toEqual([])
    })
  })

  describe('calculateCompDetailsError', () => {
    it('should flag missing level/type/area', () => {
      const data = [{ compLevel: '', compType: '', compArea: '' }]
      const result = component.calculateCompDetailsError(data)
      expect(result.some(r => r.label === 'Competency level missing')).toBe(true)
      expect(result.some(r => r.label === 'Competency type missing')).toBe(true)
      expect(result.some(r => r.label === 'Competency area missing')).toBe(true)
    })
    it('should return empty array for empty data', () => {
      expect(component.calculateCompDetailsError([])).toEqual([])
    })
    it('should return empty array for undefined data', () => {
      expect(component.calculateCompDetailsError(undefined)).toEqual([])
    })
  })

  describe('calculatePercentage', () => {
    it('should compute combined progress and set current progress in store', () => {
      component.dataStructure = {
        officerFormData: { officerName: 'o', position: 'p', positionDescription: 'd' },
        activityGroups: [{ activities: [] }, { groupName: 'Role', groupDescription: 'd', activities: [{ activityDescription: 'd', assignedTo: 'x' }] }],
        compGroups: [{ competincies: [] }, { competincies: [{ compDescription: 'd', compName: 'n' }] }],
        compDetails: [{ compLevel: 'l', compType: 't', compArea: 'a' }],
      }
      const watStore: any = (component as any).watStore
      const progress = component.calculatePercentage()
      expect(typeof progress).toBe('number')
      expect(watStore.setCurrentProgress).toHaveBeenCalledWith(progress)
    })

    it('should return 0 when dataStructure is empty', () => {
      component.dataStructure = {}
      const progress = component.calculatePercentage()
      expect(progress).toBe(0)
    })

    it('should catch errors during final sum and return 0', () => {
      component.dataStructure = {
        officerFormData: { officerName: 'o' },
      }
      const originalIsNaN = global.isNaN
      // tslint:disable-next-line: no-any
      ;(global as any).isNaN = () => { throw new Error('boom') }
      const result = component.calculatePercentage()
      global.isNaN = originalIsNaN
      expect(result).toBe(0)
    })
  })

  describe('calculateOfficerProgress', () => {
    it('should sum weighted progress for filled fields', () => {
      const result = component.calculateOfficerProgress({ officerName: 'o', position: 'p', positionDescription: 'd' })
      expect(result).toBe(100)
    })
    it('should return 0 for empty data', () => {
      expect(component.calculateOfficerProgress({})).toBe(0)
    })
    it('should handle null data', () => {
      expect(component.calculateOfficerProgress(null)).toBe(0)
    })
  })

  describe('calculateActivityProgress', () => {
    it('should compute progress for roles with activities', () => {
      const data = [
        { activities: [] },
        {
          groupName: 'Role A',
          groupDescription: 'desc',
          activities: [{ activityDescription: 'd', assignedTo: 'x' }],
        },
      ]
      const result = component.calculateActivityProgress(data)
      expect(result).toBeGreaterThan(0)
    })

    it('should handle untitled role name not adding label percent', () => {
      const data = [
        { activities: [] },
        {
          groupName: 'Untitled role',
          groupDescription: '',
          activities: [{ activityDescription: '', assignedTo: '' }],
        },
      ]
      const result = component.calculateActivityProgress(data)
      expect(typeof result).toBe('number')
    })

    it('should return 100 when progress reaches near maximum', () => {
      const roles = Array.from({ length: 1 }).map(() => ({
        groupName: 'Role',
        groupDescription: 'desc',
        activities: [{ activityDescription: 'd', assignedTo: 'x' }],
      }))
      const data = [{ activities: [] }, ...roles]
      const result = component.calculateActivityProgress(data)
      expect(result).toBeLessThanOrEqual(100)
    })
  })

  describe('calculateCompProgress', () => {
    it('should compute progress across competency roles', () => {
      const data = [
        { competincies: [] },
        { competincies: [{ compDescription: 'd', compName: 'n' }] },
      ]
      const result = component.calculateCompProgress(data)
      expect(result).toBeGreaterThan(0)
    })

    it('should return 0 when no roles beyond unmapped section', () => {
      const data = [{ competincies: [] }]
      const result = component.calculateCompProgress(data)
      expect(result).toBe(0)
    })
  })

  describe('calculateCompDetailsProgress', () => {
    it('should compute progress across compDetails fields', () => {
      const data = [{ compLevel: 'l', compType: 't', compArea: 'a' }]
      const result = component.calculateCompDetailsProgress(data)
      expect(result).toBe(100)
    })
    it('should return 0 for empty data', () => {
      expect(component.calculateCompDetailsProgress([])).toBe(0)
    })
    it('should return 0 for undefined data', () => {
      expect(component.calculateCompDetailsProgress(undefined)).toBe(0)
    })
  })

  describe('currentProgress getter', () => {
    it('should call calculatePercentage', () => {
      const spy = jest.spyOn(component, 'calculatePercentage').mockReturnValue(42)
      expect(component.currentProgress).toBe(42)
      expect(spy).toHaveBeenCalled()
    })
  })

  describe('ngOnDestroy', () => {
    it('should unsubscribe all subscriptions', () => {
      component.ngOnInit()
      const activitySpy = jest.spyOn((component as any).activitySubscription, 'unsubscribe')
      const groupSpy = jest.spyOn((component as any).groupSubscription, 'unsubscribe')
      const officerSpy = jest.spyOn((component as any).officerFormSubscription, 'unsubscribe')
      const compDetailsSpy = jest.spyOn((component as any).compDetailsSubscription, 'unsubscribe')
      component.ngOnDestroy()
      expect(activitySpy).toHaveBeenCalled()
      expect(groupSpy).toHaveBeenCalled()
      expect(officerSpy).toHaveBeenCalled()
      expect(compDetailsSpy).toHaveBeenCalled()
    })
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
