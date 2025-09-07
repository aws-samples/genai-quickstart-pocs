"use strict";
/**
 * Authentication routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_service_1 = require("../../services/auth-service");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const user_1 = require("../../models/user");
const router = (0, express_1.Router)();
/**
 * Register a new user
 * POST /api/auth/register
 */
router.post('/register', validation_1.validateRequest, async (req, res) => {
    try {
        const result = await auth_service_1.authService.registerUser(req.body);
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: result
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({
            success: false,
            error: 'Registration failed',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
/**
 * Login user
 * POST /api/auth/login
 */
router.post('/login', validation_1.validateRequest, async (req, res) => {
    try {
        const result = await auth_service_1.authService.loginUser(req.body);
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: result
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(401).json({
            success: false,
            error: 'Login failed',
            message: error instanceof Error ? error.message : 'Invalid credentials'
        });
    }
});
/**
 * Refresh access token
 * POST /api/auth/refresh
 */
router.post('/refresh', validation_1.validateRequest, async (req, res) => {
    try {
        const result = await auth_service_1.authService.refreshToken(req.body);
        res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            data: result
        });
    }
    catch (error) {
        console.error('Token refresh error:', error);
        res.status(401).json({
            success: false,
            error: 'Token refresh failed',
            message: error instanceof Error ? error.message : 'Invalid refresh token'
        });
    }
});
/**
 * Logout user
 * POST /api/auth/logout
 */
router.post('/logout', auth_1.authenticateUser, async (req, res) => {
    try {
        const refreshToken = req.body.refreshToken;
        await auth_service_1.authService.logoutUser(req.user.userId, refreshToken);
        res.status(200).json({
            success: true,
            message: 'Logout successful'
        });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            error: 'Logout failed',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
/**
 * Get current user profile
 * GET /api/auth/me
 */
router.get('/me', auth_1.authenticateUser, async (req, res) => {
    try {
        const user = await auth_service_1.authService.getUserById(req.user.userId);
        if (!user) {
            res.status(404).json({
                success: false,
                error: 'User not found',
                message: 'User profile not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'User profile retrieved successfully',
            data: user
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve user profile',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
/**
 * Update user profile and preferences
 * PUT /api/auth/profile
 */
router.put('/profile', auth_1.authenticateUser, validation_1.validateRequest, async (req, res) => {
    try {
        const user = await auth_service_1.authService.updateUser(req.user.userId, req.body);
        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: user
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(400).json({
            success: false,
            error: 'Profile update failed',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
/**
 * Change password
 * POST /api/auth/change-password
 */
router.post('/change-password', auth_1.authenticateUser, validation_1.validateRequest, async (req, res) => {
    try {
        await auth_service_1.authService.changePassword(req.user.userId, req.body);
        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    }
    catch (error) {
        console.error('Change password error:', error);
        res.status(400).json({
            success: false,
            error: 'Password change failed',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
/**
 * Request password reset
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', validation_1.validateRequest, async (req, res) => {
    try {
        await auth_service_1.authService.requestPasswordReset(req.body);
        // Always return success to prevent email enumeration
        res.status(200).json({
            success: true,
            message: 'If the email exists, a password reset link has been sent'
        });
    }
    catch (error) {
        console.error('Password reset request error:', error);
        res.status(200).json({
            success: true,
            message: 'If the email exists, a password reset link has been sent'
        });
    }
});
/**
 * Confirm password reset
 * POST /api/auth/reset-password
 */
router.post('/reset-password', validation_1.validateRequest, async (req, res) => {
    try {
        await auth_service_1.authService.confirmPasswordReset(req.body);
        res.status(200).json({
            success: true,
            message: 'Password reset successfully'
        });
    }
    catch (error) {
        console.error('Password reset error:', error);
        res.status(400).json({
            success: false,
            error: 'Password reset failed',
            message: error instanceof Error ? error.message : 'Invalid or expired reset token'
        });
    }
});
/**
 * Get user by ID (admin only)
 * GET /api/auth/users/:id
 */
router.get('/users/:id', auth_1.authenticateUser, (0, auth_1.checkPermissions)([user_1.PERMISSIONS.USER_READ]), async (req, res) => {
    try {
        const user = await auth_service_1.authService.getUserById(req.params.id);
        if (!user) {
            res.status(404).json({
                success: false,
                error: 'User not found',
                message: 'User with specified ID not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'User retrieved successfully',
            data: user
        });
    }
    catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve user',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
exports.default = router;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aC1yb3V0ZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYXBpL3JvdXRlcy9hdXRoLXJvdXRlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgscUNBQW9EO0FBQ3BELDhEQUEwRDtBQUMxRCw2Q0FBd0U7QUFDeEUseURBQTJEO0FBQzNELDRDQUFnRDtBQUVoRCxNQUFNLE1BQU0sR0FBRyxJQUFBLGdCQUFNLEdBQUUsQ0FBQztBQUV4Qjs7O0dBR0c7QUFDSCxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSw0QkFBZSxFQUFFLEtBQUssRUFBRSxHQUFZLEVBQUUsR0FBYSxFQUFFLEVBQUU7SUFDOUUsSUFBSTtRQUNGLE1BQU0sTUFBTSxHQUFHLE1BQU0sMEJBQVcsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRXhELEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ25CLE9BQU8sRUFBRSxJQUFJO1lBQ2IsT0FBTyxFQUFFLDhCQUE4QjtZQUN2QyxJQUFJLEVBQUUsTUFBTTtTQUNiLENBQUMsQ0FBQztLQUNKO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDZCxPQUFPLENBQUMsS0FBSyxDQUFDLHFCQUFxQixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzVDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ25CLE9BQU8sRUFBRSxLQUFLO1lBQ2QsS0FBSyxFQUFFLHFCQUFxQjtZQUM1QixPQUFPLEVBQUUsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsd0JBQXdCO1NBQzNFLENBQUMsQ0FBQztLQUNKO0FBQ0gsQ0FBQyxDQUFDLENBQUM7QUFFSDs7O0dBR0c7QUFDSCxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSw0QkFB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SUFBSSxFQUFFLElBQUk7U0FDWCxDQUFDLENBQUM7S0FDSjtJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ2QsT0FBTyxDQUFDLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM5QyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNuQixPQUFPLEVBQUUsS0FBSztZQUNkLEtBQUssRUFBRSx5QkFBeUI7WUFDaEMsT0FBTyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLHdCQUF3QjtTQUMzRSxDQUFDLENBQUM7S0FDSjtBQUNILENBQUMsQ0FDRixDQUFDO0FBRUYsa0JBQWUsTUFBTSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBBdXRoZW50aWNhdGlvbiByb3V0ZXNcbiAqL1xuXG5pbXBvcnQgeyBSb3V0ZXIsIFJlcXVlc3QsIFJlc3BvbnNlIH0gZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgeyBhdXRoU2VydmljZSB9IGZyb20gJy4uLy4uL3NlcnZpY2VzL2F1dGgtc2VydmljZSc7XG5pbXBvcnQgeyBhdXRoZW50aWNhdGVVc2VyLCBjaGVja1Blcm1pc3Npb25zIH0gZnJvbSAnLi4vbWlkZGxld2FyZS9hdXRoJztcbmltcG9ydCB7IHZhbGlkYXRlUmVxdWVzdCB9IGZyb20gJy4uL21pZGRsZXdhcmUvdmFsaWRhdGlvbic7XG5pbXBvcnQgeyBQRVJNSVNTSU9OUyB9IGZyb20gJy4uLy4uL21vZGVscy91c2VyJztcblxuY29uc3Qgcm91dGVyID0gUm91dGVyKCk7XG5cbi8qKlxuICogUmVnaXN0ZXIgYSBuZXcgdXNlclxuICogUE9TVCAvYXBpL2F1dGgvcmVnaXN0ZXJcbiAqL1xucm91dGVyLnBvc3QoJy9yZWdpc3RlcicsIHZhbGlkYXRlUmVxdWVzdCwgYXN5bmMgKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGF1dGhTZXJ2aWNlLnJlZ2lzdGVyVXNlcihyZXEuYm9keSk7XG4gICAgXG4gICAgcmVzLnN0YXR1cygyMDEpLmpzb24oe1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIG1lc3NhZ2U6ICdVc2VyIHJlZ2lzdGVyZWQgc3VjY2Vzc2Z1bGx5JyxcbiAgICAgIGRhdGE6IHJlc3VsdFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1JlZ2lzdHJhdGlvbiBlcnJvcjonLCBlcnJvcik7XG4gICAgcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBlcnJvcjogJ1JlZ2lzdHJhdGlvbiBmYWlsZWQnLFxuICAgICAgbWVzc2FnZTogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvciBvY2N1cnJlZCdcbiAgICB9KTtcbiAgfVxufSk7XG5cbi8qKlxuICogTG9naW4gdXNlclxuICogUE9TVCAvYXBpL2F1dGgvbG9naW5cbiAqL1xucm91dGVyLnBvc3QoJy9sb2dpbicsIHZhbGlkYXRlUmVxdWVzdCwgYXN5bmMgKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGF1dGhTZXJ2aWNlLmxvZ2luVXNlcihyZXEuYm9keSk7XG4gICAgXG4gICAgcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIG1lc3NhZ2U6ICdMb2dpbiBzdWNjZXNzZnVsJyxcbiAgICAgIGRhdGE6IHJlc3VsdFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0xvZ2luIGVycm9yOicsIGVycm9yKTtcbiAgICByZXMuc3RhdHVzKDQwMSkuanNvbih7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGVycm9yOiAnTG9naW4gZmFpbGVkJyxcbiAgICAgIG1lc3NhZ2U6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ0ludmFsaWQgY3JlZGVudGlhbHMnXG4gICAgfSk7XG4gIH1cbn0pO1xuXG4vKipcbiAqIFJlZnJlc2ggYWNjZXNzIHRva2VuXG4gKiBQT1NUIC9hcGkvYXV0aC9yZWZyZXNoXG4gKi9cbnJvdXRlci5wb3N0KCcvcmVmcmVzaCcsIHZhbGlkYXRlUmVxdWVzdCwgYXN5bmMgKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGF1dGhTZXJ2aWNlLnJlZnJlc2hUb2tlbihyZXEuYm9keSk7XG4gICAgXG4gICAgcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIG1lc3NhZ2U6ICdUb2tlbiByZWZyZXNoZWQgc3VjY2Vzc2Z1bGx5JyxcbiAgICAgIGRhdGE6IHJlc3VsdFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1Rva2VuIHJlZnJlc2ggZXJyb3I6JywgZXJyb3IpO1xuICAgIHJlcy5zdGF0dXMoNDAxKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgZXJyb3I6ICdUb2tlbiByZWZyZXNoIGZhaWxlZCcsXG4gICAgICBtZXNzYWdlOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdJbnZhbGlkIHJlZnJlc2ggdG9rZW4nXG4gICAgfSk7XG4gIH1cbn0pO1xuXG4vKipcbiAqIExvZ291dCB1c2VyXG4gKiBQT1NUIC9hcGkvYXV0aC9sb2dvdXRcbiAqL1xucm91dGVyLnBvc3QoJy9sb2dvdXQnLCBhdXRoZW50aWNhdGVVc2VyLCBhc3luYyAocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVmcmVzaFRva2VuID0gcmVxLmJvZHkucmVmcmVzaFRva2VuO1xuICAgIGF3YWl0IGF1dGhTZXJ2aWNlLmxvZ291dFVzZXIocmVxLnVzZXIhLnVzZXJJZCwgcmVmcmVzaFRva2VuKTtcbiAgICBcbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgbWVzc2FnZTogJ0xvZ291dCBzdWNjZXNzZnVsJ1xuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0xvZ291dCBlcnJvcjonLCBlcnJvcik7XG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBlcnJvcjogJ0xvZ291dCBmYWlsZWQnLFxuICAgICAgbWVzc2FnZTogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvciBvY2N1cnJlZCdcbiAgICB9KTtcbiAgfVxufSk7XG5cbi8qKlxuICogR2V0IGN1cnJlbnQgdXNlciBwcm9maWxlXG4gKiBHRVQgL2FwaS9hdXRoL21lXG4gKi9cbnJvdXRlci5nZXQoJy9tZScsIGF1dGhlbnRpY2F0ZVVzZXIsIGFzeW5jIChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCB1c2VyID0gYXdhaXQgYXV0aFNlcnZpY2UuZ2V0VXNlckJ5SWQocmVxLnVzZXIhLnVzZXJJZCk7XG4gICAgXG4gICAgaWYgKCF1c2VyKSB7XG4gICAgICByZXMuc3RhdHVzKDQwNCkuanNvbih7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBlcnJvcjogJ1VzZXIgbm90IGZvdW5kJyxcbiAgICAgICAgbWVzc2FnZTogJ1VzZXIgcHJvZmlsZSBub3QgZm91bmQnXG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgXG4gICAgcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIG1lc3NhZ2U6ICdVc2VyIHByb2ZpbGUgcmV0cmlldmVkIHN1Y2Nlc3NmdWxseScsXG4gICAgICBkYXRhOiB1c2VyXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignR2V0IHVzZXIgZXJyb3I6JywgZXJyb3IpO1xuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgZXJyb3I6ICdGYWlsZWQgdG8gcmV0cmlldmUgdXNlciBwcm9maWxlJyxcbiAgICAgIG1lc3NhZ2U6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3Igb2NjdXJyZWQnXG4gICAgfSk7XG4gIH1cbn0pO1xuXG4vKipcbiAqIFVwZGF0ZSB1c2VyIHByb2ZpbGUgYW5kIHByZWZlcmVuY2VzXG4gKiBQVVQgL2FwaS9hdXRoL3Byb2ZpbGVcbiAqL1xucm91dGVyLnB1dCgnL3Byb2ZpbGUnLCBhdXRoZW50aWNhdGVVc2VyLCB2YWxpZGF0ZVJlcXVlc3QsIGFzeW5jIChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCB1c2VyID0gYXdhaXQgYXV0aFNlcnZpY2UudXBkYXRlVXNlcihyZXEudXNlciEudXNlcklkLCByZXEuYm9keSk7XG4gICAgXG4gICAgcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIG1lc3NhZ2U6ICdQcm9maWxlIHVwZGF0ZWQgc3VjY2Vzc2Z1bGx5JyxcbiAgICAgIGRhdGE6IHVzZXJcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdVcGRhdGUgcHJvZmlsZSBlcnJvcjonLCBlcnJvcik7XG4gICAgcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBlcnJvcjogJ1Byb2ZpbGUgdXBkYXRlIGZhaWxlZCcsXG4gICAgICBtZXNzYWdlOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yIG9jY3VycmVkJ1xuICAgIH0pO1xuICB9XG59KTtcblxuLyoqXG4gKiBDaGFuZ2UgcGFzc3dvcmRcbiAqIFBPU1QgL2FwaS9hdXRoL2NoYW5nZS1wYXNzd29yZFxuICovXG5yb3V0ZXIucG9zdCgnL2NoYW5nZS1wYXNzd29yZCcsIGF1dGhlbnRpY2F0ZVVzZXIsIHZhbGlkYXRlUmVxdWVzdCwgYXN5bmMgKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkgPT4ge1xuICB0cnkge1xuICAgIGF3YWl0IGF1dGhTZXJ2aWNlLmNoYW5nZVBhc3N3b3JkKHJlcS51c2VyIS51c2VySWQsIHJlcS5ib2R5KTtcbiAgICBcbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgbWVzc2FnZTogJ1Bhc3N3b3JkIGNoYW5nZWQgc3VjY2Vzc2Z1bGx5J1xuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0NoYW5nZSBwYXNzd29yZCBlcnJvcjonLCBlcnJvcik7XG4gICAgcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBlcnJvcjogJ1Bhc3N3b3JkIGNoYW5nZSBmYWlsZWQnLFxuICAgICAgbWVzc2FnZTogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvciBvY2N1cnJlZCdcbiAgICB9KTtcbiAgfVxufSk7XG5cbi8qKlxuICogUmVxdWVzdCBwYXNzd29yZCByZXNldFxuICogUE9TVCAvYXBpL2F1dGgvZm9yZ290LXBhc3N3b3JkXG4gKi9cbnJvdXRlci5wb3N0KCcvZm9yZ290LXBhc3N3b3JkJywgdmFsaWRhdGVSZXF1ZXN0LCBhc3luYyAocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSA9PiB7XG4gIHRyeSB7XG4gICAgYXdhaXQgYXV0aFNlcnZpY2UucmVxdWVzdFBhc3N3b3JkUmVzZXQocmVxLmJvZHkpO1xuICAgIFxuICAgIC8vIEFsd2F5cyByZXR1cm4gc3VjY2VzcyB0byBwcmV2ZW50IGVtYWlsIGVudW1lcmF0aW9uXG4gICAgcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIG1lc3NhZ2U6ICdJZiB0aGUgZW1haWwgZXhpc3RzLCBhIHBhc3N3b3JkIHJlc2V0IGxpbmsgaGFzIGJlZW4gc2VudCdcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdQYXNzd29yZCByZXNldCByZXF1ZXN0IGVycm9yOicsIGVycm9yKTtcbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgbWVzc2FnZTogJ0lmIHRoZSBlbWFpbCBleGlzdHMsIGEgcGFzc3dvcmQgcmVzZXQgbGluayBoYXMgYmVlbiBzZW50J1xuICAgIH0pO1xuICB9XG59KTtcblxuLyoqXG4gKiBDb25maXJtIHBhc3N3b3JkIHJlc2V0XG4gKiBQT1NUIC9hcGkvYXV0aC9yZXNldC1wYXNzd29yZFxuICovXG5yb3V0ZXIucG9zdCgnL3Jlc2V0LXBhc3N3b3JkJywgdmFsaWRhdGVSZXF1ZXN0LCBhc3luYyAocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSA9PiB7XG4gIHRyeSB7XG4gICAgYXdhaXQgYXV0aFNlcnZpY2UuY29uZmlybVBhc3N3b3JkUmVzZXQocmVxLmJvZHkpO1xuICAgIFxuICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBtZXNzYWdlOiAnUGFzc3dvcmQgcmVzZXQgc3VjY2Vzc2Z1bGx5J1xuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1Bhc3N3b3JkIHJlc2V0IGVycm9yOicsIGVycm9yKTtcbiAgICByZXMuc3RhdHVzKDQwMCkuanNvbih7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGVycm9yOiAnUGFzc3dvcmQgcmVzZXQgZmFpbGVkJyxcbiAgICAgIG1lc3NhZ2U6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ0ludmFsaWQgb3IgZXhwaXJlZCByZXNldCB0b2tlbidcbiAgICB9KTtcbiAgfVxufSk7XG5cbi8qKlxuICogR2V0IHVzZXIgYnkgSUQgKGFkbWluIG9ubHkpXG4gKiBHRVQgL2FwaS9hdXRoL3VzZXJzLzppZFxuICovXG5yb3V0ZXIuZ2V0KCcvdXNlcnMvOmlkJywgXG4gIGF1dGhlbnRpY2F0ZVVzZXIsIFxuICBjaGVja1Blcm1pc3Npb25zKFtQRVJNSVNTSU9OUy5VU0VSX1JFQURdKSwgXG4gIGFzeW5jIChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgdXNlciA9IGF3YWl0IGF1dGhTZXJ2aWNlLmdldFVzZXJCeUlkKHJlcS5wYXJhbXMuaWQpO1xuICAgICAgXG4gICAgICBpZiAoIXVzZXIpIHtcbiAgICAgICAgcmVzLnN0YXR1cyg0MDQpLmpzb24oe1xuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgIGVycm9yOiAnVXNlciBub3QgZm91bmQnLFxuICAgICAgICAgIG1lc3NhZ2U6ICdVc2VyIHdpdGggc3BlY2lmaWVkIElEIG5vdCBmb3VuZCdcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICBtZXNzYWdlOiAnVXNlciByZXRyaWV2ZWQgc3VjY2Vzc2Z1bGx5JyxcbiAgICAgICAgZGF0YTogdXNlclxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0dldCB1c2VyIGJ5IElEIGVycm9yOicsIGVycm9yKTtcbiAgICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIGVycm9yOiAnRmFpbGVkIHRvIHJldHJpZXZlIHVzZXInLFxuICAgICAgICBtZXNzYWdlOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yIG9jY3VycmVkJ1xuICAgICAgfSk7XG4gICAgfVxuICB9XG4pO1xuXG5leHBvcnQgZGVmYXVsdCByb3V0ZXI7Il19