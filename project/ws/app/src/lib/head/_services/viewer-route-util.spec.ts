import { VIEWER_ROUTE_FROM_MIME, viewerRouteGenerator } from './viewer-route-util'
import { NsContent } from './widget-content.model'

describe('VIEWER_ROUTE_FROM_MIME', () => {
  it.each([
    [NsContent.EMimeTypes.MP3, 'audio'],
    [NsContent.EMimeTypes.M4A, 'audio-native'],
    [NsContent.EMimeTypes.COLLECTION, 'html'],
    [NsContent.EMimeTypes.CHANNEL, 'channel'],
    [NsContent.EMimeTypes.CERTIFICATION, 'certification'],
    [NsContent.EMimeTypes.HTML, 'html'],
    [NsContent.EMimeTypes.HTML_TEXT, 'html'],
    [NsContent.EMimeTypes.IAP, 'iap'],
    [NsContent.EMimeTypes.ILP_FP, 'ilp-fp'],
    [NsContent.EMimeTypes.PDF, 'pdf'],
    [NsContent.EMimeTypes.MP4, 'video'],
    [NsContent.EMimeTypes.M3U8, 'video'],
    [NsContent.EMimeTypes.YOUTUBE, 'youtube'],
    [NsContent.EMimeTypes.WEB_MODULE, 'web-module'],
    [NsContent.EMimeTypes.WEB_MODULE_EXERCISE, 'web-module'],
    [NsContent.EMimeTypes.CLASS_DIAGRAM, 'class-diagram'],
    [NsContent.EMimeTypes.HANDS_ON, 'hands-on'],
    [NsContent.EMimeTypes.RDBMS_HANDS_ON, 'rdbms-hands-on'],
    [NsContent.EMimeTypes.HTML_PICKER, 'html-picker'],
    [NsContent.EMimeTypes.QUIZ, 'quiz'],
    [NsContent.EMimeTypes.COLLECTION_RESOURCE, 'resource-collection'],
  ])('should map %s to %s', (mimeType, expected) => {
    expect(VIEWER_ROUTE_FROM_MIME(mimeType)).toBe(expected)
  })

  it('should default to html for an unrecognized mime type', () => {
    expect(VIEWER_ROUTE_FROM_MIME('application/unknown-mime' as any)).toBe('html')
  })
})

describe('viewerRouteGenerator', () => {
  it('should build a plain viewer url with no query params by default', () => {
    const result = viewerRouteGenerator('content-1', NsContent.EMimeTypes.PDF)
    expect(result.url).toBe('/viewer/pdf/content-1')
    expect(result.queryParams).toEqual({})
  })

  it('should prefix the url with /author when forPreview is true', () => {
    const result = viewerRouteGenerator('content-1', NsContent.EMimeTypes.PDF, undefined, undefined, true)
    expect(result.url).toBe('/author/viewer/pdf/content-1')
  })

  it('should include primaryCategory in queryParams when provided', () => {
    const result = viewerRouteGenerator(
      'content-1', NsContent.EMimeTypes.PDF, undefined, undefined, false, 'Course',
    )
    expect(result.queryParams).toEqual({ primaryCategory: 'Course' })
  })

  it('should include collectionId/collectionType when the collection type is player-supported', () => {
    const result = viewerRouteGenerator(
      'content-1', NsContent.EMimeTypes.PDF, 'collection-1', NsContent.EContentTypes.COURSE,
    )
    expect(result.queryParams).toEqual({ collectionId: 'collection-1', collectionType: NsContent.EContentTypes.COURSE })
  })

  it('should drop collectionId/collectionType when the collection type is not player-supported', () => {
    const result = viewerRouteGenerator(
      'content-1', NsContent.EMimeTypes.PDF, 'collection-1', 'SomeUnsupportedType',
    )
    expect(result.queryParams).toEqual({})
  })

  it('should include batchId in queryParams when provided', () => {
    const result = viewerRouteGenerator(
      'content-1', NsContent.EMimeTypes.PDF, undefined, undefined, false, undefined, 'batch-1',
    )
    expect(result.queryParams).toEqual({ batchId: 'batch-1' })
  })

  it('should combine primaryCategory, collection info, and batchId together', () => {
    const result = viewerRouteGenerator(
      'content-1',
      NsContent.EMimeTypes.MP4,
      'collection-1',
      NsContent.EContentTypes.MODULE,
      true,
      'Resource',
      'batch-9',
    )
    expect(result.url).toBe('/author/viewer/video/content-1')
    expect(result.queryParams).toEqual({
      primaryCategory: 'Resource',
      collectionId: 'collection-1',
      collectionType: NsContent.EContentTypes.MODULE,
      batchId: 'batch-9',
    })
  })
})
