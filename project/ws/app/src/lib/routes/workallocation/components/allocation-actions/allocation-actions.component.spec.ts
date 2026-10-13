import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { ReactiveFormsModule } from '@angular/forms'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { of } from 'rxjs'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { AllocationActionsComponent } from './allocation-actions.component'
import { AllocationService } from '../../../workallocation-v2/services/allocation.service'

describe('AllocationActionsComponent', () => {
  let component: AllocationActionsComponent
  let fixture: ComponentFixture<AllocationActionsComponent>
  let allocateSrvc: any
  let dialogRef: any

  const selectedUser = {
    userData: {
      userDetails: { wid: 'w1', first_name: 'John', last_name: 'Doe', email: 'j@x.com' },
    },
    department_id: 'd1',
    department_name: 'Dept',
  }

  beforeEach(waitForAsync(() => {
    allocateSrvc = createSpyObj<any>('AllocationService', [
      'onSearchRole', 'onSearchActivity', 'onSearchCompetency', 'createAllocation',
    ])
    dialogRef = createSpyObj<any>('MatDialogRef', ['close'])

    TestBed.configureTestingModule({
      declarations: [AllocationActionsComponent],
      imports: [HttpClientTestingModule, ReactiveFormsModule],
      providers: [
        { provide: AllocationService, useValue: allocateSrvc },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: selectedUser },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AllocationActionsComponent)
    component = fixture.componentInstance
    // The component reaches for these ids directly via document.getElementById.
    document.body.innerHTML = `
      <div id="loader"></div>
      <div id="showremove0"></div>
      <div id="elementActivity0"></div>
      <div id="showremoveComp0"></div>
      <div id="elemenComp0"></div>
    `
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('close should close the dialog', () => {
    component.close()
    expect(dialogRef.close).toHaveBeenCalled()
  })

  it('newRole should return a form group with name and childNodes controls', () => {
    const group = component.newRole()
    expect(group.get('name')).toBeTruthy()
    expect(group.get('childNodes')).toBeTruthy()
  })

  describe('onSearchRole', () => {
    it('should do nothing for a short query', () => {
      component.onSearchRole({ target: { value: 'ab' } })
      expect(allocateSrvc.onSearchRole).not.toHaveBeenCalled()
    })

    it('should populate similarRoles and clear the no-results flag on results', () => {
      allocateSrvc.onSearchRole.mockReturnValue(of([
        { type: 't', name: 'Role1', description: 'd', status: 's', source: 'src', childNodes: ['c'] },
      ]))
      component.onSearchRole({ target: { value: 'role' } })
      expect(component.similarRoles.length).toBe(1)
      expect(component.similarRoles[0].name).toBe('Role1')
      expect(component.nosimilarRoles).toBe(false)
    })

    it('should default childNodes to [] when absent and set nosimilarRoles when empty', () => {
      allocateSrvc.onSearchRole.mockReturnValue(of([]))
      component.onSearchRole({ target: { value: 'role' } })
      expect(component.nosimilarRoles).toBe(true)
    })

    it('should tolerate an undefined response', () => {
      allocateSrvc.onSearchRole.mockReturnValue(of(undefined))
      expect(() => component.onSearchRole({ target: { value: 'role' } })).not.toThrow()
    })
  })

  describe('onSearchCompetency', () => {
    it('should do nothing for a short query', () => {
      component.onSearchCompetency({ target: { value: 'ab' } })
      expect(allocateSrvc.onSearchCompetency).not.toHaveBeenCalled()
    })

    it('should populate similarCompetencies from responseData', () => {
      allocateSrvc.onSearchCompetency.mockReturnValue(of({ responseData: [{ name: 'C1' }] }))
      component.onSearchCompetency({ target: { value: 'comp' } })
      expect(component.similarCompetencies).toEqual([{ name: 'C1' }])
      expect(component.nosimilarRoles).toBe(false)
    })

    it('should set nosimilarRoles (and leave nosimilarCompetencies false) when responseData is empty', () => {
      allocateSrvc.onSearchCompetency.mockReturnValue(of({ responseData: [] }))
      component.onSearchCompetency({ target: { value: 'comp' } })
      expect(component.nosimilarRoles).toBe(true)
      expect(component.nosimilarCompetencies).toBe(false)
    })
  })

  describe('displayLoader', () => {
    it('should show the loader element', () => {
      component.displayLoader('true')
      expect(document.getElementById('loader')?.style.display).toBe('block')
    })

    it('should hide the loader element', () => {
      component.displayLoader('false')
      expect(document.getElementById('loader')?.style.display).toBe('none')
    })
  })

  it('setAllMsgFalse should clear all no-results flags', () => {
    component.nosimilarUsers = true
    component.nosimilarRoles = true
    component.nosimilarPositions = true
    component.nosimilarActivities = true
    component.setAllMsgFalse()
    expect(component.nosimilarUsers).toBe(false)
    expect(component.nosimilarRoles).toBe(false)
    expect(component.nosimilarPositions).toBe(false)
    expect(component.nosimilarActivities).toBe(false)
  })

  describe('selectRole', () => {
    beforeEach(() => {
      component.similarRoles = [
        { type: 't', name: 'Role1', description: 'd', status: 's', childNodes: [] },
      ]
    })

    it('should set selectedRole and populate the form', () => {
      component.selectRole({ name: 'Role1' })
      expect(component.selectedRole.name).toBe('Role1')
      expect(component.allocationFieldForm.controls['role'].value).toBe('Role1')
      expect(component.allocationFieldForm.controls['roleDesc'].value).toBe('d')
      expect(component.similarRoles).toEqual([])
    })

    it('should mark mapActivities required when childNodes is empty', () => {
      component.selectRole({ name: 'Role1' })
      expect(component.activitieslist).toEqual([])
      expect(component.allocationFieldForm.controls['mapActivities'].validator).toBeTruthy()
    })
  })

  describe('selectCompetency', () => {
    it('should do nothing when comp is undefined', () => {
      component.selectCompetency(undefined)
      expect(component.selectedCompetency).toBeUndefined()
    })

    it('should build selectedCompetency and populate the form', () => {
      const comp = {
        type: 't', id: 'c1', name: 'Comp1', description: 'd', status: 's', childNodes: [],
        source: 'src', reviewComments: [], createdDate: '2024', additionalProperties: { competencyArea: 'area1' }, children: [],
      }
      component.selectCompetency(comp)
      expect(component.selectedCompetency[0].name).toBe('Comp1')
      expect(component.allocationFieldForm.controls['competency'].value).toBe('Comp1')
      expect(component.allocationFieldForm.controls['compArea'].value).toBe('area1')
    })
  })

  it('newroleControls should return the rolelist FormArray controls', () => {
    expect(component.newroleControls).toBeTruthy()
    expect(component.newroleControls.length).toBe(1)
  })

  it('tabChange should increment the tab group selectedIndex', () => {
    const el = { selectedIndex: 0 }
    component.tabChange(el)
    expect(el.selectedIndex).toBe(1)
  })

  describe('onSearchActivity', () => {
    it('should do nothing for a short query', () => {
      component.onSearchActivity({ target: { value: 'ab' } })
      expect(allocateSrvc.onSearchActivity).not.toHaveBeenCalled()
    })

    it('should populate similarActivities and set no-results flag when empty', () => {
      allocateSrvc.onSearchActivity.mockReturnValue(of({ responseData: [] }))
      component.onSearchActivity({ target: { value: 'act' } })
      const [req] = allocateSrvc.onSearchActivity.mock.calls[0]
      expect(req.searches[0].keyword).toBe('act')
      expect(component.nosimilarActivities).toBe(true)
    })

    it('should clear all no-results flags when activities are found', () => {
      allocateSrvc.onSearchActivity.mockReturnValue(of({ responseData: [{ name: 'A1' }] }))
      component.onSearchActivity({ target: { value: 'act' } })
      expect(component.similarActivities).toEqual([{ name: 'A1' }])
      expect(component.nosimilarActivities).toBe(false)
    })
  })

  it('selectActivity should set selectedActivity and update the form', () => {
    component.selectActivity({ name: 'Act1' })
    expect(component.selectedActivity).toEqual({ name: 'Act1' })
    expect(component.allocationFieldForm.controls['mapActivities'].value).toBe('Act1')
    expect(component.similarActivities).toEqual([])
  })

  describe('mapSelectedActivity', () => {
    it('should do nothing when mapActivities is empty', () => {
      component.activitieslist = []
      component.allocationFieldForm.controls['mapActivities'].setValue('')
      component.mapSelectedActivity()
      expect(component.activitieslist).toEqual([])
    })

    it('should push the selected activity onto activitieslist', () => {
      component.activitieslist = []
      component.selectedActivity = { description: 'd', id: 'a1' }
      component.allocationFieldForm.controls['mapActivities'].setValue('Act1')
      component.mapSelectedActivity()
      expect(component.activitieslist).toEqual([
        { name: 'Act1', desc: 'd', id: 'a1', status: '', parentRole: '', type: '' },
      ])
    })
  })

  it('showRemoveActivity should reveal the remove button and restyle the element', () => {
    component.showRemoveActivity(0)
    expect(document.getElementById('showremove0')?.style.display).toBe('block')
    expect(document.getElementById('elementActivity0')?.style.paddingRight).toBe('0px')
  })

  it('showRemoveCompetency should reveal the remove button and restyle the element', () => {
    component.showRemoveCompetency(0)
    expect(document.getElementById('showremoveComp0')?.style.display).toBe('block')
    expect(document.getElementById('elemenComp0')?.style.paddingRight).toBe('0px')
  })

  it('removeActivity should splice the given index', () => {
    component.activitieslist = [{ name: 'a' }, { name: 'b' }]
    component.removeActivity(0)
    expect(component.activitieslist).toEqual([{ name: 'b' }])
  })

  it('removeActivity should ignore a negative index', () => {
    component.activitieslist = [{ name: 'a' }]
    component.removeActivity(-1)
    expect(component.activitieslist).toEqual([{ name: 'a' }])
  })

  describe('buttonClick', () => {
    it('should remove the row from ralist on Delete', () => {
      const row = { id: 1 }
      component.ralist = [row]
      component.buttonClick('Delete', row)
      expect(component.ralist).toEqual([])
    })

    it('should do nothing when ralist is not set', () => {
      component.ralist = undefined as any
      expect(() => component.buttonClick('Delete', {})).not.toThrow()
    })
  })

  it('selectLevel should set compatecnyLevel and the form control', () => {
    component.selectLevel('L2')
    expect(component.compatecnyLevel).toBe('L2')
    expect(component.allocationFieldForm.controls['compLevel'].value).toBe('L2')
  })

  describe('mapSelectedCompetency', () => {
    it('should do nothing when no level is selected', () => {
      component.compatecnyLevel = ''
      component.competencieslist = []
      component.mapSelectedCompetency()
      expect(component.competencieslist).toEqual([])
    })

    it('should push the selected competency when a level is chosen', () => {
      component.compatecnyLevel = 'L1'
      component.competencieslist = []
      component.allocationFieldForm.controls['competency'].setValue('Comp1')
      component.mapSelectedCompetency()
      expect(component.competencieslist).toEqual([{ name: 'Comp1' }])
    })
  })

  it('saveWorkOrder should build the request, submit it, and close the dialog on success', () => {
    component.selectedCompetency = { childCount: 1 } as any
    component.selectedRole = { name: 'Role1' }
    component.selectedPosition = { id: 'p1' }
    allocateSrvc.createAllocation.mockReturnValue(of({ ok: true }))

    component.saveWorkOrder()

    const [reqdata] = allocateSrvc.createAllocation.mock.calls[0]
    expect(reqdata.userId).toBe('w1')
    expect(reqdata.userName).toBe('John Doe')
    expect(reqdata.deptId).toBe('d1')
    expect(reqdata.positionId).toBe('p1')
    expect(dialogRef.close).toHaveBeenCalledWith({ event: 'close', data: reqdata })
  })

  it('saveWorkOrder should not close the dialog when the save fails to return a response', () => {
    component.selectedCompetency = {} as any
    component.selectedRole = {}
    allocateSrvc.createAllocation.mockReturnValue(of(null))

    component.saveWorkOrder()

    expect(dialogRef.close).not.toHaveBeenCalled()
  })
})
