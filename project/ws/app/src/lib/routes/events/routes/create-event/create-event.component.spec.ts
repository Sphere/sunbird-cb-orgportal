import { of, throwError } from 'rxjs'

jest.mock('moment', () => {
  const actualMoment = jest.requireActual('moment')
  const fn: any = jest.fn((...args: any[]) => actualMoment(...args))
  Object.assign(fn, actualMoment)
  fn.__esModule = true
  return fn
})

import { CreateEventComponent } from './create-event.component'

describe('CreateEventComponent', () => {
  let component: CreateEventComponent
  let snackBar: any
  let eventsSvc: any
  let matDialog: any
  let router: any
  let configSvc: any
  let changeDetectorRefs: any
  let activeRoute: any

  const createComponent = () => {
    return new CreateEventComponent(
      snackBar,
      eventsSvc,
      matDialog,
      router,
      configSvc,
      changeDetectorRefs,
      activeRoute,
    )
  }

  beforeEach(() => {
    snackBar = { open: jest.fn() }
    eventsSvc = {
      crreateAsset: jest.fn(),
      uploadFile: jest.fn(),
      uploadCoverImage: jest.fn(),
      updateEvent: jest.fn(),
      createEvent: jest.fn(),
      publishEvent: jest.fn(),
    }
    matDialog = { open: jest.fn() }
    router = { navigate: jest.fn() }
    configSvc = { userProfile: { userId: 'u1', userName: 'uname', departmentName: 'dept1' } }
    changeDetectorRefs = { detectChanges: jest.fn() }
    activeRoute = { snapshot: { data: {} } }

    component = createComponent()
  })

  describe('constructor', () => {
    it('should set userId, username and department from configSvc.userProfile when present', () => {
      expect(component.userId).toBe('u1')
      expect(component.username).toBe('uname')
      expect(component.department).toBe('dept1')
    })

    it('should fall back to activeRoute snapshot data when userProfile is absent', () => {
      configSvc = { userProfile: null }
      activeRoute = {
        snapshot: {
          data: {
            configService: {
              userProfile: {
                rootOrgId: 'org1',
                departmentName: 'deptX',
                userId: 'uid2',
                userName: 'uname2',
              },
            },
          },
        },
      }
      const comp = createComponent()
      expect(comp.departmentID).toBe('org1')
      expect(comp.department).toBe('deptX')
      expect(comp.userId).toBe('uid2')
      expect(comp.username).toBe('uname2')
    })

    it('should leave fields undefined when neither userProfile nor route data present', () => {
      configSvc = { userProfile: null }
      activeRoute = { snapshot: { data: {} } }
      const comp = createComponent()
      expect(comp.userId).toBeUndefined()
      expect(comp.username).toBeUndefined()
    })

    it('should initialize createEventForm with expected controls and defaults', () => {
      expect(component.createEventForm.controls['eventDurationHours'].value).toBe(0)
      expect(component.createEventForm.controls['eventDurationMinutes'].value).toBe(30)
      expect(component.createEventForm.controls['eventType'].value).toBe('Webinar')
      expect(component.createEventForm.valid).toBe(false)
    })

    it('should set minDate, maxDate and todayTime', () => {
      expect(component.minDate).toBeDefined()
      expect(component.maxDate).toBeDefined()
      expect(component.todayTime).toBe('00:00')
    })
  })

  describe('ngOnInit', () => {
    it('should populate tabsData with 4 tabs', () => {
      component.ngOnInit()
      expect(component.tabsData.length).toBe(4)
      expect(component.tabsData[0].key).toBe('eventInfo')
      expect(component.tabsData[3].key).toBe('presenter')
    })

    it('should filter timeArr to only future times', () => {
      const originalLength = component.timeArr.length
      component.ngOnInit()
      expect(component.timeArr.length).toBeLessThanOrEqual(originalLength)
      const hr = new Date().getHours()
      const min = new Date().getMinutes()
      const currentTime = `${hr}:${min}`
      component.timeArr.forEach((t: any) => {
        expect(t.value > currentTime).toBe(true)
      })
    })
  })

  describe('onSideNavTabClick', () => {
    it('should update currentTab', () => {
      component.onSideNavTabClick('datetime')
      expect(component.currentTab).toBe('datetime')
    })

    it('should scroll into view if element exists', () => {
      const el = document.createElement('div')
      el.id = 'datetime'
      el.scrollIntoView = jest.fn()
      document.body.appendChild(el)
      component.onSideNavTabClick('datetime')
      expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start', inline: 'start' })
      document.body.removeChild(el)
    })

    it('should not throw when element does not exist', () => {
      expect(() => component.onSideNavTabClick('nonexistent-id')).not.toThrow()
    })
  })

  describe('openDialog', () => {
    it('should open ParticipantsComponent dialog and add presenters on response', () => {
      const afterClosed$ = of({ data: { 0: { firstName: 'John', lastName: 'Doe', email: 'j@d.com', id: '1' } } })
      matDialog.open.mockReturnValue({ afterClosed: () => afterClosed$ })
      const addPresentersSpy = jest.spyOn(component, 'addPresenters')
      component.openDialog()
      expect(matDialog.open).toHaveBeenCalled()
      expect(addPresentersSpy).toHaveBeenCalled()
    })

    it('should not call addPresenters when response is falsy', () => {
      const afterClosed$ = of(null)
      matDialog.open.mockReturnValue({ afterClosed: () => afterClosed$ })
      const addPresentersSpy = jest.spyOn(component, 'addPresenters')
      component.openDialog()
      expect(addPresentersSpy).not.toHaveBeenCalled()
    })
  })

  describe('addPresenters', () => {
    it('should push presenters and participants and update form value', () => {
      const responseObj = {
        data: {
          0: { firstName: 'John', lastName: 'Doe', email: 'j@d.com', id: 'id1' },
          1: { firstname: 'Jane', lastname: 'Roe', email: 'jr@d.com', id: 'id2' },
        },
      }
      component.addPresenters(responseObj)
      expect(component.presentersArr.length).toBe(2)
      expect(component.participantsArr.length).toBe(2)
      expect(component.presentersArr[0].name).toBe('John Doe')
      expect(component.participantsArr[1].firstname).toBe('Jane')
      expect(changeDetectorRefs.detectChanges).toHaveBeenCalled()
      expect(component.createEventForm.controls['presenters'].value).toBe(component.presentersArr)
    })
  })

  describe('close', () => {
    it('should close dialogRef', () => {
      component.dialogRef = { close: jest.fn() }
      component.close()
      expect(component.dialogRef.close).toHaveBeenCalled()
    })
  })

  describe('selectCover', () => {
    it('should click the coverPicture element', () => {
      const el = document.createElement('input')
      el.id = 'coverPicture'
      el.click = jest.fn()
      document.body.appendChild(el)
      component.selectCover()
      expect(el.click).toHaveBeenCalled()
      document.body.removeChild(el)
    })
  })

  describe('onFileSelect', () => {
    const makeEvent = (fileType = 'image/png') => {
      const file = new File(['content'], 'test.png', { type: fileType })
      return { target: { files: [file] } }
    }

    it('should do nothing when no files selected', () => {
      component.onFileSelect({ target: { files: [] } })
      expect(eventsSvc.crreateAsset).not.toHaveBeenCalled()
    })

    it('should read file, set imageSrc, and call crreateAsset/uploadFile on success', () => {
      eventsSvc.crreateAsset.mockReturnValue(of({ result: { identifier: 'cid1' } }))
      eventsSvc.uploadFile.mockReturnValue(of({ result: { artifactUrl: 'http://url' } }))

      const event = makeEvent()
      component.onFileSelect(event)

      expect(component.imageSrc).toBe(event.target.files[0])
      expect(eventsSvc.crreateAsset).toHaveBeenCalled()
      expect(eventsSvc.uploadFile).toHaveBeenCalledWith('cid1', expect.any(FormData))
      expect(component.eventimageURL).toBe('http://url')
    })
  })

  describe('removeSelectedFile', () => {
    it('should reset image fields', () => {
      component.imageSrcURL = 'x'
      component.eventimageURL = 'y'
      component.removeSelectedFile()
      expect(component.imageSrcURL).toBe('')
      expect(component.eventimageURL).toBe('')
      expect(component.createEventForm.controls['eventPicture'].value).toBe('')
    })
  })

  describe('fileSubmit', () => {
    it('should update artifactURL and call updateContent on success', () => {
      eventsSvc.uploadCoverImage.mockReturnValue(of({ artifactURL: 'art1' }))
      const updateContentSpy = jest.spyOn(component, 'updateContent').mockImplementation(() => undefined)
      component.imageSrc = new File(['x'], 'a.png')
      component.fileSubmit('id1')
      expect(component.artifactURL).toBe('art1')
      expect(updateContentSpy).toHaveBeenCalledWith('id1')
    })

    it('should call openSnackbar on error', () => {
      eventsSvc.uploadCoverImage.mockReturnValue(throwError({ error: 'Error:failed' }))
      component.imageSrc = new File(['x'], 'a.png')
      component.fileSubmit('id1')
      expect(snackBar.open).toHaveBeenCalledWith('failed', 'X', { duration: 5000 })
    })
  })

  describe('changeEventType', () => {
    it('should set eventType control value', () => {
      component.changeEventType({ target: { value: 'Webinar' } })
      expect(component.createEventForm.controls['eventType'].value).toBe('Webinar')
    })
  })

  describe('updateContent', () => {
    it('should call publishEvent on success (truthy res)', () => {
      eventsSvc.updateEvent.mockReturnValue(of(true))
      const publishSpy = jest.spyOn(component, 'publishEvent').mockImplementation(() => undefined)
      component.updateContent('id1')
      expect(publishSpy).toHaveBeenCalledWith('id1')
    })

    it('should call publishEvent on success (falsy res too, since condition is res || !res)', () => {
      eventsSvc.updateEvent.mockReturnValue(of(false))
      const publishSpy = jest.spyOn(component, 'publishEvent').mockImplementation(() => undefined)
      component.updateContent('id1')
      expect(publishSpy).toHaveBeenCalledWith('id1')
    })

    it('should call openSnackbar on error', () => {
      eventsSvc.updateEvent.mockReturnValue(throwError({ error: 'Error:bad thing' }))
      component.updateContent('id1')
      expect(snackBar.open).toHaveBeenCalledWith('bad thing', 'X', { duration: 5000 })
    })
  })

  describe('encodeToBase64', () => {
    it('should return base64-encoded data object', () => {
      const result = component.encodeToBase64({ a: 1 })
      expect(result.data).toBeDefined()
      expect(typeof result.data).toBe('string')
    })
  })

  describe('addMinutes', () => {
    it('should compute total minutes', () => {
      expect(component.addMinutes(1, 30)).toBe(90)
      expect(component.addMinutes(0, 0)).toBe(0)
    })
  })

  describe('publishEvent', () => {
    it('should call showSuccess on success', () => {
      eventsSvc.publishEvent.mockReturnValue(of({ result: 'ok' }))
      const showSuccessSpy = jest.spyOn(component, 'showSuccess').mockImplementation(() => undefined)
      component.publishEvent('id1')
      expect(showSuccessSpy).toHaveBeenCalledWith({ result: 'ok' })
    })

    it('should call openSnackbar on error', () => {
      eventsSvc.publishEvent.mockReturnValue(throwError({ error: 'Error:publish failed' }))
      component.publishEvent('id1')
      expect(snackBar.open).toHaveBeenCalledWith('publish failed', 'X', { duration: 5000 })
    })
  })

  describe('goToList', () => {
    it('should navigate to events list', () => {
      component.goToList()
      expect(router.navigate).toHaveBeenCalledWith(['/app/events'])
    })
  })

  describe('showSuccess', () => {
    it('should open SuccessComponent dialog and navigate after close', () => {
      const afterClosed$ = of(undefined)
      matDialog.open.mockReturnValue({ afterClosed: () => afterClosed$ })
      component.showSuccess({ result: 'ok' })
      expect(matDialog.open).toHaveBeenCalled()
      expect(router.navigate).toHaveBeenCalledWith(['/app/events'])
    })
  })

  describe('omit_special_char', () => {
    it('should allow uppercase letters', () => {
      expect(component.omit_special_char({ charCode: 65 })).toBe(true)
    })
    it('should allow lowercase letters', () => {
      expect(component.omit_special_char({ charCode: 97 })).toBe(true)
    })
    it('should allow backspace and space', () => {
      expect(component.omit_special_char({ charCode: 8 })).toBe(true)
      expect(component.omit_special_char({ charCode: 32 })).toBe(true)
    })
    it('should allow digits', () => {
      expect(component.omit_special_char({ charCode: 50 })).toBe(true)
    })
    it('should disallow special characters', () => {
      expect(component.omit_special_char({ charCode: 33 })).toBe(false)
    })
  })

  describe('onSubmit', () => {
    const fillValidForm = () => {
      component.createEventForm.controls['eventTitle'].setValue('My Event')
      component.createEventForm.controls['summary'].setValue('summary')
      component.createEventForm.controls['description'].setValue('desc')
      component.createEventForm.controls['agenda'].setValue('agenda')
      component.createEventForm.controls['eventType'].setValue('Webinar')
      component.createEventForm.controls['eventDate'].setValue(new Date('2026-08-01'))
      component.createEventForm.controls['eventTime'].setValue('10:00')
      component.createEventForm.controls['eventDurationHours'].setValue(1)
      component.createEventForm.controls['eventDurationMinutes'].setValue(30)
      component.createEventForm.controls['conferenceLink'].setValue('https://zoom.us/j/123')
      component.createEventForm.controls['presenters'].setValue([{ name: 'p' }])
    }

    it('should show snackbar when duration is zero', () => {
      fillValidForm()
      component.createEventForm.controls['eventDurationHours'].setValue(0)
      component.createEventForm.controls['eventDurationMinutes'].setValue(0)
      component.onSubmit()
      expect(snackBar.open).toHaveBeenCalledWith('Duration cannot be zero', 'X', { duration: 5000 })
      expect(eventsSvc.createEvent).not.toHaveBeenCalled()
    })

    it('should call createEvent and publishEvent on success for hours < 24', () => {
      fillValidForm()
      eventsSvc.createEvent.mockReturnValue(of({ result: { identifier: 'evt1' } }))
      const publishSpy = jest.spyOn(component, 'publishEvent').mockImplementation(() => undefined)
      component.onSubmit()
      expect(eventsSvc.createEvent).toHaveBeenCalled()
      expect(publishSpy).toHaveBeenCalledWith('evt1')
    })

    it('should call openSnackbar on createEvent error', () => {
      fillValidForm()
      eventsSvc.createEvent.mockReturnValue(throwError({ error: 'Error:create failed' }))
      component.onSubmit()
      expect(snackBar.open).toHaveBeenCalledWith('create failed', 'X', { duration: 5000 })
    })

    it('should handle overflow into next day (hours >= 24) and set newendDate', () => {
      fillValidForm()
      component.createEventForm.controls['eventTime'].setValue('23:00')
      component.createEventForm.controls['eventDurationHours'].setValue(2)
      component.createEventForm.controls['eventDurationMinutes'].setValue(30)
      eventsSvc.createEvent.mockReturnValue(of({ result: { identifier: 'evt2' } }))
      const publishSpy = jest.spyOn(component, 'publishEvent').mockImplementation(() => undefined)
      component.onSubmit()
      expect(eventsSvc.createEvent).toHaveBeenCalled()
      const callArg = eventsSvc.createEvent.mock.calls[0][0]
      expect(callArg.request.event.endDate).toBeDefined()
      expect(publishSpy).toHaveBeenCalledWith('evt2')
    })

    it('should handle overflow with zero minutes remainder (hours>=24, minutes===0)', () => {
      fillValidForm()
      component.createEventForm.controls['eventTime'].setValue('23:00')
      component.createEventForm.controls['eventDurationHours'].setValue(1)
      component.createEventForm.controls['eventDurationMinutes'].setValue(0)
      eventsSvc.createEvent.mockReturnValue(of({ result: { identifier: 'evt3' } }))
      const publishSpy = jest.spyOn(component, 'publishEvent').mockImplementation(() => undefined)
      component.onSubmit()
      expect(publishSpy).toHaveBeenCalledWith('evt3')
    })
  })
})
