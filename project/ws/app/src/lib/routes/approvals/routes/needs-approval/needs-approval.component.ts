import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core'
import { NeedApprovalsService } from '../../services/need-approvals.service'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute, Router, Event, NavigationEnd } from '@angular/router'
import { NSProfileDataV2 } from '../../models/profile-v2.model'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
// tslint:disable
import _ from 'lodash'
// tslint:enable
@Component({
  standalone: false,
  selector: 'ws-app-needs-approval',
  templateUrl: './needs-approval.component.html',
  styleUrls: ['./needs-approval.component.scss'],
})

export class NeedsApprovalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>()
  @ViewChild('approveDialog', { static: false })
  approveDialog!: TemplateRef<any>
  @ViewChild('rejectDialog', { static: false })
  rejectDialog!: TemplateRef<any>
  userwfData!: any
  updatedFileds!: any
  needApprovalList: any[] = []
  userDetails: any
  changeLog!: any
  wfHistory: any[] = []
  profile!: NSProfileDataV2.IProfile
  profileData: any[] = []
  comment = ''

  constructor(
    private needApprService: NeedApprovalsService,
    private activeRoute: ActivatedRoute,
    private router: Router,
    public dialog: MatDialog, private matSnackBar: MatSnackBar) {
    this.activeRoute.data.pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
      this.profileData = data.pageData.data.profileData
    })
    this.router.events.pipe(takeUntil(this.destroy$)).subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        this.userwfData = _.first(_.get(this.activeRoute.snapshot, 'data.workflowData.data.result.data'))
        if (_.get(this, 'userwfData.wfInfo')) {
          _.forEach(_.get(this, 'userwfData.wfInfo') || [], (wf: any) => {
            if (typeof wf.updateFieldValues === 'string') {
              const fields = JSON.parse(wf.updateFieldValues)
              if (fields.length > 0) {
                fields.forEach((field: any) => {
                  const labelKey = Object.keys(field.toValue)[0]
                  const feildNameObj = this.profileData.filter(userData => userData.key === labelKey)[0]

                  this.needApprovalList.push(
                    Object.assign({
                      wf,
                      feildName: labelKey,
                      label: feildNameObj ? feildNameObj.name : null,
                      value: field.toValue[labelKey],
                      fieldKey: field.fieldKey,
                      wfId: wf.wfId,
                    })
                  )
                })
              }
            }
          })
        }
      }
    })

  }

  ngOnInit() { }

  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }

  onClickHandleWorkflow(field: any, action: string) {
    if (action === 'APPROVE') {
      const dialogRef = this.dialog.open(this.approveDialog, {
        width: '770px',
      })
      dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
        if (result) {
          this.onApproveOrRejectClick(req)
        } else {
          dialogRef.close()
        }
      })
    } else {
      const dialogRef = this.dialog.open(this.rejectDialog, {
        width: '770px',
      })
      dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
        if (result) {
          this.onApproveOrRejectClick(req)
        } else {
          dialogRef.close()
        }
      })
    }
    const req = {
      action,
      state: 'SEND_FOR_APPROVAL',
      userId: field.wf.userId,
      applicationId: field.wf.applicationId,
      actorUserId: this.userwfData.userInfo.wid,
      wfId: field.wf.wfId,
      serviceName: 'profile',
      updateFieldValues: JSON.parse(field.wf.updateFieldValues),
    }
  }

  onApproveOrRejectClick(req: any) {
    req.comment = this.comment
    this.needApprService.handleWorkflow(req).pipe(takeUntil(this.destroy$)).subscribe(res => {
      if (res.result.data) {
        this.openSnackBar('Request Approved')
        this.comment = ''
        this.needApprovalList = this.needApprovalList.filter(wf => wf.wfId !== res.result.data.wfIds[0]
        )
      }
    })
  }

  private openSnackBar(message: string) {
    this.matSnackBar.open(message)
  }
}
