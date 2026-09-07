export interface IColums {
  displayName: string,
  key: string,
  isList?: boolean,
  prop?: string
}
export interface IAction {
  name: string,
  icon: string,
  type: string,
  disabled?: boolean,
  label: string,
  condition?: string,
  optional?: boolean,
  optional_key?: string,
  optional_Value?: string,
}
export interface ITableData {
  columns: IColums[],
  actions: IAction[],
  needHash: boolean,
  needCheckBox: boolean,
  sortState?: string,
  sortColumn?: string
  needUserMenus: boolean
}
