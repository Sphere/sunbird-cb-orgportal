import { Injectable } from '@angular/core'
import { FracApiEntity, FracSearchResponse } from '../models/frac-api.models'

/** Represents a column in the dynamic table configuration. */
export interface ITableColumn {
  key: string
  label: string
}

/** Represents the table structure containing columns and data. */
export interface ITableConfig {
  columns: ITableColumn[]
  data: Record<string, unknown>[]
}

/** Type signature for handler functions that generate table configs for specific entity types. */
export type TableHandler = (entities: FracApiEntity[]) => ITableConfig

@Injectable({
  providedIn: 'root',
})
export class TableTransformUtil {
  /** Registry for all supported entity-type handlers. */
  private readonly tableHandlers: Record<string, TableHandler> = {}

  constructor() {
    this.registerHandler('competency', this.createCompetencyTableConfig.bind(this))
    this.registerHandler('entity', this.createEntityTableConfig.bind(this))
    this.registerHandler('activity', this.createActivityTableConfig.bind(this))
    this.registerHandler('role', this.createRoleTableConfig.bind(this))
    this.registerHandler('position', this.createPositionTableConfig.bind(this))
  }

  /**
   * Transforms API response into table configuration.
   */
  public transformResponseToTableConfig(response: FracSearchResponse | FracApiEntity[] | null | undefined): ITableConfig {
    const entities = this.extractEntityList(response)
    if (!entities.length) {
      return this.createEmptyTableConfig()
    }

    const entityType = this.detectEntityType(entities)
    const handler = this.tableHandlers[entityType]

    return handler ? handler(entities) : this.createGenericTableConfig(entities)
  }

  /**
   * Registers a table transformer handler for an entity type.
   */
  public registerHandler(type: string, handler: TableHandler): void {
    this.tableHandlers[type.toLowerCase()] = handler
  }

  private createCompetencyTableConfig(entities: FracApiEntity[]): ITableConfig {
    const baseColumns: ITableColumn[] = [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'type', label: 'Type' },
      { key: 'area', label: 'Area' },
    ]

    let maxLevelCount = 0
    entities.forEach((entity) => {
      const childCount = Array.isArray(entity.children) ? entity.children.length : 0
      const levelsCount = Array.isArray(entity.levels) ? entity.levels.length : 0

      if (childCount > maxLevelCount) {
        maxLevelCount = childCount
      }
      if (levelsCount > maxLevelCount) {
        maxLevelCount = levelsCount
      }

      if (!childCount && !levelsCount) {
        const levelFromFlatResponse = this.extractCompetencyLevelCount(entity)
        if (levelFromFlatResponse > maxLevelCount) {
          maxLevelCount = levelFromFlatResponse
        }
      }
    })

    const levelColumns: ITableColumn[] = []
    Array.from({ length: maxLevelCount }).forEach((_, index) => {
      const level = index + 1
      levelColumns.push(
        { key: `level_L${level}_label`, label: `Level ${level} Label` },
        { key: `level_L${level}_description`, label: `Level ${level} Description` },
      )
    })

    const data: Record<string, unknown>[] = entities.map((entity) => {
      const row: Record<string, unknown> = {
        code: entity.code ?? '',
        type: entity.type ?? '',
        name: entity.name ?? '',
        description: entity.description ?? '',
        area: entity.area ?? '',
      }

      if (Array.isArray(entity.children) && entity.children.length) {
        entity.children.forEach((child) => {
          const levelKey = (child.level || `L${child.levelId || ''}`).toString()
          row[`level_${levelKey}_label`] = child.name ?? ''
          row[`level_${levelKey}_description`] = child.description ?? ''
        })
      } else if (Array.isArray(entity.levels) && entity.levels.length) {
        entity.levels.forEach((level) => {
          const levelNumber = Number(level?.levelNumber ?? level?.level ?? level?.levelId)
          if (!Number.isFinite(levelNumber) || levelNumber <= 0) {
            return
          }

          row[`level_L${levelNumber}_label`] = level?.levelName ?? level?.name ?? ''
          row[`level_L${levelNumber}_description`] = level?.levelDescription ?? level?.description ?? ''
        })
      } else {
        for (let level = 1; level <= maxLevelCount; level += 1) {
          row[`level_L${level}_label`] = (entity as Record<string, unknown>)[`competencyLevel${level}Name`] ?? ''
          row[`level_L${level}_description`] = (entity as Record<string, unknown>)[`competencyLevel${level}Description`] ?? ''
        }
      }

      return row
    })

    return {
      columns: [...baseColumns, ...levelColumns],
      data,
    }
  }

  private createEntityTableConfig(entities: FracApiEntity[]): ITableConfig {
    return {
      columns: [
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
      ],
      data: entities.map((entity) => ({
        code: entity.code ?? '',
        name: entity.name ?? '',
      })),
    }
  }

  private createActivityTableConfig(entities: FracApiEntity[]): ITableConfig {
    return {
      columns: [
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
      ],
      data: entities.map((entity) => ({
        code: entity.code ?? entity.additionalProperties?.Code ?? '',
        name: entity.name ?? '',
      })),
    }
  }

  private createRoleTableConfig(entities: FracApiEntity[]): ITableConfig {
    return {
      columns: [
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
      ],
      data: entities.map((entity) => ({
        code: entity.code ?? entity.additionalProperties?.Code ?? '',
        name: entity.name ?? '',
      })),
    }
  }

  private createPositionTableConfig(entities: FracApiEntity[]): ITableConfig {
    return {
      columns: [
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
      ],
      data: entities.map((entity) => ({
        code: entity.code ?? entity.additionalProperties?.Code ?? '',
        name: entity.name ?? '',
      })),
    }
  }

  private createGenericTableConfig(dataArray: Record<string, unknown>[]): ITableConfig {
    if (!dataArray.length) {
      return this.createEmptyTableConfig()
    }

    const firstRow = dataArray[0]
    const columns: ITableColumn[] = Object.keys(firstRow).map((key) => ({
      key,
      label: this.formatKeyLabel(key),
    }))

    return { columns, data: dataArray }
  }

  private extractEntityList(response: FracSearchResponse | FracApiEntity[] | null | undefined): FracApiEntity[] {
    if (!response) {
      return []
    }

    if (Array.isArray(response)) {
      return response
    }

    const entityList =
      response?.result?.entity ||
      response?.result?.data?.entity ||
      response?.data?.entity ||
      response?.entity

    return Array.isArray(entityList) ? entityList : []
  }

  private detectEntityType(entities: FracApiEntity[]): string {
    return (
      entities[0]?.entityType?.toLowerCase() ||
      entities[0]?.type?.toLowerCase() ||
      ''
    )
  }

  private extractCompetencyLevelCount(entity: FracApiEntity): number {
    const keys = Object.keys(entity || {})
    const levelKeys = keys
      .map((key) => key.match(/^competencyLevel(\d+)(Name|Description)$/)?.[1])
      .filter((value): value is string => Boolean(value))

    if (!levelKeys.length) {
      return 0
    }

    return Math.max(...levelKeys.map(level => Number(level)))
  }

  private formatKeyLabel(key: string): string {
    return key
      .replaceAll('_', ' ')
      .replaceAll(/([a-z])([A-Z])/g, '$1 $2')
      .replaceAll(/\b\w/g, char => char.toUpperCase())
  }

  private createEmptyTableConfig(): ITableConfig {
    return { columns: [], data: [] }
  }
}
