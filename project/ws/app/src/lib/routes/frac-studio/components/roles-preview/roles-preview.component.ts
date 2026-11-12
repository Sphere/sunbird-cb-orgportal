import { Component, Input, OnChanges } from '@angular/core'
import { FRAC_STUDIO_LEVEL_NAMES } from '../../constants/frac-studio.constants'
import { FracCompetency, FracPosting, FracRole } from '../../models/frac-studio.models'
import { normalizeCode, parseRefs } from '../../utils/frac-studio-refs.util'

/** One competency an activity needs, at the level it needs it, with that level of the ladder. */
interface PreviewNeed {
  code: string
  label: string
  levelName: string
  levelLabel: string
  indicators: string[]
  found: boolean
}

interface PreviewActivity {
  code: string
  text: string
  postings: { label: string, value: string }[]
  needs: PreviewNeed[]
}

interface PreviewRole {
  code: string
  title: string
  activities: PreviewActivity[]
}

/**
 * Read-only preview of the roles (review decisions, Nov 2026), opened as a popup from "Preview roles" on the
 * Level ladders tab once every activity is mapped: each role's activities with the competency and level they map
 * to, and what that level asks for (or that its ladder is not written yet). Nothing here is editable.
 */
@Component({
  selector: 'ws-app-frac-roles-preview',
  templateUrl: './roles-preview.component.html',
  styleUrls: ['./roles-preview.component.scss'],
  standalone: false,
})
export class RolesPreviewComponent implements OnChanges {
  @Input() roles: FracRole[] = []
  @Input() competencies: FracCompetency[] = []
  @Input() postings: FracPosting[] = []
  @Input() prefix = ''

  preview: PreviewRole[] = []

  ngOnChanges(): void {
    const byCode = new Map(this.competencies.map(c => [normalizeCode(c.code), c]))
    this.preview = this.roles.map(role => ({
      code: role.code,
      title: role.title,
      activities: role.activities.map(a => ({
        code: a.code,
        text: a.text,
        postings: this.postings.map(p => ({ label: p.label || p.key, value: a.postings[p.key] || '—' })),
        needs: parseRefs(a.comp, this.prefix).map(ref => {
          const comp = byCode.get(normalizeCode(ref.code))
          const level = ref.level && comp?.levels ? comp.levels[ref.level - 1] : undefined
          return {
            code: comp?.code ?? ref.code,
            label: comp?.label ?? 'Not in the competency list',
            levelName: ref.level ? FRAC_STUDIO_LEVEL_NAMES[ref.level - 1] : 'No level',
            levelLabel: level?.label ?? '',
            indicators: (level?.desc ?? '').split('\n').map(line => line.replace(/^\s*-\s*/, '').trim()).filter(Boolean),
            found: !!comp,
          }
        }),
      })),
    }))
  }

  trackByCode(_: number, item: { code: string }): string {
    return item.code
  }
}
