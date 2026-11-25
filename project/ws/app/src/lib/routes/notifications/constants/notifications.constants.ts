/** Relative API endpoints used by the Notifications feature. */
export const API_END_POINTS = {
  ORG_SEARCH: '/apis/proxies/v8/org/v1/search',
  COURSE_SEARCH: '/apis/proxies/v8/sunbirdigot/search',
  // Entity search serves the Competency dropdown.
  ENTITY_SEARCH: '/apis/proxies/v8/entity/v1/search',
  // Form read serves the Program dropdown — an organisation's programs are in its mobile app layout form.
  FORM_READ: '/apis/v1/form/read',
  // User search serves the Position dropdown (designations in users' profiles) and the Certificate Users dropdown.
  USER_SEARCH: '/apis/proxies/v8/user/v1/search',
}

export const NOTIFICATION_ROUTES = {
  DASHBOARD: '/app/home/notifications',
  COURSE: '/app/home/notifications/course',
  COMPETENCY: '/app/home/notifications/competency',
  PROGRAM: '/app/home/notifications/program',
  CERTIFICATE: '/app/home/notifications/certificate',
}

/** Content-search `primaryCategory` values listed in each content dropdown. */
export const NOTIFICATION_CONTENT_CATEGORIES = {
  COURSE: ['Course'],
}

/** Form-read request (minus `rootOrgId`) for the mobile app layout, which holds each organisation's programs. */
export const PROGRAM_FORM_REQUEST = {
  type: 'app_layout',
  subtype: 'v2',
  action: 'get',
  component: 'app',
}

export const NOTIFICATION_LIMITS = {
  // Same limit as the Playlist organisation dropdown, so no organisation is cut off.
  ORG_LIST_LIMIT: 9999,
  /** Courses fetched per page; the next page loads when the admin scrolls near the end of the list. */
  CONTENT_PAGE_SIZE: 50,
  /** How close (px) to the bottom of the Course panel scrolling must get before the next page loads. */
  SCROLL_LOAD_THRESHOLD_PX: 48,
  SNACKBAR_DURATION_MS: 3000,
  /** Delay before focusing a dropdown's search box after it opens. */
  SEARCH_FOCUS_DELAY_MS: 50,
  /** Users fetched per user-search call when collecting an organisation's positions. */
  USER_PAGE_SIZE: 1000,
  /** Stop scanning users for positions after this many, so large organisations stay fast. */
  POSITION_SCAN_MAX_USERS: 5000,
  /** Max send-by-topic calls in flight when several positions are selected. */
  SEND_CONCURRENCY: 5,
  /** Wait after the last keystroke before searching courses on the server. */
  SEARCH_DEBOUNCE_MS: 300,
  /** Max rows drawn in the Users / Position panels; the search narrows the rest. Keeps big organisations responsive. */
  OPTION_RENDER_LIMIT: 200,
}

/** Fallback logos for items that have no image of their own. */
export const NOTIFICATION_DEFAULT_LOGOS = {
  // Public image, so phones can load it whatever host sent the notification.
  COMPETENCY: 'https://sunbirdcontent.s3-ap-south-1.amazonaws.com/content/do_1144059728200744961630/artifact/'
    + 'do_1144059728200744961630_1758541604543_anmtelangana1758541602842.png',
}

export type NotificationKind = 'course' | 'competency' | 'program' | 'certificate'

export type NotificationKindConfig = {
  /** Page heading */
  pageTitle: string
  pageSubtitle: string
  /** Label of the item dropdown ("Course", "Competency") */
  itemLabel: string
  /** Fallback icon in the preview when the item has no image */
  icon: string
  /** `data.actionType` sent with the push notification */
  actionType: string
  /** Default push `title` — prefilled in the editable Title field */
  defaultTitle: string
  /** Default push `body` — prefilled in the editable Body field */
  defaultBody: string
}

export const NOTIFICATION_KIND_CONFIG: Record<NotificationKind, NotificationKindConfig> = {
  course: {
    pageTitle: 'Course Notification',
    pageSubtitle: 'Select an organisation and a course to notify learners about the course. Optionally narrow it to one position.',
    itemLabel: 'Course',
    icon: 'menu_book',
    actionType: 'COURSE',
    defaultTitle: 'New Update',
    defaultBody: 'New course has been added!!! 👋',
  },
  competency: {
    pageTitle: 'Competency Notification',
    pageSubtitle: 'Select an organisation and a competency to notify learners about the competency. Optionally narrow it to one position.',
    itemLabel: 'Competency',
    icon: 'psychology',
    actionType: 'COMPETENCY',
    defaultTitle: 'New Update',
    defaultBody: 'New competency has been added!!! 👋',
  },
  program: {
    pageTitle: 'Program Notification',
    pageSubtitle: 'Select an organisation and a program to notify learners about the program. Optionally narrow it to one position.',
    itemLabel: 'Program',
    icon: 'school',
    actionType: 'PROGRAM',
    defaultTitle: 'New Update',
    defaultBody: 'New program has been added 👋',
  },
  // Sent to chosen users' devices (send-by-token), not to a topic. The competency is the one the certificate is for.
  certificate: {
    pageTitle: 'Certificate Notification',
    pageSubtitle: 'Select an organisation, the competency the certificate is for, and the users to notify.',
    itemLabel: 'Competency',
    icon: 'workspace_premium',
    actionType: 'CERTIFICATE',
    defaultTitle: 'Hello 👋',
    defaultBody: 'New certificate generated',
  },
}

/** How a notification is delivered: to a topic phones subscribe to, or to specific users' device tokens. */
export type NotificationDelivery = 'topic' | 'token'

export type NotificationCard = {
  title: string
  description: string
  icon: string
  delivery: NotificationDelivery
  redirectLink: string | null
}

/** Sections on the Notifications landing page, one per delivery type. */
export const NOTIFICATION_SECTIONS: { delivery: NotificationDelivery, title: string, description: string }[] = [
  {
    delivery: 'topic',
    title: 'Topic-based',
    description: 'Sent to everyone subscribed to an organisation, or to selected positions within it.',
  },
  {
    delivery: 'token',
    title: 'Token-based',
    description: 'Sent directly to the devices of the users you select.',
  },
]

/** Cards on the Notifications landing page. A null redirectLink renders the card as "Coming soon". */
export const NOTIFICATION_CARDS: NotificationCard[] = [
  {
    title: 'Course',
    description: 'Notify learners of an organisation and position about a course.',
    icon: 'menu_book',
    delivery: 'topic',
    redirectLink: NOTIFICATION_ROUTES.COURSE,
  },
  {
    title: 'Competency',
    description: 'Notify learners of an organisation and position about a competency.',
    icon: 'psychology',
    delivery: 'topic',
    redirectLink: NOTIFICATION_ROUTES.COMPETENCY,
  },
  {
    title: 'Program',
    description: 'Notify learners of an organisation and position about a program.',
    icon: 'school',
    delivery: 'topic',
    redirectLink: NOTIFICATION_ROUTES.PROGRAM,
  },
  {
    title: 'Certificate',
    description: 'Notify selected learners of an organisation about a certificate.',
    icon: 'workspace_premium',
    delivery: 'token',
    redirectLink: NOTIFICATION_ROUTES.CERTIFICATE,
  },
]
