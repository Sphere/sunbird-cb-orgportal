import { FormPreviewDialogComponent, FormPreviewDialogData } from './form-preview-dialog.component'
import { DIFF_LINE_LIMIT } from '../../utils/diff-lines.util'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

describe('FormPreviewDialogComponent', () => {
  let dialogRefMock: any

  const baseData: Omit<FormPreviewDialogData, 'sectionDiffs'> = {
    component: 'ekshamata',
    framework: 'v2',
    rootOrgId: '12345',
    dataJson: '{\n  "a": 1\n}',
  }

  const build = (sectionDiffs: FormPreviewDialogData['sectionDiffs']) => {
    dialogRefMock = createSpyObj('MatDialogRef', ['close'])
    return new FormPreviewDialogComponent(dialogRefMock, { ...baseData, sectionDiffs })
  }

  it('should create', () => {
    const component = build([])
    expect(component).toBeTruthy()
  })

  it('exposes the injected dialog data as-is', () => {
    const sectionDiffs: FormPreviewDialogData['sectionDiffs'] = []
    const component = build(sectionDiffs)
    expect(component.data.component).toBe('ekshamata')
    expect(component.data.sectionDiffs).toBe(sectionDiffs)
  })

  it('closes with false on cancel', () => {
    const component = build([])
    component.onCancel()
    expect(dialogRefMock.close).toHaveBeenCalledWith(false)
  })

  it('closes with true on confirm', () => {
    const component = build([])
    component.onConfirm()
    expect(dialogRefMock.close).toHaveBeenCalledWith(true)
  })

  describe('sectionDiffs', () => {
    it('computes side-by-side rows for a changed section and starts it expanded', () => {
      const component = build([
        { name: 'orgData', before: '{\n  "a": 1\n}', after: '{\n  "a": 2\n}', changed: true },
      ])

      const section = component.sectionDiffs[0]
      expect(section.expanded).toBe(true)
      expect(section.rows).not.toBeNull()
      expect(section.rows).toEqual([
        { left: '{', right: '{', leftType: 'unchanged', rightType: 'unchanged' },
        { left: '  "a": 1', right: '  "a": 2', leftType: 'removed', rightType: 'added' },
        { left: '}', right: '}', leftType: 'unchanged', rightType: 'unchanged' },
      ])
    })

    it('skips diffing and starts collapsed for an unchanged section', () => {
      const component = build([
        { name: 'orgData', before: '{}', after: '{}', changed: false },
      ])

      const section = component.sectionDiffs[0]
      expect(section.expanded).toBe(false)
      expect(section.rows).toBeNull()
    })

    it('falls back to no inline diff when the combined line count exceeds DIFF_LINE_LIMIT', () => {
      const bigBefore = Array.from({ length: DIFF_LINE_LIMIT }, (_, i) => `line-${i}`).join('\n')
      const component = build([
        { name: 'LAYOUT_BODY', before: bigBefore, after: `${bigBefore}\nextra`, changed: true },
      ])

      const section = component.sectionDiffs[0]
      expect(section.rows).toBeNull()
      expect(section.changed).toBe(true)
    })

    it('reports hasAnyChange true when at least one section changed', () => {
      const component = build([
        { name: 'orgData', before: '{}', after: '{}', changed: false },
        { name: 'LAYOUT_HEADER', before: '[]', after: '[1]', changed: true },
      ])
      expect(component.hasAnyChange).toBe(true)
    })

    it('reports hasAnyChange false when no section changed', () => {
      const component = build([
        { name: 'orgData', before: '{}', after: '{}', changed: false },
      ])
      expect(component.hasAnyChange).toBe(false)
    })

    it('defaults to an empty list when sectionDiffs is not provided', () => {
      dialogRefMock = createSpyObj('MatDialogRef', ['close'])
      const component = new FormPreviewDialogComponent(dialogRefMock, { ...baseData } as FormPreviewDialogData)
      expect(component.sectionDiffs).toEqual([])
      expect(component.hasAnyChange).toBe(false)
    })
  })

  describe('toggleSection', () => {
    it('flips a section\'s expanded flag', () => {
      const component = build([
        { name: 'orgData', before: '{}', after: '{}', changed: false },
      ])
      const section = component.sectionDiffs[0]
      expect(section.expanded).toBe(false)
      component.toggleSection(section)
      expect(section.expanded).toBe(true)
      component.toggleSection(section)
      expect(section.expanded).toBe(false)
    })
  })
})
