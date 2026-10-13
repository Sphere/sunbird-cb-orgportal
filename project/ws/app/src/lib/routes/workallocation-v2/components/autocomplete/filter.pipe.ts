import { Pipe, PipeTransform } from '@angular/core'

@Pipe({
  standalone: false,
  name: 'filter',
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], searchTerm: string, labelKey?: string): any {
    if (!items || !searchTerm) {
      return items
    }

    return items.filter(
      item =>
        item[labelKey || 'userDetails']['first_name']
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) === true ||
        item[labelKey || 'userDetails']['last_name']
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) === true
    )
  }
}
