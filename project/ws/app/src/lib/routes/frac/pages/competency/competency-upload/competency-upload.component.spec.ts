import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { ActivatedRoute, Router } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { BehaviorSubject, of } from 'rxjs'
import { CompetencyUploadComponent } from './competency-upload.component'
import { FracApiService } from '../../../services/frac-api.service'
import { FracEntityUploadOrchestratorService } from '../../../services/frac-entity-upload-orchestrator.service'
import { TableTransformUtil } from '../../../utils/table-transform.util'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

describe('CompetencyUploadComponent', () => {
  let component: CompetencyUploadComponent
  let fixture: ComponentFixture<CompetencyUploadComponent>
  let queryParams$: BehaviorSubject<Record<string, string>>
  let mockFracApiService: jest.Mocked<FracApiService>

  beforeEach(async () => {
    queryParams$ = new BehaviorSubject<Record<string, string>>({ mode: 'upload' })
    mockFracApiService = createSpyObj('FracApiService', ['searchEntities', 'uploadFile', 'updateEntity'])
    mockFracApiService.searchEntities.mockReturnValue(of({ result: { entity: [] } }) as any)

    await TestBed.configureTestingModule({
      declarations: [CompetencyUploadComponent],
      providers: [
        FracEntityUploadOrchestratorService,
        { provide: MatDialog, useValue: createSpyObj('MatDialog', ['open']) },
        { provide: Router, useValue: createSpyObj('Router', ['navigateByUrl']) },
        { provide: FracApiService, useValue: mockFracApiService },
        {
          provide: TableTransformUtil,
          useValue: createSpyObj('TableTransformUtil', ['transformResponseToTableConfig']),
        },
        { provide: ActivatedRoute, useValue: { queryParams: queryParams$.asObservable() } },
        { provide: ConfigurationsService, useValue: { instanceConfig: {} } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    fixture = TestBed.createComponent(CompetencyUploadComponent)
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
    expect(mockFracApiService.searchEntities).toHaveBeenCalledWith('competency', '', 'en')
  })
})
