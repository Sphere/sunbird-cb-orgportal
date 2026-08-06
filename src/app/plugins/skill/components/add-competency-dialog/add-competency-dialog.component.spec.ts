import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { AddCompetencyDialogComponent } from './add-competency-dialog.component'

describe('AddCompetencyDialogComponent', () => {
  let component: AddCompetencyDialogComponent
  let fixture: ComponentFixture<AddCompetencyDialogComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AddCompetencyDialogComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: MatDialogRef, useValue: createSpyObj('MatDialogRef', ['close']) },
        { provide: MAT_DIALOG_DATA, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AddCompetencyDialogComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('getAllEntity', () => {
    it('populates selectCompetencyList and searchComp from the competency service', () => {
      const competencySvc: any = TestBed.inject(CompetencyService)
      competencySvc.getAllEntity.mockReturnValue(of({ result: { response: [{ id: 1 }] } }))
      competencySvc.getFormatedData.mockReturnValue([{ displayName: 'Comp1', value: '1' }])
      component.getAllEntity()
      expect(component.selectCompetencyList).toEqual([{ displayName: 'Comp1', value: '1' }])
      expect(component.searchComp).toEqual([{ displayName: 'Comp1', value: '1' }])
    })
  })

  describe('onKey', () => {
    it('delegates to search and assigns the result to selectCompetencyList', () => {
      const spy = jest.spyOn(component, 'search').mockReturnValue(['x'] as any)
      component.onKey('abc')
      expect(spy).toHaveBeenCalledWith('abc')
      expect(component.selectCompetencyList).toEqual(['x'])
    })
  })

  describe('search', () => {
    it('returns searchComp unchanged when the filter value is empty', () => {
      component.searchComp = [{ displayName: 'Alpha' }]
      const result = component.search('')
      expect(result).toBe(component.searchComp)
    })

    it('filters searchComp by displayName case-insensitively when a value is provided', () => {
      component.searchComp = [{ displayName: 'Alpha' }, { displayName: 'Beta' }]
      const result = component.search('AL')
      expect(result).toEqual([{ displayName: 'Alpha' }])
      expect(component.selectCompetencyList).toEqual([{ displayName: 'Alpha' }])
    })
  })

  describe('submit', () => {
    it('does not call getFormatedData when the form is invalid', () => {
      const spy = jest.spyOn(component, 'getFormatedData')
      component.addCompetencyForm.reset()
      component.submit()
      expect(spy).not.toHaveBeenCalled()
    })

    it('calls getFormatedData when the form is valid', () => {
      const spy = jest.spyOn(component, 'getFormatedData').mockImplementation(() => undefined)
      component.addCompetencyForm.setValue({
        selectCompetency: '1',
        selectProficiency: '2',
        selectDate: new Date('2024-01-01'),
        comments: 'note',
      })
      component.submit()
      expect(spy).toHaveBeenCalled()
    })
  })

  describe('getFormatedData', () => {
    it('builds the request payload from the selected competency and form values, then submits it', () => {
      component.userId = 'user-1'
      component.selectCompetencyList = [{ value: '1', displayName: 'Comp1' }]
      component.addCompetencyForm.setValue({
        selectCompetency: '1',
        selectProficiency: '2',
        selectDate: new Date('2024-01-01'),
        comments: 'note',
      })
      const spy = jest.spyOn(component, 'addSelectedCompetency')
      component.getFormatedData()
      expect(spy).toHaveBeenCalled()
      const payload = spy.mock.calls[0][0]
      expect(payload.request.userId).toBe('user-1')
      expect(payload.request.competencyDetails[0].competencyId).toBe('1')
      expect(payload.request.competencyDetails[0].acquiredDetails.competencyLevelId).toBe('2')
      expect(payload.request.competencyDetails[0].acquiredDetails.additionalParams.remarks).toBe('note')
    })

    it('falls back to an empty remarks string when comments are absent from the form value', () => {
      component.selectCompetencyList = [{ value: '1', displayName: 'Comp1' }]
      component.addCompetencyForm.setValue({
        selectCompetency: '1',
        selectProficiency: '2',
        selectDate: new Date('2024-01-01'),
        comments: '',
      })
      const spy = jest.spyOn(component, 'addSelectedCompetency')
      component.getFormatedData()
      const payload = spy.mock.calls[0][0]
      expect(payload.request.competencyDetails[0].acquiredDetails.additionalParams.remarks).toBe('')
    })
  })

  describe('addSelectedCompetency', () => {
    it('does nothing when formatedData is falsy', () => {
      const competencySvc: any = TestBed.inject(CompetencyService)
      competencySvc.updatePassbook.mockClear()
      component.addSelectedCompetency(null)
      expect(competencySvc.updatePassbook).not.toHaveBeenCalled()
    })

    it('closes the dialog with updated:true when the update call returns truthy data', () => {
      const competencySvc: any = TestBed.inject(CompetencyService)
      competencySvc.updatePassbook.mockReturnValue(of({ ok: true }))
      const dialogRef: any = TestBed.inject(MatDialogRef)
      component.addSelectedCompetency({ request: {} })
      expect(dialogRef.close).toHaveBeenCalledWith({ updated: true })
    })

    it('does not close the dialog when the update call returns falsy data', () => {
      const competencySvc: any = TestBed.inject(CompetencyService)
      competencySvc.updatePassbook.mockReturnValue(of(null))
      const dialogRef: any = TestBed.inject(MatDialogRef)
      dialogRef.close.mockClear()
      component.addSelectedCompetency({ request: {} })
      expect(dialogRef.close).not.toHaveBeenCalled()
    })
  })

  describe('ngOnDestroy', () => {
    it('completes the destroy subject without throwing', () => {
      expect(() => component.ngOnDestroy()).not.toThrow()
    })
  })
})
