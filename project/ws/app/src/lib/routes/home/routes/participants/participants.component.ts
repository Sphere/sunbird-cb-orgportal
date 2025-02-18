import { Component, OnInit } from '@angular/core'

@Component({
  selector: 'ws-app-participants',
  templateUrl: './participants.component.html',
  styleUrls: ['./participants.component.scss']
})
export class ParticipantsComponent implements OnInit {
  searchQuery: string = '';
  participants = [
    { name: 'User 1', designation: 'Designation 1', state: 'State 1', city: 'City 1', block: 'Block 1', subCentre: 'Sub Centre 1', competencies: 'C1L5' },
    { name: 'User 2', designation: 'Designation 2', state: 'State 2', city: 'City 2', block: 'Block 2', subCentre: 'Sub Centre 2', competencies: 'C2L4' },
    // Add more dummy data here...
  ];

  constructor() { }



  ngOnInit(): void {
  }



  filteredParticipants() {
    return this.participants.filter(participant =>
      participant.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      participant.designation.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      participant.state.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      participant.city.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      participant.block.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      participant.subCentre.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      participant.competencies.toLowerCase().includes(this.searchQuery.toLowerCase())
    )
  }


}
