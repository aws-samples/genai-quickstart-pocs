"use strict";
/**
 * Tests for AuthService
 */
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = require("../auth-service");
describe('AuthService', () => {
    let authService;
    beforeEach(() => {
        authService = new auth_service_1.AuthService();
    });
    describe('registerUser', () => {
        const validRegistrationRequest = {
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
            const analystRequest = { ...validRegistrationRequest, role: 'analyst' };
            const analystResult = await authService.registerUser(analystRequest);
            expect(analystResult.user.permissions).toContain('user:read');
            expect(analystResult.user.permissions).toContain('idea:read');
            expect(analystResult.user.permissions).toContain('idea:write');
            expect(analystResult.user.permissions).not.toContain('admin:write');
            const adminRequest = {
                ...validRegistrationRequest,
                email: 'admin@example.com',
                role: 'administrator'
            };
            const adminResult = await authService.registerUser(adminRequest);
            expect(adminResult.user.permissions).toContain('admin:write');
            expect(adminResult.user.permissions).toContain('user:write');
            expect(adminResult.user.permissions).toContain('user:delete');
        });
    });
    describe('loginUser', () => {
        const registrationRequest = {
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
            const loginRequest = {
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
            const invalidEmailRequest = {
                email: 'nonexistent@example.com',
                password: registrationRequest.password,
            };
            await expect(authService.loginUser(invalidEmailRequest))
                .rejects.toThrow('Invalid email or password');
        });
        it('should throw error for invalid password', async () => {
            const invalidPasswordRequest = {
                email: registrationRequest.email,
                password: 'WrongPassword123!',
            };
            await expect(authService.loginUser(invalidPasswordRequest))
                .rejects.toThrow('Invalid email or password');
        });
        it('should be case insensitive for email', async () => {
            const uppercaseEmailRequest = {
                email: registrationRequest.email.toUpperCase(),
                password: registrationRequest.password,
            };
            const result = await authService.loginUser(uppercaseEmailRequest);
            expect(result.user.email).toBe(registrationRequest.email.toLowerCase());
        });
    });
    describe('refreshToken', () => {
        let refreshToken;
        beforeEach(async () => {
            const registrationRequest = {
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
            const refreshRequest = {
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
            const invalidRefreshRequest = {
                refreshToken: 'invalid-token',
            };
            await expect(authService.refreshToken(invalidRefreshRequest))
                .rejects.toThrow('Invalid refresh token');
        });
        it('should invalidate old refresh token after use', async () => {
            const refreshRequest = {
                refreshToken,
            };
            await authService.refreshToken(refreshRequest);
            // Try to use the old refresh token again
            await expect(authService.refreshToken(refreshRequest))
                .rejects.toThrow('Invalid refresh token');
        });
    });
    describe('updateUser', () => {
        let userId;
        beforeEach(async () => {
            const registrationRequest = {
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
            const updateRequest = {
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
            const updateRequest = {
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
            const updateRequest = {
                profile: {
                    firstName: 'Updated Name',
                },
            };
            await expect(authService.updateUser('non-existent-id', updateRequest))
                .rejects.toThrow('User not found');
        });
    });
    describe('changePassword', () => {
        let userId;
        const originalPassword = 'Password123!';
        beforeEach(async () => {
            const registrationRequest = {
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
            const changeRequest = {
                currentPassword: originalPassword,
                newPassword: 'NewPassword456!',
            };
            await authService.changePassword(userId, changeRequest);
            // Try to login with new password
            const loginRequest = {
                email: 'password@example.com',
                password: 'NewPassword456!',
            };
            const loginResult = await authService.loginUser(loginRequest);
            expect(loginResult.user.id).toBe(userId);
        });
        it('should throw error for incorrect current password', async () => {
            const changeRequest = {
                currentPassword: 'WrongPassword123!',
                newPassword: 'NewPassword456!',
            };
            await expect(authService.changePassword(userId, changeRequest))
                .rejects.toThrow('Current password is incorrect');
        });
        it('should throw error for weak new password', async () => {
            const changeRequest = {
                currentPassword: originalPassword,
                newPassword: 'weak',
            };
            await expect(authService.changePassword(userId, changeRequest))
                .rejects.toThrow('Password must be at least 8 characters long');
        });
        it('should throw error for non-existent user', async () => {
            const changeRequest = {
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
            const registrationRequest = {
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
            const resetRequest = {
                email: userEmail,
            };
            // Should not throw error even for valid email
            await expect(authService.requestPasswordReset(resetRequest))
                .resolves.not.toThrow();
            // Should not throw error for invalid email either
            const invalidResetRequest = {
                email: 'nonexistent@example.com',
            };
            await expect(authService.requestPasswordReset(invalidResetRequest))
                .resolves.not.toThrow();
        });
        it('should throw error for invalid reset token', async () => {
            const confirmRequest = {
                token: 'invalid-token',
                newPassword: 'NewPassword456!',
            };
            await expect(authService.confirmPasswordReset(confirmRequest))
                .rejects.toThrow('Invalid or expired reset token');
        });
    });
    describe('verifyToken', () => {
        let token;
        beforeEach(async () => {
            const registrationRequest = {
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
        let userId;
        beforeEach(async () => {
            const registrationRequest = {
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
            expect(user.id).toBe(userId);
            expect(user.email).toBe('getuser@example.com');
            expect(user.role).toBe('portfolio-manager');
            expect(user).not.toHaveProperty('passwordHash');
        });
        it('should return null for non-existent user', async () => {
            const user = await authService.getUserById('non-existent-id');
            expect(user).toBeNull();
        });
    });
    describe('logoutUser', () => {
        let userId;
        let refreshToken;
        beforeEach(async () => {
            const registrationRequest = {
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
            const refreshRequest = {
                refreshToken,
            };
            await expect(authService.refreshToken(refreshRequest))
                .rejects.toThrow('Invalid refresh token');
        });
        it('should logout from all devices when no refresh token provided', async () => {
            // Generate another refresh token
            const loginRequest = {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aC1zZXJ2aWNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc2VydmljZXMvX190ZXN0c19fL2F1dGgtc2VydmljZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFFSCxrREFBOEM7QUFXOUMsUUFBUSxDQUFDLGFBQWEsRUFBRSxHQUFHLEVBQUU7SUFDM0IsSUFBSSxXQUF3QixDQUFDO0lBRTdCLFVBQVUsQ0FBQyxHQUFHLEVBQUU7UUFDZCxXQUFXLEdBQUcsSUFBSSwwQkFBVyxFQUFFLENBQUM7SUFDbEMsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsY0FBYyxFQUFFLEdBQUcsRUFBRTtRQUM1QixNQUFNLHdCQUF3QixHQUE0QjtZQUN4RCxLQUFLLEVBQUUsa0JBQWtCO1lBQ3pCLFFBQVEsRUFBRSxjQUFjO1lBQ3hCLFNBQVMsRUFBRSxNQUFNO1lBQ2pCLFFBQVEsRUFBRSxLQUFLO1lBQ2YsY0FBYyxFQUFFLFNBQVM7WUFDekIsSUFBSSxFQUFFLFNBQVM7WUFDZixLQUFLLEVBQUUsZ0JBQWdCO1lBQ3ZCLFVBQVUsRUFBRSxVQUFVO1lBQ3RCLFdBQVcsRUFBRSxhQUFhO1lBQzFCLFFBQVEsRUFBRSxrQkFBa0I7WUFDNUIsUUFBUSxFQUFFLElBQUk7U0FDZixDQUFDO1FBRUYsRUFBRSxDQUFDLHlDQUF5QyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3ZELE1BQU0sTUFBTSxHQUFHLE1BQU0sV0FBVyxDQUFDLFlBQVksQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1lBRXhFLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDdEMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN2QyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsY0FBYyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQzlDLE1B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QUFPLENBQUMsdUJBQXVCLENBQUMsQ0FBQztRQUM5QyxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQywrREFBK0QsRUFBRSxLQUFLLElBQUksRUFBRTtZQUM3RSxpQ0FBaUM7WUFDakMsTUFBTSxZQUFZLEdBQXFCO2dCQUNyQyxLQUFLLEVBQUUsb0JBQW9CO2dCQUMzQixRQUFRLEVBQUUsY0FBYzthQUN6QixDQUFDO1lBQ0YsTUFBTSxXQUFXLEdBQUcsTUFBTSxXQUFXLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzlELE1BQU0sa0JBQWtCLEdBQUcsV0FBVyxDQUFDLFlBQVksQ0FBQztZQUVwRCwwQkFBMEI7WUFDMUIsTUFBTSxXQUFXLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRXJDLHdDQUF3QztZQUN4QyxNQUFNLE1BQU0sQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FBQztpQkFDckQsT0FBTyxDQUFDLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1lBRTVDLE1BQU0sTUFBTSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsRUFBRSxZQUFZLEVBQUUsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDO2lCQUN6RSxPQUFPLENBQUMsT0FBTyxDQUFDLHVCQUF1QixDQUFDLENBQUM7UUFDOUMsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsMENBQTBDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDeEQsTUFBTSxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxpQkFBaUIsRUFBRSxZQUFZLENBQUMsQ0FBQztpQkFDbEUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3ZDLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVGVzdHMgZm9yIEF1dGhTZXJ2aWNlXG4gKi9cblxuaW1wb3J0IHsgQXV0aFNlcnZpY2UgfSBmcm9tICcuLi9hdXRoLXNlcnZpY2UnO1xuaW1wb3J0IHtcbiAgVXNlclJlZ2lzdHJhdGlvblJlcXVlc3QsXG4gIFVzZXJMb2dpblJlcXVlc3QsXG4gIFVzZXJVcGRhdGVSZXF1ZXN0LFxuICBQYXNzd29yZENoYW5nZVJlcXVlc3QsXG4gIFBhc3N3b3JkUmVzZXRSZXF1ZXN0LFxuICBQYXNzd29yZFJlc2V0Q29uZmlybVJlcXVlc3QsXG4gIFJlZnJlc2hUb2tlblJlcXVlc3QsXG59IGZyb20gJy4uLy4uL21vZGVscy91c2VyJztcblxuZGVzY3JpYmUoJ0F1dGhTZXJ2aWNlJywgKCkgPT4ge1xuICBsZXQgYXV0aFNlcnZpY2U6IEF1dGhTZXJ2aWNlO1xuXG4gIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgIGF1dGhTZXJ2aWNlID0gbmV3IEF1dGhTZXJ2aWNlKCk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdyZWdpc3RlclVzZXInLCAoKSA9PiB7XG4gICAgY29uc3QgdmFsaWRSZWdpc3RyYXRpb25SZXF1ZXN0OiBVc2VyUmVnaXN0cmF0aW9uUmVxdWVzdCA9IHtcbiAgICAgIGVtYWlsOiAndGVzdEBleGFtcGxlLmNvbScsXG4gICAgICBwYXNzd29yZDogJ1Bhc3N3b3JkMTIzIScsXG4gICAgICBmaXJzdE5hbWU6ICdKb2huJyxcbiAgICAgIGxhc3ROYW1lOiAnRG9lJyxcbiAgICAgIG9yZ2FuaXphdGlvbklkOiAnb3JnLTEyMycsXG4gICAgICByb2xlOiAnYW5hbHlzdCcsXG4gICAgICB0aXRsZTogJ1NlbmlvciBBbmFseXN0JyxcbiAgICAgIGRlcGFydG1lbnQ6ICdSZXNlYXJjaCcsXG4gICAgICBwaG9uZU51bWJlcjogJysxLTU1NS0wMTIzJyxcbiAgICAgIHRpbWV6b25lOiAnQW1lcmljYS9OZXdfWW9yaycsXG4gICAgICBsYW5ndWFnZTogJ2VuJyxcbiAgICB9O1xuXG4gICAgaXQoJ3Nob3VsZCByZWdpc3RlciBhIG5ldyB1c2VyIHN1Y2Nlc3NmdWxseScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGF1dGhTZXJ2aWNlLnJlZ2lzdGVyVXNlcih2YWxpZFJlZ2lzdHJhdGlvblJlcXVlc3QpO1xuXG4gICAgICBleHBlY3QocmVzdWx0KS50b0hhdmVQcm9wZXJ0eSgndXNlcicpO1xuICAgICAgZXhwZWN0KHJlc3VsdCkudG9IYXZlUHJvcGVydHkoJ3Rva2VuJyk7XG4gICAgICBleHBlY3QocmVzdWx0KS50b0hhdmVQcm9wZXJ0eSgncmVmcmVzaFRva2VuJyk7XG4gICAgICBleHBlY3QocmVzdWx0KS50b0hhdmVQcm9wZXJ0eSgnZXhwaXJlc0luJyk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQudXNlci5lbWFpbCkudG9CZSh2YWxpZFJlZ2lzdHJhdGlvblJlcXVlc3QuZW1haWwudG9Mb3dlckNhc2UoKSk7XG4gICAgICBleHBlY3QocmVzdWx0LnVzZXIucHJvZmlsZS5maXJzdE5hbWUpLnRvQmUodmFsaWRSZWdpc3RyYXRpb25SZXF1ZXN0LmZpcnN0TmFtZSk7XG4gICAgICBleHBlY3QocmVzdWx0LnVzZXIucHJvZmlsZS5sYXN0TmFtZSkudG9CZSh2YWxpZFJlZ2lzdHJhdGlvblJlcXVlc3QubGFzdE5hbWUpO1xuICAgICAgZXhwZWN0KHJlc3VsdC51c2VyLnJvbGUpLnRvQmUodmFsaWRSZWdpc3RyYXRpb25SZXF1ZXN0LnJvbGUpO1xuICAgICAgZXhwZWN0KHJlc3VsdC51c2VyLm9yZ2FuaXphdGlvbklkKS50b0JlKHZhbGlkUmVnaXN0cmF0aW9uUmVxdWVzdC5vcmdhbml6YXRpb25JZCk7XG4gICAgICBleHBlY3QocmVzdWx0LnVzZXIuaXNBY3RpdmUpLnRvQmUodHJ1ZSk7XG4gICAgICBleHBlY3QocmVzdWx0LnVzZXIpLm5vdC50b0hhdmVQcm9wZXJ0eSgncGFzc3dvcmRIYXNoJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHRocm93IGVycm9yIGZvciBkdXBsaWNhdGUgZW1haWwnLCBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBhdXRoU2VydmljZS5yZWdpc3RlclVzZXIodmFsaWRSZWdpc3RyYXRpb25SZXF1ZXN0KTtcblxuICAgICAgYXdhaXQgZXhwZWN0KGF1dGhTZXJ2aWNlLnJlZ2lzdGVyVXNlcih2YWxpZFJlZ2lzdHJhdGlvblJlcXVlc3QpKVxuICAgICAgICAucmVqZWN0cy50b1Rocm93KCdVc2VyIHdpdGggdGhpcyBlbWFpbCBhbHJlYWR5IGV4aXN0cycpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCB0aHJvdyBlcnJvciBmb3Igd2VhayBwYXNzd29yZCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHdlYWtQYXNzd29yZFJlcXVlc3QgPSB7XG4gICAgICAgIC4uLnZhbGlkUmVnaXN0cmF0aW9uUmVxdWVzdCxcbiAgICAgICAgcGFzc3dvcmQ6ICd3ZWFrJyxcbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IGV4cGVjdChhdXRoU2VydmljZS5yZWdpc3RlclVzZXIod2Vha1Bhc3N3b3JkUmVxdWVzdCkpXG4gICAgICAgIC5yZWplY3RzLnRvVGhyb3coJ1Bhc3N3b3JkIG11c3QgYmUgYXQgbGVhc3QgOCBjaGFyYWN0ZXJzIGxvbmcnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgdGhyb3cgZXJyb3IgZm9yIHBhc3N3b3JkIHdpdGhvdXQgdXBwZXJjYXNlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3Qgbm9VcHBlcmNhc2VSZXF1ZXN0ID0ge1xuICAgICAgICAuLi52YWxpZFJlZ2lzdHJhdGlvblJlcXVlc3QsXG4gICAgICAgIHBhc3N3b3JkOiAncGFzc3dvcmQxMjMhJyxcbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IGV4cGVjdChhdXRoU2VydmljZS5yZWdpc3RlclVzZXIobm9VcHBlcmNhc2VSZXF1ZXN0KSlcbiAgICAgICAgLnJlamVjdHMudG9UaHJvdygnUGFzc3dvcmQgbXVzdCBjb250YWluIGF0IGxlYXN0IG9uZSB1cHBlcmNhc2UgbGV0dGVyJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHRocm93IGVycm9yIGZvciBwYXNzd29yZCB3aXRob3V0IGxvd2VyY2FzZScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IG5vTG93ZXJjYXNlUmVxdWVzdCA9IHtcbiAgICAgICAgLi4udmFsaWRSZWdpc3RyYXRpb25SZXF1ZXN0LFxuICAgICAgICBwYXNzd29yZDogJ1BBU1NXT1JEMTIzIScsXG4gICAgICB9O1xuXG4gICAgICBhd2FpdCBleHBlY3QoYXV0aFNlcnZpY2UucmVnaXN0ZXJVc2VyKG5vTG93ZXJjYXNlUmVxdWVzdCkpXG4gICAgICAgIC5yZWplY3RzLnRvVGhyb3coJ1Bhc3N3b3JkIG11c3QgY29udGFpbiBhdCBsZWFzdCBvbmUgbG93ZXJjYXNlIGxldHRlcicpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCB0aHJvdyBlcnJvciBmb3IgcGFzc3dvcmQgd2l0aG91dCBudW1iZXInLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBub051bWJlclJlcXVlc3QgPSB7XG4gICAgICAgIC4uLnZhbGlkUmVnaXN0cmF0aW9uUmVxdWVzdCxcbiAgICAgICAgcGFzc3dvcmQ6ICdQYXNzd29yZCEnLFxuICAgICAgfTtcblxuICAgICAgYXdhaXQgZXhwZWN0KGF1dGhTZXJ2aWNlLnJlZ2lzdGVyVXNlcihub051bWJlclJlcXVlc3QpKVxuICAgICAgICAucmVqZWN0cy50b1Rocm93KCdQYXNzd29yZCBtdXN0IGNvbnRhaW4gYXQgbGVhc3Qgb25lIG51bWJlcicpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCB0aHJvdyBlcnJvciBmb3IgcGFzc3dvcmQgd2l0aG91dCBzcGVjaWFsIGNoYXJhY3RlcicsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IG5vU3BlY2lhbENoYXJSZXF1ZXN0ID0ge1xuICAgICAgICAuLi52YWxpZFJlZ2lzdHJhdGlvblJlcXVlc3QsXG4gICAgICAgIHBhc3N3b3JkOiAnUGFzc3dvcmQxMjMnLFxuICAgICAgfTtcblxuICAgICAgYXdhaXQgZXhwZWN0KGF1dGhTZXJ2aWNlLnJlZ2lzdGVyVXNlcihub1NwZWNpYWxDaGFyUmVxdWVzdCkpXG4gICAgICAgIC5yZWplY3RzLnRvVGhyb3coJ1Bhc3N3b3JkIG11c3QgY29udGFpbiBhdCBsZWFzdCBvbmUgc3BlY2lhbCBjaGFyYWN0ZXInKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYXNzaWduIGNvcnJlY3QgcGVybWlzc2lvbnMgYmFzZWQgb24gcm9sZScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGFuYWx5c3RSZXF1ZXN0ID0geyAuLi52YWxpZFJlZ2lzdHJhdGlvblJlcXVlc3QsIHJvbGU6ICdhbmFseXN0JyBhcyBjb25zdCB9O1xuICAgICAgY29uc3QgYW5hbHlzdFJlc3VsdCA9IGF3YWl0IGF1dGhTZXJ2aWNlLnJlZ2lzdGVyVXNlcihhbmFseXN0UmVxdWVzdCk7XG4gICAgICBcbiAgICAgIGV4cGVjdChhbmFseXN0UmVzdWx0LnVzZXIucGVybWlzc2lvbnMpLnRvQ29udGFpbigndXNlcjpyZWFkJyk7XG4gICAgICBleHBlY3QoYW5hbHlzdFJlc3VsdC51c2VyLnBlcm1pc3Npb25zKS50b0NvbnRhaW4oJ2lkZWE6cmVhZCcpO1xuICAgICAgZXhwZWN0KGFuYWx5c3RSZXN1bHQudXNlci5wZXJtaXNzaW9ucykudG9Db250YWluKCdpZGVhOndyaXRlJyk7XG4gICAgICBleHBlY3QoYW5hbHlzdFJlc3VsdC51c2VyLnBlcm1pc3Npb25zKS5ub3QudG9Db250YWluKCdhZG1pbjp3cml0ZScpO1xuXG4gICAgICBjb25zdCBhZG1pblJlcXVlc3QgPSB7IFxuICAgICAgICAuLi52YWxpZFJlZ2lzdHJhdGlvblJlcXVlc3QsIFxuICAgICAgICBlbWFpbDogJ2FkbWluQGV4YW1wbGUuY29tJyxcbiAgICAgICAgcm9sZTogJ2FkbWluaXN0cmF0b3InIGFzIGNvbnN0IFxuICAgICAgfTtcbiAgICAgIGNvbnN0IGFkbWluUmVzdWx0ID0gYXdhaXQgYXV0aFNlcnZpY2UucmVnaXN0ZXJVc2VyKGFkbWluUmVxdWVzdCk7XG4gICAgICBcbiAgICAgIGV4cGVjdChhZG1pblJlc3VsdC51c2VyLnBlcm1pc3Npb25zKS50b0NvbnRhaW4oJ2FkbWluOndyaXRlJyk7XG4gICAgICBleHBlY3QoYWRtaW5SZXN1bHQudXNlci5wZXJtaXNzaW9ucykudG9Db250YWluKCd1c2VyOndyaXRlJyk7XG4gICAgICBleHBlY3QoYWRtaW5SZXN1bHQudXNlci5wZXJtaXNzaW9ucykudG9Db250YWluKCd1c2VyOmRlbGV0ZScpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnbG9naW5Vc2VyJywgKCkgPT4ge1xuICAgIGNvbnN0IHJlZ2lzdHJhdGlvblJlcXVlc3Q6IFVzZXJSZWdpc3RyYXRpb25SZXF1ZXN0ID0ge1xuICAgICAgZW1haWw6ICdsb2dpbkBleGFtcGxlLmNvbScsXG4gICAgICBwYXNzd29yZDogJ1Bhc3N3b3JkMTIzIScsXG4gICAgICBmaXJzdE5hbWU6ICdKYW5lJyxcbiAgICAgIGxhc3ROYW1lOiAnU21pdGgnLFxuICAgICAgb3JnYW5pemF0aW9uSWQ6ICdvcmctNDU2JyxcbiAgICAgIHJvbGU6ICdwb3J0Zm9saW8tbWFuYWdlcicsXG4gICAgfTtcblxuICAgIGJlZm9yZUVhY2goYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgYXV0aFNlcnZpY2UucmVnaXN0ZXJVc2VyKHJlZ2lzdHJhdGlvblJlcXVlc3QpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBsb2dpbiB1c2VyIHN1Y2Nlc3NmdWxseScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGxvZ2luUmVxdWVzdDogVXNlckxvZ2luUmVxdWVzdCA9IHtcbiAgICAgICAgZW1haWw6IHJlZ2lzdHJhdGlvblJlcXVlc3QuZW1haWwsXG4gICAgICAgIHBhc3N3b3JkOiByZWdpc3RyYXRpb25SZXF1ZXN0LnBhc3N3b3JkLFxuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgYXV0aFNlcnZpY2UubG9naW5Vc2VyKGxvZ2luUmVxdWVzdCk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvSGF2ZVByb3BlcnR5KCd1c2VyJyk7XG4gICAgICBleHBlY3QocmVzdWx0KS50b0hhdmVQcm9wZXJ0eSgndG9rZW4nKTtcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvSGF2ZVByb3BlcnR5KCdyZWZyZXNoVG9rZW4nKTtcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvSGF2ZVByb3BlcnR5KCdleHBpcmVzSW4nKTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC51c2VyLmVtYWlsKS50b0JlKHJlZ2lzdHJhdGlvblJlcXVlc3QuZW1haWwudG9Mb3dlckNhc2UoKSk7XG4gICAgICBleHBlY3QocmVzdWx0LnVzZXIubGFzdExvZ2luQXQpLnRvQmVEZWZpbmVkKCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHRocm93IGVycm9yIGZvciBpbnZhbGlkIGVtYWlsJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgaW52YWxpZEVtYWlsUmVxdWVzdDogVXNlckxvZ2luUmVxdWVzdCA9IHtcbiAgICAgICAgZW1haWw6ICdub25leGlzdGVudEBleGFtcGxlLmNvbScsXG4gICAgICAgIHBhc3N3b3JkOiByZWdpc3RyYXRpb25SZXF1ZXN0LnBhc3N3b3JkLFxuICAgICAgfTtcblxuICAgICAgYXdhaXQgZXhwZWN0KGF1dGhTZXJ2aWNlLmxvZ2luVXNlcihpbnZhbGlkRW1haWxSZXF1ZXN0KSlcbiAgICAgICAgLnJlamVjdHMudG9UaHJvdygnSW52YWxpZCBlbWFpbCBvciBwYXNzd29yZCcpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCB0aHJvdyBlcnJvciBmb3IgaW52YWxpZCBwYXNzd29yZCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGludmFsaWRQYXNzd29yZFJlcXVlc3Q6IFVzZXJMb2dpblJlcXVlc3QgPSB7XG4gICAgICAgIGVtYWlsOiByZWdpc3RyYXRpb25SZXF1ZXN0LmVtYWlsLFxuICAgICAgICBwYXNzd29yZDogJ1dyb25nUGFzc3dvcmQxMjMhJyxcbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IGV4cGVjdChhdXRoU2VydmljZS5sb2dpblVzZXIoaW52YWxpZFBhc3N3b3JkUmVxdWVzdCkpXG4gICAgICAgIC5yZWplY3RzLnRvVGhyb3coJ0ludmFsaWQgZW1haWwgb3IgcGFzc3dvcmQnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYmUgY2FzZSBpbnNlbnNpdGl2ZSBmb3IgZW1haWwnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB1cHBlcmNhc2VFbWFpbFJlcXVlc3Q6IFVzZXJMb2dpblJlcXVlc3QgPSB7XG4gICAgICAgIGVtYWlsOiByZWdpc3RyYXRpb25SZXF1ZXN0LmVtYWlsLnRvVXBwZXJDYXNlKCksXG4gICAgICAgIHBhc3N3b3JkOiByZWdpc3RyYXRpb25SZXF1ZXN0LnBhc3N3b3JkLFxuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgYXV0aFNlcnZpY2UubG9naW5Vc2VyKHVwcGVyY2FzZUVtYWlsUmVxdWVzdCk7XG4gICAgICBleHBlY3QocmVzdWx0LnVzZXIuZW1haWwpLnRvQmUocmVnaXN0cmF0aW9uUmVxdWVzdC5lbWFpbC50b0xvd2VyQ2FzZSgpKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3JlZnJlc2hUb2tlbicsICgpID0+IHtcbiAgICBsZXQgcmVmcmVzaFRva2VuOiBzdHJpbmc7XG5cbiAgICBiZWZvcmVFYWNoKGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlZ2lzdHJhdGlvblJlcXVlc3Q6IFVzZXJSZWdpc3RyYXRpb25SZXF1ZXN0ID0ge1xuICAgICAgICBlbWFpbDogJ3JlZnJlc2hAZXhhbXBsZS5jb20nLFxuICAgICAgICBwYXNzd29yZDogJ1Bhc3N3b3JkMTIzIScsXG4gICAgICAgIGZpcnN0TmFtZTogJ0JvYicsXG4gICAgICAgIGxhc3ROYW1lOiAnSm9obnNvbicsXG4gICAgICAgIG9yZ2FuaXphdGlvbklkOiAnb3JnLTc4OScsXG4gICAgICAgIHJvbGU6ICdjb21wbGlhbmNlLW9mZmljZXInLFxuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgYXV0aFNlcnZpY2UucmVnaXN0ZXJVc2VyKHJlZ2lzdHJhdGlvblJlcXVlc3QpO1xuICAgICAgcmVmcmVzaFRva2VuID0gcmVzdWx0LnJlZnJlc2hUb2tlbjtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcmVmcmVzaCB0b2tlbiBzdWNjZXNzZnVsbHknLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZWZyZXNoUmVxdWVzdDogUmVmcmVzaFRva2VuUmVxdWVzdCA9IHtcbiAgICAgICAgcmVmcmVzaFRva2VuLFxuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgYXV0aFNlcnZpY2UucmVmcmVzaFRva2VuKHJlZnJlc2hSZXF1ZXN0KTtcblxuICAgICAgZXhwZWN0KHJlc3VsdCkudG9IYXZlUHJvcGVydHkoJ3VzZXInKTtcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvSGF2ZVByb3BlcnR5KCd0b2tlbicpO1xuICAgICAgZXhwZWN0KHJlc3VsdCkudG9IYXZlUHJvcGVydHkoJ3JlZnJlc2hUb2tlbicpO1xuICAgICAgZXhwZWN0KHJlc3VsdCkudG9IYXZlUHJvcGVydHkoJ2V4cGlyZXNJbicpO1xuXG4gICAgICAvLyBOZXcgcmVmcmVzaCB0b2tlbiBzaG91bGQgYmUgZGlmZmVyZW50XG4gICAgICBleHBlY3QocmVzdWx0LnJlZnJlc2hUb2tlbikubm90LnRvQmUocmVmcmVzaFRva2VuKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgdGhyb3cgZXJyb3IgZm9yIGludmFsaWQgcmVmcmVzaCB0b2tlbicsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGludmFsaWRSZWZyZXNoUmVxdWVzdDogUmVmcmVzaFRva2VuUmVxdWVzdCA9IHtcbiAgICAgICAgcmVmcmVzaFRva2VuOiAnaW52YWxpZC10b2tlbicsXG4gICAgICB9O1xuXG4gICAgICBhd2FpdCBleHBlY3QoYXV0aFNlcnZpY2UucmVmcmVzaFRva2VuKGludmFsaWRSZWZyZXNoUmVxdWVzdCkpXG4gICAgICAgIC5yZWplY3RzLnRvVGhyb3coJ0ludmFsaWQgcmVmcmVzaCB0b2tlbicpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBpbnZhbGlkYXRlIG9sZCByZWZyZXNoIHRva2VuIGFmdGVyIHVzZScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlZnJlc2hSZXF1ZXN0OiBSZWZyZXNoVG9rZW5SZXF1ZXN0ID0ge1xuICAgICAgICByZWZyZXNoVG9rZW4sXG4gICAgICB9O1xuXG4gICAgICBhd2FpdCBhdXRoU2VydmljZS5yZWZyZXNoVG9rZW4ocmVmcmVzaFJlcXVlc3QpO1xuXG4gICAgICAvLyBUcnkgdG8gdXNlIHRoZSBvbGQgcmVmcmVzaCB0b2tlbiBhZ2FpblxuICAgICAgYXdhaXQgZXhwZWN0KGF1dGhTZXJ2aWNlLnJlZnJlc2hUb2tlbihyZWZyZXNoUmVxdWVzdCkpXG4gICAgICAgIC5yZWplY3RzLnRvVGhyb3coJ0ludmFsaWQgcmVmcmVzaCB0b2tlbicpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgndXBkYXRlVXNlcicsICgpID0+IHtcbiAgICBsZXQgdXNlcklkOiBzdHJpbmc7XG5cbiAgICBiZWZvcmVFYWNoKGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlZ2lzdHJhdGlvblJlcXVlc3Q6IFVzZXJSZWdpc3RyYXRpb25SZXF1ZXN0ID0ge1xuICAgICAgICBlbWFpbDogJ3VwZGF0ZUBleGFtcGxlLmNvbScsXG4gICAgICAgIHBhc3N3b3JkOiAnUGFzc3dvcmQxMjMhJyxcbiAgICAgICAgZmlyc3ROYW1lOiAnQWxpY2UnLFxuICAgICAgICBsYXN0TmFtZTogJ1dpbHNvbicsXG4gICAgICAgIG9yZ2FuaXphdGlvbklkOiAnb3JnLXVwZGF0ZScsXG4gICAgICAgIHJvbGU6ICdhbmFseXN0JyxcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGF1dGhTZXJ2aWNlLnJlZ2lzdGVyVXNlcihyZWdpc3RyYXRpb25SZXF1ZXN0KTtcbiAgICAgIHVzZXJJZCA9IHJlc3VsdC51c2VyLmlkO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCB1cGRhdGUgdXNlciBwcm9maWxlIHN1Y2Nlc3NmdWxseScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHVwZGF0ZVJlcXVlc3Q6IFVzZXJVcGRhdGVSZXF1ZXN0ID0ge1xuICAgICAgICBwcm9maWxlOiB7XG4gICAgICAgICAgZmlyc3ROYW1lOiAnVXBkYXRlZCBBbGljZScsXG4gICAgICAgICAgdGl0bGU6ICdTZW5pb3IgQW5hbHlzdCcsXG4gICAgICAgICAgZGVwYXJ0bWVudDogJ1VwZGF0ZWQgRGVwYXJ0bWVudCcsXG4gICAgICAgIH0sXG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBhdXRoU2VydmljZS51cGRhdGVVc2VyKHVzZXJJZCwgdXBkYXRlUmVxdWVzdCk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQucHJvZmlsZS5maXJzdE5hbWUpLnRvQmUoJ1VwZGF0ZWQgQWxpY2UnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQucHJvZmlsZS50aXRsZSkudG9CZSgnU2VuaW9yIEFuYWx5c3QnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQucHJvZmlsZS5kZXBhcnRtZW50KS50b0JlKCdVcGRhdGVkIERlcGFydG1lbnQnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQucHJvZmlsZS5sYXN0TmFtZSkudG9CZSgnV2lsc29uJyk7IC8vIFNob3VsZCByZW1haW4gdW5jaGFuZ2VkXG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHVwZGF0ZSB1c2VyIHByZWZlcmVuY2VzIHN1Y2Nlc3NmdWxseScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHVwZGF0ZVJlcXVlc3Q6IFVzZXJVcGRhdGVSZXF1ZXN0ID0ge1xuICAgICAgICBwcmVmZXJlbmNlczoge1xuICAgICAgICAgIGludmVzdG1lbnRIb3Jpem9uOiAnbG9uZycsXG4gICAgICAgICAgcmlza1RvbGVyYW5jZTogJ2FnZ3Jlc3NpdmUnLFxuICAgICAgICAgIHByZWZlcnJlZFNlY3RvcnM6IFsndGVjaG5vbG9neScsICdoZWFsdGhjYXJlJ10sXG4gICAgICAgIH0sXG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBhdXRoU2VydmljZS51cGRhdGVVc2VyKHVzZXJJZCwgdXBkYXRlUmVxdWVzdCk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQucHJlZmVyZW5jZXMuaW52ZXN0bWVudEhvcml6b24pLnRvQmUoJ2xvbmcnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQucHJlZmVyZW5jZXMucmlza1RvbGVyYW5jZSkudG9CZSgnYWdncmVzc2l2ZScpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5wcmVmZXJlbmNlcy5wcmVmZXJyZWRTZWN0b3JzKS50b0VxdWFsKFsndGVjaG5vbG9neScsICdoZWFsdGhjYXJlJ10pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCB0aHJvdyBlcnJvciBmb3Igbm9uLWV4aXN0ZW50IHVzZXInLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB1cGRhdGVSZXF1ZXN0OiBVc2VyVXBkYXRlUmVxdWVzdCA9IHtcbiAgICAgICAgcHJvZmlsZToge1xuICAgICAgICAgIGZpcnN0TmFtZTogJ1VwZGF0ZWQgTmFtZScsXG4gICAgICAgIH0sXG4gICAgICB9O1xuXG4gICAgICBhd2FpdCBleHBlY3QoYXV0aFNlcnZpY2UudXBkYXRlVXNlcignbm9uLWV4aXN0ZW50LWlkJywgdXBkYXRlUmVxdWVzdCkpXG4gICAgICAgIC5yZWplY3RzLnRvVGhyb3coJ1VzZXIgbm90IGZvdW5kJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdjaGFuZ2VQYXNzd29yZCcsICgpID0+IHtcbiAgICBsZXQgdXNlcklkOiBzdHJpbmc7XG4gICAgY29uc3Qgb3JpZ2luYWxQYXNzd29yZCA9ICdQYXNzd29yZDEyMyEnO1xuXG4gICAgYmVmb3JlRWFjaChhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZWdpc3RyYXRpb25SZXF1ZXN0OiBVc2VyUmVnaXN0cmF0aW9uUmVxdWVzdCA9IHtcbiAgICAgICAgZW1haWw6ICdwYXNzd29yZEBleGFtcGxlLmNvbScsXG4gICAgICAgIHBhc3N3b3JkOiBvcmlnaW5hbFBhc3N3b3JkLFxuICAgICAgICBmaXJzdE5hbWU6ICdQYXNzd29yZCcsXG4gICAgICAgIGxhc3ROYW1lOiAnVGVzdGVyJyxcbiAgICAgICAgb3JnYW5pemF0aW9uSWQ6ICdvcmctcGFzc3dvcmQnLFxuICAgICAgICByb2xlOiAnYW5hbHlzdCcsXG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBhdXRoU2VydmljZS5yZWdpc3RlclVzZXIocmVnaXN0cmF0aW9uUmVxdWVzdCk7XG4gICAgICB1c2VySWQgPSByZXN1bHQudXNlci5pZDtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgY2hhbmdlIHBhc3N3b3JkIHN1Y2Nlc3NmdWxseScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGNoYW5nZVJlcXVlc3Q6IFBhc3N3b3JkQ2hhbmdlUmVxdWVzdCA9IHtcbiAgICAgICAgY3VycmVudFBhc3N3b3JkOiBvcmlnaW5hbFBhc3N3b3JkLFxuICAgICAgICBuZXdQYXNzd29yZDogJ05ld1Bhc3N3b3JkNDU2IScsXG4gICAgICB9O1xuXG4gICAgICBhd2FpdCBhdXRoU2VydmljZS5jaGFuZ2VQYXNzd29yZCh1c2VySWQsIGNoYW5nZVJlcXVlc3QpO1xuXG4gICAgICAvLyBUcnkgdG8gbG9naW4gd2l0aCBuZXcgcGFzc3dvcmRcbiAgICAgIGNvbnN0IGxvZ2luUmVxdWVzdDogVXNlckxvZ2luUmVxdWVzdCA9IHtcbiAgICAgICAgZW1haWw6ICdwYXNzd29yZEBleGFtcGxlLmNvbScsXG4gICAgICAgIHBhc3N3b3JkOiAnTmV3UGFzc3dvcmQ0NTYhJyxcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGxvZ2luUmVzdWx0ID0gYXdhaXQgYXV0aFNlcnZpY2UubG9naW5Vc2VyKGxvZ2luUmVxdWVzdCk7XG4gICAgICBleHBlY3QobG9naW5SZXN1bHQudXNlci5pZCkudG9CZSh1c2VySWQpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCB0aHJvdyBlcnJvciBmb3IgaW5jb3JyZWN0IGN1cnJlbnQgcGFzc3dvcmQnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBjaGFuZ2VSZXF1ZXN0OiBQYXNzd29yZENoYW5nZVJlcXVlc3QgPSB7XG4gICAgICAgIGN1cnJlbnRQYXNzd29yZDogJ1dyb25nUGFzc3dvcmQxMjMhJyxcbiAgICAgICAgbmV3UGFzc3dvcmQ6ICdOZXdQYXNzd29yZDQ1NiEnLFxuICAgICAgfTtcblxuICAgICAgYXdhaXQgZXhwZWN0KGF1dGhTZXJ2aWNlLmNoYW5nZVBhc3N3b3JkKHVzZXJJZCwgY2hhbmdlUmVxdWVzdCkpXG4gICAgICAgIC5yZWplY3RzLnRvVGhyb3coJ0N1cnJlbnQgcGFzc3dvcmQgaXMgaW5jb3JyZWN0Jyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHRocm93IGVycm9yIGZvciB3ZWFrIG5ldyBwYXNzd29yZCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGNoYW5nZVJlcXVlc3Q6IFBhc3N3b3JkQ2hhbmdlUmVxdWVzdCA9IHtcbiAgICAgICAgY3VycmVudFBhc3N3b3JkOiBvcmlnaW5hbFBhc3N3b3JkLFxuICAgICAgICBuZXdQYXNzd29yZDogJ3dlYWsnLFxuICAgICAgfTtcblxuICAgICAgYXdhaXQgZXhwZWN0KGF1dGhTZXJ2aWNlLmNoYW5nZVBhc3N3b3JkKHVzZXJJZCwgY2hhbmdlUmVxdWVzdCkpXG4gICAgICAgIC5yZWplY3RzLnRvVGhyb3coJ1Bhc3N3b3JkIG11c3QgYmUgYXQgbGVhc3QgOCBjaGFyYWN0ZXJzIGxvbmcnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgdGhyb3cgZXJyb3IgZm9yIG5vbi1leGlzdGVudCB1c2VyJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgY2hhbmdlUmVxdWVzdDogUGFzc3dvcmRDaGFuZ2VSZXF1ZXN0ID0ge1xuICAgICAgICBjdXJyZW50UGFzc3dvcmQ6IG9yaWdpbmFsUGFzc3dvcmQsXG4gICAgICAgIG5ld1Bhc3N3b3JkOiAnTmV3UGFzc3dvcmQ0NTYhJyxcbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IGV4cGVjdChhdXRoU2VydmljZS5jaGFuZ2VQYXNzd29yZCgnbm9uLWV4aXN0ZW50LWlkJywgY2hhbmdlUmVxdWVzdCkpXG4gICAgICAgIC5yZWplY3RzLnRvVGhyb3coJ1VzZXIgbm90IGZvdW5kJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdwYXNzd29yZFJlc2V0JywgKCkgPT4ge1xuICAgIGNvbnN0IHVzZXJFbWFpbCA9ICdyZXNldEBleGFtcGxlLmNvbSc7XG5cbiAgICBiZWZvcmVFYWNoKGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlZ2lzdHJhdGlvblJlcXVlc3Q6IFVzZXJSZWdpc3RyYXRpb25SZXF1ZXN0ID0ge1xuICAgICAgICBlbWFpbDogdXNlckVtYWlsLFxuICAgICAgICBwYXNzd29yZDogJ1Bhc3N3b3JkMTIzIScsXG4gICAgICAgIGZpcnN0TmFtZTogJ1Jlc2V0JyxcbiAgICAgICAgbGFzdE5hbWU6ICdVc2VyJyxcbiAgICAgICAgb3JnYW5pemF0aW9uSWQ6ICdvcmctcmVzZXQnLFxuICAgICAgICByb2xlOiAnYW5hbHlzdCcsXG4gICAgICB9O1xuXG4gICAgICBhd2FpdCBhdXRoU2VydmljZS5yZWdpc3RlclVzZXIocmVnaXN0cmF0aW9uUmVxdWVzdCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJlcXVlc3QgcGFzc3dvcmQgcmVzZXQgd2l0aG91dCByZXZlYWxpbmcgdXNlciBleGlzdGVuY2UnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXNldFJlcXVlc3Q6IFBhc3N3b3JkUmVzZXRSZXF1ZXN0ID0ge1xuICAgICAgICBlbWFpbDogdXNlckVtYWlsLFxuICAgICAgfTtcblxuICAgICAgLy8gU2hvdWxkIG5vdCB0aHJvdyBlcnJvciBldmVuIGZvciB2YWxpZCBlbWFpbFxuICAgICAgYXdhaXQgZXhwZWN0KGF1dGhTZXJ2aWNlLnJlcXVlc3RQYXNzd29yZFJlc2V0KHJlc2V0UmVxdWVzdCkpXG4gICAgICAgIC5yZXNvbHZlcy5ub3QudG9UaHJvdygpO1xuXG4gICAgICAvLyBTaG91bGQgbm90IHRocm93IGVycm9yIGZvciBpbnZhbGlkIGVtYWlsIGVpdGhlclxuICAgICAgY29uc3QgaW52YWxpZFJlc2V0UmVxdWVzdDogUGFzc3dvcmRSZXNldFJlcXVlc3QgPSB7XG4gICAgICAgIGVtYWlsOiAnbm9uZXhpc3RlbnRAZXhhbXBsZS5jb20nLFxuICAgICAgfTtcblxuICAgICAgYXdhaXQgZXhwZWN0KGF1dGhTZXJ2aWNlLnJlcXVlc3RQYXNzd29yZFJlc2V0KGludmFsaWRSZXNldFJlcXVlc3QpKVxuICAgICAgICAucmVzb2x2ZXMubm90LnRvVGhyb3coKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgdGhyb3cgZXJyb3IgZm9yIGludmFsaWQgcmVzZXQgdG9rZW4nLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBjb25maXJtUmVxdWVzdDogUGFzc3dvcmRSZXNldENvbmZpcm1SZXF1ZXN0ID0ge1xuICAgICAgICB0b2tlbjogJ2ludmFsaWQtdG9rZW4nLFxuICAgICAgICBuZXdQYXNzd29yZDogJ05ld1Bhc3N3b3JkNDU2IScsXG4gICAgICB9O1xuXG4gICAgICBhd2FpdCBleHBlY3QoYXV0aFNlcnZpY2UuY29uZmlybVBhc3N3b3JkUmVzZXQoY29uZmlybVJlcXVlc3QpKVxuICAgICAgICAucmVqZWN0cy50b1Rocm93KCdJbnZhbGlkIG9yIGV4cGlyZWQgcmVzZXQgdG9rZW4nKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3ZlcmlmeVRva2VuJywgKCkgPT4ge1xuICAgIGxldCB0b2tlbjogc3RyaW5nO1xuXG4gICAgYmVmb3JlRWFjaChhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZWdpc3RyYXRpb25SZXF1ZXN0OiBVc2VyUmVnaXN0cmF0aW9uUmVxdWVzdCA9IHtcbiAgICAgICAgZW1haWw6ICd2ZXJpZnlAZXhhbXBsZS5jb20nLFxuICAgICAgICBwYXNzd29yZDogJ1Bhc3N3b3JkMTIzIScsXG4gICAgICAgIGZpcnN0TmFtZTogJ1ZlcmlmeScsXG4gICAgICAgIGxhc3ROYW1lOiAnVXNlcicsXG4gICAgICAgIG9yZ2FuaXphdGlvbklkOiAnb3JnLXZlcmlmeScsXG4gICAgICAgIHJvbGU6ICdhZG1pbmlzdHJhdG9yJyxcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGF1dGhTZXJ2aWNlLnJlZ2lzdGVyVXNlcihyZWdpc3RyYXRpb25SZXF1ZXN0KTtcbiAgICAgIHRva2VuID0gcmVzdWx0LnRva2VuO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCB2ZXJpZnkgdmFsaWQgdG9rZW4gc3VjY2Vzc2Z1bGx5JywgKCkgPT4ge1xuICAgICAgY29uc3QgZGVjb2RlZCA9IGF1dGhTZXJ2aWNlLnZlcmlmeVRva2VuKHRva2VuKTtcblxuICAgICAgZXhwZWN0KGRlY29kZWQpLnRvSGF2ZVByb3BlcnR5KCd1c2VySWQnKTtcbiAgICAgIGV4cGVjdChkZWNvZGVkKS50b0hhdmVQcm9wZXJ0eSgnb3JnYW5pemF0aW9uSWQnKTtcbiAgICAgIGV4cGVjdChkZWNvZGVkKS50b0hhdmVQcm9wZXJ0eSgncm9sZScpO1xuICAgICAgZXhwZWN0KGRlY29kZWQpLnRvSGF2ZVByb3BlcnR5KCdwZXJtaXNzaW9ucycpO1xuXG4gICAgICBleHBlY3QoZGVjb2RlZC5vcmdhbml6YXRpb25JZCkudG9CZSgnb3JnLXZlcmlmeScpO1xuICAgICAgZXhwZWN0KGRlY29kZWQucm9sZSkudG9CZSgnYWRtaW5pc3RyYXRvcicpO1xuICAgICAgZXhwZWN0KGRlY29kZWQucGVybWlzc2lvbnMpLnRvQ29udGFpbignYWRtaW46d3JpdGUnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgdGhyb3cgZXJyb3IgZm9yIGludmFsaWQgdG9rZW4nLCAoKSA9PiB7XG4gICAgICBleHBlY3QoKCkgPT4gYXV0aFNlcnZpY2UudmVyaWZ5VG9rZW4oJ2ludmFsaWQtdG9rZW4nKSlcbiAgICAgICAgLnRvVGhyb3coJ0ludmFsaWQgdG9rZW4nKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgdGhyb3cgZXJyb3IgZm9yIG1hbGZvcm1lZCB0b2tlbicsICgpID0+IHtcbiAgICAgIGV4cGVjdCgoKSA9PiBhdXRoU2VydmljZS52ZXJpZnlUb2tlbignbm90LmEuand0JykpXG4gICAgICAgIC50b1Rocm93KCdJbnZhbGlkIHRva2VuJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdnZXRVc2VyQnlJZCcsICgpID0+IHtcbiAgICBsZXQgdXNlcklkOiBzdHJpbmc7XG5cbiAgICBiZWZvcmVFYWNoKGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlZ2lzdHJhdGlvblJlcXVlc3Q6IFVzZXJSZWdpc3RyYXRpb25SZXF1ZXN0ID0ge1xuICAgICAgICBlbWFpbDogJ2dldHVzZXJAZXhhbXBsZS5jb20nLFxuICAgICAgICBwYXNzd29yZDogJ1Bhc3N3b3JkMTIzIScsXG4gICAgICAgIGZpcnN0TmFtZTogJ0dldCcsXG4gICAgICAgIGxhc3ROYW1lOiAnVXNlcicsXG4gICAgICAgIG9yZ2FuaXphdGlvbklkOiAnb3JnLWdldCcsXG4gICAgICAgIHJvbGU6ICdwb3J0Zm9saW8tbWFuYWdlcicsXG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBhdXRoU2VydmljZS5yZWdpc3RlclVzZXIocmVnaXN0cmF0aW9uUmVxdWVzdCk7XG4gICAgICB1c2VySWQgPSByZXN1bHQudXNlci5pZDtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgZ2V0IHVzZXIgYnkgSUQgc3VjY2Vzc2Z1bGx5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdXNlciA9IGF3YWl0IGF1dGhTZXJ2aWNlLmdldFVzZXJCeUlkKHVzZXJJZCk7XG5cbiAgICAgIGV4cGVjdCh1c2VyKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHVzZXIhLmlkKS50b0JlKHVzZXJJZCk7XG4gICAgICBleHBlY3QodXNlciEuZW1haWwpLnRvQmUoJ2dldHVzZXJAZXhhbXBsZS5jb20nKTtcbiAgICAgIGV4cGVjdCh1c2VyIS5yb2xlKS50b0JlKCdwb3J0Zm9saW8tbWFuYWdlcicpO1xuICAgICAgZXhwZWN0KHVzZXIpLm5vdC50b0hhdmVQcm9wZXJ0eSgncGFzc3dvcmRIYXNoJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiBudWxsIGZvciBub24tZXhpc3RlbnQgdXNlcicsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHVzZXIgPSBhd2FpdCBhdXRoU2VydmljZS5nZXRVc2VyQnlJZCgnbm9uLWV4aXN0ZW50LWlkJyk7XG4gICAgICBleHBlY3QodXNlcikudG9CZU51bGwoKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2xvZ291dFVzZXInLCAoKSA9PiB7XG4gICAgbGV0IHVzZXJJZDogc3RyaW5nO1xuICAgIGxldCByZWZyZXNoVG9rZW46IHN0cmluZztcblxuICAgIGJlZm9yZUVhY2goYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVnaXN0cmF0aW9uUmVxdWVzdDogVXNlclJlZ2lzdHJhdGlvblJlcXVlc3QgPSB7XG4gICAgICAgIGVtYWlsOiAnbG9nb3V0QGV4YW1wbGUuY29tJyxcbiAgICAgICAgcGFzc3dvcmQ6ICdQYXNzd29yZDEyMyEnLFxuICAgICAgICBmaXJzdE5hbWU6ICdMb2dvdXQnLFxuICAgICAgICBsYXN0TmFtZTogJ1VzZXInLFxuICAgICAgICBvcmdhbml6YXRpb25JZDogJ29yZy1sb2dvdXQnLFxuICAgICAgICByb2xlOiAnYW5hbHlzdCcsXG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBhdXRoU2VydmljZS5yZWdpc3RlclVzZXIocmVnaXN0cmF0aW9uUmVxdWVzdCk7XG4gICAgICB1c2VySWQgPSByZXN1bHQudXNlci5pZDtcbiAgICAgIHJlZnJlc2hUb2tlbiA9IHJlc3VsdC5yZWZyZXNoVG9rZW47XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGxvZ291dCB1c2VyIHN1Y2Nlc3NmdWxseScsIGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IGF1dGhTZXJ2aWNlLmxvZ291dFVzZXIodXNlcklkLCByZWZyZXNoVG9rZW4pO1xuXG4gICAgICAvLyBUcnkgdG8gdXNlIHRoZSByZWZyZXNoIHRva2VuIC0gc2hvdWxkIGZhaWxcbiAgICAgIGNvbnN0IHJlZnJlc2hSZXF1ZXN0OiBSZWZyZXNoVG9rZW5SZXF1ZXN0ID0ge1xuICAgICAgICByZWZyZXNoVG9rZW4sXG4gICAgICB9O1xuXG4gICAgICBhd2FpdCBleHBlY3QoYXV0aFNlcnZpY2UucmVmcmVzaFRva2VuKHJlZnJlc2hSZXF1ZXN0KSlcbiAgICAgICAgLnJlamVjdHMudG9UaHJvdygnSW52YWxpZCByZWZyZXNoIHRva2VuJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGxvZ291dCBmcm9tIGFsbCBkZXZpY2VzIHdoZW4gbm8gcmVmcmVzaCB0b2tlbiBwcm92aWRlZCcsIGFzeW5jICgpID0+IHtcbiAgICAgIC8vIEdlbmVyYXRlIGFub3RoZXIgcmVmcmVzaCB0b2tlblxuICAgICAgY29uc3QgbG9naW5SZXF1ZXN0OiBVc2VyTG9naW5SZXF1ZXN0ID0ge1xuICAgICAgICBlbWFpbDogJ2xvZ291dEBleGFtcGxlLmNvbScsXG4gICAgICAgIHBhc3N3b3JkOiAnUGFzc3dvcmQxMjMhJyxcbiAgICAgIH07XG4gICAgICBjb25zdCBsb2dpblJlc3VsdCA9IGF3YWl0IGF1dGhTZXJ2aWNlLmxvZ2luVXNlcihsb2dpblJlcXVlc3QpO1xuICAgICAgY29uc3Qgc2Vjb25kUmVmcmVzaFRva2VuID0gbG9naW5SZXN1bHQucmVmcmVzaFRva2VuO1xuXG4gICAgICAvLyBMb2dvdXQgZnJvbSBhbGwgZGV2aWNlc1xuICAgICAgYXdhaXQgYXV0aFNlcnZpY2UubG9nb3V0VXNlcih1c2VySWQpO1xuXG4gICAgICAvLyBCb3RoIHJlZnJlc2ggdG9rZW5zIHNob3VsZCBiZSBpbnZhbGlkXG4gICAgICBhd2FpdCBleHBlY3QoYXV0aFNlcnZpY2UucmVmcmVzaFRva2VuKHsgcmVmcmVzaFRva2VuIH0pKVxuICAgICAgICAucmVqZWN0cy50b1Rocm93KCdJbnZhbGlkIHJlZnJlc2ggdG9rZW4nKTtcblxuICAgICAgYXdhaXQgZXhwZWN0KGF1dGhTZXJ2aWNlLnJlZnJlc2hUb2tlbih7IHJlZnJlc2hUb2tlbjogc2Vjb25kUmVmcmVzaFRva2VuIH0pKVxuICAgICAgICAucmVqZWN0cy50b1Rocm93KCdJbnZhbGlkIHJlZnJlc2ggdG9rZW4nKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgdGhyb3cgZXJyb3IgZm9yIG5vbi1leGlzdGVudCB1c2VyJywgYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgZXhwZWN0KGF1dGhTZXJ2aWNlLmxvZ291dFVzZXIoJ25vbi1leGlzdGVudC1pZCcsIHJlZnJlc2hUb2tlbikpXG4gICAgICAgIC5yZWplY3RzLnRvVGhyb3coJ1VzZXIgbm90IGZvdW5kJyk7XG4gICAgfSk7XG4gIH0pO1xufSk7Il19