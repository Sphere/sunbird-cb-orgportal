import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { FracUploadPopupComponent } from './frac-upload-popup.component'

describe('FracUploadPopupComponent', () => {
  let component: FracUploadPopupComponent
  let fixture: ComponentFixture<FracUploadPopupComponent>
  let dialogRef: any
  let alertSpy: jest.SpyInstance

  const build = (config: any = { title: 'Upload' }) => {
    dialogRef = createSpyObj('MatDialogRef', ['close'])
    TestBed.configureTestingModule({
      declarations: [FracUploadPopupComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: config },
        { provide: MatDialogRef, useValue: dialogRef },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    fixture = TestBed.createComponent(FracUploadPopupComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  beforeEach(() => {
    alertSpy = jest.spyOn(window, 'alert').mockImplementation()
  })

  afterEach(() => {
    alertSpy.mockRestore()
    TestBed.resetTestingModule()
  })

  it('should create with defaults when config is minimal', () => {
    build({})
    expect(component).toBeTruthy()
    expect(component.selectedLanguage).toBe('')
    expect(component.allowedTypes).toBe('.csv,.xlsx')
  })

  it('should seed selectedLanguage and allowedTypes from config', () => {
    build({ dropdown: { defaultValue: 'en' }, fileSection: { allowedTypes: ['.csv'] } })
    expect(component.selectedLanguage).toBe('en')
    expect(component.allowedTypes).toBe('.csv')
  })

  describe('onFileSelected', () => {
    it('should do nothing when no file is chosen', () => {
      build()
      component.onFileSelected({ target: { files: [] } } as unknown as Event)
      expect(component.selectedFile).toBeNull()
    })

    it('should set a valid file', () => {
      build()
      const file = new File(['x'], 'a.csv')
      component.onFileSelected({ target: { files: [file] } } as unknown as Event)
      expect(component.selectedFile).toBe(file)
    })

    it('should alert and reject an invalid extension', () => {
      build()
      const file = new File(['x'], 'a.pdf')
      component.onFileSelected({ target: { files: [file] } } as unknown as Event)
      expect(component.selectedFile).toBeNull()
      expect(alertSpy).toHaveBeenCalled()
    })

    it('should use the configured invalid-file-type message', () => {
      build({ validationMessages: { invalidFileTypePrefix: 'Nope:' } })
      const file = new File(['x'], 'a.pdf')
      component.onFileSelected({ target: { files: [file] } } as unknown as Event)
      expect(alertSpy).toHaveBeenCalledWith('Nope: .csv,.xlsx')
    })
  })

  it('onDragOver should prevent default and set isDragOver', () => {
    build()
    const event = { preventDefault: jest.fn(), stopPropagation: jest.fn() } as unknown as DragEvent
    component.onDragOver(event)
    expect(event.preventDefault).toHaveBeenCalled()
    expect(component.isDragOver).toBe(true)
  })

  it('onDragLeave should clear isDragOver', () => {
    build()
    component.isDragOver = true
    const event = { preventDefault: jest.fn(), stopPropagation: jest.fn() } as unknown as DragEvent
    component.onDragLeave(event)
    expect(component.isDragOver).toBe(false)
  })

  describe('onFileDrop', () => {
    it('should validate and set a dropped file', () => {
      build()
      const file = new File(['x'], 'a.csv')
      const event = {
        preventDefault: jest.fn(), stopPropagation: jest.fn(),
        dataTransfer: { files: [file] },
      } as unknown as DragEvent
      component.onFileDrop(event)
      expect(component.selectedFile).toBe(file)
      expect(component.isDragOver).toBe(false)
    })

    it('should do nothing when no file was dropped', () => {
      build()
      const event = {
        preventDefault: jest.fn(), stopPropagation: jest.fn(), dataTransfer: { files: [] },
      } as unknown as DragEvent
      component.onFileDrop(event)
      expect(component.selectedFile).toBeNull()
    })
  })

  it('removeFile should clear the selected file', () => {
    build()
    component.selectedFile = new File(['x'], 'a.csv')
    component.removeFile()
    expect(component.selectedFile).toBeNull()
  })

  it('close should close the dialog with no result', () => {
    build()
    component.close()
    expect(dialogRef.close).toHaveBeenCalledWith()
  })

  describe('onConfirmUpload', () => {
    it('should alert when no file is selected', () => {
      build()
      component.onConfirmUpload()
      expect(alertSpy).toHaveBeenCalledWith('Please select a file first.')
      expect(dialogRef.close).not.toHaveBeenCalled()
    })

    it('should use the configured fileRequired message', () => {
      build({ validationMessages: { fileRequired: 'Pick one!' } })
      component.onConfirmUpload()
      expect(alertSpy).toHaveBeenCalledWith('Pick one!')
    })

    it('should close the dialog with the selected file/language', () => {
      build()
      const file = new File(['x'], 'a.csv')
      component.selectedFile = file
      component.selectedLanguage = 'en'
      component.onConfirmUpload()
      expect(dialogRef.close).toHaveBeenCalledWith({ action: 'upload', file, language: 'en' })
    })
  })

  it('toggleDropdown should flip isDropdownOpen', () => {
    build()
    component.isDropdownOpen = false
    component.toggleDropdown()
    expect(component.isDropdownOpen).toBe(true)
  })

  it('selectLanguage should set the language and close the dropdown', () => {
    build()
    component.isDropdownOpen = true
    component.selectLanguage('hi')
    expect(component.selectedLanguage).toBe('hi')
    expect(component.isDropdownOpen).toBe(false)
  })

  describe('handleClickOutside', () => {
    it('should close the dropdown when the click is outside the container', () => {
      build()
      component.isDropdownOpen = true
      component.dropdownContainer = { nativeElement: { contains: () => false } } as any
      component.handleClickOutside({ target: {} } as unknown as Event)
      expect(component.isDropdownOpen).toBe(false)
    })

    it('should keep the dropdown open when the click is inside the container', () => {
      build()
      component.isDropdownOpen = true
      component.dropdownContainer = { nativeElement: { contains: () => true } } as any
      component.handleClickOutside({ target: {} } as unknown as Event)
      expect(component.isDropdownOpen).toBe(true)
    })

    it('should do nothing when the dropdown is already closed', () => {
      build()
      component.isDropdownOpen = false
      component.handleClickOutside({ target: {} } as unknown as Event)
      expect(component.isDropdownOpen).toBe(false)
    })
  })
})
