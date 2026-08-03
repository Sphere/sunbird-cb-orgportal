import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { IFrac } from '../interfaces/frac.model'

@Injectable({
  providedIn: 'root',
})
export class FracService {

  constructor(
    private configSvc: ConfigurationsService,
    private http: HttpClient) { }

  /**
   * Fetches FRAC widget config JSON used by the container component.
   */
  fetchFrac(): Promise<IFrac> {
    return new Promise<IFrac>((resolve, reject) => {
      this.http.get<IFrac>(`${this.configSvc.baseUrl}/feature/frac.json`).subscribe({
        next: (response) => resolve(response),
        error: (error) => reject(error instanceof Error ? error : new Error(error?.message || 'Failed to fetch FRAC config')),
      })
    })
  }
}
