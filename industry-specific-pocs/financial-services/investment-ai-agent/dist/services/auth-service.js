"use strict";
/**
 * Authentication service for user management
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const bcrypt_1 = __importDefault(require("bcrypt"));
const user_1 = require("../models/user");
// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = 12;
class AuthService {
    constructor() {
        // In-memory user store (in production, this would be a database)
        this.users = new Map();
        this.usersByEmail = new Map();
    }
    /**
     * Register a new user
     */
    async registerUser(request) {
        // Check if user already exists
        if (this.usersByEmail.has(request.email.toLowerCase())) {
            throw new Error('User with this email already exists');
        }
        // Validate password strength
        this.validatePassword(request.password);
        // Hash password
        const passwordHash = await bcrypt_1.default.hash(request.password, BCRYPT_ROUNDS);
        // Create user
        const userId = (0, uuid_1.v4)();
        const now = new Date();
        const user = {
            id: userId,
            email: request.email.toLowerCase(),
            organizationId: request.organizationId,
            role: request.role,
            permissions: user_1.ROLE_PERMISSIONS[request.role],
            preferences: { ...user_1.DEFAULT_USER_PREFERENCES },
            profile: {
                ...user_1.DEFAULT_USER_PROFILE,
                firstName: request.firstName,
                lastName: request.lastName,
                title: request.title,
                department: request.department,
                phoneNumber: request.phoneNumber,
                timezone: request.timezone || 'UTC',
                language: request.language || 'en',
            },
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
    async loginUser(request) {
        const userId = this.usersByEmail.get(request.email.toLowerCase());
        if (!userId) {
            throw new Error('Invalid email or password');
        }
        const user = this.users.get(userId);
        if (!user || !user.isActive) {
            throw new Error('Invalid email or password');
        }
        // Verify password
        const isValidPassword = await bcrypt_1.default.compare(request.password, user.passwordHash);
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
    async refreshToken(request) {
        try {
            const decoded = jwt.verify(request.refreshToken, JWT_REFRESH_SECRET);
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
        }
        catch (error) {
            throw new Error('Invalid refresh token');
        }
    }
    /**
     * Logout user
     */
    async logoutUser(userId, refreshToken) {
        const user = this.users.get(userId);
        if (!user) {
            throw new Error('User not found');
        }
        if (refreshToken) {
            // Remove specific refresh token
            user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
        }
        else {
            // Remove all refresh tokens (logout from all devices)
            user.refreshTokens = [];
        }
    }
    /**
     * Get user by ID
     */
    async getUserById(userId) {
        const user = this.users.get(userId);
        return user ? this.sanitizeUser(user) : null;
    }
    /**
     * Update user profile and preferences
     */
    async updateUser(userId, request) {
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
    async changePassword(userId, request) {
        const user = this.users.get(userId);
        if (!user) {
            throw new Error('User not found');
        }
        // Verify current password
        const isValidPassword = await bcrypt_1.default.compare(request.currentPassword, user.passwordHash);
        if (!isValidPassword) {
            throw new Error('Current password is incorrect');
        }
        // Validate new password
        this.validatePassword(request.newPassword);
        // Hash new password
        user.passwordHash = await bcrypt_1.default.hash(request.newPassword, BCRYPT_ROUNDS);
        user.updatedAt = new Date();
        // Invalidate all refresh tokens (force re-login on all devices)
        user.refreshTokens = [];
    }
    /**
     * Request password reset
     */
    async requestPasswordReset(request) {
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
        const resetToken = (0, uuid_1.v4)();
        user.passwordResetToken = resetToken;
        user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
        // In a real application, send email with reset link
        console.log(`Password reset token for ${user.email}: ${resetToken}`);
    }
    /**
     * Confirm password reset
     */
    async confirmPasswordReset(request) {
        // Find user by reset token
        const user = Array.from(this.users.values()).find(u => u.passwordResetToken === request.token &&
            u.passwordResetExpires &&
            u.passwordResetExpires > new Date());
        if (!user) {
            throw new Error('Invalid or expired reset token');
        }
        // Validate new password
        this.validatePassword(request.newPassword);
        // Hash new password
        user.passwordHash = await bcrypt_1.default.hash(request.newPassword, BCRYPT_ROUNDS);
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
    verifyToken(token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            return {
                userId: decoded.userId,
                organizationId: decoded.organizationId,
                role: decoded.role,
                permissions: decoded.permissions,
            };
        }
        catch (error) {
            throw new Error('Invalid token');
        }
    }
    /**
     * Generate JWT tokens
     */
    generateTokens(user) {
        const payload = {
            userId: user.id,
            organizationId: user.organizationId,
            role: user.role,
            permissions: user.permissions,
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        const refreshToken = jwt.sign({
            userId: user.id,
            jti: (0, uuid_1.v4)() // Add unique identifier to make tokens unique
        }, JWT_REFRESH_SECRET, {
            expiresIn: JWT_REFRESH_EXPIRES_IN
        });
        return { token, refreshToken };
    }
    /**
     * Get token expiration time in seconds
     */
    getTokenExpirationTime() {
        // Parse JWT_EXPIRES_IN (e.g., "1h", "30m", "3600s")
        const expiresIn = JWT_EXPIRES_IN;
        if (expiresIn.endsWith('h')) {
            return parseInt(expiresIn) * 3600;
        }
        else if (expiresIn.endsWith('m')) {
            return parseInt(expiresIn) * 60;
        }
        else if (expiresIn.endsWith('s')) {
            return parseInt(expiresIn);
        }
        return 3600; // Default to 1 hour
    }
    /**
     * Remove sensitive data from user object
     */
    sanitizeUser(user) {
        const { passwordHash, refreshTokens, passwordResetToken, passwordResetExpires, ...sanitized } = user;
        return sanitized;
    }
    /**
     * Validate password strength
     */
    validatePassword(password) {
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
exports.AuthService = AuthService;
// Export singleton instance
exports.authService = new AuthService();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aC1zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3NlcnZpY2VzL2F1dGgtc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsa0RBQW9DO0FBQ3BDLCtCQUFvQztBQUNwQyxvREFBNEI7QUFDNUIseUNBY3dCO0FBRXhCLGdCQUFnQjtBQUNoQixNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsSUFBSSxxQkFBcUIsQ0FBQztBQUNuRSxNQUFNLGtCQUFrQixHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLElBQUkseUJBQXlCLENBQUM7QUFDdkYsTUFBTSxjQUFjLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLElBQUksSUFBSSxDQUFDO0FBQzFELE1BQU0sc0JBQXNCLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsSUFBSSxJQUFJLENBQUM7QUFDMUUsTUFBTSxhQUFhLEdBQUcsRUFBRSxDQUFDO0FBRXpCLE1BQWEsV0FBVztJQUF4QjtRQUNFLGlFQUFpRTtRQUN6RCxVQUFLLEdBQWtDLElBQUksR0FBRyxFQUFFLENBQUM7UUFDakQsaUJBQVksR0FBd0IsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQWtXeEQsQ0FBQztJQWpXQzs7T0FFRztJQUNILEtBQUssQ0FBQyxZQUFZLENBQUMsT0FBZ0M7UUFDakQsK0JBQStCO1FBQy9CLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQyxFQUFFO1lBQ3RELE1BQU0sSUFBSSxLQUFLLENBQUMscUNBQXFDLENBQUMsQ0FBQztTQUN4RDtRQUVELDZCQUE2QjtRQUM3QixJQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRXhDLGdCQUFn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V0Qsa0NBcVdDO0FBRUQsNEJBQTRCO0FBQ2YsUUFBQSxXQUFXLEdBQUcsSUFBSSxXQUFXLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQXV0aGVudGljYXRpb24gc2VydmljZSBmb3IgdXNlciBtYW5hZ2VtZW50XG4gKi9cblxuaW1wb3J0ICogYXMgand0IGZyb20gJ2pzb253ZWJ0b2tlbic7XG5pbXBvcnQgeyB2NCBhcyB1dWlkdjQgfSBmcm9tICd1dWlkJztcbmltcG9ydCBiY3J5cHQgZnJvbSAnYmNyeXB0JztcbmltcG9ydCB7XG4gIFVzZXIsXG4gIFVzZXJXaXRoUGFzc3dvcmQsXG4gIFVzZXJSZWdpc3RyYXRpb25SZXF1ZXN0LFxuICBVc2VyTG9naW5SZXF1ZXN0LFxuICBVc2VyTG9naW5SZXNwb25zZSxcbiAgVXNlclVwZGF0ZVJlcXVlc3QsXG4gIFBhc3N3b3JkQ2hhbmdlUmVxdWVzdCxcbiAgUGFzc3dvcmRSZXNldFJlcXVlc3QsXG4gIFBhc3N3b3JkUmVzZXRDb25maXJtUmVxdWVzdCxcbiAgUmVmcmVzaFRva2VuUmVxdWVzdCxcbiAgREVGQVVMVF9VU0VSX1BSRUZFUkVOQ0VTLFxuICBERUZBVUxUX1VTRVJfUFJPRklMRSxcbiAgUk9MRV9QRVJNSVNTSU9OUyxcbn0gZnJvbSAnLi4vbW9kZWxzL3VzZXInO1xuXG4vLyBDb25maWd1cmF0aW9uXG5jb25zdCBKV1RfU0VDUkVUID0gcHJvY2Vzcy5lbnYuSldUX1NFQ1JFVCB8fCAneW91ci1qd3Qtc2VjcmV0LWtleSc7XG5jb25zdCBKV1RfUkVGUkVTSF9TRUNSRVQgPSBwcm9jZXNzLmVudi5KV1RfUkVGUkVTSF9TRUNSRVQgfHwgJ3lvdXItcmVmcmVzaC1zZWNyZXQta2V5JztcbmNvbnN0IEpXVF9FWFBJUkVTX0lOID0gcHJvY2Vzcy5lbnYuSldUX0VYUElSRVNfSU4gfHwgJzFoJztcbmNvbnN0IEpXVF9SRUZSRVNIX0VYUElSRVNfSU4gPSBwcm9jZXNzLmVudi5KV1RfUkVGUkVTSF9FWFBJUkVTX0lOIHx8ICc3ZCc7XG5jb25zdCBCQ1JZUFRfUk9VTkRTID0gMTI7XG5cbmV4cG9ydCBjbGFzcyBBdXRoU2VydmljZSB7XG4gIC8vIEluLW1lbW9yeSB1c2VyIHN0b3JlIChpbiBwcm9kdWN0aW9uLCB0aGlzIHdvdWxkIGJlIGEgZGF0YWJhc2UpXG4gIHByaXZhdGUgdXNlcnM6IE1hcDxzdHJpbmcsIFVzZXJXaXRoUGFzc3dvcmQ+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIHVzZXJzQnlFbWFpbDogTWFwPHN0cmluZywgc3RyaW5nPiA9IG5ldyBNYXAoKTtcbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGEgbmV3IHVzZXJcbiAgICovXG4gIGFzeW5jIHJlZ2lzdGVyVXNlcihyZXF1ZXN0OiBVc2VyUmVnaXN0cmF0aW9uUmVxdWVzdCk6IFByb21pc2U8VXNlckxvZ2luUmVzcG9uc2U+IHtcbiAgICAvLyBDaGVjayBpZiB1c2VyIGFscmVhZHkgZXhpc3RzXG4gICAgaWYgKHRoaXMudXNlcnNCeUVtYWlsLmhhcyhyZXF1ZXN0LmVtYWlsLnRvTG93ZXJDYXNlKCkpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VzZXIgd2l0aCB0aGlzIGVtYWlsIGFscmVhZHkgZXhpc3RzJyk7XG4gICAgfVxuXG4gICAgLy8gVmFsaWRhdGUgcGFzc3dvcmQgc3RyZW5ndGhcbiAgICB0aGlzLnZhbGlkYXRlUGFzc3dvcmQocmVxdWVzdC5wYXNzd29yZCk7XG5cbiAgICAvLyBIYXNoIHBhc3N3b3JkXG4gICAgY29uc3QgcGFzc3dvcmRIYXNoID0gYXdhaXQgYmNyeXB0Lmhhc2gocmVxdWVzdC5wYXNzd29yZCwgQkNSWVBUX1JPVU5EUyk7XG5cbiAgICAvLyBDcmVhdGUgdXNlclxuICAgIGNvbnN0IHVzZXJJZCA9IHV1aWR2NCgpO1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgXG4gICAgY29uc3QgdXNlcjogVXNlcldpdGhQYXNzd29yZCA9IHtcbiAgICAgIGlkOiB1c2VySWQsXG4gICAgICBlbWFpbDogcmVxdWVzdC5lbWFpbC50b0xvd2VyQ2FzZSgpLFxuICAgICAgb3JnYW5pemF0aW9uSWQ6IHJlcXVlc3Qub3JnYW5pemF0aW9uSWQsXG4gICAgICByb2xlOiByZXF1ZXN0LnJvbGUsXG4gICAgICBwZXJtaXNzaW9uczogUk9MRV9QRVJNSVNTSU9OU1tyZXF1ZXN0LnJvbGVdLFxuICAgICAgcHJlZmVyZW5jZXM6IHsgLi4uREVGQVVMVF9VU0VSX1BSRUZFUkVOQ0VTIH0sXG4gICAgICBwcm9maWxlOiB7XG4gICAgICAgIC4uLkRFRkFVTFRfVVNFUl9QUk9GSUxFLFxuICAgICAgICBmaXJzdE5hbWU6IHJlcXVlc3QuZmlyc3ROYW1lLFxuICAgICAgICBsYXN0TmFtZTogcmVxdWVzdC5sYXN0TmFtZSxcbiAgICAgICAgdGl0bGU6IHJlcXVlc3QudGl0bGUsXG4gICAgICAgIGRlcGFydG1lbnQ6IHJlcXVlc3QuZGVwYXJ0bWVudCxcbiAgICAgICAgcGhvbmVOdW1iZXI6IHJlcXVlc3QucGhvbmVOdW1iZXIsXG4gICAgICAgIHRpbWV6b25lOiByZXF1ZXN0LnRpbWV6b25lIHx8ICdVVEMnLFxuICAgICAgICBsYW5ndWFnZTogcmVxdWVzdC5sYW5ndWFnZSB8fCAnZW4nLFxuICAgICAgfSBhcyBhbnksXG4gICAgICBjcmVhdGVkQXQ6IG5vdyxcbiAgICAgIHVwZGF0ZWRBdDogbm93LFxuICAgICAgaXNBY3RpdmU6IHRydWUsXG4gICAgICBwYXNzd29yZEhhc2gsXG4gICAgICByZWZyZXNoVG9rZW5zOiBbXSxcbiAgICB9O1xuXG4gICAgLy8gU3RvcmUgdXNlclxuICAgIHRoaXMudXNlcnMuc2V0KHVzZXJJZCwgdXNlcik7XG4gICAgdGhpcy51c2Vyc0J5RW1haWwuc2V0KHJlcXVlc3QuZW1haWwudG9Mb3dlckNhc2UoKSwgdXNlcklkKTtcblxuICAgIC8vIEdlbmVyYXRlIHRva2Vuc1xuICAgIGNvbnN0IHsgdG9rZW4sIHJlZnJlc2hUb2tlbiB9ID0gdGhpcy5nZW5lcmF0ZVRva2Vucyh1c2VyKTtcbiAgICBcbiAgICAvLyBTdG9yZSByZWZyZXNoIHRva2VuXG4gICAgdXNlci5yZWZyZXNoVG9rZW5zLnB1c2gocmVmcmVzaFRva2VuKTtcblxuICAgIHJldHVybiB7XG4gICAgICB1c2VyOiB0aGlzLnNhbml0aXplVXNlcih1c2VyKSxcbiAgICAgIHRva2VuLFxuICAgICAgcmVmcmVzaFRva2VuLFxuICAgICAgZXhwaXJlc0luOiB0aGlzLmdldFRva2VuRXhwaXJhdGlvblRpbWUoKSxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIExvZ2luIHVzZXJcbiAgICovXG4gIGFzeW5jIGxvZ2luVXNlcihyZXF1ZXN0OiBVc2VyTG9naW5SZXF1ZXN0KTogUHJvbWlzZTxVc2VyTG9naW5SZXNwb25zZT4ge1xuICAgIGNvbnN0IHVzZXJJZCA9IHRoaXMudXNlcnNCeUVtYWlsLmdldChyZXF1ZXN0LmVtYWlsLnRvTG93ZXJDYXNlKCkpO1xuICAgIGlmICghdXNlcklkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgZW1haWwgb3IgcGFzc3dvcmQnKTtcbiAgICB9XG5cbiAgICBjb25zdCB1c2VyID0gdGhpcy51c2Vycy5nZXQodXNlcklkKTtcbiAgICBpZiAoIXVzZXIgfHwgIXVzZXIuaXNBY3RpdmUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBlbWFpbCBvciBwYXNzd29yZCcpO1xuICAgIH1cblxuICAgIC8vIFZlcmlmeSBwYXNzd29yZFxuICAgIGNvbnN0IGlzVmFsaWRQYXNzd29yZCA9IGF3YWl0IGJjcnlwdC5jb21wYXJlKHJlcXVlc3QucGFzc3dvcmQsIHVzZXIucGFzc3dvcmRIYXNoKTtcbiAgICBpZiAoIWlzVmFsaWRQYXNzd29yZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGVtYWlsIG9yIHBhc3N3b3JkJyk7XG4gICAgfVxuXG4gICAgLy8gVXBkYXRlIGxhc3QgbG9naW5cbiAgICB1c2VyLmxhc3RMb2dpbkF0ID0gbmV3IERhdGUoKTtcbiAgICB1c2VyLnVwZGF0ZWRBdCA9IG5ldyBEYXRlKCk7XG5cbiAgICAvLyBHZW5lcmF0ZSB0b2tlbnNcbiAgICBjb25zdCB7IHRva2VuLCByZWZyZXNoVG9rZW4gfSA9IHRoaXMuZ2VuZXJhdGVUb2tlbnModXNlcik7XG4gICAgXG4gICAgLy8gU3RvcmUgcmVmcmVzaCB0b2tlblxuICAgIHVzZXIucmVmcmVzaFRva2Vucy5wdXNoKHJlZnJlc2hUb2tlbik7XG5cbiAgICByZXR1cm4ge1xuICAgICAgdXNlcjogdGhpcy5zYW5pdGl6ZVVzZXIodXNlciksXG4gICAgICB0b2tlbixcbiAgICAgIHJlZnJlc2hUb2tlbixcbiAgICAgIGV4cGlyZXNJbjogdGhpcy5nZXRUb2tlbkV4cGlyYXRpb25UaW1lKCksXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWZyZXNoIGFjY2VzcyB0b2tlblxuICAgKi9cbiAgYXN5bmMgcmVmcmVzaFRva2VuKHJlcXVlc3Q6IFJlZnJlc2hUb2tlblJlcXVlc3QpOiBQcm9taXNlPFVzZXJMb2dpblJlc3BvbnNlPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGRlY29kZWQgPSBqd3QudmVyaWZ5KHJlcXVlc3QucmVmcmVzaFRva2VuLCBKV1RfUkVGUkVTSF9TRUNSRVQpIGFzIGp3dC5Kd3RQYXlsb2FkICYgeyB1c2VySWQ6IHN0cmluZyB9O1xuICAgICAgY29uc3QgdXNlciA9IHRoaXMudXNlcnMuZ2V0KGRlY29kZWQudXNlcklkKTtcblxuICAgICAgaWYgKCF1c2VyIHx8ICF1c2VyLmlzQWN0aXZlIHx8ICF1c2VyLnJlZnJlc2hUb2tlbnMuaW5jbHVkZXMocmVxdWVzdC5yZWZyZXNoVG9rZW4pKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCByZWZyZXNoIHRva2VuJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIFJlbW92ZSBvbGQgcmVmcmVzaCB0b2tlblxuICAgICAgdXNlci5yZWZyZXNoVG9rZW5zID0gdXNlci5yZWZyZXNoVG9rZW5zLmZpbHRlcih0b2tlbiA9PiB0b2tlbiAhPT0gcmVxdWVzdC5yZWZyZXNoVG9rZW4pO1xuXG4gICAgICAvLyBHZW5lcmF0ZSBuZXcgdG9rZW5zXG4gICAgICBjb25zdCB7IHRva2VuLCByZWZyZXNoVG9rZW4gfSA9IHRoaXMuZ2VuZXJhdGVUb2tlbnModXNlcik7XG4gICAgICBcbiAgICAgIC8vIFN0b3JlIG5ldyByZWZyZXNoIHRva2VuXG4gICAgICB1c2VyLnJlZnJlc2hUb2tlbnMucHVzaChyZWZyZXNoVG9rZW4pO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICB1c2VyOiB0aGlzLnNhbml0aXplVXNlcih1c2VyKSxcbiAgICAgICAgdG9rZW4sXG4gICAgICAgIHJlZnJlc2hUb2tlbixcbiAgICAgICAgZXhwaXJlc0luOiB0aGlzLmdldFRva2VuRXhwaXJhdGlvblRpbWUoKSxcbiAgICAgIH07XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCByZWZyZXNoIHRva2VuJyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIExvZ291dCB1c2VyXG4gICAqL1xuICBhc3luYyBsb2dvdXRVc2VyKHVzZXJJZDogc3RyaW5nLCByZWZyZXNoVG9rZW4/OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB1c2VyID0gdGhpcy51c2Vycy5nZXQodXNlcklkKTtcbiAgICBpZiAoIXVzZXIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVXNlciBub3QgZm91bmQnKTtcbiAgICB9XG5cbiAgICBpZiAocmVmcmVzaFRva2VuKSB7XG4gICAgICAvLyBSZW1vdmUgc3BlY2lmaWMgcmVmcmVzaCB0b2tlblxuICAgICAgdXNlci5yZWZyZXNoVG9rZW5zID0gdXNlci5yZWZyZXNoVG9rZW5zLmZpbHRlcih0b2tlbiA9PiB0b2tlbiAhPT0gcmVmcmVzaFRva2VuKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gUmVtb3ZlIGFsbCByZWZyZXNoIHRva2VucyAobG9nb3V0IGZyb20gYWxsIGRldmljZXMpXG4gICAgICB1c2VyLnJlZnJlc2hUb2tlbnMgPSBbXTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IHVzZXIgYnkgSURcbiAgICovXG4gIGFzeW5jIGdldFVzZXJCeUlkKHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxVc2VyIHwgbnVsbD4ge1xuICAgIGNvbnN0IHVzZXIgPSB0aGlzLnVzZXJzLmdldCh1c2VySWQpO1xuICAgIHJldHVybiB1c2VyID8gdGhpcy5zYW5pdGl6ZVVzZXIodXNlcikgOiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB1c2VyIHByb2ZpbGUgYW5kIHByZWZlcmVuY2VzXG4gICAqL1xuICBhc3luYyB1cGRhdGVVc2VyKHVzZXJJZDogc3RyaW5nLCByZXF1ZXN0OiBVc2VyVXBkYXRlUmVxdWVzdCk6IFByb21pc2U8VXNlcj4ge1xuICAgIGNvbnN0IHVzZXIgPSB0aGlzLnVzZXJzLmdldCh1c2VySWQpO1xuICAgIGlmICghdXNlcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVc2VyIG5vdCBmb3VuZCcpO1xuICAgIH1cblxuICAgIC8vIFVwZGF0ZSBwcm9maWxlXG4gICAgaWYgKHJlcXVlc3QucHJvZmlsZSkge1xuICAgICAgdXNlci5wcm9maWxlID0geyAuLi51c2VyLnByb2ZpbGUsIC4uLnJlcXVlc3QucHJvZmlsZSB9O1xuICAgIH1cblxuICAgIC8vIFVwZGF0ZSBwcmVmZXJlbmNlc1xuICAgIGlmIChyZXF1ZXN0LnByZWZlcmVuY2VzKSB7XG4gICAgICB1c2VyLnByZWZlcmVuY2VzID0geyAuLi51c2VyLnByZWZlcmVuY2VzLCAuLi5yZXF1ZXN0LnByZWZlcmVuY2VzIH07XG4gICAgfVxuXG4gICAgdXNlci51cGRhdGVkQXQgPSBuZXcgRGF0ZSgpO1xuXG4gICAgcmV0dXJuIHRoaXMuc2FuaXRpemVVc2VyKHVzZXIpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoYW5nZSB1c2VyIHBhc3N3b3JkXG4gICAqL1xuICBhc3luYyBjaGFuZ2VQYXNzd29yZCh1c2VySWQ6IHN0cmluZywgcmVxdWVzdDogUGFzc3dvcmRDaGFuZ2VSZXF1ZXN0KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgdXNlciA9IHRoaXMudXNlcnMuZ2V0KHVzZXJJZCk7XG4gICAgaWYgKCF1c2VyKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VzZXIgbm90IGZvdW5kJyk7XG4gICAgfVxuXG4gICAgLy8gVmVyaWZ5IGN1cnJlbnQgcGFzc3dvcmRcbiAgICBjb25zdCBpc1ZhbGlkUGFzc3dvcmQgPSBhd2FpdCBiY3J5cHQuY29tcGFyZShyZXF1ZXN0LmN1cnJlbnRQYXNzd29yZCwgdXNlci5wYXNzd29yZEhhc2gpO1xuICAgIGlmICghaXNWYWxpZFBhc3N3b3JkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0N1cnJlbnQgcGFzc3dvcmQgaXMgaW5jb3JyZWN0Jyk7XG4gICAgfVxuXG4gICAgLy8gVmFsaWRhdGUgbmV3IHBhc3N3b3JkXG4gICAgdGhpcy52YWxpZGF0ZVBhc3N3b3JkKHJlcXVlc3QubmV3UGFzc3dvcmQpO1xuXG4gICAgLy8gSGFzaCBuZXcgcGFzc3dvcmRcbiAgICB1c2VyLnBhc3N3b3JkSGFzaCA9IGF3YWl0IGJjcnlwdC5oYXNoKHJlcXVlc3QubmV3UGFzc3dvcmQsIEJDUllQVF9ST1VORFMpO1xuICAgIHVzZXIudXBkYXRlZEF0ID0gbmV3IERhdGUoKTtcblxuICAgIC8vIEludmFsaWRhdGUgYWxsIHJlZnJlc2ggdG9rZW5zIChmb3JjZSByZS1sb2dpbiBvbiBhbGwgZGV2aWNlcylcbiAgICB1c2VyLnJlZnJlc2hUb2tlbnMgPSBbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXF1ZXN0IHBhc3N3b3JkIHJlc2V0XG4gICAqL1xuICBhc3luYyByZXF1ZXN0UGFzc3dvcmRSZXNldChyZXF1ZXN0OiBQYXNzd29yZFJlc2V0UmVxdWVzdCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHVzZXJJZCA9IHRoaXMudXNlcnNCeUVtYWlsLmdldChyZXF1ZXN0LmVtYWlsLnRvTG93ZXJDYXNlKCkpO1xuICAgIGlmICghdXNlcklkKSB7XG4gICAgICAvLyBEb24ndCByZXZlYWwgaWYgZW1haWwgZXhpc3RzXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdXNlciA9IHRoaXMudXNlcnMuZ2V0KHVzZXJJZCk7XG4gICAgaWYgKCF1c2VyIHx8ICF1c2VyLmlzQWN0aXZlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gR2VuZXJhdGUgcmVzZXQgdG9rZW5cbiAgICBjb25zdCByZXNldFRva2VuID0gdXVpZHY0KCk7XG4gICAgdXNlci5wYXNzd29yZFJlc2V0VG9rZW4gPSByZXNldFRva2VuO1xuICAgIHVzZXIucGFzc3dvcmRSZXNldEV4cGlyZXMgPSBuZXcgRGF0ZShEYXRlLm5vdygpICsgMzYwMDAwMCk7IC8vIDEgaG91clxuXG4gICAgLy8gSW4gYSByZWFsIGFwcGxpY2F0aW9uLCBzZW5kIGVtYWlsIHdpdGggcmVzZXQgbGlua1xuICAgIGNvbnNvbGUubG9nKGBQYXNzd29yZCByZXNldCB0b2tlbiBmb3IgJHt1c2VyLmVtYWlsfTogJHtyZXNldFRva2VufWApO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbmZpcm0gcGFzc3dvcmQgcmVzZXRcbiAgICovXG4gIGFzeW5jIGNvbmZpcm1QYXNzd29yZFJlc2V0KHJlcXVlc3Q6IFBhc3N3b3JkUmVzZXRDb25maXJtUmVxdWVzdCk6IFByb21pc2U8dm9pZD4ge1xuICAgIC8vIEZpbmQgdXNlciBieSByZXNldCB0b2tlblxuICAgIGNvbnN0IHVzZXIgPSBBcnJheS5mcm9tKHRoaXMudXNlcnMudmFsdWVzKCkpLmZpbmQoXG4gICAgICB1ID0+IHUucGFzc3dvcmRSZXNldFRva2VuID09PSByZXF1ZXN0LnRva2VuICYmIFxuICAgICAgICAgICB1LnBhc3N3b3JkUmVzZXRFeHBpcmVzICYmIFxuICAgICAgICAgICB1LnBhc3N3b3JkUmVzZXRFeHBpcmVzID4gbmV3IERhdGUoKVxuICAgICk7XG5cbiAgICBpZiAoIXVzZXIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBvciBleHBpcmVkIHJlc2V0IHRva2VuJyk7XG4gICAgfVxuXG4gICAgLy8gVmFsaWRhdGUgbmV3IHBhc3N3b3JkXG4gICAgdGhpcy52YWxpZGF0ZVBhc3N3b3JkKHJlcXVlc3QubmV3UGFzc3dvcmQpO1xuXG4gICAgLy8gSGFzaCBuZXcgcGFzc3dvcmRcbiAgICB1c2VyLnBhc3N3b3JkSGFzaCA9IGF3YWl0IGJjcnlwdC5oYXNoKHJlcXVlc3QubmV3UGFzc3dvcmQsIEJDUllQVF9ST1VORFMpO1xuICAgIHVzZXIudXBkYXRlZEF0ID0gbmV3IERhdGUoKTtcblxuICAgIC8vIENsZWFyIHJlc2V0IHRva2VuXG4gICAgdXNlci5wYXNzd29yZFJlc2V0VG9rZW4gPSB1bmRlZmluZWQ7XG4gICAgdXNlci5wYXNzd29yZFJlc2V0RXhwaXJlcyA9IHVuZGVmaW5lZDtcblxuICAgIC8vIEludmFsaWRhdGUgYWxsIHJlZnJlc2ggdG9rZW5zXG4gICAgdXNlci5yZWZyZXNoVG9rZW5zID0gW107XG4gIH1cblxuICAvKipcbiAgICogVmVyaWZ5IEpXVCB0b2tlblxuICAgKi9cbiAgdmVyaWZ5VG9rZW4odG9rZW46IHN0cmluZyk6IHsgdXNlcklkOiBzdHJpbmc7IG9yZ2FuaXphdGlvbklkOiBzdHJpbmc7IHJvbGU6IHN0cmluZzsgcGVybWlzc2lvbnM6IHN0cmluZ1tdIH0ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBkZWNvZGVkID0gand0LnZlcmlmeSh0b2tlbiwgSldUX1NFQ1JFVCkgYXMgand0Lkp3dFBheWxvYWQgJiB7XG4gICAgICAgIHVzZXJJZDogc3RyaW5nO1xuICAgICAgICBvcmdhbml6YXRpb25JZDogc3RyaW5nO1xuICAgICAgICByb2xlOiBzdHJpbmc7XG4gICAgICAgIHBlcm1pc3Npb25zOiBzdHJpbmdbXTtcbiAgICAgIH07XG4gICAgICByZXR1cm4ge1xuICAgICAgICB1c2VySWQ6IGRlY29kZWQudXNlcklkLFxuICAgICAgICBvcmdhbml6YXRpb25JZDogZGVjb2RlZC5vcmdhbml6YXRpb25JZCxcbiAgICAgICAgcm9sZTogZGVjb2RlZC5yb2xlLFxuICAgICAgICBwZXJtaXNzaW9uczogZGVjb2RlZC5wZXJtaXNzaW9ucyxcbiAgICAgIH07XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCB0b2tlbicpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBKV1QgdG9rZW5zXG4gICAqL1xuICBwcml2YXRlIGdlbmVyYXRlVG9rZW5zKHVzZXI6IFVzZXJXaXRoUGFzc3dvcmQpOiB7IHRva2VuOiBzdHJpbmc7IHJlZnJlc2hUb2tlbjogc3RyaW5nIH0ge1xuICAgIGNvbnN0IHBheWxvYWQgPSB7XG4gICAgICB1c2VySWQ6IHVzZXIuaWQsXG4gICAgICBvcmdhbml6YXRpb25JZDogdXNlci5vcmdhbml6YXRpb25JZCxcbiAgICAgIHJvbGU6IHVzZXIucm9sZSxcbiAgICAgIHBlcm1pc3Npb25zOiB1c2VyLnBlcm1pc3Npb25zLFxuICAgIH07XG5cbiAgICBjb25zdCB0b2tlbiA9IGp3dC5zaWduKHBheWxvYWQsIEpXVF9TRUNSRVQsIHsgZXhwaXJlc0luOiBKV1RfRVhQSVJFU19JTiB9IGFzIGp3dC5TaWduT3B0aW9ucyk7XG4gICAgY29uc3QgcmVmcmVzaFRva2VuID0gand0LnNpZ24oeyBcbiAgICAgIHVzZXJJZDogdXNlci5pZCxcbiAgICAgIGp0aTogdXVpZHY0KCkgLy8gQWRkIHVuaXF1ZSBpZGVudGlmaWVyIHRvIG1ha2UgdG9rZW5zIHVuaXF1ZVxuICAgIH0sIEpXVF9SRUZSRVNIX1NFQ1JFVCwgeyBcbiAgICAgIGV4cGlyZXNJbjogSldUX1JFRlJFU0hfRVhQSVJFU19JTiBcbiAgICB9IGFzIGp3dC5TaWduT3B0aW9ucyk7XG5cbiAgICByZXR1cm4geyB0b2tlbiwgcmVmcmVzaFRva2VuIH07XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRva2VuIGV4cGlyYXRpb24gdGltZSBpbiBzZWNvbmRzXG4gICAqL1xuICBwcml2YXRlIGdldFRva2VuRXhwaXJhdGlvblRpbWUoKTogbnVtYmVyIHtcbiAgICAvLyBQYXJzZSBKV1RfRVhQSVJFU19JTiAoZS5nLiwgXCIxaFwiLCBcIjMwbVwiLCBcIjM2MDBzXCIpXG4gICAgY29uc3QgZXhwaXJlc0luID0gSldUX0VYUElSRVNfSU47XG4gICAgaWYgKGV4cGlyZXNJbi5lbmRzV2l0aCgnaCcpKSB7XG4gICAgICByZXR1cm4gcGFyc2VJbnQoZXhwaXJlc0luKSAqIDM2MDA7XG4gICAgfSBlbHNlIGlmIChleHBpcmVzSW4uZW5kc1dpdGgoJ20nKSkge1xuICAgICAgcmV0dXJuIHBhcnNlSW50KGV4cGlyZXNJbikgKiA2MDtcbiAgICB9IGVsc2UgaWYgKGV4cGlyZXNJbi5lbmRzV2l0aCgncycpKSB7XG4gICAgICByZXR1cm4gcGFyc2VJbnQoZXhwaXJlc0luKTtcbiAgICB9XG4gICAgcmV0dXJuIDM2MDA7IC8vIERlZmF1bHQgdG8gMSBob3VyXG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIHNlbnNpdGl2ZSBkYXRhIGZyb20gdXNlciBvYmplY3RcbiAgICovXG4gIHByaXZhdGUgc2FuaXRpemVVc2VyKHVzZXI6IFVzZXJXaXRoUGFzc3dvcmQpOiBVc2VyIHtcbiAgICBjb25zdCB7IHBhc3N3b3JkSGFzaCwgcmVmcmVzaFRva2VucywgcGFzc3dvcmRSZXNldFRva2VuLCBwYXNzd29yZFJlc2V0RXhwaXJlcywgLi4uc2FuaXRpemVkIH0gPSB1c2VyO1xuICAgIHJldHVybiBzYW5pdGl6ZWQ7XG4gIH1cblxuICAvKipcbiAgICogVmFsaWRhdGUgcGFzc3dvcmQgc3RyZW5ndGhcbiAgICovXG4gIHByaXZhdGUgdmFsaWRhdGVQYXNzd29yZChwYXNzd29yZDogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKHBhc3N3b3JkLmxlbmd0aCA8IDgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUGFzc3dvcmQgbXVzdCBiZSBhdCBsZWFzdCA4IGNoYXJhY3RlcnMgbG9uZycpO1xuICAgIH1cblxuICAgIGlmICghLyg/PS4qW2Etel0pLy50ZXN0KHBhc3N3b3JkKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdQYXNzd29yZCBtdXN0IGNvbnRhaW4gYXQgbGVhc3Qgb25lIGxvd2VyY2FzZSBsZXR0ZXInKTtcbiAgICB9XG5cbiAgICBpZiAoIS8oPz0uKltBLVpdKS8udGVzdChwYXNzd29yZCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUGFzc3dvcmQgbXVzdCBjb250YWluIGF0IGxlYXN0IG9uZSB1cHBlcmNhc2UgbGV0dGVyJyk7XG4gICAgfVxuXG4gICAgaWYgKCEvKD89LipcXGQpLy50ZXN0KHBhc3N3b3JkKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdQYXNzd29yZCBtdXN0IGNvbnRhaW4gYXQgbGVhc3Qgb25lIG51bWJlcicpO1xuICAgIH1cblxuICAgIGlmICghLyg/PS4qW0AkISUqPyZdKS8udGVzdChwYXNzd29yZCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUGFzc3dvcmQgbXVzdCBjb250YWluIGF0IGxlYXN0IG9uZSBzcGVjaWFsIGNoYXJhY3RlcicpO1xuICAgIH1cbiAgfVxufVxuXG4vLyBFeHBvcnQgc2luZ2xldG9uIGluc3RhbmNlXG5leHBvcnQgY29uc3QgYXV0aFNlcnZpY2UgPSBuZXcgQXV0aFNlcnZpY2UoKTsiXX0=