import { of, throwError } from 'rxjs'
import { FormConfigComponent } from './form-config.component'
import { FormApiService } from '../../services/form-api.service'
import { IFormSummary } from '../../models/form.model'
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

  const summary = (overrides: Partial<IFormSummary> = {}): IFormSummary => ({
    type: 'web_layout',
    subtype: '*',
    action: 'get',
    component: 'ekshamata',
    framework: 'v2',
    rootOrgId: '0142443633580769283117',
    ...overrides,
  })

  beforeEach(() => {
    dialogMock = createSpyObj('MatDialog', ['open'])
    formApiMock = createSpyObj('FormApiService', ['readForm', 'updateForm', 'searchOrganizations', 'listForms', 'fetchAllForms'])
    formApiMock.searchOrganizations.mockReturnValue(of([]))
    formApiMock.listForms.mockReturnValue(of([]))
    formApiMock.fetchAllForms.mockReturnValue(of([]))
    component = new FormConfigComponent(dialogMock, formApiMock)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('fetches root org options and clears the loading flag on success', () => {
      formApiMock.searchOrganizations.mockReturnValue(
        of([{ value: '123', label: 'Test Org' }]),
      )
      component.ngOnInit()
      expect(component.rootOrgOptions).toEqual([{ value: '123', label: 'Test Org' }])
      expect(component.loadingRootOrgs).toBe(false)
      expect(component.orgLabel('123')).toBe('Test Org')
    })

    it('sets loading true synchronously before the fetch resolves', () => {
      // A never-resolving observable so we can observe the in-flight state.
      formApiMock.searchOrganizations.mockReturnValue({ subscribe: () => undefined } as any)
      component.ngOnInit()
      expect(component.loadingRootOrgs).toBe(true)
    })

    it('clears the loading flag without populating options on failure', () => {
      formApiMock.searchOrganizations.mockReturnValue(throwError(() => new Error('org search failed')))
      component.ngOnInit()
      expect(component.rootOrgOptions).toEqual([])
      expect(component.loadingRootOrgs).toBe(false)
    })

    it('loads the public forms by default', () => {
      formApiMock.listForms.mockReturnValue(of([summary({ rootOrgId: '*' })]))
      component.ngOnInit()
      expect(formApiMock.listForms).toHaveBeenCalledWith()
      expect(component.forms.length).toBe(1)
      expect(component.loadingForms).toBe(false)
    })
  })

  describe('browse', () => {
    it('lists an org\'s forms only once an org is picked in the Organization scope', () => {
      component.setScope('org')
      expect(formApiMock.listForms).not.toHaveBeenCalled()

      component.browseOrgId = '123'
      component.onBrowseOrgChange()
      expect(formApiMock.listForms).toHaveBeenCalledWith('123')
    })

    it('uses fetchAll for the All forms scope', () => {
      formApiMock.fetchAllForms.mockReturnValue(of([summary(), summary({ framework: '*' })]))
      component.setScope('all')
      expect(formApiMock.fetchAllForms).toHaveBeenCalled()
      expect(component.forms.length).toBe(2)
    })

    it('shows the API error message when listing fails', () => {
      formApiMock.listForms.mockReturnValue(throwError(() => ({ status: 500, error: { params: { errmsg: 'boom' } } })))
      component.loadForms()
      expect(component.formsError).toBe('boom')
      expect(component.loadingForms).toBe(false)
    })

    it('filters by text and by type', () => {
      component.forms = [summary(), summary({ type: 'app_layout', component: 'app' })]
      component.formsTypeFilter = 'app_layout'
      expect(component.filteredForms.map(f => f.type)).toEqual(['app_layout'])
      component.formsTypeFilter = ''
      component.formsFilter = 'ekshamata'
      expect(component.filteredForms.map(f => f.component)).toEqual(['ekshamata'])
    })

    it('labels the public root org as Public and falls back to the id for unknown orgs', () => {
      expect(component.orgLabel('*')).toBe('Public')
      expect(component.orgLabel('999')).toBe('999')
    })
  })

  describe('openForm', () => {
    it('reads the exact form the row points at', () => {
      formApiMock.readForm.mockReturnValue(of({ result: { form: readLayout() } }) as any)
      component.openForm(summary({ framework: '*' }))

      expect(formApiMock.readForm).toHaveBeenCalledWith({
        type: 'web_layout',
        subtype: '*',
        action: 'get',
        component: 'ekshamata',
        framework: '*',
        rootOrgId: '0142443633580769283117',
      })
    })

    it('sets the layout and builds one section per key when data is a named-sections object', () => {
      formApiMock.readForm.mockReturnValue(of({ result: { form: readLayout() } }) as any)
      component.openForm(summary())

      expect(component.opening).toBe(false)
      expect(component.layout?.component).toBe('ekshamata')
      expect(component.sections.map(s => s.name)).toEqual(['orgData', 'LAYOUT_HEADER'])
      expect(component.currentSection?.name).toBe('orgData')
    })

    it('wraps a flat array data value in a single implicit section', () => {
      formApiMock.readForm.mockReturnValue(of({ result: { form: readLayout({ data: [{ code: 'x' }] }) } }) as any)
      component.openForm(summary())

      expect(component.sections.length).toBe(1)
      expect(component.sections[0].name).toBe('Data')
      expect(component.sections[0].node.kind).toBe('array')
    })

    it('shows the API error (never a "create one" prompt) when the read fails', () => {
      formApiMock.readForm.mockReturnValue(throwError(() => ({ status: 500, error: { params: { errmsg: { message: 'data.toJSON is not a function' } } } })))
      component.openForm(summary())

      expect(component.opening).toBe(false)
      expect(component.layout).toBeNull()
      expect(component.openError).toBe('data.toJSON is not a function')
      expect(component.showCreatePanel).toBe(false)
    })

    it('explains an expired session on 401', () => {
      formApiMock.readForm.mockReturnValue(throwError(() => ({ status: 401 })))
      component.openForm(summary())
      expect(component.openError).toContain('session has expired')
    })
  })

  describe('unsaved changes', () => {
    beforeEach(() => {
      formApiMock.readForm.mockReturnValue(of({ result: { form: readLayout() } }) as any)
      component.openForm(summary())
    })

    it('reports no unsaved changes right after loading', () => {
      expect(component.hasUnsavedChanges()).toBe(false)
    })

    it('asks before going back with unsaved edits, and stays when cancelled', () => {
      component.sections[0].node.entries![0].node.value = 'Edited'
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false)

      component.backToForms()

      expect(confirmSpy).toHaveBeenCalled()
      expect(component.layout).not.toBeNull()
    })

    it('goes back without asking when nothing changed', () => {
      const confirmSpy = jest.spyOn(window, 'confirm')
      component.backToForms()
      expect(confirmSpy).not.toHaveBeenCalled()
      expect(component.layout).toBeNull()
      expect(component.openSummary).toBeNull()
    })

    it('discardChanges restores the loaded data after confirming', () => {
      component.sections[0].node.entries![0].node.value = 'Edited'
      jest.spyOn(window, 'confirm').mockReturnValue(true)

      component.discardChanges()

      expect(component.hasUnsavedChanges()).toBe(false)
      expect(component.sections[0].node.entries![0].node.value).toBe('Org')
    })
  })

  describe('expandAll / collapseAll', () => {
    it('expands every nested node, and collapses all but the section root', () => {
      formApiMock.readForm.mockReturnValue(of({ result: { form: readLayout() } }) as any)
      component.openForm(summary())
      component.selectSection(1)
      const root = component.currentSection!.node

      component.expandAll()
      expect(root.items!.every(i => i.collapsed === false)).toBe(true)

      component.collapseAll()
      expect(root.collapsed).toBe(false)
      expect(root.items!.every(i => i.collapsed === true)).toBe(true)
    })
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

    it('clears any prior create error / existing-form notice', () => {
      component.createError = 'stale error'
      component.existingMatch = summary()
      component.layoutType = 'web_layout'
      component.onLayoutTypeChange()
      expect(component.createError).toBe('')
      expect(component.existingMatch).toBeNull()
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

  describe('canCreate', () => {
    const setValid = () => {
      component.layoutType = 'web_layout'
      component.applicationType = 'ekshamata'
      component.accessType = 'private'
      component.rootOrgId = '123'
      component.framework = 'v2'
    }

    it('is true when every required selection is made', () => {
      setValid()
      expect(component.canCreate).toBe(true)
    })

    it('is false while the existing-form check is running', () => {
      setValid()
      component.checkingExisting = true
      expect(component.canCreate).toBe(false)
    })

    it('is false when applicationType is missing for web_layout', () => {
      setValid()
      component.applicationType = ''
      expect(component.canCreate).toBe(false)
    })

    it('does not require applicationType for app_layout', () => {
      component.layoutType = 'app_layout'
      component.accessType = 'public'
      component.rootOrgId = '*'
      component.framework = '*'
      expect(component.canCreate).toBe(true)
    })

    it('is false when rootOrgId, accessType, layoutType or framework is missing', () => {
      setValid()
      component.rootOrgId = ''
      expect(component.canCreate).toBe(false)
      component.rootOrgId = '123'
      component.framework = ''
      expect(component.canCreate).toBe(false)
      component.framework = 'v2'
      component.accessType = ''
      expect(component.canCreate).toBe(false)
      component.accessType = 'private'
      component.layoutType = ''
      expect(component.canCreate).toBe(false)
    })
  })

  describe('onCreateForm', () => {
    const selectPrivateEkshamata = () => {
      component.openCreatePanel()
      component.layoutType = 'web_layout'
      component.applicationType = 'ekshamata'
      component.accessType = 'private'
      component.rootOrgId = '0142443633580769283117'
      component.framework = 'v2'
    }

    it('does nothing when required selections are incomplete', () => {
      component.layoutType = 'web_layout'
      component.onCreateForm()
      expect(formApiMock.listForms).not.toHaveBeenCalled()
      expect(component.layout).toBeNull()
    })

    it('checks the org\'s existing forms and seeds an empty form when none matches', () => {
      selectPrivateEkshamata()
      formApiMock.listForms.mockReturnValue(of([summary({ framework: '*' })]))

      component.onCreateForm()

      expect(formApiMock.listForms).toHaveBeenCalledWith('0142443633580769283117')
      expect(component.existingMatch).toBeNull()
      expect(component.showCreatePanel).toBe(false)
      expect(component.layout).toEqual({
        type: 'web_layout',
        subtype: 'v1',
        action: 'get',
        component: 'ekshamata',
        framework: 'v2',
        rootOrgId: '0142443633580769283117',
        created_on: null,
        last_modified_on: null,
        data: { orgData: {}, LAYOUT_HEADER: {}, LAYOUT_BODY: {}, LAYOUT_FOOTER: {} },
      })
      expect(component.isNewForm).toBe(true)
      expect(component.sections.map(s => s.name)).toEqual(['orgData', 'LAYOUT_HEADER', 'LAYOUT_BODY', 'LAYOUT_FOOTER'])
    })

    it('offers the existing form instead of creating when the combination already exists', () => {
      selectPrivateEkshamata()
      const existing = summary()
      formApiMock.listForms.mockReturnValue(of([existing]))

      component.onCreateForm()

      expect(component.existingMatch).toEqual(existing)
      expect(component.layout).toBeNull()

      formApiMock.readForm.mockReturnValue(of({ result: { form: readLayout() } }) as any)
      component.openExistingMatch()
      expect(formApiMock.readForm).toHaveBeenCalledWith(expect.objectContaining({ framework: 'v2', subtype: '*' }))
      expect(component.layout).not.toBeNull()
    })

    it('creates nothing when the existing-form check fails', () => {
      selectPrivateEkshamata()
      formApiMock.listForms.mockReturnValue(throwError(() => ({ status: 500 })))

      component.onCreateForm()

      expect(component.layout).toBeNull()
      expect(component.createError).toContain('nothing was created')
    })

    it('checks the public forms (no org) for public access, using component "web"', () => {
      component.openCreatePanel()
      component.layoutType = 'web_layout'
      component.applicationType = 'sphere'
      component.accessType = 'public'
      component.onAccessTypeChange()

      component.onCreateForm()

      expect(formApiMock.listForms).toHaveBeenCalledWith(undefined)
      expect(component.layout?.component).toBe('web')
      expect(component.layout?.rootOrgId).toBe('*')
    })

    it('resolves component "app" for app_layout, regardless of application type', () => {
      component.openCreatePanel()
      component.layoutType = 'app_layout'
      component.accessType = 'public'
      component.onAccessTypeChange()

      component.onCreateForm()

      expect(component.layout?.component).toBe('app')
    })
  })

  describe('New Form: start from empty / upload JSON', () => {
    const selectPrivateEkshamata = () => {
      component.openCreatePanel()
      component.layoutType = 'web_layout'
      component.applicationType = 'ekshamata'
      component.accessType = 'private'
      component.rootOrgId = '0142443633580769283117'
      component.framework = 'v2'
    }

    it('seeds the Type\'s empty skeleton by default — { orgData, schemas } for app_layout', () => {
      component.openCreatePanel()
      component.layoutType = 'app_layout'
      component.accessType = 'public'
      component.onAccessTypeChange()

      component.onCreateForm()

      expect(component.layout?.data).toEqual({ orgData: {}, schemas: {} })
      expect(component.sections.map(s => s.name)).toEqual(['orgData', 'schemas'])
    })

    it('blocks Create in upload mode until a valid file is picked', () => {
      selectPrivateEkshamata()
      component.setStartFrom('upload')
      expect(component.canCreate).toBe(false)

      component.applyUploadText('ok.json', JSON.stringify({ orgData: { a: 1 } }))
      expect(component.canCreate).toBe(true)
    })

    it('seeds the uploaded bare data object on Create', () => {
      selectPrivateEkshamata()
      component.setStartFrom('upload')
      component.applyUploadText('mine.json', JSON.stringify({ orgData: { orgName: 'X' }, LAYOUT_HEADER: { isRequired: true } }))

      component.onCreateForm()

      expect(component.layout?.data).toEqual({ orgData: { orgName: 'X' }, LAYOUT_HEADER: { isRequired: true } })
      expect(component.isNewForm).toBe(true)
      expect(component.uploadedData).toBeNull()
    })

    it('uses the data of a full form export (Download JSON file)', () => {
      selectPrivateEkshamata()
      component.setStartFrom('upload')
      component.applyUploadText('export.json', JSON.stringify({ ...readLayout(), data: { orgData: { from: 'other org' } } }))

      expect(component.uploadedData).toEqual({ orgData: { from: 'other org' } })
      expect(component.uploadSectionNames).toEqual(['orgData'])
    })

    it('rejects invalid JSON and a non-object JSON value', () => {
      selectPrivateEkshamata()
      component.setStartFrom('upload')

      component.applyUploadText('bad.json', '{ not json')
      expect(component.uploadError).toBe('This file is not valid JSON.')
      expect(component.uploadedData).toBeNull()
      expect(component.canCreate).toBe(false)

      component.applyUploadText('num.json', '42')
      expect(component.uploadError).toContain('must be an object')
    })

    it('only warns when the upload\'s top-level keys don\'t match the Type', () => {
      selectPrivateEkshamata()
      component.setStartFrom('upload')
      component.applyUploadText('app.json', JSON.stringify({ orgData: {}, schemas: {} }))

      expect(component.uploadUnexpectedKeys).toEqual(['schemas'])
      expect(component.canCreate).toBe(true)

      // Switching Type re-runs the check.
      component.layoutType = 'app_layout'
      component.onLayoutTypeChange()
      expect(component.uploadUnexpectedKeys).toEqual([])
    })

    it('switching back to Empty clears the upload', () => {
      selectPrivateEkshamata()
      component.setStartFrom('upload')
      component.applyUploadText('ok.json', '{"orgData":{}}')
      component.setStartFrom('empty')
      expect(component.uploadedData).toBeNull()
      expect(component.uploadFileName).toBe('')
    })

    it('downloads the sample for the chosen Type', () => {
      const createObjectURL = jest.fn(() => 'blob:x')
      const revokeObjectURL = jest.fn()
      Object.assign(URL, { createObjectURL, revokeObjectURL })
      const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
      const createElement = jest.spyOn(document, 'createElement')

      component.layoutType = 'app_layout'
      component.downloadSample()

      const link = createElement.mock.results.find(r => (r.value as HTMLElement).tagName === 'A')!.value as HTMLAnchorElement
      expect(link.download).toBe('sample_app_layout.json')
      expect(click).toHaveBeenCalled()
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:x')
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
      component.openForm(summary())
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

    it('marks only the edited section as changed in sectionDiffs', () => {
      dialogMock.open.mockReturnValue({ afterClosed: () => of(false) })

      const orgDataSection = component.sections.find(s => s.name === 'orgData')!
      orgDataSection.node.entries![0].node.value = 'Changed Org'

      component.onUpdateForm()

      const openedData = dialogMock.open.mock.calls[0][1].data
      const diffs: any[] = openedData.sectionDiffs
      const orgDiff = diffs.find(d => d.name === 'orgData')
      const headerDiff = diffs.find(d => d.name === 'LAYOUT_HEADER')

      expect(orgDiff.changed).toBe(true)
      expect(JSON.parse(orgDiff.before)).toEqual({ name: 'Org' })
      expect(JSON.parse(orgDiff.after)).toEqual({ name: 'Changed Org' })

      expect(headerDiff.changed).toBe(false)
      expect(headerDiff.before).toBe(headerDiff.after)
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

    it('stays in the editor with a success message after a successful save, and refreshes the list', () => {
      formApiMock.updateForm.mockReturnValue(of({}) as any)
      dialogMock.open.mockReturnValue({ afterClosed: () => of(true) })
      formApiMock.listForms.mockClear()

      component.sections[0].node.entries![0].node.value = 'Changed Org'
      component.onUpdateForm()

      expect(component.saving).toBe(false)
      expect(component.layout).not.toBeNull()
      expect(component.saveSuccess).toBe('Form saved successfully.')
      expect(component.layout?.data).toEqual({ orgData: { name: 'Changed Org' }, LAYOUT_HEADER: [{ code: 'a' }] })
      // The saved data is the new baseline — nothing is "unsaved" any more.
      expect(component.hasUnsavedChanges()).toBe(false)
      expect(formApiMock.listForms).toHaveBeenCalled()
    })

    it('keeps the edits and shows the API error when updateForm fails', () => {
      formApiMock.updateForm.mockReturnValue(throwError(() => ({ status: 500, error: { params: { errmsg: 'save failed' } } })))
      dialogMock.open.mockReturnValue({ afterClosed: () => of(true) })

      component.sections[0].node.entries![0].node.value = 'Changed Org'
      component.onUpdateForm()

      expect(component.saving).toBe(false)
      expect(component.layout).not.toBeNull()
      expect(component.saveError).toBe('save failed')
      expect(component.hasUnsavedChanges()).toBe(true)
    })
  })
})
