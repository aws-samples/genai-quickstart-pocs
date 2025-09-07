/**
 * User profile management service
 */

import { User, UserProfile, UserPreferences, UserUpdateRequest } from '../models/user';
import { authService } from './auth-service';

export class UserProfileService {
  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<User | null> {
    return await authService.getUserById(userId);
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, profileData: Partial<UserProfile>): Promise<User> {
    const updateRequest: UserUpdateRequest = {
      profile: profileData
    };
    
    return await authService.updateUser(userId, updateRequest);
  }

  /**
   * Update user preferences
   */
  async updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<User> {
    const updateRequest: UserUpdateRequest = {
      preferences: preferences
    };
    
    return await authService.updateUser(userId, updateRequest);
  }

  /**
   * Update both profile and preferences
   */
  async updateUserData(userId: string, updateData: UserUpdateRequest): Promise<User> {
    return await authService.updateUser(userId, updateData);
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const user = await authService.getUserById(userId);
    return user ? user.preferences : null;
  }

  /**
   * Validate profile data
   */
  validateProfileData(profileData: Partial<UserProfile>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

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
      } catch (error) {
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
  validatePreferencesData(preferences: Partial<UserPreferences>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

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
        if (notificationSettings[field as keyof typeof notificationSettings] !== undefined && 
            typeof notificationSettings[field as keyof typeof notificationSettings] !== 'boolean') {
          errors.push(`${field} notification setting must be a boolean`);
        }
      });

      // Validate notification types
      if (notificationSettings.types) {
        const typeFields = ['ideaGeneration', 'marketAlerts', 'complianceIssues', 'systemUpdates'];
        typeFields.forEach(field => {
          if (notificationSettings.types[field as keyof typeof notificationSettings.types] !== undefined && 
              typeof notificationSettings.types[field as keyof typeof notificationSettings.types] !== 'boolean') {
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
  getDefaultPreferences(): UserPreferences {
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
  async resetPreferences(userId: string): Promise<User> {
    const defaultPreferences = this.getDefaultPreferences();
    return await this.updatePreferences(userId, defaultPreferences);
  }
}

// Export singleton instance
export const userProfileService = new UserProfileService();