"use strict";
/**
 * User profile management service
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.userProfileService = exports.UserProfileService = void 0;
const auth_service_1 = require("./auth-service");
class UserProfileService {
    /**
     * Get user profile by ID
     */
    async getUserProfile(userId) {
        return await auth_service_1.authService.getUserById(userId);
    }
    /**
     * Update user profile
     */
    async updateProfile(userId, profileData) {
        const updateRequest = {
            profile: profileData
        };
        return await auth_service_1.authService.updateUser(userId, updateRequest);
    }
    /**
     * Update user preferences
     */
    async updatePreferences(userId, preferences) {
        const updateRequest = {
            preferences: preferences
        };
        return await auth_service_1.authService.updateUser(userId, updateRequest);
    }
    /**
     * Update both profile and preferences
     */
    async updateUserData(userId, updateData) {
        return await auth_service_1.authService.updateUser(userId, updateData);
    }
    /**
     * Get user preferences
     */
    async getUserPreferences(userId) {
        const user = await auth_service_1.authService.getUserById(userId);
        return user ? user.preferences : null;
    }
    /**
     * Validate profile data
     */
    validateProfileData(profileData) {
        const errors = [];
        // Validate email format if provided
        if (profileData.firstName && profileData.firstName.trim().length === 0) {
            errors.push('First name cannot be empty');
        }
        if (profileData.lastName && profileData.lastName.trim().length === 0) {
            errors.push('Last name cannot be empty');
        }
        // Validate phone number format if provided
        if (profileData.phoneNumber) {
            const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
            if (!phoneRegex.test(profileData.phoneNumber)) {
                errors.push('Invalid phone number format');
            }
        }
        // Validate timezone if provided
        if (profileData.timezone) {
            try {
                Intl.DateTimeFormat(undefined, { timeZone: profileData.timezone });
            }
            catch (error) {
                errors.push('Invalid timezone');
            }
        }
        // Validate language code if provided
        if (profileData.language) {
            const validLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'];
            if (!validLanguages.includes(profileData.language)) {
                errors.push('Invalid language code');
            }
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    /**
     * Validate preferences data
     */
    validatePreferencesData(preferences) {
        const errors = [];
        // Validate investment horizon
        if (preferences.investmentHorizon) {
            const validHorizons = ['short', 'medium', 'long'];
            if (!validHorizons.includes(preferences.investmentHorizon)) {
                errors.push('Invalid investment horizon');
            }
        }
        // Validate risk tolerance
        if (preferences.riskTolerance) {
            const validTolerances = ['conservative', 'moderate', 'aggressive'];
            if (!validTolerances.includes(preferences.riskTolerance)) {
                errors.push('Invalid risk tolerance');
            }
        }
        // Validate arrays
        if (preferences.preferredSectors && !Array.isArray(preferences.preferredSectors)) {
            errors.push('Preferred sectors must be an array');
        }
        if (preferences.preferredAssetClasses && !Array.isArray(preferences.preferredAssetClasses)) {
            errors.push('Preferred asset classes must be an array');
        }
        if (preferences.excludedInvestments && !Array.isArray(preferences.excludedInvestments)) {
            errors.push('Excluded investments must be an array');
        }
        // Validate notification settings
        if (preferences.notificationSettings) {
            const { notificationSettings } = preferences;
            if (notificationSettings.frequency) {
                const validFrequencies = ['immediate', 'daily', 'weekly'];
                if (!validFrequencies.includes(notificationSettings.frequency)) {
                    errors.push('Invalid notification frequency');
                }
            }
            // Validate boolean fields
            const booleanFields = ['email', 'push'];
            booleanFields.forEach(field => {
                if (notificationSettings[field] !== undefined &&
                    typeof notificationSettings[field] !== 'boolean') {
                    errors.push(`${field} notification setting must be a boolean`);
                }
            });
            // Validate notification types
            if (notificationSettings.types) {
                const typeFields = ['ideaGeneration', 'marketAlerts', 'complianceIssues', 'systemUpdates'];
                typeFields.forEach(field => {
                    if (notificationSettings.types[field] !== undefined &&
                        typeof notificationSettings.types[field] !== 'boolean') {
                        errors.push(`${field} notification type must be a boolean`);
                    }
                });
            }
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    /**
     * Get default user preferences
     */
    getDefaultPreferences() {
        return {
            investmentHorizon: 'medium',
            riskTolerance: 'moderate',
            preferredSectors: [],
            preferredAssetClasses: [],
            excludedInvestments: [],
            notificationSettings: {
                email: true,
                push: false,
                frequency: 'daily',
                types: {
                    ideaGeneration: true,
                    marketAlerts: true,
                    complianceIssues: true,
                    systemUpdates: false,
                },
            },
        };
    }
    /**
     * Reset user preferences to default
     */
    async resetPreferences(userId) {
        const defaultPreferences = this.getDefaultPreferences();
        return await this.updatePreferences(userId, defaultPreferences);
    }
}
exports.UserProfileService = UserProfileService;
// Export singleton instance
exports.userProfileService = new UserProfileService();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlci1wcm9maWxlLXNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc2VydmljZXMvdXNlci1wcm9maWxlLXNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOzs7QUFHSCxpREFBNkM7QUFFN0MsTUFBYSxrQkFBa0I7SUFDN0I7O09BRUc7SUFDSCxLQUFLLENBQUMsY0FBYyxDQUFDLE1BQWM7UUFDakMsT0FBTyxNQUFNLDBCQUFXLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQy9DLENBQUM7SUFFRDs7T0FFRztJQUNILEtBQUssQ0FBQyxhQUFhLENBQUMsTUFBYyxFQUFFLFdBQWlDO1FBQ25FLE1BQU0sYUFBYSxHQUFzQjtZQUN2QyxPQUFPLEVBQUUsV0FBVztTQUNyQixDQUFDO1FBRUYsT0FBTyxNQUFNLDBCQUFXLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxhQUFhLENBQUMsQ0FBQztJQUM3RCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsaUJBQWlCLENBQUMsTUFBYyxFQUFFLFdBQXFDO1FBQzNFLE1BQU0sYUFBYSxHQUFzQjtZQUN2QyxXQUFXLEVBQUUsV0FBVztTQUN6QixDQUFDO1FBRUYsT0FBTyxNQUFNLDBCQUFXLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxhQUFhLENBQUMsQ0FBQztJQUM3RCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsY0FBYyxDQUFDLE1BQWMsRUFBRSxVQUE2QjtRQUNoRSxPQUFPLE1BQU0sMEJBQVcsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQzFELENBQUM7SUFFRDs7T0FFRztJQUNILEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxNQUFjO1FBQ3JDLE1BQU0sSUFBSSxHQUFHLE1BQU0sMEJBQVcsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbkQsT0FBTyxJQUFJLENBQUMs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LE9BQU8sTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxFQUFFLGtCQUFrQixDQUFDLENBQUM7SUFDbEUsQ0FBQztDQUNGO0FBbk1ELGdEQW1NQztBQUVELDRCQUE0QjtBQUNmLFFBQUEsa0JBQWtCLEdBQUcsSUFBSSxrQkFBa0IsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBVc2VyIHByb2ZpbGUgbWFuYWdlbWVudCBzZXJ2aWNlXG4gKi9cblxuaW1wb3J0IHsgVXNlciwgVXNlclByb2ZpbGUsIFVzZXJQcmVmZXJlbmNlcywgVXNlclVwZGF0ZVJlcXVlc3QgfSBmcm9tICcuLi9tb2RlbHMvdXNlcic7XG5pbXBvcnQgeyBhdXRoU2VydmljZSB9IGZyb20gJy4vYXV0aC1zZXJ2aWNlJztcblxuZXhwb3J0IGNsYXNzIFVzZXJQcm9maWxlU2VydmljZSB7XG4gIC8qKlxuICAgKiBHZXQgdXNlciBwcm9maWxlIGJ5IElEXG4gICAqL1xuICBhc3luYyBnZXRVc2VyUHJvZmlsZSh1c2VySWQ6IHN0cmluZyk6IFByb21pc2U8VXNlciB8IG51bGw+IHtcbiAgICByZXR1cm4gYXdhaXQgYXV0aFNlcnZpY2UuZ2V0VXNlckJ5SWQodXNlcklkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdXNlciBwcm9maWxlXG4gICAqL1xuICBhc3luYyB1cGRhdGVQcm9maWxlKHVzZXJJZDogc3RyaW5nLCBwcm9maWxlRGF0YTogUGFydGlhbDxVc2VyUHJvZmlsZT4pOiBQcm9taXNlPFVzZXI+IHtcbiAgICBjb25zdCB1cGRhdGVSZXF1ZXN0OiBVc2VyVXBkYXRlUmVxdWVzdCA9IHtcbiAgICAgIHByb2ZpbGU6IHByb2ZpbGVEYXRhXG4gICAgfTtcbiAgICBcbiAgICByZXR1cm4gYXdhaXQgYXV0aFNlcnZpY2UudXBkYXRlVXNlcih1c2VySWQsIHVwZGF0ZVJlcXVlc3QpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB1c2VyIHByZWZlcmVuY2VzXG4gICAqL1xuICBhc3luYyB1cGRhdGVQcmVmZXJlbmNlcyh1c2VySWQ6IHN0cmluZywgcHJlZmVyZW5jZXM6IFBhcnRpYWw8VXNlclByZWZlcmVuY2VzPik6IFByb21pc2U8VXNlcj4ge1xuICAgIGNvbnN0IHVwZGF0ZVJlcXVlc3Q6IFVzZXJVcGRhdGVSZXF1ZXN0ID0ge1xuICAgICAgcHJlZmVyZW5jZXM6IHByZWZlcmVuY2VzXG4gICAgfTtcbiAgICBcbiAgICByZXR1cm4gYXdhaXQgYXV0aFNlcnZpY2UudXBkYXRlVXNlcih1c2VySWQsIHVwZGF0ZVJlcXVlc3QpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBib3RoIHByb2ZpbGUgYW5kIHByZWZlcmVuY2VzXG4gICAqL1xuICBhc3luYyB1cGRhdGVVc2VyRGF0YSh1c2VySWQ6IHN0cmluZywgdXBkYXRlRGF0YTogVXNlclVwZGF0ZVJlcXVlc3QpOiBQcm9taXNlPFVzZXI+IHtcbiAgICByZXR1cm4gYXdhaXQgYXV0aFNlcnZpY2UudXBkYXRlVXNlcih1c2VySWQsIHVwZGF0ZURhdGEpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB1c2VyIHByZWZlcmVuY2VzXG4gICAqL1xuICBhc3luYyBnZXRVc2VyUHJlZmVyZW5jZXModXNlcklkOiBzdHJpbmcpOiBQcm9taXNlPFVzZXJQcmVmZXJlbmNlcyB8IG51bGw+IHtcbiAgICBjb25zdCB1c2VyID0gYXdhaXQgYXV0aFNlcnZpY2UuZ2V0VXNlckJ5SWQodXNlcklkKTtcbiAgICByZXR1cm4gdXNlciA/IHVzZXIucHJlZmVyZW5jZXMgOiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlIHByb2ZpbGUgZGF0YVxuICAgKi9cbiAgdmFsaWRhdGVQcm9maWxlRGF0YShwcm9maWxlRGF0YTogUGFydGlhbDxVc2VyUHJvZmlsZT4pOiB7IHZhbGlkOiBib29sZWFuOyBlcnJvcnM6IHN0cmluZ1tdIH0ge1xuICAgIGNvbnN0IGVycm9yczogc3RyaW5nW10gPSBbXTtcblxuICAgIC8vIFZhbGlkYXRlIGVtYWlsIGZvcm1hdCBpZiBwcm92aWRlZFxuICAgIGlmIChwcm9maWxlRGF0YS5maXJzdE5hbWUgJiYgcHJvZmlsZURhdGEuZmlyc3ROYW1lLnRyaW0oKS5sZW5ndGggPT09IDApIHtcbiAgICAgIGVycm9ycy5wdXNoKCdGaXJzdCBuYW1lIGNhbm5vdCBiZSBlbXB0eScpO1xuICAgIH1cblxuICAgIGlmIChwcm9maWxlRGF0YS5sYXN0TmFtZSAmJiBwcm9maWxlRGF0YS5sYXN0TmFtZS50cmltKCkubGVuZ3RoID09PSAwKSB7XG4gICAgICBlcnJvcnMucHVzaCgnTGFzdCBuYW1lIGNhbm5vdCBiZSBlbXB0eScpO1xuICAgIH1cblxuICAgIC8vIFZhbGlkYXRlIHBob25lIG51bWJlciBmb3JtYXQgaWYgcHJvdmlkZWRcbiAgICBpZiAocHJvZmlsZURhdGEucGhvbmVOdW1iZXIpIHtcbiAgICAgIGNvbnN0IHBob25lUmVnZXggPSAvXlxcKz9bXFxkXFxzXFwtXFwoXFwpXSskLztcbiAgICAgIGlmICghcGhvbmVSZWdleC50ZXN0KHByb2ZpbGVEYXRhLnBob25lTnVtYmVyKSkge1xuICAgICAgICBlcnJvcnMucHVzaCgnSW52YWxpZCBwaG9uZSBudW1iZXIgZm9ybWF0Jyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVmFsaWRhdGUgdGltZXpvbmUgaWYgcHJvdmlkZWRcbiAgICBpZiAocHJvZmlsZURhdGEudGltZXpvbmUpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIEludGwuRGF0ZVRpbWVGb3JtYXQodW5kZWZpbmVkLCB7IHRpbWVab25lOiBwcm9maWxlRGF0YS50aW1lem9uZSB9KTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKCdJbnZhbGlkIHRpbWV6b25lJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVmFsaWRhdGUgbGFuZ3VhZ2UgY29kZSBpZiBwcm92aWRlZFxuICAgIGlmIChwcm9maWxlRGF0YS5sYW5ndWFnZSkge1xuICAgICAgY29uc3QgdmFsaWRMYW5ndWFnZXMgPSBbJ2VuJywgJ2VzJywgJ2ZyJywgJ2RlJywgJ2l0JywgJ3B0JywgJ2phJywgJ2tvJywgJ3poJ107XG4gICAgICBpZiAoIXZhbGlkTGFuZ3VhZ2VzLmluY2x1ZGVzKHByb2ZpbGVEYXRhLmxhbmd1YWdlKSkge1xuICAgICAgICBlcnJvcnMucHVzaCgnSW52YWxpZCBsYW5ndWFnZSBjb2RlJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHZhbGlkOiBlcnJvcnMubGVuZ3RoID09PSAwLFxuICAgICAgZXJyb3JzXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSBwcmVmZXJlbmNlcyBkYXRhXG4gICAqL1xuICB2YWxpZGF0ZVByZWZlcmVuY2VzRGF0YShwcmVmZXJlbmNlczogUGFydGlhbDxVc2VyUHJlZmVyZW5jZXM+KTogeyB2YWxpZDogYm9vbGVhbjsgZXJyb3JzOiBzdHJpbmdbXSB9IHtcbiAgICBjb25zdCBlcnJvcnM6IHN0cmluZ1tdID0gW107XG5cbiAgICAvLyBWYWxpZGF0ZSBpbnZlc3RtZW50IGhvcml6b25cbiAgICBpZiAocHJlZmVyZW5jZXMuaW52ZXN0bWVudEhvcml6b24pIHtcbiAgICAgIGNvbnN0IHZhbGlkSG9yaXpvbnMgPSBbJ3Nob3J0JywgJ21lZGl1bScsICdsb25nJ107XG4gICAgICBpZiAoIXZhbGlkSG9yaXpvbnMuaW5jbHVkZXMocHJlZmVyZW5jZXMuaW52ZXN0bWVudEhvcml6b24pKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKCdJbnZhbGlkIGludmVzdG1lbnQgaG9yaXpvbicpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFZhbGlkYXRlIHJpc2sgdG9sZXJhbmNlXG4gICAgaWYgKHByZWZlcmVuY2VzLnJpc2tUb2xlcmFuY2UpIHtcbiAgICAgIGNvbnN0IHZhbGlkVG9sZXJhbmNlcyA9IFsnY29uc2VydmF0aXZlJywgJ21vZGVyYXRlJywgJ2FnZ3Jlc3NpdmUnXTtcbiAgICAgIGlmICghdmFsaWRUb2xlcmFuY2VzLmluY2x1ZGVzKHByZWZlcmVuY2VzLnJpc2tUb2xlcmFuY2UpKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKCdJbnZhbGlkIHJpc2sgdG9sZXJhbmNlJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVmFsaWRhdGUgYXJyYXlzXG4gICAgaWYgKHByZWZlcmVuY2VzLnByZWZlcnJlZFNlY3RvcnMgJiYgIUFycmF5LmlzQXJyYXkocHJlZmVyZW5jZXMucHJlZmVycmVkU2VjdG9ycykpIHtcbiAgICAgIGVycm9ycy5wdXNoKCdQcmVmZXJyZWQgc2VjdG9ycyBtdXN0IGJlIGFuIGFycmF5Jyk7XG4gICAgfVxuXG4gICAgaWYgKHByZWZlcmVuY2VzLnByZWZlcnJlZEFzc2V0Q2xhc3NlcyAmJiAhQXJyYXkuaXNBcnJheShwcmVmZXJlbmNlcy5wcmVmZXJyZWRBc3NldENsYXNzZXMpKSB7XG4gICAgICBlcnJvcnMucHVzaCgnUHJlZmVycmVkIGFzc2V0IGNsYXNzZXMgbXVzdCBiZSBhbiBhcnJheScpO1xuICAgIH1cblxuICAgIGlmIChwcmVmZXJlbmNlcy5leGNsdWRlZEludmVzdG1lbnRzICYmICFBcnJheS5pc0FycmF5KHByZWZlcmVuY2VzLmV4Y2x1ZGVkSW52ZXN0bWVudHMpKSB7XG4gICAgICBlcnJvcnMucHVzaCgnRXhjbHVkZWQgaW52ZXN0bWVudHMgbXVzdCBiZSBhbiBhcnJheScpO1xuICAgIH1cblxuICAgIC8vIFZhbGlkYXRlIG5vdGlmaWNhdGlvbiBzZXR0aW5nc1xuICAgIGlmIChwcmVmZXJlbmNlcy5ub3RpZmljYXRpb25TZXR0aW5ncykge1xuICAgICAgY29uc3QgeyBub3RpZmljYXRpb25TZXR0aW5ncyB9ID0gcHJlZmVyZW5jZXM7XG4gICAgICBcbiAgICAgIGlmIChub3RpZmljYXRpb25TZXR0aW5ncy5mcmVxdWVuY3kpIHtcbiAgICAgICAgY29uc3QgdmFsaWRGcmVxdWVuY2llcyA9IFsnaW1tZWRpYXRlJywgJ2RhaWx5JywgJ3dlZWtseSddO1xuICAgICAgICBpZiAoIXZhbGlkRnJlcXVlbmNpZXMuaW5jbHVkZXMobm90aWZpY2F0aW9uU2V0dGluZ3MuZnJlcXVlbmN5KSkge1xuICAgICAgICAgIGVycm9ycy5wdXNoKCdJbnZhbGlkIG5vdGlmaWNhdGlvbiBmcmVxdWVuY3knKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBWYWxpZGF0ZSBib29sZWFuIGZpZWxkc1xuICAgICAgY29uc3QgYm9vbGVhbkZpZWxkcyA9IFsnZW1haWwnLCAncHVzaCddO1xuICAgICAgYm9vbGVhbkZpZWxkcy5mb3JFYWNoKGZpZWxkID0+IHtcbiAgICAgICAgaWYgKG5vdGlmaWNhdGlvblNldHRpbmdzW2ZpZWxkIGFzIGtleW9mIHR5cGVvZiBub3RpZmljYXRpb25TZXR0aW5nc10gIT09IHVuZGVmaW5lZCAmJiBcbiAgICAgICAgICAgIHR5cGVvZiBub3RpZmljYXRpb25TZXR0aW5nc1tmaWVsZCBhcyBrZXlvZiB0eXBlb2Ygbm90aWZpY2F0aW9uU2V0dGluZ3NdICE9PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICBlcnJvcnMucHVzaChgJHtmaWVsZH0gbm90aWZpY2F0aW9uIHNldHRpbmcgbXVzdCBiZSBhIGJvb2xlYW5gKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vIFZhbGlkYXRlIG5vdGlmaWNhdGlvbiB0eXBlc1xuICAgICAgaWYgKG5vdGlmaWNhdGlvblNldHRpbmdzLnR5cGVzKSB7XG4gICAgICAgIGNvbnN0IHR5cGVGaWVsZHMgPSBbJ2lkZWFHZW5lcmF0aW9uJywgJ21hcmtldEFsZXJ0cycsICdjb21wbGlhbmNlSXNzdWVzJywgJ3N5c3RlbVVwZGF0ZXMnXTtcbiAgICAgICAgdHlwZUZpZWxkcy5mb3JFYWNoKGZpZWxkID0+IHtcbiAgICAgICAgICBpZiAobm90aWZpY2F0aW9uU2V0dGluZ3MudHlwZXNbZmllbGQgYXMga2V5b2YgdHlwZW9mIG5vdGlmaWNhdGlvblNldHRpbmdzLnR5cGVzXSAhPT0gdW5kZWZpbmVkICYmIFxuICAgICAgICAgICAgICB0eXBlb2Ygbm90aWZpY2F0aW9uU2V0dGluZ3MudHlwZXNbZmllbGQgYXMga2V5b2YgdHlwZW9mIG5vdGlmaWNhdGlvblNldHRpbmdzLnR5cGVzXSAhPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChgJHtmaWVsZH0gbm90aWZpY2F0aW9uIHR5cGUgbXVzdCBiZSBhIGJvb2xlYW5gKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB2YWxpZDogZXJyb3JzLmxlbmd0aCA9PT0gMCxcbiAgICAgIGVycm9yc1xuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogR2V0IGRlZmF1bHQgdXNlciBwcmVmZXJlbmNlc1xuICAgKi9cbiAgZ2V0RGVmYXVsdFByZWZlcmVuY2VzKCk6IFVzZXJQcmVmZXJlbmNlcyB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGludmVzdG1lbnRIb3Jpem9uOiAnbWVkaXVtJyxcbiAgICAgIHJpc2tUb2xlcmFuY2U6ICdtb2RlcmF0ZScsXG4gICAgICBwcmVmZXJyZWRTZWN0b3JzOiBbXSxcbiAgICAgIHByZWZlcnJlZEFzc2V0Q2xhc3NlczogW10sXG4gICAgICBleGNsdWRlZEludmVzdG1lbnRzOiBbXSxcbiAgICAgIG5vdGlmaWNhdGlvblNldHRpbmdzOiB7XG4gICAgICAgIGVtYWlsOiB0cnVlLFxuICAgICAgICBwdXNoOiBmYWxzZSxcbiAgICAgICAgZnJlcXVlbmN5OiAnZGFpbHknLFxuICAgICAgICB0eXBlczoge1xuICAgICAgICAgIGlkZWFHZW5lcmF0aW9uOiB0cnVlLFxuICAgICAgICAgIG1hcmtldEFsZXJ0czogdHJ1ZSxcbiAgICAgICAgICBjb21wbGlhbmNlSXNzdWVzOiB0cnVlLFxuICAgICAgICAgIHN5c3RlbVVwZGF0ZXM6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0IHVzZXIgcHJlZmVyZW5jZXMgdG8gZGVmYXVsdFxuICAgKi9cbiAgYXN5bmMgcmVzZXRQcmVmZXJlbmNlcyh1c2VySWQ6IHN0cmluZyk6IFByb21pc2U8VXNlcj4ge1xuICAgIGNvbnN0IGRlZmF1bHRQcmVmZXJlbmNlcyA9IHRoaXMuZ2V0RGVmYXVsdFByZWZlcmVuY2VzKCk7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMudXBkYXRlUHJlZmVyZW5jZXModXNlcklkLCBkZWZhdWx0UHJlZmVyZW5jZXMpO1xuICB9XG59XG5cbi8vIEV4cG9ydCBzaW5nbGV0b24gaW5zdGFuY2VcbmV4cG9ydCBjb25zdCB1c2VyUHJvZmlsZVNlcnZpY2UgPSBuZXcgVXNlclByb2ZpbGVTZXJ2aWNlKCk7Il19