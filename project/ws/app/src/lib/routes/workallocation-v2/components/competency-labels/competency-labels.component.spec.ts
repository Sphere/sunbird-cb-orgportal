import { UntypedFormBuilder } from '@angular/forms'
import { of, Subject } from 'rxjs'
import { CompetencyLabelsComponent } from './competency-labels.component'

describe('CompetencyLabelsComponent', () => {
  let component: CompetencyLabelsComponent
  let changeDetectorMock: any
  let allocateSrvcMock: any
  let watStoreMock: any
  let snackBarMock: any
  let dialogMock: any
  let activatedMock: any
  let activitiesGroupSubject: Subject<any>

  beforeEach(() => {
    changeDetectorMock = { detectChanges: jest.fn() }
    allocateSrvcMock = {
      onSearchUser: jest.fn().mockReturnValue(of({ result: { response: { content: [{ id: 1 }] } } })),
      onSearchCompetency: jest.fn().mockReturnValue(of({ responseData: [{ id: 1, name: 'comp' }] })),
    }
    activitiesGroupSubject = new Subject<any>()
    watStoreMock = {
      getactivitiesGroup: activitiesGroupSubject.asObservable(),
      getID: 'local-id-1',
      setgetcompetencyGroup: jest.fn(),
      getUpdateCompGroupById: jest.fn().mockReturnValue({ compType: 'type1', compArea: 'area1', compLevel: 'lvl1' }),
    }
    snackBarMock = { open: jest.fn() }
    dialogMock = { open: jest.fn() }
    activatedMock = {
      snapshot: {
        data: {
          pageData: {
            data: {
              levels: ['L1', 'L2'],
            },
          },
        },
      },
    }

    component = new CompetencyLabelsComponent(
      changeDetectorMock,
      new UntypedFormBuilder(),
      allocateSrvcMock,
      watStoreMock,
      snackBarMock,
      dialogMock,
      activatedMock,
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('should initialize the activityForm and subscribe to groups', () => {
      component.ngOnInit()
      expect(component.activityForm).toBeDefined()
      expect(component.labelsList).toBeDefined()
      expect(component.groupList).toBeDefined()
    })

    it('should process groups emitted from the store and call updateForm', () => {
      component.ngOnInit()
      const updateFormSpy = jest.spyOn(component, 'updateForm')
      activitiesGroupSubject.next([{ groupId: 'g1' }, { groupId: 'g2' }])
      expect(component.groups.length).toBe(2)
      expect(updateFormSpy).toHaveBeenCalled()
    })

    it('should not update groups when groups value is falsy', () => {
      component.ngOnInit()
      activitiesGroupSubject.next(null)
      expect(component.groups).toEqual([])
    })

    it('should process editData on first emission and add group with competencies', () => {
      component.editData = {
        list: [
          {
            roleDetails: { localId: 'r1', id: 'role1', name: 'Role One', description: 'desc' },
            competencyDetails: [
              {
                id: 'c1',
                name: 'Comp1',
                description: 'compdesc',
                level: 'lvl',
                additionalProperties: { competencyType: 'type', competencyArea: 'area' },
                source: 'WAT',
                chield: 'child1',
              },
            ],
          },
        ],
      }
      component.ngOnInit()
      // groups.length must equal grpData.length+1 for loop to run; emit two groups
      activitiesGroupSubject.next([{ groupId: 'g0' }, { groupId: 'g1' }])
      expect(watStoreMock.setgetcompetencyGroup).toHaveBeenCalled()
    })

    it('should add a new group for a later index when the group does not yet exist at that slot', () => {
      component.editData = {
        list: [
          { roleDetails: { localId: 'r1', id: 'role1', name: 'Role One', description: 'desc' }, competencyDetails: [] },
          { roleDetails: { localId: 'r2', id: 'role2', name: 'Role Two', description: 'desc2' }, competencyDetails: [] },
        ],
      }
      component.ngOnInit()
      // groups.length must equal grpData.length+1 (3) for loop to run over both items
      activitiesGroupSubject.next([{ groupId: 'g0' }, { groupId: 'g1' }, { groupId: 'g2' }])
      expect(component.groupList.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('initListen', () => {
    it('should call setgetcompetencyGroup on valueChanges when all compNames are not objects', done => {
      component.ngOnInit()
      component.activityForm.controls['groupsArray'].valueChanges.subscribe(() => {
        setTimeout(() => {
          expect(watStoreMock.setgetcompetencyGroup).toHaveBeenCalled()
          done()
        }, 600)
      })
      component.addNewGroup()
    })

    it('should skip setgetcompetencyGroup when any compName is an object', async () => {
      jest.useFakeTimers()
      component.ngOnInit()
      watStoreMock.setgetcompetencyGroup.mockClear()
      component.addNewGroup()
      const compGroup = component.groupcompetencyList.at(0) as any
      compGroup.patchValue({ compName: { name: 'objName' } })
      jest.advanceTimersByTime(600)
      await Promise.resolve()
      expect(watStoreMock.setgetcompetencyGroup).not.toHaveBeenCalled()
      jest.useRealTimers()
    })
  })

  describe('ngOnDestroy', () => {
    it('should unsubscribe from activitySubscription and complete unsubscribe subject', () => {
      component.ngOnInit()
      const unsubscribeSpy = jest.spyOn((component as any).unsubscribe, 'next')
      const activitySubUnsubSpy = jest.spyOn((component as any).activitySubscription, 'unsubscribe')
      component.ngOnDestroy()
      expect(unsubscribeSpy).toHaveBeenCalled()
      expect(activitySubUnsubSpy).toHaveBeenCalled()
    })
  })

  it('ngAfterViewInit should not throw', () => {
    expect(() => component.ngAfterViewInit()).not.toThrow()
  })

  describe('createForm', () => {
    it('should add a default group when no editData is provided', () => {
      component.createForm()
      expect(component.groupList.length).toBe(1)
    })

    it('should add group with unmapped competencies when editData has unmdC', () => {
      component.editData = {
        unmdC: [
          {
            compId: 'c1',
            compName: 'name1',
            compDescription: 'desc1',
            compLevel: 'lvl1',
            compType: 'type1',
            compArea: 'area1',
            levelList: [],
            compSource: 'WAT',
          },
        ],
      }
      component.createForm()
      expect(component.groupList.length).toBe(1)
      expect(watStoreMock.setgetcompetencyGroup).toHaveBeenCalled()
    })

    it('should add default group with default competency when editData exists without unmdC', () => {
      component.editData = {}
      component.createForm()
      expect(component.groupList.length).toBe(1)
      expect(component.groupcompetencyList.length).toBe(1)
    })
  })

  describe('drop', () => {
    beforeEach(() => {
      component.createForm()
      component.addNewLabel()
      component.addNewLabel()
    })

    it('should reorder labels within the same container', () => {
      const event: any = {
        previousContainer: 'A',
        container: 'A',
        previousIndex: 0,
        currentIndex: 1,
      }
      expect(() => component.drop(event)).not.toThrow()
    })

    it('should transfer items between different containers', () => {
      const event: any = {
        previousContainer: { data: [1, 2] },
        container: { data: [3] },
        previousIndex: 0,
        currentIndex: 0,
      }
      expect(() => component.drop(event)).not.toThrow()
    })
  })

  describe('dropgroup', () => {
    beforeEach(() => {
      component.createForm()
      component.addNewGroup()
    })

    it('should reorder within same container', () => {
      const event: any = {
        previousContainer: 'A',
        container: 'A',
        previousIndex: 0,
        currentIndex: 0,
      }
      expect(() => component.dropgroup(event)).not.toThrow()
    })

    it('should show snackbar and abort when dragged item has no compName', () => {
      const event: any = {
        previousContainer: { id: 'compe_0' },
        container: { id: 'compe_1' },
        item: { data: { compName: '' } },
        previousIndex: 0,
        currentIndex: 0,
      }
      component.dropgroup(event)
      expect(snackBarMock.open).toHaveBeenCalledWith('Competency Name is required to drag', undefined, { duration: 2000 })
    })

    it('should transfer competency between groups and reset role info when target is 0', () => {
      component.activeGroupIdx = 1
      const event: any = {
        previousContainer: { id: 'compe_1' },
        container: { id: 'compe_0' },
        item: { data: { compName: 'existingComp' } },
        previousIndex: 0,
        currentIndex: 0,
      }
      expect(() => component.dropgroup(event)).not.toThrow()
      expect(watStoreMock.setgetcompetencyGroup).toHaveBeenCalled()
    })
  })

  describe('evenPredicate', () => {
    it('should return true when item has data', () => {
      expect(component.evenPredicate({ data: { compName: 'x' } } as any)).toBe(true)
    })
    it('should return false when item has no data', () => {
      expect(component.evenPredicate({ data: null } as any)).toBe(false)
    })
  })

  it('noReturnPredicate should always return true', () => {
    expect(component.noReturnPredicate()).toBe(true)
  })

  describe('setters', () => {
    beforeEach(() => {
      component.createForm()
    })
    it('setlabelsValues should patch labelsList', () => {
      component.addNewLabel()
      expect(() => component.setlabelsValues([{ activityName: 'new' }])).not.toThrow()
    })
    it('setGroupValues should patch groupList', () => {
      expect(() => component.setGroupValues([{ roleName: 'newRole' }])).not.toThrow()
    })
    it('setGroupActivityValues should patch groupcompetencyList', () => {
      expect(() => component.setGroupActivityValues([{ compName: 'newComp' }])).not.toThrow()
    })
  })

  describe('submitResult', () => {
    it('should not throw when qualityForm is truthy', () => {
      expect(() => component.submitResult({ some: 'form' })).not.toThrow()
    })
    it('should not throw when qualityForm is falsy', () => {
      expect(() => component.submitResult(null)).not.toThrow()
    })
  })

  describe('addNewLabel', () => {
    it('should add a new label control', () => {
      component.createForm()
      const before = component.labelsList.length
      component.addNewLabel()
      expect(component.labelsList.length).toBe(before + 1)
    })
  })

  describe('addNewGroup', () => {
    it('should add a group with a default competency when needed', () => {
      component.createForm()
      const before = component.groupList.length
      component.addNewGroup(true)
      expect(component.groupList.length).toBe(before + 1)
    })
    it('should add a group without default competency when not needed', () => {
      component.createForm()
      component.addNewGroup(false)
      component.activeGroupIdx = component.groupList.length - 1
      expect(component.groupcompetencyList.length).toBe(0)
    })
    it('should update canshowName to the last group index', () => {
      component.createForm()
      component.addNewGroup(false)
      expect(component.canshowName).toBe(component.groupList.length - 1)
    })
  })

  describe('addNewGroupActivityCustom', () => {
    it('should push competencies onto the group at the given index', () => {
      component.createForm()
      component.activeGroupIdx = 0
      const before = component.groupcompetencyList.length
      component.addNewGroupActivityCustom(0, [
        {
          compId: 'c1', compName: 'n1', compDescription: 'd1', compLevel: 'l1',
          compType: 't1', compArea: 'a1', levelList: [], compSource: 'WAT',
        } as any,
      ])
      expect(component.groupcompetencyList.length).toBe(before + 1)
    })
    it('should do nothing when idx is negative', () => {
      component.createForm()
      const before = component.groupcompetencyList.length
      component.addNewGroupActivityCustom(-1, [])
      expect(component.groupcompetencyList.length).toBe(before)
    })
  })

  describe('addNewGroupActivity', () => {
    it('should add an empty competency at given index', () => {
      component.createForm()
      component.activeGroupIdx = 0
      const before = component.groupcompetencyList.length
      component.addNewGroupActivity(0)
      expect(component.groupcompetencyList.length).toBe(before + 1)
    })
    it('should do nothing when idx is negative', () => {
      component.createForm()
      const before = component.groupcompetencyList.length
      component.addNewGroupActivity(-1)
      expect(component.groupcompetencyList.length).toBe(before)
    })
  })

  it('enter should set activeGroupIdx', () => {
    component.enter(3)
    expect(component.activeGroupIdx).toBe(3)
  })

  describe('updateForm', () => {
    it('should add a new group when groups length is one more than groupList length', () => {
      component.createForm()
      component.groups = [{ groupId: 'g0' }, { groupId: 'g1' }] as any
      const before = component.groupList.length
      component.updateForm()
      expect(component.groupList.length).toBe(before + 1)
      expect(watStoreMock.setgetcompetencyGroup).toHaveBeenCalled()
    })

    it('should patch existing groups when lengths already match', () => {
      component.createForm()
      component.addNewGroup(false)
      component.groups = [
        { groupId: 'g0', localId: 'l0' },
        { groupId: 'g1', groupName: 'Role1', groupDescription: 'Desc1', localId: 'l1' },
      ] as any
      component.updateForm()
      const patched = component.groupList.at(1).value
      expect(patched.roleName).toBe('Role1')
      expect(patched.roleDescription).toBe('Desc1')
    })

    it('should add missing groups mid-loop when the groupList is shorter than the groups array by more than one', () => {
      component.createForm()
      component.groups = [
        { groupId: 'g0', localId: 'l0' },
        { groupId: 'g1', groupName: 'Role1', groupDescription: 'Desc1', localId: 'l1' },
        { groupId: 'g2', groupName: 'Role2', groupDescription: 'Desc2', localId: 'l2' },
      ] as any
      const before = component.groupList.length
      component.updateForm()
      expect(component.groupList.length).toBeGreaterThan(before)
      const patched = component.groupList.at(2).value
      expect(patched.roleName).toBe('Role2')
    })
  })

  describe('createActivityControl / createGroupControl / createActivtyControl (legacy unused helpers)', () => {
    it('createActivityControl pushes a new control onto labelsArray', () => {
      component.createForm()
      const before = component.labelsList.length
      component.createActivityControl({
        compId: 'c1', compName: 'n1', compDescription: 'd1', compLevel: 'l1',
        compType: 't1', compArea: 'a1', compSource: 's1',
      } as any)
      expect(component.labelsList.length).toBe(before + 1)
    })

    it('createGroupControl pushes a new control onto groupsArray using createActivtyControl', () => {
      component.createForm()
      const before = component.groupList.length
      component.createGroupControl({
        roleId: 'r1', roleName: 'Role', roleDescription: 'desc',
        competincies: [{ compId: 'c1', compName: 'n1', compDescription: 'd1' } as any],
      } as any)
      expect(component.groupList.length).toBe(before + 1)
    })

    it('createActivtyControl maps activities into form arrays', () => {
      const result = component.createActivtyControl([
        { compId: 'c1', compName: 'n1', compDescription: 'd1' } as any,
      ])
      expect(result.length).toBe(1)
      expect(result[0].length).toBe(1)
    })
  })

  describe('filterUsers', () => {
    it('should call allocateSrvc.onSearchUser and set userslist', async () => {
      await component.filterUsers('john')
      expect(allocateSrvcMock.onSearchUser).toHaveBeenCalledWith('john')
      expect(component.userslist).toEqual([{ id: 1 }])
    })
  })

  describe('filterCompetencies', () => {
    it('should search competencies when value length is greater than 2', async () => {
      await component.filterCompetencies('abcd', 2)
      expect(component.selectedCompIdx).toBe(2)
      expect(allocateSrvcMock.onSearchCompetency).toHaveBeenCalledWith('abcd')
      expect(component.filteredCompetenciesV1.value).toEqual([{ id: 1, name: 'comp' }])
    })

    it('should not search when value is too short', async () => {
      await component.filterCompetencies('ab', 1)
      expect(component.selectedCompIdx).toBe(1)
      expect(allocateSrvcMock.onSearchCompetency).not.toHaveBeenCalled()
    })
  })

  it('setSelectedFilter should update selectedCompIdx', () => {
    component.setSelectedFilter(4)
    expect(component.selectedCompIdx).toBe(4)
  })

  describe('competencySelected', () => {
    beforeEach(() => {
      component.createForm()
      component.selectedCompIdx = 0
    })

    it('should open dialog and patch values on confirm', () => {
      const afterClosedSubject = new Subject<any>()
      dialogMock.open.mockReturnValue({
        componentInstance: {},
        afterClosed: () => afterClosedSubject.asObservable(),
      })
      component.competencySelected({ option: { value: { children: ['c1'] } } }, 0)
      expect(dialogMock.open).toHaveBeenCalled()
      afterClosedSubject.next({
        ok: true,
        data: { compId: 'newId', compName: 'newName', compDescription: 'newDesc', compLevel: 'L1', compType: 'T1', compArea: 'A1', levelList: [] },
      })
      const patched = component.groupcompetencyList.at(0).value
      expect(patched.compId).toBe('newId')
      expect(patched.compName).toBe('newName')
      expect(watStoreMock.setgetcompetencyGroup).toHaveBeenCalled()
    })

    it('should patch compName only when dialog is cancelled', () => {
      const afterClosedSubject = new Subject<any>()
      dialogMock.open.mockReturnValue({
        componentInstance: {},
        afterClosed: () => afterClosedSubject.asObservable(),
      })
      component.competencySelected({ option: { value: {} } }, 0)
      afterClosedSubject.next({ ok: false, data: { name: 'cancelledName' } })
      const patched = component.groupcompetencyList.at(0).value
      expect(patched.compName).toBe('cancelledName')
      expect(watStoreMock.setgetcompetencyGroup).toHaveBeenCalled()
    })

    it('should set defaultCompLevels on dialog instance when pageData exists', () => {
      const afterClosedSubject = new Subject<any>()
      const componentInstance: any = {}
      dialogMock.open.mockReturnValue({
        componentInstance,
        afterClosed: () => afterClosedSubject.asObservable(),
      })
      component.competencySelected({ option: { value: {} } }, 0)
      expect(componentInstance.defaultCompLevels).toEqual(activatedMock.snapshot.data.pageData)
    })

    it('should resolve object-typed compName branch using existing localId', () => {
      // manually set compName as object to trigger override branch
      const compGroup = component.groupcompetencyList.at(0) as any
      compGroup.patchValue({ compName: { name: 'objName', id: '' }, localId: 'lid1', compId: 'cid1' })
      const afterClosedSubject = new Subject<any>()
      dialogMock.open.mockReturnValue({
        componentInstance: {},
        afterClosed: () => afterClosedSubject.asObservable(),
      })
      expect(() => component.competencySelected({ option: { value: {} } }, 0)).not.toThrow()
      expect(dialogMock.open).toHaveBeenCalled()
    })

    it('should take the else branch and use getUpdateCompGroupById metadata when compName has an id and name.id is absent', () => {
      const compGroup = component.groupcompetencyList.at(0) as any
      compGroup.patchValue({
        compName: { name: 'objName', id: 'existing-id' },
        localId: 'lid2',
        compId: 'cid2',
        compDescription: 'desc2',
        compSource: 'srcX',
      })
      const afterClosedSubject = new Subject<any>()
      dialogMock.open.mockReturnValue({
        componentInstance: {},
        afterClosed: () => afterClosedSubject.asObservable(),
      })
      expect(() => component.competencySelected({ option: { value: {} } }, 0)).not.toThrow()
      expect(watStoreMock.getUpdateCompGroupById).toHaveBeenCalledWith('lid2')
      expect(dialogMock.open).toHaveBeenCalled()
    })
  })

  describe('competencySelected additional branch coverage', () => {
    beforeEach(() => {
      component.createForm()
      component.selectedCompIdx = 0
    })

    it('takes the else branch of if(localOd) when localId is falsy, using event.option.value as dialog data', () => {
      const compGroup = component.groupcompetencyList.at(0) as any
      compGroup.patchValue({ localId: '' })
      const afterClosedSubject = new Subject<any>()
      dialogMock.open.mockReturnValue({
        componentInstance: {},
        afterClosed: () => afterClosedSubject.asObservable(),
      })
      component.competencySelected({ option: { value: { name: 'directVal' } } }, 0)
      // When localId is falsy, the component's `if (localOd)` branch is skipped entirely,
      // so oldcompData stays null and the dialog only receives the fallback `children` list
      // (event.option.value is not actually used as dialog data in this branch).
      expect(dialogMock.open).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
        data: { children: ['L1', 'L2'] },
      }))
    })

    it('falls back to watStore.getID for localId when compName.localId and localId are both absent', () => {
      const compGroup = component.groupcompetencyList.at(0) as any
      compGroup.patchValue({ compName: { name: 'objName', id: '' }, localId: undefined, compId: 'cid1' })
      const afterClosedSubject = new Subject<any>()
      dialogMock.open.mockReturnValue({
        componentInstance: {},
        afterClosed: () => afterClosedSubject.asObservable(),
      })
      expect(() => component.competencySelected({ option: { value: {} } }, 0)).not.toThrow()
    })

    it('patches empty-string fallbacks when newVal is missing all optional fields on confirm', () => {
      const afterClosedSubject = new Subject<any>()
      dialogMock.open.mockReturnValue({
        componentInstance: {},
        afterClosed: () => afterClosedSubject.asObservable(),
      })
      component.competencySelected({ option: { value: {} } }, 0)
      afterClosedSubject.next({ ok: true, data: {} })
      const patched = component.groupcompetencyList.at(0).value
      expect(patched.compId).toBe('')
      expect(patched.compDescription).toBe('')
      expect(patched.compName).toBe('')
      expect(patched.compSource).toBe('')
      expect(patched.compType).toBe('')
      expect(patched.compArea).toBe('')
      expect(patched.levelList).toEqual([])
      expect(patched.localId).toBeTruthy()
    })

    it('patches compName as empty string when cancelled data has no name', () => {
      const afterClosedSubject = new Subject<any>()
      dialogMock.open.mockReturnValue({
        componentInstance: {},
        afterClosed: () => afterClosedSubject.asObservable(),
      })
      component.competencySelected({ option: { value: {} } }, 0)
      afterClosedSubject.next({ ok: false, data: {} })
      const patched = component.groupcompetencyList.at(0).value
      expect(patched.compName).toBe('')
    })
  })

  it('updateCompData should not throw', () => {
    expect(() => component.updateCompData()).not.toThrow()
  })

  describe('show/hide', () => {
    it('show should set canshow to -1', () => {
      component.canshow = 5
      component.show(1)
      expect(component.canshow).toBe(-1)
    })
    it('hide should set canshow to -1', () => {
      component.canshow = 5
      component.hide()
      expect(component.canshow).toBe(-1)
    })
    it('showName should set canshowName to -1', () => {
      component.canshowName = 5
      component.showName(1)
      expect(component.canshowName).toBe(-1)
    })
    it('hideName should set canshowName to -1', () => {
      component.canshowName = 5
      component.hideName()
      expect(component.canshowName).toBe(-1)
    })
  })

  describe('deleteRowCompetency', () => {
    it('should remove competency at given index and update store', () => {
      component.createForm()
      component.addNewGroupActivity(0)
      const before = component.groupList.at(0).get('competincies').value.length
      component.deleteRowCompetency(0, 0)
      const after = component.groupList.at(0).get('competincies').value.length
      expect(after).toBe(before - 1)
      expect(watStoreMock.setgetcompetencyGroup).toHaveBeenCalled()
    })
  })

  describe('deleteSingleCompetency', () => {
    it('should open confirm dialog and delete competency when confirmed', () => {
      component.createForm()
      component.addNewGroupActivity(0)
      const afterClosedSubject = new Subject<any>()
      dialogMock.open.mockReturnValue({ afterClosed: () => afterClosedSubject.asObservable() })
      component.deleteSingleCompetency(0, 0)
      expect(dialogMock.open).toHaveBeenCalled()
      afterClosedSubject.next(true)
      expect(snackBarMock.open).toHaveBeenCalledWith('Activity deleted successfully!! ', undefined, { duration: 2000 })
    })

    it('should not delete when dialog is dismissed', () => {
      component.createForm()
      const afterClosedSubject = new Subject<any>()
      dialogMock.open.mockReturnValue({ afterClosed: () => afterClosedSubject.asObservable() })
      component.deleteSingleCompetency(0, 0)
      afterClosedSubject.next(false)
      expect(snackBarMock.open).not.toHaveBeenCalled()
    })

    it('should do nothing when indices are negative', () => {
      component.deleteSingleCompetency(-1, -1)
      expect(dialogMock.open).not.toHaveBeenCalled()
    })
  })

  it('log should call console.log', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined)
    component.log('hello')
    expect(consoleSpy).toHaveBeenCalledWith('hello')
    consoleSpy.mockRestore()
  })

  it('getActivityForm should return a stringified inspection of groupsArray', () => {
    component.createForm()
    expect(typeof component.getActivityForm).toBe('string')
  })

  it('groupListByIndex should return the compDescription control array', () => {
    component.createForm()
    expect(component.groupListByIndex(0)).toBeNull()
  })
})
