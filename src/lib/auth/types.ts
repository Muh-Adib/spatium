/**
 * SPATIUM Platform — Role & Editorial Lifecycle Definitions
 * Shared between Server and Client Components.
 */

// --- 1. Canonical Roles --------------------------------------------------------
export type Role =
  | 'SUPER_ADMIN'
  | 'CONTENT_ADMIN'
  | 'EDITOR'
  | 'AUTHOR'
  | 'SEO_MANAGER'
  | 'MEDIA_MANAGER'
  | 'REVIEWER'

// --- 2. Canonical Editorial Lifecycle States -----------------------------------
export type ArticleStatus =
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'published'
  | 'scheduled'
  | 'archived'

// --- 3. Audit Log Entry --------------------------------------------------------
export interface StatusHistoryEntry {
  actor: string
  role: Role
  timestamp: string
  fromState: ArticleStatus
  toState: ArticleStatus
  note?: string
}

// --- 4. Role Permissions Matrix -----------------------------------------------
export interface RolePermissions {
  canCreateArticle: boolean
  canEditOwnDraft: boolean
  canEditAnyDraft: boolean
  canSubmitForReview: boolean
  canReview: boolean
  canApprove: boolean
  canPublish: boolean
  canArchive: boolean
  canDeleteArticle: boolean
  canManageRedirects: boolean
  canManageSeo: boolean
}

export const ROLE_PERMISSIONS: Record<Role, RolePermissions> = {
  SUPER_ADMIN: {
    canCreateArticle: true,
    canEditOwnDraft: true,
    canEditAnyDraft: true,
    canSubmitForReview: true,
    canReview: true,
    canApprove: true,
    canPublish: true,
    canArchive: true,
    canDeleteArticle: true,
    canManageRedirects: true,
    canManageSeo: true,
  },
  CONTENT_ADMIN: {
    canCreateArticle: true,
    canEditOwnDraft: true,
    canEditAnyDraft: true,
    canSubmitForReview: true,
    canReview: true,
    canApprove: true,
    canPublish: true,
    canArchive: true,
    canDeleteArticle: true,
    canManageRedirects: true,
    canManageSeo: true,
  },
  EDITOR: {
    canCreateArticle: true,
    canEditOwnDraft: true,
    canEditAnyDraft: true,
    canSubmitForReview: true,
    canReview: true,
    canApprove: true,
    canPublish: true,
    canArchive: true,
    canDeleteArticle: false,
    canManageRedirects: true,
    canManageSeo: true,
  },
  REVIEWER: {
    canCreateArticle: false,
    canEditOwnDraft: false,
    canEditAnyDraft: false,
    canSubmitForReview: false,
    canReview: true,
    canApprove: true,
    canPublish: false,
    canArchive: false,
    canDeleteArticle: false,
    canManageRedirects: false,
    canManageSeo: false,
  },
  AUTHOR: {
    canCreateArticle: true,
    canEditOwnDraft: true,
    canEditAnyDraft: false,
    canSubmitForReview: true,
    canApprove: false,
    canReview: false,
    canPublish: false,
    canArchive: false,
    canDeleteArticle: false,
    canManageRedirects: false,
    canManageSeo: false,
  },
  SEO_MANAGER: {
    canCreateArticle: false,
    canEditOwnDraft: false,
    canEditAnyDraft: false,
    canSubmitForReview: false,
    canReview: false,
    canApprove: false,
    canPublish: false,
    canArchive: false,
    canDeleteArticle: false,
    canManageRedirects: true,
    canManageSeo: true,
  },
  MEDIA_MANAGER: {
    canCreateArticle: false,
    canEditOwnDraft: false,
    canEditAnyDraft: false,
    canSubmitForReview: false,
    canReview: false,
    canApprove: false,
    canPublish: false,
    canArchive: false,
    canDeleteArticle: false,
    canManageRedirects: false,
    canManageSeo: false,
  },
}

export interface TransitionResult {
  allowed: boolean
  error?: string
}

export function validateStatusTransition(
  fromState: ArticleStatus,
  toState: ArticleStatus,
  role: Role
): TransitionResult {
  if (fromState === toState) {
    return { allowed: true }
  }

  const permissions = ROLE_PERMISSIONS[role]
  if (!permissions) {
    return { allowed: false, error: `Peran '${role}' tidak terdaftar dalam sistem RBAC.` }
  }

  switch (toState) {
    case 'in_review':
      if (fromState !== 'draft') {
        return { allowed: false, error: `Hanya artikel berstatus 'draft' yang dapat diajukan ke 'in_review'.` }
      }
      if (!permissions.canSubmitForReview) {
        return { allowed: false, error: `Peran '${role}' tidak memiliki izin mengajukan review.` }
      }
      return { allowed: true }

    case 'approved':
      if (fromState !== 'in_review') {
        return { allowed: false, error: `Hanya artikel dalam status 'in_review' yang dapat disetujui (approved).` }
      }
      if (!permissions.canApprove) {
        return { allowed: false, error: `Peran '${role}' tidak memiliki izin menyetujui artikel.` }
      }
      return { allowed: true }

    case 'scheduled':
      if (!permissions.canPublish) return { allowed: false, error: 'Tidak berwenang menjadwalkan publikasi.' }
      if (fromState === 'archived') return { allowed: false, error: 'Pulihkan artikel dari arsip sebelum menjadwalkan.' }
      return { allowed: true }

    case 'published':
      if (fromState !== 'approved' && fromState !== 'in_review' && role !== 'SUPER_ADMIN' && role !== 'CONTENT_ADMIN') {
        return { allowed: false, error: `Artikel harus berstatus 'approved' sebelum dapat dipublikasikan.` }
      }
      if (!permissions.canPublish) {
        return { allowed: false, error: `Peran '${role}' tidak memiliki wewenang mempublikasikan konten.` }
      }
      return { allowed: true }

    case 'archived':
      if (fromState !== 'published') {
        return { allowed: false, error: `Hanya artikel 'published' yang dapat diarsipkan.` }
      }
      if (!permissions.canArchive) {
        return { allowed: false, error: `Peran '${role}' tidak memiliki wewenang mengarsipkan artikel.` }
      }
      return { allowed: true }

    case 'draft':
      if (fromState === 'scheduled' && !permissions.canPublish) return { allowed: false, error: 'Tidak berwenang membatalkan jadwal.' }
      if (fromState === 'in_review' || fromState === 'approved') {
        if (!permissions.canReview && !permissions.canEditAnyDraft) {
          return { allowed: false, error: `Tidak memiliki wewenang mengembalikan artikel ke status draft.` }
        }
        return { allowed: true }
      }
      if (fromState === 'archived') {
        if (!permissions.canPublish && !permissions.canEditAnyDraft) {
          return { allowed: false, error: `Tidak memiliki wewenang memulihkan artikel dari arsip.` }
        }
        return { allowed: true }
      }
      return { allowed: true }

    default:
      return { allowed: false, error: `Status tujuan '${toState}' tidak valid.` }
  }
}
