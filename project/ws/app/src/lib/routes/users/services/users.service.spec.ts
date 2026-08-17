import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'

import { UsersService } from './users.service'

describe('UsersService', () => {
  let service: UsersService
  let httpMock: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    })
    service = TestBed.inject(UsersService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should get all users and extract result.response', () => {
    service.getAllUsers({ a: 1 }).subscribe(res => expect(res).toEqual({ users: [] }))
    const req = httpMock.expectOne('/apis/proxies/v8/user/v1/search')
    expect(req.request.method).toBe('POST')
    req.flush({ result: { response: { users: [] } } })
  })

  it('should get my department', () => {
    service.getMyDepartment().subscribe(res => expect(res).toEqual({ dept: 'x' }))
    const req = httpMock.expectOne('/apis/protected/v8/portal/mdo/mydepartment?allUsers=true')
    expect(req.request.method).toBe('GET')
    req.flush({ dept: 'x' })
  })

  it('should update profile details via PATCH', () => {
    const data = { name: 'n' }
    service.updateProfileDetails(data).subscribe(res => expect(res).toEqual({ ok: true }))
    const req = httpMock.expectOne('/apis/protected/v8/user/profileDetails/updateUser')
    expect(req.request.method).toBe('PATCH')
    expect(req.request.body).toEqual(data)
    req.flush({ ok: true })
  })

  it('should create user', () => {
    const payload = { name: 'n' }
    service.createUser(payload).subscribe(res => expect(res).toEqual({ ok: true }))
    const req = httpMock.expectOne('apis/protected/v8/user/profileDetails/createUser')
    expect(req.request.method).toBe('POST')
    req.flush({ ok: true })
  })

  describe('getUserById', () => {
    it('should fetch by user id when provided and extract result.response', () => {
      service.getUserById('u1').subscribe(res => expect(res).toEqual({ name: 'John' }))
      const req = httpMock.expectOne('/apis/proxies/v8/api/user/v2/read/u1')
      expect(req.request.method).toBe('GET')
      req.flush({ result: { response: { name: 'John' } } })
    })

    it('should fetch current user when userid is empty', () => {
      service.getUserById('').subscribe(res => expect(res).toEqual({ name: 'Me' }))
      const req = httpMock.expectOne('/apis/proxies/v8/api/user/v2/read')
      expect(req.request.method).toBe('GET')
      req.flush({ result: { response: { name: 'Me' } } })
    })
  })

  it('should create user by id', () => {
    const payload = { a: 1 }
    service.createUserById('id1', payload).subscribe(res => expect(res).toEqual({ ok: true }))
    const req = httpMock.expectOne('/apis/protected/v8/user/profileRegistry/createUserRegistryV2/id1')
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual(payload)
    req.flush({ ok: true })
  })

  it('should add user to department', () => {
    const payload = { a: 1 }
    service.addUserToDepartment(payload).subscribe(res => expect(res).toEqual({ ok: true }))
    const req = httpMock.expectOne('/apis/proxies/v8/user/private/v1/assign/role')
    expect(req.request.method).toBe('POST')
    req.flush({ ok: true })
  })

  it('should get workflow history by app id', () => {
    service.getWfHistoryByAppId('app1').subscribe(res => expect(res).toEqual({ history: [] }))
    const req = httpMock.expectOne('apis/protected/v8/workflowhandler/historyByApplicationId/app1')
    expect(req.request.method).toBe('GET')
    req.flush({ history: [] })
  })

  it('should search user by email', () => {
    const payload = { a: 1 }
    service.onSearchUserByEmail('a@b.com', payload).subscribe(res => expect(res).toEqual({ ok: true }))
    const req = httpMock.expectOne('apis/protected/v8/user/autocomplete/department/a@b.com')
    expect(req.request.method).toBe('POST')
    req.flush({ ok: true })
  })

  it('should block user', () => {
    const user = { id: 'u1' }
    service.blockUser(user).subscribe(res => expect(res).toEqual({ ok: true }))
    const req = httpMock.expectOne('/apis/protected/v8/portal/mdo/deptAction/userrole/')
    expect(req.request.method).toBe('PATCH')
    req.flush({ ok: true })
  })

  it('should de-activate user', () => {
    const user = { id: 'u1' }
    service.deActiveUser(user).subscribe(res => expect(res).toEqual({ ok: true }))
    const req = httpMock.expectOne('apis/proxies/v8/user/v1/block/')
    expect(req.request.method).toBe('POST')
    req.flush({ ok: true })
  })

  it('should activate user', () => {
    const user = { id: 'u1' }
    service.activeUser(user).subscribe(res => expect(res).toEqual({ ok: true }))
    const req = httpMock.expectOne('apis/proxies/v8/user/v1/unblock/')
    expect(req.request.method).toBe('PATCH')
    req.flush({ ok: true })
  })

  it('should delete user', () => {
    const user = { id: 'u1' }
    service.deleteUser(user).subscribe(res => expect(res).toEqual({ ok: true }))
    const req = httpMock.expectOne('/apis/protected/v8/portal/mdo/deptAction/userrole/')
    expect(req.request.method).toBe('PATCH')
    req.flush({ ok: true })
  })

  it('should build request payload for newBlockUser', () => {
    service.newBlockUser('admin', 'u1').subscribe(res => expect(res).toEqual({ ok: true }))
    const req = httpMock.expectOne('/apis/proxies/v8/user/v1/block')
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual({ request: { userId: 'u1', requestedBy: 'admin' } })
    req.flush({ ok: true })
  })

  it('should build request payload for newUnBlockUser', () => {
    service.newUnBlockUser('admin', 'u1').subscribe(res => expect(res).toEqual({ ok: true }))
    const req = httpMock.expectOne('/apis/proxies/v8/user/v1/unblock')
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual({ request: { userId: 'u1', requestedBy: 'admin' } })
    req.flush({ ok: true })
  })

  it('should build request payload for getAllKongUsers', () => {
    service.getAllKongUsers('dep1').subscribe(res => expect(res).toEqual({ ok: true }))
    const req = httpMock.expectOne('/apis/proxies/v8/user/v1/search')
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual({ request: { filters: { rootOrgId: 'dep1' } } })
    req.flush({ ok: true })
  })

  it('should build request payload for searchUserByenter', () => {
    service.searchUserByenter('query1', 'dep1').subscribe(res => expect(res).toEqual({ ok: true }))
    const req = httpMock.expectOne('/apis/proxies/v8/user/v1/search')
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual({ request: { query: 'query1', filters: { rootOrgId: 'dep1' } } })
    req.flush({ ok: true })
  })

  it('should build request payload for searchUserByFilter, spreading extra filters', () => {
    service.searchUserByFilter({ status: 'active' }, 'dep1').subscribe(res => expect(res).toEqual({ ok: true }))
    const req = httpMock.expectOne('/apis/proxies/v8/user/v1/search')
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual({ request: { filters: { rootOrgId: 'dep1', status: 'active' } } })
    req.flush({ ok: true })
  })
})
