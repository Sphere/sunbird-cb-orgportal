import { Component } from '@angular/core'

@Component({
  selector: 'ws-app-competency-upload',
  templateUrl: './competency-upload.component.html',
  styleUrls: ['./competency-upload.component.scss']
})
export class CompetencyUploadComponent {
  // Table configuration
  tableConfig = {
    columns: [
      { key: 'code', label: 'Code' },
      { key: 'label', label: 'Label' },
      { key: 'description', label: 'Description' },
      { key: 'domain', label: 'Domain' },
      { key: 'level1', label: 'Level 1' },
      { key: 'level2', label: 'Level 2' },
    ],
    data: [
      {
        code: 'C1',
        label: 'Pregnancy Identification',
        description: 'Conducts initial assessment to identify pregnancy and HRP',
        domain: 'Community Outreach',
        level1: 'Understands health assessment protocols',
        level2: 'Identifies pregnancy using kits',
      },
      {
        code: 'C2',
        label: 'Birth Planning',
        description: 'Creates and implements birth plans for PW including HRP',
        domain: 'Community Outreach',
        level1: 'Understands registration components',
        level2: 'Prepares schedules for PW/HRP',
      },
    ],
  }

  selectedLanguage = 'English'
  searchTerm = ''
  isOpen = false
  languages = ['English', 'Hindi', 'Kannada', 'Tamil']

  toggleDropdown() {
    this.isOpen = !this.isOpen
  }

  selectLanguage(lang: string, event: MouseEvent) {
    event.stopPropagation() // prevents parent toggle from firing again
    this.selectedLanguage = lang
    this.isOpen = false // closes dropdown
  }

  onChangeFile() {
    console.log('Change File clicked')
  }
  onDownload() {
    console.log('Download sample clicked')
  }
  onEdit() {
    console.log('Edit clicked')
  }
  onRemove() {
    console.log('Remove clicked')
  }
}
