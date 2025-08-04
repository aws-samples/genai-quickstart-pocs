/**
 * Authentication service for user management
 */
import { User, UserRegistrationRequest, UserLoginRequest, UserLoginResponse, UserUpdateRequest, PasswordChangeRequest, PasswordResetRequest, PasswordResetConfirmRequest, RefreshTokenRequest } from '../models/user';
export declare class AuthService {
    private users;
    private usersByEmail;
    /**
     * Register a new user
     */
    registerUser(request: UserRegistrationRequest): Promise<UserLoginResponse>;
    /**
     * Login user
     */
    loginUser(request: UserLoginRequest): Promise<UserLoginResponse>;
    /**
     * Refresh access token
     */
    refreshToken(request: RefreshTokenRequest): Promise<UserLoginResponse>;
    /**
     * Logout user
     */
    logoutUser(userId: string, refreshToken?: string): Promise<void>;
    /**
     * Get user by ID
     */
    getUserById(userId: string): Promise<User | null>;
    /**
     * Update user profile and preferences
     */
    updateUser(userId: string, request: UserUpdateRequest): Promise<User>;
    /**
     * Change user password
     */
    changePassword(userId: string, request: PasswordChangeRequest): Promise<void>;
    /**
     * Request password reset
     */
    requestPasswordReset(request: PasswordResetRequest): Promise<void>;
    /**
     * Confirm password reset
     */
    confirmPasswordReset(request: PasswordResetConfirmRequest): Promise<void>;
    /**
     * Verify JWT token
     */
    verifyToken(token: string): {
        userId: string;
        organizationId: string;
        role: string;
        permissions: string[];
    };
    /**
     * Generate JWT tokens
     */
    private generateTokens;
    /**
     * Get token expiration time in seconds
     */
    private getTokenExpirationTime;
    /**
     * Remove sensitive data from user object
     */
    private sanitizeUser;
    /**
     * Validate password strength
     */
    private validatePassword;
}
export declare const authService: AuthService;
