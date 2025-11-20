import { Component } from '@angular/core'
import { TableColumn } from '../../components/frac-table/frac-table.component'
import { Router } from '@angular/router'


@Component({
  selector: 'app-frac-dashboard',
  templateUrl: './frac-dashboard.component.html',
  styleUrls: ['./frac-dashboard.component.scss'],
  standalone: false
})
export class FracDashboardComponent {
  constructor(private router: Router) { }
  /** Columns for recent activity table */
  recentActivityColumns: TableColumn[] = [
    { key: 'activity', label: 'Activity', width: '40%' },
    { key: 'details', label: 'Details', width: '40%' },
    { key: 'updated', label: 'Last Updated', width: '20%' },

  ];

  /** Hardcoded data for now (later from service) */
  recentActivities = [
    { activity: 'Uploaded Competencies', details: '5 new competencies added', updated: 'Oct 28, 2025' },
    { activity: 'Mapped Activities', details: '2 activities linked to roles', updated: 'Oct 27, 2025' },
    { activity: 'Added Role', details: 'New Admin role created', updated: 'Oct 26, 2025' },
    { activity: 'Uploaded Competencies', details: '5 new competencies added', updated: 'Oct 28, 2025' },
    { activity: 'Mapped Activities', details: '2 activities linked to roles', updated: 'Oct 27, 2025' },
    { activity: 'Added Role', details: 'New Admin role created', updated: 'Oct 26, 2025' }, { activity: 'Uploaded Competencies', details: '5 new competencies added', updated: 'Oct 28, 2025' },
    { activity: 'Mapped Activities', details: '2 activities linked to roles', updated: 'Oct 27, 2025' },
    { activity: 'Added Role', details: 'New Admin role created', updated: 'Oct 26, 2025' },
  ];

  /** Dashboard action cards */
  actionCards = [
    {
      title: 'Upload Competency',
      description: 'Add new competencies with code, name, description, area, and multilingual support.',
      actions: [{ label: 'Upload', icon: 'cloud_upload', redirectLink: '/app/frac/competency?mode=upload' }, { label: 'Manage', icon: 'visibility', redirectLink: '/app/frac/competency?mode=manage' }],
    },
    {
      title: 'Upload Activities',
      description: 'Upload activities that represent tasks to be mapped with competencies and roles.',
      actions: [{ label: 'Upload', icon: 'file_upload', redirectLink: '/app/frac/activity?mode=upload' }, { label: 'Manage', icon: 'sync_alt', redirectLink: '/app/frac/activity?mode=manage' }],
    },
    {
      title: 'Upload Roles',
      description: 'Add roles that define responsibilities in your organization.',
      actions: [{ label: 'Upload', icon: 'backup', redirectLink: '/app/frac/roles?mode=upload' }, { label: 'Manage', icon: 'person_add', redirectLink: '/app/frac/roles?mode=manage' }],
    },
    {
      title: 'Map Activities to Competencies',
      description: 'Link activities with the relevant competencies to build skill structures.',
      actions: [{ label: 'Map now', redirectLink: '/app/frac/map-activity', icon: 'sync_alt' }],
    },
    {
      title: 'Map Roles to Activities',
      description: 'Assign activities to roles to define what each role is responsible for.',
      actions: [{ label: 'Map now', redirectLink: '/app/frac/map-role', icon: 'sync_alt' }],
    },
    {
      title: 'Map Roles to Positions',
      description: 'Connect roles to existing organizational positions.',
      actions: [{ label: 'Map now', icon: 'sync_alt' }],
    },
  ];
  onBtnClick(redirectLink: string | undefined): void {
    if (!redirectLink) {
      console.warn('No redirect link provided')
      return
    }
    this.router.navigateByUrl(redirectLink)
    console.log('Button clicked')
  }
}
