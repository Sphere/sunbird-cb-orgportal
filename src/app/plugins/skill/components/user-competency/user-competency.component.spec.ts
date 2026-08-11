import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { ActivatedRoute, Router } from '@angular/router'
import { of } from 'rxjs'

import { UserCompetencyComponent } from './user-competency.component'
import { CompetencyService } from '../../services/competency.service'
import { UsersService } from '../../services/users.service'

describe('UserCompetencyComponent', () => {
  let component: UserCompetencyComponent
  let fixture: ComponentFixture<UserCompetencyComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [UserCompetencyComponent],
      providers: [
        {
          provide: MatDialog,
          useValue: { open: jest.fn().mockReturnValue({ afterClosed: () => of(undefined) }) },
        },
        {
          provide: Router,
          useValue: { navigate: jest.fn(), navigateByUrl: jest.fn(), events: of() },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: jest.fn().mockReturnValue(null) },
              params: {},
              queryParams: {},
              data: {},
            },
            queryParams: of({}),
            params: of({}),
            data: of({}),
          },
        },
        {
          provide: CompetencyService,
          useValue: {
            getAllEntity: jest.fn().mockReturnValue(of({ result: { response: [] } })),
            getFormatedData: jest.fn().mockReturnValue([]),
            getUserPassbook: jest.fn().mockReturnValue(of({ result: { content: [] } })),
            updatePassbook: jest.fn().mockReturnValue(of({})),
            formatedUserCompetency: jest.fn().mockReturnValue([]),
          },
        },
        {
          provide: UsersService,
          useValue: {
            getUserById: jest.fn().mockReturnValue(of({})),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(UserCompetencyComponent)
    component = fixture.componentInstance
    const usersSvc: any = TestBed.inject(UsersService)
    usersSvc.getUserById.mockReturnValue(of({}))
    const competencySvc: any = TestBed.inject(CompetencyService)
    competencySvc.getAllEntity.mockReturnValue(of({}))
    competencySvc.getUserPassbook.mockReturnValue(of({}))
    competencySvc.formatedUserCompetency.mockReturnValue([])
    competencySvc.updatePassbook.mockReturnValue(of(null))
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('getUserId', () => {
    it('should navigate away when route has no id param', () => {
      const route: any = TestBed.inject(ActivatedRoute)
      route.snapshot.paramMap.get.mockReturnValue(null)
      const router = TestBed.inject(Router)
      component.getUserId()
      expect(router.navigate).toHaveBeenCalledWith(['app/home/competencies'])
    })

    it('should call getUserDetails when id param is present', () => {
      const route: any = TestBed.inject(ActivatedRoute)
      route.snapshot.paramMap.get.mockReturnValue('u1')
      const usersSvc: any = TestBed.inject(UsersService)
      component.getUserId()
      expect(component.userID).toBe('u1')
      expect(usersSvc.getUserById).toHaveBeenCalledWith('u1')
    })
  })

  describe('getUserDetails', () => {
    it('should set userDetails from usersSvc response', () => {
      const usersSvc: any = TestBed.inject(UsersService)
      usersSvc.getUserById.mockReturnValue(of({ userName: 'John' }))
      component.userID = 'u1'
      component.getUserDetails()
      expect(component.userDetails).toEqual({ userName: 'John' })
    })
  })

  describe('getCompitencies', () => {
    it('should not subscribe when allEntity is falsy', () => {
      component.allEntity = null
      const competencySvc: any = TestBed.inject(CompetencyService)
      competencySvc.formatedUserCompetency.mockClear()
      component.getCompitencies()
      expect(competencySvc.formatedUserCompetency).not.toHaveBeenCalled()
    })

    it('should set competenciesList when allEntity is truthy', () => {
      const competencySvc: any = TestBed.inject(CompetencyService)
      competencySvc.formatedUserCompetency.mockReturnValue(['x'])
      component.allEntity = of({ result: { response: [] } })
      component.getCompitencies()
      expect(component.competenciesList).toEqual(['x'])
    })
  })

  describe('openAddComperencyDialog', () => {
    it('should refresh competencies when dialog closes with updated true', () => {
      const dialog: any = TestBed.inject(MatDialog)
      dialog.open.mockReturnValue({ afterClosed: () => of({ updated: true }) })
      const spy = jest.spyOn(component, 'getCompitencies').mockImplementation(() => undefined)
      component.openAddComperencyDialog()
      expect(spy).toHaveBeenCalled()
    })

    it('should not refresh competencies when dialog closes without updated flag', () => {
      const dialog: any = TestBed.inject(MatDialog)
      dialog.open.mockReturnValue({ afterClosed: () => of(undefined) })
      const spy = jest.spyOn(component, 'getCompitencies').mockImplementation(() => undefined)
      component.openAddComperencyDialog()
      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('selectedCompetency', () => {
    it('should return displayName when value matches', () => {
      expect(component.selectedCompetency('c1')).toBe('Procurement and Distribution of HCM')
    })

    it('should return empty string when value does not match', () => {
      expect(component.selectedCompetency('unknown')).toBe('')
    })
  })

  describe('getFinalColumns', () => {
    it('should return the fixed columns array', () => {
      expect(component.getFinalColumns()).toEqual(['level', 'source', 'date', 'remarks'])
    })
  })

  describe('openProficiencyLevelDialog', () => {
    it('should call addCompetency when dialog returns comments', () => {
      const dialog: any = TestBed.inject(MatDialog)
      dialog.open.mockReturnValue({ afterClosed: () => of({ formData: { comments: 'good' } }) })
      const spy = jest.spyOn(component, 'addCompetency').mockImplementation(() => undefined)
      component.openProficiencyLevelDialog(2, { title: 'Comp', competencyId: 'c1' })
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ reports: 'good' }))
    })

    it('should not call addCompetency when dialog returns no comments', () => {
      const dialog: any = TestBed.inject(MatDialog)
      dialog.open.mockReturnValue({ afterClosed: () => of({}) })
      const spy = jest.spyOn(component, 'addCompetency').mockImplementation(() => undefined)
      component.openProficiencyLevelDialog(2, { title: 'Comp', competencyId: 'c1' })
      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('addCompetency', () => {
    it('should refresh competencies when updatePassbook returns data', () => {
      const competencySvc: any = TestBed.inject(CompetencyService)
      competencySvc.updatePassbook.mockReturnValue(of({ result: 'ok' }))
      const spy = jest.spyOn(component, 'getCompitencies').mockImplementation(() => undefined)
      component.addCompetency({ competencyId: 'c1', competencyLevelId: 2, competencyName: 'Comp', reports: 'r' })
      expect(spy).toHaveBeenCalled()
    })

    it('should not refresh competencies when updatePassbook returns falsy', () => {
      const competencySvc: any = TestBed.inject(CompetencyService)
      competencySvc.updatePassbook.mockReturnValue(of(null))
      const spy = jest.spyOn(component, 'getCompitencies').mockImplementation(() => undefined)
      component.addCompetency({ competencyId: 'c1', competencyLevelId: 2, competencyName: 'Comp', reports: 'r' })
      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject without throwing', () => {
      expect(() => component.ngOnDestroy()).not.toThrow()
    })
  })
})
