import { Component } from '@angular/core'
import { Router } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { TableColumn } from '../../components/frac-table/frac-table.component'
import { FRAC_DASHBOARD_ICON_URLS, FracDashboardIcon, FRAC_ROUTES } from '../../constants/frac.constants'
import { resolveFracClientConfig } from '../../utils/frac-client-config.util'

type DashboardAction = {
  label: string
  icon: FracDashboardIcon
  redirectLink: string
}

type DashboardCard = {
  title: string
  description: string
  actions: DashboardAction[]
}

@Component({
  selector: 'app-frac-dashboard',
  templateUrl: './frac-dashboard.component.html',
  styleUrls: ['./frac-dashboard.component.scss'],
  standalone: false
})
export class FracDashboardComponent {
  constructor(
    private router: Router,
    private configSvc: ConfigurationsService,
  ) { }

  private readonly fracClientConfig = resolveFracClientConfig(this.configSvc?.instanceConfig)
  private readonly routes = this.fracClientConfig.routes
  private readonly dashboardIconUrls = this.fracClientConfig.dashboardIconUrls

  /** Columns shown in the "Recent Activity" table section. */
  readonly recentActivityColumns: TableColumn[] = [
    { key: 'activity', label: 'Activity', width: '40%' },
    { key: 'details', label: 'Details', width: '40%' },
    { key: 'updated', label: 'Last Updated', width: '20%' },
  ]

  /** Demo activity data until backend integration is connected. */
  readonly recentActivities = [
    { activity: 'Uploaded Competencies', details: '5 new competencies added', updated: 'Oct 28, 2025' },
    { activity: 'Mapped Activities', details: '2 activities linked to roles', updated: 'Oct 27, 2025' },
    { activity: 'Added Role', details: 'New Admin role created', updated: 'Oct 26, 2025' },
    { activity: 'Uploaded Competencies', details: '5 new competencies added', updated: 'Oct 28, 2025' },
    { activity: 'Mapped Activities', details: '2 activities linked to roles', updated: 'Oct 27, 2025' },
    { activity: 'Added Role', details: 'New Admin role created', updated: 'Oct 26, 2025' },
    { activity: 'Uploaded Competencies', details: '5 new competencies added', updated: 'Oct 28, 2025' },
    { activity: 'Mapped Activities', details: '2 activities linked to roles', updated: 'Oct 27, 2025' },
    { activity: 'Added Role', details: 'New Admin role created', updated: 'Oct 26, 2025' },
  ]

  /** Cards and actions displayed on FRAC dashboard. */
  readonly actionCards: DashboardCard[] = [
    {
      title: 'Upload Competency',
      description: 'Add new competencies with code, name, description, area, and multilingual support.',
      actions: [
        { label: 'Upload', icon: 'upload', redirectLink: this.routes.competencyUpload || FRAC_ROUTES.competencyUpload },
        { label: 'Manage', icon: 'manage', redirectLink: this.routes.competencyManage || FRAC_ROUTES.competencyManage },
      ],
    },
    {
      title: 'Upload Activities',
      description: 'Upload activities that represent tasks to be mapped with competencies and roles.',
      actions: [
        { label: 'Upload', icon: 'upload', redirectLink: this.routes.activityUpload || FRAC_ROUTES.activityUpload },
        { label: 'Manage', icon: 'manage', redirectLink: this.routes.activityManage || FRAC_ROUTES.activityManage },
      ],
    },
    {
      title: 'Upload Roles',
      description: 'Add roles that define responsibilities in your organization.',
      actions: [
        { label: 'Upload', icon: 'upload', redirectLink: this.routes.roleUpload || FRAC_ROUTES.roleUpload },
        { label: 'Manage', icon: 'manage', redirectLink: this.routes.roleManage || FRAC_ROUTES.roleManage },
      ],
    },
    // {
    //   title: 'Upload Positions',
    //   description: 'Add and manage organizational positions.',
    //   actions: [
    //     { label: 'Upload', icon: 'upload', redirectLink: this.routes.positionUpload || FRAC_ROUTES.positionUpload },
    //     { label: 'Manage', icon: 'manage', redirectLink: this.routes.positionManage || FRAC_ROUTES.positionManage },
    //   ],
    // },
    {
      title: 'Map Activities to Competencies',
      description: 'Link activities with the relevant competencies to build skill structures.',
      actions: [{ label: 'Map now', redirectLink: this.routes.mapActivity || FRAC_ROUTES.mapActivity, icon: 'map' as FracDashboardIcon }],
    },
    {
      title: 'Map Roles to Activities',
      description: 'Assign activities to roles to define what each role is responsible for.',
      actions: [{ label: 'Map now', redirectLink: this.routes.mapRole || FRAC_ROUTES.mapRole, icon: 'map' as FracDashboardIcon }],
    },
    ...(this.fracClientConfig.featureFlags.enableRolePositionMapping
      ? [{
        title: 'Map Roles to Positions',
        description: 'Connect roles to existing organizational positions.',
        actions: [{ label: 'Map now', redirectLink: this.routes.mapRolePosition || FRAC_ROUTES.mapRolePosition, icon: 'map' as FracDashboardIcon }],
      }]
      : []),
  ]

  /**
   * Navigates to the target page when a dashboard button is clicked.
   */
  onBtnClick(redirectLink: string | undefined): void {
    if (!redirectLink) {
      return
    }
    this.router.navigateByUrl(redirectLink)
  }

  /**
   * Returns the configured icon URL for the given action type.
   */
  getIconUrl(iconName: string): string {
    return this.dashboardIconUrls[iconName as FracDashboardIcon] || FRAC_DASHBOARD_ICON_URLS[iconName as FracDashboardIcon] || ''
  }
}
