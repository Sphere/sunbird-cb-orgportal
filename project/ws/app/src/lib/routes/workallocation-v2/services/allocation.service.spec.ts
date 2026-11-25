import { TestBed } from '@angular/core/testing'
import { HttpClient } from '@angular/common/http'
import { of } from 'rxjs'

import { AllocationService } from './allocation.service'

describe('AllocationService', () => {
  let service: AllocationService
  let http: any

  beforeEach(() => {
    http = {
      get: jest.fn().mockReturnValue(of({})),
      post: jest.fn().mockReturnValue(of({})),
    }

    TestBed.configureTestingModule({
      providers: [
        AllocationService,
        { provide: HttpClient, useValue: http },
      ],
    })

    service = TestBed.inject(AllocationService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('onSearchUser calls get with the search-user endpoint', () => {
    service.onSearchUser('abc').subscribe()
    expect(http.get).toHaveBeenCalledWith('apis/proxies/v8/user/v1/autocomplete/abc')
  })

  it('onSearchRole calls get with the search-role endpoint', () => {
    service.onSearchRole('r1').subscribe()
    expect(http.get).toHaveBeenCalledWith('apis/protected/v8/roleactivity/r1')
  })

  it('onSearchPosition posts the request to the search-nodes endpoint', () => {
    const req = { a: 1 }
    service.onSearchPosition(req).subscribe()
    expect(http.post).toHaveBeenCalledWith('apis/protected/v8/frac/searchNodes', req)
  })

  it('onSearchActivity posts the request to the search-nodes endpoint', () => {
    const req = { a: 2 }
    service.onSearchActivity(req).subscribe()
    expect(http.post).toHaveBeenCalledWith('apis/protected/v8/frac/searchNodes', req)
  })

  it('onSearchCompetency calls get with the search-competency endpoint', () => {
    service.onSearchCompetency('c1').subscribe()
    expect(http.get).toHaveBeenCalledWith('/apis/protected/v8/frac/COMPETENCY/c1')
  })

  it('createAllocation posts the request to the create-allocation endpoint', () => {
    const req = { a: 3 }
    service.createAllocation(req).subscribe()
    expect(http.post).toHaveBeenCalledWith('apis/protected/v8/workallocation/add', req)
  })

  it('createAllocationV2 posts the request to the createV2 endpoint', () => {
    const req = { a: 4 }
    service.createAllocationV2(req).subscribe()
    expect(http.post).toHaveBeenCalledWith('/apis/protected/v8/workallocation/v2/add', req)
  })

  describe('updateAllocationV2', () => {
    it('posts the request when it differs from the previously cached request', () => {
      const req = { a: 5 }
      const result$ = service.updateAllocationV2(req)
      result$.subscribe()
      expect(http.post).toHaveBeenCalledWith('/apis/protected/v8/workallocation/v2/update', req)
    })

    it('returns of(EMPTY) without posting when the request equals the previously cached request', done => {
      const req = { a: 6 }
      service.updateAllocationV2(req).subscribe()
      http.post.mockClear()
      service.updateAllocationV2(req).subscribe(() => {
        expect(http.post).not.toHaveBeenCalled()
        done()
      })
    })

    it('treats an undefined request the same as an empty object on first call', () => {
      const freshService = new AllocationService(http as any)
      http.post.mockClear()
      freshService.updateAllocationV2(undefined).subscribe()
      expect(http.post).not.toHaveBeenCalled()
    })

    it('treats a falsy cached oldObj the same as an empty object', () => {
      const freshService = new AllocationService(http as any)
      ;(freshService as any).oldObj = null
      http.post.mockClear()
      freshService.updateAllocationV2({}).subscribe()
      expect(http.post).not.toHaveBeenCalled()
    })
  })

  it('updateAllocation posts the request to the update-allocation endpoint', () => {
    const req = { a: 7 }
    service.updateAllocation(req).subscribe()
    expect(http.post).toHaveBeenCalledWith('apis/protected/v8/workallocation/update', req)
  })

  it('getUsers posts the request to the users endpoint', () => {
    const req = { a: 8 }
    service.getUsers(req).subscribe()
    expect(http.post).toHaveBeenCalledWith('/apis/protected/v8/workallocation/userSearch', req)
  })

  it('getAllocationDetails posts the request to the users endpoint', () => {
    const req = { a: 9 }
    service.getAllocationDetails(req).subscribe()
    expect(http.post).toHaveBeenCalledWith('/apis/protected/v8/workallocation/userSearch', req)
  })

  it('getAllocatedUsers calls get with the get-allocated-users endpoint', () => {
    service.getAllocatedUsers('id1').subscribe()
    expect(http.get).toHaveBeenCalledWith('/apis/protected/v8/workallocation/getWorkOrderById/id1')
  })
})
