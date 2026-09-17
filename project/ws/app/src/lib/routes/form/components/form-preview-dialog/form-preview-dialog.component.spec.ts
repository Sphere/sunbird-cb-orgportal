import { FormPreviewDialogComponent, FormPreviewDialogData } from './form-preview-dialog.component'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

describe('FormPreviewDialogComponent', () => {
  let component: FormPreviewDialogComponent
  let dialogRefMock: any
  const data: FormPreviewDialogData = {
    component: 'ekshamata',
    framework: 'v2',
    rootOrgId: '12345',
    dataJson: '{\n  "a": 1\n}',
  }

  beforeEach(() => {
    dialogRefMock = createSpyObj('MatDialogRef', ['close'])
    component = new FormPreviewDialogComponent(dialogRefMock, data)
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('exposes the injected dialog data as-is', () => {
    expect(component.data).toBe(data)
  })

  it('closes with false on cancel', () => {
    component.onCancel()
    expect(dialogRefMock.close).toHaveBeenCalledWith(false)
  })

  it('closes with true on confirm', () => {
    component.onConfirm()
    expect(dialogRefMock.close).toHaveBeenCalledWith(true)
  })
})
