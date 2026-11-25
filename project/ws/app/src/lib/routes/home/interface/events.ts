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
  email?: string // optional; the certificate is emailed here once generated
  [key: string]: any
}

export interface ICertificateTemplate {
  templateId: string
  templateLogo: string
  templateName: string
  registered?: boolean
}
