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

// Internal user model with password hash
export interface UserWithPassword extends User {
  passwordHash: string;
  refreshTokens: string[];
  passwordResetToken?: string;
  passwordResetExpires?: Date;
}

// Default user preferences
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
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

// Default user profile
export const DEFAULT_USER_PROFILE: Partial<UserProfile> = {
  timezone: 'UTC',
  language: 'en',
};

// Permission constants
export const PERMISSIONS = {
  // User management
  USER_READ: 'user:read',
  USER_WRITE: 'user:write',
  USER_DELETE: 'user:delete',
  
  // Investment ideas
  IDEA_READ: 'idea:read',
  IDEA_WRITE: 'idea:write',
  IDEA_DELETE: 'idea:delete',
  
  // Market data
  MARKET_DATA_READ: 'market-data:read',
  
  // Proprietary data
  PROPRIETARY_DATA_READ: 'proprietary-data:read',
  PROPRIETARY_DATA_WRITE: 'proprietary-data:write',
  PROPRIETARY_DATA_DELETE: 'proprietary-data:delete',
  
  // Compliance
  COMPLIANCE_READ: 'compliance:read',
  COMPLIANCE_WRITE: 'compliance:write',
  
  // Administration
  ADMIN_READ: 'admin:read',
  ADMIN_WRITE: 'admin:write',
} as const;

// Role-based permissions
export const ROLE_PERMISSIONS: Record<User['role'], string[]> = {
  analyst: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.IDEA_READ,
    PERMISSIONS.IDEA_WRITE,
    PERMISSIONS.MARKET_DATA_READ,
    PERMISSIONS.PROPRIETARY_DATA_READ,
    PERMISSIONS.COMPLIANCE_READ,
  ],
  'portfolio-manager': [
    PERMISSIONS.USER_READ,
    PERMISSIONS.IDEA_READ,
    PERMISSIONS.IDEA_WRITE,
    PERMISSIONS.IDEA_DELETE,
    PERMISSIONS.MARKET_DATA_READ,
    PERMISSIONS.PROPRIETARY_DATA_READ,
    PERMISSIONS.PROPRIETARY_DATA_WRITE,
    PERMISSIONS.COMPLIANCE_READ,
  ],
  'compliance-officer': [
    PERMISSIONS.USER_READ,
    PERMISSIONS.IDEA_READ,
    PERMISSIONS.MARKET_DATA_READ,
    PERMISSIONS.PROPRIETARY_DATA_READ,
    PERMISSIONS.COMPLIANCE_READ,
    PERMISSIONS.COMPLIANCE_WRITE,
  ],
  administrator: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_WRITE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.IDEA_READ,
    PERMISSIONS.IDEA_WRITE,
    PERMISSIONS.IDEA_DELETE,
    PERMISSIONS.MARKET_DATA_READ,
    PERMISSIONS.PROPRIETARY_DATA_READ,
    PERMISSIONS.PROPRIETARY_DATA_WRITE,
    PERMISSIONS.PROPRIETARY_DATA_DELETE,
    PERMISSIONS.COMPLIANCE_READ,
    PERMISSIONS.COMPLIANCE_WRITE,
    PERMISSIONS.ADMIN_READ,
    PERMISSIONS.ADMIN_WRITE,
  ],
};