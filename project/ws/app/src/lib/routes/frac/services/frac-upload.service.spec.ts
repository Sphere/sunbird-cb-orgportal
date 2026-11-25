import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { FracUploadService } from './frac-upload.service'
import { FRAC_LEGACY_UPLOAD_ENTITY_URL } from '../constants/frac.constants'

describe('FracUploadService', () => {
  let service: FracUploadService
  let httpMock: HttpTestingController
  let configSvc: any

  beforeEach(() => {
    configSvc = { instanceConfig: undefined }
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        FracUploadService,
        { provide: ConfigurationsService, useValue: configSvc },
      ],
    })
    service = TestBed.inject(FracUploadService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => httpMock.verify())

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('uploads to the legacy fallback URL when no instanceConfig override is present', () => {
    const file = new File(['x'], 'a.pdf')
    service.uploadFile(file).subscribe()
    const req = httpMock.expectOne(FRAC_LEGACY_UPLOAD_ENTITY_URL)
    expect(req.request.method).toBe('POST')
    expect(req.request.withCredentials).toBe(true)
    expect(req.request.body.get('file')).toBe(file)
    req.flush({})
  })

  it('uploads to the configured URL when instanceConfig overrides it', () => {
    configSvc.instanceConfig = { frac: { api: { uploadEntityUrl: 'https://custom/upload' } } }
    const file = new File(['x'], 'a.pdf')
    service.uploadFile(file).subscribe()
    const req = httpMock.expectOne('https://custom/upload')
    req.flush({})
  })
})
