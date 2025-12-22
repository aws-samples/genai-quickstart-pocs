/**
 * Example demonstrating user authentication and profile management
 */

import { authService } from '../services/auth-service';
import {
  UserRegistrationRequest,
  UserLoginRequest,
  UserUpdateRequest,
  PasswordChangeRequest,
} from '../models/user';

async function demonstrateAuthentication() {
  console.log('=== Investment AI Agent - Authentication Demo ===\n');

  try {
    // 1. Register a new user
    console.log('1. Registering a new user...');
    const registrationRequest: UserRegistrationRequest = {
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

    const registrationResult = await authService.registerUser(registrationRequest);
    console.log('✅ User registered successfully');
    console.log(`   User ID: ${registrationResult.user.id}`);
    console.log(`   Email: ${registrationResult.user.email}`);
    console.log(`   Role: ${registrationResult.user.role}`);
    console.log(`   Permissions: ${registrationResult.user.permissions.join(', ')}`);
    console.log(`   Token expires in: ${registrationResult.expiresIn} seconds\n`);

    // 2. Login with the registered user
    console.log('2. Logging in with registered user...');
    const loginRequest: UserLoginRequest = {
      email: registrationRequest.email,
      password: registrationRequest.password,
    };

    const loginResult = await authService.loginUser(loginRequest);
    console.log('✅ Login successful');
    console.log(`   Last login: ${loginResult.user.lastLoginAt}\n`);

    // 3. Get user profile
    console.log('3. Retrieving user profile...');
    const userProfile = await authService.getUserById(loginResult.user.id);
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
    const updateRequest: UserUpdateRequest = {
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

    const updatedUser = await authService.updateUser(loginResult.user.id, updateRequest);
    console.log('✅ Profile updated successfully');
    console.log(`   New title: ${updatedUser.profile.title}`);
    console.log(`   New department: ${updatedUser.profile.department}`);
    console.log(`   Investment horizon: ${updatedUser.preferences.investmentHorizon}`);
    console.log(`   Preferred sectors: ${updatedUser.preferences.preferredSectors.join(', ')}`);
    console.log(`   Excluded investments: ${updatedUser.preferences.excludedInvestments.join(', ')}\n`);

    // 5. Verify JWT token
    console.log('5. Verifying JWT token...');
    const tokenPayload = authService.verifyToken(loginResult.token);
    console.log('✅ Token verified successfully');
    console.log(`   User ID: ${tokenPayload.userId}`);
    console.log(`   Organization: ${tokenPayload.organizationId}`);
    console.log(`   Role: ${tokenPayload.role}`);
    console.log(`   Permissions: ${tokenPayload.permissions.join(', ')}\n`);

    // 6. Refresh access token
    console.log('6. Refreshing access token...');
    const refreshResult = await authService.refreshToken({
      refreshToken: loginResult.refreshToken,
    });
    console.log('✅ Token refreshed successfully');
    console.log(`   New token expires in: ${refreshResult.expiresIn} seconds\n`);

    // 7. Change password
    console.log('7. Changing user password...');
    const passwordChangeRequest: PasswordChangeRequest = {
      currentPassword: registrationRequest.password,
      newPassword: 'NewSecurePassword456!',
    };

    await authService.changePassword(loginResult.user.id, passwordChangeRequest);
    console.log('✅ Password changed successfully\n');

    // 8. Test login with new password
    console.log('8. Testing login with new password...');
    const newLoginRequest: UserLoginRequest = {
      email: registrationRequest.email,
      password: 'NewSecurePassword456!',
    };

    const newLoginResult = await authService.loginUser(newLoginRequest);
    console.log('✅ Login with new password successful\n');

    // 9. Logout user
    console.log('9. Logging out user...');
    await authService.logoutUser(newLoginResult.user.id, newLoginResult.refreshToken);
    console.log('✅ User logged out successfully\n');

    // 10. Try to use invalidated refresh token
    console.log('10. Testing invalidated refresh token...');
    try {
      await authService.refreshToken({
        refreshToken: newLoginResult.refreshToken,
      });
      console.log('❌ This should not succeed');
    } catch (error) {
      console.log('✅ Refresh token correctly invalidated after logout');
      console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }

    console.log('=== Authentication Demo Completed Successfully ===');

  } catch (error) {
    console.error('❌ Demo failed:', error instanceof Error ? error.message : 'Unknown error');
  }
}

async function demonstrateRoleBasedAccess() {
  console.log('\n=== Role-Based Access Control Demo ===\n');

  try {
    // Create users with different roles
    const roles = ['analyst', 'portfolio-manager', 'compliance-officer', 'administrator'] as const;
    
    for (const role of roles) {
      console.log(`Creating ${role}...`);
      const registrationRequest: UserRegistrationRequest = {
        email: `${role}@investmentfirm.com`,
        password: 'Password123!',
        firstName: role.charAt(0).toUpperCase() + role.slice(1),
        lastName: 'User',
        organizationId: 'investment-firm-001',
        role,
      };

      const result = await authService.registerUser(registrationRequest);
      console.log(`✅ ${role} created with permissions:`);
      console.log(`   ${result.user.permissions.join(', ')}\n`);
    }

    console.log('=== Role-Based Access Demo Completed ===');

  } catch (error) {
    console.error('❌ Role demo failed:', error instanceof Error ? error.message : 'Unknown error');
  }
}

// Run the demonstrations
if (require.main === module) {
  demonstrateAuthentication()
    .then(() => demonstrateRoleBasedAccess())
    .catch(console.error);
}

export { demonstrateAuthentication, demonstrateRoleBasedAccess };