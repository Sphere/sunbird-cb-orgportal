import { FracUploadRow } from '../models/frac-table.models'
/**
 * Static utility for building API request payloads for FRAC entities.
 * Decouples the UI component state from the backend API contracts.
 */
export class FracPayloadBuilder {

  /**
   * Builds the update payload for a Competency entity.
   * @param row The current table row data.
   * @param original The original baseline state of the row.
   * @param languageCode The resolved language code for the update.
   * @returns Normalized API payload or null if invalid.
   */
  static buildCompetencyUpdate(row: FracUploadRow, original: Partial<FracUploadRow>, languageCode: string): any | null {
    if (!row?.code) {
      return null
    }

    const competencyLevels = this.extractCompetencyLevels(row)

    return {
      entityType: 'Competency',
      code: row.code,
      languageCode,
      name: row.name ?? original?.name ?? '',
      description: row.description ?? original?.description ?? '',
      status: original?.status ?? 'Active',
      area: row.area ?? original?.area ?? '',
      type: row.type ?? original?.type ?? '',
      competencyLevels,
    }
  }

  /**
   * Builds the update payload for generic entities (Activity, Role, Position).
   * @param type The entity type (Activity, Role, Position).
   * @param row The current table row data.
   * @param original The original baseline state of the row.
   * @param languageCode The resolved language code for the update.
   * @returns Normalized API payload or null if invalid.
   */
  static buildGenericUpdate(type: 'Activity' | 'Role' | 'Position', row: FracUploadRow, original: Partial<FracUploadRow>, languageCode: string): any | null {
    if (!row?.code) {
      return null
    }

    return {
      entityType: type,
      id: original?.id || row?.id || '',
      code: original?.code || row?.code || '',
      languageCode,
      name: row?.name ?? original?.name ?? '',
    }
  }

  /**
   * Builds the delete payload for any FRAC entity.
   * @param type The entity type.
   * @param row The current table row data.
   * @param languageCode The resolved language code for the delete.
   * @returns Normalized API payload or null if invalid.
   */
  static buildDelete(type: string, row: FracUploadRow, languageCode: string): any | null {
    const code = (row?.code ?? '').toString().trim()
    if (!code) {
      return null
    }

    return {
      entityCode: code,
      entityType: type,
      language: languageCode,
      purgeAllLanguage: false,
    }
  }

  /**
   * Reads level columns from a row and formats them for the API.
   * Internal helper for competency updates.
   */
  private static extractCompetencyLevels(row: FracUploadRow): any[] {
    const levelMap: Record<number, { levelNumber: number; levelName: string; levelDescription: string }> = {}

    Object.keys(row || {}).forEach((key) => {
      const match = key.match(/^level_L(\d+)_(label|description)$/)
      if (!match) {
        return
      }

      const levelNumber = Number(match[1])
      const fieldType = match[2]
      if (!Number.isFinite(levelNumber) || levelNumber <= 0) {
        return
      }

      if (!levelMap[levelNumber]) {
        levelMap[levelNumber] = {
          levelNumber,
          levelName: '',
          levelDescription: '',
        }
      }

      const value = (row[key] ?? '').toString().trim()
      if (fieldType === 'label') {
        levelMap[levelNumber].levelName = value
      } else {
        levelMap[levelNumber].levelDescription = value
      }
    })

    return Object.values(levelMap)
      .filter(level => level.levelName || level.levelDescription)
      .sort((a, b) => a.levelNumber - b.levelNumber)
  }
}
