import { MatDialogRef } from '@angular/material/dialog'
import {
  PlaylistViewCompetencyRow,
  PlaylistViewDialogComponent,
  PlaylistViewDialogData,
} from './playlist-view-dialog.component'

describe('PlaylistViewDialogComponent', () => {
  let dialogRefMock: Partial<MatDialogRef<PlaylistViewDialogComponent>>

  const baseData: PlaylistViewDialogData = {
    mode: 'course',
    title: 'Title',
    orgId: 'org1',
    orgName: 'Org',
    roles: ['ROLE'],
    language: 'en',
    playlistId: 'pl-1',
    courseRows: [
      { index: 0, identifier: 'c1', name: 'Course 1', sourceName: 'src' },
    ],
    competencyRows: [],
  }

  const competencyRow: PlaylistViewCompetencyRow = {
    index: 0,
    code: 'C1',
    name: 'Competency 1',
    levels: [
      { level: 1, name: 'L1', description: 'd', courseId: 'c1', courseName: '' },
      { level: 2, name: 'L2', description: 'd', courseId: 'c2', courseName: '' },
    ],
  }

  beforeEach(() => {
    dialogRefMock = { close: jest.fn() }
  })

  it('should create for course mode without pre-expanding any competency', () => {
    const component = new PlaylistViewDialogComponent(
      dialogRefMock as MatDialogRef<PlaylistViewDialogComponent>,
      baseData,
    )
    expect(component).toBeTruthy()
    expect(component.expandedCompetencies.size).toBe(0)
  })

  it('should pre-expand the first competency row when mode is competency and rows exist', () => {
    const data: PlaylistViewDialogData = {
      ...baseData,
      mode: 'competency',
      competencyRows: [competencyRow],
    }
    const component = new PlaylistViewDialogComponent(
      dialogRefMock as MatDialogRef<PlaylistViewDialogComponent>,
      data,
    )
    expect(component.expandedCompetencies.size).toBe(1)
    expect(component.isCompetencyExpanded(competencyRow)).toBe(true)
  })

  it('should not pre-expand when mode is competency but there are no rows', () => {
    const data: PlaylistViewDialogData = {
      ...baseData,
      mode: 'competency',
      competencyRows: [],
    }
    const component = new PlaylistViewDialogComponent(
      dialogRefMock as MatDialogRef<PlaylistViewDialogComponent>,
      data,
    )
    expect(component.expandedCompetencies.size).toBe(0)
  })

  it('totalCourses, totalCompetencies, totalMappedLevels should compute from data', () => {
    const data: PlaylistViewDialogData = {
      ...baseData,
      mode: 'competency',
      competencyRows: [competencyRow],
    }
    const component = new PlaylistViewDialogComponent(
      dialogRefMock as MatDialogRef<PlaylistViewDialogComponent>,
      data,
    )
    expect(component.totalCourses).toBe(1)
    expect(component.totalCompetencies).toBe(1)
    expect(component.totalMappedLevels).toBe(2)
  })

  it('toggleCompetency should collapse an already-expanded competency', () => {
    const data: PlaylistViewDialogData = {
      ...baseData,
      mode: 'competency',
      competencyRows: [competencyRow],
    }
    const component = new PlaylistViewDialogComponent(
      dialogRefMock as MatDialogRef<PlaylistViewDialogComponent>,
      data,
    )
    expect(component.isCompetencyExpanded(competencyRow)).toBe(true)
    component.toggleCompetency(competencyRow)
    expect(component.isCompetencyExpanded(competencyRow)).toBe(false)
  })

  it('toggleCompetency should expand a collapsed competency', () => {
    const component = new PlaylistViewDialogComponent(
      dialogRefMock as MatDialogRef<PlaylistViewDialogComponent>,
      baseData,
    )
    expect(component.isCompetencyExpanded(competencyRow)).toBe(false)
    component.toggleCompetency(competencyRow)
    expect(component.isCompetencyExpanded(competencyRow)).toBe(true)
  })

  it('onClose should close the dialog ref', () => {
    const component = new PlaylistViewDialogComponent(
      dialogRefMock as MatDialogRef<PlaylistViewDialogComponent>,
      baseData,
    )
    component.onClose()
    expect(dialogRefMock.close).toHaveBeenCalled()
  })
})
