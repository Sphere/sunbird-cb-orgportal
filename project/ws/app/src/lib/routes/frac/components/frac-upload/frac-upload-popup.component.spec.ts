import { ComponentFixture, TestBed } from '@angular/core/testing'

import { FracUploadComponent } from './frac-upload-popup.component'

describe('FracUploadComponent', () => {
  let component: FracUploadComponent
  let fixture: ComponentFixture<FracUploadComponent>

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FracUploadComponent]
    })
    fixture = TestBed.createComponent(FracUploadComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
