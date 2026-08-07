import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MatLegacyAutocompleteModule } from '@angular/material/legacy-autocomplete'
import { TextFieldModule } from '@angular/cdk/text-field'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { of } from 'rxjs'
import { WatStoreService } from '../../services/wat.store.service'
import { AllocationService } from '../../services/allocation.service'

import { OfficerComponent } from './officer.component'

describe('OfficerComponent', () => {
  let component: OfficerComponent
  let fixture: ComponentFixture<OfficerComponent>

  const mockWatStore = {
    setOfficerGroup: jest.fn(),
  }

  const mockAllocationService = {
    onSearchUser: jest.fn().mockReturnValue(of({ result: { response: { content: [] } } })),
    onSearchPosition: jest.fn().mockReturnValue(of({ responseData: [] })),
  }

  beforeEach(async(() => {
    mockWatStore.setOfficerGroup.mockClear()
    mockAllocationService.onSearchUser.mockClear()
    mockAllocationService.onSearchPosition.mockClear()
    TestBed.configureTestingModule({
      declarations: [OfficerComponent],
      imports: [HttpClientTestingModule, MatLegacyAutocompleteModule, TextFieldModule],
      providers: [
        { provide: WatStoreService, useValue: mockWatStore },
        { provide: AllocationService, useValue: mockAllocationService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(OfficerComponent)
    component = fixture.componentInstance
    component.editData = {}
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('createForm with editData', () => {
    it('should set officerName/position from editData and call setOfficerGroup when officerName present', () => {
      const watStore: any = TestBed.inject(WatStoreService)
      component.editData = {
        usr: { officerName: 'John Doe' },
        position: { userPosition: 'Manager', positionDescription: 'desc' },
      }
      component.createForm()
      expect(component.officerForm.get('officerName')!.value).toBe('John Doe')
      expect(component.officerForm.get('position')!.value).toBe('Manager')
      expect(watStore.setOfficerGroup).toHaveBeenCalledWith(component.officerForm.value, false, false)
    })

    it('should not call setOfficerGroup when editData has no officerName', () => {
      const watStore: any = TestBed.inject(WatStoreService)
      watStore.setOfficerGroup.mockClear()
      component.editData = undefined
      component.createForm()
      expect(watStore.setOfficerGroup).not.toHaveBeenCalled()
    })

    it('should fall back to defaults when editData is undefined', () => {
      component.editData = undefined
      component.createForm()
      expect(component.officerForm.get('officerName')!.value).toBe('')
      expect(component.officerForm.get('user')!.value).toEqual({})
      expect(component.officerForm.get('positionObj')!.value).toEqual({})
    })
  })

  describe('officerName valueChanges switchMap branch', () => {
    it('should reset user when usrObj has firstName and val differs', done => {
      component.editData = undefined
      component.createForm()
      component.officerForm.get('user')!.setValue({ firstName: 'Jane', lastName: 'Roe' })
      component.officerForm.get('officerName')!.setValue('Different Name')
      setTimeout(() => {
        expect(component.officerForm.get('user')!.value).toEqual({})
        done()
      }, 150)
    })

    it('should not reset user when val matches usrName (firstName branch)', done => {
      component.editData = undefined
      component.createForm()
      component.officerForm.get('user')!.setValue({ firstName: 'Jane', lastName: 'Roe' })
      component.officerForm.get('officerName')!.setValue('Jane Roe')
      setTimeout(() => {
        expect(component.officerForm.get('user')!.value).toEqual({ firstName: 'Jane', lastName: 'Roe' })
        done()
      }, 150)
    })

    it('should use officerName fallback when usrObj has no firstName', done => {
      component.editData = undefined
      component.createForm()
      component.officerForm.get('user')!.setValue({ officerName: 'Bob' })
      component.officerForm.get('officerName')!.setValue('Bob')
      setTimeout(() => {
        expect(component.officerForm.get('user')!.value).toEqual({ officerName: 'Bob' })
        done()
      }, 150)
    })
  })

  describe('ngOnInit valueChanges switchMap branch', () => {
    it('should patch positionObj when txtPosition differs from positionObj.name', done => {
      component.officerForm.get('positionObj')!.setValue({ name: 'Old Position' })
      component.officerForm.get('positionDescription')!.setValue('some desc')
      setTimeout(() => {
        component.officerForm.get('position')!.setValue('New Position')
        setTimeout(() => {
          expect(component.officerForm.get('positionObj')!.value.name).toBe('New Position')
          done()
        }, 900)
      }, 200)
    }, 10000)

    it('should call setOfficerGroup when txtPosition matches positionObj.name', done => {
      const watStore: any = TestBed.inject(WatStoreService)
      watStore.setOfficerGroup.mockClear()
      component.officerForm.get('positionObj')!.setValue({ name: 'Same Position' })
      setTimeout(() => {
        component.officerForm.get('position')!.setValue('Same Position')
        setTimeout(() => {
          expect(watStore.setOfficerGroup).toHaveBeenCalled()
          done()
        }, 900)
      }, 200)
    }, 10000)
  })

  describe('filterUsers', () => {
    it('should filter users whose firstName starts with value', () => {
      const allocateSrvc: any = TestBed.inject(AllocationService)
      allocateSrvc.onSearchUser.mockReturnValue(of({
        result: { response: { content: [{ firstName: 'John' }, { firstName: 'Alice' }] } },
      }))
      component.filterUsers('jo')
      component.filteredUserslist.subscribe(list => {
        expect(list).toEqual([{ firstName: 'John' }])
      })
    })
  })

  describe('filterPositions', () => {
    it('should filter positions whose name starts with filterValue', () => {
      const allocateSrvc: any = TestBed.inject(AllocationService)
      allocateSrvc.onSearchPosition.mockReturnValue(of({
        responseData: [{ name: 'Manager' }, { name: 'Officer' }],
      }))
      component.filterPositions('man')
      component.filteredPositionlist.subscribe(list => {
        expect(list).toEqual([{ name: 'Manager' }])
      })
    })

    it('should handle empty value (falsy filterValue branch)', () => {
      const allocateSrvc: any = TestBed.inject(AllocationService)
      allocateSrvc.onSearchPosition.mockReturnValue(of({ responseData: [] }))
      component.filterPositions('')
      expect(component.filteredPositionlist).toBeDefined()
    })
  })

  describe('officerClicked', () => {
    it('should do nothing when event is falsy', () => {
      const watStore: any = TestBed.inject(WatStoreService)
      watStore.setOfficerGroup.mockClear()
      component.officerClicked(null)
      expect(watStore.setOfficerGroup).not.toHaveBeenCalled()
    })

    it('should patch officer fields and call setOfficerGroup when event is truthy', () => {
      const watStore: any = TestBed.inject(WatStoreService)
      watStore.setOfficerGroup.mockClear()
      component.officerClicked({ option: { value: { firstName: 'A', lastName: 'B' } } })
      expect(component.officerForm.get('officerName')!.value).toBe('A B')
      expect(watStore.setOfficerGroup).toHaveBeenCalled()
    })

    it('should fall back to empty string when option.value is missing', () => {
      component.officerClicked({ option: {} })
      expect(component.officerForm.get('user')!.value).toBe('')
    })
  })

  describe('postionClicked', () => {
    it('should do nothing when event is falsy', () => {
      const watStore: any = TestBed.inject(WatStoreService)
      watStore.setOfficerGroup.mockClear()
      component.postionClicked(null)
      expect(watStore.setOfficerGroup).not.toHaveBeenCalled()
    })

    it('should patch position fields and call setOfficerGroup when event is truthy', () => {
      const watStore: any = TestBed.inject(WatStoreService)
      watStore.setOfficerGroup.mockClear()
      component.postionClicked({ option: { value: { name: 'Manager', description: 'desc' } } })
      expect(component.officerForm.get('position')!.value).toBe('Manager')
      expect(component.officerForm.get('positionDescription')!.value).toBe('desc')
      expect(watStore.setOfficerGroup).toHaveBeenCalled()
    })

    it('should fall back to empty string when option.value.name/description missing', () => {
      component.postionClicked({ option: { value: {} } })
      expect(component.officerForm.get('position')!.value).toBe('')
      expect(component.officerForm.get('positionDescription')!.value).toBe('')
    })
  })

  describe('ngOnDestroy', () => {
    it('should complete both subjects without error', () => {
      expect(() => component.ngOnDestroy()).not.toThrow()
    })
  })
})
