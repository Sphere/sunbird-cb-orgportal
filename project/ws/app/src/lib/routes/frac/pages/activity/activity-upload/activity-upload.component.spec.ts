import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { ActivatedRoute, Router } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { BehaviorSubject, of } from 'rxjs'
import { ActivityUploadComponent } from './activity-upload.component'
import { FracApiService } from '../../../services/frac-api.service'
import { FracEntityUploadOrchestratorService } from '../../../services/frac-entity-upload-orchestrator.service'
import { TableTransformUtil } from '../../../utils/table-transform.util'
import { FRAC_ROUTES } from '../../../constants/frac.constants'
import { UploadResultModalComponent } from '../../../components/upload-result-modal/upload-result-modal.component'
import { UnsavedChangesModalComponent } from '../../../components/unsaved-changes-modal/unsaved-changes-modal.component'

describe('ActivityUploadComponent', () => {
  let component: ActivityUploadComponent
  let fixture: ComponentFixture<ActivityUploadComponent>
  let queryParams$: BehaviorSubject<Record<string, string>>
  let mockMatDialog: jasmine.SpyObj<MatDialog>
  let mockFracApiService: jasmine.SpyObj<FracApiService>
  let mockTableTransformUtil: jasmine.SpyObj<TableTransformUtil>
  let mockRouter: jasmine.SpyObj<Router>

  beforeEach(async () => {
    queryParams$ = new BehaviorSubject<Record<string, string>>({ mode: 'upload' })
    mockMatDialog = jasmine.createSpyObj('MatDialog', ['open'])
    mockFracApiService = jasmine.createSpyObj('FracApiService', ['searchEntities', 'uploadFile', 'updateEntity'])
    mockTableTransformUtil = jasmine.createSpyObj('TableTransformUtil', ['transformResponseToTableConfig'])
    mockRouter = jasmine.createSpyObj('Router', ['navigateByUrl'])

    mockFracApiService.searchEntities.and.returnValue(of({ result: { entity: [] } }))
    mockTableTransformUtil.transformResponseToTableConfig.and.returnValue({ columns: [], data: [] })
    mockMatDialog.open.and.returnValue({ afterClosed: () => of(undefined) } as any)

    await TestBed.configureTestingModule({
      declarations: [ActivityUploadComponent],
      providers: [
        FracEntityUploadOrchestratorService,
        { provide: MatDialog, useValue: mockMatDialog },
        { provide: Router, useValue: mockRouter },
        { provide: FracApiService, useValue: mockFracApiService },
        { provide: TableTransformUtil, useValue: mockTableTransformUtil },
        { provide: ActivatedRoute, useValue: { queryParams: queryParams$.asObservable() } },
        { provide: ConfigurationsService, useValue: { instanceConfig: {} } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    fixture = TestBed.createComponent(ActivityUploadComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should set button text for route mode', () => {
    component.routeMode = 'upload'
    component.updateButtonText()
    expect(component.uploadButtonText).toBe('Upload File')

    component.routeMode = 'manage'
    component.updateButtonText()
    expect(component.uploadButtonText).toBe('Change File')
  })

  it('should trigger initial search in manage mode from query params', () => {
    queryParams$.next({ mode: 'manage' })
    expect(mockFracApiService.searchEntities).toHaveBeenCalledWith('activity', '', 'English')
  })

  it('should debounce typing search and run immediate enter search', fakeAsync(() => {
    component.routeMode = 'manage'
    component.searchTerm = 'Act'

    component.onSearchTermChange()
    tick(499)
    expect(mockFracApiService.searchEntities).not.toHaveBeenCalledWith('activity', 'Act', 'English')

    tick(1)
    expect(mockFracApiService.searchEntities).toHaveBeenCalledWith('activity', 'Act', 'English')

    component.searchTerm = 'Act now'
    component.onSearchEnter()
    expect(mockFracApiService.searchEntities).toHaveBeenCalledWith('activity', 'Act now', 'English')
  }))

  it('should open unsaved changes modal before leaving home', () => {
    spyOn(component, 'hasPendingTableChanges').and.returnValue(true)

    component.onHomeClick()

    expect(mockMatDialog.open).toHaveBeenCalledWith(
      UnsavedChangesModalComponent,
      jasmine.objectContaining({ disableClose: true }),
    )
  })

  it('should redirect to manage page after successful upload modal close', () => {
    mockFracApiService.uploadFile.and.returnValue(of({
      responseCode: 'OK',
      result: {
        entity: [{ entityType: 'activity', entityCode: ['ACT_01'] }],
        count: 1,
      },
    }))
    mockMatDialog.open.and.returnValue({ afterClosed: () => of(undefined) } as any)

    component.uploadFile(new File(['a'], 'activity.csv'), 'English')

    expect(mockMatDialog.open).toHaveBeenCalledWith(
      UploadResultModalComponent,
      jasmine.any(Object),
    )
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith(FRAC_ROUTES.activityManage)
  })
})
