"use strict";
/**
 * User profile management routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_service_1 = require("../../services/auth-service");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const user_1 = require("../../models/user");
const router = (0, express_1.Router)();
/**
 * Get user profile
 * GET /api/profile
 */
router.get('/', auth_1.authenticateUser, async (req, res) => {
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
            data: {
                profile: user.profile,
                preferences: user.preferences,
                role: user.role,
                permissions: user.permissions,
                organizationId: user.organizationId,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                lastLoginAt: user.lastLoginAt
            }
        });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve profile',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
/**
 * Update user profile
 * PUT /api/profile
 */
router.put('/', auth_1.authenticateUser, validation_1.validateRequest, async (req, res) => {
    try {
        const user = await auth_service_1.authService.updateUser(req.user.userId, req.body);
        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                profile: user.profile,
                preferences: user.preferences,
                updatedAt: user.updatedAt
            }
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
 * Update user preferences
 * PUT /api/profile/preferences
 */
router.put('/preferences', auth_1.authenticateUser, validation_1.validateRequest, async (req, res) => {
    try {
        const user = await auth_service_1.authService.updateUser(req.user.userId, {
            preferences: req.body
        });
        res.status(200).json({
            success: true,
            message: 'Preferences updated successfully',
            data: {
                preferences: user.preferences,
                updatedAt: user.updatedAt
            }
        });
    }
    catch (error) {
        console.error('Update preferences error:', error);
        res.status(400).json({
            success: false,
            error: 'Preferences update failed',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
/**
 * Get user preferences
 * GET /api/profile/preferences
 */
router.get('/preferences', auth_1.authenticateUser, async (req, res) => {
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
            message: 'User preferences retrieved successfully',
            data: user.preferences
        });
    }
    catch (error) {
        console.error('Get preferences error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve preferences',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
/**
 * Update notification settings
 * PUT /api/profile/notifications
 */
router.put('/notifications', auth_1.authenticateUser, validation_1.validateRequest, async (req, res) => {
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
        const updatedUser = await auth_service_1.authService.updateUser(req.user.userId, {
            preferences: {
                ...user.preferences,
                notificationSettings: {
                    ...user.preferences.notificationSettings,
                    ...req.body
                }
            }
        });
        res.status(200).json({
            success: true,
            message: 'Notification settings updated successfully',
            data: {
                notificationSettings: updatedUser.preferences.notificationSettings,
                updatedAt: updatedUser.updatedAt
            }
        });
    }
    catch (error) {
        console.error('Update notifications error:', error);
        res.status(400).json({
            success: false,
            error: 'Notification settings update failed',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
/**
 * Get user activity summary (admin only)
 * GET /api/profile/activity/:userId
 */
router.get('/activity/:userId', auth_1.authenticateUser, (0, auth_1.checkPermissions)([user_1.PERMISSIONS.USER_READ]), async (req, res) => {
    try {
        const user = await auth_service_1.authService.getUserById(req.params.userId);
        if (!user) {
            res.status(404).json({
                success: false,
                error: 'User not found',
                message: 'User with specified ID not found'
            });
            return;
        }
        // Return basic activity information
        res.status(200).json({
            success: true,
            message: 'User activity retrieved successfully',
            data: {
                userId: user.id,
                email: user.email,
                role: user.role,
                organizationId: user.organizationId,
                isActive: user.isActive,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                lastLoginAt: user.lastLoginAt
            }
        });
    }
    catch (error) {
        console.error('Get user activity error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve user activity',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
exports.default = router;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlci1wcm9maWxlLXJvdXRlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9hcGkvcm91dGVzL3VzZXItcHJvZmlsZS1yb3V0ZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOztBQUVILHFDQUFvRDtBQUNwRCw4REFBMEQ7QUFDMUQsNkNBQXdFO0FBQ3hFLHlEQUEyRDtBQUMzRCw0Q0FBZ0Q7QUFFaEQsTUFBTSxNQUFNLEdBQUcsSUFBQSxnQkFBTSxHQUFFLENBQUM7QUFFeEI7OztHQUdHO0FBQ0gsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsdUJBQWdCLEVBQUUsS0FBSyxFQUFFLEdBQVksRUFBRSxHQUFhLEVBQUUsRUFBRTtJQUN0RSxJQUFJO1FBQ0YsTUFBTSxJQUFJLEdBQUcsTUFBTSwwQkFBVyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRTdELElBQUksQ0FBQyxJQUFJLEVBQUU7WUFDVCxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDbkIsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsS0FBSyxFQUFFLGdCQUFnQjtnQkFDdkIsT0FBTyxFQUFFLHdCQUF3QjthQUNsQyxDQUFDLENBQUM7WUFDSCxPQUFPO1NBQ1I7UUFFRCxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNuQixPQUFPLEVBQUUsSUFBSTtZQUNiLE9BQU8sRUFBRSxxQ0FBcUM7WUFDOUMsSUFBSSxFQUFFO2dCQUNKLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTztnQkFDckIsV0FBVyxFQUFFLElBQUksQ0FBQyxXQUFXO2dCQUM3QixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7Z0JBQ2YsV0FBVyxFQUFFLElBQUksQ0FBQyxXQUFXO2dCQUM3QixjQUFjLEVBQUUsSUFBSSxDQUFDLGNBQWM7Z0JBQ25D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U0FBUztnQkFDekIsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTO2dCQUN6QixXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVc7YUFDOUI7U0FDRixDQUFDLENBQUM7S0FDSjtJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ2QsT0FBTyxDQUFDLEtBQUssQ0FBQywwQkFBMEIsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNqRCxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNuQixPQUFPLEVBQUUsS0FBSztZQUNkLEtBQUssRUFBRSxrQ0FBa0M7WUFDekMsT0FBTyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLHdCQUF3QjtTQUMzRSxDQUFDLENBQUM7S0FDSjtBQUNILENBQUMsQ0FDRixDQUFDO0FBRUYsa0JBQWUsTUFBTSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBVc2VyIHByb2ZpbGUgbWFuYWdlbWVudCByb3V0ZXNcbiAqL1xuXG5pbXBvcnQgeyBSb3V0ZXIsIFJlcXVlc3QsIFJlc3BvbnNlIH0gZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgeyBhdXRoU2VydmljZSB9IGZyb20gJy4uLy4uL3NlcnZpY2VzL2F1dGgtc2VydmljZSc7XG5pbXBvcnQgeyBhdXRoZW50aWNhdGVVc2VyLCBjaGVja1Blcm1pc3Npb25zIH0gZnJvbSAnLi4vbWlkZGxld2FyZS9hdXRoJztcbmltcG9ydCB7IHZhbGlkYXRlUmVxdWVzdCB9IGZyb20gJy4uL21pZGRsZXdhcmUvdmFsaWRhdGlvbic7XG5pbXBvcnQgeyBQRVJNSVNTSU9OUyB9IGZyb20gJy4uLy4uL21vZGVscy91c2VyJztcblxuY29uc3Qgcm91dGVyID0gUm91dGVyKCk7XG5cbi8qKlxuICogR2V0IHVzZXIgcHJvZmlsZVxuICogR0VUIC9hcGkvcHJvZmlsZVxuICovXG5yb3V0ZXIuZ2V0KCcvJywgYXV0aGVudGljYXRlVXNlciwgYXN5bmMgKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHVzZXIgPSBhd2FpdCBhdXRoU2VydmljZS5nZXRVc2VyQnlJZChyZXEudXNlciEudXNlcklkKTtcbiAgICBcbiAgICBpZiAoIXVzZXIpIHtcbiAgICAgIHJlcy5zdGF0dXMoNDA0KS5qc29uKHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIGVycm9yOiAnVXNlciBub3QgZm91bmQnLFxuICAgICAgICBtZXNzYWdlOiAnVXNlciBwcm9maWxlIG5vdCBmb3VuZCdcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBcbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgbWVzc2FnZTogJ1VzZXIgcHJvZmlsZSByZXRyaWV2ZWQgc3VjY2Vzc2Z1bGx5JyxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgcHJvZmlsZTogdXNlci5wcm9maWxlLFxuICAgICAgICBwcmVmZXJlbmNlczogdXNlci5wcmVmZXJlbmNlcyxcbiAgICAgICAgcm9sZTogdXNlci5yb2xlLFxuICAgICAgICBwZXJtaXNzaW9uczogdXNlci5wZXJtaXNzaW9ucyxcbiAgICAgICAgb3JnYW5pemF0aW9uSWQ6IHVzZXIub3JnYW5pemF0aW9uSWQsXG4gICAgICAgIGNyZWF0ZWRBdDogdXNlci5jcmVhdGVkQXQsXG4gICAgICAgIHVwZGF0ZWRBdDogdXNlci51cGRhdGVkQXQsXG4gICAgICAgIGxhc3RMb2dpbkF0OiB1c2VyLmxhc3RMb2dpbkF0XG4gICAgICB9XG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignR2V0IHByb2ZpbGUgZXJyb3I6JywgZXJyb3IpO1xuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgZXJyb3I6ICdGYWlsZWQgdG8gcmV0cmlldmUgcHJvZmlsZScsXG4gICAgICBtZXNzYWdlOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yIG9jY3VycmVkJ1xuICAgIH0pO1xuICB9XG59KTtcblxuLyoqXG4gKiBVcGRhdGUgdXNlciBwcm9maWxlXG4gKiBQVVQgL2FwaS9wcm9maWxlXG4gKi9cbnJvdXRlci5wdXQoJy8nLCBhdXRoZW50aWNhdGVVc2VyLCB2YWxpZGF0ZVJlcXVlc3QsIGFzeW5jIChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCB1c2VyID0gYXdhaXQgYXV0aFNlcnZpY2UudXBkYXRlVXNlcihyZXEudXNlciEudXNlcklkLCByZXEuYm9keSk7XG4gICAgXG4gICAgcmVzLnN0YXR1cygyMDApLmpzb24oe1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIG1lc3NhZ2U6ICdQcm9maWxlIHVwZGF0ZWQgc3VjY2Vzc2Z1bGx5JyxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgcHJvZmlsZTogdXNlci5wcm9maWxlLFxuICAgICAgICBwcmVmZXJlbmNlczogdXNlci5wcmVmZXJlbmNlcyxcbiAgICAgICAgdXBkYXRlZEF0OiB1c2VyLnVwZGF0ZWRBdFxuICAgICAgfVxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1VwZGF0ZSBwcm9maWxlIGVycm9yOicsIGVycm9yKTtcbiAgICByZXMuc3RhdHVzKDQwMCkuanNvbih7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGVycm9yOiAnUHJvZmlsZSB1cGRhdGUgZmFpbGVkJyxcbiAgICAgIG1lc3NhZ2U6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3Igb2NjdXJyZWQnXG4gICAgfSk7XG4gIH1cbn0pO1xuXG4vKipcbiAqIFVwZGF0ZSB1c2VyIHByZWZlcmVuY2VzXG4gKiBQVVQgL2FwaS9wcm9maWxlL3ByZWZlcmVuY2VzXG4gKi9cbnJvdXRlci5wdXQoJy9wcmVmZXJlbmNlcycsIGF1dGhlbnRpY2F0ZVVzZXIsIHZhbGlkYXRlUmVxdWVzdCwgYXN5bmMgKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHVzZXIgPSBhd2FpdCBhdXRoU2VydmljZS51cGRhdGVVc2VyKHJlcS51c2VyIS51c2VySWQsIHtcbiAgICAgIHByZWZlcmVuY2VzOiByZXEuYm9keVxuICAgIH0pO1xuICAgIFxuICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBtZXNzYWdlOiAnUHJlZmVyZW5jZXMgdXBkYXRlZCBzdWNjZXNzZnVsbHknLFxuICAgICAgZGF0YToge1xuICAgICAgICBwcmVmZXJlbmNlczogdXNlci5wcmVmZXJlbmNlcyxcbiAgICAgICAgdXBkYXRlZEF0OiB1c2VyLnVwZGF0ZWRBdFxuICAgICAgfVxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1VwZGF0ZSBwcmVmZXJlbmNlcyBlcnJvcjonLCBlcnJvcik7XG4gICAgcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBlcnJvcjogJ1ByZWZlcmVuY2VzIHVwZGF0ZSBmYWlsZWQnLFxuICAgICAgbWVzc2FnZTogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvciBvY2N1cnJlZCdcbiAgICB9KTtcbiAgfVxufSk7XG5cbi8qKlxuICogR2V0IHVzZXIgcHJlZmVyZW5jZXNcbiAqIEdFVCAvYXBpL3Byb2ZpbGUvcHJlZmVyZW5jZXNcbiAqL1xucm91dGVyLmdldCgnL3ByZWZlcmVuY2VzJywgYXV0aGVudGljYXRlVXNlciwgYXN5bmMgKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHVzZXIgPSBhd2FpdCBhdXRoU2VydmljZS5nZXRVc2VyQnlJZChyZXEudXNlciEudXNlcklkKTtcbiAgICBcbiAgICBpZiAoIXVzZXIpIHtcbiAgICAgIHJlcy5zdGF0dXMoNDA0KS5qc29uKHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIGVycm9yOiAnVXNlciBub3QgZm91bmQnLFxuICAgICAgICBtZXNzYWdlOiAnVXNlciBwcm9maWxlIG5vdCBmb3VuZCdcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBcbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgbWVzc2FnZTogJ1VzZXIgcHJlZmVyZW5jZXMgcmV0cmlldmVkIHN1Y2Nlc3NmdWxseScsXG4gICAgICBkYXRhOiB1c2VyLnByZWZlcmVuY2VzXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignR2V0IHByZWZlcmVuY2VzIGVycm9yOicsIGVycm9yKTtcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGVycm9yOiAnRmFpbGVkIHRvIHJldHJpZXZlIHByZWZlcmVuY2VzJyxcbiAgICAgIG1lc3NhZ2U6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3Igb2NjdXJyZWQnXG4gICAgfSk7XG4gIH1cbn0pO1xuXG4vKipcbiAqIFVwZGF0ZSBub3RpZmljYXRpb24gc2V0dGluZ3NcbiAqIFBVVCAvYXBpL3Byb2ZpbGUvbm90aWZpY2F0aW9uc1xuICovXG5yb3V0ZXIucHV0KCcvbm90aWZpY2F0aW9ucycsIGF1dGhlbnRpY2F0ZVVzZXIsIHZhbGlkYXRlUmVxdWVzdCwgYXN5bmMgKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHVzZXIgPSBhd2FpdCBhdXRoU2VydmljZS5nZXRVc2VyQnlJZChyZXEudXNlciEudXNlcklkKTtcbiAgICBcbiAgICBpZiAoIXVzZXIpIHtcbiAgICAgIHJlcy5zdGF0dXMoNDA0KS5qc29uKHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIGVycm9yOiAnVXNlciBub3QgZm91bmQnLFxuICAgICAgICBtZXNzYWdlOiAnVXNlciBwcm9maWxlIG5vdCBmb3VuZCdcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHVwZGF0ZWRVc2VyID0gYXdhaXQgYXV0aFNlcnZpY2UudXBkYXRlVXNlcihyZXEudXNlciEudXNlcklkLCB7XG4gICAgICBwcmVmZXJlbmNlczoge1xuICAgICAgICAuLi51c2VyLnByZWZlcmVuY2VzLFxuICAgICAgICBub3RpZmljYXRpb25TZXR0aW5nczoge1xuICAgICAgICAgIC4uLnVzZXIucHJlZmVyZW5jZXMubm90aWZpY2F0aW9uU2V0dGluZ3MsXG4gICAgICAgICAgLi4ucmVxLmJvZHlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIFxuICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBtZXNzYWdlOiAnTm90aWZpY2F0aW9uIHNldHRpbmdzIHVwZGF0ZWQgc3VjY2Vzc2Z1bGx5JyxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgbm90aWZpY2F0aW9uU2V0dGluZ3M6IHVwZGF0ZWRVc2VyLnByZWZlcmVuY2VzLm5vdGlmaWNhdGlvblNldHRpbmdzLFxuICAgICAgICB1cGRhdGVkQXQ6IHVwZGF0ZWRVc2VyLnVwZGF0ZWRBdFxuICAgICAgfVxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1VwZGF0ZSBub3RpZmljYXRpb25zIGVycm9yOicsIGVycm9yKTtcbiAgICByZXMuc3RhdHVzKDQwMCkuanNvbih7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGVycm9yOiAnTm90aWZpY2F0aW9uIHNldHRpbmdzIHVwZGF0ZSBmYWlsZWQnLFxuICAgICAgbWVzc2FnZTogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvciBvY2N1cnJlZCdcbiAgICB9KTtcbiAgfVxufSk7XG5cbi8qKlxuICogR2V0IHVzZXIgYWN0aXZpdHkgc3VtbWFyeSAoYWRtaW4gb25seSlcbiAqIEdFVCAvYXBpL3Byb2ZpbGUvYWN0aXZpdHkvOnVzZXJJZFxuICovXG5yb3V0ZXIuZ2V0KCcvYWN0aXZpdHkvOnVzZXJJZCcsIFxuICBhdXRoZW50aWNhdGVVc2VyLCBcbiAgY2hlY2tQZXJtaXNzaW9ucyhbUEVSTUlTU0lPTlMuVVNFUl9SRUFEXSksIFxuICBhc3luYyAocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHVzZXIgPSBhd2FpdCBhdXRoU2VydmljZS5nZXRVc2VyQnlJZChyZXEucGFyYW1zLnVzZXJJZCk7XG4gICAgICBcbiAgICAgIGlmICghdXNlcikge1xuICAgICAgICByZXMuc3RhdHVzKDQwNCkuanNvbih7XG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgZXJyb3I6ICdVc2VyIG5vdCBmb3VuZCcsXG4gICAgICAgICAgbWVzc2FnZTogJ1VzZXIgd2l0aCBzcGVjaWZpZWQgSUQgbm90IGZvdW5kJ1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBSZXR1cm4gYmFzaWMgYWN0aXZpdHkgaW5mb3JtYXRpb25cbiAgICAgIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcbiAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgbWVzc2FnZTogJ1VzZXIgYWN0aXZpdHkgcmV0cmlldmVkIHN1Y2Nlc3NmdWxseScsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICB1c2VySWQ6IHVzZXIuaWQsXG4gICAgICAgICAgZW1haWw6IHVzZXIuZW1haWwsXG4gICAgICAgICAgcm9sZTogdXNlci5yb2xlLFxuICAgICAgICAgIG9yZ2FuaXphdGlvbklkOiB1c2VyLm9yZ2FuaXphdGlvbklkLFxuICAgICAgICAgIGlzQWN0aXZlOiB1c2VyLmlzQWN0aXZlLFxuICAgICAgICAgIGNyZWF0ZWRBdDogdXNlci5jcmVhdGVkQXQsXG4gICAgICAgICAgdXBkYXRlZEF0OiB1c2VyLnVwZGF0ZWRBdCxcbiAgICAgICAgICBsYXN0TG9naW5BdDogdXNlci5sYXN0TG9naW5BdFxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignR2V0IHVzZXIgYWN0aXZpdHkgZXJyb3I6JywgZXJyb3IpO1xuICAgICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgZXJyb3I6ICdGYWlsZWQgdG8gcmV0cmlldmUgdXNlciBhY3Rpdml0eScsXG4gICAgICAgIG1lc3NhZ2U6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3Igb2NjdXJyZWQnXG4gICAgICB9KTtcbiAgICB9XG4gIH1cbik7XG5cbmV4cG9ydCBkZWZhdWx0IHJvdXRlcjsiXX0=