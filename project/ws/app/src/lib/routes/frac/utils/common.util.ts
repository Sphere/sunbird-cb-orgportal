/**
 * 🔹 Transforms multiple edited flat competency rows into
 * nested structure expected by the FRAC API.
 *
 * ✅ Merges updated rows with original data instead of replacing them.
 * ✅ Preserves unedited competencies and children.
 * ✅ Supports any number of levels (L1, L2, L3...).
 *
 * @param originalData - Original nested competency list (with children)
 * @param editedRows - Flattened user-edited rows from the table
 * @returns Updated competency list ready for API update
 */
export function transformCompetencyForUpdate(originalData: any[], editedRows: any[]): any[] {
  if (!Array.isArray(originalData) || !Array.isArray(editedRows)) return originalData

  return originalData.map((competency) => {
    const edited = editedRows.find((row) => row.code === competency.code)
    if (!edited) return competency // 🔹 No changes → return as-is

    // ✅ Merge top-level properties (keep old if not edited)
    const updatedCompetency = {
      ...competency,
      code: edited.code ?? competency.code,
      name: edited.name ?? competency.name,
      description: edited.description ?? competency.description,
      type: edited.type ?? competency.type,
      status: edited.status ?? competency.status,
      children: [...(competency.children || [])],
    }

    // ✅ Extract all level_* fields dynamically
    const levelKeys = Object.keys(edited).filter((k) => k.startsWith('level_'))
    const levelUpdates: Record<string, any> = {}

    for (const key of levelKeys) {
      const [, level, field] = key.split('_') // e.g., "level_L1_label" → ['level', 'L1', 'label']
      if (!levelUpdates[level]) levelUpdates[level] = { level, type: 'level' }

      if (field === 'label') {
        levelUpdates[level].name = edited[key]
      } else if (field === 'description') {
        levelUpdates[level].description = edited[key]
      }
    }

    // ✅ Merge updates into children (preserve existing)
    const mergedChildren = updatedCompetency.children.map((child: any) => {
      const update = levelUpdates[child.level]
      if (!update) return child // no changes for this level
      return {
        ...child,
        name: update.name ?? child.name,
        description: update.description ?? child.description,
      }
    })

    // ✅ Add new levels not in original children
    Object.keys(levelUpdates).forEach((level) => {
      const exists = mergedChildren.some((c: any) => c.level === level)
      if (!exists) mergedChildren.push(levelUpdates[level])
    })

    // ✅ Keep children sorted (L1 → L2 → L3)
    updatedCompetency.children = mergedChildren.sort(
      (a: any, b: any) =>
        parseInt(a.level.replace('L', ''), 10) - parseInt(b.level.replace('L', ''), 10)
    )

    return updatedCompetency
  })
}
