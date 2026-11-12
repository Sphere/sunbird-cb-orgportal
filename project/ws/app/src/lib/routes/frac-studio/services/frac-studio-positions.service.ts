import { Injectable } from '@angular/core'
import { Observable, of } from 'rxjs'
import { catchError, map, switchMap } from 'rxjs/operators'
import { FracApiService } from '../../frac/services/frac-api.service'
import { buildPositionMappingTree, extractEntityList, transformPositions } from '../../frac/utils/common.util'

/** A position in the FRAC module's Positions master, with the roles and activity texts mapped to it. */
export interface FracStudioPosition {
  code: string
  name: string
  roles: { title: string, activities: string[] }[]
}

/** The Positions master is English-first; the FRAC module searches positions in English too. */
const POSITION_LANGUAGE = 'en'

/** Exact position match: case and surrounding or repeated spaces are ignored, nothing else (the service matches the same way). */
export const samePosition = (a: string, b: string) =>
  a.trim().replace(/\s+/g, ' ').toLowerCase() === b.trim().replace(/\s+/g, ' ').toLowerCase()

/**
 * Position matching against the FRAC module's Positions master (entity API through /apis/proxies/v8/entity/v1),
 * reusing that module's search and hierarchy helpers. Used by the Creator brief after the owner's own FRACs.
 */
@Injectable({ providedIn: 'root' })
export class FracStudioPositionsService {
  constructor(private readonly fracApi: FracApiService) { }

  /**
   * The position named exactly `name`, with its roles (Position → Role → Activity), or null when there is
   * none. A failed lookup also gives null: matching is a convenience, so the brief carries on as a new position.
   */
  findPosition(name: string): Observable<FracStudioPosition | null> {
    return this.fracApi.searchEntities('position', name, POSITION_LANGUAGE).pipe(
      map(res => transformPositions(extractEntityList(res)).find(p => samePosition(p.title, name)) ?? null),
      switchMap(hit => !hit ? of(null) : this.fracApi.searchEntityHierarchy('position', hit.code, POSITION_LANGUAGE).pipe(
        map(tree => ({
          code: hit.code,
          name: hit.title,
          roles: buildPositionMappingTree(tree)
            .map(r => ({ title: r.name, activities: r.activities.map(a => a.name).filter(Boolean) }))
            .filter(r => r.title),
        })),
      )),
      catchError(() => of(null)),
    )
  }
}
