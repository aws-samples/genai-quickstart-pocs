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
export declare const hasAccess: (userId: string, userRoles: string[], organizationId: string, accessControl: AccessControl) => boolean;
/**
 * Creates default access control settings for a new resource
 * @param userId The ID of the resource owner
 * @param organizationId The ID of the owner's organization
 * @param isConfidential Whether the resource contains confidential information
 * @returns Default access control settings
 */
export declare const createDefaultAccessControl: (userId: string, organizationId: string, isConfidential?: boolean) => AccessControl;
/**
 * Validates access control settings
 * @param accessControl The access control settings to validate
 * @returns True if the access control settings are valid
 */
export declare const validateAccessControl: (accessControl: AccessControl) => boolean;
/**
 * Merges two access control settings
 * @param base The base access control settings
 * @param override The override access control settings
 * @returns Merged access control settings
 */
export declare const mergeAccessControl: (base: AccessControl, override: Partial<AccessControl>) => AccessControl;
/**
 * Restricts access control settings based on user permissions
 * @param accessControl The access control settings to restrict
 * @param userId The ID of the user
 * @param userRoles The roles of the user
 * @param canMakePublic Whether the user can make resources public
 * @returns Restricted access control settings
 */
export declare const restrictAccessControl: (accessControl: AccessControl, userId: string, userRoles: string[], canMakePublic?: boolean) => AccessControl;
