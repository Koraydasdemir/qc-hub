export type PermissionLevel = 'admin' | 'editor' | 'viewer';

// Permission level hierarchy: viewer (1) < editor (2) < admin (3)
const PERMISSION_HIERARCHY: Record<PermissionLevel, number> = {
  viewer: 1,
  editor: 2,
  admin: 3,
};

/**
 * Check if user has at least the required permission level
 */
export function hasPermission(
  currentLevel: PermissionLevel,
  requiredLevel: PermissionLevel
): boolean {
  return PERMISSION_HIERARCHY[currentLevel] >= PERMISSION_HIERARCHY[requiredLevel];
}

/**
 * Check if user can edit spec data
 */
export function canEdit(permissionLevel: PermissionLevel): boolean {
  return hasPermission(permissionLevel, 'editor');
}

/**
 * Check if user can delete spec data (admin only)
 */
export function canDelete(permissionLevel: PermissionLevel): boolean {
  return hasPermission(permissionLevel, 'admin');
}

/**
 * Check if user can approve requests
 */
export function canApprove(permissionLevel: PermissionLevel): boolean {
  return hasPermission(permissionLevel, 'admin');
}

/**
 * Check if user can submit QA data
 */
export function canSubmitQA(permissionLevel: PermissionLevel): boolean {
  return hasPermission(permissionLevel, 'editor');
}

/**
 * Check if user can update workflow status
 */
export function canUpdateWorkflow(permissionLevel: PermissionLevel): boolean {
  return hasPermission(permissionLevel, 'editor');
}

/**
 * Get permission label in Turkish
 */
export function getPermissionLabel(level: PermissionLevel): string {
  const labels: Record<PermissionLevel, string> = {
    admin: 'Yönetici',
    editor: 'Editör',
    viewer: 'Görüntüleyici',
  };
  return labels[level];
}

/**
 * Get permission description
 */
export function getPermissionDescription(level: PermissionLevel): string {
  const descriptions: Record<PermissionLevel, string> = {
    admin: 'Tam kontrol - Okuma, yazma, silme ve yönetim',
    editor: 'Düzenleme - Okuma ve yazma izni',
    viewer: 'Sadece okuma - Verileri görüntüleyebilir',
  };
  return descriptions[level];
}

/**
 * Get all permission levels
 */
export function getAllPermissionLevels(): Array<{
  level: PermissionLevel;
  label: string;
  description: string;
}> {
  return [
    {
      level: 'admin',
      label: getPermissionLabel('admin'),
      description: getPermissionDescription('admin'),
    },
    {
      level: 'editor',
      label: getPermissionLabel('editor'),
      description: getPermissionDescription('editor'),
    },
    {
      level: 'viewer',
      label: getPermissionLabel('viewer'),
      description: getPermissionDescription('viewer'),
    },
  ];
}

/**
 * Check if action is allowed
 */
export interface ActionPermission {
  action: string;
  requiredLevel: PermissionLevel;
  label: string;
}

export const ACTION_PERMISSIONS: Record<string, ActionPermission> = {
  VIEW: {
    action: 'view',
    requiredLevel: 'viewer',
    label: 'Görüntüle',
  },
  EDIT: {
    action: 'edit',
    requiredLevel: 'editor',
    label: 'Düzenle',
  },
  DELETE: {
    action: 'delete',
    requiredLevel: 'admin',
    label: 'Sil',
  },
  APPROVE: {
    action: 'approve',
    requiredLevel: 'admin',
    label: 'Onayla',
  },
  SUBMIT_QA: {
    action: 'submit_qa',
    requiredLevel: 'editor',
    label: 'QA Gönder',
  },
  UPDATE_WORKFLOW: {
    action: 'update_workflow',
    requiredLevel: 'editor',
    label: 'İş Akışı Güncelle',
  },
  MANAGE_USERS: {
    action: 'manage_users',
    requiredLevel: 'admin',
    label: 'Kullanıcıları Yönet',
  },
};

export function canPerformAction(
  permissionLevel: PermissionLevel,
  action: keyof typeof ACTION_PERMISSIONS
): boolean {
  const actionPermission = ACTION_PERMISSIONS[action];
  return hasPermission(permissionLevel, actionPermission.requiredLevel);
}

/**
 * Get allowed actions for a permission level
 */
export function getAllowedActions(
  permissionLevel: PermissionLevel
): string[] {
  return Object.entries(ACTION_PERMISSIONS)
    .filter(([_, permission]) =>
      hasPermission(permissionLevel, permission.requiredLevel)
    )
    .map(([key]) => key);
}

/**
 * Authorization check for UI components
 */
export function useCanAction(
  permissionLevel: PermissionLevel | null | undefined
) {
  const level = (permissionLevel || 'viewer') as PermissionLevel;

  return {
    canView: true, // Everyone can view
    canEdit: canEdit(level),
    canDelete: canDelete(level),
    canApprove: canApprove(level),
    canSubmitQA: canSubmitQA(level),
    canUpdateWorkflow: canUpdateWorkflow(level),
    permissionLevel: level,
    isAdmin: level === 'admin',
    isEditor: level === 'editor' || level === 'admin',
  };
}
