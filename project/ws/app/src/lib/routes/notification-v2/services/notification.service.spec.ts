import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { NotificationService } from './notification.service'
import { ENotificationEvent, INotification } from '../models/notifications.model'

describe('NotificationService', () => {
  let service: NotificationService
  let router: ReturnType<typeof createSpyObj>

  const notification = (eventId: ENotificationEvent, targetData: any = {}): INotification =>
    ({ eventId, targetData } as any)

  beforeEach(() => {
    router = createSpyObj('Router', ['navigate'])
    service = new NotificationService(router as any)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should navigate to the pending-actions route for ShareGoal', () => {
    service.mapRoute(notification(ENotificationEvent.ShareGoal))
    expect(router.navigate).toHaveBeenCalledWith(['/app/goals/me/pending-actions'])
  })

  it('should navigate to the playlist notification route for SharePlaylist', () => {
    service.mapRoute(notification(ENotificationEvent.SharePlaylist))
    expect(router.navigate).toHaveBeenCalledWith(['/app/playlist/notification'])
  })

  it.each([ENotificationEvent.ShareContent, ENotificationEvent.PublishContent])(
    'should navigate to the toc overview route for %s when identifier is present',
    (event) => {
      service.mapRoute(notification(event, { identifier: 'c1' }))
      expect(router.navigate).toHaveBeenCalledWith(['/app/toc/c1/overview'])
    },
  )

  it('should not navigate for ShareContent when identifier is missing', () => {
    service.mapRoute(notification(ENotificationEvent.ShareContent, {}))
    expect(router.navigate).not.toHaveBeenCalled()
  })

  it.each([
    ENotificationEvent.AddContributor,
    ENotificationEvent.SendContent,
    ENotificationEvent.RejectContent,
    ENotificationEvent.DelegateContent,
    ENotificationEvent.ApproveContent,
  ])('should navigate to the author editor route for %s when identifier is present', (event) => {
    service.mapRoute(notification(event, { identifier: 'c2' }))
    expect(router.navigate).toHaveBeenCalledWith(['/author/editor/c2'])
  })

  it('should not navigate for AddContributor when identifier is missing', () => {
    service.mapRoute(notification(ENotificationEvent.AddContributor, {}))
    expect(router.navigate).not.toHaveBeenCalled()
  })

  it('should not navigate for unknown event types', () => {
    service.mapRoute(notification('unknown_event' as ENotificationEvent))
    expect(router.navigate).not.toHaveBeenCalled()
  })
})
