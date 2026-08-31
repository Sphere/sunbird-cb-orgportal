import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { ConfigurationsService } from '@sunbird-cb/utils'

import { WidgetContentShareService } from './widget-content-share.service'

describe('WidgetContentShareService', () => {
  let service: WidgetContentShareService
  let httpMock: HttpTestingController
  let configSvc: any

  beforeEach(() => {
    configSvc = { sitePath: 'https://site', userProfile: { userName: 'John', email: 'j@x.com' } }
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: ConfigurationsService, useValue: configSvc }],
    })
    service = TestBed.inject(WidgetContentShareService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => httpMock.verify())

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('fetchConfigFile should GET from baseUrl/feature/common.json', () => {
    service.fetchConfigFile().subscribe()
    const req = httpMock.expectOne('https://site/feature/common.json')
    req.flush({ shareMessage: 'hi' })
  })

  describe('shareContent', () => {
    const content: any = {
      artifactUrl: 'a.mp4',
      creatorContacts: ['c1'],
      description: 'desc',
      downloadUrl: 'd.mp4',
      duration: 30,
      identifier: 'c1',
      size: 100,
      appIcon: 'icon.png',
      name: 'Title',
      track: [{ name: 't1' }, { name: 't2' }],
    }

    it('should include userProfile name/email and put ccTo/emailTo for a share type', () => {
      service.shareContent(content, [{ email: 'a@b.com' }], 'body text').subscribe()
      const req = httpMock.expectOne('/apis/protected/v8/user/share')
      const body = req.request.body
      expect(body.emailType).toBe('share')
      expect(body.sharedBy).toEqual([{ name: 'John', email: 'j@x.com' }])
      expect(body.ccTo).toEqual([{ name: 'John', email: 'j@x.com' }])
      expect(body.emailTo).toEqual([{ email: 'a@b.com' }])
      expect(body.artifacts[0].track).toBe('t1;t2')
      req.flush({})
    })

    it('should route emailTo/ccTo to the user for an attachment type', () => {
      service.shareContent(content, [{ email: 'a@b.com' }], 'body', 'attachment').subscribe()
      const req = httpMock.expectOne('/apis/protected/v8/user/share')
      const body = req.request.body
      expect(body.ccTo).toEqual([])
      expect(body.emailTo).toEqual([{ name: 'John', email: 'j@x.com' }])
      req.flush({})
    })

    it('should default name/email to empty strings when userProfile is missing', () => {
      configSvc.userProfile = undefined
      service.shareContent(content, [], 'body').subscribe()
      const req = httpMock.expectOne('/apis/protected/v8/user/share')
      expect(req.request.body.sharedBy).toEqual([{ name: '', email: '' }])
      req.flush({})
    })

    it('should default artifactUrl/downloadUrl/size when missing from content', () => {
      service.shareContent({ identifier: 'c2', name: 'X' } as any, [], 'body').subscribe()
      const req = httpMock.expectOne('/apis/protected/v8/user/share')
      const artifact = req.request.body.artifacts[0]
      expect(artifact.artifactUrl).toBe('')
      expect(artifact.downloadUrl).toBe('')
      expect(artifact.size).toBe(0)
      expect(artifact.track).toBe('')
      req.flush({})
    })
  })

  it('contentShareNew should POST to the content-share endpoint', () => {
    service.contentShareNew({} as any).subscribe()
    const req = httpMock.expectOne('/apis/protected/v8/user/share/content')
    expect(req.request.method).toBe('POST')
    req.flush({})
  })
})
