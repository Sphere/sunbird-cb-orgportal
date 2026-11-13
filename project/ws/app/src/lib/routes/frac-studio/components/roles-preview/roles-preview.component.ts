import { Component, ElementRef, Input, OnChanges } from '@angular/core'
import { FRAC_STUDIO_LEVEL_NAMES } from '../../constants/frac-studio.constants'
import { FracCompetency, FracPosting, FracRole } from '../../models/frac-studio.models'
import { normalizeCode, parseRefs } from '../../utils/frac-studio-refs.util'

/** A competency at one level that a role's activities need, with that level of its ladder; listed once per role. */
interface PreviewNeed {
  key: string
  code: string
  label: string
  levelName: string
  levelLabel: string
  indicators: string[]
  found: boolean
  usedBy: string[]
}

/** One posting's Yes/No for an activity, shown as "P1 ✓"; the legend above the roles names the posting. */
interface PreviewMark {
  key: string
  symbol: string
  yes: boolean
  aria: string
}

/** A competency@level an activity maps to, shown as a chip in its row. */
interface PreviewRef {
  code: string
  level: string
  label: string
  found: boolean
}

interface PreviewActivity {
  code: string
  text: string
  marks: PreviewMark[]
  refs: PreviewRef[]
}

interface PreviewRole {
  code: string
  title: string
  activities: PreviewActivity[]
  needs: PreviewNeed[]
}

/**
 * Read-only preview of the roles (review decisions, Nov 2026), opened as a popup from "Preview roles" on the Level
 * ladders tab. Each role is a compact table (activity, posting marks, competency@level), followed by the competencies
 * it uses, each level's text written once. The postings are named once in a legend; role chips jump to a role.
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
  legend: { key: string, label: string }[] = []
  /** Roles whose "Competencies in this role" section is open; all closed at first, so the activity tables lead. */
  openNeeds = new Set<string>()

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  ngOnChanges(): void {
    const byCode = new Map(this.competencies.map(c => [normalizeCode(c.code), c]))
    this.legend = this.postings.map(p => ({ key: p.key, label: p.label || p.key }))
    this.preview = this.roles.map(role => {
      const needs = new Map<string, PreviewNeed>()
      const activities = role.activities.map(a => {
        const refs = parseRefs(a.comp, this.prefix).map(ref => {
          const comp = byCode.get(normalizeCode(ref.code))
          const code = comp?.code ?? ref.code
          const key = `${normalizeCode(code)}@${ref.level ?? 0}`
          const need = needs.get(key) ?? this.need(key, code, comp, ref.level)
          need.usedBy.push(a.code)
          needs.set(key, need)
          return { code, level: ref.level ? `L${ref.level}` : 'no level', label: need.label, found: !!comp }
        })
        return { code: a.code, text: a.text, marks: this.marks(a.postings), refs }
      })
      return { code: role.code, title: role.title, activities, needs: [...needs.values()] }
    })
  }

  /** Expand all / Collapse all for every role's competency section. */
  setAllNeeds(open: boolean): void {
    this.openNeeds = open ? new Set(this.preview.map(r => r.code)) : new Set()
  }

  /** Keeps openNeeds in step when a section is opened or closed by its own summary. */
  onNeedsToggle(code: string, event: Event): void {
    if ((event.target as HTMLDetailsElement).open) {
      this.openNeeds.add(code)
    } else {
      this.openNeeds.delete(code)
    }
  }

  /** Scrolls the popup to a role. */
  jump(code: string): void {
    this.host.nativeElement.querySelector(`#preview-role-${CSS.escape(code)}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }

  trackByCode(_: number, item: { code: string }): string {
    return item.code
  }

  trackByKey(_: number, item: { key: string }): string {
    return item.key
  }

  private need(key: string, code: string, comp: FracCompetency | undefined, level: number | undefined): PreviewNeed {
    const ladder = level && comp?.levels ? comp.levels[level - 1] : undefined
    return {
      key,
      code,
      label: comp?.label ?? 'Not in the competency list',
      levelName: level ? FRAC_STUDIO_LEVEL_NAMES[level - 1] : 'No level',
      levelLabel: ladder?.label ?? '',
      indicators: (ladder?.desc ?? '').split('\n').map(line => line.replace(/^\s*-\s*/, '').trim()).filter(Boolean),
      found: !!comp,
      usedBy: [],
    }
  }

  private marks(values: Record<string, string>): PreviewMark[] {
    return this.legend.map(p => {
      const value = (values[p.key] || '').trim()
      const yes = /^y/i.test(value)
      return { key: p.key, yes, symbol: yes ? '✓' : value ? '–' : '·', aria: `${p.label}: ${value || 'not set'}` }
    })
  }
}
