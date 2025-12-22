import { Injectable } from '@angular/core'

/** Represents a column in the dynamic table configuration. */
export interface ITableColumn {
  key: string
  label: string
}

/** Represents the table structure containing columns and data. */
export interface ITableConfig {
  columns: ITableColumn[]
  data: Record<string, any>[]
}

/** Type signature for handler functions that generate table configs for specific entity types. */
export type TableHandler = (entities: any[]) => ITableConfig

@Injectable({
  providedIn: 'root',
})
export class TableTransformUtil {
  /** Registry for all supported entity-type handlers. */
  private readonly tableHandlers: Record<string, TableHandler> = {};

  constructor() {
    // Register built-in handlers
    this.registerHandler('competency', this.createCompetencyTableConfig.bind(this))
    this.registerHandler('entity', this.createEntityTableConfig.bind(this))
    this.registerHandler('activity', this.createActivityTableConfig.bind(this))
    this.registerHandler('role', this.createRoleTableConfig.bind(this))
  }

  /**
   * Public entry point: transforms API response into table configuration.
   * Automatically detects and delegates to a registered handler.
   */
  public transformResponseToTableConfig(response: any): ITableConfig {
    const entities = this.extractEntityList(response)
    if (!entities.length) {
      return this.createEmptyTableConfig()
    }

    const entityType = entities[0]?.type?.toLowerCase()
    const handler = this.tableHandlers[entityType]

    return handler ? handler(entities) : this.createGenericTableConfig(entities)
  }

  /**
   * Registers a new table handler for a given entity type.
   * Keeps architecture open for future extensions (role, domain, etc.)
   */
  public registerHandler(type: string, handler: TableHandler): void {
    this.tableHandlers[type.toLowerCase()] = handler
  }

  // ===================================================================
  // HANDLERS
  // ===================================================================

  /**
   * Handles 'competency' type entities with dynamic level columns.
   */
  private createCompetencyTableConfig(entities: any[]): ITableConfig {
    const baseColumns: ITableColumn[] = [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Label' },
      { key: 'description', label: 'Description' },
      { key: 'type', label: 'Type' },
      { key: 'status', label: 'Status' },
    ]

    // Determine max level count dynamically
    let maxLevelCount = 0
    entities.forEach((entity) => {
      const childCount = entity.children?.length || 0
      if (childCount > maxLevelCount) maxLevelCount = childCount
    })

    // Generate level columns
    const levelColumns: ITableColumn[] = []
    Array.from({ length: maxLevelCount }).forEach((_, index) => {
      const level = index + 1
      levelColumns.push(
        { key: `level_L${level}_label`, label: `Level ${level} Label` },
        { key: `level_L${level}_description`, label: `Level ${level} Description` }
      )
    })

    const columns = [...baseColumns, ...levelColumns]

    const data: Record<string, any>[] = []
    entities.forEach((entity) => {
      const row: Record<string, any> = {
        code: entity.code ?? '',
        type: entity.type ?? '',
        name: entity.name ?? '',
        description: entity.description ?? '',
        status: entity.status ?? '',
      };

      (entity.children || []).forEach((child: any) => {
        const levelKey = child.level || `L${child.levelId}`
        row[`level_${levelKey}_label`] = child.name ?? ''
        row[`level_${levelKey}_description`] = child.description ?? ''
      })

      data.push(row)
    })

    return { columns, data }
  }

  /**
   * Handles 'entity' type — shows only Code and Label.
   */
  private createEntityTableConfig(entities: any[]): ITableConfig {
    const columns: ITableColumn[] = [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Label' },
    ]

    const data = entities.map((entity) => ({
      code: entity.code ?? '',
      name: entity.name ?? '',
    }))

    return { columns, data }
  }

  /**
   * Handles 'activity' type entities — shows Code and Label only.
   */
  private createActivityTableConfig(entities: any[]): ITableConfig {
    const columns: ITableColumn[] = [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
    ]

    const data = entities.map((entity) => ({
      code: entity.code ?? entity.additionalProperties?.Code ?? '',
      name: entity.name ?? '',
    }))

    return { columns, data }
  }

  /**
   * Handles 'role' type entities — shows Code and Name only.
   */
  private createRoleTableConfig(entities: any[]): ITableConfig {
    const columns: ITableColumn[] = [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
    ]

    const data = entities.map((entity) => ({
      code: entity.code ?? entity.additionalProperties?.Code ?? '',
      name: entity.name ?? '',
    }))

    return { columns, data }
  }

  /**
   * Default fallback handler for unknown response types.
   */
  private createGenericTableConfig(dataArray: any[]): ITableConfig {
    if (!dataArray.length) return this.createEmptyTableConfig()

    const firstRow = dataArray[0]
    const columns: ITableColumn[] = Object.keys(firstRow).map((key) => ({
      key,
      label: this.formatKeyLabel(key),
    }))

    return { columns, data: dataArray }
  }

  // ===================================================================
  // UTILITIES
  // ===================================================================

  /** Extracts entity list from multiple API response structures. */
  private extractEntityList(response: any): any[] {
    if (!response) return []
    const entityList =
      response?.result?.data?.entity ||
      response?.data?.entity ||
      response?.entity
    return Array.isArray(entityList) ? entityList : []
  }

  /** Converts object keys into user-friendly labels. */
  private formatKeyLabel(key: string): string {
    return key
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, (char) => char.toUpperCase())
  }

  /** Returns an empty table configuration object. */
  private createEmptyTableConfig(): ITableConfig {
    return { columns: [], data: [] }
  }
}
