import { Component, Inject, OnInit } from '@angular/core'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { EventService } from '../../services/event.service'
import * as Papa from 'papaparse'
import * as XLSX from 'xlsx'

interface Participant {
  firstName: string
  lastName?: string
  phone: string
  location: string
  [key: string]: any
}

@Component({
  selector: 'ws-app-add-participants',
  templateUrl: './add-participants.component.html',
  styleUrls: ['./add-participants.component.scss']
})
export class AddParticipantsComponent implements OnInit {
  eventId!: string
  participants: Participant[] = []
  validationErrors: string[] = [] // Stores validation messages
  isValidData: boolean = false // Controls "Save & Add" button

  constructor(
    private dialogRef: MatDialogRef<AddParticipantsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private eventService: EventService
  ) {
    this.eventId = data.eventId
  }

  ngOnInit(): void { }

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
    Papa.parse<Participant>(file, {
      header: true,
      complete: (result: Papa.ParseResult<Participant>) => {
        this.participants = result.data
        this.validateParticipants()
      },
      error: (error: any) => {
        console.error('Error parsing CSV:', error)
        this.validationErrors = ['Error parsing CSV file']
      }
    })
  }

  parseExcel(file: File): void {
    const reader = new FileReader()
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      this.participants = XLSX.utils.sheet_to_json<Participant>(worksheet)
      this.validateParticipants()
    }
    reader.readAsArrayBuffer(file)
  }

  validateParticipants(): void {
    this.validationErrors = []

    this.participants.forEach((participant, index) => {
      console.log(participant.firstName)
      console.log(participant)
      if (!participant.firstName) {
        this.validationErrors.push(`Row ${index + 1}: First Name is required.`)
      }
      console.log(participant.phone)
      if (!participant.phone || !/^\d{10}$/.test(participant.phone)) {
        this.validationErrors.push(`Row ${index + 1}: Invalid Phone Number (must be 10 digits).`)
      }
    })

    this.isValidData = this.validationErrors.length === 0
  }

  saveParticipants(): void {
    if (!this.isValidData) return

    this.participants = this.participants.map(participant => ({
      ...participant,
      phone: String(participant.phone)
    }))

    this.eventService.addParticipants(this.eventId, this.participants).subscribe(
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

  downloadSampleExcel() {
    const sampleData = `firstName,lastName,phone,location\nJohn,Doe,1234567890,California\nJane,Smith,9876543210,New York`
    const blob = new Blob([sampleData], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Sample_Participants.xlsx'
    a.click()
    window.URL.revokeObjectURL(url)
  }
}
