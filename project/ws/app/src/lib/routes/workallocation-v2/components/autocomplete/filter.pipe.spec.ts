import { FilterPipe } from './filter.pipe'

describe('FilterPipe', () => {
  let pipe: FilterPipe

  beforeEach(() => {
    pipe = new FilterPipe()
  })

  it('should create', () => {
    expect(pipe).toBeTruthy()
  })

  it('should return items unchanged when items is falsy', () => {
    expect(pipe.transform(null as any, 'x')).toBeNull()
  })

  it('should return items unchanged when searchTerm is falsy', () => {
    const items = [{ userDetails: { first_name: 'a', last_name: 'b' } }]
    expect(pipe.transform(items, '')).toBe(items)
  })

  it('should filter by first_name using the default userDetails key', () => {
    const items = [
      { userDetails: { first_name: 'John', last_name: 'Doe' } },
      { userDetails: { first_name: 'Jane', last_name: 'Smith' } },
    ]
    expect(pipe.transform(items, 'john')).toEqual([items[0]])
  })

  it('should filter by last_name using the default userDetails key', () => {
    const items = [
      { userDetails: { first_name: 'John', last_name: 'Doe' } },
      { userDetails: { first_name: 'Jane', last_name: 'Smith' } },
    ]
    expect(pipe.transform(items, 'smith')).toEqual([items[1]])
  })

  it('should filter using a custom labelKey', () => {
    const items = [
      { profile: { first_name: 'John', last_name: 'Doe' } },
      { profile: { first_name: 'Jane', last_name: 'Smith' } },
    ]
    expect(pipe.transform(items, 'jane', 'profile')).toEqual([items[1]])
  })
})
