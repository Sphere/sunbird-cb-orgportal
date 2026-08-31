import {
    deepMergePreserve,
    mergeCourses,
    mergeLevelDescriptions,
    mergeCompetency,
    updatePayloadNonDestructive,
    changeCompetencyPosition,
} from './competency-merge.utils'
import { PlaylistCompetency, PlaylistCompetencyLevel, CourseLanguageMapping, CompetencyPayloadEntry } from './competency-transformer.types'

describe('competency-merge.utils', () => {
    // -----------------------------------------------------------------------
    describe('deepMergePreserve', () => {
        it('returns updates when existing is falsy', () => {
            expect(deepMergePreserve(null as any, { a: 1 })).toEqual({ a: 1 })
        })

        it('returns existing when updates is falsy', () => {
            expect(deepMergePreserve({ a: 1 }, null as any)).toEqual({ a: 1 })
        })

        it('merges flat keys, updates overrides existing', () => {
            const result = deepMergePreserve({ a: 1, b: 2 }, { b: 3, c: 4 })
            expect(result).toEqual({ a: 1, b: 3, c: 4 })
        })

        it('deep merges nested objects preserving untouched nested keys', () => {
            const existing = { nested: { x: 1, y: 2 }, top: 'keep' }
            const updates = { nested: { y: 99 } }
            const result = deepMergePreserve(existing, updates)
            expect(result).toEqual({ nested: { x: 1, y: 99 }, top: 'keep' })
        })

        it('does not deep-merge arrays, replaces them wholesale', () => {
            const existing = { list: [1, 2, 3] }
            const updates = { list: [9] }
            const result = deepMergePreserve(existing, updates)
            expect(result).toEqual({ list: [9] })
        })

        it('handles nested key missing from existing by creating it', () => {
            const existing = { top: 'keep' } as Record<string, unknown>
            const updates = { nested: { z: 1 } }
            const result = deepMergePreserve(existing, updates)
            expect(result).toEqual({ top: 'keep', nested: { z: 1 } })
        })

        it('sets null values directly without treating as object', () => {
            const result = deepMergePreserve({ a: 1 }, { a: null })
            expect(result).toEqual({ a: null })
        })
    })

    // -----------------------------------------------------------------------
    describe('mergeCourses', () => {
        it('adds new language course when not present', () => {
            const existing: CourseLanguageMapping[] = [{ lang: 'en', id: 'c1' }]
            const updated = mergeCourses(existing, [{ lang: 'hi', id: 'c2' }])
            expect(updated).toEqual([
                { lang: 'en', id: 'c1' },
                { lang: 'hi', id: 'c2' },
            ])
        })

        it('replaces existing language course entry', () => {
            const existing: CourseLanguageMapping[] = [{ lang: 'en', id: 'c1' }]
            const updated = mergeCourses(existing, [{ lang: 'en', id: 'c-new' }])
            expect(updated).toEqual([{ lang: 'en', id: 'c-new' }])
        })

        it('returns unchanged copy when newCourses is empty', () => {
            const existing: CourseLanguageMapping[] = [{ lang: 'en', id: 'c1' }]
            const updated = mergeCourses(existing, [])
            expect(updated).toEqual(existing)
            expect(updated).not.toBe(existing)
        })

        it('handles empty existing list', () => {
            const updated = mergeCourses([], [{ lang: 'en', id: 'c1' }])
            expect(updated).toEqual([{ lang: 'en', id: 'c1' }])
        })
    })

    // -----------------------------------------------------------------------
    describe('mergeLevelDescriptions', () => {
        it('returns newLevels when existingLevels is empty', () => {
            const newLevels: PlaylistCompetencyLevel[] = [{ level: '1', name: 'A', description: 'desc' }]
            expect(mergeLevelDescriptions([], newLevels, 'en')).toBe(newLevels)
        })

        it('returns newLevels when existingLevels is null', () => {
            const newLevels: PlaylistCompetencyLevel[] = [{ level: '1', name: 'A', description: 'desc' }]
            expect(mergeLevelDescriptions(null as any, newLevels, 'en')).toBe(newLevels)
        })

        it('adds a new level not present in existing', () => {
            const existing: PlaylistCompetencyLevel[] = [{ level: '1', name: 'A', description: 'descA' }]
            const newLevels: PlaylistCompetencyLevel[] = [{ level: '2', name: 'B', description: 'descB' }]
            const result = mergeLevelDescriptions(existing, newLevels, 'en')
            expect(result).toHaveLength(2)
            expect(result[1]).toEqual(newLevels[0])
        })

        it('updates name/description for matching level in english', () => {
            const existing: PlaylistCompetencyLevel[] = [{ level: '1', name: 'Old', description: 'OldDesc' }]
            const newLevels: PlaylistCompetencyLevel[] = [{ level: '1', name: 'New', description: 'NewDesc' }]
            const result = mergeLevelDescriptions(existing, newLevels, 'en')
            expect(result[0].name).toBe('New')
            expect(result[0].description).toBe('NewDesc')
        })

        it('does not overwrite name/description with empty values in english', () => {
            const existing: PlaylistCompetencyLevel[] = [{ level: '1', name: 'Old', description: 'OldDesc' }]
            const newLevels: PlaylistCompetencyLevel[] = [{ level: '1', name: '', description: '' }]
            const result = mergeLevelDescriptions(existing, newLevels, 'en')
            expect(result[0].name).toBe('Old')
            expect(result[0].description).toBe('OldDesc')
        })

        it('updates language-specific keys for non-english language', () => {
            const existing: PlaylistCompetencyLevel[] = [{ level: '1', name: 'A', description: 'B' }]
            const newLevels: PlaylistCompetencyLevel[] = [
                { level: '1', name: 'A', description: 'B', 'lang-hi-name': 'नाम', 'lang-hi-description': 'विवरण' },
            ]
            const result = mergeLevelDescriptions(existing, newLevels, 'hi')
            expect(result[0]['lang-hi-name']).toBe('नाम')
            expect(result[0]['lang-hi-description']).toBe('विवरण')
            // english fields untouched
            expect(result[0].name).toBe('A')
        })

        it('skips language-specific keys when missing on update', () => {
            const existing: PlaylistCompetencyLevel[] = [{ level: '1', name: 'A', description: 'B' }]
            const newLevels: PlaylistCompetencyLevel[] = [{ level: '1', name: 'A', description: 'B' }]
            const result = mergeLevelDescriptions(existing, newLevels, 'hi')
            expect(result[0]['lang-hi-name']).toBeUndefined()
        })

        it('merges courses when newLevel has course data', () => {
            const existing: PlaylistCompetencyLevel[] = [
                { level: '1', name: 'A', description: 'B', course: [{ lang: 'en', id: 'c1' }] },
            ]
            const newLevels: PlaylistCompetencyLevel[] = [
                { level: '1', name: 'A', description: 'B', course: [{ lang: 'hi', id: 'c2' }] },
            ]
            const result = mergeLevelDescriptions(existing, newLevels, 'en')
            expect(result[0].course).toEqual([
                { lang: 'en', id: 'c1' },
                { lang: 'hi', id: 'c2' },
            ])
        })

        it('preserves custom fields not explicitly handled', () => {
            const existing: PlaylistCompetencyLevel[] = [{ level: '1', name: 'A', description: 'B' }]
            const newLevels: PlaylistCompetencyLevel[] = [{ level: '1', name: 'A', description: 'B', customField: 'value' }]
            const result = mergeLevelDescriptions(existing, newLevels, 'en')
            expect(result[0].customField).toBe('value')
        })

        it('preserves other existing levels untouched when merging one', () => {
            const existing: PlaylistCompetencyLevel[] = [
                { level: '1', name: 'A', description: 'B' },
                { level: '2', name: 'C', description: 'D' },
            ]
            const newLevels: PlaylistCompetencyLevel[] = [{ level: '1', name: 'A2', description: 'B2' }]
            const result = mergeLevelDescriptions(existing, newLevels, 'en')
            expect(result).toHaveLength(2)
            expect(result[1]).toEqual({ level: '2', name: 'C', description: 'D' })
        })
    })

    // -----------------------------------------------------------------------
    describe('mergeCompetency', () => {
        function buildCompetency(overrides: Partial<PlaylistCompetency> = {}): PlaylistCompetency {
            return {
                id: 1,
                type: 'competency',
                name: 'Existing Name',
                description: 'Existing Desc',
                additionalProperties: {
                    Code: 'C1',
                    competencyLevelDescription: [{ level: '1', name: 'L1', description: 'LD1' }],
                },
                status: 'Live',
                source: null,
                level: '1',
                levelId: 1,
                isActive: true,
                createdDate: '2020-01-01',
                createdBy: 'user1',
                updatedDate: '2020-01-01',
                updatedBy: 'user1',
                reviewedDate: null,
                reviewedBy: null,
                wfId: null,
                children: [],
                ...overrides,
            } as PlaylistCompetency
        }

        it('updates updatedDate and updatedBy always', () => {
            const existing = buildCompetency()
            const update = buildCompetency({ name: undefined as any, description: undefined as any, additionalProperties: undefined as any })
            const result = mergeCompetency(existing, update, 'en', 'token123')
            expect(result.updatedBy).toBe('token123')
            expect(result.updatedDate).toBeDefined()
        })

        it('updates name/description in english when provided', () => {
            const existing = buildCompetency()
            const update = buildCompetency({ name: 'New Name', description: 'New Desc', additionalProperties: undefined as any })
            const result = mergeCompetency(existing, update, 'en', 'token')
            expect(result.name).toBe('New Name')
            expect(result.description).toBe('New Desc')
        })

        it('does not update name/description for non-english language', () => {
            const existing = buildCompetency()
            const update = buildCompetency({ name: 'New Name', description: 'New Desc', additionalProperties: undefined as any })
            const result = mergeCompetency(existing, update, 'hi', 'token')
            expect(result.name).toBe('Existing Name')
            expect(result.description).toBe('Existing Desc')
        })

        it('merges additionalProperties language keys for non-english', () => {
            const existing = buildCompetency()
            const update = buildCompetency({
                additionalProperties: {
                    Code: 'C1',
                    competencyLevelDescription: [],
                    'lang-hi-name': 'हिंदी नाम',
                    'lang-hi-description': 'हिंदी विवरण',
                } as any,
            })
            const result = mergeCompetency(existing, update, 'hi', 'token')
            expect(result.additionalProperties['lang-hi-name']).toBe('हिंदी नाम')
            expect(result.additionalProperties['lang-hi-description']).toBe('हिंदी विवरण')
        })

        it('merges competencyLevelDescription via mergeLevelDescriptions', () => {
            const existing = buildCompetency()
            const update = buildCompetency({
                additionalProperties: {
                    Code: 'C1',
                    competencyLevelDescription: [{ level: '2', name: 'L2', description: 'LD2' }],
                } as any,
            })
            const result = mergeCompetency(existing, update, 'en', 'token')
            expect(result.additionalProperties.competencyLevelDescription).toHaveLength(2)
        })

        it('preserves excluded keys (CompentencyType, CompetencyArea, Code) from existing', () => {
            const existing = buildCompetency({
                additionalProperties: {
                    Code: 'C1',
                    CompentencyType: 'TypeA',
                    CompetencyArea: 'AreaA',
                    competencyLevelDescription: [],
                } as any,
            })
            const update = buildCompetency({
                additionalProperties: {
                    Code: 'C999',
                    CompentencyType: 'TypeB',
                    CompetencyArea: 'AreaB',
                    competencyLevelDescription: [],
                } as any,
            })
            const result = mergeCompetency(existing, update, 'en', 'token')
            // Code/CompentencyType/CompetencyArea are excluded from the generic copy loop
            expect(result.additionalProperties.Code).toBe('C1')
            expect(result.additionalProperties.CompentencyType).toBe('TypeA')
            expect(result.additionalProperties.CompetencyArea).toBe('AreaA')
        })

        it('copies other custom additionalProperties keys from update', () => {
            const existing = buildCompetency()
            const update = buildCompetency({
                additionalProperties: {
                    Code: 'C1',
                    competencyLevelDescription: [],
                    customKey: 'customVal',
                } as any,
            })
            const result = mergeCompetency(existing, update, 'en', 'token')
            expect((result.additionalProperties as any).customKey).toBe('customVal')
        })

        it('leaves additionalProperties untouched when update has none', () => {
            const existing = buildCompetency()
            const update = buildCompetency({ additionalProperties: undefined as any })
            const result = mergeCompetency(existing, update, 'en', 'token')
            expect(result.additionalProperties).toEqual(existing.additionalProperties)
        })

        it('preserves other top-level existing fields not present after merge', () => {
            const existing = buildCompetency({ isActive: true, status: 'Live' })
            const update = buildCompetency({ additionalProperties: undefined as any })
            const result = mergeCompetency(existing, update, 'en', 'token')
            expect(result.isActive).toBe(true)
            expect(result.status).toBe('Live')
            expect(result.id).toBe(1)
        })
    })

    // -----------------------------------------------------------------------
    describe('updatePayloadNonDestructive', () => {
        function makeEntry(id: number, key: string, overrides: Partial<PlaylistCompetency> = {}): CompetencyPayloadEntry {
            return {
                [key]: {
                    id,
                    type: 'competency',
                    name: `Name${id}`,
                    description: `Desc${id}`,
                    additionalProperties: {
                        Code: key.toUpperCase(),
                        competencyLevelDescription: [],
                    },
                    status: 'Live',
                    source: null,
                    level: '1',
                    levelId: 1,
                    isActive: true,
                    createdDate: '2020-01-01',
                    createdBy: 'user1',
                    updatedDate: '2020-01-01',
                    updatedBy: 'user1',
                    reviewedDate: null,
                    reviewedBy: null,
                    wfId: null,
                    children: [],
                    ...overrides,
                } as PlaylistCompetency,
            }
        }

        it('returns updates directly when existingPayload is empty', () => {
            const updates = [makeEntry(1, 'c1')]
            expect(updatePayloadNonDestructive([], updates, 'en')).toBe(updates)
        })

        it('returns updates directly when existingPayload is null', () => {
            const updates = [makeEntry(1, 'c1')]
            expect(updatePayloadNonDestructive(null as any, updates, 'en')).toBe(updates)
        })

        it('merges matching competency ids and preserves others', () => {
            const existing = [makeEntry(1, 'c1'), makeEntry(2, 'c2')]
            const updates = [makeEntry(1, 'c1', { name: 'UpdatedName' })]
            const result = updatePayloadNonDestructive(existing, updates, 'en', 'auth-token')
            expect(result).toHaveLength(2)
            const merged1 = result.find(r => 'c1' in r)!.c1
            expect(merged1.name).toBe('UpdatedName')
            expect(merged1.updatedBy).toBe('auth-token')
            const kept2 = result.find(r => 'c2' in r)!.c2
            expect(kept2.name).toBe('Name2')
        })

        it('adds brand-new competencies not present in existing', () => {
            const existing = [makeEntry(1, 'c1')]
            const updates = [makeEntry(3, 'c3')]
            const result = updatePayloadNonDestructive(existing, updates, 'en')
            expect(result).toHaveLength(2)
            expect(result.some(r => 'c3' in r)).toBe(true)
            expect(result.some(r => 'c1' in r)).toBe(true)
        })

        it('uses default authToken "system" when not provided', () => {
            const existing = [makeEntry(1, 'c1')]
            const updates = [makeEntry(1, 'c1', { name: 'X' })]
            const result = updatePayloadNonDestructive(existing, updates, 'en')
            expect(result[0].c1.updatedBy).toBe('system')
        })

        it('handles position change where key differs from existing key but id matches', () => {
            const existing = [makeEntry(1, 'c1')]
            const updates = [makeEntry(1, 'c2')]
            const result = updatePayloadNonDestructive(existing, updates, 'en')
            expect(result).toHaveLength(1)
            expect('c2' in result[0]).toBe(true)
        })
    })

    // -----------------------------------------------------------------------
    describe('changeCompetencyPosition', () => {
        it('renames the root key to the lowercase new code', () => {
            const item: CompetencyPayloadEntry = {
                c2: {
                    id: 1,
                    additionalProperties: { Code: 'C2', competencyLevelDescription: [] },
                } as unknown as PlaylistCompetency,
            }
            const result = changeCompetencyPosition(item, 'C3')
            expect(Object.keys(result)).toEqual(['c3'])
            expect(result.c3.additionalProperties.Code).toBe('C3')
        })

        it('preserves the competency data other than the key and Code', () => {
            const item: CompetencyPayloadEntry = {
                c2: {
                    id: 42,
                    name: 'Keep Me',
                    additionalProperties: { Code: 'C2', competencyLevelDescription: [] },
                } as unknown as PlaylistCompetency,
            }
            const result = changeCompetencyPosition(item, 'C9')
            expect(result.c9.id).toBe(42)
            expect(result.c9.name).toBe('Keep Me')
        })

        it('handles competency with no additionalProperties gracefully', () => {
            const item: CompetencyPayloadEntry = {
                c2: { id: 1 } as unknown as PlaylistCompetency,
            }
            const result = changeCompetencyPosition(item, 'C5')
            expect(Object.keys(result)).toEqual(['c5'])
            expect(result.c5.id).toBe(1)
        })
    })
})
