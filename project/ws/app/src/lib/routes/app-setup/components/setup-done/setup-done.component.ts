import { Component, OnInit, OnDestroy } from '@angular/core'
import { SafeUrl } from '@angular/platform-browser'
import {
  ConfigurationsService,
  NsPage,
} from '@sunbird-cb/utils'
import { MatDialog } from '@angular/material/dialog'
import { AppTourDialogComponent } from '@sunbird-cb/collection'
import { Router, ActivatedRoute } from '@angular/router'
import { Globals } from '../../globals'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import { SanitizerService } from 'src/app/services/sanitizer.service'

@Component({
  standalone: false,
  selector: 'ws-app-setup-done',
  templateUrl: './setup-done.component.html',
  styleUrls: ['./setup-done.component.scss'],
})
export class SetupDoneComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>()
  appIcon: SafeUrl | null = null
  pageNavbar: Partial<NsPage.INavBackground> = this.configSvc.pageNavBar
  badges: any | null = null
  constructor(
    private readonly configSvc: ConfigurationsService,
    private readonly route: ActivatedRoute,
    private readonly sanitizerService: SanitizerService,
    private readonly matDialog: MatDialog,
    private readonly router: Router,
    private readonly globals: Globals,
  ) { }

  ngOnInit() {
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe(async data => {
      this.badges = data.badges.data
    })
    if (this.configSvc.instanceConfig) {
      this.appIcon = this.sanitizerService.trustResourceUrl(
        this.configSvc.instanceConfig.logos.thumpsUp || '',
      )
    }
  }

  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }

  finishSetup() {
    this.globals.firstTimeSetupDone = true
    this.matDialog.open(AppTourDialogComponent, {
      width: '500px',
      minHeight: '350px',
      data: 'dialog',
      backdropClass: 'backdropBackground',
    })
    this.router.navigate(['page', 'home'])
  }
}
