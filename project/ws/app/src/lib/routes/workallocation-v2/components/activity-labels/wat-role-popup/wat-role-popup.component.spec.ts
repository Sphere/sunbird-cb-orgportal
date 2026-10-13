import { UntypedFormBuilder } from '@angular/forms'
import { WatRolePopupComponent, IWatRolePopupData, IChield } from './wat-role-popup.component'

describe('WatRolePopupComponent', () => {
  let component: WatRolePopupComponent
  let dialogRef: any
  const formBuilder = new UntypedFormBuilder()

  const childItem = (overrides: Partial<IChield> = {}): IChield => ({
    isSelected: false,
    description: 'desc',
    id: 'id1',
    name: 'name1',
    source: 'src',
    status: 'ACTIVE',
    type: 'TYPE1',
    ...overrides,
  })

  const createComponent = (data: Partial<IWatRolePopupData> = {}) => {
    dialogRef = { close: jest.fn() }
    const fullData: IWatRolePopupData = {
      childNodes: [],
      description: 'Some description',
      id: 'role1',
      name: 'RoleName',
      source: 'src1',
      status: 'ACTIVE',
      type: 'TYPE1',
      ...data,
    }
    component = new WatRolePopupComponent(dialogRef, fullData, formBuilder)
    return component
  }

  it('should create and initialize the form', () => {
    createComponent()
    expect(component).toBeTruthy()
    expect(component.watForm.get('IsRoleSelected')?.value).toBe(true)
  })

  describe('ngOnInit', () => {
    it('should push data.childNodes into acDetail list when present', () => {
      createComponent({ childNodes: [childItem({ id: 'c1' }), childItem({ id: 'c2' })] })
      component.ngOnInit()
      expect(component.getList.length).toBe(2)
    })

    it('should leave acDetail empty when childNodes is empty array', () => {
      createComponent({ childNodes: [] })
      component.ngOnInit()
      expect(component.getList.length).toBe(0)
    })
  })

  describe('setWatValues', () => {
    it('should patch the form with the provided value', () => {
      createComponent()
      component.setWatValues({ IsRoleSelected: false })
      expect(component.watForm.get('IsRoleSelected')?.value).toBe(false)
    })
  })

  describe('createItem', () => {
    it('should set isSelected true when description present', () => {
      createComponent()
      const ctrl = component.createItem(childItem({ description: 'has desc' }))
      expect(ctrl.get('isSelected')?.value).toBe(true)
    })

    it('should set isSelected false when description missing', () => {
      createComponent()
      const ctrl = component.createItem(childItem({ description: '' }))
      expect(ctrl.get('isSelected')?.value).toBe(false)
    })
  })

  describe('onNoClick', () => {
    it('should close the dialog with ok false', () => {
      createComponent()
      component.onNoClick()
      expect(dialogRef.close).toHaveBeenCalledWith({ ok: false })
    })
  })

  describe('onOkClick', () => {
    it('should not throw', () => {
      createComponent()
      expect(() => component.onOkClick()).not.toThrow()
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
    it('should call checkAll when event.checked is true', () => {
      createComponent({ childNodes: [childItem({ id: 'c1', isSelected: false })] })
      component.ngOnInit()
      const spy = jest.spyOn(component, 'checkAll')
      component.onChangeAllAct({ checked: true } as any)
      expect(spy).toHaveBeenCalled()
    })

    it('should call deselectAll when event.checked is false', () => {
      createComponent({ childNodes: [childItem({ id: 'c1', isSelected: true })] })
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
      createComponent({
        childNodes: [childItem({ id: 'c1', isSelected: false }), childItem({ id: 'c2', isSelected: false })],
      })
      component.ngOnInit()
      component.checkAll()
      expect(component.getList.value.every((v: IChield) => v.isSelected)).toBe(true)
    })

    it('deselectAll should set isSelected false for all items', () => {
      createComponent({
        childNodes: [childItem({ id: 'c1', isSelected: true }), childItem({ id: 'c2', isSelected: true })],
      })
      component.ngOnInit()
      component.deselectAll()
      expect(component.getList.value.every((v: IChield) => !v.isSelected)).toBe(true)
    })
  })

  describe('checkedAllActivities', () => {
    it('should be true when every item is selected', () => {
      createComponent({ childNodes: [childItem({ id: 'c1', isSelected: true })] })
      component.ngOnInit()
      component.checkAll()
      expect(component.checkedAllActivities).toBe(true)
    })

    it('should be false when some items are not selected', () => {
      createComponent({ childNodes: [childItem({ id: 'c1', isSelected: false, description: '' })] })
      component.ngOnInit()
      expect(component.checkedAllActivities).toBe(false)
    })
  })

  describe('submitResult', () => {
    it('should close the dialog with ok true and generated data when val is truthy', () => {
      createComponent()
      component.submitResult({ acDetail: [childItem({ id: 'c1', isSelected: true })] })
      expect(dialogRef.close).toHaveBeenCalledWith({
        ok: true,
        data: expect.any(Array),
      })
    })

    it('should not close the dialog when val is falsy', () => {
      createComponent()
      component.submitResult(null)
      expect(dialogRef.close).not.toHaveBeenCalled()
    })
  })

  describe('generateData', () => {
    it('should include only selected items in the generated data', () => {
      createComponent()
      const result = component.generateData({
        acDetail: [
          childItem({ id: 'c1', name: 'n1', description: 'd1', isSelected: true }),
          childItem({ id: 'c2', name: 'n2', description: 'd2', isSelected: false }),
        ],
      })
      expect(result.length).toBe(1)
      expect(result[0].activityId).toBe('c1')
      expect(result[0].activityName).toBe('n1')
      expect(result[0].activityDescription).toBe('d1')
      expect(result[0].assignedTo).toBe('')
    })

    it('should return an empty array when no items are selected', () => {
      createComponent()
      const result = component.generateData({
        acDetail: [childItem({ id: 'c1', isSelected: false })],
      })
      expect(result).toEqual([])
    })
  })
})
