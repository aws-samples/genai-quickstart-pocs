"use strict";
/**
 * Example demonstrating user authentication and profile management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.demonstrateRoleBasedAccess = exports.demonstrateAuthentication = void 0;
const auth_service_1 = require("../services/auth-service");
async function demonstrateAuthentication() {
    console.log('=== Investment AI Agent - Authentication Demo ===\n');
    try {
        // 1. Register a new user
        console.log('1. Registering a new user...');
        const registrationRequest = {
            email: 'demo.analyst@investmentfirm.com',
            password: 'SecurePassword123!',
            firstName: 'Demo',
            lastName: 'Analyst',
            organizationId: 'investment-firm-001',
            role: 'analyst',
            title: 'Senior Investment Analyst',
            department: 'Research & Analysis',
            phoneNumber: '+1-555-0123',
            timezone: 'America/New_York',
            language: 'en',
        };
        const registrationResult = await auth_service_1.authService.registerUser(registrationRequest);
        console.log('✅ User registered successfully');
        console.log(`   User ID: ${registrationResult.user.id}`);
        console.log(`   Email: ${registrationResult.user.email}`);
        console.log(`   Role: ${registrationResult.user.role}`);
        console.log(`   Permissions: ${registrationResult.user.permissions.join(', ')}`);
        console.log(`   Token expires in: ${registrationResult.expiresIn} seconds\n`);
        // 2. Login with the registered user
        console.log('2. Logging in with registered user...');
        const loginRequest = {
            email: registrationRequest.email,
            password: registrationRequest.password,
        };
        const loginResult = await auth_service_1.authService.loginUser(loginRequest);
        console.log('✅ Login successful');
        console.log(`   Last login: ${loginResult.user.lastLoginAt}\n`);
        // 3. Get user profile
        console.log('3. Retrieving user profile...');
        const userProfile = await auth_service_1.authService.getUserById(loginResult.user.id);
        if (userProfile) {
            console.log('✅ Profile retrieved successfully');
            console.log(`   Name: ${userProfile.profile.firstName} ${userProfile.profile.lastName}`);
            console.log(`   Title: ${userProfile.profile.title}`);
            console.log(`   Department: ${userProfile.profile.department}`);
            console.log(`   Investment Horizon: ${userProfile.preferences.investmentHorizon}`);
            console.log(`   Risk Tolerance: ${userProfile.preferences.riskTolerance}`);
            console.log(`   Email Notifications: ${userProfile.preferences.notificationSettings.email}`);
            console.log(`   Notification Frequency: ${userProfile.preferences.notificationSettings.frequency}\n`);
        }
        // 4. Update user profile and preferences
        console.log('4. Updating user profile and preferences...');
        const updateRequest = {
            profile: {
                title: 'Lead Investment Analyst',
                department: 'Advanced Research Division',
                phoneNumber: '+1-555-0456',
            },
            preferences: {
                investmentHorizon: 'long',
                riskTolerance: 'moderate',
                preferredSectors: ['technology', 'healthcare', 'renewable-energy'],
                preferredAssetClasses: ['stocks', 'etfs'],
                excludedInvestments: ['tobacco', 'weapons'],
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
            },
        };
        const updatedUser = await auth_service_1.authService.updateUser(loginResult.user.id, updateRequest);
        console.log('✅ Profile updated successfully');
        console.log(`   New title: ${updatedUser.profile.title}`);
        console.log(`   New department: ${updatedUser.profile.department}`);
        console.log(`   Investment horizon: ${updatedUser.preferences.investmentHorizon}`);
        console.log(`   Preferred sectors: ${updatedUser.preferences.preferredSectors.join(', ')}`);
        console.log(`   Excluded investments: ${updatedUser.preferences.excludedInvestments.join(', ')}\n`);
        // 5. Verify JWT token
        console.log('5. Verifying JWT token...');
        const tokenPayload = auth_service_1.authService.verifyToken(loginResult.token);
        console.log('✅ Token verified successfully');
        console.log(`   User ID: ${tokenPayload.userId}`);
        console.log(`   Organization: ${tokenPayload.organizationId}`);
        console.log(`   Role: ${tokenPayload.role}`);
        console.log(`   Permissions: ${tokenPayload.permissions.join(', ')}\n`);
        // 6. Refresh access token
        console.log('6. Refreshing access token...');
        const refreshResult = await auth_service_1.authService.refreshToken({
            refreshToken: loginResult.refreshToken,
        });
        console.log('✅ Token refreshed successfully');
        console.log(`   New token expires in: ${refreshResult.expiresIn} seconds\n`);
        // 7. Change password
        console.log('7. Changing user password...');
        const passwordChangeRequest = {
            currentPassword: registrationRequest.password,
            newPassword: 'NewSecurePassword456!',
        };
        await auth_service_1.authService.changePassword(loginResult.user.id, passwordChangeRequest);
        console.log('✅ Password changed successfully\n');
        // 8. Test login with new password
        console.log('8. Testing login with new password...');
        const newLoginRequest = {
            email: registrationRequest.email,
            password: 'NewSecurePassword456!',
        };
        const newLoginResult = await auth_service_1.authService.loginUser(newLoginRequest);
        console.log('✅ Login with new password successful\n');
        // 9. Logout user
        console.log('9. Logging out user...');
        await auth_service_1.authService.logoutUser(newLoginResult.user.id, newLoginResult.refreshToken);
        console.log('✅ User logged out successfully\n');
        // 10. Try to use invalidated refresh token
        console.log('10. Testing invalidated refresh token...');
        try {
            await auth_service_1.authService.refreshToken({
                refreshToken: newLoginResult.refreshToken,
            });
            console.log('❌ This should not succeed');
        }
        catch (error) {
            console.log('✅ Refresh token correctly invalidated after logout');
            console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
        }
        console.log('=== Authentication Demo Completed Successfully ===');
    }
    catch (error) {
        console.error('❌ Demo failed:', error instanceof Error ? error.message : 'Unknown error');
    }
}
exports.demonstrateAuthentication = demonstrateAuthentication;
async function demonstrateRoleBasedAccess() {
    console.log('\n=== Role-Based Access Control Demo ===\n');
    try {
        // Create users with different roles
        const roles = ['analyst', 'portfolio-manager', 'compliance-officer', 'administrator'];
        for (const role of roles) {
            console.log(`Creating ${role}...`);
            const registrationRequest = {
                email: `${role}@investmentfirm.com`,
                password: 'Password123!',
                firstName: role.charAt(0).toUpperCase() + role.slice(1),
                lastName: 'User',
                organizationId: 'investment-firm-001',
                role,
            };
            const result = await auth_service_1.authService.registerUser(registrationRequest);
            console.log(`✅ ${role} created with permissions:`);
            console.log(`   ${result.user.permissions.join(', ')}\n`);
        }
        console.log('=== Role-Based Access Demo Completed ===');
    }
    catch (error) {
        console.error('❌ Role demo failed:', error instanceof Error ? error.message : 'Unknown error');
    }
}
exports.demonstrateRoleBasedAccess = demonstrateRoleBasedAccess;
// Run the demonstrations
if (require.main === module) {
    demonstrateAuthentication()
        .then(() => demonstrateRoleBasedAccess())
        .catch(console.error);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aC1leGFtcGxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4YW1wbGVzL2F1dGgtZXhhbXBsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7OztBQUVILDJEQUF1RDtBQVF2RCxLQUFLLFVBQVUseUJBQXlCO0lBQ3RDLE9BQU8sQ0FBQyxHQUFHLENBQUMscURBQXFELENBQUMsQ0FBQztJQUVuRSxJQUFJO1FBQ0YseUJBQXlCO1FBQ3pCLE9BQU8sQ0FBQyxHQUFHLENBQUMsOEJBQThCLENBQUMsQ0FBQztRQUM1QyxNQUFNLG1CQUFtQixHQUE0QjtZQUNuRCxLQUFLLEVBQUUsaUNBQWlDO1lBQ3hDLFFBQVEsRUFBRSxvQkFBb0I7WUFDOUIsU0FBUyxFQUFFLE1BQU07WUFDakIsUUFBUSxFQUFFLFNBQVM7WUFDbkIsY0FBYyxFQUFFLHFCQUFxQjtZQUNyQyxJQUFJLEVBQUUsU0FBUztZQUNmLEtBQUssRUFBRSwyQkFBMkI7WUFDbEMsVUFBVSxFQUFFLHFCQUFxQjtZQUNqQyxXQUFXLEVBQUUsYUFBYTtZQUMxQixRQUFRLEVBQUUsa0JBQWtCO1lBQzVCLFFBQVEsRUFBRSxJQUFJO1NBQ2YsQ0FBQztRQUVGLE1BQU0sa0JBQWtCLEdBQUcsTUFBTSwwQkFBVyxDQUFDLFlBQVksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQy9FLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztRQUM5QyxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsa0JBQWtCLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDekQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLGtCQUFrQixDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQzFELE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUN4RCxPQUFPLENB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QUFDLDBCQUEwQixFQUFFLENBQUM7U0FDeEMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztDQUN6QiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogRXhhbXBsZSBkZW1vbnN0cmF0aW5nIHVzZXIgYXV0aGVudGljYXRpb24gYW5kIHByb2ZpbGUgbWFuYWdlbWVudFxuICovXG5cbmltcG9ydCB7IGF1dGhTZXJ2aWNlIH0gZnJvbSAnLi4vc2VydmljZXMvYXV0aC1zZXJ2aWNlJztcbmltcG9ydCB7XG4gIFVzZXJSZWdpc3RyYXRpb25SZXF1ZXN0LFxuICBVc2VyTG9naW5SZXF1ZXN0LFxuICBVc2VyVXBkYXRlUmVxdWVzdCxcbiAgUGFzc3dvcmRDaGFuZ2VSZXF1ZXN0LFxufSBmcm9tICcuLi9tb2RlbHMvdXNlcic7XG5cbmFzeW5jIGZ1bmN0aW9uIGRlbW9uc3RyYXRlQXV0aGVudGljYXRpb24oKSB7XG4gIGNvbnNvbGUubG9nKCc9PT0gSW52ZXN0bWVudCBBSSBBZ2VudCAtIEF1dGhlbnRpY2F0aW9uIERlbW8gPT09XFxuJyk7XG5cbiAgdHJ5IHtcbiAgICAvLyAxLiBSZWdpc3RlciBhIG5ldyB1c2VyXG4gICAgY29uc29sZS5sb2coJzEuIFJlZ2lzdGVyaW5nIGEgbmV3IHVzZXIuLi4nKTtcbiAgICBjb25zdCByZWdpc3RyYXRpb25SZXF1ZXN0OiBVc2VyUmVnaXN0cmF0aW9uUmVxdWVzdCA9IHtcbiAgICAgIGVtYWlsOiAnZGVtby5hbmFseXN0QGludmVzdG1lbnRmaXJtLmNvbScsXG4gICAgICBwYXNzd29yZDogJ1NlY3VyZVBhc3N3b3JkMTIzIScsXG4gICAgICBmaXJzdE5hbWU6ICdEZW1vJyxcbiAgICAgIGxhc3ROYW1lOiAnQW5hbHlzdCcsXG4gICAgICBvcmdhbml6YXRpb25JZDogJ2ludmVzdG1lbnQtZmlybS0wMDEnLFxuICAgICAgcm9sZTogJ2FuYWx5c3QnLFxuICAgICAgdGl0bGU6ICdTZW5pb3IgSW52ZXN0bWVudCBBbmFseXN0JyxcbiAgICAgIGRlcGFydG1lbnQ6ICdSZXNlYXJjaCAmIEFuYWx5c2lzJyxcbiAgICAgIHBob25lTnVtYmVyOiAnKzEtNTU1LTAxMjMnLFxuICAgICAgdGltZXpvbmU6ICdBbWVyaWNhL05ld19Zb3JrJyxcbiAgICAgIGxhbmd1YWdlOiAnZW4nLFxuICAgIH07XG5cbiAgICBjb25zdCByZWdpc3RyYXRpb25SZXN1bHQgPSBhd2FpdCBhdXRoU2VydmljZS5yZWdpc3RlclVzZXIocmVnaXN0cmF0aW9uUmVxdWVzdCk7XG4gICAgY29uc29sZS5sb2coJ+KchSBVc2VyIHJlZ2lzdGVyZWQgc3VjY2Vzc2Z1bGx5Jyk7XG4gICAgY29uc29sZS5sb2coYCAgIFVzZXIgSUQ6ICR7cmVnaXN0cmF0aW9uUmVzdWx0LnVzZXIuaWR9YCk7XG4gICAgY29uc29sZS5sb2coYCAgIEVtYWlsOiAke3JlZ2lzdHJhdGlvblJlc3VsdC51c2VyLmVtYWlsfWApO1xuICAgIGNvbnNvbGUubG9nKGAgICBSb2xlOiAke3JlZ2lzdHJhdGlvblJlc3VsdC51c2VyLnJvbGV9YCk7XG4gICAgY29uc29sZS5sb2coYCAgIFBlcm1pc3Npb25zOiAke3JlZ2lzdHJhdGlvblJlc3VsdC51c2VyLnBlcm1pc3Npb25zLmpvaW4oJywgJyl9YCk7XG4gICAgY29uc29sZS5sb2coYCAgIFRva2VuIGV4cGlyZXMgaW46ICR7cmVnaXN0cmF0aW9uUmVzdWx0LmV4cGlyZXNJbn0gc2Vjb25kc1xcbmApO1xuXG4gICAgLy8gMi4gTG9naW4gd2l0aCB0aGUgcmVnaXN0ZXJlZCB1c2VyXG4gICAgY29uc29sZS5sb2coJzIuIExvZ2dpbmcgaW4gd2l0aCByZWdpc3RlcmVkIHVzZXIuLi4nKTtcbiAgICBjb25zdCBsb2dpblJlcXVlc3Q6IFVzZXJMb2dpblJlcXVlc3QgPSB7XG4gICAgICBlbWFpbDogcmVnaXN0cmF0aW9uUmVxdWVzdC5lbWFpbCxcbiAgICAgIHBhc3N3b3JkOiByZWdpc3RyYXRpb25SZXF1ZXN0LnBhc3N3b3JkLFxuICAgIH07XG5cbiAgICBjb25zdCBsb2dpblJlc3VsdCA9IGF3YWl0IGF1dGhTZXJ2aWNlLmxvZ2luVXNlcihsb2dpblJlcXVlc3QpO1xuICAgIGNvbnNvbGUubG9nKCfinIUgTG9naW4gc3VjY2Vzc2Z1bCcpO1xuICAgIGNvbnNvbGUubG9nKGAgICBMYXN0IGxvZ2luOiAke2xvZ2luUmVzdWx0LnVzZXIubGFzdExvZ2luQXR9XFxuYCk7XG5cbiAgICAvLyAzLiBHZXQgdXNlciBwcm9maWxlXG4gICAgY29uc29sZS5sb2coJzMuIFJldHJpZXZpbmcgdXNlciBwcm9maWxlLi4uJyk7XG4gICAgY29uc3QgdXNlclByb2ZpbGUgPSBhd2FpdCBhdXRoU2VydmljZS5nZXRVc2VyQnlJZChsb2dpblJlc3VsdC51c2VyLmlkKTtcbiAgICBpZiAodXNlclByb2ZpbGUpIHtcbiAgICAgIGNvbnNvbGUubG9nKCfinIUgUHJvZmlsZSByZXRyaWV2ZWQgc3VjY2Vzc2Z1bGx5Jyk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgTmFtZTogJHt1c2VyUHJvZmlsZS5wcm9maWxlLmZpcnN0TmFtZX0gJHt1c2VyUHJvZmlsZS5wcm9maWxlLmxhc3ROYW1lfWApO1xuICAgICAgY29uc29sZS5sb2coYCAgIFRpdGxlOiAke3VzZXJQcm9maWxlLnByb2ZpbGUudGl0bGV9YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgRGVwYXJ0bWVudDogJHt1c2VyUHJvZmlsZS5wcm9maWxlLmRlcGFydG1lbnR9YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgSW52ZXN0bWVudCBIb3Jpem9uOiAke3VzZXJQcm9maWxlLnByZWZlcmVuY2VzLmludmVzdG1lbnRIb3Jpem9ufWApO1xuICAgICAgY29uc29sZS5sb2coYCAgIFJpc2sgVG9sZXJhbmNlOiAke3VzZXJQcm9maWxlLnByZWZlcmVuY2VzLnJpc2tUb2xlcmFuY2V9YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgRW1haWwgTm90aWZpY2F0aW9uczogJHt1c2VyUHJvZmlsZS5wcmVmZXJlbmNlcy5ub3RpZmljYXRpb25TZXR0aW5ncy5lbWFpbH1gKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgICBOb3RpZmljYXRpb24gRnJlcXVlbmN5OiAke3VzZXJQcm9maWxlLnByZWZlcmVuY2VzLm5vdGlmaWNhdGlvblNldHRpbmdzLmZyZXF1ZW5jeX1cXG5gKTtcbiAgICB9XG5cbiAgICAvLyA0LiBVcGRhdGUgdXNlciBwcm9maWxlIGFuZCBwcmVmZXJlbmNlc1xuICAgIGNvbnNvbGUubG9nKCc0LiBVcGRhdGluZyB1c2VyIHByb2ZpbGUgYW5kIHByZWZlcmVuY2VzLi4uJyk7XG4gICAgY29uc3QgdXBkYXRlUmVxdWVzdDogVXNlclVwZGF0ZVJlcXVlc3QgPSB7XG4gICAgICBwcm9maWxlOiB7XG4gICAgICAgIHRpdGxlOiAnTGVhZCBJbnZlc3RtZW50IEFuYWx5c3QnLFxuICAgICAgICBkZXBhcnRtZW50OiAnQWR2YW5jZWQgUmVzZWFyY2ggRGl2aXNpb24nLFxuICAgICAgICBwaG9uZU51bWJlcjogJysxLTU1NS0wNDU2JyxcbiAgICAgIH0sXG4gICAgICBwcmVmZXJlbmNlczoge1xuICAgICAgICBpbnZlc3RtZW50SG9yaXpvbjogJ2xvbmcnLFxuICAgICAgICByaXNrVG9sZXJhbmNlOiAnbW9kZXJhdGUnLFxuICAgICAgICBwcmVmZXJyZWRTZWN0b3JzOiBbJ3RlY2hub2xvZ3knLCAnaGVhbHRoY2FyZScsICdyZW5ld2FibGUtZW5lcmd5J10sXG4gICAgICAgIHByZWZlcnJlZEFzc2V0Q2xhc3NlczogWydzdG9ja3MnLCAnZXRmcyddLFxuICAgICAgICBleGNsdWRlZEludmVzdG1lbnRzOiBbJ3RvYmFjY28nLCAnd2VhcG9ucyddLFxuICAgICAgICBub3RpZmljYXRpb25TZXR0aW5nczoge1xuICAgICAgICAgIGVtYWlsOiB0cnVlLFxuICAgICAgICAgIHB1c2g6IGZhbHNlLFxuICAgICAgICAgIGZyZXF1ZW5jeTogJ2RhaWx5JyxcbiAgICAgICAgICB0eXBlczoge1xuICAgICAgICAgICAgaWRlYUdlbmVyYXRpb246IHRydWUsXG4gICAgICAgICAgICBtYXJrZXRBbGVydHM6IHRydWUsXG4gICAgICAgICAgICBjb21wbGlhbmNlSXNzdWVzOiB0cnVlLFxuICAgICAgICAgICAgc3lzdGVtVXBkYXRlczogZmFsc2UsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfTtcblxuICAgIGNvbnN0IHVwZGF0ZWRVc2VyID0gYXdhaXQgYXV0aFNlcnZpY2UudXBkYXRlVXNlcihsb2dpblJlc3VsdC51c2VyLmlkLCB1cGRhdGVSZXF1ZXN0KTtcbiAgICBjb25zb2xlLmxvZygn4pyFIFByb2ZpbGUgdXBkYXRlZCBzdWNjZXNzZnVsbHknKTtcbiAgICBjb25zb2xlLmxvZyhgICAgTmV3IHRpdGxlOiAke3VwZGF0ZWRVc2VyLnByb2ZpbGUudGl0bGV9YCk7XG4gICAgY29uc29sZS5sb2coYCAgIE5ldyBkZXBhcnRtZW50OiAke3VwZGF0ZWRVc2VyLnByb2ZpbGUuZGVwYXJ0bWVudH1gKTtcbiAgICBjb25zb2xlLmxvZyhgICAgSW52ZXN0bWVudCBob3Jpem9uOiAke3VwZGF0ZWRVc2VyLnByZWZlcmVuY2VzLmludmVzdG1lbnRIb3Jpem9ufWApO1xuICAgIGNvbnNvbGUubG9nKGAgICBQcmVmZXJyZWQgc2VjdG9yczogJHt1cGRhdGVkVXNlci5wcmVmZXJlbmNlcy5wcmVmZXJyZWRTZWN0b3JzLmpvaW4oJywgJyl9YCk7XG4gICAgY29uc29sZS5sb2coYCAgIEV4Y2x1ZGVkIGludmVzdG1lbnRzOiAke3VwZGF0ZWRVc2VyLnByZWZlcmVuY2VzLmV4Y2x1ZGVkSW52ZXN0bWVudHMuam9pbignLCAnKX1cXG5gKTtcblxuICAgIC8vIDUuIFZlcmlmeSBKV1QgdG9rZW5cbiAgICBjb25zb2xlLmxvZygnNS4gVmVyaWZ5aW5nIEpXVCB0b2tlbi4uLicpO1xuICAgIGNvbnN0IHRva2VuUGF5bG9hZCA9IGF1dGhTZXJ2aWNlLnZlcmlmeVRva2VuKGxvZ2luUmVzdWx0LnRva2VuKTtcbiAgICBjb25zb2xlLmxvZygn4pyFIFRva2VuIHZlcmlmaWVkIHN1Y2Nlc3NmdWxseScpO1xuICAgIGNvbnNvbGUubG9nKGAgICBVc2VyIElEOiAke3Rva2VuUGF5bG9hZC51c2VySWR9YCk7XG4gICAgY29uc29sZS5sb2coYCAgIE9yZ2FuaXphdGlvbjogJHt0b2tlblBheWxvYWQub3JnYW5pemF0aW9uSWR9YCk7XG4gICAgY29uc29sZS5sb2coYCAgIFJvbGU6ICR7dG9rZW5QYXlsb2FkLnJvbGV9YCk7XG4gICAgY29uc29sZS5sb2coYCAgIFBlcm1pc3Npb25zOiAke3Rva2VuUGF5bG9hZC5wZXJtaXNzaW9ucy5qb2luKCcsICcpfVxcbmApO1xuXG4gICAgLy8gNi4gUmVmcmVzaCBhY2Nlc3MgdG9rZW5cbiAgICBjb25zb2xlLmxvZygnNi4gUmVmcmVzaGluZyBhY2Nlc3MgdG9rZW4uLi4nKTtcbiAgICBjb25zdCByZWZyZXNoUmVzdWx0ID0gYXdhaXQgYXV0aFNlcnZpY2UucmVmcmVzaFRva2VuKHtcbiAgICAgIHJlZnJlc2hUb2tlbjogbG9naW5SZXN1bHQucmVmcmVzaFRva2VuLFxuICAgIH0pO1xuICAgIGNvbnNvbGUubG9nKCfinIUgVG9rZW4gcmVmcmVzaGVkIHN1Y2Nlc3NmdWxseScpO1xuICAgIGNvbnNvbGUubG9nKGAgICBOZXcgdG9rZW4gZXhwaXJlcyBpbjogJHtyZWZyZXNoUmVzdWx0LmV4cGlyZXNJbn0gc2Vjb25kc1xcbmApO1xuXG4gICAgLy8gNy4gQ2hhbmdlIHBhc3N3b3JkXG4gICAgY29uc29sZS5sb2coJzcuIENoYW5naW5nIHVzZXIgcGFzc3dvcmQuLi4nKTtcbiAgICBjb25zdCBwYXNzd29yZENoYW5nZVJlcXVlc3Q6IFBhc3N3b3JkQ2hhbmdlUmVxdWVzdCA9IHtcbiAgICAgIGN1cnJlbnRQYXNzd29yZDogcmVnaXN0cmF0aW9uUmVxdWVzdC5wYXNzd29yZCxcbiAgICAgIG5ld1Bhc3N3b3JkOiAnTmV3U2VjdXJlUGFzc3dvcmQ0NTYhJyxcbiAgICB9O1xuXG4gICAgYXdhaXQgYXV0aFNlcnZpY2UuY2hhbmdlUGFzc3dvcmQobG9naW5SZXN1bHQudXNlci5pZCwgcGFzc3dvcmRDaGFuZ2VSZXF1ZXN0KTtcbiAgICBjb25zb2xlLmxvZygn4pyFIFBhc3N3b3JkIGNoYW5nZWQgc3VjY2Vzc2Z1bGx5XFxuJyk7XG5cbiAgICAvLyA4LiBUZXN0IGxvZ2luIHdpdGggbmV3IHBhc3N3b3JkXG4gICAgY29uc29sZS5sb2coJzguIFRlc3RpbmcgbG9naW4gd2l0aCBuZXcgcGFzc3dvcmQuLi4nKTtcbiAgICBjb25zdCBuZXdMb2dpblJlcXVlc3Q6IFVzZXJMb2dpblJlcXVlc3QgPSB7XG4gICAgICBlbWFpbDogcmVnaXN0cmF0aW9uUmVxdWVzdC5lbWFpbCxcbiAgICAgIHBhc3N3b3JkOiAnTmV3U2VjdXJlUGFzc3dvcmQ0NTYhJyxcbiAgICB9O1xuXG4gICAgY29uc3QgbmV3TG9naW5SZXN1bHQgPSBhd2FpdCBhdXRoU2VydmljZS5sb2dpblVzZXIobmV3TG9naW5SZXF1ZXN0KTtcbiAgICBjb25zb2xlLmxvZygn4pyFIExvZ2luIHdpdGggbmV3IHBhc3N3b3JkIHN1Y2Nlc3NmdWxcXG4nKTtcblxuICAgIC8vIDkuIExvZ291dCB1c2VyXG4gICAgY29uc29sZS5sb2coJzkuIExvZ2dpbmcgb3V0IHVzZXIuLi4nKTtcbiAgICBhd2FpdCBhdXRoU2VydmljZS5sb2dvdXRVc2VyKG5ld0xvZ2luUmVzdWx0LnVzZXIuaWQsIG5ld0xvZ2luUmVzdWx0LnJlZnJlc2hUb2tlbik7XG4gICAgY29uc29sZS5sb2coJ+KchSBVc2VyIGxvZ2dlZCBvdXQgc3VjY2Vzc2Z1bGx5XFxuJyk7XG5cbiAgICAvLyAxMC4gVHJ5IHRvIHVzZSBpbnZhbGlkYXRlZCByZWZyZXNoIHRva2VuXG4gICAgY29uc29sZS5sb2coJzEwLiBUZXN0aW5nIGludmFsaWRhdGVkIHJlZnJlc2ggdG9rZW4uLi4nKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgYXV0aFNlcnZpY2UucmVmcmVzaFRva2VuKHtcbiAgICAgICAgcmVmcmVzaFRva2VuOiBuZXdMb2dpblJlc3VsdC5yZWZyZXNoVG9rZW4sXG4gICAgICB9KTtcbiAgICAgIGNvbnNvbGUubG9nKCfinYwgVGhpcyBzaG91bGQgbm90IHN1Y2NlZWQnKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5sb2coJ+KchSBSZWZyZXNoIHRva2VuIGNvcnJlY3RseSBpbnZhbGlkYXRlZCBhZnRlciBsb2dvdXQnKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgICBFcnJvcjogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ31cXG5gKTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZygnPT09IEF1dGhlbnRpY2F0aW9uIERlbW8gQ29tcGxldGVkIFN1Y2Nlc3NmdWxseSA9PT0nKTtcblxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCBEZW1vIGZhaWxlZDonLCBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyk7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gZGVtb25zdHJhdGVSb2xlQmFzZWRBY2Nlc3MoKSB7XG4gIGNvbnNvbGUubG9nKCdcXG49PT0gUm9sZS1CYXNlZCBBY2Nlc3MgQ29udHJvbCBEZW1vID09PVxcbicpO1xuXG4gIHRyeSB7XG4gICAgLy8gQ3JlYXRlIHVzZXJzIHdpdGggZGlmZmVyZW50IHJvbGVzXG4gICAgY29uc3Qgcm9sZXMgPSBbJ2FuYWx5c3QnLCAncG9ydGZvbGlvLW1hbmFnZXInLCAnY29tcGxpYW5jZS1vZmZpY2VyJywgJ2FkbWluaXN0cmF0b3InXSBhcyBjb25zdDtcbiAgICBcbiAgICBmb3IgKGNvbnN0IHJvbGUgb2Ygcm9sZXMpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBDcmVhdGluZyAke3JvbGV9Li4uYCk7XG4gICAgICBjb25zdCByZWdpc3RyYXRpb25SZXF1ZXN0OiBVc2VyUmVnaXN0cmF0aW9uUmVxdWVzdCA9IHtcbiAgICAgICAgZW1haWw6IGAke3JvbGV9QGludmVzdG1lbnRmaXJtLmNvbWAsXG4gICAgICAgIHBhc3N3b3JkOiAnUGFzc3dvcmQxMjMhJyxcbiAgICAgICAgZmlyc3ROYW1lOiByb2xlLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgcm9sZS5zbGljZSgxKSxcbiAgICAgICAgbGFzdE5hbWU6ICdVc2VyJyxcbiAgICAgICAgb3JnYW5pemF0aW9uSWQ6ICdpbnZlc3RtZW50LWZpcm0tMDAxJyxcbiAgICAgICAgcm9sZSxcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGF1dGhTZXJ2aWNlLnJlZ2lzdGVyVXNlcihyZWdpc3RyYXRpb25SZXF1ZXN0KTtcbiAgICAgIGNvbnNvbGUubG9nKGDinIUgJHtyb2xlfSBjcmVhdGVkIHdpdGggcGVybWlzc2lvbnM6YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgJHtyZXN1bHQudXNlci5wZXJtaXNzaW9ucy5qb2luKCcsICcpfVxcbmApO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKCc9PT0gUm9sZS1CYXNlZCBBY2Nlc3MgRGVtbyBDb21wbGV0ZWQgPT09Jyk7XG5cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCfinYwgUm9sZSBkZW1vIGZhaWxlZDonLCBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyk7XG4gIH1cbn1cblxuLy8gUnVuIHRoZSBkZW1vbnN0cmF0aW9uc1xuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIGRlbW9uc3RyYXRlQXV0aGVudGljYXRpb24oKVxuICAgIC50aGVuKCgpID0+IGRlbW9uc3RyYXRlUm9sZUJhc2VkQWNjZXNzKCkpXG4gICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xufVxuXG5leHBvcnQgeyBkZW1vbnN0cmF0ZUF1dGhlbnRpY2F0aW9uLCBkZW1vbnN0cmF0ZVJvbGVCYXNlZEFjY2VzcyB9OyJdfQ==