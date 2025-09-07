/**
 * User models and interfaces
 */
export interface User {
    id: string;
    email: string;
    organizationId: string;
    role: 'analyst' | 'portfolio-manager' | 'compliance-officer' | 'administrator';
    permissions: string[];
    preferences: UserPreferences;
    profile: UserProfile;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
    isActive: boolean;
}
export interface UserProfile {
    firstName: string;
    lastName: string;
    title?: string;
    department?: string;
    phoneNumber?: string;
    timezone: string;
    language: string;
}
export interface UserPreferences {
    investmentHorizon: 'short' | 'medium' | 'long';
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    preferredSectors: string[];
    preferredAssetClasses: string[];
    excludedInvestments: string[];
    notificationSettings: NotificationSettings;
}
export interface NotificationSettings {
    email: boolean;
    push: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
    types: {
        ideaGeneration: boolean;
        marketAlerts: boolean;
        complianceIssues: boolean;
        systemUpdates: boolean;
    };
}
export interface UserRegistrationRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationId: string;
    role: 'analyst' | 'portfolio-manager' | 'compliance-officer' | 'administrator';
    title?: string;
    department?: string;
    phoneNumber?: string;
    timezone?: string;
    language?: string;
}
export interface UserLoginRequest {
    email: string;
    password: string;
}
export interface UserLoginResponse {
    user: Omit<User, 'passwordHash'>;
    token: string;
    refreshToken: string;
    expiresIn: number;
}
export interface UserUpdateRequest {
    profile?: Partial<UserProfile>;
    preferences?: Partial<UserPreferences>;
}
export interface PasswordChangeRequest {
    currentPassword: string;
    newPassword: string;
}
export interface PasswordResetRequest {
    email: string;
}
export interface PasswordResetConfirmRequest {
    token: string;
    newPassword: string;
}
export interface RefreshTokenRequest {
    refreshToken: string;
}
export interface UserWithPassword extends User {
    passwordHash: string;
    refreshTokens: string[];
    passwordResetToken?: string;
    passwordResetExpires?: Date;
}
export declare const DEFAULT_USER_PREFERENCES: UserPreferences;
export declare const DEFAULT_USER_PROFILE: Partial<UserProfile>;
export declare const PERMISSIONS: {
    readonly USER_READ: "user:read";
    readonly USER_WRITE: "user:write";
    readonly USER_DELETE: "user:delete";
    readonly IDEA_READ: "idea:read";
    readonly IDEA_WRITE: "idea:write";
    readonly IDEA_DELETE: "idea:delete";
    readonly MARKET_DATA_READ: "market-data:read";
    readonly PROPRIETARY_DATA_READ: "proprietary-data:read";
    readonly PROPRIETARY_DATA_WRITE: "proprietary-data:write";
    readonly PROPRIETARY_DATA_DELETE: "proprietary-data:delete";
    readonly COMPLIANCE_READ: "compliance:read";
    readonly COMPLIANCE_WRITE: "compliance:write";
    readonly ADMIN_READ: "admin:read";
    readonly ADMIN_WRITE: "admin:write";
};
export declare const ROLE_PERMISSIONS: Record<User['role'], string[]>;
