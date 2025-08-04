/**
 * Tests for AuthService
 */

import { AuthService } from '../auth-service';
import {
  UserRegistrationRequest,
  UserLoginRequest,
  UserUpdateRequest,
  PasswordChangeRequest,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
  RefreshTokenRequest,
} from '../../models/user';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('registerUser', () => {
    const validRegistrationRequest: UserRegistrationRequest = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
      organizationId: 'org-123',
      role: 'analyst',
      title: 'Senior Analyst',
      department: 'Research',
      phoneNumber: '+1-555-0123',
      timezone: 'America/New_York',
      language: 'en',
    };

    it('should register a new user successfully', async () => {
      const result = await authService.registerUser(validRegistrationRequest);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresIn');

      expect(result.user.email).toBe(validRegistrationRequest.email.toLowerCase());
      expect(result.user.profile.firstName).toBe(validRegistrationRequest.firstName);
      expect(result.user.profile.lastName).toBe(validRegistrationRequest.lastName);
      expect(result.user.role).toBe(validRegistrationRequest.role);
      expect(result.user.organizationId).toBe(validRegistrationRequest.organizationId);
      expect(result.user.isActive).toBe(true);
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should throw error for duplicate email', async () => {
      await authService.registerUser(validRegistrationRequest);

      await expect(authService.registerUser(validRegistrationRequest))
        .rejects.toThrow('User with this email already exists');
    });

    it('should throw error for weak password', async () => {
      const weakPasswordRequest = {
        ...validRegistrationRequest,
        password: 'weak',
      };

      await expect(authService.registerUser(weakPasswordRequest))
        .rejects.toThrow('Password must be at least 8 characters long');
    });

    it('should throw error for password without uppercase', async () => {
      const noUppercaseRequest = {
        ...validRegistrationRequest,
        password: 'password123!',
      };

      await expect(authService.registerUser(noUppercaseRequest))
        .rejects.toThrow('Password must contain at least one uppercase letter');
    });

    it('should throw error for password without lowercase', async () => {
      const noLowercaseRequest = {
        ...validRegistrationRequest,
        password: 'PASSWORD123!',
      };

      await expect(authService.registerUser(noLowercaseRequest))
        .rejects.toThrow('Password must contain at least one lowercase letter');
    });

    it('should throw error for password without number', async () => {
      const noNumberRequest = {
        ...validRegistrationRequest,
        password: 'Password!',
      };

      await expect(authService.registerUser(noNumberRequest))
        .rejects.toThrow('Password must contain at least one number');
    });

    it('should throw error for password without special character', async () => {
      const noSpecialCharRequest = {
        ...validRegistrationRequest,
        password: 'Password123',
      };

      await expect(authService.registerUser(noSpecialCharRequest))
        .rejects.toThrow('Password must contain at least one special character');
    });

    it('should assign correct permissions based on role', async () => {
      const analystRequest = { ...validRegistrationRequest, role: 'analyst' as const };
      const analystResult = await authService.registerUser(analystRequest);
      
      expect(analystResult.user.permissions).toContain('user:read');
      expect(analystResult.user.permissions).toContain('idea:read');
      expect(analystResult.user.permissions).toContain('idea:write');
      expect(analystResult.user.permissions).not.toContain('admin:write');

      const adminRequest = { 
        ...validRegistrationRequest, 
        email: 'admin@example.com',
        role: 'administrator' as const 
      };
      const adminResult = await authService.registerUser(adminRequest);
      
      expect(adminResult.user.permissions).toContain('admin:write');
      expect(adminResult.user.permissions).toContain('user:write');
      expect(adminResult.user.permissions).toContain('user:delete');
    });
  });

  describe('loginUser', () => {
    const registrationRequest: UserRegistrationRequest = {
      email: 'login@example.com',
      password: 'Password123!',
      firstName: 'Jane',
      lastName: 'Smith',
      organizationId: 'org-456',
      role: 'portfolio-manager',
    };

    beforeEach(async () => {
      await authService.registerUser(registrationRequest);
    });

    it('should login user successfully', async () => {
      const loginRequest: UserLoginRequest = {
        email: registrationRequest.email,
        password: registrationRequest.password,
      };

      const result = await authService.loginUser(loginRequest);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresIn');

      expect(result.user.email).toBe(registrationRequest.email.toLowerCase());
      expect(result.user.lastLoginAt).toBeDefined();
    });

    it('should throw error for invalid email', async () => {
      const invalidEmailRequest: UserLoginRequest = {
        email: 'nonexistent@example.com',
        password: registrationRequest.password,
      };

      await expect(authService.loginUser(invalidEmailRequest))
        .rejects.toThrow('Invalid email or password');
    });

    it('should throw error for invalid password', async () => {
      const invalidPasswordRequest: UserLoginRequest = {
        email: registrationRequest.email,
        password: 'WrongPassword123!',
      };

      await expect(authService.loginUser(invalidPasswordRequest))
        .rejects.toThrow('Invalid email or password');
    });

    it('should be case insensitive for email', async () => {
      const uppercaseEmailRequest: UserLoginRequest = {
        email: registrationRequest.email.toUpperCase(),
        password: registrationRequest.password,
      };

      const result = await authService.loginUser(uppercaseEmailRequest);
      expect(result.user.email).toBe(registrationRequest.email.toLowerCase());
    });
  });

  describe('refreshToken', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const registrationRequest: UserRegistrationRequest = {
        email: 'refresh@example.com',
        password: 'Password123!',
        firstName: 'Bob',
        lastName: 'Johnson',
        organizationId: 'org-789',
        role: 'compliance-officer',
      };

      const result = await authService.registerUser(registrationRequest);
      refreshToken = result.refreshToken;
    });

    it('should refresh token successfully', async () => {
      const refreshRequest: RefreshTokenRequest = {
        refreshToken,
      };

      const result = await authService.refreshToken(refreshRequest);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresIn');

      // New refresh token should be different
      expect(result.refreshToken).not.toBe(refreshToken);
    });

    it('should throw error for invalid refresh token', async () => {
      const invalidRefreshRequest: RefreshTokenRequest = {
        refreshToken: 'invalid-token',
      };

      await expect(authService.refreshToken(invalidRefreshRequest))
        .rejects.toThrow('Invalid refresh token');
    });

    it('should invalidate old refresh token after use', async () => {
      const refreshRequest: RefreshTokenRequest = {
        refreshToken,
      };

      await authService.refreshToken(refreshRequest);

      // Try to use the old refresh token again
      await expect(authService.refreshToken(refreshRequest))
        .rejects.toThrow('Invalid refresh token');
    });
  });

  describe('updateUser', () => {
    let userId: string;

    beforeEach(async () => {
      const registrationRequest: UserRegistrationRequest = {
        email: 'update@example.com',
        password: 'Password123!',
        firstName: 'Alice',
        lastName: 'Wilson',
        organizationId: 'org-update',
        role: 'analyst',
      };

      const result = await authService.registerUser(registrationRequest);
      userId = result.user.id;
    });

    it('should update user profile successfully', async () => {
      const updateRequest: UserUpdateRequest = {
        profile: {
          firstName: 'Updated Alice',
          title: 'Senior Analyst',
          department: 'Updated Department',
        },
      };

      const result = await authService.updateUser(userId, updateRequest);

      expect(result.profile.firstName).toBe('Updated Alice');
      expect(result.profile.title).toBe('Senior Analyst');
      expect(result.profile.department).toBe('Updated Department');
      expect(result.profile.lastName).toBe('Wilson'); // Should remain unchanged
    });

    it('should update user preferences successfully', async () => {
      const updateRequest: UserUpdateRequest = {
        preferences: {
          investmentHorizon: 'long',
          riskTolerance: 'aggressive',
          preferredSectors: ['technology', 'healthcare'],
        },
      };

      const result = await authService.updateUser(userId, updateRequest);

      expect(result.preferences.investmentHorizon).toBe('long');
      expect(result.preferences.riskTolerance).toBe('aggressive');
      expect(result.preferences.preferredSectors).toEqual(['technology', 'healthcare']);
    });

    it('should throw error for non-existent user', async () => {
      const updateRequest: UserUpdateRequest = {
        profile: {
          firstName: 'Updated Name',
        },
      };

      await expect(authService.updateUser('non-existent-id', updateRequest))
        .rejects.toThrow('User not found');
    });
  });

  describe('changePassword', () => {
    let userId: string;
    const originalPassword = 'Password123!';

    beforeEach(async () => {
      const registrationRequest: UserRegistrationRequest = {
        email: 'password@example.com',
        password: originalPassword,
        firstName: 'Password',
        lastName: 'Tester',
        organizationId: 'org-password',
        role: 'analyst',
      };

      const result = await authService.registerUser(registrationRequest);
      userId = result.user.id;
    });

    it('should change password successfully', async () => {
      const changeRequest: PasswordChangeRequest = {
        currentPassword: originalPassword,
        newPassword: 'NewPassword456!',
      };

      await authService.changePassword(userId, changeRequest);

      // Try to login with new password
      const loginRequest: UserLoginRequest = {
        email: 'password@example.com',
        password: 'NewPassword456!',
      };

      const loginResult = await authService.loginUser(loginRequest);
      expect(loginResult.user.id).toBe(userId);
    });

    it('should throw error for incorrect current password', async () => {
      const changeRequest: PasswordChangeRequest = {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewPassword456!',
      };

      await expect(authService.changePassword(userId, changeRequest))
        .rejects.toThrow('Current password is incorrect');
    });

    it('should throw error for weak new password', async () => {
      const changeRequest: PasswordChangeRequest = {
        currentPassword: originalPassword,
        newPassword: 'weak',
      };

      await expect(authService.changePassword(userId, changeRequest))
        .rejects.toThrow('Password must be at least 8 characters long');
    });

    it('should throw error for non-existent user', async () => {
      const changeRequest: PasswordChangeRequest = {
        currentPassword: originalPassword,
        newPassword: 'NewPassword456!',
      };

      await expect(authService.changePassword('non-existent-id', changeRequest))
        .rejects.toThrow('User not found');
    });
  });

  describe('passwordReset', () => {
    const userEmail = 'reset@example.com';

    beforeEach(async () => {
      const registrationRequest: UserRegistrationRequest = {
        email: userEmail,
        password: 'Password123!',
        firstName: 'Reset',
        lastName: 'User',
        organizationId: 'org-reset',
        role: 'analyst',
      };

      await authService.registerUser(registrationRequest);
    });

    it('should request password reset without revealing user existence', async () => {
      const resetRequest: PasswordResetRequest = {
        email: userEmail,
      };

      // Should not throw error even for valid email
      await expect(authService.requestPasswordReset(resetRequest))
        .resolves.not.toThrow();

      // Should not throw error for invalid email either
      const invalidResetRequest: PasswordResetRequest = {
        email: 'nonexistent@example.com',
      };

      await expect(authService.requestPasswordReset(invalidResetRequest))
        .resolves.not.toThrow();
    });

    it('should throw error for invalid reset token', async () => {
      const confirmRequest: PasswordResetConfirmRequest = {
        token: 'invalid-token',
        newPassword: 'NewPassword456!',
      };

      await expect(authService.confirmPasswordReset(confirmRequest))
        .rejects.toThrow('Invalid or expired reset token');
    });
  });

  describe('verifyToken', () => {
    let token: string;

    beforeEach(async () => {
      const registrationRequest: UserRegistrationRequest = {
        email: 'verify@example.com',
        password: 'Password123!',
        firstName: 'Verify',
        lastName: 'User',
        organizationId: 'org-verify',
        role: 'administrator',
      };

      const result = await authService.registerUser(registrationRequest);
      token = result.token;
    });

    it('should verify valid token successfully', () => {
      const decoded = authService.verifyToken(token);

      expect(decoded).toHaveProperty('userId');
      expect(decoded).toHaveProperty('organizationId');
      expect(decoded).toHaveProperty('role');
      expect(decoded).toHaveProperty('permissions');

      expect(decoded.organizationId).toBe('org-verify');
      expect(decoded.role).toBe('administrator');
      expect(decoded.permissions).toContain('admin:write');
    });

    it('should throw error for invalid token', () => {
      expect(() => authService.verifyToken('invalid-token'))
        .toThrow('Invalid token');
    });

    it('should throw error for malformed token', () => {
      expect(() => authService.verifyToken('not.a.jwt'))
        .toThrow('Invalid token');
    });
  });

  describe('getUserById', () => {
    let userId: string;

    beforeEach(async () => {
      const registrationRequest: UserRegistrationRequest = {
        email: 'getuser@example.com',
        password: 'Password123!',
        firstName: 'Get',
        lastName: 'User',
        organizationId: 'org-get',
        role: 'portfolio-manager',
      };

      const result = await authService.registerUser(registrationRequest);
      userId = result.user.id;
    });

    it('should get user by ID successfully', async () => {
      const user = await authService.getUserById(userId);

      expect(user).toBeDefined();
      expect(user!.id).toBe(userId);
      expect(user!.email).toBe('getuser@example.com');
      expect(user!.role).toBe('portfolio-manager');
      expect(user).not.toHaveProperty('passwordHash');
    });

    it('should return null for non-existent user', async () => {
      const user = await authService.getUserById('non-existent-id');
      expect(user).toBeNull();
    });
  });

  describe('logoutUser', () => {
    let userId: string;
    let refreshToken: string;

    beforeEach(async () => {
      const registrationRequest: UserRegistrationRequest = {
        email: 'logout@example.com',
        password: 'Password123!',
        firstName: 'Logout',
        lastName: 'User',
        organizationId: 'org-logout',
        role: 'analyst',
      };

      const result = await authService.registerUser(registrationRequest);
      userId = result.user.id;
      refreshToken = result.refreshToken;
    });

    it('should logout user successfully', async () => {
      await authService.logoutUser(userId, refreshToken);

      // Try to use the refresh token - should fail
      const refreshRequest: RefreshTokenRequest = {
        refreshToken,
      };

      await expect(authService.refreshToken(refreshRequest))
        .rejects.toThrow('Invalid refresh token');
    });

    it('should logout from all devices when no refresh token provided', async () => {
      // Generate another refresh token
      const loginRequest: UserLoginRequest = {
        email: 'logout@example.com',
        password: 'Password123!',
      };
      const loginResult = await authService.loginUser(loginRequest);
      const secondRefreshToken = loginResult.refreshToken;

      // Logout from all devices
      await authService.logoutUser(userId);

      // Both refresh tokens should be invalid
      await expect(authService.refreshToken({ refreshToken }))
        .rejects.toThrow('Invalid refresh token');

      await expect(authService.refreshToken({ refreshToken: secondRefreshToken }))
        .rejects.toThrow('Invalid refresh token');
    });

    it('should throw error for non-existent user', async () => {
      await expect(authService.logoutUser('non-existent-id', refreshToken))
        .rejects.toThrow('User not found');
    });
  });
});