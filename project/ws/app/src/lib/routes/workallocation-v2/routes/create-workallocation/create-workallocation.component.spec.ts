import { CreateWorkallocationComponent } from './create-workallocation.component'
import { of, Subject } from 'rxjs'

describe('CreateWorkallocationComponent', () => {
  let component: CreateWorkallocationComponent
  let watStore: any
  let allocateSrvc: any
  let snackBar: any
  let router: any
  let route: any
  let document: any
  let dialog: any

  let activitiesGroup$: Subject<any>
  let competencyGroup$: Subject<any>
  let compGrp$: Subject<any>
  let officerGroup$: Subject<any>
  let errorCount$: Subject<any>
  let currentProgress$: Subject<any>
  let triggerSave$: Subject<any>

  const buildStore = () => {
    activitiesGroup$ = new Subject<any>()
    competencyGroup$ = new Subject<any>()
    compGrp$ = new Subject<any>()
    officerGroup$ = new Subject<any>()
    errorCount$ = new Subject<any>()
    currentProgress$ = new Subject<any>()
    triggerSave$ = new Subject<any>()

    return {
      setworkOrderId: '',
      setOfficerId: '',
      getOfficerId: 'officer-1',
      getworkOrderId: 'wo-1',
      getactivitiesGroup: activitiesGroup$.asObservable(),
      getcompetencyGroup: competencyGroup$.asObservable(),
      get_compGrp: compGrp$.asObservable(),
      getOfficerGroup: officerGroup$.asObservable(),
      getErrorCount: errorCount$.asObservable(),
      getCurrentProgress: currentProgress$.asObservable(),
      triggerSave: jest.fn(() => triggerSave$.asObservable()),
      getUpdateCompGroupById: jest.fn(() => null),
      clear: jest.fn(),
    }
  }

  const createComponent = (routeParams: any = {}, snapshotData: any = {}) => {
    watStore = buildStore()
    allocateSrvc = {
      createAllocationV2: jest.fn(() => of({ id: 'created' })),
      updateAllocationV2: jest.fn(() => of({ id: 'updated' })),
    }
    snackBar = { open: jest.fn() }
    router = { navigate: jest.fn() }
    route = {
      params: of(routeParams),
      snapshot: { data: snapshotData },
    }
    document = { location: { reload: jest.fn() } }
    dialog = { open: jest.fn() }

    component = new CreateWorkallocationComponent(
      watStore,
      allocateSrvc,
      snackBar,
      router,
      route,
      document,
      dialog,
    )
    return component
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('constructor', () => {
    it('sets workOrderId/officerId from route params and stores them in watStore', () => {
      createComponent({ workorder: 'wo-42', officerId: 'off-42' })
      expect(component.workOrderId).toBe('wo-42')
      expect(component.officerId).toBe('off-42')
    })

    it('opens a snackbar when watStore has no officerId (no edit mode)', () => {
      watStore = buildStore()
      watStore.getOfficerId = null
      allocateSrvc = { createAllocationV2: jest.fn(), updateAllocationV2: jest.fn() }
      snackBar = { open: jest.fn() }
      router = { navigate: jest.fn() }
      route = { params: of({}), snapshot: { data: {} } }
      document = { location: { reload: jest.fn() } }
      dialog = { open: jest.fn() }
      component = new CreateWorkallocationComponent(watStore, allocateSrvc, snackBar, router, route, document, dialog)
      expect(snackBar.open).toHaveBeenCalledWith('Please save this work order and open in edit mode for Auto Save')
    })

    it('does not open snackbar when watStore has officerId', () => {
      createComponent({})
      expect(snackBar.open).not.toHaveBeenCalled()
    })

    it('reads pageData from route snapshot', () => {
      createComponent({}, { pageData: { data: { externalUrls: [{ key: 'k', value: 'v' }] } } })
      expect(component.pageData).toEqual({ externalUrls: [{ key: 'k', value: 'v' }] })
    })
  })

  describe('ngOnInit', () => {
    it('calls setEditData when officerId is present', () => {
      createComponent({ officerId: 'off-1' }, { watData: { data: { id: 'wat-1', userName: 'John' } } })
      const spy = jest.spyOn(component, 'setEditData')
      component.ngOnInit()
      expect(spy).toHaveBeenCalled()
      expect(component.editDataStruct).toBeTruthy()
      expect(component.editDataStruct.id).toBe('wat-1')
    })

    it('does not call setEditData when officerId is absent', () => {
      createComponent({})
      const spy = jest.spyOn(component, 'setEditData')
      component.ngOnInit()
      expect(spy).not.toHaveBeenCalled()
    })

    it('subscribes to form data and auto save', () => {
      createComponent({})
      component.ngOnInit()
      expect(component.officerFormSubscription).toBeTruthy()
      expect(watStore.triggerSave).toHaveBeenCalled()
    })
  })

  describe('setEditData', () => {
    it('builds editDataStruct from route snapshot watData', () => {
      createComponent({}, {
        watData: {
          data: {
            roleCompetencyList: ['r1'],
            unmappedActivities: ['a1'],
            unmappedCompetencies: ['c1'],
            userName: 'Jane',
            userId: 'u1',
            userEmail: 'jane@x.com',
            userPosition: 'pos',
            positionId: 'p1',
            positionDescription: 'desc',
            createdBy: 'admin',
            id: 'id1',
            createdByName: 'Admin',
          },
        },
      })
      component.setEditData()
      expect(component.editDataStruct).toEqual({
        roleCompetencyList: ['r1'],
        unmappedActivities: ['a1'],
        unmappedCompetencies: ['c1'],
        user: { officerName: 'Jane', userId: 'u1', userEmail: 'jane@x.com' },
        position: { userPosition: 'pos', positionId: 'p1', positionDescription: 'desc' },
        createdBy: 'admin',
        id: 'id1',
        createdByName: 'Admin',
      })
    })

    it('does nothing when no watData present', () => {
      createComponent({}, {})
      component.setEditData()
      expect(component.editDataStruct).toBeUndefined()
    })
  })

  describe('getOfficerDataEdit / getActivityDataEdit / getCompDataEdit', () => {
    it('return null when editDataStruct is not set', () => {
      createComponent({})
      expect(component.getOfficerDataEdit).toBeNull()
      expect(component.getActivityDataEdit).toBeNull()
      expect(component.getCompDataEdit).toBeNull()
    })

    it('return derived data when editDataStruct is set', () => {
      createComponent({}, {
        watData: {
          data: {
            roleCompetencyList: ['r1'],
            unmappedActivities: [{ id: 'a1', name: 'Act1', description: 'desc', submittedToName: 'n', submittedToId: 'id', submittedToEmail: 'e' }],
            unmappedCompetencies: [{ id: 'c1', name: 'Comp1', description: 'cd', level: 'L1', additionalProperties: { competencyType: 'T', competencyArea: 'A' } }],
            userName: 'Jane',
          },
        },
      })
      component.setEditData()

      expect(component.getOfficerDataEdit).toEqual({ usr: component.editDataStruct.user, position: component.editDataStruct.position })

      const actEdit = component.getActivityDataEdit
      expect(actEdit && actEdit.list).toEqual(['r1'])
      expect(actEdit && actEdit.unmdA[0]).toEqual({
        activityId: 'a1',
        activityName: 'Act1',
        activityDescription: 'desc',
        assignedTo: 'n',
        assignedToId: 'id',
        assignedToEmail: 'e',
      })

      const compEdit = component.getCompDataEdit
      expect(compEdit && compEdit.list).toEqual(['r1'])
      expect(compEdit && compEdit.unmdC[0]).toEqual({
        compId: 'c1',
        compName: 'Comp1',
        compDescription: 'cd',
        compLevel: 'L1',
        compType: 'T',
        compArea: 'A',
      })
    })
  })

  describe('onScroll', () => {
    beforeEach(() => {
      createComponent({})
    })

    it('does nothing when offsets are not fully set', () => {
      component.selectedTab = 'officer'
      component.onScroll({})
      expect(component.selectedTab).toBe('officer')
    })

    it('selects officer tab when offset in officer range', () => {
      component.officerOffset = 0
      component.activitiesOffset = 100
      component.competenciesOffset = 200
      component.competencyDetailsOffset = 300
      Object.defineProperty(window, 'pageYOffset', { value: 0, configurable: true })
      component.onScroll({})
      expect(component.selectedTab).toBe('officer')
    })

    it('selects activities tab when offset in activities range', () => {
      component.officerOffset = 0
      component.activitiesOffset = 10
      component.competenciesOffset = 200
      component.competencyDetailsOffset = 300
      Object.defineProperty(window, 'pageYOffset', { value: 15, configurable: true })
      component.onScroll({})
      expect(component.selectedTab).toBe('activities')
    })

    it('selects competencies tab when offset in competencies range', () => {
      component.officerOffset = 0
      component.activitiesOffset = 10
      component.competenciesOffset = 20
      component.competencyDetailsOffset = 300
      Object.defineProperty(window, 'pageYOffset', { value: 25, configurable: true })
      component.onScroll({})
      expect(component.selectedTab).toBe('competencies')
    })

    it('selects competencyDetails tab when offset beyond competencyDetails', () => {
      component.officerOffset = 0
      component.activitiesOffset = 10
      component.competenciesOffset = 20
      component.competencyDetailsOffset = 30
      Object.defineProperty(window, 'pageYOffset', { value: 40, configurable: true })
      component.onScroll({})
      expect(component.selectedTab).toBe('competencyDetails')
    })

    it('falls back to officer tab when offset below officerOffset', () => {
      component.officerOffset = 50
      component.activitiesOffset = 100
      component.competenciesOffset = 200
      component.competencyDetailsOffset = 300
      Object.defineProperty(window, 'pageYOffset', { value: 0, configurable: true })
      component.onScroll({})
      expect(component.selectedTab).toBe('officer')
    })
  })

  describe('ngAfterViewInit', () => {
    it('computes offsets from viewchild elements', () => {
      jest.useFakeTimers()
      createComponent({})
      component.officerElement = { nativeElement: { offsetTop: 200 } } as any
      component.activitiesElement = { nativeElement: { offsetTop: 400 } } as any
      component.competenciesElement = { nativeElement: { offsetTop: 600 } } as any
      component.competencyDetailsElement = { nativeElement: { offsetTop: 800 } } as any

      component.ngAfterViewInit()

      expect(component.officerOffset).toBe(200 - 146)
      expect(component.activitiesOffset).toBe(400 - 146)
      expect(component.competenciesOffset).toBe(600 - 146)
      expect(component.competencyDetailsOffset).toBe(800 - 146)

      jest.advanceTimersByTime(1000)
      jest.useRealTimers()
    })
  })

  describe('getExternalUrl', () => {
    it('returns matched field for key', () => {
      createComponent({}, { pageData: { data: { externalUrls: [{ key: 'help', url: 'http://help' }] } } })
      expect(component.getExternalUrl('help', 'url')).toBe('http://help')
    })

    it('returns undefined when key not found', () => {
      createComponent({}, { pageData: { data: { externalUrls: [] } } })
      expect(component.getExternalUrl('missing', 'url')).toBeUndefined()
    })
  })

  describe('filterComp', () => {
    it('sets selectedTab and scrolls element into view', () => {
      createComponent({})
      const scrollIntoView = jest.fn()
      component.filterComp({ scrollIntoView }, 'activities')
      expect(component.selectedTab).toBe('activities')
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start', inline: 'nearest' })
    })
  })

  describe('getsubPath / getOfficerName', () => {
    it('returns the current subpath', () => {
      createComponent({})
      component.selectedTab = 'activities'
      expect(component.getsubPath).toBe('./#activities')
    })

    it('returns officer name from dataStructure if present', () => {
      createComponent({})
      component.dataStructure = { officerFormData: { officerName: 'Alice' } }
      expect(component.getOfficerName).toBe('Alice')
    })

    it('falls back to editDataStruct officer name', () => {
      createComponent({})
      component.dataStructure = {}
      component.editDataStruct = { user: { officerName: 'Bob' } }
      expect(component.getOfficerName).toBe('Bob')
    })
  })

  describe('fetchFormsData', () => {
    it('updates dataStructure from watStore subscriptions', () => {
      createComponent({})
      component.fetchFormsData()

      activitiesGroup$.next([{ groupName: 'g1' }])
      expect(component.dataStructure.activityGroups).toEqual([{ groupName: 'g1' }])

      competencyGroup$.next([{ roleName: 'r1' }])
      expect(component.dataStructure.compGroups).toEqual([{ roleName: 'r1' }])

      compGrp$.next([{ compId: 'c1' }])
      expect(component.dataStructure.compDetails).toEqual([{ compId: 'c1' }])

      officerGroup$.next({ officerName: 'X' })
      expect(component.dataStructure.officerFormData).toEqual({ officerName: 'X' })

      errorCount$.next(3)
      expect(component.dataStructure.errorCount).toBe(3)

      currentProgress$.next(50)
      expect(component.dataStructure.currentProgress).toBe(50)
    })

    it('does not overwrite activityGroups/compGroups with empty arrays', () => {
      createComponent({})
      component.fetchFormsData()
      activitiesGroup$.next([])
      expect(component.dataStructure.activityGroups).toBeUndefined()
      competencyGroup$.next([])
      expect(component.dataStructure.compGroups).toBeUndefined()
      compGrp$.next([])
      expect(component.dataStructure.compDetails).toBeUndefined()
    })
  })

  describe('getWorkOrderId / getUserDetails', () => {
    it('returns workOrderId when present', () => {
      createComponent({ workorder: 'wo-1' })
      expect(component.getWorkOrderId).toBe('wo-1')
    })

    it('returns null when workOrderId is absent', () => {
      createComponent({})
      expect(component.getWorkOrderId).toBeNull()
    })

    it('returns officer details when officerFormData.user present', () => {
      createComponent({})
      component.dataStructure = {
        officerFormData: {
          user: { userId: 'u1' },
          positionObj: { id: 'p1' },
          officerName: 'Alice',
          position: 'Manager',
          positionDescription: 'desc',
        },
      }
      expect(component.getUserDetails()).toEqual({
        user: { userId: 'u1' },
        positionObj: { id: 'p1' },
        officerName: 'Alice',
        position: 'Manager',
        positionDescription: 'desc',
      })
    })

    it('returns empty object when no officer data', () => {
      createComponent({})
      component.dataStructure = {}
      expect(component.getUserDetails()).toEqual({})
    })
  })

  describe('getRoles / getUnmappedActivity / getUnmappedCompetency', () => {
    it('builds roles from activityGroups and compGroups, skipping the first group', () => {
      createComponent({})
      component.dataStructure = {
        activityGroups: [
          { groupName: 'unmapped', activities: [] },
          {
            groupName: 'role1',
            groupDescription: 'roleDesc',
            activities: [
              { activityId: 'a1', activityName: 'Act1', activityDescription: 'd1', assignedTo: 'n1' },
              { activityId: 'a2', activityName: 'Act2' },
            ],
          },
        ],
        compGroups: [
          { roleName: 'role1', competincies: [{ localId: 1, compName: 'Comp1', compDescription: 'cd' }] },
        ],
      }
      const roles = component.getRoles
      expect(roles.length).toBe(1)
      expect(roles[0].roleDetails.name).toBe('role1')
      expect(roles[0].roleDetails.childNodes.length).toBe(1)
      expect(roles[0].roleDetails.childNodes[0].id).toBe('a1')
      expect(roles[0].competencyDetails[0].name).toBe('Comp1')
    })

    it('returns empty array when no activityGroups', () => {
      createComponent({})
      component.dataStructure = {}
      expect(component.getRoles).toEqual([])
    })

    it('extracts unmapped activities from the first activity group', () => {
      createComponent({})
      component.dataStructure = {
        activityGroups: [
          { activities: [{ activityId: 'a1', activityDescription: 'd', assignedTo: 'n' }, { activityId: 'a2' }] },
        ],
      }
      const result = component.getUnmappedActivity()
      expect(result.length).toBe(1)
      expect((result[0] as any).id).toBe('a1')
    })

    it('returns empty array when no activityGroups for unmapped activity', () => {
      createComponent({})
      component.dataStructure = {}
      expect(component.getUnmappedActivity()).toEqual([])
    })

    it('extracts unmapped competencies from the first comp group', () => {
      createComponent({})
      component.dataStructure = {
        compGroups: [{ competincies: [{ localId: 1, compName: 'Comp1', compDescription: 'cd' }] }],
      }
      const result = component.getUnmappedCompetency()
      expect(result.length).toBe(1)
      expect((result[0] as any).name).toBe('Comp1')
    })

    it('returns empty array when no compGroups for unmapped competency', () => {
      createComponent({})
      component.dataStructure = {}
      expect(component.getUnmappedCompetency()).toEqual([])
    })
  })

  describe('saveWAT', () => {
    it('does nothing structural but shows error when no workOrderId', () => {
      createComponent({})
      component.saveWAT()
      expect(snackBar.open).toHaveBeenCalledWith('Error in updating Work order, please try again!', 'X', { duration: 5000 })
    })

    it('opens dialog and skips save when officer is invalid', () => {
      createComponent({ workorder: 'wo-1' })
      component.dataStructure = {}
      component.saveWAT()
      expect(dialog.open).toHaveBeenCalled()
      expect(allocateSrvc.createAllocationV2).not.toHaveBeenCalled()
    })

    it('saves successfully, clears store and navigates when not autoSave', () => {
      createComponent({ workorder: 'wo-1' })
      component.dataStructure = {
        officerFormData: {
          user: { userId: 'u1', profileDetails: { personalDetails: { primaryEmail: 'e@x.com' } } },
          officerName: 'Alice',
          positionObj: { id: 'p1' },
        },
      }
      component.saveWAT(false, false)
      expect(allocateSrvc.createAllocationV2).toHaveBeenCalled()
      expect(snackBar.open).toHaveBeenCalledWith('Work order saved successfully!', 'X', { duration: 5000 })
      expect(watStore.clear).toHaveBeenCalled()
      expect(router.navigate).toHaveBeenCalledWith(['/app/workallocation/drafts', 'wo-1'])
    })

    it('reloads document when reload flag is set', () => {
      createComponent({ workorder: 'wo-1' })
      component.dataStructure = {
        officerFormData: {
          user: { userId: 'u1', profileDetails: { personalDetails: { primaryEmail: 'e@x.com' } } },
          officerName: 'Alice',
          positionObj: { id: 'p1' },
        },
      }
      component.saveWAT(true, true)
      expect(document.location.reload).toHaveBeenCalled()
      expect(router.navigate).toHaveBeenCalledWith(['/app/workallocation/update', 'wo-1', 'officer-1'])
    })
  })

  describe('updateWat', () => {
    it('does nothing when serverCall is false', () => {
      createComponent({ workorder: 'wo-1' })
      component.updateWat(true, false, false)
      expect(allocateSrvc.updateAllocationV2).not.toHaveBeenCalled()
    })

    it('shows error when workOrderId missing', () => {
      createComponent({})
      component.updateWat(true, false, true)
      expect(snackBar.open).toHaveBeenCalledWith('Error! Work order not found, please try again!', 'X', { duration: 5000 })
    })

    it('opens dialog when officer invalid', () => {
      createComponent({ workorder: 'wo-1' })
      component.dataStructure = {}
      component.updateWat(true, false, true)
      expect(dialog.open).toHaveBeenCalled()
      expect(allocateSrvc.updateAllocationV2).not.toHaveBeenCalled()
    })

    it('updates successfully and navigates on non-autoSave', done => {
      createComponent({ workorder: 'wo-1' })
      component.dataStructure = {
        officerFormData: { user: { userId: 'u1' }, officerName: 'Alice', positionObj: { id: 'p1' } },
      }
      component.editDataStruct = { id: 'wat-1', createdBy: 'admin', createdByName: 'Admin' }
      component.updateWat(false, false, true)
      setTimeout(() => {
        expect(allocateSrvc.updateAllocationV2).toHaveBeenCalled()
        expect(snackBar.open).toHaveBeenCalledWith('Work order updated successfully!', 'X', { duration: 5000 })
        expect(watStore.clear).toHaveBeenCalled()
        done()
      }, 600)
    })

    it('shows error snackbar when update response is falsy', done => {
      createComponent({ workorder: 'wo-1' })
      allocateSrvc.updateAllocationV2 = jest.fn(() => of(null))
      component.dataStructure = {
        officerFormData: { user: { userId: 'u1', userEmail: 'u1@x.com' }, officerName: 'Alice', positionObj: { id: 'p1' } },
      }
      component.editDataStruct = { id: 'wat-1' }
      component.updateWat(false, false, true)
      setTimeout(() => {
        expect(snackBar.open).toHaveBeenCalledWith('Error in saving Work order, please try again!', 'X', { duration: 5000 })
        done()
      }, 600)
    })
  })

  describe('getStrcuturedReq / getStrcuturedReqUpdate', () => {
    it('getStrcuturedReq returns null and opens dialog on invalid officer', () => {
      createComponent({})
      component.dataStructure = {}
      expect(component.getStrcuturedReq()).toBeNull()
      expect(dialog.open).toHaveBeenCalled()
    })

    it('getStrcuturedReq builds request object for valid officer', () => {
      createComponent({ workorder: 'wo-1' })
      component.dataStructure = {
        officerFormData: {
          user: { userId: 'u1', profileDetails: { personalDetails: { primaryEmail: 'e@x.com' } } },
          officerName: 'Alice',
          position: 'Manager',
          positionDescription: 'desc',
          positionObj: { id: 'p1' },
        },
        currentProgress: 50,
        errorCount: 0,
      }
      const req = component.getStrcuturedReq()
      expect(req.userId).toBe('u1')
      expect(req.userEmail).toBe('e@x.com')
      expect(req.positionId).toBe('p1')
      expect(req.workOrderId).toBe('wo-1')
    })

    it('getStrcuturedReqUpdate returns null and opens dialog on invalid officer', () => {
      createComponent({})
      component.dataStructure = {}
      expect(component.getStrcuturedReqUpdate()).toBeNull()
      expect(dialog.open).toHaveBeenCalled()
    })

    it('getStrcuturedReqUpdate builds request object with editDataStruct metadata', () => {
      createComponent({ workorder: 'wo-1' })
      component.dataStructure = {
        officerFormData: {
          user: { userId: 'u1', userEmail: 'u1@x.com' },
          officerName: 'Alice',
          position: 'Manager',
          positionDescription: 'desc',
          positionObj: { positionId: 'pos1' },
        },
        currentProgress: 70,
        errorCount: 1,
      }
      component.editDataStruct = { createdBy: 'admin', id: 'wat-1', createdByName: 'Admin' }
      const req = component.getStrcuturedReqUpdate()
      expect(req.userId).toBe('u1')
      expect(req.positionId).toBe('pos1')
      expect(req.createdBy).toBe('admin')
      expect(req.id).toBe('wat-1')
      expect(req.createdByName).toBe('Admin')
    })
  })

  describe('autoSave', () => {
    it('triggers update when officer has userId and editDataStruct.id exists', () => {
      createComponent({ workorder: 'wo-1' })
      component.editDataStruct = { id: 'wat-1' }
      component.dataStructure = {
        officerFormData: { user: { userId: 'u1' }, officerName: 'Alice' },
      }
      const spy = jest.spyOn(component, 'updateWat')
      component.autoSave()
      triggerSave$.next({ reload: false, serverCall: true })
      expect(spy).toHaveBeenCalled()
    })

    it('does not trigger update when officer info missing mandatory fields', () => {
      createComponent({ workorder: 'wo-1' })
      component.editDataStruct = { id: 'wat-1' }
      component.dataStructure = {}
      const spy = jest.spyOn(component, 'updateWat')
      component.autoSave()
      triggerSave$.next({ reload: false, serverCall: true })
      expect(spy).not.toHaveBeenCalled()
    })

    it('does nothing when getWorkOrderId is null', () => {
      createComponent({})
      const spy = jest.spyOn(component, 'updateWat')
      component.autoSave()
      triggerSave$.next({ reload: false, serverCall: true })
      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('ngOnDestroy', () => {
    it('unsubscribes all subscriptions and clears the store', () => {
      createComponent({})
      component.ngOnInit()
      component.ngOnDestroy()
      expect(watStore.clear).toHaveBeenCalled()
    })
  })
})
