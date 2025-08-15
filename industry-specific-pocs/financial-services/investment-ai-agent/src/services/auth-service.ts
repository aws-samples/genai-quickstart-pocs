/**
 * Authentication service for user management
 */

import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import {
  User,
  UserWithPassword,
  UserRegistrationRequest,
  UserLoginRequest,
  UserLoginResponse,
  UserUpdateRequest,
  PasswordChangeRequest,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
  RefreshTokenRequest,
  DEFAULT_USER_PREFERENCES,
  DEFAULT_USER_PROFILE,
  ROLE_PERMISSIONS,
} from '../models/user';

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = 12;

export class AuthService {
  // In-memory user store (in production, this would be a database)
  private users: Map<string, UserWithPassword> = new Map();
  private usersByEmail: Map<string, string> = new Map();
  /**
   * Register a new user
   */
  async registerUser(request: UserRegistrationRequest): Promise<UserLoginResponse> {
    // Check if user already exists
    if (this.usersByEmail.has(request.email.toLowerCase())) {
      throw new Error('User with this email already exists');
    }

    // Validate password strength
    this.validatePassword(request.password);

    // Hash password
    const passwordHash = await bcrypt.hash(request.password, BCRYPT_ROUNDS);

    // Create user
    const userId = uuidv4();
    const now = new Date();
    
    const user: UserWithPassword = {
      id: userId,
      email: request.email.toLowerCase(),
      organizationId: request.organizationId,
      role: request.role,
      permissions: ROLE_PERMISSIONS[request.role],
      preferences: { ...DEFAULT_USER_PREFERENCES },
      profile: {
        ...DEFAULT_USER_PROFILE,
        firstName: request.firstName,
        lastName: request.lastName,
        title: request.title,
        department: request.department,
        phoneNumber: request.phoneNumber,
        timezone: request.timezone || 'UTC',
        language: request.language || 'en',
      } as any,
      createdAt: now,
      updatedAt: now,
      isActive: true,
      passwordHash,
      refreshTokens: [],
    };

    // Store user
    this.users.set(userId, user);
    this.usersByEmail.set(request.email.toLowerCase(), userId);

    // Generate tokens
    const { token, refreshToken } = this.generateTokens(user);
    
    // Store refresh token
    user.refreshTokens.push(refreshToken);

    return {
      user: this.sanitizeUser(user),
      token,
      refreshToken,
      expiresIn: this.getTokenExpirationTime(),
    };
  }

  /**
   * Login user
   */
  async loginUser(request: UserLoginRequest): Promise<UserLoginResponse> {
    const userId = this.usersByEmail.get(request.email.toLowerCase());
    if (!userId) {
      throw new Error('Invalid email or password');
    }

    const user = this.users.get(userId);
    if (!user || !user.isActive) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(request.password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    user.lastLoginAt = new Date();
    user.updatedAt = new Date();

    // Generate tokens
    const { token, refreshToken } = this.generateTokens(user);
    
    // Store refresh token
    user.refreshTokens.push(refreshToken);

    return {
      user: this.sanitizeUser(user),
      token,
      refreshToken,
      expiresIn: this.getTokenExpirationTime(),
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(request: RefreshTokenRequest): Promise<UserLoginResponse> {
    try {
      const decoded = jwt.verify(request.refreshToken, JWT_REFRESH_SECRET) as jwt.JwtPayload & { userId: string };
      const user = this.users.get(decoded.userId);

      if (!user || !user.isActive || !user.refreshTokens.includes(request.refreshToken)) {
        throw new Error('Invalid refresh token');
      }

      // Remove old refresh token
      user.refreshTokens = user.refreshTokens.filter(token => token !== request.refreshToken);

      // Generate new tokens
      const { token, refreshToken } = this.generateTokens(user);
      
      // Store new refresh token
      user.refreshTokens.push(refreshToken);

      return {
        user: this.sanitizeUser(user),
        token,
        refreshToken,
        expiresIn: this.getTokenExpirationTime(),
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Logout user
   */
  async logoutUser(userId: string, refreshToken?: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (refreshToken) {
      // Remove specific refresh token
      user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
    } else {
      // Remove all refresh tokens (logout from all devices)
      user.refreshTokens = [];
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    const user = this.users.get(userId);
    return user ? this.sanitizeUser(user) : null;
  }

  /**
   * Update user profile and preferences
   */
  async updateUser(userId: string, request: UserUpdateRequest): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Update profile
    if (request.profile) {
      user.profile = { ...user.profile, ...request.profile };
    }

    // Update preferences
    if (request.preferences) {
      user.preferences = { ...user.preferences, ...request.preferences };
    }

    user.updatedAt = new Date();

    return this.sanitizeUser(user);
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, request: PasswordChangeRequest): Promise<void> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(request.currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password
    this.validatePassword(request.newPassword);

    // Hash new password
    user.passwordHash = await bcrypt.hash(request.newPassword, BCRYPT_ROUNDS);
    user.updatedAt = new Date();

    // Invalidate all refresh tokens (force re-login on all devices)
    user.refreshTokens = [];
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(request: PasswordResetRequest): Promise<void> {
    const userId = this.usersByEmail.get(request.email.toLowerCase());
    if (!userId) {
      // Don't reveal if email exists
      return;
    }

    const user = this.users.get(userId);
    if (!user || !user.isActive) {
      return;
    }

    // Generate reset token
    const resetToken = uuidv4();
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour

    // In a real application, send email with reset link
    console.log(`Password reset token for ${user.email}: ${resetToken}`);
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(request: PasswordResetConfirmRequest): Promise<void> {
    // Find user by reset token
    const user = Array.from(this.users.values()).find(
      u => u.passwordResetToken === request.token && 
           u.passwordResetExpires && 
           u.passwordResetExpires > new Date()
    );

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    // Validate new password
    this.validatePassword(request.newPassword);

    // Hash new password
    user.passwordHash = await bcrypt.hash(request.newPassword, BCRYPT_ROUNDS);
    user.updatedAt = new Date();

    // Clear reset token
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // Invalidate all refresh tokens
    user.refreshTokens = [];
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): { userId: string; organizationId: string; role: string; permissions: string[] } {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & {
        userId: string;
        organizationId: string;
        role: string;
        permissions: string[];
      };
      return {
        userId: decoded.userId,
        organizationId: decoded.organizationId,
        role: decoded.role,
        permissions: decoded.permissions,
      };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Generate JWT tokens
   */
  private generateTokens(user: UserWithPassword): { token: string; refreshToken: string } {
    const payload = {
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
      permissions: user.permissions,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
    const refreshToken = jwt.sign({ 
      userId: user.id,
      jti: uuidv4() // Add unique identifier to make tokens unique
    }, JWT_REFRESH_SECRET, { 
      expiresIn: JWT_REFRESH_EXPIRES_IN 
    } as jwt.SignOptions);

    return { token, refreshToken };
  }

  /**
   * Get token expiration time in seconds
   */
  private getTokenExpirationTime(): number {
    // Parse JWT_EXPIRES_IN (e.g., "1h", "30m", "3600s")
    const expiresIn = JWT_EXPIRES_IN;
    if (expiresIn.endsWith('h')) {
      return parseInt(expiresIn) * 3600;
    } else if (expiresIn.endsWith('m')) {
      return parseInt(expiresIn) * 60;
    } else if (expiresIn.endsWith('s')) {
      return parseInt(expiresIn);
    }
    return 3600; // Default to 1 hour
  }

  /**
   * Remove sensitive data from user object
   */
  private sanitizeUser(user: UserWithPassword): User {
    const { passwordHash, refreshTokens, passwordResetToken, passwordResetExpires, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Validate password strength
   */
  private validatePassword(password: string): void {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(password)) {
      throw new Error('Password must contain at least one number');
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      throw new Error('Password must contain at least one special character');
    }
  }
}

// Export singleton instance
export const authService = new AuthService();