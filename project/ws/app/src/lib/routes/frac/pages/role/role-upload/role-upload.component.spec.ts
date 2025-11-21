import { ComponentFixture, TestBed } from '@angular/core/testing'
import { RoleUploadComponent } from './role-upload.component'

describe('RoleUploadComponent', () => {
  let component: RoleUploadComponent
  let fixture: ComponentFixture<RoleUploadComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RoleUploadComponent]
    })
      .compileComponents()

    fixture = TestBed.createComponent(RoleUploadComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
