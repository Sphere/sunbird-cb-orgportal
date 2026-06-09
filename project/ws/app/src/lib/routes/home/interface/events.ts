export interface IEventData {
  eventName: string
  eventDescription: string
  eventDate: string
  eventPlace: string
  eventType: string
  createdBy: string
  eventId?: string // Optional property
}

export interface IParticipant {
  firstName: string
  lastName?: string
  phone: string
  location: string
  [key: string]: any
}

export interface ICertificateTemplate {
  templateId: string
  templateLogo: string
  templateName: string
  registered?: boolean
}
