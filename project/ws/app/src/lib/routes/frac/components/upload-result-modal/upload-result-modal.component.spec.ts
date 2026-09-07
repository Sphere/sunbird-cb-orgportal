import { UploadResultModalComponent, UploadResultData } from './upload-result-modal.component'

describe('UploadResultModalComponent', () => {
  let component: UploadResultModalComponent
  let dialogRef: any

  const createComponent = (data: Partial<UploadResultData> = {}) => {
    dialogRef = { close: jest.fn() }
    const fullData: UploadResultData = {
      type: 'success',
      title: 'Title',
      message: 'Message',
      ...data,
    }
    component = new UploadResultModalComponent(dialogRef, fullData)
    return component
  }

  it('should create', () => {
    createComponent()
    expect(component).toBeTruthy()
  })

  describe('isSuccess / isError', () => {
    it('should return true for isSuccess when type is success', () => {
      createComponent({ type: 'success' })
      expect(component.isSuccess()).toBe(true)
      expect(component.isError()).toBe(false)
    })

    it('should return true for isError when type is error', () => {
      createComponent({ type: 'error' })
      expect(component.isError()).toBe(true)
      expect(component.isSuccess()).toBe(false)
    })
  })

  describe('detailLines', () => {
    it('should return empty array when errorDetails is missing', () => {
      createComponent()
      expect(component.detailLines).toEqual([])
    })

    it('should split, trim, and filter empty lines', () => {
      createComponent({ errorDetails: '  line1  \n\n  line2\n   \n' })
      expect(component.detailLines).toEqual(['line1', 'line2'])
    })
  })

  describe('resultErrorLines', () => {
    it('should return empty array when resultDetails is missing', () => {
      createComponent()
      expect(component.resultErrorLines).toEqual([])
    })

    it('should return resultDetails when present', () => {
      const resultDetails = [{ key: 'k1', values: [1, 2] }]
      createComponent({ resultDetails })
      expect(component.resultErrorLines).toBe(resultDetails)
    })
  })

  describe('formatResultKey', () => {
    it('should replace underscores with spaces and add spaces before capitals', () => {
      createComponent()
      expect(component.formatResultKey('some_keyName')).toBe('Some key Name')
    })

    it('should capitalize the first letter', () => {
      createComponent()
      expect(component.formatResultKey('lowercase')).toBe('Lowercase')
    })
  })

  describe('mappingGroups', () => {
    it('should return empty array when there are no detail lines', () => {
      createComponent()
      expect(component.mappingGroups).toEqual([])
    })

    it('should skip lines without the <=> separator', () => {
      createComponent({ errorDetails: 'no separator here' })
      expect(component.mappingGroups).toEqual([])
    })

    it('should skip lines with empty parent or child', () => {
      createComponent({ errorDetails: ' <=> child\nparent <=> \n<=>' })
      expect(component.mappingGroups).toEqual([])
    })

    it('should group children under their parent, deduplicated', () => {
      createComponent({
        errorDetails: 'P1 <=> C1\nP1 <=> C2\nP1 <=> C1\nP2 <=> C3',
      })
      const groups = component.mappingGroups
      expect(groups).toEqual([
        { parent: 'P1', children: ['C1', 'C2'] },
        { parent: 'P2', children: ['C3'] },
      ])
    })
  })

  describe('hasMappingDetails', () => {
    it('should be false when there are no mapping groups', () => {
      createComponent()
      expect(component.hasMappingDetails).toBe(false)
    })

    it('should be true when there are mapping groups', () => {
      createComponent({ errorDetails: 'P1 <=> C1' })
      expect(component.hasMappingDetails).toBe(true)
    })
  })

  describe('mappingPairCount', () => {
    it('should be 0 when there are no mapping groups', () => {
      createComponent()
      expect(component.mappingPairCount).toBe(0)
    })

    it('should sum children counts across all groups', () => {
      createComponent({ errorDetails: 'P1 <=> C1\nP1 <=> C2\nP2 <=> C3' })
      expect(component.mappingPairCount).toBe(3)
    })
  })

  describe('mappedRoleCount', () => {
    it('should return the number of mapping groups', () => {
      createComponent({ errorDetails: 'P1 <=> C1\nP2 <=> C2' })
      expect(component.mappedRoleCount).toBe(2)
    })
  })

  describe('modalLabels', () => {
    it('should return default labels when mappingLabels is not provided', () => {
      createComponent()
      expect(component.modalLabels).toEqual({
        sectionTitle: 'Mappings',
        parentCountLabel: 'items',
        parentLabel: 'Item',
        childrenLabel: 'Mapped',
      })
    })

    it('should return provided mappingLabels when present', () => {
      const mappingLabels = {
        sectionTitle: 'Custom',
        parentCountLabel: 'positions',
        parentLabel: 'Position',
        childrenLabel: 'Roles',
      }
      createComponent({ mappingLabels })
      expect(component.modalLabels).toBe(mappingLabels)
    })
  })

  describe('onClose', () => {
    it('should close the dialog', () => {
      createComponent()
      component.onClose()
      expect(dialogRef.close).toHaveBeenCalled()
    })
  })
})
