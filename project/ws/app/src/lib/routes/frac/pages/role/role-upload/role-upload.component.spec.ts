import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { ActivatedRoute, Router } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { BehaviorSubject, of } from 'rxjs'
import { RoleUploadComponent } from './role-upload.component'
import { FracApiService } from '../../../services/frac-api.service'
import { FracEntityUploadOrchestratorService } from '../../../services/frac-entity-upload-orchestrator.service'
import { TableTransformUtil } from '../../../utils/table-transform.util'

describe('RoleUploadComponent', () => {
  let component: RoleUploadComponent
  let fixture: ComponentFixture<RoleUploadComponent>
  let queryParams$: BehaviorSubject<Record<string, string>>
  let mockFracApiService: jasmine.SpyObj<FracApiService>

  beforeEach(async () => {
    queryParams$ = new BehaviorSubject<Record<string, string>>({ mode: 'upload' })
    mockFracApiService = jasmine.createSpyObj('FracApiService', ['searchEntities', 'uploadFile', 'updateEntity'])
    mockFracApiService.searchEntities.and.returnValue(of({ result: { entity: [] } }))

    await TestBed.configureTestingModule({
      declarations: [RoleUploadComponent],
      providers: [
        FracEntityUploadOrchestratorService,
        { provide: MatDialog, useValue: jasmine.createSpyObj('MatDialog', ['open']) },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigateByUrl']) },
        { provide: FracApiService, useValue: mockFracApiService },
        {
          provide: TableTransformUtil,
          useValue: jasmine.createSpyObj('TableTransformUtil', ['transformResponseToTableConfig']),
        },
        { provide: ActivatedRoute, useValue: { queryParams: queryParams$.asObservable() } },
        { provide: ConfigurationsService, useValue: { instanceConfig: {} } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    fixture = TestBed.createComponent(RoleUploadComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should set upload button text based on route mode', () => {
    component.routeMode = 'upload'
    component.updateButtonText()
    expect(component.uploadButtonText).toBe('Upload File')

    component.routeMode = 'manage'
    component.updateButtonText()
    expect(component.uploadButtonText).toBe('Change File')
  })

  it('should trigger initial search in manage mode', () => {
    queryParams$.next({ mode: 'manage' })
    expect(mockFracApiService.searchEntities).toHaveBeenCalledWith('role', '', 'English')
  })
})
