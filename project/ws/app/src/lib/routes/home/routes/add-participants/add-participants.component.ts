import { Component, Inject, OnInit } from '@angular/core'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { EventService } from '../../services/event.service'
import * as Papa from 'papaparse'
import * as XLSX from 'xlsx'

interface Participant {
  name: string
  email: string
  [key: string]: any
}

@Component({
  selector: 'ws-app-add-participants',
  templateUrl: './add-participants.component.html',
  styleUrls: ['./add-participants.component.scss']
})
export class AddParticipantsComponent implements OnInit {
  eventId!: string // Replace with actual event ID
  participants: any[] = []

  constructor(
    private dialogRef: MatDialogRef<AddParticipantsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private eventService: EventService

  ) {
    this.eventId = data.eventId
  }

  ngOnInit(): void {

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
        console.error('Unsupported file format')
      }
    }
  }

  parseCSV(file: File): void {
    Papa.parse<Participant>(file, {
      header: true,
      complete: (result: Papa.ParseResult<Participant>) => {
        this.participants = result.data.filter(participant => {
          // Check if the participant object has valid data
          return participant.user_id && participant.user_name && participant.state && participant.city && participant.block && participant.role
        })
        console.log('Parsed CSV:', this.participants)
      },
      error: (error: any) => {
        console.error('Error parsing CSV:', error)
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
      const parsedData = XLSX.utils.sheet_to_json<Participant>(worksheet)
      this.participants = parsedData.filter(participant => {
        // Check if the participant object has valid data
        return participant.user_id && participant.user_name && participant.state && participant.city && participant.block && participant.role
      })
      console.log('Parsed Excel:', this.participants)
    }
    reader.readAsArrayBuffer(file)
  }

  saveParticipants(): void {
    if (this.participants.length > 0) {
      this.eventService.addParticipants(this.eventId, this.participants).subscribe(
        response => {
          console.log('Participants added successfully:', response)
          this.dialogRef.close('saved')
        },
        error => {
          this.dialogRef.close('error')
          console.error('Error adding participants:', error)
        }
      )
    } else {
      console.error('No participants to add')
    }
  }

  downloadSampleExcel() {
    const sampleData = `First Name,Last Name,Phone,Location\nJohn,Doe,1234567890,California\nJane,Smith,9876543210,New York`
    const blob = new Blob([sampleData], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Sample_Participants.xlsx' // Set to .csv for better compatibility
    a.click()
    window.URL.revokeObjectURL(url)
  }
}
