/**
 * Tests for User model and related types
 */

import {
  User,
  UserProfile,
  UserPreferences,
  UserRegistrationRequest,
  UserLoginRequest,
  UserUpdateRequest,
  PasswordChangeRequest,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
  RefreshTokenRequest,
  UserLoginResponse,
  NotificationSettings,
  DEFAULT_USER_PREFERENCES,
  DEFAULT_USER_PROFILE,
  PERMISSIONS,
  ROLE_PERMISSIONS
} from '../user';

describe('User Model', () => {
  describe('User interface', () => {
    it('should create a valid user object', () => {
      const user: User = {
        id: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-456',
        role: 'analyst',
        permissions: ['user:read', 'idea:read'],
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          title: 'Senior Analyst',
          department: 'Research',
          phoneNumber: '+1-555-0123',
          timezone: 'America/New_York',
          language: 'en'
        },
        preferences: {
          investmentHorizon: 'medium',
          riskTolerance: 'moderate',
          preferredSectors: ['technology'],
          preferredAssetClasses: ['stocks'],
          excludedInvestments: [],
          notificationSettings: {
            email: true,
            push: false,
            frequency: 'daily',
            types: {
              ideaGeneration: true,
              marketAlerts: true,
              complianceIssues: true,
              systemUpdates: false
            }
          }
        },
        isActive: true,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(user).toBeDefined();
      expect(user.id).toBe('user-123');
      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe('analyst');
    });
  });

  describe('UserRegistrationRequest interface', () => {
    const validRequest: UserRegistrationRequest = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
      organizationId: 'org-123',
      role: 'analyst'
    };

    it('should create a valid registration request', () => {
      expect(validRequest.email).toBe('test@example.com');
      expect(validRequest.role).toBe('analyst');
      expect(validRequest.firstName).toBe('John');
      expect(validRequest.lastName).toBe('Doe');
    });

    it('should support optional fields', () => {
      const requestWithOptionals: UserRegistrationRequest = {
        ...validRequest,
        title: 'Senior Analyst',
        department: 'Research',
        phoneNumber: '+1-555-0123',
        timezone: 'America/New_York',
        language: 'en'
      };

      expect(requestWithOptionals.title).toBe('Senior Analyst');
      expect(requestWithOptionals.department).toBe('Research');
      expect(requestWithOptionals.phoneNumber).toBe('+1-555-0123');
    });
  });

  describe('UserLoginRequest interface', () => {
    const validRequest: UserLoginRequest = {
      email: 'test@example.com',
      password: 'Password123!'
    };

    it('should create a valid login request', () => {
      expect(validRequest.email).toBe('test@example.com');
      expect(validRequest.password).toBe('Password123!');
    });

    it('should have required fields', () => {
      expect(validRequest).toHaveProperty('email');
      expect(validRequest).toHaveProperty('password');
    });
  });

  describe('NotificationSettings interface', () => {
    it('should create valid notification settings', () => {
      const settings: NotificationSettings = {
        email: true,
        push: false,
        frequency: 'daily',
        types: {
          ideaGeneration: true,
          marketAlerts: true,
          complianceIssues: true,
          systemUpdates: false
        }
      };

      expect(settings.email).toBe(true);
      expect(settings.push).toBe(false);
      expect(settings.frequency).toBe('daily');
      expect(settings.types.ideaGeneration).toBe(true);
    });

    it('should support different frequency options', () => {
      const immediateSettings: NotificationSettings = {
        email: true,
        push: true,
        frequency: 'immediate',
        types: {
          ideaGeneration: true,
          marketAlerts: true,
          complianceIssues: true,
          systemUpdates: true
        }
      };

      expect(immediateSettings.frequency).toBe('immediate');
    });
  });

  describe('ROLE_PERMISSIONS', () => {
    it('should return correct permissions for analyst role', () => {
      const permissions = ROLE_PERMISSIONS['analyst'];
      expect(permissions).toContain(PERMISSIONS.USER_READ);
      expect(permissions).toContain(PERMISSIONS.IDEA_READ);
      expect(permissions).toContain(PERMISSIONS.IDEA_WRITE);
      expect(permissions).not.toContain(PERMISSIONS.ADMIN_WRITE);
    });

    it('should return correct permissions for portfolio-manager role', () => {
      const permissions = ROLE_PERMISSIONS['portfolio-manager'];
      expect(permissions).toContain(PERMISSIONS.USER_READ);
      expect(permissions).toContain(PERMISSIONS.IDEA_READ);
      expect(permissions).toContain(PERMISSIONS.IDEA_WRITE);
      expect(permissions).toContain(PERMISSIONS.IDEA_DELETE);
    });

    it('should return correct permissions for administrator role', () => {
      const permissions = ROLE_PERMISSIONS['administrator'];
      expect(permissions).toContain(PERMISSIONS.ADMIN_WRITE);
      expect(permissions).toContain(PERMISSIONS.USER_WRITE);
      expect(permissions).toContain(PERMISSIONS.USER_DELETE);
    });

    it('should return correct permissions for compliance-officer role', () => {
      const permissions = ROLE_PERMISSIONS['compliance-officer'];
      expect(permissions).toContain(PERMISSIONS.COMPLIANCE_READ);
      expect(permissions).toContain(PERMISSIONS.COMPLIANCE_WRITE);
      expect(permissions).not.toContain(PERMISSIONS.IDEA_WRITE);
    });
  });

  describe('DEFAULT_USER_PREFERENCES', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_USER_PREFERENCES.investmentHorizon).toBe('medium');
      expect(DEFAULT_USER_PREFERENCES.riskTolerance).toBe('moderate');
      expect(DEFAULT_USER_PREFERENCES.preferredSectors).toEqual([]);
      expect(DEFAULT_USER_PREFERENCES.preferredAssetClasses).toEqual([]);
      expect(DEFAULT_USER_PREFERENCES.excludedInvestments).toEqual([]);
    });

    it('should have correct notification settings', () => {
      const notifications = DEFAULT_USER_PREFERENCES.notificationSettings;
      expect(notifications.email).toBe(true);
      expect(notifications.push).toBe(false);
      expect(notifications.frequency).toBe('daily');
      expect(notifications.types.ideaGeneration).toBe(true);
      expect(notifications.types.systemUpdates).toBe(false);
    });
  });

  describe('DEFAULT_USER_PROFILE', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_USER_PROFILE.timezone).toBe('UTC');
      expect(DEFAULT_USER_PROFILE.language).toBe('en');
    });
  });

  describe('PERMISSIONS constants', () => {
    it('should have all required permission constants', () => {
      expect(PERMISSIONS.USER_READ).toBe('user:read');
      expect(PERMISSIONS.USER_WRITE).toBe('user:write');
      expect(PERMISSIONS.IDEA_READ).toBe('idea:read');
      expect(PERMISSIONS.IDEA_WRITE).toBe('idea:write');
      expect(PERMISSIONS.ADMIN_WRITE).toBe('admin:write');
    });

    it('should have market data permissions', () => {
      expect(PERMISSIONS.MARKET_DATA_READ).toBe('market-data:read');
    });

    it('should have proprietary data permissions', () => {
      expect(PERMISSIONS.PROPRIETARY_DATA_READ).toBe('proprietary-data:read');
      expect(PERMISSIONS.PROPRIETARY_DATA_WRITE).toBe('proprietary-data:write');
      expect(PERMISSIONS.PROPRIETARY_DATA_DELETE).toBe('proprietary-data:delete');
    });
  });

  describe('UserUpdateRequest interface', () => {
    it('should support partial profile updates', () => {
      const updateRequest: UserUpdateRequest = {
        profile: {
          firstName: 'Updated Name',
          title: 'Senior Analyst'
        }
      };

      expect(updateRequest.profile?.firstName).toBe('Updated Name');
      expect(updateRequest.profile?.title).toBe('Senior Analyst');
    });

    it('should support partial preference updates', () => {
      const updateRequest: UserUpdateRequest = {
        preferences: {
          investmentHorizon: 'long',
          riskTolerance: 'aggressive'
        }
      };

      expect(updateRequest.preferences?.investmentHorizon).toBe('long');
      expect(updateRequest.preferences?.riskTolerance).toBe('aggressive');
    });

    it('should support both profile and preference updates', () => {
      const updateRequest: UserUpdateRequest = {
        profile: {
          firstName: 'Updated Name'
        },
        preferences: {
          investmentHorizon: 'short'
        }
      };

      expect(updateRequest.profile?.firstName).toBe('Updated Name');
      expect(updateRequest.preferences?.investmentHorizon).toBe('short');
    });
  });

  describe('Password-related interfaces', () => {
    it('should create valid password change request', () => {
      const request: PasswordChangeRequest = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword456!'
      };

      expect(request.currentPassword).toBe('OldPassword123!');
      expect(request.newPassword).toBe('NewPassword456!');
    });

    it('should create valid password reset request', () => {
      const request: PasswordResetRequest = {
        email: 'test@example.com'
      };

      expect(request.email).toBe('test@example.com');
    });

    it('should create valid password reset confirmation', () => {
      const request: PasswordResetConfirmRequest = {
        token: 'valid-reset-token',
        newPassword: 'NewPassword123!'
      };

      expect(request.token).toBe('valid-reset-token');
      expect(request.newPassword).toBe('NewPassword123!');
    });

    it('should create valid refresh token request', () => {
      const request: RefreshTokenRequest = {
        refreshToken: 'valid-refresh-token'
      };

      expect(request.refreshToken).toBe('valid-refresh-token');
    });
  });
});