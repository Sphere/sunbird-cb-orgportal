import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { of } from 'rxjs'

import { CompetenciesComponent } from './competencies.component'
import { UsersService } from '../../../users/services/users.service'

describe('CompetenciesComponent', () => {
  let component: CompetenciesComponent
  let fixture: ComponentFixture<CompetenciesComponent>
  let usersService: any
  let router: any

  beforeEach(async () => {
    usersService = {
      getAllKongUsers: jest.fn().mockReturnValue(of({
        result: {
          response: {
            content: [
              { isDeleted: false, firstName: 'John', lastName: 'Doe', id: 'u1', blocked: false, email: 'j@d.com' },
            ],
          },
        },
      })),
    }
    router = { navigate: jest.fn() }

    await TestBed.configureTestingModule({
      declarations: [CompetenciesComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              parent: { data: { configService: { unMappedUser: { rootOrg: { rootOrgId: 'org1' } } } } },
            },
          },
        },
        { provide: Router, useValue: router },
        { provide: UsersService, useValue: usersService },
      ],
    }).compileComponents()

    fixture = TestBed.createComponent(CompetenciesComponent)
    component = fixture.componentInstance
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('sets topBarConfig, tableData, and fetches user competency data', () => {
      fixture.detectChanges()
      expect(component.topBarConfig.right[0].actioName).toBe('addCompetency')
      expect(component.tableData.columns.length).toBe(6)
      expect(usersService.getAllKongUsers).toHaveBeenCalledWith('org1')
      expect(component.usersData.length).toBe(1)
      expect(component.usersData[0].fullName).toBe('John Doe')
    })
  })

  describe('ngOnDestroy', () => {
    it('does not throw', () => {
      expect(() => component.ngOnDestroy()).not.toThrow()
    })
  })

  describe('getAllUserCompetency', () => {
    it('formats response via utilityService and sets usersData', () => {
      component.getAllUserCompetency()
      expect(component.usersData.length).toBe(1)
      expect(component.usersData[0].email).toBe('j@d.com')
    })
  })

  describe('searchByEnterKey', () => {
    it('refetches user competency when the search event is empty', () => {
      const spy = jest.spyOn(component, 'getAllUserCompetency')
      component.searchByEnterKey('')
      expect(spy).toHaveBeenCalled()
    })

    it('does not refetch when the search event is non-empty', () => {
      const spy = jest.spyOn(component, 'getAllUserCompetency')
      component.searchByEnterKey('abc')
      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('onRowClick', () => {
    it('navigates to the competency detail route for the clicked row', () => {
      component.onRowClick({ userId: 'u1' })
      expect(router.navigate).toHaveBeenCalledWith(['app/home/competencies/u1'])
    })
  })
})
