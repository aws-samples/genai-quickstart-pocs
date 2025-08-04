/**
 * User profile management service
 */
import { User, UserProfile, UserPreferences, UserUpdateRequest } from '../models/user';
export declare class UserProfileService {
    /**
     * Get user profile by ID
     */
    getUserProfile(userId: string): Promise<User | null>;
    /**
     * Update user profile
     */
    updateProfile(userId: string, profileData: Partial<UserProfile>): Promise<User>;
    /**
     * Update user preferences
     */
    updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<User>;
    /**
     * Update both profile and preferences
     */
    updateUserData(userId: string, updateData: UserUpdateRequest): Promise<User>;
    /**
     * Get user preferences
     */
    getUserPreferences(userId: string): Promise<UserPreferences | null>;
    /**
     * Validate profile data
     */
    validateProfileData(profileData: Partial<UserProfile>): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Validate preferences data
     */
    validatePreferencesData(preferences: Partial<UserPreferences>): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Get default user preferences
     */
    getDefaultPreferences(): UserPreferences;
    /**
     * Reset user preferences to default
     */
    resetPreferences(userId: string): Promise<User>;
}
export declare const userProfileService: UserProfileService;
