import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivityUploadComponent } from './activity-upload.component'
import { MatDialog } from '@angular/material/dialog'
import { ActivatedRoute } from '@angular/router'
import { FracApiService } from '../../../services/frac-api.service'
import { TableTransformUtil } from '../../../utils/table-transform.util'
import { of } from 'rxjs'

describe('ActivityUploadComponent', () => {
  let component: ActivityUploadComponent
  let fixture: ComponentFixture<ActivityUploadComponent>
  let mockMatDialog: jasmine.SpyObj<MatDialog>
  let mockFracApiService: jasmine.SpyObj<FracApiService>
  let mockTableTransformUtil: jasmine.SpyObj<TableTransformUtil>
  let mockActivatedRoute: any

  beforeEach(async () => {
    mockMatDialog = jasmine.createSpyObj('MatDialog', ['open'])
    mockFracApiService = jasmine.createSpyObj('FracApiService', ['searchEntities', 'uploadFile', 'updateEntity'])
    mockTableTransformUtil = jasmine.createSpyObj('TableTransformUtil', ['transformResponseToTableConfig'])
    mockActivatedRoute = { queryParams: of({ mode: 'upload' }) }

    await TestBed.configureTestingModule({
      declarations: [ActivityUploadComponent],
      providers: [
        { provide: MatDialog, useValue: mockMatDialog },
        { provide: FracApiService, useValue: mockFracApiService },
        { provide: TableTransformUtil, useValue: mockTableTransformUtil },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents()

    fixture = TestBed.createComponent(ActivityUploadComponent)
    component = fixture.componentInstance
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should set uploadButtonText to "Upload File" in upload mode', () => {
    component.routeMode = 'upload'
    component.updateButtonText()
    expect(component.uploadButtonText).toBe('Upload File')
  })

  it('should set uploadButtonText to "Change File" in manage mode', () => {
    component.routeMode = 'manage'
    component.updateButtonText()
    expect(component.uploadButtonText).toBe('Change File')
  })

  it('should check if table has data', () => {
    component.tableConfig = { columns: [], data: [{ code: 'A1', name: 'Activity 1' }] }
    expect(component.hasTableData()).toBe(true)

    component.tableConfig.data = []
    expect(component.hasTableData()).toBe(false)
  })

  it('should toggle dropdown', () => {
    component.isOpen = false
    component.toggleDropdown()
    expect(component.isOpen).toBe(true)
    component.toggleDropdown()
    expect(component.isOpen).toBe(false)
  })

  it('should select language and close dropdown', () => {
    component.isOpen = true
    const mockEvent = jasmine.createSpyObj('MouseEvent', ['stopPropagation'])
    component.selectLanguage('Hindi', mockEvent)
    expect(component.selectedLanguage).toBe('Hindi')
    expect(component.isOpen).toBe(false)
  })
})
