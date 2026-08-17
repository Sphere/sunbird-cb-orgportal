import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { MatSnackBar } from '@angular/material/snack-bar'
import { of } from 'rxjs'
import { createSpyObj } from 'src/test-utils/create-spy-obj'
import { FileService } from '../../services/upload.service'

import { UsersUploadComponent } from './users-upload.component'

describe('UsersUploadComponent', () => {
  let component: UsersUploadComponent
  let fixture: ComponentFixture<UsersUploadComponent>
  let fileService: { [key: string]: jest.Mock }
  let snackBar: { [key: string]: jest.Mock }

  const build = (routeOverrides: any = {}) => {
    fileService = createSpyObj('FileService', [
      'isLoading', 'getBulkUploadDataV1', 'validateFile', 'upload', 'download', 'downloadFile',
    ] as any)
    fileService['isLoading'].mockReturnValue(of(false))
    fileService['getBulkUploadDataV1'].mockResolvedValue({})
    snackBar = createSpyObj('MatSnackBar', ['open'] as any)

    TestBed.configureTestingModule({
      declarations: [UsersUploadComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: FileService, useValue: fileService },
        { provide: MatSnackBar, useValue: snackBar },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { parent: null }, data: of({}), ...routeOverrides },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    fixture = TestBed.createComponent(UsersUploadComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  afterEach(() => TestBed.resetTestingModule())

  it('should create', () => {
    build()
    expect(component).toBeTruthy()
  })

  it('should read rootOrgId from the parent route snapshot data', () => {
    build({
      snapshot: {
        parent: { data: { configService: { unMappedUser: { rootOrg: { rootOrgId: 'org1' } } } } },
      },
    })
    expect(component.rootOrgId).toBe('org1')
  })

  it('should read downloadSampleFilePath/downloadAsFileName from route data.pageData', () => {
    build({ data: of({ pageData: { data: { downloadSampleFilePath: '/a', downloadAsFileName: 'a.csv' } } }) })
    expect(component.downloadSampleFilePath).toBe('/a')
    expect(component.downloadAsFileName).toBe('a.csv')
  })

  it('ngOnInit should set up displayLoader, contactUsUrl, and fetch bulk upload data', () => {
    build()
    expect(component.contactUsUrl).toContain('/public/contact')
    expect(fileService.getBulkUploadDataV1).toHaveBeenCalled()
  })

  describe('getBulkUploadData', () => {
    it('should populate bulkUploadData when content is present', async () => {
      build()
      fileService.getBulkUploadDataV1.mockResolvedValue({ result: { content: [{ id: 1 }] } })
      component.getBulkUploadData()
      await Promise.resolve()
      await Promise.resolve()
      expect(component.bulkUploadData).toEqual([{ id: 1 }])
      expect(component.fetching).toBe(false)
    })

    it('should swallow errors from the upload data fetch', async () => {
      build()
      fileService.getBulkUploadDataV1.mockRejectedValue(new Error('boom'))
      expect(() => component.getBulkUploadData()).not.toThrow()
      await Promise.resolve()
      await Promise.resolve()
      expect(component.fetching).toBe(false)
    })
  })

  describe('onFileChange', () => {
    it('should store the selected file and patch the form', () => {
      build()
      const file = new File(['x'], 'a.csv')
      component.onFileChange({ target: { files: [file] } })
      expect(component.formGroup.get('file')?.value).toBe(file)
    })

    it('should do nothing when no file is selected', () => {
      build()
      component.onFileChange({ target: { files: [] } })
      expect(component.formGroup.get('file')?.value).toBe('')
    })
  })

  describe('onSubmit', () => {
    it('should show a file-error snackbar when validation fails', () => {
      build()
      fileService.validateFile.mockReturnValue(false)
      component.onSubmit({})
      expect(component.showFileError).toBe(true)
      expect(snackBar.open).toHaveBeenCalledWith(
        'File upload failed, Only .xlsx or .csv files are accepted ..!', 'X', expect.any(Object),
      )
    })

    it('should upload, reset the form, and refresh data on success', () => {
      build()
      component.onFileChange({ target: { files: [new File(['x'], 'a.csv')] } })
      fileService.validateFile.mockReturnValue(true)
      fileService.upload.mockReturnValue(of({}))
      const refreshSpy = jest.spyOn(component, 'getBulkUploadData')
      component.onSubmit({ file: { value: 'x' } })
      expect(snackBar.open).toHaveBeenCalledWith('File uploaded successfully..!', 'X', expect.any(Object))
      expect(refreshSpy).toHaveBeenCalled()
    })

    it('should show the toastError message on upload failure', () => {
      build()
      component.onFileChange({ target: { files: [new File(['x'], 'a.csv')] } })
      fileService.validateFile.mockReturnValue(true)
      fileService.upload.mockReturnValue({
        subscribe: (_next: any, error: any) => error(new Error('boom')),
      })
      component.toastError = { nativeElement: { value: 'Upload failed' } } as any
      component.onSubmit({})
      expect(snackBar.open).toHaveBeenCalledWith('Upload failed', 'X', expect.any(Object))
    })
  })

  it('refreshTable should refetch the bulk upload data', () => {
    build()
    const refreshSpy = jest.spyOn(component, 'getBulkUploadData')
    component.refreshTable()
    expect(refreshSpy).toHaveBeenCalled()
  })

  it('downloadFile should download the sample template', () => {
    build()
    component.downloadFile()
    expect(fileService.download).toHaveBeenCalledWith('assets/common/user-bulk-upload-v2.xlsx', 'user-bulk-upload-sample.xlsx')
  })

  it('downloadReport should download by row identifier/name', () => {
    build()
    component.downloadReport({ identifier: 'id1', name: 'n1' })
    expect(fileService.download).toHaveBeenCalledWith('id1', 'n1')
  })

  it('downloadReportStatus should download the file at filePath', () => {
    build()
    component.downloadReportStatus({ filePath: '/f1' })
    expect(fileService.downloadFile).toHaveBeenCalledWith('/f1')
  })

  it('ngOnDestroy should unsubscribe the page data subscription', () => {
    build()
    const unsubSpy = jest.spyOn(component.pageDataSubscription, 'unsubscribe')
    component.ngOnDestroy()
    expect(unsubSpy).toHaveBeenCalled()
  })
})
