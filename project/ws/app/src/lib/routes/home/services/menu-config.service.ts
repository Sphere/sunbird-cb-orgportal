import { Injectable } from '@angular/core'

/**
 * Menu Configuration Service
 * Manages locally configured menus that aren't yet in the API.
 */
@Injectable({
    providedIn: 'root',
})
export class MenuConfigService {
    /**
     * Local menu configurations
     */
    private readonly localMenus = [
        {
            name: 'Playlist',
            key: 'playlist',
            fragment: false,
            render: true,
            badges: {
                enabled: false,
                uri: ''
            },
            enabled: true,
            routerLink: '/app/home/playlist/filters',
            requiredRoles: ['admin', 'mdo_admin', 'wat_member'],
        },
        {
            name: 'Competency',
            key: 'competency',
            fragment: false,
            render: true,
            badges: {
                enabled: false,
                uri: ''
            },
            enabled: true,
            routerLink: '/app/home/competency/summary',
            requiredRoles: ['admin', 'mdo_admin', 'wat_member'],
        },
    ]

    /**
     * Merge local menus with API menus
     */
    mergeMenus(apiMenus: any[]): any[] {
        console.log('[MenuConfig] mergeMenus called with', apiMenus?.length, 'API menus')

        const result = [...apiMenus]

        for (const localMenu of this.localMenus) {
            if (!localMenu.enabled) {
                console.log(`[MenuConfig] Skipping disabled menu: ${localMenu.key}`)
                continue
            }

            // Check if menu already exists
            const exists = result.some(
                menu => menu.key?.toLowerCase() === localMenu.key.toLowerCase()
            )

            if (exists) {
                console.log(`[MenuConfig] Menu '${localMenu.key}' already exists, skipping`)
                continue
            }

            // Add menu at the end
            result.push(localMenu)
            console.log(`[MenuConfig] Added menu '${localMenu.key}' with routerLink: ${localMenu.routerLink}`)
        }

        console.log('[MenuConfig] Final menu count:', result.length)
        return result
    }
}

