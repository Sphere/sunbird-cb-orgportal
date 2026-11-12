/** A row as a sorted table shows it: the item, and its index in the saved list that edits must use. */
export interface SortedRow<T> {
  item: T
  index: number
}

/** What a sortable header needs from its table's sort. */
export interface ColumnSort {
  toggle(key: string): void
  ariaSort(key: string): 'ascending' | 'descending' | 'none'
}

export type SortValue = string | number | null | undefined

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

/**
 * Column sort for one kind of table, display only: the saved order and codes never change, and each row keeps
 * its real index so edits reach the right item. The order is worked out when a header is clicked and then kept
 * while the team types, so a row does not jump away from the cell being edited; adding or removing a row, or
 * clicking again, sorts afresh. Several tables can share one sort (the activities of every role), keyed by table.
 */
export class TableSort<T> implements ColumnSort {
  key: string | null = null
  direction: 'asc' | 'desc' = 'asc'

  private readonly tables = new Map<string, { items: T[], order: number[], rows: SortedRow<T>[] }>()

  constructor(private readonly valueOf: (item: T, key: string) => SortValue) { }

  /** Ascending, then descending, then back to the saved order. */
  toggle(key: string): void {
    if (this.key !== key) {
      this.key = key
      this.direction = 'asc'
    } else if (this.direction === 'asc') {
      this.direction = 'desc'
    } else {
      this.key = null
    }
    this.refresh()
  }

  /** Forgets the kept orders, for changes that move rows between tables (a role moved or deleted). */
  refresh(): void {
    this.tables.clear()
  }

  ariaSort(key: string): 'ascending' | 'descending' | 'none' {
    if (this.key !== key) {
      return 'none'
    }
    return this.direction === 'asc' ? 'ascending' : 'descending'
  }

  rows(items: T[], table = ''): SortedRow<T>[] {
    const kept = this.tables.get(table)
    if (kept?.items === items) {
      return kept.rows
    }
    const order = kept?.order.length === items.length ? kept.order : this.sortedOrder(items)
    const rows = order.map(index => ({ item: items[index], index }))
    this.tables.set(table, { items, order, rows })
    return rows
  }

  /** Blank values go last in both directions, so empty rows never crowd the top. */
  private sortedOrder(items: T[]): number[] {
    const indexes = items.map((_, i) => i)
    const key = this.key
    if (!key) {
      return indexes
    }
    const sign = this.direction === 'asc' ? 1 : -1
    const values = items.map(item => this.valueOf(item, key))
    const blank = (v: SortValue) => v === null || v === undefined || (typeof v === 'string' && !v.trim())
    return indexes.sort((a, b) => {
      const va = values[a]
      const vb = values[b]
      if (blank(va) || blank(vb)) {
        return Number(blank(va)) - Number(blank(vb)) || a - b
      }
      const diff = typeof va === 'number' && typeof vb === 'number' ? va - vb : collator.compare(String(va), String(vb))
      return sign * diff || a - b
    })
  }
}
