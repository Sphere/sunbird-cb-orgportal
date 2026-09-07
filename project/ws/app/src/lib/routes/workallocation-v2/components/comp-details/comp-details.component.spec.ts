import { UntypedFormBuilder } from '@angular/forms'
import { of, Subject } from 'rxjs'
import { CompDetailsComponent } from './comp-details.component'

describe('CompDetailsComponent', () => {
  let component: CompDetailsComponent
  let watStoreMock: any
  let activatedRouteMock: any
  let compGrpSubject: Subject<any>

  const setup = (levels: string[] = ['Basic'], compTypes: string[] = ['Domain']) => {
    compGrpSubject = new Subject()
    watStoreMock = {
      updateCompGroup: jest.fn(),
      get_compGrp: compGrpSubject.asObservable(),
    }
    activatedRouteMock = {
      snapshot: {
        data: {
          pageData: {
            data: {
              levels,
              compTypes,
            },
          },
        },
      },
    }
    component = new CompDetailsComponent(watStoreMock, new UntypedFormBuilder(), activatedRouteMock)
  }

  describe('constructor', () => {
    it('should generate an empty form and set levelLest/compTypList from route data', () => {
      setup(['Basic', 'Advanced'], ['Domain', 'Functional'])
      expect(component.compDetailForm).toBeDefined()
      expect(component.compList.length).toBe(0)
      expect(component.levelLest).toEqual(['Basic', 'Advanced'])
      expect(component.compTypList).toEqual(['Domain', 'Functional'])
    })
  })

  describe('ngOnInit / fetchData', () => {
    it('should call fetchData and subscribe to valueChanges', () => {
      setup()
      component.ngOnInit()
      expect(component.groupSubscription).toBeDefined()
      expect(component.subscribeForm).toBeDefined()
    })

    it('should update dataStructure and call updateForm when comp length > 0', () => {
      setup()
      component.ngOnInit()
      const updateFormSpy = jest.spyOn(component, 'updateForm')
      compGrpSubject.next([
        { compName: 'Comp1', localId: 1, compId: 'c1', levelList: [] },
      ])
      expect(component.dataStructure.length).toBe(1)
      expect(updateFormSpy).toHaveBeenCalled()
    })

    it('should not update dataStructure when comp length is 0', () => {
      setup()
      component.ngOnInit()
      compGrpSubject.next([])
      expect(component.dataStructure).toEqual([])
    })

    it('should call watStore.updateCompGroup on form valueChanges when val is truthy', () => {
      setup()
      component.ngOnInit()
      component.compList.push(new UntypedFormBuilder().group({ competencyList: [] }))
      expect(watStoreMock.updateCompGroup).toHaveBeenCalled()
    })
  })

  describe('ngOnDestroy', () => {
    it('should unsubscribe groupSubscription and subscribeForm', () => {
      setup()
      component.ngOnInit()
      const groupUnsub = jest.spyOn(component.groupSubscription, 'unsubscribe')
      const formUnsub = jest.spyOn(component.subscribeForm, 'unsubscribe')
      component.ngOnDestroy()
      expect(groupUnsub).toHaveBeenCalled()
      expect(formUnsub).toHaveBeenCalled()
    })
  })

  describe('setCompValues', () => {
    it('should patch compList with provided values', () => {
      setup()
      component.updateForm.call(component)
      // ensure compList has at least structure to patch against by calling with dataStructure entry
      component.dataStructure = [{ compName: 'Comp1', localId: 1, compId: 'c1', levelList: [] } as any]
      component.updateForm()
      component.setCompValues([{ compName: 'Comp1' }])
      expect(component.compList.at(0).get('compName')!.value).toBeDefined()
    })
  })

  describe('updateForm', () => {
    it('should build form groups for entries with compName and use levelList mapping when present', () => {
      setup(['Basic'])
      component.dataStructure = [
        {
          localId: 1,
          compId: 'c1',
          compName: 'Comp1',
          compDescription: 'desc',
          compLevel: 'Basic',
          compType: 'Domain',
          compArea: 'area',
          compSource: 'source',
          levelList: [{ alias: 'a1', level: 'L1' }],
        } as any,
      ]
      component.updateForm()
      expect(component.compList.length).toBe(1)
      const grp = component.compList.at(0)
      expect(grp.get('compName')!.value).toBe('Comp1')
    })

    it('should default to levelLest when levelList is empty', () => {
      setup(['Basic', 'Advanced'])
      component.dataStructure = [
        {
          localId: 1,
          compId: 'c1',
          compName: 'Comp1',
          compDescription: 'desc',
          compLevel: 'Basic',
          compType: 'Domain',
          compArea: 'area',
          compSource: 'source',
          levelList: [],
        } as any,
      ]
      component.updateForm()
      expect(component.compList.length).toBe(1)
    })

    it('should skip entries without compName', () => {
      setup()
      component.dataStructure = [
        { localId: 1, compId: 'c1' } as any,
      ]
      component.updateForm()
      expect(component.compList.length).toBe(0)
    })

    it('should skip falsy entries in dataStructure', () => {
      setup()
      component.dataStructure = [null as any]
      expect(() => component.updateForm()).not.toThrow()
      expect(component.compList.length).toBe(0)
    })

    it('should handle empty dataStructure', () => {
      setup()
      component.dataStructure = []
      component.updateForm()
      expect(component.compList.length).toBe(0)
    })
  })

  describe('getLocalPrint', () => {
    it('should build an unordered list from bullet-separated text', () => {
      setup()
      const result = component.getLocalPrint('• first• second')
      expect(result).toContain('<ul>')
      expect(result).toContain('<li>first</li>')
      expect(result).toContain('<li>second</li>')
    })

    it('should return an empty list when data has no bullet content', () => {
      setup()
      const result = component.getLocalPrint('')
      expect(result).toBe('<ul></ul>')
    })
  })

  describe('log', () => {
    it('should not throw for any argument', () => {
      setup()
      expect(() => component.log('value')).not.toThrow()
      expect(() => component.log(null)).not.toThrow()
    })
  })
})
