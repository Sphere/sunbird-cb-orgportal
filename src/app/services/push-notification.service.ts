import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'

const API_END_POINTS = {
  sendByToken: `/apis/protected/v8/pushNotification/send-by-token`,
  sendByTopic: `/apis/protected/v8/pushNotification/send-by-topic`,
}

export interface IPushNotificationRequest {
  title: string
  body: string
  userIds: string[]
  /** Optional picture shown in the notification. */
  imageUrl?: string
  data?: { [key: string]: string }
}

export interface ITopicNotificationRequest {
  topic: string
  title: string
  body: string
  /** Optional picture shown in the notification. */
  imageUrl?: string
  data?: { [key: string]: string }
}

@Injectable({
  providedIn: 'root',
})
export class PushNotificationService {

  constructor(
    private readonly http: HttpClient
  ) { }

  sendByToken(request: IPushNotificationRequest): Observable<any> {
    return this.http.post<any>(API_END_POINTS.sendByToken, { request })
  }

  sendByTopic(request: ITopicNotificationRequest): Observable<any> {
    return this.http.post<any>(API_END_POINTS.sendByTopic, request)
  }
}
