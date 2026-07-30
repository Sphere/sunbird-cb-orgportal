export function createSpyObj<T>(_name: string, methods: (keyof T)[]): jest.Mocked<T> {
  const spyObj = {} as jest.Mocked<T>
  for (const method of methods) {
    spyObj[method] = jest.fn() as any
  }
  return spyObj
}
