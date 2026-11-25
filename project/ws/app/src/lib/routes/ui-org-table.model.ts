/**
 * Local copy of the `ITableData` shape previously imported from the internal path
 * `@sunbird-cb/collection/lib/ui-org-table/interface/interfaces`, which is no longer
 * reachable in the compiled (-ang-17-20) package. Structurally compatible with the
 * UIORGTable component's `tableData` input.
 */
export interface ITableData {
  columns: any[]
  actions: any[]
  needHash: boolean
  needCheckBox: boolean
  sortState?: string
  sortColumn?: string
  needUserMenus: boolean
  actionColumnName?: string
  cbpPlanMenu?: boolean
}
