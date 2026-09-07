import { UntypedFormBuilder } from '@angular/forms'
import { WatCompPopupComponent, IWatCompPopupData, IChield } from './wat-comp-popup.component'

describe('WatCompPopupComponent', () => {
  let component: WatCompPopupComponent
  let dialogRef: any
  const formBuilder = new UntypedFormBuilder()

  const childItem = (overrides: Partial<IChield> = {}): IChield => ({
    isSelected: false,
    description: 'desc',
    id: 'id1',
    name: 'name1',
    level: 'L1',
    alias: ['a1'],
    source: 'src',
    status: 'ACTIVE',
    type: 'TYPE1',
    ...overrides,
  })

  const createComponent = (
    data: Partial<IWatCompPopupData> = {},
    defaultCompLevels: any = {},
  ) => {
    dialogRef = { close: jest.fn() }
    const fullData: IWatCompPopupData = {
      level: 'L1',
      children: [],
      description: 'Some description',
      id: 'comp1',
      name: 'CompName',
      area: 'area1',
      source: 'src1',
      status: 'ACTIVE',
      type: 'TYPE1',
      ...data,
    }
    component = new WatCompPopupComponent(dialogRef, fullData, formBuilder)
    component.defaultCompLevels = defaultCompLevels
    return component
  }

  it('should create and initialize the form with data values', () => {
    createComponent()
    expect(component).toBeTruthy()
    expect(component.watForm.get('compName')?.value).toBe('CompName')
    expect(component.watForm.get('compDescription')?.value).toBe('Some description')
    expect(component.selectedLevel).toBe('L1')
  })

  it('should default selectedLevel to empty string when no level provided', () => {
    createComponent({ level: undefined })
    expect(component.selectedLevel).toBe('')
  })

  describe('ngOnInit', () => {
    it('should set compTypList from defaultCompLevels.data.compTypes', () => {
      createComponent({}, { data: { compTypes: ['T1', 'T2'] } })
      component.ngOnInit()
      expect(component.compTypList).toEqual(['T1', 'T2'])
    })

    it('should mark isNew true when data.id is falsy', () => {
      createComponent({ id: '' })
      component.ngOnInit()
      expect(component.isNew).toBe(true)
    })

    it('should keep isNew false when data.id is present', () => {
      createComponent({ id: 'existing-id' })
      component.ngOnInit()
      expect(component.isNew).toBe(false)
    })

    it('should push data.children into acDetail list when children present', () => {
      createComponent({ children: [childItem({ id: 'c1' }), childItem({ id: 'c2' })] })
      component.ngOnInit()
      expect(component.getList.length).toBe(2)
    })

    it('should build acDetail from defaultCompLevels.data.levels when no children', () => {
      createComponent(
        { children: [] },
        { data: { levels: [childItem({ id: 'lvl1' }), childItem({ id: 'lvl2' })] } },
      )
      component.ngOnInit()
      expect(component.getList.length).toBe(2)
    })

    it('should not throw and leave acDetail empty when no children and no defaultCompLevels.data.levels', () => {
      createComponent({ children: [] }, {})
      expect(() => component.ngOnInit()).not.toThrow()
      expect(component.getList.length).toBe(0)
    })
  })

  describe('setWatValues', () => {
    it('should patch the form with provided value', () => {
      createComponent()
      component.setWatValues({ compName: 'Updated' })
      expect(component.watForm.get('compName')?.value).toBe('Updated')
    })
  })

  describe('createItem', () => {
    it('should build a form group from the given child item', () => {
      createComponent()
      const ctrl = component.createItem(childItem({ name: 'ChildName' }))
      expect(ctrl.get('name')?.value).toBe('ChildName')
    })
  })

  describe('radioChange', () => {
    it('should update selectedLevel from the event value', () => {
      createComponent()
      component.radioChange({ value: 'L5' } as any)
      expect(component.selectedLevel).toBe('L5')
    })
  })

  describe('onNoClick', () => {
    it('should close the dialog with ok false and the original data', () => {
      createComponent()
      component.onNoClick()
      expect(dialogRef.close).toHaveBeenCalledWith({ ok: false, data: component.data })
    })
  })

  describe('onOkClick', () => {
    it('should not throw', () => {
      createComponent()
      expect(() => component.onOkClick()).not.toThrow()
    })
  })

  describe('getLocalPrint', () => {
    it('should wrap non-empty lines in <li> tags inside a <ul>', () => {
      createComponent()
      const html = component.getLocalPrint('line1\nline2\n\nline3')
      expect(html).toBe('<ul><li>line1</li><li>line2</li><li>line3</li></ul>')
    })

    it('should return an empty <ul> for empty input', () => {
      createComponent()
      expect(component.getLocalPrint('')).toBe('<ul></ul>')
    })
  })

  describe('onChange', () => {
    it('should preventDefault and set isChecked true when event present', () => {
      createComponent()
      component.isChecked = false
      const preventDefault = jest.fn()
      component.onChange({ preventDefault })
      expect(preventDefault).toHaveBeenCalled()
      expect(component.isChecked).toBe(true)
    })

    it('should do nothing when event is falsy', () => {
      createComponent()
      component.isChecked = false
      component.onChange(null)
      expect(component.isChecked).toBe(false)
    })
  })

  describe('onChangeAllAct', () => {
    it('should check all items when event.checked is true', () => {
      createComponent({ children: [childItem({ id: 'c1', isSelected: false })] })
      component.ngOnInit()
      const spy = jest.spyOn(component, 'checkAll')
      component.onChangeAllAct({ checked: true } as any)
      expect(spy).toHaveBeenCalled()
    })

    it('should deselect all items when event.checked is false', () => {
      createComponent({ children: [childItem({ id: 'c1', isSelected: true })] })
      component.ngOnInit()
      const spy = jest.spyOn(component, 'deselectAll')
      component.onChangeAllAct({ checked: false } as any)
      expect(spy).toHaveBeenCalled()
    })

    it('should do nothing when event is falsy', () => {
      createComponent()
      const checkAllSpy = jest.spyOn(component, 'checkAll')
      const deselectAllSpy = jest.spyOn(component, 'deselectAll')
      component.onChangeAllAct(null as any)
      expect(checkAllSpy).not.toHaveBeenCalled()
      expect(deselectAllSpy).not.toHaveBeenCalled()
    })
  })

  describe('checkAll / deselectAll', () => {
    it('checkAll should set isSelected true for all items', () => {
      createComponent({ children: [childItem({ id: 'c1', isSelected: false }), childItem({ id: 'c2', isSelected: false })] })
      component.ngOnInit()
      component.checkAll()
      expect(component.getList.value.every((v: IChield) => v.isSelected)).toBe(true)
    })

    it('deselectAll should set isSelected false for all items', () => {
      createComponent({ children: [childItem({ id: 'c1', isSelected: true }), childItem({ id: 'c2', isSelected: true })] })
      component.ngOnInit()
      component.checkAll()
      component.deselectAll()
      expect(component.getList.value.every((v: IChield) => !v.isSelected)).toBe(true)
    })
  })

  describe('checkedAllActivities', () => {
    it('should be true when every item is selected', () => {
      createComponent({ children: [childItem({ id: 'c1', isSelected: true })] })
      component.ngOnInit()
      component.checkAll()
      expect(component.checkedAllActivities).toBe(true)
    })

    it('should be false when some items are not selected', () => {
      createComponent({ children: [childItem({ id: 'c1', isSelected: false })] })
      component.ngOnInit()
      expect(component.checkedAllActivities).toBe(false)
    })
  })

  describe('submitResult', () => {
    it('should close dialog with ok true and generated data when val is truthy', () => {
      createComponent()
      component.selectedLevel = 'L2'
      component.submitResult({ compId: 'id1', compName: 'n', compDescription: 'd', compType: 't', compArea: 'a', compSource: 's' })
      expect(dialogRef.close).toHaveBeenCalledWith({
        ok: true,
        data: expect.objectContaining({ compId: 'id1', compLevel: 'L2' }),
      })
    })

    it('should not close dialog when val is falsy', () => {
      createComponent()
      component.submitResult(null)
      expect(dialogRef.close).not.toHaveBeenCalled()
    })
  })

  describe('generateData', () => {
    it('should build the generated data object using val and this.data fallbacks', () => {
      createComponent()
      const result = component.generateData({ compId: 'id1', compName: 'n', compDescription: 'd', compType: 't', compArea: 'a', source: 'fallbackSrc' })
      expect(result.compId).toBe('id1')
      expect(result.compSource).toBe('fallbackSrc')
    })

    it('should prefer compSource from val over data.source when present', () => {
      createComponent()
      const result = component.generateData({ compSource: 'valSource' })
      expect(result.compSource).toBe('valSource')
    })
  })
})
