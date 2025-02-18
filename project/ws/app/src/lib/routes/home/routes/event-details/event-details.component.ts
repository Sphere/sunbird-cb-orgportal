import { Component, OnInit } from '@angular/core'
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router'
import { filter } from 'rxjs/operators'

@Component({
  selector: 'ws-app-event-details',
  templateUrl: './event-details.component.html',
  styleUrls: ['./event-details.component.scss']
})
export class EventDetailsComponent implements OnInit {

  eventName: any
  activeTab = 'overview';
  isCertificateRoute = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,

  ) { }

  ngOnInit(): void {
    // Get event name from navigation state
    this.eventName = history.state.name
    console.log('Event Name:', this.eventName)

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.isCertificateRoute = this.route.firstChild?.snapshot.url[0]?.path === 'certificate'
    })

    // this.route.children.forEach(childRoute => {
    //   childRoute.url.subscribe(urlSegments => {
    //     this.isCertificateRoute = urlSegments.some(segment => segment.path === 'certificate')
    //   })
    // })
  }




  setTab(tab: string) {
    this.activeTab = tab,
      this.router.navigate([tab], { relativeTo: this.route })
  }

  editEvent() {
    console.log('Edit Event Clicked')
  }




}
