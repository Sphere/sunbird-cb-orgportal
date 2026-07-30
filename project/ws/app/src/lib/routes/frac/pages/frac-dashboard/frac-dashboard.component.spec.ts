import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { Router } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { FracDashboardComponent } from './frac-dashboard.component'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

describe('FracDashboardComponent', () => {
  let component: FracDashboardComponent
  let fixture: ComponentFixture<FracDashboardComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FracDashboardComponent],
      providers: [
        { provide: Router, useValue: createSpyObj('Router', ['navigateByUrl']) },
        { provide: ConfigurationsService, useValue: { instanceConfig: {} } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    fixture = TestBed.createComponent(FracDashboardComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
