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
            name: 'MNC Attendance Report',
            key: 'mncAttendanceReport',
            fragment: false,
            render: true,
            badges: {
                enabled: false,
                uri: ''
            },
            enabled: true,
            routerLink: '/app/home/mnc-attendance-report',
            // Lowercase: the left-menu widget matches against the lowercased userRoles set.
            requiredRoles: ['mnc_report_viewer'],
        },
        // Playlist and Competency are left disabled deliberately. mergeMenus() was switched
        // off entirely until now, so neither has ever been rendered from here — their real
        // menu entries come from the host-served page config. Enabling them as a side effect
        // of turning mergeMenus back on would surface duplicate/unreviewed nav items.
        {
            name: 'Playlist',
            key: 'playlist',
            fragment: false,
            render: true,
            badges: {
                enabled: false,
                uri: ''
            },
            enabled: false,
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
            enabled: false,
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

