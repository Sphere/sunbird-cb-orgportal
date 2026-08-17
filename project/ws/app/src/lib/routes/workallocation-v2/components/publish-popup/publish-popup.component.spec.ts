import { of } from 'rxjs'
import { PublishPopupComponent } from './publish-popup.component'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

describe('PublishPopupComponent', () => {
  let component: PublishPopupComponent
  let uploadService: any
  let router: any
  let dialogRef: any
  let configSvc: any

  const dialogData = { data: { id: 'wo1' } }

  beforeEach(() => {
    uploadService = createSpyObj('UploadFileService', [
      'getProfile', 'crreateAsset', 'uploadFile', 'updateWorkOrder', 'getDraftPDF',
    ])
    uploadService.getProfile.mockReturnValue(of({ result: { response: { firstName: 'A', lastName: 'B', id: 'u1' } } }))
    router = createSpyObj('Router', ['navigate'])
    dialogRef = createSpyObj('MatDialogRef', ['close'])
    configSvc = { userProfile: { rootOrgId: 'org1', departmentName: 'dept1' } }

    component = new PublishPopupComponent(uploadService, router, dialogRef, configSvc, dialogData)
  })

  it('should be created and load profile data', () => {
    expect(component).toBeTruthy()
    expect(component.userData).toEqual({ firstName: 'A', lastName: 'B', id: 'u1' })
    expect(component.workorderData).toEqual({ id: 'wo1' })
  })

  it('addFiles clicks the hidden file input', () => {
    const click = jest.fn()
    component.file = { nativeElement: { click } }
    component.addFiles()
    expect(click).toHaveBeenCalled()
  })

  describe('onFilesAdded', () => {
    it('sets uploadedFile and calls closeDialog when a file is selected', () => {
      const closeDialogSpy = jest.spyOn(component, 'closeDialog').mockImplementation(() => undefined)
      const file = new File(['x'], 'a.pdf')
      component.onFilesAdded({ target: { files: [file] } })
      expect(component.uploading).toBe(true)
      expect(component.uploadedFile).toBe(file)
      expect(closeDialogSpy).toHaveBeenCalled()
    })

    it('does nothing further when no files present', () => {
      const closeDialogSpy = jest.spyOn(component, 'closeDialog').mockImplementation(() => undefined)
      component.onFilesAdded({ target: { files: [] } })
      expect(closeDialogSpy).not.toHaveBeenCalled()
    })
  })

  describe('closeDialog', () => {
    it('creates asset, uploads file, updates work order on success chain', () => {
      component.uploadedFile = new File(['x'], 'a.pdf')
      uploadService.crreateAsset.mockReturnValue(of({ result: { identifier: 'id1' } }))
      uploadService.uploadFile.mockReturnValue(of({ result: { artifactUrl: 'url1' } }))
      uploadService.updateWorkOrder.mockReturnValue(of({ result: { message: 'Successful' } }))

      component.closeDialog()

      expect(uploadService.crreateAsset).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.objectContaining({
            content: expect.objectContaining({
              creator: 'A B',
              createdBy: 'u1',
              organisation: ['dept1'],
              createdFor: ['org1'],
            }),
          }),
        }),
      )
      expect(uploadService.uploadFile).toHaveBeenCalledWith('id1', expect.any(FormData))
      expect(component.workorderData.signedPdfLink).toBe('url1')
      expect(component.uploading).toBe(false)
    })

    it('does not flip uploading to false when update message is not Successful', () => {
      component.uploadedFile = new File(['x'], 'a.pdf')
      component.uploading = true
      uploadService.crreateAsset.mockReturnValue(of({ result: { identifier: 'id1' } }))
      uploadService.uploadFile.mockReturnValue(of({ result: { artifactUrl: 'url1' } }))
      uploadService.updateWorkOrder.mockReturnValue(of({ result: { message: 'Failed' } }))

      component.closeDialog()

      expect(component.uploading).toBe(true)
    })

    it('omits org info when configSvc.userProfile is falsy', () => {
      configSvc.userProfile = null
      component.uploadedFile = new File(['x'], 'a.pdf')
      uploadService.crreateAsset.mockReturnValue(of({ result: { identifier: 'id1' } }))
      uploadService.uploadFile.mockReturnValue(of({ result: { artifactUrl: 'url1' } }))
      uploadService.updateWorkOrder.mockReturnValue(of({ result: { message: 'Successful' } }))

      component.closeDialog()

      expect(uploadService.crreateAsset).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.objectContaining({
            content: expect.objectContaining({ organisation: [], createdFor: [] }),
          }),
        }),
      )
    })
  })

  it('compareFiles builds a blob URL and stores signed/draft links', () => {
    ;(global as any).URL.createObjectURL = jest.fn().mockReturnValue('blob:draft')
    uploadService.getDraftPDF.mockReturnValue(of('pdfcontent'))
    component.workorderData = { id: 'wo1', signedPdfLink: 'signed-url' }

    component.compareFiles()

    expect(uploadService.getDraftPDF).toHaveBeenCalledWith('wo1')
    expect(component.comparePDF).toBe(true)
    expect(component.signedPDF).toBe('signed-url')
    expect(component.draftPDF).toBe('blob:draft')
  })

  it('publishOrder resets flags, marks published, and sets uploadSuccessful on response', () => {
    component.workorderData = { id: 'wo1' }
    uploadService.updateWorkOrder.mockReturnValue(of({ ok: true }))

    component.publishOrder()

    expect(component.comparePDF).toBe(false)
    expect(component.uploading).toBe(false)
    expect(component.uploadedFile).toBe('')
    expect(component.workorderData.status).toBe('Published')
    expect(component.uploadSuccessful).toBe(true)
  })

  it('dismiss closes dialog and navigates to workallocation Published tab', () => {
    component.dismiss()
    expect(dialogRef.close).toHaveBeenCalled()
    expect(router.navigate).toHaveBeenCalledWith(['/app/home/workallocation', { tab: 'Published' }])
  })

  it('reupload resets state flags', () => {
    component.comparePDF = true
    component.uploadedFile = 'x'
    component.uploading = true
    component.uploadSuccessful = true

    component.reupload()

    expect(component.comparePDF).toBe(false)
    expect(component.uploadedFile).toBe('')
    expect(component.uploading).toBe(false)
    expect(component.uploadSuccessful).toBe(false)
  })
})
