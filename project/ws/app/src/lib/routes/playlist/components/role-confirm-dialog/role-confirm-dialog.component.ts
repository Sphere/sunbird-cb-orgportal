import { Component, Inject } from '@angular/core'
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog'

/**
 * Data passed to the Role Confirm Dialog
 */
export interface RoleConfirmDialogData {
    /** Roles user selected in filter but not in existing playlist */
    newRoles: string[]
    /** Roles in existing playlist but user didn't select in filter */
    existingOnlyRoles: string[]
    /** Whether this is a new playlist (no confirmation needed) */
    isNewPlaylist: boolean
}

/**
 * Role Confirm Dialog Component
 * 
 * Shows confirmation messages when:
 * 1. User adds new roles to an existing playlist
 * 2. User selects fewer roles than configured in DB
 * 
 * Returns true if user confirms, false if cancelled
 */
@Component({
    selector: 'app-role-confirm-dialog',
    templateUrl: './role-confirm-dialog.component.html',
    styleUrls: ['./role-confirm-dialog.component.scss'],
})
export class RoleConfirmDialogComponent {

    // All text content - no hardcoding in HTML
    readonly labels = {
        dialogTitle: 'Role Configuration Changed',
        newRolesLabel: 'You are adding new role(s):',
        newRolesInfo: 'The playlist will be updated for all selected roles.',
        existingRolesLabel: 'This playlist is also configured for other roles:',
        existingRolesWarning: 'Your changes will affect these roles as well.',
        confirmQuestion: 'Do you want to continue?',
        cancelBtn: 'Cancel',
        confirmBtn: 'Yes, Continue'
    }

    constructor(
        public dialogRef: MatDialogRef<RoleConfirmDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: RoleConfirmDialogData
    ) { }

    /**
     * Check if there are new roles being added
     */
    get hasNewRoles(): boolean {
        return this.data.newRoles && this.data.newRoles.length > 0
    }

    /**
     * Check if there are existing roles user didn't select
     */
    get hasExistingOnlyRoles(): boolean {
        return this.data.existingOnlyRoles && this.data.existingOnlyRoles.length > 0
    }

    /**
     * Format roles for display
     */
    formatRoles(roles: string[]): string {
        return roles.join(', ')
    }

    /**
     * User confirms the action
     */
    onConfirm(): void {
        this.dialogRef.close(true)
    }

    /**
     * User cancels the action
     */
    onCancel(): void {
        this.dialogRef.close(false)
    }
}
