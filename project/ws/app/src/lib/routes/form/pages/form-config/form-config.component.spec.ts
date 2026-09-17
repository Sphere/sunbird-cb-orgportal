import { of, throwError } from 'rxjs'
import { FormConfigComponent } from './form-config.component'
import { FormApiService } from '../../services/form-api.service'
import { FormPreviewDialogComponent } from '../../components/form-preview-dialog/form-preview-dialog.component'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

describe('FormConfigComponent', () => {
  let component: FormConfigComponent
  let dialogMock: any
  let formApiMock: jest.Mocked<FormApiService>

  const readLayout = (overrides: Partial<any> = {}) => ({
    type: 'web_layout',
    subtype: 'v1',
    action: 'get',
    component: 'ekshamata',
    framework: 'v2',
    rootOrgId: '0142443633580769283117',
    created_on: '2026-01-01T00:00:00.000Z',
    last_modified_on: null,
    data: { orgData: { name: 'Org' }, LAYOUT_HEADER: [{ code: 'a' }] },
    ...overrides,
  })

  beforeEach(() => {
    dialogMock = createSpyObj('MatDialog', ['open'])
    formApiMock = createSpyObj('FormApiService', ['readForm', 'updateForm'])
    component = new FormConfigComponent(dialogMock, formApiMock)
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('onLayoutTypeChange', () => {
    it('clears applicationType when switching to app_layout', () => {
      component.applicationType = 'ekshamata'
      component.layoutType = 'app_layout'
      component.onLayoutTypeChange()
      expect(component.applicationType).toBe('')
    })

    it('keeps applicationType when Type is web_layout', () => {
      component.applicationType = 'sphere'
      component.layoutType = 'web_layout'
      component.onLayoutTypeChange()
      expect(component.applicationType).toBe('sphere')
    })

    it('clears any prior load error', () => {
      component.loadError = 'stale error'
      component.layoutType = 'web_layout'
      component.onLayoutTypeChange()
      expect(component.loadError).toBe('')
    })
  })

  describe('onAccessTypeChange', () => {
    it('locks rootOrgId to * and framework to * for public', () => {
      component.accessType = 'public'
      component.onAccessTypeChange()
      expect(component.rootOrgId).toBe('*')
      expect(component.framework).toBe('*')
    })

    it('clears rootOrgId and sets framework to v2 for private', () => {
      component.accessType = 'private'
      component.onAccessTypeChange()
      expect(component.rootOrgId).toBe('')
      expect(component.framework).toBe('v2')
    })

    it('clears both when access type is unset', () => {
      component.rootOrgId = '123'
      component.framework = 'v2'
      component.accessType = ''
      component.onAccessTypeChange()
      expect(component.rootOrgId).toBe('')
      expect(component.framework).toBe('')
    })
  })

  describe('showApplicationType', () => {
    it('is true only for web_layout', () => {
      component.layoutType = 'web_layout'
      expect(component.showApplicationType).toBe(true)
      component.layoutType = 'app_layout'
      expect(component.showApplicationType).toBe(false)
      component.layoutType = ''
      expect(component.showApplicationType).toBe(false)
    })
  })

  describe('canLoad', () => {
    const setValid = () => {
      component.layoutType = 'web_layout'
      component.applicationType = 'ekshamata'
      component.accessType = 'private'
      component.rootOrgId = '123'
    }

    it('is true when every required selection is made', () => {
      setValid()
      expect(component.canLoad).toBe(true)
    })

    it('is false while loading even if selections are complete', () => {
      setValid()
      component.loading = true
      expect(component.canLoad).toBe(false)
    })

    it('is false when applicationType is missing for web_layout', () => {
      setValid()
      component.applicationType = ''
      expect(component.canLoad).toBe(false)
    })

    it('does not require applicationType for app_layout', () => {
      component.layoutType = 'app_layout'
      component.applicationType = ''
      component.accessType = 'public'
      component.rootOrgId = '*'
      expect(component.canLoad).toBe(true)
    })

    it('is false when rootOrgId or accessType or layoutType is missing', () => {
      setValid()
      component.rootOrgId = ''
      expect(component.canLoad).toBe(false)
      component.rootOrgId = '123'
      component.accessType = ''
      expect(component.canLoad).toBe(false)
      component.accessType = 'private'
      component.layoutType = ''
      expect(component.canLoad).toBe(false)
    })
  })

  describe('loadForm', () => {
    it('does not call the API when required selections are missing', () => {
      component.layoutType = 'web_layout'
      component.applicationType = ''
      component.accessType = 'private'
      component.rootOrgId = '123'
      component.loadForm()
      expect(formApiMock.readForm).not.toHaveBeenCalled()
    })

    it('builds a web_layout/public request with component "web"', () => {
      formApiMock.readForm.mockReturnValue(of({ result: { form: readLayout() } }) as any)
      component.layoutType = 'web_layout'
      component.applicationType = 'sphere'
      component.accessType = 'public'
      component.rootOrgId = '*'
      component.framework = '*'

      component.loadForm()

      expect(formApiMock.readForm).toHaveBeenCalledWith({
        type: 'web_layout',
        subtype: 'v1',
        action: 'get',
        component: 'web',
        framework: '*',
        rootOrgId: '*',
      })
    })

    it('builds a web_layout/private request using the ekshamata/sphere component mapping', () => {
      formApiMock.readForm.mockReturnValue(of({ result: { form: readLayout() } }) as any)
      component.layoutType = 'web_layout'
      component.applicationType = 'ekshamata'
      component.accessType = 'private'
      component.rootOrgId = '0142443633580769283117'
      component.framework = 'v2'

      component.loadForm()

      expect(formApiMock.readForm).toHaveBeenCalledWith(expect.objectContaining({ component: 'ekshamata' }))
    })

    it('always uses component "app" for app_layout, regardless of application type/access', () => {
      formApiMock.readForm.mockReturnValue(of({ result: { form: readLayout() } }) as any)
      component.layoutType = 'app_layout'
      component.applicationType = ''
      component.accessType = 'public'
      component.rootOrgId = '*'
      component.framework = '*'

      component.loadForm()

      expect(formApiMock.readForm).toHaveBeenCalledWith(expect.objectContaining({ type: 'app_layout', component: 'app' }))
    })

    it('sets the layout and builds one section per key when data is a named-sections object', () => {
      formApiMock.readForm.mockReturnValue(of({ result: { form: readLayout() } }) as any)
      component.layoutType = 'web_layout'
      component.applicationType = 'ekshamata'
      component.accessType = 'private'
      component.rootOrgId = '0142443633580769283117'

      component.loadForm()

      expect(component.loading).toBe(false)
      expect(component.layout?.component).toBe('ekshamata')
      expect(component.hasSections).toBe(true)
      expect(component.sections.map(s => s.name)).toEqual(['orgData', 'LAYOUT_HEADER'])
      expect(component.currentSection?.name).toBe('orgData')
    })

    it('wraps a flat array data value in a single implicit section', () => {
      formApiMock.readForm.mockReturnValue(of({ result: { form: readLayout({ data: [{ code: 'x' }] }) } }) as any)
      component.layoutType = 'web_layout'
      component.applicationType = 'ekshamata'
      component.accessType = 'private'
      component.rootOrgId = '123'

      component.loadForm()

      expect(component.sections.length).toBe(1)
      expect(component.sections[0].name).toBe('Data')
      expect(component.sections[0].node.kind).toBe('array')
    })

    it('sets a load error and no layout when the API returns no form', () => {
      formApiMock.readForm.mockReturnValue(of({ result: {} }) as any)
      component.layoutType = 'web_layout'
      component.applicationType = 'ekshamata'
      component.accessType = 'private'
      component.rootOrgId = '123'

      component.loadForm()

      expect(component.layout).toBeNull()
      expect(component.loadError).toBe('The form-service returned no layout for this selection.')
    })

    it('sets a load error and stops loading on API failure', () => {
      formApiMock.readForm.mockReturnValue(throwError(() => new Error('network error')))
      component.layoutType = 'web_layout'
      component.applicationType = 'ekshamata'
      component.accessType = 'private'
      component.rootOrgId = '123'

      component.loadForm()

      expect(component.loading).toBe(false)
      expect(component.loadError).toBe('Could not load the form config. Please check the selections and try again.')
    })

    it('resets any previously loaded state before issuing a new request', () => {
      formApiMock.readForm.mockReturnValue(of({ result: { form: readLayout() } }) as any)
      component.layoutType = 'web_layout'
      component.applicationType = 'ekshamata'
      component.accessType = 'private'
      component.rootOrgId = '123'
      component.loadForm()
      component.selectedSectionIndex = 1
      component.validationError = 'stale'

      component.loadForm()

      expect(component.selectedSectionIndex).toBe(0)
    })
  })

  describe('selectSection', () => {
    it('updates the selected section index', () => {
      component.selectSection(2)
      expect(component.selectedSectionIndex).toBe(2)
    })
  })

  describe('onUpdateForm', () => {
    beforeEach(() => {
      formApiMock.readForm.mockReturnValue(of({ result: { form: readLayout() } }) as any)
      component.layoutType = 'web_layout'
      component.applicationType = 'ekshamata'
      component.accessType = 'private'
      component.rootOrgId = '0142443633580769283117'
      component.loadForm()
    })

    it('does nothing when there is no layout loaded', () => {
      const empty = new FormConfigComponent(dialogMock, formApiMock)
      empty.onUpdateForm()
      expect(dialogMock.open).not.toHaveBeenCalled()
    })

    it('sets a validation error and does not open the preview when a section has an invalid key', () => {
      component.sections[0].node.entries!.push({ key: '', node: { kind: 'string', value: 'x' } })
      component.onUpdateForm()
      expect(component.validationError).toBe('Every property needs a non-empty Key before saving.')
      expect(dialogMock.open).not.toHaveBeenCalled()
    })

    it('opens the preview dialog with the layout metadata and rebuilt data JSON', () => {
      dialogMock.open.mockReturnValue({ afterClosed: () => of(false) })
      component.onUpdateForm()

      expect(dialogMock.open).toHaveBeenCalledWith(
        FormPreviewDialogComponent,
        expect.objectContaining({
          data: expect.objectContaining({
            component: 'ekshamata',
            framework: 'v2',
            rootOrgId: '0142443633580769283117',
          }),
        }),
      )
      const openedData = dialogMock.open.mock.calls[0][1].data
      expect(JSON.parse(openedData.dataJson)).toEqual({ orgData: { name: 'Org' }, LAYOUT_HEADER: [{ code: 'a' }] })
    })

    it('does not call updateForm when the preview dialog is dismissed without confirming', () => {
      dialogMock.open.mockReturnValue({ afterClosed: () => of(false) })
      component.onUpdateForm()
      expect(formApiMock.updateForm).not.toHaveBeenCalled()
    })

    it('calls updateForm with the edited data and a fresh last_modified_on on confirm', () => {
      formApiMock.updateForm.mockReturnValue(of({}) as any)
      dialogMock.open.mockReturnValue({ afterClosed: () => of(true) })

      component.onUpdateForm()

      expect(formApiMock.updateForm).toHaveBeenCalledTimes(1)
      const request = formApiMock.updateForm.mock.calls[0][0]
      expect(request.component).toBe('ekshamata')
      expect(request.data).toEqual({ orgData: { name: 'Org' }, LAYOUT_HEADER: [{ code: 'a' }] })
      expect(typeof request.last_modified_on).toBe('string')
      expect(new Date(request.last_modified_on as string).toString()).not.toBe('Invalid Date')
    })

    it('resets to the selector state after a successful save', () => {
      formApiMock.updateForm.mockReturnValue(of({}) as any)
      dialogMock.open.mockReturnValue({ afterClosed: () => of(true) })

      component.onUpdateForm()

      expect(component.saving).toBe(false)
      expect(component.layout).toBeNull()
      expect(component.hasSections).toBe(false)
    })

    it('stops saving but keeps the loaded layout when updateForm fails', () => {
      formApiMock.updateForm.mockReturnValue(throwError(() => new Error('save failed')))
      dialogMock.open.mockReturnValue({ afterClosed: () => of(true) })

      component.onUpdateForm()

      expect(component.saving).toBe(false)
      expect(component.layout).not.toBeNull()
    })
  })
})
