import { Component, Inject, OnDestroy, OnInit } from '@angular/core'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { EventService } from '../../services/event.service'
import * as Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { Subscription } from 'rxjs'
import { IParticipant } from '../../interface/events'

@Component({
  standalone: false,
  selector: 'ws-app-add-participants',
  templateUrl: './add-participants.component.html',
  styleUrls: ['./add-participants.component.scss'],
})
export class AddParticipantsComponent implements OnInit, OnDestroy {

  eventId!: string
  participants: IParticipant[] = []
  validationErrors: string[] = [] // Stores validation messages
  isValidData = false // Controls "Save & Add" button
  private subscription: Subscription | null = null
  eventType: boolean = false

  constructor(
    private dialogRef: MatDialogRef<AddParticipantsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private eventService: EventService
  ) {
    this.eventId = data.eventId
    this.eventType = data.eventType
    // console.log('Event Type:', this.eventType)
  }

  ngOnInit(): void { }

  ngOnDestroy(): void {
    // Unsubscribe when component is destroyed
    this.subscription?.unsubscribe()
  }

  onCancel() {
    this.dialogRef.close()
  }

  onFileChange(event: any): void {
    const file = event.target.files[0]
    if (file) {
      const fileExtension = file.name.split('.').pop().toLowerCase()
      if (fileExtension === 'csv') {
        this.parseCSV(file)
      } else if (fileExtension === 'xlsx') {
        this.parseExcel(file)
      } else {
        this.validationErrors = ['Unsupported file format']
      }
    }
  }

  parseCSV(file: File): void {
    Papa.parse<IParticipant>(file, {
      header: true,
      complete: (result: Papa.ParseResult<IParticipant>) => {
        this.participants = result.data
        this.validateParticipants()
      },
      error: (error: any) => {
        console.error('Error parsing CSV:', error)
        this.validationErrors = ['Error parsing CSV file']
      },
    })
  }

  parseExcel(file: File): void {
    const reader = new FileReader()
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      this.participants = XLSX.utils.sheet_to_json<IParticipant>(worksheet)
      this.validateParticipants()
    }
    reader.readAsArrayBuffer(file)
  }

  validateParticipants(): void {
    this.validationErrors = []

    this.participants.forEach((participant, index) => {
      if (!participant.firstName) {
        this.validationErrors.push(`Row ${index + 1}: First Name is required.`)
      }

      if (this.eventType === false) {
        console.log(participant.phone)
        if (!participant.phone || !/^\d{10}$/.test(participant.phone)) {
          this.validationErrors.push(`Row ${index + 1}: Invalid Phone Number (must be 10 digits).`)
        }
      }
    })

    this.isValidData = this.validationErrors.length === 0
  }

  saveParticipants(): void {
    if (!this.isValidData) { return }

    this.participants = this.participants.map(participant => ({
      ...participant,
      phone: String(participant.phone),
    }))

    this.subscription = this.eventService.addParticipants(this.eventId, this.participants).subscribe(
      response => {
        console.log('Participants added successfully:', response)
        this.dialogRef.close('saved')
      },
      error => {
        console.error('Error adding participants:', error)
        this.dialogRef.close('error')
      }
    )
  }

  // downloadSampleExcel() {
  //   const sampleData = `firstName,lastName,phone,location\nJohn,Doe,1234567890,California\nJane,Smith,9876543210,New York`
  //   const blob = new Blob([sampleData], { type: 'text/csv' })
  //   const url = window.URL.createObjectURL(blob)
  //   const a = document.createElement('a')
  //   a.href = url
  //   a.download = 'Sample_Participants.xlsx'
  //   a.click()
  //   window.URL.revokeObjectURL(url)
  // }

  downloadSampleExcel() {

    const sampleData = [
      { firstName: 'John', lastName: 'Doe', phone: '1234567890', location: 'California' },
      { firstName: 'Jane', lastName: 'Smith', phone: '9876543210', location: 'New York' }
    ]

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(sampleData)


    const workbook: XLSX.WorkBook = {
      Sheets: { 'Sample Participants': worksheet },
      SheetNames: ['Sample Participants']
    }


    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })


    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Sample_Participants.xlsx'
    a.click()
    window.URL.revokeObjectURL(url)
  }
}
