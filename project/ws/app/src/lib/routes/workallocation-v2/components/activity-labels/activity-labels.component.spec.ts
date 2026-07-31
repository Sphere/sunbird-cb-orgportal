import { UntypedFormBuilder } from '@angular/forms'
import { of } from 'rxjs'
import { ActivityLabelsComponent } from './activity-labels.component'

describe('ActivityLabelsComponent', () => {
  let component: ActivityLabelsComponent
  let changeDetectorMock: any
  let allocateSrvcMock: any
  let watStoreMock: any
  let snackBarMock: any
  let dialogMock: any
  let idCounter = 0

  beforeEach(() => {
    idCounter = 0
    changeDetectorMock = { detectChanges: jest.fn() }
    allocateSrvcMock = {
      onSearchUser: jest.fn().mockReturnValue(of({ result: { response: { content: ['user1'] } } })),
      onSearchRole: jest.fn().mockReturnValue(of([{ name: 'Role A', description: 'descA' }, { name: 'Other', description: 'descB' }])),
      onSearchActivity: jest.fn().mockReturnValue(of({ responseData: ['act1', 'act2'] })),
    }
    watStoreMock = {
      setgetactivitiesGroup: jest.fn(),
      getcompetencyGroupValue: [],
      getOfficerId: 'officer1',
      get getID() {
        idCounter += 1
        return idCounter
      },
    }
    snackBarMock = { open: jest.fn() }
    dialogMock = { open: jest.fn() }

    component = new ActivityLabelsComponent(
      changeDetectorMock,
      new UntypedFormBuilder(),
      allocateSrvcMock,
      watStoreMock,
      snackBarMock,
      dialogMock,
    )
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit / createForm without editData', () => {
    beforeEach(() => {
      component.ngOnInit()
    })

    it('creates activityForm with labelsArray and groupsArray', () => {
      expect(component.activityForm).toBeDefined()
      expect(component.labelsList).toBeDefined()
      expect(component.groupList.length).toBe(1)
    })

    it('adds a default group when no editData', () => {
      expect(component.groupList.at(0).get('groupName')!.value).toBe('Untitled role')
    })

    it('emits to watStore on groupsArray valueChanges (debounced)', done => {
      jest.useFakeTimers()
      component.groupList.at(0).get('groupName')!.setValue('changed')
      jest.advanceTimersByTime(600)
      Promise.resolve().then(() => {
        expect(watStoreMock.setgetactivitiesGroup).toHaveBeenCalled()
        jest.useRealTimers()
        done()
      })
    })
  })

  describe('ngOnInit with editData - unmapped activities', () => {
    beforeEach(() => {
      component.editData = {
        unmdA: [{ activityId: '1', activityName: 'a', activityDescription: 'd' }],
        list: [],
      }
      component.ngOnInit()
    })

    it('creates a group at index 0 for unmapped activities', () => {
      expect(component.groupList.length).toBe(1)
      expect(component.groupActivityList.length).toBe(1)
    })
  })

  describe('ngOnInit with editData - list of roles', () => {
    beforeEach(() => {
      component.editData = {
        unmdA: [],
        list: [
          {
            roleDetails: {
              id: 'r1',
              name: 'Role 1',
              description: 'roleDesc',
              childNodes: [
                { id: 'a1', name: 'act1', description: 'actDesc', submittedToName: 'x' },
              ],
            },
          },
        ],
      }
      component.ngOnInit()
    })

    it('creates default group (no unmapped) plus one group per role', () => {
      expect(component.groupList.length).toBe(2)
      expect(component.groupList.at(1).get('groupName')!.value).toBe('Role 1')
    })

    it('calls watStore.setgetactivitiesGroup during creation', () => {
      expect(watStoreMock.setgetactivitiesGroup).toHaveBeenCalled()
    })
  })

  describe('ngAfterViewInit / ngOnDestroy', () => {
    it('ngAfterViewInit does nothing and does not throw', () => {
      expect(() => component.ngAfterViewInit()).not.toThrow()
    })

    it('ngOnDestroy completes unsubscribe subject', () => {
      component.ngOnInit()
      expect(() => component.ngOnDestroy()).not.toThrow()
    })
  })

  describe('drop', () => {
    beforeEach(() => {
      component.ngOnInit()
      component.addNewLabel()
      component.addNewLabel()
    })

    it('reorders labelsList when moving within the same container', () => {
      const container = {} as any
      const event: any = {
        previousContainer: container,
        container,
        previousIndex: 0,
        currentIndex: 1,
      }
      expect(() => component.drop(event)).not.toThrow()
    })

    it('transfers items between different containers', () => {
      const previousContainer = { data: ['a'] } as any
      const targetContainer = { data: ['b'] } as any
      const event: any = {
        previousContainer,
        container: targetContainer,
        previousIndex: 0,
        currentIndex: 0,
      }
      component.drop(event)
      expect(targetContainer.data.length).toBe(2)
    })
  })

  describe('dropgroup', () => {
    beforeEach(() => {
      component.ngOnInit()
      component.addNewGroup()
    })

    it('reorders within same container', () => {
      const container = {} as any
      const event: any = {
        previousContainer: container,
        container,
        previousIndex: 0,
        currentIndex: 0,
      }
      expect(() => component.dropgroup(event)).not.toThrow()
    })

    it('shows snackbar and returns when dragged item is empty', () => {
      const event: any = {
        previousContainer: { id: 'groups_0' },
        container: { id: 'groups_1' },
        item: { data: {} },
      }
      component.dropgroup(event)
      expect(snackBarMock.open).toHaveBeenCalledWith('Empty activity!! You can not drag', undefined, { duration: 2000 })
    })

    it('transfers activities between groups when item has data', () => {
      component.addNewGroup()
      const event: any = {
        previousContainer: { id: 'groups_0' },
        container: { id: 'groups_1' },
        item: { data: { activityDescription: 'x' } },
        previousIndex: 0,
        currentIndex: 0,
      }
      expect(() => component.dropgroup(event)).not.toThrow()
      expect(watStoreMock.setgetactivitiesGroup).toHaveBeenCalled()
    })
  })

  describe('evenPredicate / noReturnPredicate', () => {
    it('returns true when item has data', () => {
      expect(component.evenPredicate({ data: { x: 1 } } as any)).toBe(true)
    })

    it('returns false when item has no data', () => {
      expect(component.evenPredicate({ data: null } as any)).toBe(false)
    })

    it('noReturnPredicate always returns true', () => {
      expect(component.noReturnPredicate()).toBe(true)
    })
  })

  describe('log', () => {
    it('does not throw for truthy or falsy values', () => {
      expect(() => component.log('value')).not.toThrow()
      expect(() => component.log(null)).not.toThrow()
    })
  })

  describe('label and group value setters', () => {
    beforeEach(() => component.ngOnInit())

    it('setlabelsValues patches labelsList', () => {
      component.addNewLabel()
      component.setlabelsValues([{ activityName: 'test' }])
      expect(component.labelsList.at(0).get('activityName')!.value).toBe('test')
    })

    it('setGroupValues patches groupList', () => {
      component.setGroupValues([{ groupName: 'newname' }])
      expect(component.groupList.at(0).get('groupName')!.value).toBe('newname')
    })

    it('setGroupActivityValues patches groupActivityList', () => {
      component.setGroupActivityValues([{ activityName: 'act' }])
      expect(component.groupActivityList.at(0).get('activityName')!.value).toBe('act')
    })
  })

  describe('deleteActivityGromGrp', () => {
    beforeEach(() => component.ngOnInit())

    it('removes activity at valid index', () => {
      const initialLen = component.groupActivityList.length
      component.deleteActivityGromGrp(0)
      expect(component.groupActivityList.length).toBe(initialLen - 1)
    })

    it('does nothing for negative index', () => {
      const initialLen = component.groupActivityList.length
      component.deleteActivityGromGrp(-1)
      expect(component.groupActivityList.length).toBe(initialLen)
    })
  })

  describe('addNewLabel', () => {
    beforeEach(() => component.ngOnInit())

    it('adds a new label form group', () => {
      const before = component.labelsList.length
      component.addNewLabel()
      expect(component.labelsList.length).toBe(before + 1)
    })
  })

  describe('addNewGroup', () => {
    beforeEach(() => component.ngOnInit())

    it('adds a group with default activity when needDefaultActivity is true', () => {
      component.addNewGroup(true)
      expect(component.groupList.length).toBe(2)
      expect(component.canshowName).toBe(1)
    })

    it('adds a group without default activity when false', () => {
      component.addNewGroup(false)
      const grp = component.groupList.at(1) as any
      expect(grp.get('activities').length).toBe(0)
    })

    it('uses provided grp data for groupName/groupId/groupDescription', () => {
      component.addNewGroup(false, {
        localId: 99,
        groupId: 'gid',
        groupName: 'CustomGroup',
        groupDescription: 'desc',
        activities: [],
      } as any)
      const grp = component.groupList.at(1)
      expect(grp.get('groupName')!.value).toBe('CustomGroup')
      expect(grp.get('groupId')!.value).toBe('gid')
    })
  })

  describe('addNewGroupActivityCustom', () => {
    beforeEach(() => component.ngOnInit())

    it('adds activities for valid index', () => {
      const before = component.groupActivityList.length
      component.addNewGroupActivityCustom(0, [
        { activityId: '1', activityName: 'a', activityDescription: 'd', localId: 1 } as any,
      ])
      expect(component.groupActivityList.length).toBe(before + 1)
    })

    it('does nothing for negative index', () => {
      const before = component.groupActivityList.length
      component.addNewGroupActivityCustom(-1, [{ activityId: '1' } as any])
      expect(component.groupActivityList.length).toBe(before)
    })
  })

  describe('addNewGroupActivity', () => {
    beforeEach(() => component.ngOnInit())

    it('adds a blank activity for valid index', () => {
      const before = component.groupActivityList.length
      component.addNewGroupActivity(0)
      expect(component.groupActivityList.length).toBe(before + 1)
    })

    it('does nothing for negative index', () => {
      const before = component.groupActivityList.length
      component.addNewGroupActivity(-1)
      expect(component.groupActivityList.length).toBe(before)
    })
  })

  describe('enter', () => {
    it('sets activeGroupIdx', () => {
      component.enter(3)
      expect(component.activeGroupIdx).toBe(3)
    })
  })

  describe('submitResult', () => {
    it('does not throw for truthy or falsy input', () => {
      expect(() => component.submitResult({ a: 1 })).not.toThrow()
      expect(() => component.submitResult(null)).not.toThrow()
    })
  })

  describe('filterUsers', () => {
    it('calls allocateSrvc.onSearchUser and sets userslist', async () => {
      await component.filterUsers('John')
      expect(allocateSrvcMock.onSearchUser).toHaveBeenCalledWith('john')
      expect(component.userslist).toEqual(['user1'])
    })
  })

  describe('filterActivities', () => {
    it('sets selectedActivityIdx and does not call service for short values', async () => {
      await component.filterActivities('ab', 2)
      expect(component.selectedActivityIdx).toBe(2)
      expect(allocateSrvcMock.onSearchActivity).not.toHaveBeenCalled()
    })

    it('calls onSearchActivity for values longer than 2 chars', async () => {
      await component.filterActivities('abcd', 1)
      expect(allocateSrvcMock.onSearchActivity).toHaveBeenCalled()
      let result: any
      component.filteredActivityDesc.subscribe(r => (result = r))
      expect(result).toEqual(['act1', 'act2'])
    })
  })

  describe('filterRoles', () => {
    it('filters roles matching search value', async () => {
      await component.filterRoles('role')
      let result: any
      component.filteredRoles.subscribe(r => (result = r))
      expect(result).toEqual([{ name: 'Role A', description: 'descA' }])
    })
  })

  describe('roleSelected', () => {
    beforeEach(() => component.ngOnInit())

    it('adds activities and role details when dialog confirms with data', () => {
      dialogMock.open.mockReturnValue({
        afterClosed: () => of({
          ok: true,
          data: [{ activityDescription: 'newAct' }],
        }),
      })
      const event = { option: { value: { description: 'd', name: 'n', id: 'i' } } }
      component.roleSelected(event, 0)
      expect(component.groupList.at(0).get('groupName')!.value).toBe('n')
      expect(watStoreMock.setgetactivitiesGroup).toHaveBeenCalled()
    })

    it('handles ok with no data by deleting all unselected activities', () => {
      dialogMock.open.mockReturnValue({
        afterClosed: () => of({ ok: true, data: [] }),
      })
      const event = { option: { value: { description: 'd', name: 'n', id: 'i' } } }
      expect(() => component.roleSelected(event, 0)).not.toThrow()
    })

    it('resets group fields when dialog is cancelled (ok: false)', () => {
      dialogMock.open.mockReturnValue({
        afterClosed: () => of({ ok: false }),
      })
      const event = { option: { value: {} } }
      component.roleSelected(event, 0)
      expect(component.groupList.at(0).get('groupName')!.value).toBe('')
      expect(watStoreMock.setgetactivitiesGroup).toHaveBeenCalled()
    })
  })

  describe('deleteUnselectedActivities', () => {
    beforeEach(() => {
      component.ngOnInit()
      component.addNewGroupActivityCustom(0, [
        { activityId: '1', activityDescription: 'keep' } as any,
        { activityId: '2', activityDescription: 'drop' } as any,
      ])
    })

    it('removes matching unselected activities', () => {
      const before = component.groupActivityList.length
      component.deleteUnselectedActivities([{ activityDescription: 'drop' }], 0)
      expect(component.groupActivityList.length).toBeLessThan(before)
    })

    it('removes all activities when unselectVals is empty', () => {
      component.deleteUnselectedActivities([], 0)
      expect(component.groupActivityList.length).toBe(0)
    })
  })

  describe('activitySelected', () => {
    beforeEach(() => {
      component.ngOnInit()
      component.setSelectedFilter(0)
    })

    it('patches activityDescription and activityId on selected activity', () => {
      const event = { option: { value: { description: 'newDesc', id: 'newId' } } }
      component.activitySelected(event, 0)
      const activity = component.groupActivityList.at(0)
      expect(activity.get('activityDescription')!.value).toBe('newDesc')
      expect(activity.get('activityId')!.value).toBe('newId')
      expect(watStoreMock.setgetactivitiesGroup).toHaveBeenCalled()
    })
  })

  describe('setSelectedFilter', () => {
    it('sets selectedActivityIdx', () => {
      component.setSelectedFilter(5)
      expect(component.selectedActivityIdx).toBe(5)
    })
  })

  describe('displayFn / displayActivityFn', () => {
    it('displayFn returns name or empty string', () => {
      expect(component.displayFn({ name: 'x' })).toBe('x')
      expect(component.displayFn(null)).toBe('')
    })

    it('displayActivityFn returns activityDescription or empty string', () => {
      expect(component.displayActivityFn({ activityDescription: 'd' })).toBe('d')
      expect(component.displayActivityFn(null)).toBe('')
    })
  })

  describe('userClicked', () => {
    beforeEach(() => {
      component.ngOnInit()
      component.setSelectedFilter(0)
    })

    it('sets Final authority values for type "to"', () => {
      const event = { option: { value: 'Final authority' } }
      component.userClicked(event, 0, 'to')
      const activity = component.groupActivityList.at(0)
      expect(activity.get('assignedTo')!.value).toBe('Final authority')
      expect(watStoreMock.setgetactivitiesGroup).toHaveBeenCalled()
    })

    it('sets user values from event for type "to"', () => {
      const event = {
        option: {
          value: {
            firstName: 'John',
            lastName: 'Doe',
            userId: 'u1',
            profileDetails: { personalDetails: { primaryEmail: 'j@d.com' } },
          },
        },
      }
      component.userClicked(event, 0, 'to')
      const activity = component.groupActivityList.at(0)
      expect(activity.get('assignedTo')!.value).toBe('John Doe')
      expect(activity.get('assignedToEmail')!.value).toBe('j@d.com')
    })

    it('does nothing when event is falsy', () => {
      expect(() => component.userClicked(null, 0, 'to')).not.toThrow()
      expect(watStoreMock.setgetactivitiesGroup).not.toHaveBeenCalled()
    })

    it('handles the "from" branch without throwing', () => {
      const event = { option: { value: {} } }
      expect(() => component.userClicked(event, 0, 'from')).not.toThrow()
      expect(watStoreMock.setgetactivitiesGroup).toHaveBeenCalled()
    })
  })

  describe('deleteRowActivity', () => {
    beforeEach(() => component.ngOnInit())

    it('removes activity from the specified role group', () => {
      const before = component.groupActivityList.length
      component.deleteRowActivity(0, 0)
      expect(component.groupActivityList.length).toBe(before - 1)
      expect(watStoreMock.setgetactivitiesGroup).toHaveBeenCalled()
    })
  })

  describe('deleteSingleActivity', () => {
    beforeEach(() => component.ngOnInit())

    it('opens confirm dialog and deletes on confirm', () => {
      dialogMock.open.mockReturnValue({ afterClosed: () => of(true) })
      const before = component.groupActivityList.length
      component.deleteSingleActivity(0, 0)
      expect(component.groupActivityList.length).toBe(before - 1)
      expect(snackBarMock.open).toHaveBeenCalledWith('Activity deleted successfully!! ', undefined, { duration: 2000 })
    })

    it('does not delete when dialog is not confirmed', () => {
      dialogMock.open.mockReturnValue({ afterClosed: () => of(false) })
      const before = component.groupActivityList.length
      component.deleteSingleActivity(0, 0)
      expect(component.groupActivityList.length).toBe(before)
    })

    it('does nothing for invalid indices', () => {
      component.deleteSingleActivity(-1, 0)
      expect(dialogMock.open).not.toHaveBeenCalled()
    })
  })

  describe('show / hide / showName / hideName', () => {
    it('show sets canshow', () => {
      component.show(3)
      expect(component.canshow).toBe(3)
    })

    it('hide resets canshow to -1', () => {
      component.show(3)
      component.hide()
      expect(component.canshow).toBe(-1)
    })

    it('showName sets canshowName', () => {
      component.showName(4)
      expect(component.canshowName).toBe(4)
    })

    it('hideName resets canshowName to -1', () => {
      component.showName(4)
      component.hideName()
      expect(component.canshowName).toBe(-1)
    })
  })

  describe('trackByFn', () => {
    beforeEach(() => component.ngOnInit())

    it('returns the localId of the item value', () => {
      const item = component.groupList.at(0) as any
      const result = component.trackByFn(0, item)
      expect(result).toBe(item.value.localId)
    })
  })

  describe('getCompCount', () => {
    it('sums competencies matching roleName, localId, or roleId', () => {
      watStoreMock.getcompetencyGroupValue = [
        { roleName: 'Role1', localId: 1, roleId: 'r1', competincies: [1, 2] },
        { roleName: 'Other', localId: 2, roleId: 'r2', competincies: [1] },
      ]
      const count = component.getCompCount('Role1', 5, 'nomatch')
      expect(count).toBe(2)
    })

    it('returns 0 when nothing matches', () => {
      watStoreMock.getcompetencyGroupValue = []
      expect(component.getCompCount('x', 1, 'y')).toBe(0)
    })
  })

  describe('deleteGrp', () => {
    beforeEach(() => component.ngOnInit())

    it('shows snackbar and returns when no officerId set', () => {
      watStoreMock.getOfficerId = ''
      component.deleteGrp(0)
      expect(snackBarMock.open).toHaveBeenCalledWith(
        'Please save work order and open in edit mode !! ', undefined, { duration: 2000 },
      )
      expect(dialogMock.open).not.toHaveBeenCalled()
    })

    it('opens confirm dialog and removes group on confirm', () => {
      watStoreMock.getOfficerId = 'officer1'
      dialogMock.open.mockReturnValue({ afterClosed: () => of(true) })
      const before = component.groupList.length
      component.deleteGrp(0)
      expect(component.groupList.length).toBe(before - 1)
      expect(watStoreMock.setgetactivitiesGroup).toHaveBeenCalled()
    })

    it('does not remove group when dialog is cancelled', () => {
      watStoreMock.getOfficerId = 'officer1'
      dialogMock.open.mockReturnValue({ afterClosed: () => of(false) })
      const before = component.groupList.length
      component.deleteGrp(0)
      expect(component.groupList.length).toBe(before)
    })
  })
})
