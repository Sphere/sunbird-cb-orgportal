import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { BehaviorSubject, Observable } from 'rxjs'
import { map } from 'rxjs/operators'

const PROTECTED_SLAG_V8 = '/apis/protected/v8'

const API_END_POINTS = {
  GET_ALL_EVENTS: `${PROTECTED_SLAG_V8}/sunbirdrRcCertificate/events`,
  GET_EVENT_BY_ID: (eventId: string) => `${PROTECTED_SLAG_V8}/sunbirdrRcCertificate/events/${eventId}`,
  CREATE_EVENT: `${PROTECTED_SLAG_V8}/sunbirdrRcCertificate/events`,
  ADD_PARTICIPANTS: `${PROTECTED_SLAG_V8}/sunbirdrRcCertificate/events/users`,
  GET_PARTICIPANTS: (eventId: string) => `${PROTECTED_SLAG_V8}/sunbirdrRcCertificate/events/${eventId}/users`
}

@Injectable({
  providedIn: 'root'
})
export class EventService {

  private eventSource = new BehaviorSubject<any>(null)
  currentEvent = this.eventSource.asObservable()

  constructor(private http: HttpClient) { }

  getAllEvents(): Observable<any> {
    return this.http.get<any>(API_END_POINTS.GET_ALL_EVENTS).pipe(
      map(response => response) // Modify mapping if needed
    )
  }

  getEventById(eventId: string): Observable<any> {
    return this.http.get(API_END_POINTS.GET_EVENT_BY_ID(eventId)).pipe(
      map(response => response) // Modify mapping if needed
    )
  }

  createEvent(eventData: any): Observable<any> {
    return this.http.post<any>(API_END_POINTS.CREATE_EVENT, eventData).pipe(
      map(response => response) // Modify mapping if needed
    )
  }

  addParticipants(eventId: string, users: any[]): Observable<any> {
    const payload = { eventId, users }
    return this.http.post<any>(API_END_POINTS.ADD_PARTICIPANTS, payload).pipe(
      map(response => response) // Modify mapping if needed
    )
  }

  getParticipants(eventId: string): Observable<any> {
    return this.http.get<any>(API_END_POINTS.GET_PARTICIPANTS(eventId)).pipe(
      map(response => response) // Modify mapping if needed
    )
  }


  updateEvent(event: any) {
    this.eventSource.next(event)
  }



}
