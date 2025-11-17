import { Component, OnInit } from '@angular/core'
import { Activity } from '../../../models/activity-competency.models'
import { transformActivities, transformCompetencies } from '../../../utils/common.util'
// Load mock JSON without requiring tsconfig changes for resolveJsonModule
// const mockCompentencyRes: any = require('../../../../../lib/routes/frac/mock-api-response/mockCompentencyRes.json')
import mockCompentencyRes from '../../../mock-api-response/mockCompentencyRes.json'
import mockAcitivityRes from '../../../mock-api-response/mockActivityRes.json'



@Component({
  selector: 'ws-app-map-activitiy-competencies',
  templateUrl: './map-activity-competencies.component.html',
  styleUrls: ['./map-activity-competencies.component.scss']
})
export class MapActivityCompetenciesComponent implements OnInit {
  // activities: Activity[] = [
  //   {
  //     code: 'A1',
  //     title: 'Detect pregnancy and calculate Estimated Delivery Date of PW',
  //     expanded: true,
  //     competencies: [
  //       { code: 'C1', label: 'Pregnancy Identification', levels: 'L1 L2' },
  //       { code: 'C2', label: 'Birth Planning and Prep...', levels: 'L2, L3' },
  //       { code: 'C3', label: 'Vaginal examination and...', levels: 'L1, L4, L5' },
  //       { code: 'C4', label: 'Normal delivery', levels: 'L1-L5' }
  //     ]
  //   },
  //   {
  //     code: 'A2',
  //     title: 'Birth Planning and Preparedness',
  //     expanded: true,
  //     competencies: [
  //       { code: 'C1', label: 'Pregnancy Identification', levels: 'L1 L2' },
  //       { code: 'C2', label: 'Birth Planning and Prep...', levels: 'L2, L3' },
  //       { code: 'C3', label: 'Vaginal examination and...', levels: 'L1, L4, L5' },
  //       { code: 'C4', label: 'Normal delivery', levels: 'L1-L5' }
  //     ]
  //   }
  // ];

  // competencies = [
  //   { code: 'C1', label: 'Pregnancy Identification' },
  //   { code: 'C2', label: 'Birth Planning & Preparedness' },
  //   { code: 'C3', label: 'Vaginal Examination' },
  //   { code: 'C4', label: 'Normal Delivery' },
  //   { code: 'C10', label: 'Neonatal Resuscitation' }
  // ];
  languages = ['English', 'Hindi', 'Kannada'];
  selectedLanguage = 'English';
  isOpen = false;
  isEditing = true;
  // Optional API response holder (if available at runtime)
  apiResponse?: any

  // Levels derived from competencies
  levels: string[] = []

  // Filtered competencies for the table/view
  filteredCompetencies: any[] = [];
  compentencyData: any[] = [];
  competencies: any[] = [];
  selectedMap: any = {};
  selectedCompetencies: any[] = [];
  filteredActivities: any[] = [];
  expandedActivity: any = null;
  activities: any[] = [];
  activitiesData: any[] = [];
  selectedActivity: any = null;

  ngOnInit() {
    console.log('Mock entity:', mockCompentencyRes.result?.data?.entity)

    const apiEntity = mockCompentencyRes.result?.data?.entity || this.apiResponse?.entity  // from API
    const transformed = transformCompetencies(apiEntity)

    console.log('Transformed competencies:', transformed)
    this.compentencyData = transformed

    // this.competencies = transformed
    console.log('Transformed competencies set to component property:', this.competencies)

    // Dynamic level list from API children
    // this.levels = transformed[0]?.levels.map((l: any) => l.level) || []
    // console.log('Levels:', this.levels)

    // Pass to table component
    // this.filteredCompetencies = [...this.competencies]
    // console.log('Filtered competencies initialized:', this.filteredCompetencies)
    this.getActivities()
  }

  getActivities() {
    const apiEntity = mockAcitivityRes.result?.data?.entity || []


    this.activitiesData = transformActivities(apiEntity)
    console.log('Transformed activities set to component property:', this.activitiesData)
    // this.activities = [...this.activitiesData];
    // this.filteredActivities = [...this.activities]
  }

  expand(activity: Activity) {
    this.expandedActivity = this.expandedActivity === activity ? null : activity
  }

  onCheck({ code, level, checked }: any) {
    if (!this.selectedMap[code]) {
      this.selectedMap[code] = []
    }

    if (checked) {
      // avoid duplicates
      if (!this.selectedMap[code].includes(level)) {
        this.selectedMap[code].push(level)
      }
    } else {
      this.selectedMap[code] = this.selectedMap[code].filter((l: string) => l !== level)
    }

    console.log('Updated mapping (parent):', this.selectedMap)

    // ⬅️ Build the extra competencies summary object
    this.transformSelCompetencies()
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen
  }

  selectLanguage(lang: string, event: MouseEvent) {
    event.stopPropagation()
    this.selectedLanguage = lang
    this.isOpen = false
  }
  onSaveClicked() {
    const payload = {
      childMap: this.selectedMap,
      competencies: this.selectedCompetencies,
    }

    console.log('Final payload to save:', payload)
    // call API here with payload
  }


  onAddCompetency() {
    console.log('Add Competency clicked.')
  }
  onCompetencySearch(searchkey: string) {
    console.log('Search term:-parent', searchkey)
    const searchText = searchkey.toLowerCase()

    this.filteredCompetencies = this.compentencyData.filter(c =>
      c.code.toLowerCase().includes(searchText) ||
      c.label.toLowerCase().includes(searchText)
    )

    this.competencies = this.filteredCompetencies

    this.levels = this.filteredCompetencies[0]?.levels.map((l: any) => l.level) || []

  }

  transformSelCompetencies() {
    this.selectedCompetencies = Object.keys(this.selectedMap).map(code => {
      // Find competency meta to get label
      const comp = this.compentencyData.find(c => c.code === code)

      // Extract level part from levelCode: "C5013_L3" -> "L3"
      const levelsArray = this.selectedMap[code]
        .map((lv: string) => lv.split('_')[1]) // ["L1","L3","L5"]
        .sort((a: any, b: any) => Number(a.substring(1)) - Number(b.substring(1))) // sort by number

      let levelsString = ''

      // If L1-L5 full range, compress to "L1-L5"
      if (this.hasFullRange(levelsArray)) {
        levelsString = `${levelsArray[0]}-${levelsArray[levelsArray.length - 1]}`
      } else {
        levelsString = levelsArray.join(',')
      }

      return {
        code,
        label: comp?.label || '',
        levels: levelsString,
      }
    })

    console.log('Selected competencies summary:', this.selectedCompetencies)
  }

  hasFullRange(levels: string[]): boolean {
    const expected = ['L1', 'L2', 'L3', 'L4', 'L5']
    return (
      levels.length === expected.length &&
      expected.every((lvl, index) => levels[index] === lvl)
    )
  }



  onActivitySelected(activity: any) {
    this.selectedActivity = activity
    console.log("Parent received selected activity:", activity)
  }
  onActivitySearch(keyword: string) {
    const text = keyword.toLowerCase()

    this.filteredActivities = this.activitiesData.filter(a =>
      a.code.toLowerCase().includes(text) ||
      a.title.toLowerCase().includes(text)
    )
    this.activities = this.filteredActivities
  }
  // onAddCompetencyToActivity() {
  //   console.log('Add Competency to Activity clicked.')
  //   const selectedActivity: any = this.selectedActivity
  //   if (!selectedActivity) {
  //     console.warn("No activity selected")
  //     return
  //   }

  //   if (!selectedActivity.competencyDetails) {
  //     selectedActivity.competencyDetails = []
  //   }

  //   // Merge competencies into activity
  //   this.selectedCompetencies.forEach(comp => {
  //     const alreadyExists = selectedActivity.competencyDetails
  //       .some((c: any) => c.code === comp.code)

  //     if (!alreadyExists) {
  //       selectedActivity.competencyDetails.push(comp)
  //     }
  //   })
  //   this.activities = [...selectedActivity]
  //   console.log("Updated Activity:", selectedActivity)
  // }


  onAddCompetencyToActivity(selectedCompetencies: any[]) {
    console.log('selectedCompetencies==', selectedCompetencies)
    if (!this.selectedActivity) {
      console.warn("No activity selected")
      return
    }

    if (!this.selectedActivity.competencyDetails) {
      this.selectedActivity.competencyDetails = []
    }

    // STEP 1: Rebuild the merged selected competencies
    this.transformSelCompetencies() // updates this.selectedCompetencies

    // STEP 2: Merge each competency into selectedActivity
    this.selectedCompetencies.forEach(newComp => {
      const existing = this.selectedActivity.competencyDetails
        .find((c: any) => c.code === newComp.code)

      if (existing) {
        // Update existing entry (levels may change)
        existing.levels = newComp.levels
      } else {
        // Add brand new competency
        this.selectedActivity.competencyDetails.push({
          code: newComp.code,
          label: newComp.label,
          levels: newComp.levels
        })
      }
    })

    console.log("Updated Activity:", this.selectedActivity)

    // STEP 3: UPDATE the activities list so UI refreshes correctly
    this.activities = this.activities.map(a =>
      a.code === this.selectedActivity.code ? { ...this.selectedActivity } : a
    )

    console.log("Activities list updated:", this.activities)
  }

}
