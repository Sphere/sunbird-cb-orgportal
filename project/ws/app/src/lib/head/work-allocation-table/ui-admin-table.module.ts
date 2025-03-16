import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { WorkAllocationTableComponent } from './work-allocation-list/table.component'
import { UIDirectoryTableComponent } from './directory-list/directory-table.component'
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table'
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip'
import { MatSortModule } from '@angular/material/sort'
import { MatIconModule } from '@angular/material/icon'
import { AppButtonModule } from '../app-button/app-button.module'
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu'
import { DefaultThumbnailModule, PipeCountTransformModule, PipeDurationTransformModule, PipeHtmlTagRemovalModule, PipePartialContentModule } from '@sunbird-cb/utils'
import { BtnChannelAnalyticsModule } from '../btn-channel-analytics/btn-channel-analytics.module'
import { BtnContentFeedbackV2Module } from '../btn-content-feedback-v2/btn-content-feedback-v2.module'
// import { BtnContentLikeModule } from '../btn-content-like/btn-content-like.module'
// import { BtnContentMailMeModule } from '../btn-content-mail-me/btn-content-mail-me.module'
import { MatLegacyPaginatorModule as MatPaginatorModule } from '@angular/material/legacy-paginator'
import { UserPopupComponent } from './user-popup/user-popup'
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog'
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button'
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox'
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field'
import { FormsModule } from '@angular/forms'
import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio'
import { WorkAllocationPopUpComponent } from './work-order-popup/pop-up.component'
import { RouterModule } from '@angular/router'
import { ComponentSharedModule } from '../../routes/workallocation-v2/components/component-shared.module'
// import { BtnPageBackModule } from '../btn-page-back/btn-page-back.module'
@NgModule({
    declarations: [WorkAllocationTableComponent, UIDirectoryTableComponent, UserPopupComponent, WorkAllocationPopUpComponent],
    imports: [
        AppButtonModule,
        CommonModule,
        MatTableModule,
        MatTooltipModule,
        MatSortModule,
        MatIconModule,
        MatMenuModule,
        DefaultThumbnailModule, PipeCountTransformModule,
        PipeDurationTransformModule, PipeHtmlTagRemovalModule,
        PipePartialContentModule,
        BtnChannelAnalyticsModule,
        BtnContentFeedbackV2Module,
        MatPaginatorModule,
        MatDialogModule, MatButtonModule,
        MatCheckboxModule,
        FormsModule,
        MatRadioModule,
        RouterModule,
        ComponentSharedModule,
        MatFormFieldModule,
    ],
    exports: [WorkAllocationTableComponent, UIDirectoryTableComponent, WorkAllocationPopUpComponent]
})
export class UIAdminTableModule { }
