import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable, forkJoin, from, of } from 'rxjs'
import { catchError, map, mergeMap, switchMap, toArray } from 'rxjs/operators'
import {
  API_END_POINTS,
  NOTIFICATION_CONTENT_CATEGORIES,
  NOTIFICATION_DEFAULT_LOGOS,
  NOTIFICATION_KIND_CONFIG,
  NOTIFICATION_LIMITS,
  NotificationKind,
  PROGRAM_FORM_REQUEST,
} from '../constants/notifications.constants'
import {
  IPushNotificationRequest,
  ITopicNotificationRequest,
  PushNotificationService,
} from '../../../../../../../../src/app/services/push-notification.service'

/** A selectable course or competency. `image` is '' when the item has none. */
export interface NotificationItem {
  identifier: string
  name: string
  image: string
}

export interface NotificationOrg {
  id: string
  name: string
}

interface OrgSearchResponse {
  result?: { response?: { content?: { id?: string, orgName?: string, channel?: string }[] } }
}

interface CourseSearchItem {
  identifier?: string
  name?: string
  posterImage?: string
  appIcon?: string
}

interface CourseSearchResponse {
  result?: { count?: number, content?: CourseSearchItem[] }
}

/**
 * A list that may not be complete. `total` is how many exist on the server, so the page can say when it shows fewer:
 * for courses, all matching courses; for users and positions, all users in the organisation.
 */
export interface PartialList<T> {
  items: T[]
  total: number
  /** True when only part of the server's results were loaded. */
  truncated: boolean
}

interface EntitySearchItem {
  entityId?: string | number
  id?: string | number
  name?: string
}

interface EntitySearchResponse {
  result?: { entity?: EntitySearchItem[] }
}

/** One program in the app layout form's `programConfig.programs`. */
interface ProgramConfigItem {
  playlistConfigId?: string
  title?: string
  thumbnail?: string
}

interface UserSearchItem {
  id?: string
  userId?: string
  firstName?: string
  lastName?: string
  maskedEmail?: string
  maskedPhone?: string
  profileDetails?: { profileReq?: { professionalDetails?: { designation?: string }[] } } | null
}

/** A user who can receive a certificate notification. `contact` is the masked email or phone, '' when neither. */
export interface NotificationUser {
  id: string
  name: string
  contact: string
}

export interface SendCertificateNotificationRequest {
  item: NotificationItem
  userIds: string[]
  title: string
  body: string
  /** Optional — notification picture; omitted when left empty. */
  imageUrl?: string
}

interface UserSearchResponse {
  result?: { response?: { count?: number, content?: UserSearchItem[] } }
}

export interface SendNotificationRequest {
  orgId: string
  item: NotificationItem
  /** Empty: one call to the whole organisation (`<orgId>`). Otherwise one call per position (`<orgId>_<position>`). */
  positions: string[]
  /** Push title and body as edited by the admin. The body is also sent as `data.header`. */
  title: string
  body: string
  /** Optional — notification picture; omitted when left empty. */
  imageUrl?: string
}

/** Outcome of one send-by-topic call. `position` is null for the whole-organisation topic. */
export interface TopicSendResult {
  topic: string
  position: string | null
  success: boolean
}

@Injectable({
  providedIn: 'root',
})
export class NotificationApiService {
  constructor(
    private readonly http: HttpClient,
    private readonly pushNotificationSvc: PushNotificationService,
  ) { }

  /** Organisations for the organisation dropdown, sorted by name. */
  getOrganisations(): Observable<NotificationOrg[]> {
    const payload = {
      request: {
        filters: {},
        fields: ['id', 'orgName', 'channel'],
        sortBy: { createdDate: 'Desc' },
        limit: NOTIFICATION_LIMITS.ORG_LIST_LIMIT,
      },
    }
    return this.http.post<OrgSearchResponse>(API_END_POINTS.ORG_SEARCH, payload).pipe(
      map(res => (res?.result?.response?.content || [])
        .filter(org => !!org.id)
        .map(org => ({
          id: String(org.id),
          name: org.orgName || org.channel || 'Unknown Organisation',
        }))
        .sort((a, b) => a.name.localeCompare(b.name))),
    )
  }

  /**
   * Live courses matching `query` (all live courses when empty), newest first, at most CONTENT_LIST_LIMIT.
   * The search runs on the server, so courses beyond the first page are reachable by typing.
   */
  getCourses(query = ''): Observable<PartialList<NotificationItem>> {
    return this.searchContent(NOTIFICATION_CONTENT_CATEGORIES.COURSE, query)
  }

  /**
   * Programs of an organisation, from its mobile app layout form (`programConfig.programs`).
   * `identifier` is the program's `playlistConfigId` — what the mobile app matches a program notification's
   * `actionData.id` against — `name` is its `title` and `image` its `thumbnail`.
   */
  getPrograms(orgId: string): Observable<NotificationItem[]> {
    const payload = { request: { ...PROGRAM_FORM_REQUEST, rootOrgId: orgId } }
    return this.http.post<unknown>(API_END_POINTS.FORM_READ, payload).pipe(
      map(res => {
        const programs = this.collectPrograms(res)
          .map(program => ({
            identifier: String(program.playlistConfigId || '').trim(),
            name: String(program.title || '').trim(),
            image: String(program.thumbnail || '').trim(),
          }))
          .filter(program => !!program.identifier)
          .map(program => ({ ...program, name: program.name || program.identifier }))
        // The same program can appear on more than one tab of the layout; list it once.
        return Array.from(new Map(programs.map(program => [program.identifier, program])).values())
          .sort((a, b) => a.name.localeCompare(b.name))
      }),
    )
  }

  /**
   * Every entry of every `programs` list in the layout form. The programs sit under a tab's
   * `contents.programConfig` (e.g. `schemas.LAYOUT_DATA.tab1`), and which tab varies, so the whole form is searched.
   */
  private collectPrograms(node: unknown): ProgramConfigItem[] {
    if (Array.isArray(node)) {
      return node.flatMap(child => this.collectPrograms(child))
    }
    if (!node || typeof node !== 'object') {
      return []
    }
    const record = node as Record<string, unknown>
    const own = Array.isArray(record['programs'])
      ? (record['programs'] as unknown[]).filter((p): p is ProgramConfigItem => !!p && typeof p === 'object' && 'playlistConfigId' in p)
      : []
    return [...own, ...Object.values(record).flatMap(child => this.collectPrograms(child))]
  }

  private searchContent(primaryCategory: string[], query: string): Observable<PartialList<NotificationItem>> {
    const payload = {
      request: {
        filters: {
          primaryCategory,
          status: ['Live'],
        },
        ...(query.trim() ? { query: query.trim() } : {}),
        limit: NOTIFICATION_LIMITS.CONTENT_LIST_LIMIT,
        offset: 0,
        sort_by: { createdOn: 'desc' },
        fields: ['identifier', 'name', 'posterImage', 'appIcon'],
      },
    }
    return this.http.post<CourseSearchResponse>(API_END_POINTS.COURSE_SEARCH, payload).pipe(
      map(res => {
        const content = res?.result?.content || []
        const items = content
          .filter(c => !!c.identifier && !!c.name)
          .map(c => ({
            identifier: c.identifier as string,
            name: c.name as string,
            image: c.posterImage || c.appIcon || '',
          }))
        const total = res?.result?.count ?? content.length
        return { items, total, truncated: total > content.length }
      }),
    )
  }

  /** Competencies from the entity API — same source as the Playlist competency picker, sorted by name. */
  getCompetencies(language = 'en'): Observable<NotificationItem[]> {
    return this.searchEntities('Competency', language).pipe(
      map(entities => entities
        .map(e => ({
          identifier: String(e.entityId ?? e.id ?? '').trim(),
          name: String(e.name || '').trim(),
          // Competencies have no image of their own.
          image: NOTIFICATION_DEFAULT_LOGOS.COMPETENCY,
        }))
        .filter(c => !!c.identifier && !!c.name)
        .sort((a, b) => a.name.localeCompare(b.name))),
    )
  }

  /**
   * Positions in an organisation: the distinct designations in its users' profiles.
   * This is the value the mobile app subscribes with (`<rootOrgId>_<designation>`), so it is kept exactly as stored.
   * Pages through the organisation's users, stopping after POSITION_SCAN_MAX_USERS — `truncated` says when it stopped early.
   */
  getPositions(orgId: string): Observable<PartialList<string>> {
    return this.scanOrgUsers(orgId, ['profileDetails']).pipe(
      map(scan => {
        const designations = scan.items
          .map(user => user.profileDetails?.profileReq?.professionalDetails?.[0]?.designation || '')
          .filter(designation => !!designation.trim())
        return { ...scan, items: Array.from(new Set(designations)).sort((a, b) => a.localeCompare(b)) }
      }),
    )
  }

  /**
   * Users of an organisation for the Certificate "Users" picker, sorted by name.
   * User search has no partial-name search, so the list is loaded (up to POSITION_SCAN_MAX_USERS) and filtered in the browser.
   */
  getOrgUsers(orgId: string): Observable<PartialList<NotificationUser>> {
    return this.scanOrgUsers(orgId, ['id', 'userId', 'firstName', 'lastName', 'maskedEmail', 'maskedPhone']).pipe(
      map(scan => ({
        ...scan,
        items: scan.items
          .map(user => ({
            id: String(user.id || user.userId || '').trim(),
            name: [user.firstName, user.lastName].map(part => (part || '').trim()).filter(part => !!part).join(' '),
            contact: user.maskedEmail || user.maskedPhone || '',
          }))
          .filter(user => !!user.id)
          .map(user => ({ ...user, name: user.name || 'Unnamed user' }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      })),
    )
  }

  /**
   * Pages through an organisation's users, USER_PAGE_SIZE per call, stopping after POSITION_SCAN_MAX_USERS.
   * If any page fails the whole scan fails, so the caller shows an error instead of a silently incomplete list.
   */
  private scanOrgUsers(orgId: string, fields: string[]): Observable<PartialList<UserSearchItem>> {
    const pageSize = NOTIFICATION_LIMITS.USER_PAGE_SIZE
    return this.searchUsers(orgId, 0, fields).pipe(
      switchMap(first => {
        const scanned = Math.min(first.count, NOTIFICATION_LIMITS.POSITION_SCAN_MAX_USERS)
        const offsets: number[] = []
        for (let offset = pageSize; offset < scanned; offset += pageSize) {
          offsets.push(offset)
        }
        const pages$ = offsets.length
          ? forkJoin(offsets.map(offset => this.searchUsers(orgId, offset, fields).pipe(map(page => page.users)))).pipe(
            map(rest => [first.users, ...rest].flat()),
          )
          : of(first.users)
        return pages$.pipe(
          map(items => ({ items, total: first.count, truncated: first.count > scanned })),
        )
      }),
    )
  }

  private searchUsers(orgId: string, offset: number, fields: string[]): Observable<{ count: number, users: UserSearchItem[] }> {
    const payload = {
      request: {
        filters: { rootOrgId: orgId },
        fields,
        limit: NOTIFICATION_LIMITS.USER_PAGE_SIZE,
        offset,
      },
    }
    return this.http.post<UserSearchResponse>(API_END_POINTS.USER_SEARCH, payload).pipe(
      map(res => ({
        count: res?.result?.response?.count || 0,
        users: res?.result?.response?.content || [],
      })),
    )
  }

  /**
   * Certificate notification: one send-by-token call to the chosen users' registered devices.
   * `actionData` is `{ id, logo, title }` — the mobile app opens the certificate list and highlights competency `id`.
   */
  sendCertificateNotification(req: SendCertificateNotificationRequest): Observable<unknown> {
    const config = NOTIFICATION_KIND_CONFIG.certificate
    const actionData = { id: req.item.identifier, logo: req.item.image, title: req.item.name }
    const request: IPushNotificationRequest = {
      title: req.title,
      body: req.body,
      userIds: req.userIds,
      ...(req.imageUrl ? { imageUrl: req.imageUrl } : {}),
      data: {
        actionType: config.actionType,
        // actionData is a JSON string — FCM data payload values must be strings.
        actionData: JSON.stringify(actionData),
        status: '1',
        createdOn: new Date().toISOString(),
        // The mobile app reads `data.header`; it carries the same text as the body.
        header: req.body,
      },
    }
    return this.pushNotificationSvc.sendByToken(request)
  }

  /**
   * Sends the push notification to the organisation's topic, or to one `<orgId>_<position>` topic per selected position.
   * send-by-topic takes one topic per call, so each topic is its own call; a failed call doesn't stop the others.
   * Emits one result per topic once every call has finished.
   */
  sendNotification(kind: NotificationKind, req: SendNotificationRequest): Observable<TopicSendResult[]> {
    const config = NOTIFICATION_KIND_CONFIG[kind]
    // actionData is a JSON string — FCM data payload values must be strings.
    const data: { [key: string]: string } = {
      actionType: config.actionType,
      actionData: JSON.stringify(this.buildActionData(kind, req.item)),
      status: '1',
      createdOn: new Date().toISOString(),
      // The mobile app reads `data.header`; it carries the same text as the body.
      header: req.body,
    }
    const targets = req.positions.length
      ? req.positions.map(position => ({ position, topic: this.buildTopic(req.orgId, position) }))
      : [{ position: null, topic: this.buildTopic(req.orgId) }]
    // Positions that clean up to the same topic (e.g. 'Bsc nursing' and 'Bsc_nursing') are sent once.
    const uniqueTargets = Array.from(new Map(targets.map(target => [target.topic, target])).values())
    return from(uniqueTargets).pipe(
      mergeMap(target => {
        const request: ITopicNotificationRequest = {
          topic: target.topic,
          title: req.title,
          body: req.body,
          ...(req.imageUrl ? { imageUrl: req.imageUrl } : {}),
          data,
        }
        return this.pushNotificationSvc.sendByTopic(request).pipe(
          map((): TopicSendResult => ({ ...target, success: true })),
          catchError(() => of<TopicSendResult>({ ...target, success: false })),
        )
      }, NOTIFICATION_LIMITS.SEND_CONCURRENCY),
      toArray(),
    )
  }

  /**
   * `actionData` contract per kind, as the mobile app expects it.
   * Competency: numeric entity id plus `name` and `title`; program: content identifier plus `name` and `title`;
   * course: content identifier.
   */
  private buildActionData(kind: NotificationKind, item: NotificationItem): Record<string, string | number> {
    if (kind === 'program') {
      return {
        id: item.identifier,
        name: item.name,
        title: item.name,
        logo: item.image,
      }
    }
    if (kind === 'competency') {
      const numericId = Number(item.identifier)
      return {
        id: Number.isNaN(numericId) ? item.identifier : numericId,
        name: item.name,
        title: item.name,
        logo: item.image,
      }
    }
    return {
      identifier: item.identifier,
      id: item.identifier,
      logo: item.image,
      title: item.name,
    }
  }

  private searchEntities(entityType: string, language: string): Observable<EntitySearchItem[]> {
    const payload = {
      entityType,
      language,
      query: '',
      strict: 'false',
      field: ['code', 'name'],
    }
    return this.http.post<EntitySearchResponse>(API_END_POINTS.ENTITY_SEARCH, payload).pipe(
      map(res => res?.result?.entity || []),
    )
  }

  /**
   * Topic naming: `<orgId>` for the whole organisation, `<orgId>_<position>` for one position.
   * Characters outside the FCM topic charset [a-zA-Z0-9-_.~%] are replaced with `_`.
   */
  private buildTopic(orgId: string, position?: string): string {
    const sanitize = (value: string) => value.trim().replace(/[^a-zA-Z0-9\-_.~%]/g, '_')
    const orgTopic = sanitize(orgId)
    return position ? `${orgTopic}_${sanitize(position)}` : orgTopic
  }
}
