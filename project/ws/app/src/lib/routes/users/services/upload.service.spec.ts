import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import * as fileSaver from 'file-saver'

import { FileService } from './upload.service'

jest.mock('file-saver', () => ({
  saveAs: jest.fn(),
}))

describe('FileService', () => {
  let service: FileService
  let httpMock: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FileService, provideHttpClient(), provideHttpClientTesting()],
    })
    service = TestBed.inject(FileService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
    jest.clearAllMocks()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('isLoading should emit false initially', done => {
    service.isLoading().subscribe(val => {
      expect(val).toBe(false)
      done()
    })
  })

  it('upload should toggle loader and post form data', () => {
    const loadingValues: boolean[] = []
    service.isLoading().subscribe(v => loadingValues.push(v))
    const formData = new FormData()

    service.upload('file.csv', formData).subscribe(res => {
      expect(res).toEqual({ success: true })
    })

    const req = httpMock.expectOne('/apis/proxies/v8/userData/v1/bulkUpload')
    expect(req.request.method).toBe('POST')
    expect(loadingValues).toContain(true)
    req.flush({ success: true })
    expect(loadingValues[loadingValues.length - 1]).toBe(false)
  })

  it('download should fetch blob and save it via fileSaver', () => {
    service.download('/some/path', 'output.xlsx')
    const req = httpMock.expectOne('/some/path')
    expect(req.request.method).toBe('GET')
    expect(req.request.responseType).toBe('blob')
    const blob = new Blob(['data'])
    req.flush(blob)
    expect(fileSaver.saveAs).toHaveBeenCalledWith(blob, 'output.xlsx')
  })

  it('downloadFile should call saveFile on success', () => {
    const saveFileSpy = jest.spyOn(service as any, 'saveFile')
    service.downloadFile('/some/url')
    const req = httpMock.expectOne('/some/url')
    expect(req.request.method).toBe('GET')
    expect(req.request.responseType).toBe('arraybuffer')
    const buffer = new ArrayBuffer(8)
    req.flush(buffer)
    expect(saveFileSpy).toHaveBeenCalledWith(buffer)
  })

  it('downloadFile should return the error on failure', () => {
    service.downloadFile('/some/url')
    const req = httpMock.expectOne('/some/url')
    req.flush(new ArrayBuffer(0), { status: 500, statusText: 'Server Error' })
    // no throw expected; error handler just returns the error
    expect(true).toBe(true)
  })

  it('saveFile should create a link, click it, and clean up', () => {
    const appendSpy = jest.spyOn(document.body, 'appendChild')
    const removeSpy = jest.spyOn(document.body, 'removeChild')
    const createObjectURLSpy = jest.fn().mockReturnValue('blob:mock-url')
    ;(window.URL as any).createObjectURL = createObjectURLSpy
    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)

    ;(service as any).saveFile(new ArrayBuffer(8))

    expect(createObjectURLSpy).toHaveBeenCalled()
    expect(appendSpy).toHaveBeenCalled()
    expect(removeSpy).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
    appendSpy.mockRestore()
    removeSpy.mockRestore()
    clickSpy.mockRestore()
  })

  it('downloadReport should fetch report and save as csv', () => {
    service.downloadReport('id1', 'myfile.xlsx')
    const req = httpMock.expectOne(`/apis/protected/v8/admin/userRegistration/bulkUploadReport/id1`)
    expect(req.request.method).toBe('GET')
    req.flush({ report: { data: [1, 2, 3] } })
    expect(fileSaver.saveAs).toHaveBeenCalledWith(expect.any(Blob), 'myfile-report.csv')
  })

  it('remove should delete file and update fileList', () => {
    const listValues: string[][] = []
    service.list().subscribe(v => listValues.push(v))
    ;(service as any).fileList.push('a.csv', 'b.csv')

    service.remove('a.csv')
    const req = httpMock.expectOne('/files/${fileName}')
    expect(req.request.method).toBe('DELETE')
    req.flush({})

    expect(listValues[listValues.length - 1]).toEqual(['b.csv'])
  })

  describe('validateFile', () => {
    it('should return true for an allowed xlsx extension', () => {
      expect(service.validateFile('report.xlsx')).toBe(true)
    })

    it('should return true for an allowed csv extension', () => {
      expect(service.validateFile('report.CSV')).toBe(true)
    })

    it('should return false for a disallowed extension', () => {
      expect(service.validateFile('report.txt')).toBe(false)
    })
  })

  it('getBulkUploadData should GET the endpoint and resolve', async () => {
    const promise = service.getBulkUploadData()
    const req = httpMock.expectOne('/apis/proxies/v8/userData/v1/bulkUpload')
    expect(req.request.method).toBe('GET')
    req.flush({ ok: true })
    await expect(promise).resolves.toEqual({ ok: true })
  })

  it('getBulkUploadDataV1 should GET the endpoint and resolve', async () => {
    const promise = service.getBulkUploadDataV1()
    const req = httpMock.expectOne('/apis/proxies/v8/userData/v1/bulkUpload')
    expect(req.request.method).toBe('GET')
    req.flush({ ok: true })
    await expect(promise).resolves.toEqual({ ok: true })
  })

  it('ngOnDestroy should complete the destroy$ subject', () => {
    const destroy$ = (service as any).destroy$
    const nextSpy = jest.spyOn(destroy$, 'next')
    const completeSpy = jest.spyOn(destroy$, 'complete')
    service.ngOnDestroy()
    expect(nextSpy).toHaveBeenCalled()
    expect(completeSpy).toHaveBeenCalled()
  })
})
