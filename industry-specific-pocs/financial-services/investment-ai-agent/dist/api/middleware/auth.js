"use strict";
/**
 * Authentication middleware
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRole = exports.checkPermissions = exports.authenticateUser = void 0;
const auth_service_1 = require("../../services/auth-service");
/**
 * Middleware to authenticate users
 * @param req The request object
 * @param res The response object
 * @param next The next function
 */
const authenticateUser = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                error: 'Authentication required',
                message: 'No token provided'
            });
            return;
        }
        const token = authHeader.split(' ')[1];
        // Verify token using auth service
        const decoded = auth_service_1.authService.verifyToken(token);
        // Add user to request
        req.user = decoded;
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({
            error: 'Authentication failed',
            message: 'Invalid or expired token'
        });
    }
};
exports.authenticateUser = authenticateUser;
/**
 * Middleware to check if user has required permissions
 * @param permissions The permissions required
 * @returns Middleware function
 */
const checkPermissions = (permissions) => {
    return (req, res, next) => {
        try {
            // Check if user exists
            if (!req.user) {
                res.status(401).json({
                    error: 'Authentication required',
                    message: 'User not authenticated'
                });
                return;
            }
            // Check if user has required permissions
            const hasPermission = permissions.every(permission => req.user.permissions.includes(permission));
            if (!hasPermission) {
                res.status(403).json({
                    error: 'Insufficient permissions',
                    message: `Required permissions: ${permissions.join(', ')}`,
                    userPermissions: req.user.permissions
                });
                return;
            }
            next();
        }
        catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({
                error: 'Authorization error',
                message: 'Error checking permissions'
            });
        }
    };
};
exports.checkPermissions = checkPermissions;
/**
 * Middleware to check if user has required role
 * @param roles The roles required
 * @returns Middleware function
 */
const checkRole = (roles) => {
    return (req, res, next) => {
        try {
            // Check if user exists
            if (!req.user) {
                res.status(401).json({
                    error: 'Authentication required',
                    message: 'User not authenticated'
                });
                return;
            }
            // Check if user has required role
            if (!roles.includes(req.user.role)) {
                res.status(403).json({
                    error: 'Insufficient role',
                    message: `Required roles: ${roles.join(', ')}`,
                    userRole: req.user.role
                });
                return;
            }
            next();
        }
        catch (error) {
            console.error('Role check error:', error);
            res.status(500).json({
                error: 'Authorization error',
                message: 'Error checking role'
            });
        }
    };
};
exports.checkRole = checkRole;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9hcGkvbWlkZGxld2FyZS9hdXRoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7O0FBR0gsOERBQTBEO0FBa0IxRDs7Ozs7R0FLRztBQUNJLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxHQUFZLEVBQUUsR0FBYSxFQUFFLElBQWtCLEVBQVEsRUFBRTtJQUN4RixJQUFJO1FBQ0Ysd0JBQXdCO1FBQ3hCLE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDO1FBRTdDLElBQUksQ0FBQyxVQUFVLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxFQUFFO1lBQ3BELEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUNuQixLQUFLLEVBQUUseUJBQXlCO2dCQUNoQyxPQUFPLEVBQUUsbUJBQW1CO2FBQzdCLENBQUMsQ0FBQztZQUNILE9BQU87U0FDUjtRQUVELE1BQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFdkMsa0NBQWtDO1FBQ2xDLE1BQU0sT0FBTyxHQUFHLDBCQUFXLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRS9DLHNCQUFzQjtRQUN0QixHQUFHLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQztRQUVuQixJQUFJLEVBQUUsQ0FBQztLQUNSO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDZCxPQUFPLENBQUMsS0FBSyxDQUFDLHVCQUF1QixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzlDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ25CLEtBQUssRUFBRSx1QkFBdUI7WUFDOUIsT0FBTyxFQUFFLDBCQUEwQjtTQUNwQyxDQUFDLENBQUM7S0FDSjtB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QUM7QUFDSixDQUFDLENBQUM7QUEvQlcsUUFBQSxTQUFTLGFBK0JwQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQXV0aGVudGljYXRpb24gbWlkZGxld2FyZVxuICovXG5cbmltcG9ydCB7IFJlcXVlc3QsIFJlc3BvbnNlLCBOZXh0RnVuY3Rpb24gfSBmcm9tICdleHByZXNzJztcbmltcG9ydCB7IGF1dGhTZXJ2aWNlIH0gZnJvbSAnLi4vLi4vc2VydmljZXMvYXV0aC1zZXJ2aWNlJztcblxuLyoqXG4gKiBFeHRlbmQgRXhwcmVzcyBSZXF1ZXN0IHR5cGUgdG8gaW5jbHVkZSB1c2VyXG4gKi9cbmRlY2xhcmUgZ2xvYmFsIHtcbiAgbmFtZXNwYWNlIEV4cHJlc3Mge1xuICAgIGludGVyZmFjZSBSZXF1ZXN0IHtcbiAgICAgIHVzZXI/OiB7XG4gICAgICAgIHVzZXJJZDogc3RyaW5nO1xuICAgICAgICBvcmdhbml6YXRpb25JZDogc3RyaW5nO1xuICAgICAgICByb2xlOiBzdHJpbmc7XG4gICAgICAgIHBlcm1pc3Npb25zOiBzdHJpbmdbXTtcbiAgICAgIH07XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogTWlkZGxld2FyZSB0byBhdXRoZW50aWNhdGUgdXNlcnNcbiAqIEBwYXJhbSByZXEgVGhlIHJlcXVlc3Qgb2JqZWN0XG4gKiBAcGFyYW0gcmVzIFRoZSByZXNwb25zZSBvYmplY3RcbiAqIEBwYXJhbSBuZXh0IFRoZSBuZXh0IGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBhdXRoZW50aWNhdGVVc2VyID0gKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSwgbmV4dDogTmV4dEZ1bmN0aW9uKTogdm9pZCA9PiB7XG4gIHRyeSB7XG4gICAgLy8gR2V0IHRva2VuIGZyb20gaGVhZGVyXG4gICAgY29uc3QgYXV0aEhlYWRlciA9IHJlcS5oZWFkZXJzLmF1dGhvcml6YXRpb247XG4gICAgXG4gICAgaWYgKCFhdXRoSGVhZGVyIHx8ICFhdXRoSGVhZGVyLnN0YXJ0c1dpdGgoJ0JlYXJlciAnKSkge1xuICAgICAgcmVzLnN0YXR1cyg0MDEpLmpzb24oeyBcbiAgICAgICAgZXJyb3I6ICdBdXRoZW50aWNhdGlvbiByZXF1aXJlZCcsXG4gICAgICAgIG1lc3NhZ2U6ICdObyB0b2tlbiBwcm92aWRlZCcgXG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgXG4gICAgY29uc3QgdG9rZW4gPSBhdXRoSGVhZGVyLnNwbGl0KCcgJylbMV07XG4gICAgXG4gICAgLy8gVmVyaWZ5IHRva2VuIHVzaW5nIGF1dGggc2VydmljZVxuICAgIGNvbnN0IGRlY29kZWQgPSBhdXRoU2VydmljZS52ZXJpZnlUb2tlbih0b2tlbik7XG4gICAgXG4gICAgLy8gQWRkIHVzZXIgdG8gcmVxdWVzdFxuICAgIHJlcS51c2VyID0gZGVjb2RlZDtcbiAgICBcbiAgICBuZXh0KCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignQXV0aGVudGljYXRpb24gZXJyb3I6JywgZXJyb3IpO1xuICAgIHJlcy5zdGF0dXMoNDAxKS5qc29uKHsgXG4gICAgICBlcnJvcjogJ0F1dGhlbnRpY2F0aW9uIGZhaWxlZCcsXG4gICAgICBtZXNzYWdlOiAnSW52YWxpZCBvciBleHBpcmVkIHRva2VuJyBcbiAgICB9KTtcbiAgfVxufTtcblxuLyoqXG4gKiBNaWRkbGV3YXJlIHRvIGNoZWNrIGlmIHVzZXIgaGFzIHJlcXVpcmVkIHBlcm1pc3Npb25zXG4gKiBAcGFyYW0gcGVybWlzc2lvbnMgVGhlIHBlcm1pc3Npb25zIHJlcXVpcmVkXG4gKiBAcmV0dXJucyBNaWRkbGV3YXJlIGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBjaGVja1Blcm1pc3Npb25zID0gKHBlcm1pc3Npb25zOiBzdHJpbmdbXSkgPT4ge1xuICByZXR1cm4gKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSwgbmV4dDogTmV4dEZ1bmN0aW9uKTogdm9pZCA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIENoZWNrIGlmIHVzZXIgZXhpc3RzXG4gICAgICBpZiAoIXJlcS51c2VyKSB7XG4gICAgICAgIHJlcy5zdGF0dXMoNDAxKS5qc29uKHsgXG4gICAgICAgICAgZXJyb3I6ICdBdXRoZW50aWNhdGlvbiByZXF1aXJlZCcsXG4gICAgICAgICAgbWVzc2FnZTogJ1VzZXIgbm90IGF1dGhlbnRpY2F0ZWQnIFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBDaGVjayBpZiB1c2VyIGhhcyByZXF1aXJlZCBwZXJtaXNzaW9uc1xuICAgICAgY29uc3QgaGFzUGVybWlzc2lvbiA9IHBlcm1pc3Npb25zLmV2ZXJ5KHBlcm1pc3Npb24gPT4gXG4gICAgICAgIHJlcS51c2VyIS5wZXJtaXNzaW9ucy5pbmNsdWRlcyhwZXJtaXNzaW9uKVxuICAgICAgKTtcbiAgICAgIFxuICAgICAgaWYgKCFoYXNQZXJtaXNzaW9uKSB7XG4gICAgICAgIHJlcy5zdGF0dXMoNDAzKS5qc29uKHsgXG4gICAgICAgICAgZXJyb3I6ICdJbnN1ZmZpY2llbnQgcGVybWlzc2lvbnMnLFxuICAgICAgICAgIG1lc3NhZ2U6IGBSZXF1aXJlZCBwZXJtaXNzaW9uczogJHtwZXJtaXNzaW9ucy5qb2luKCcsICcpfWAsXG4gICAgICAgICAgdXNlclBlcm1pc3Npb25zOiByZXEudXNlci5wZXJtaXNzaW9uc1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgXG4gICAgICBuZXh0KCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1Blcm1pc3Npb24gY2hlY2sgZXJyb3I6JywgZXJyb3IpO1xuICAgICAgcmVzLnN0YXR1cyg1MDApLmpzb24oeyBcbiAgICAgICAgZXJyb3I6ICdBdXRob3JpemF0aW9uIGVycm9yJyxcbiAgICAgICAgbWVzc2FnZTogJ0Vycm9yIGNoZWNraW5nIHBlcm1pc3Npb25zJyBcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcbn07XG5cbi8qKlxuICogTWlkZGxld2FyZSB0byBjaGVjayBpZiB1c2VyIGhhcyByZXF1aXJlZCByb2xlXG4gKiBAcGFyYW0gcm9sZXMgVGhlIHJvbGVzIHJlcXVpcmVkXG4gKiBAcmV0dXJucyBNaWRkbGV3YXJlIGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBjaGVja1JvbGUgPSAocm9sZXM6IHN0cmluZ1tdKSA9PiB7XG4gIHJldHVybiAocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlLCBuZXh0OiBOZXh0RnVuY3Rpb24pOiB2b2lkID0+IHtcbiAgICB0cnkge1xuICAgICAgLy8gQ2hlY2sgaWYgdXNlciBleGlzdHNcbiAgICAgIGlmICghcmVxLnVzZXIpIHtcbiAgICAgICAgcmVzLnN0YXR1cyg0MDEpLmpzb24oeyBcbiAgICAgICAgICBlcnJvcjogJ0F1dGhlbnRpY2F0aW9uIHJlcXVpcmVkJyxcbiAgICAgICAgICBtZXNzYWdlOiAnVXNlciBub3QgYXV0aGVudGljYXRlZCcgXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIENoZWNrIGlmIHVzZXIgaGFzIHJlcXVpcmVkIHJvbGVcbiAgICAgIGlmICghcm9sZXMuaW5jbHVkZXMocmVxLnVzZXIucm9sZSkpIHtcbiAgICAgICAgcmVzLnN0YXR1cyg0MDMpLmpzb24oeyBcbiAgICAgICAgICBlcnJvcjogJ0luc3VmZmljaWVudCByb2xlJyxcbiAgICAgICAgICBtZXNzYWdlOiBgUmVxdWlyZWQgcm9sZXM6ICR7cm9sZXMuam9pbignLCAnKX1gLFxuICAgICAgICAgIHVzZXJSb2xlOiByZXEudXNlci5yb2xlXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBcbiAgICAgIG5leHQoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignUm9sZSBjaGVjayBlcnJvcjonLCBlcnJvcik7XG4gICAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7IFxuICAgICAgICBlcnJvcjogJ0F1dGhvcml6YXRpb24gZXJyb3InLFxuICAgICAgICBtZXNzYWdlOiAnRXJyb3IgY2hlY2tpbmcgcm9sZScgXG4gICAgICB9KTtcbiAgICB9XG4gIH07XG59OyJdfQ==