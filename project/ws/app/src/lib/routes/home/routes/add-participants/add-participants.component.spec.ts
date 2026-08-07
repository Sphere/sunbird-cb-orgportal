import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog'
import { of, throwError } from 'rxjs'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { AddParticipantsComponent } from './add-participants.component'
import { EventService } from '../../services/event.service'

describe('AddParticipantsComponent', () => {
  let component: AddParticipantsComponent
  let fixture: ComponentFixture<AddParticipantsComponent>
  let dialogRef: ReturnType<typeof createSpyObj>
  let eventService: ReturnType<typeof createSpyObj>

  const build = (data = { eventId: 'test-event', eventType: false }) => {
    dialogRef = createSpyObj('MatDialogRef', ['close'])
    eventService = createSpyObj('EventService', ['addParticipants'])

    TestBed.configureTestingModule({
      declarations: [AddParticipantsComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: EventService, useValue: eventService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    fixture = TestBed.createComponent(AddParticipantsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  afterEach(() => TestBed.resetTestingModule())

  it('should create and read eventId/eventType from dialog data', () => {
    build()
    expect(component).toBeTruthy()
    expect(component.eventId).toBe('test-event')
    expect(component.eventType).toBe(false)
  })

  it('onCancel should close the dialog', () => {
    build()
    component.onCancel()
    expect(dialogRef.close).toHaveBeenCalled()
  })

  describe('onFileChange', () => {
    it('should do nothing when no file is selected', () => {
      build()
      const parseSpy = jest.spyOn(component, 'parseCSV')
      component.onFileChange({ target: { files: [] } })
      expect(parseSpy).not.toHaveBeenCalled()
    })

    it('should delegate to parseCSV for a .csv file', () => {
      build()
      const parseSpy = jest.spyOn(component, 'parseCSV').mockImplementation()
      const file = { name: 'data.csv' }
      component.onFileChange({ target: { files: [file] } })
      expect(parseSpy).toHaveBeenCalledWith(file)
    })

    it('should delegate to parseExcel for an .xlsx file', () => {
      build()
      const parseSpy = jest.spyOn(component, 'parseExcel').mockImplementation()
      const file = { name: 'data.xlsx' }
      component.onFileChange({ target: { files: [file] } })
      expect(parseSpy).toHaveBeenCalledWith(file)
    })

    it('should flag unsupported formats', () => {
      build()
      component.onFileChange({ target: { files: [{ name: 'data.txt' }] } })
      expect(component.validationErrors).toEqual(['Unsupported file format'])
    })
  })

  describe('validateParticipants', () => {
    it('should require firstName and a 10-digit phone when eventType is false', () => {
      build({ eventId: 'e1', eventType: false })
      component.participants = [{ firstName: '', phone: '123' } as any]
      component.validateParticipants()
      expect(component.validationErrors).toEqual([
        'Row 1: First Name is required.',
        'Row 1: Invalid Phone Number (must be 10 digits).',
      ])
      expect(component.isValidData).toBe(false)
    })

    it('should skip phone validation when eventType is true', () => {
      build({ eventId: 'e1', eventType: true })
      component.participants = [{ firstName: 'John', phone: 'invalid' } as any]
      component.validateParticipants()
      expect(component.validationErrors).toEqual([])
      expect(component.isValidData).toBe(true)
    })

    it('should mark valid data as valid', () => {
      build({ eventId: 'e1', eventType: false })
      component.participants = [{ firstName: 'John', phone: '1234567890' } as any]
      component.validateParticipants()
      expect(component.isValidData).toBe(true)
    })
  })

  describe('saveParticipants', () => {
    it('should do nothing when data is invalid', () => {
      build()
      component.isValidData = false
      component.saveParticipants()
      expect(eventService.addParticipants).not.toHaveBeenCalled()
    })

    it('should stringify phone numbers, submit, and close on success', () => {
      build()
      component.isValidData = true
      component.participants = [{ firstName: 'John', phone: 1234567890 } as any]
      eventService.addParticipants.mockReturnValue(of({ ok: true }))
      component.saveParticipants()
      expect(component.participants[0].phone).toBe('1234567890')
      expect(dialogRef.close).toHaveBeenCalledWith('saved')
    })

    it('should close with error on failure', () => {
      build()
      component.isValidData = true
      component.participants = [{ firstName: 'John', phone: '1234567890' } as any]
      eventService.addParticipants.mockReturnValue(throwError(new Error('boom')))
      component.saveParticipants()
      expect(dialogRef.close).toHaveBeenCalledWith('error')
    })
  })

  it('ngOnDestroy should unsubscribe if a subscription exists', () => {
    build()
    const unsubSpy = jest.fn()
    ;(component as any).subscription = { unsubscribe: unsubSpy }
    component.ngOnDestroy()
    expect(unsubSpy).toHaveBeenCalled()
  })

  it('ngOnDestroy should not throw when there is no subscription', () => {
    build()
    ;(component as any).subscription = null
    expect(() => component.ngOnDestroy()).not.toThrow()
  })

  it('downloadSampleExcel should build and download a workbook without throwing', () => {
    build()
    window.URL.createObjectURL = jest.fn().mockReturnValue('blob:mock')
    window.URL.revokeObjectURL = jest.fn()
    const anchor = { click: jest.fn(), href: '', download: '' } as unknown as HTMLAnchorElement
    jest.spyOn(document, 'createElement').mockReturnValue(anchor)
    expect(() => component.downloadSampleExcel()).not.toThrow()
    expect(anchor.click).toHaveBeenCalled()
    ;(document.createElement as jest.Mock).mockRestore()
  })
})
