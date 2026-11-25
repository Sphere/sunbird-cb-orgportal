import { TestBed } from '@angular/core/testing'
import { HttpClient, provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { ConfigurationsService } from '@sunbird-cb/utils'

import { WorkallocationService } from './workallocation.service'

describe('WorkallocationService', () => {
  let service: WorkallocationService
  let httpMock: HttpTestingController
  let httpClient: HttpClient
  let configService: any

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WorkallocationService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ConfigurationsService,
          useValue: {
            userProfile: null,
            userProfileV2: null,
          },
        },
      ],
    })
    service = TestBed.inject(WorkallocationService)
    httpClient = TestBed.inject(HttpClient)
    httpMock = TestBed.inject(HttpTestingController)
    configService = TestBed.inject(ConfigurationsService)
  })

  afterEach(() => {
    httpMock.verify()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('getTime', () => {
    it('should format a given date timestamp into date and time string', () => {
      const result = service.getTime(1700000000000)
      expect(typeof result).toBe('string')
      expect(result).toContain(new Date(1700000000000).toISOString().substr(0, 10))
    })
  })

  describe('getUsers', () => {
    it('should POST request body to USERS endpoint', () => {
      const reqBody = { query: 'abc' }
      jest.spyOn(httpClient, 'post').mockReturnValue({} as any)
      service.getUsers(reqBody)
      expect(httpClient.post).toHaveBeenCalledWith(
        '/apis/protected/v8/workallocation/userSearch', reqBody,
      )
    })
  })

  describe('getAllUsers', () => {
    it('should GET all users', () => {
      jest.spyOn(httpClient, 'get').mockReturnValue({} as any)
      service.getAllUsers()
      expect(httpClient.get).toHaveBeenCalledWith('/apis/proxies/v8/api/user/v2/read')
    })
  })

  describe('fetchWAT', () => {
    it('should use userProfile departmentName when present', () => {
      configService.userProfile = { departmentName: 'dept1' }
      configService.userProfileV2 = null
      jest.spyOn(httpClient, 'post').mockReturnValue({} as any)
      service.fetchWAT('active')
      expect(httpClient.post).toHaveBeenCalledWith(
        '/apis/protected/v8/workallocation/getWorkOrders',
        expect.objectContaining({ departmentName: 'dept1', status: 'active' }),
      )
    })

    it('should fallback to userProfileV2 departmentName when userProfile is absent', () => {
      configService.userProfile = null
      configService.userProfileV2 = { departmentName: 'deptV2' }
      jest.spyOn(httpClient, 'post').mockReturnValue({} as any)
      service.fetchWAT('active')
      expect(httpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ departmentName: 'deptV2' }),
      )
    })

    it('should fallback to empty string when neither userProfile nor userProfileV2 present', () => {
      configService.userProfile = null
      configService.userProfileV2 = null
      jest.spyOn(httpClient, 'post').mockReturnValue({} as any)
      service.fetchWAT('active')
      expect(httpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ departmentName: '' }),
      )
    })

    it('should fallback to empty string when userProfile exists but has no departmentName', () => {
      configService.userProfile = {}
      configService.userProfileV2 = null
      jest.spyOn(httpClient, 'post').mockReturnValue({} as any)
      service.fetchWAT('active')
      expect(httpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ departmentName: '' }),
      )
    })
  })

  describe('addWAT', () => {
    it('should include departmentName from userProfile when present', () => {
      configService.userProfile = { departmentName: 'deptA' }
      jest.spyOn(httpClient, 'post').mockReturnValue({} as any)
      service.addWAT('deptA', 5)
      expect(httpClient.post).toHaveBeenCalledWith(
        '/apis/protected/v8/workallocation/add/workorder',
        expect.objectContaining({ deptId: 5, deptName: 'deptA', name: 'Work order - deptA' }),
      )
    })

    it('should fallback to empty string when userProfile is absent', () => {
      configService.userProfile = null
      jest.spyOn(httpClient, 'post').mockReturnValue({} as any)
      service.addWAT('deptB', 6)
      expect(httpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ deptName: '' }),
      )
    })
  })

  describe('copyWAT', () => {
    it('should POST request with work order id and name', () => {
      jest.spyOn(httpClient, 'post').mockReturnValue({} as any)
      service.copyWAT('wo1', 'deptC')
      expect(httpClient.post).toHaveBeenCalledWith(
        '/apis/protected/v8/workallocation/copy/workOrder',
        { id: 'wo1', name: 'Work order - deptC' },
      )
    })
  })

  describe('fetchAllWATRequestBySearch', () => {
    it('should include departmentName from userProfile when present', () => {
      configService.userProfile = { departmentName: 'deptD' }
      jest.spyOn(httpClient, 'post').mockReturnValue({} as any)
      service.fetchAllWATRequestBySearch('query1', 'active')
      expect(httpClient.post).toHaveBeenCalledWith(
        '/apis/protected/v8/workallocation/getWorkOrders',
        expect.objectContaining({ departmentName: 'deptD', query: 'query1', status: 'active' }),
      )
    })

    it('should fallback to empty string when userProfile is absent', () => {
      configService.userProfile = null
      jest.spyOn(httpClient, 'post').mockReturnValue({} as any)
      service.fetchAllWATRequestBySearch('query2', 'closed')
      expect(httpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ departmentName: '' }),
      )
    })
  })

  describe('fetchUserByWID', () => {
    it('should GET user by work id', () => {
      jest.spyOn(httpClient, 'get').mockReturnValue({} as any)
      service.fetchUserByWID('wid1')
      expect(httpClient.get).toHaveBeenCalledWith(
        '/apis/protected/v8/workallocation/getUserBasicInfo/wid1',
      )
    })
  })

  describe('getPDF', () => {
    it('should GET pdf blob with responseType blob', () => {
      jest.spyOn(httpClient, 'get').mockReturnValue({} as any)
      service.getPDF('wo1')
      expect(httpClient.get).toHaveBeenCalledWith(
        '/apis/protected/v8/workallocation/getWOPdf/wo1',
        { responseType: 'blob' },
      )
    })
  })
})
