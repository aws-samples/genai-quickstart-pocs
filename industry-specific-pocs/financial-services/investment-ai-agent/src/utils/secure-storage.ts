/**
 * Utilities for secure storage and access control
 */

import { AccessControl } from '../models/proprietary-data';

/**
 * Checks if a user has access to a resource based on access control settings
 * @param userId The ID of the user
 * @param userRoles The roles of the user
 * @param organizationId The ID of the user's organization
 * @param accessControl The access control settings for the resource
 * @returns True if the user has access
 */
export const hasAccess = (
  userId: string,
  userRoles: string[],
  organizationId: string,
  accessControl: AccessControl
): boolean => {
  // Check visibility level
  switch (accessControl.visibility) {
    case 'public':
      // Public resources are accessible to everyone
      return true;
      
    case 'organization':
      // Organization resources are accessible to members of the organization
      return (
        organizationId === accessControl.allowedOrganizations?.[0] ||
        (accessControl.allowedOrganizations?.includes(organizationId) ?? false)
      );
      
    case 'role':
      // Role-based resources are accessible to users with specific roles
      return (
        // Check if any of the user's roles match the allowed roles
        userRoles.some(role => accessControl.allowedRoles?.includes(role)) ||
        // Resource owner always has access
        accessControl.allowedUsers?.includes(userId) || false
      );
      
    case 'user':
      // User-specific resources are only accessible to specific users
      return accessControl.allowedUsers?.includes(userId) || false;
      
    default:
      return false;
  }
};

/**
 * Creates default access control settings for a new resource
 * @param userId The ID of the resource owner
 * @param organizationId The ID of the owner's organization
 * @param isConfidential Whether the resource contains confidential information
 * @returns Default access control settings
 */
export const createDefaultAccessControl = (
  userId: string,
  organizationId: string,
  isConfidential: boolean = false
): AccessControl => {
  if (isConfidential) {
    // Confidential resources are only accessible to the owner
    return {
      visibility: 'user',
      allowedUsers: [userId]
    };
  } else {
    // Non-confidential resources are accessible to the organization
    return {
      visibility: 'organization',
      allowedOrganizations: [organizationId]
    };
  }
};

/**
 * Validates access control settings
 * @param accessControl The access control settings to validate
 * @returns True if the access control settings are valid
 */
export const validateAccessControl = (accessControl: AccessControl): boolean => {
  // Check visibility
  if (!['public', 'organization', 'role', 'user'].includes(accessControl.visibility)) {
    return false;
  }
  
  // Check that the appropriate arrays are provided based on visibility
  switch (accessControl.visibility) {
    case 'organization':
      if (!accessControl.allowedOrganizations || accessControl.allowedOrganizations.length === 0) {
        return false;
      }
      break;
      
    case 'role':
      if (!accessControl.allowedRoles || accessControl.allowedRoles.length === 0) {
        return false;
      }
      break;
      
    case 'user':
      if (!accessControl.allowedUsers || accessControl.allowedUsers.length === 0) {
        return false;
      }
      break;
  }
  
  return true;
};

/**
 * Merges two access control settings
 * @param base The base access control settings
 * @param override The override access control settings
 * @returns Merged access control settings
 */
export const mergeAccessControl = (
  base: AccessControl,
  override: Partial<AccessControl>
): AccessControl => {
  return {
    visibility: override.visibility || base.visibility,
    allowedOrganizations: override.allowedOrganizations || base.allowedOrganizations,
    allowedRoles: override.allowedRoles || base.allowedRoles,
    allowedUsers: override.allowedUsers || base.allowedUsers
  };
};

/**
 * Restricts access control settings based on user permissions
 * @param accessControl The access control settings to restrict
 * @param userId The ID of the user
 * @param userRoles The roles of the user
 * @param canMakePublic Whether the user can make resources public
 * @returns Restricted access control settings
 */
export const restrictAccessControl = (
  accessControl: AccessControl,
  userId: string,
  userRoles: string[],
  canMakePublic: boolean = false
): AccessControl => {
  // Clone the access control
  const restricted: AccessControl = { ...accessControl };
  
  // If the user can't make resources public, restrict visibility
  if (!canMakePublic && restricted.visibility === 'public') {
    restricted.visibility = 'organization';
  }
  
  // Ensure the user is always included in allowed users
  if (restricted.visibility === 'user') {
    restricted.allowedUsers = restricted.allowedUsers || [];
    if (!restricted.allowedUsers.includes(userId)) {
      restricted.allowedUsers.push(userId);
    }
  }
  
  return restricted;
};