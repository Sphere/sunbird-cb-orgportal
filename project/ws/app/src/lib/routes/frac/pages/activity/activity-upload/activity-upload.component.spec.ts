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
  let mockMatDialog: jest.Mocked<MatDialog>
  let mockFracApiService: jest.Mocked<FracApiService>
  let mockTableTransformUtil: jest.Mocked<TableTransformUtil>
  let mockRouter: jest.Mocked<Router>

  beforeEach(async () => {
    queryParams$ = new BehaviorSubject<Record<string, string>>({ mode: 'upload' })
    mockMatDialog = { open: jest.fn() } as unknown as jest.Mocked<MatDialog>
    mockFracApiService = {
      searchEntities: jest.fn(),
      uploadFile: jest.fn(),
      updateEntity: jest.fn(),
    } as unknown as jest.Mocked<FracApiService>
    mockTableTransformUtil = {
      transformResponseToTableConfig: jest.fn(),
    } as unknown as jest.Mocked<TableTransformUtil>
    mockRouter = { navigateByUrl: jest.fn() } as unknown as jest.Mocked<Router>

    mockFracApiService.searchEntities.mockReturnValue(of({ result: { entity: [] } }))
    mockTableTransformUtil.transformResponseToTableConfig.mockReturnValue({ columns: [], data: [] })
    mockMatDialog.open.mockReturnValue({ afterClosed: () => of(undefined) } as any)

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
    expect(mockFracApiService.searchEntities).toHaveBeenCalledWith('activity', '', 'en')
  })

  it('should debounce typing search and run immediate enter search', fakeAsync(() => {
    component.routeMode = 'manage'
    component.searchTerm = 'Act'

    component.onSearchTermChange()
    tick(499)
    expect(mockFracApiService.searchEntities).not.toHaveBeenCalledWith('activity', 'Act', 'en')

    tick(1)
    expect(mockFracApiService.searchEntities).toHaveBeenCalledWith('activity', 'Act', 'en')

    component.searchTerm = 'Act now'
    component.onSearchEnter()
    expect(mockFracApiService.searchEntities).toHaveBeenCalledWith('activity', 'Act now', 'en')
  }))

  it('should open unsaved changes modal before leaving home', () => {
    jest.spyOn(component, 'hasPendingTableChanges').mockReturnValue(true)

    component.onHomeClick()

    expect(mockMatDialog.open).toHaveBeenCalledWith(
      UnsavedChangesModalComponent,
      expect.objectContaining({ disableClose: true }),
    )
  })

  it('should redirect to manage page after successful upload modal close', async () => {
    mockFracApiService.uploadFile.mockReturnValue(of({
      responseCode: 'OK',
      result: {
        entity: [{ entityType: 'activity', entityCode: ['ACT_01'] }],
        count: 1,
      },
    }))
    mockMatDialog.open.mockReturnValue({ afterClosed: () => of(undefined) } as any)

    component.uploadFile(new File(['a'], 'activity.csv'), 'en')
    await fixture.whenStable()

    expect(mockMatDialog.open).toHaveBeenCalledWith(
      UploadResultModalComponent,
      expect.any(Object),
    )
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith(FRAC_ROUTES.activityManage)
  })
})
