"use strict";
/**
 * Utilities for secure storage and access control
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.restrictAccessControl = exports.mergeAccessControl = exports.validateAccessControl = exports.createDefaultAccessControl = exports.hasAccess = void 0;
/**
 * Checks if a user has access to a resource based on access control settings
 * @param userId The ID of the user
 * @param userRoles The roles of the user
 * @param organizationId The ID of the user's organization
 * @param accessControl The access control settings for the resource
 * @returns True if the user has access
 */
const hasAccess = (userId, userRoles, organizationId, accessControl) => {
    // Check visibility level
    switch (accessControl.visibility) {
        case 'public':
            // Public resources are accessible to everyone
            return true;
        case 'organization':
            // Organization resources are accessible to members of the organization
            return (organizationId === accessControl.allowedOrganizations?.[0] ||
                (accessControl.allowedOrganizations?.includes(organizationId) ?? false));
        case 'role':
            // Role-based resources are accessible to users with specific roles
            return (
            // Check if any of the user's roles match the allowed roles
            userRoles.some(role => accessControl.allowedRoles?.includes(role)) ||
                // Resource owner always has access
                accessControl.allowedUsers?.includes(userId) || false);
        case 'user':
            // User-specific resources are only accessible to specific users
            return accessControl.allowedUsers?.includes(userId) || false;
        default:
            return false;
    }
};
exports.hasAccess = hasAccess;
/**
 * Creates default access control settings for a new resource
 * @param userId The ID of the resource owner
 * @param organizationId The ID of the owner's organization
 * @param isConfidential Whether the resource contains confidential information
 * @returns Default access control settings
 */
const createDefaultAccessControl = (userId, organizationId, isConfidential = false) => {
    if (isConfidential) {
        // Confidential resources are only accessible to the owner
        return {
            visibility: 'user',
            allowedUsers: [userId]
        };
    }
    else {
        // Non-confidential resources are accessible to the organization
        return {
            visibility: 'organization',
            allowedOrganizations: [organizationId]
        };
    }
};
exports.createDefaultAccessControl = createDefaultAccessControl;
/**
 * Validates access control settings
 * @param accessControl The access control settings to validate
 * @returns True if the access control settings are valid
 */
const validateAccessControl = (accessControl) => {
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
exports.validateAccessControl = validateAccessControl;
/**
 * Merges two access control settings
 * @param base The base access control settings
 * @param override The override access control settings
 * @returns Merged access control settings
 */
const mergeAccessControl = (base, override) => {
    return {
        visibility: override.visibility || base.visibility,
        allowedOrganizations: override.allowedOrganizations || base.allowedOrganizations,
        allowedRoles: override.allowedRoles || base.allowedRoles,
        allowedUsers: override.allowedUsers || base.allowedUsers
    };
};
exports.mergeAccessControl = mergeAccessControl;
/**
 * Restricts access control settings based on user permissions
 * @param accessControl The access control settings to restrict
 * @param userId The ID of the user
 * @param userRoles The roles of the user
 * @param canMakePublic Whether the user can make resources public
 * @returns Restricted access control settings
 */
const restrictAccessControl = (accessControl, userId, userRoles, canMakePublic = false) => {
    // Clone the access control
    const restricted = { ...accessControl };
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
exports.restrictAccessControl = restrictAccessControl;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjdXJlLXN0b3JhZ2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdXRpbHMvc2VjdXJlLXN0b3JhZ2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOzs7QUFJSDs7Ozs7OztHQU9HO0FBQ0ksTUFBTSxTQUFTLEdBQUcsQ0FDdkIsTUFBYyxFQUNkLFNBQW1CLEVBQ25CLGNBQXNCLEVBQ3RCLGFBQTRCLEVBQ25CLEVBQUU7SUFDWCx5QkFBeUI7SUFDekIsUUFBUSxhQUFhLENBQUMsVUFBVSxFQUFFO1FBQ2hDLEtBQUssUUFBUTtZQUNYLDhDQUE4QztZQUM5QyxPQUFPLElBQUksQ0FBQztRQUVkLEtBQUssY0FBYztZQUNqQix1RUFBdUU7WUFDdkUsT0FBTyxDQUNMLGNBQWMsS0FBSyxhQUFhLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzFELENBQUMsYUFBYSxDQUFDLG9CQUFvQixFQUFFLFFBQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FDeEUsQ0FBQztRQUVKLEtBQUssTUFBTTtZQUNULG1FQUFtRTtZQUNuRSxPQUFPO1lBQ0wsMkRBQTJEO1lBQzNELFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDbEUsbUNBQW1DO2dCQUNuQyxhQUFhLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQ3RELENBQUM7UUFFSixLQUFLLE1BQU07WUFDVCxnRUFBZ0U7WUFDaEUsT0FBTyxhQUFhLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUM7UUFFL0Q7WUFDRSxPQUFPLEtBQUssQ0FBQztLQUNoQjtBQUNILENBQUMsQ0FBQztBQW5DVyxRQUFBLFNBQVMsYUFtQ3BCO0FBRUY7Ozs7OztHQU1HO0FB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LFVBQVUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ3RDO0tBQ0Y7SUFFRCxPQUFPLFVBQVUsQ0FBQztBQUNwQixDQUFDLENBQUM7QUF2QlcsUUFBQSxxQkFBcUIseUJBdUJoQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVXRpbGl0aWVzIGZvciBzZWN1cmUgc3RvcmFnZSBhbmQgYWNjZXNzIGNvbnRyb2xcbiAqL1xuXG5pbXBvcnQgeyBBY2Nlc3NDb250cm9sIH0gZnJvbSAnLi4vbW9kZWxzL3Byb3ByaWV0YXJ5LWRhdGEnO1xuXG4vKipcbiAqIENoZWNrcyBpZiBhIHVzZXIgaGFzIGFjY2VzcyB0byBhIHJlc291cmNlIGJhc2VkIG9uIGFjY2VzcyBjb250cm9sIHNldHRpbmdzXG4gKiBAcGFyYW0gdXNlcklkIFRoZSBJRCBvZiB0aGUgdXNlclxuICogQHBhcmFtIHVzZXJSb2xlcyBUaGUgcm9sZXMgb2YgdGhlIHVzZXJcbiAqIEBwYXJhbSBvcmdhbml6YXRpb25JZCBUaGUgSUQgb2YgdGhlIHVzZXIncyBvcmdhbml6YXRpb25cbiAqIEBwYXJhbSBhY2Nlc3NDb250cm9sIFRoZSBhY2Nlc3MgY29udHJvbCBzZXR0aW5ncyBmb3IgdGhlIHJlc291cmNlXG4gKiBAcmV0dXJucyBUcnVlIGlmIHRoZSB1c2VyIGhhcyBhY2Nlc3NcbiAqL1xuZXhwb3J0IGNvbnN0IGhhc0FjY2VzcyA9IChcbiAgdXNlcklkOiBzdHJpbmcsXG4gIHVzZXJSb2xlczogc3RyaW5nW10sXG4gIG9yZ2FuaXphdGlvbklkOiBzdHJpbmcsXG4gIGFjY2Vzc0NvbnRyb2w6IEFjY2Vzc0NvbnRyb2xcbik6IGJvb2xlYW4gPT4ge1xuICAvLyBDaGVjayB2aXNpYmlsaXR5IGxldmVsXG4gIHN3aXRjaCAoYWNjZXNzQ29udHJvbC52aXNpYmlsaXR5KSB7XG4gICAgY2FzZSAncHVibGljJzpcbiAgICAgIC8vIFB1YmxpYyByZXNvdXJjZXMgYXJlIGFjY2Vzc2libGUgdG8gZXZlcnlvbmVcbiAgICAgIHJldHVybiB0cnVlO1xuICAgICAgXG4gICAgY2FzZSAnb3JnYW5pemF0aW9uJzpcbiAgICAgIC8vIE9yZ2FuaXphdGlvbiByZXNvdXJjZXMgYXJlIGFjY2Vzc2libGUgdG8gbWVtYmVycyBvZiB0aGUgb3JnYW5pemF0aW9uXG4gICAgICByZXR1cm4gKFxuICAgICAgICBvcmdhbml6YXRpb25JZCA9PT0gYWNjZXNzQ29udHJvbC5hbGxvd2VkT3JnYW5pemF0aW9ucz8uWzBdIHx8XG4gICAgICAgIChhY2Nlc3NDb250cm9sLmFsbG93ZWRPcmdhbml6YXRpb25zPy5pbmNsdWRlcyhvcmdhbml6YXRpb25JZCkgPz8gZmFsc2UpXG4gICAgICApO1xuICAgICAgXG4gICAgY2FzZSAncm9sZSc6XG4gICAgICAvLyBSb2xlLWJhc2VkIHJlc291cmNlcyBhcmUgYWNjZXNzaWJsZSB0byB1c2VycyB3aXRoIHNwZWNpZmljIHJvbGVzXG4gICAgICByZXR1cm4gKFxuICAgICAgICAvLyBDaGVjayBpZiBhbnkgb2YgdGhlIHVzZXIncyByb2xlcyBtYXRjaCB0aGUgYWxsb3dlZCByb2xlc1xuICAgICAgICB1c2VyUm9sZXMuc29tZShyb2xlID0+IGFjY2Vzc0NvbnRyb2wuYWxsb3dlZFJvbGVzPy5pbmNsdWRlcyhyb2xlKSkgfHxcbiAgICAgICAgLy8gUmVzb3VyY2Ugb3duZXIgYWx3YXlzIGhhcyBhY2Nlc3NcbiAgICAgICAgYWNjZXNzQ29udHJvbC5hbGxvd2VkVXNlcnM/LmluY2x1ZGVzKHVzZXJJZCkgfHwgZmFsc2VcbiAgICAgICk7XG4gICAgICBcbiAgICBjYXNlICd1c2VyJzpcbiAgICAgIC8vIFVzZXItc3BlY2lmaWMgcmVzb3VyY2VzIGFyZSBvbmx5IGFjY2Vzc2libGUgdG8gc3BlY2lmaWMgdXNlcnNcbiAgICAgIHJldHVybiBhY2Nlc3NDb250cm9sLmFsbG93ZWRVc2Vycz8uaW5jbHVkZXModXNlcklkKSB8fCBmYWxzZTtcbiAgICAgIFxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlcyBkZWZhdWx0IGFjY2VzcyBjb250cm9sIHNldHRpbmdzIGZvciBhIG5ldyByZXNvdXJjZVxuICogQHBhcmFtIHVzZXJJZCBUaGUgSUQgb2YgdGhlIHJlc291cmNlIG93bmVyXG4gKiBAcGFyYW0gb3JnYW5pemF0aW9uSWQgVGhlIElEIG9mIHRoZSBvd25lcidzIG9yZ2FuaXphdGlvblxuICogQHBhcmFtIGlzQ29uZmlkZW50aWFsIFdoZXRoZXIgdGhlIHJlc291cmNlIGNvbnRhaW5zIGNvbmZpZGVudGlhbCBpbmZvcm1hdGlvblxuICogQHJldHVybnMgRGVmYXVsdCBhY2Nlc3MgY29udHJvbCBzZXR0aW5nc1xuICovXG5leHBvcnQgY29uc3QgY3JlYXRlRGVmYXVsdEFjY2Vzc0NvbnRyb2wgPSAoXG4gIHVzZXJJZDogc3RyaW5nLFxuICBvcmdhbml6YXRpb25JZDogc3RyaW5nLFxuICBpc0NvbmZpZGVudGlhbDogYm9vbGVhbiA9IGZhbHNlXG4pOiBBY2Nlc3NDb250cm9sID0+IHtcbiAgaWYgKGlzQ29uZmlkZW50aWFsKSB7XG4gICAgLy8gQ29uZmlkZW50aWFsIHJlc291cmNlcyBhcmUgb25seSBhY2Nlc3NpYmxlIHRvIHRoZSBvd25lclxuICAgIHJldHVybiB7XG4gICAgICB2aXNpYmlsaXR5OiAndXNlcicsXG4gICAgICBhbGxvd2VkVXNlcnM6IFt1c2VySWRdXG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICAvLyBOb24tY29uZmlkZW50aWFsIHJlc291cmNlcyBhcmUgYWNjZXNzaWJsZSB0byB0aGUgb3JnYW5pemF0aW9uXG4gICAgcmV0dXJuIHtcbiAgICAgIHZpc2liaWxpdHk6ICdvcmdhbml6YXRpb24nLFxuICAgICAgYWxsb3dlZE9yZ2FuaXphdGlvbnM6IFtvcmdhbml6YXRpb25JZF1cbiAgICB9O1xuICB9XG59O1xuXG4vKipcbiAqIFZhbGlkYXRlcyBhY2Nlc3MgY29udHJvbCBzZXR0aW5nc1xuICogQHBhcmFtIGFjY2Vzc0NvbnRyb2wgVGhlIGFjY2VzcyBjb250cm9sIHNldHRpbmdzIHRvIHZhbGlkYXRlXG4gKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBhY2Nlc3MgY29udHJvbCBzZXR0aW5ncyBhcmUgdmFsaWRcbiAqL1xuZXhwb3J0IGNvbnN0IHZhbGlkYXRlQWNjZXNzQ29udHJvbCA9IChhY2Nlc3NDb250cm9sOiBBY2Nlc3NDb250cm9sKTogYm9vbGVhbiA9PiB7XG4gIC8vIENoZWNrIHZpc2liaWxpdHlcbiAgaWYgKCFbJ3B1YmxpYycsICdvcmdhbml6YXRpb24nLCAncm9sZScsICd1c2VyJ10uaW5jbHVkZXMoYWNjZXNzQ29udHJvbC52aXNpYmlsaXR5KSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBcbiAgLy8gQ2hlY2sgdGhhdCB0aGUgYXBwcm9wcmlhdGUgYXJyYXlzIGFyZSBwcm92aWRlZCBiYXNlZCBvbiB2aXNpYmlsaXR5XG4gIHN3aXRjaCAoYWNjZXNzQ29udHJvbC52aXNpYmlsaXR5KSB7XG4gICAgY2FzZSAnb3JnYW5pemF0aW9uJzpcbiAgICAgIGlmICghYWNjZXNzQ29udHJvbC5hbGxvd2VkT3JnYW5pemF0aW9ucyB8fCBhY2Nlc3NDb250cm9sLmFsbG93ZWRPcmdhbml6YXRpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICAgIFxuICAgIGNhc2UgJ3JvbGUnOlxuICAgICAgaWYgKCFhY2Nlc3NDb250cm9sLmFsbG93ZWRSb2xlcyB8fCBhY2Nlc3NDb250cm9sLmFsbG93ZWRSb2xlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgICBcbiAgICBjYXNlICd1c2VyJzpcbiAgICAgIGlmICghYWNjZXNzQ29udHJvbC5hbGxvd2VkVXNlcnMgfHwgYWNjZXNzQ29udHJvbC5hbGxvd2VkVXNlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICB9XG4gIFxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8qKlxuICogTWVyZ2VzIHR3byBhY2Nlc3MgY29udHJvbCBzZXR0aW5nc1xuICogQHBhcmFtIGJhc2UgVGhlIGJhc2UgYWNjZXNzIGNvbnRyb2wgc2V0dGluZ3NcbiAqIEBwYXJhbSBvdmVycmlkZSBUaGUgb3ZlcnJpZGUgYWNjZXNzIGNvbnRyb2wgc2V0dGluZ3NcbiAqIEByZXR1cm5zIE1lcmdlZCBhY2Nlc3MgY29udHJvbCBzZXR0aW5nc1xuICovXG5leHBvcnQgY29uc3QgbWVyZ2VBY2Nlc3NDb250cm9sID0gKFxuICBiYXNlOiBBY2Nlc3NDb250cm9sLFxuICBvdmVycmlkZTogUGFydGlhbDxBY2Nlc3NDb250cm9sPlxuKTogQWNjZXNzQ29udHJvbCA9PiB7XG4gIHJldHVybiB7XG4gICAgdmlzaWJpbGl0eTogb3ZlcnJpZGUudmlzaWJpbGl0eSB8fCBiYXNlLnZpc2liaWxpdHksXG4gICAgYWxsb3dlZE9yZ2FuaXphdGlvbnM6IG92ZXJyaWRlLmFsbG93ZWRPcmdhbml6YXRpb25zIHx8IGJhc2UuYWxsb3dlZE9yZ2FuaXphdGlvbnMsXG4gICAgYWxsb3dlZFJvbGVzOiBvdmVycmlkZS5hbGxvd2VkUm9sZXMgfHwgYmFzZS5hbGxvd2VkUm9sZXMsXG4gICAgYWxsb3dlZFVzZXJzOiBvdmVycmlkZS5hbGxvd2VkVXNlcnMgfHwgYmFzZS5hbGxvd2VkVXNlcnNcbiAgfTtcbn07XG5cbi8qKlxuICogUmVzdHJpY3RzIGFjY2VzcyBjb250cm9sIHNldHRpbmdzIGJhc2VkIG9uIHVzZXIgcGVybWlzc2lvbnNcbiAqIEBwYXJhbSBhY2Nlc3NDb250cm9sIFRoZSBhY2Nlc3MgY29udHJvbCBzZXR0aW5ncyB0byByZXN0cmljdFxuICogQHBhcmFtIHVzZXJJZCBUaGUgSUQgb2YgdGhlIHVzZXJcbiAqIEBwYXJhbSB1c2VyUm9sZXMgVGhlIHJvbGVzIG9mIHRoZSB1c2VyXG4gKiBAcGFyYW0gY2FuTWFrZVB1YmxpYyBXaGV0aGVyIHRoZSB1c2VyIGNhbiBtYWtlIHJlc291cmNlcyBwdWJsaWNcbiAqIEByZXR1cm5zIFJlc3RyaWN0ZWQgYWNjZXNzIGNvbnRyb2wgc2V0dGluZ3NcbiAqL1xuZXhwb3J0IGNvbnN0IHJlc3RyaWN0QWNjZXNzQ29udHJvbCA9IChcbiAgYWNjZXNzQ29udHJvbDogQWNjZXNzQ29udHJvbCxcbiAgdXNlcklkOiBzdHJpbmcsXG4gIHVzZXJSb2xlczogc3RyaW5nW10sXG4gIGNhbk1ha2VQdWJsaWM6IGJvb2xlYW4gPSBmYWxzZVxuKTogQWNjZXNzQ29udHJvbCA9PiB7XG4gIC8vIENsb25lIHRoZSBhY2Nlc3MgY29udHJvbFxuICBjb25zdCByZXN0cmljdGVkOiBBY2Nlc3NDb250cm9sID0geyAuLi5hY2Nlc3NDb250cm9sIH07XG4gIFxuICAvLyBJZiB0aGUgdXNlciBjYW4ndCBtYWtlIHJlc291cmNlcyBwdWJsaWMsIHJlc3RyaWN0IHZpc2liaWxpdHlcbiAgaWYgKCFjYW5NYWtlUHVibGljICYmIHJlc3RyaWN0ZWQudmlzaWJpbGl0eSA9PT0gJ3B1YmxpYycpIHtcbiAgICByZXN0cmljdGVkLnZpc2liaWxpdHkgPSAnb3JnYW5pemF0aW9uJztcbiAgfVxuICBcbiAgLy8gRW5zdXJlIHRoZSB1c2VyIGlzIGFsd2F5cyBpbmNsdWRlZCBpbiBhbGxvd2VkIHVzZXJzXG4gIGlmIChyZXN0cmljdGVkLnZpc2liaWxpdHkgPT09ICd1c2VyJykge1xuICAgIHJlc3RyaWN0ZWQuYWxsb3dlZFVzZXJzID0gcmVzdHJpY3RlZC5hbGxvd2VkVXNlcnMgfHwgW107XG4gICAgaWYgKCFyZXN0cmljdGVkLmFsbG93ZWRVc2Vycy5pbmNsdWRlcyh1c2VySWQpKSB7XG4gICAgICByZXN0cmljdGVkLmFsbG93ZWRVc2Vycy5wdXNoKHVzZXJJZCk7XG4gICAgfVxuICB9XG4gIFxuICByZXR1cm4gcmVzdHJpY3RlZDtcbn07Il19