# Admin Setup Guide

## Overview

The Advisor Assistant POC includes role-based access control using AWS Cognito groups. Admin functions require membership in the `admin` group.

**Security Note**: No default users or credentials are created during deployment. All users must be created manually through the provided admin processes.

## Quick Setup

### 1. Create Admin Group and User

```bash
# Run the admin setup script
npm run setup:admin

# Or directly
node setup-admin-group.js
```

This creates:
- **Admin Group**: `admin` in Cognito
- **Admin User**: `admin` with email `admin@example.com`
- **Regular User**: `testuser` with email `test@example.com`

### 2. Login Credentials

**Admin User (has admin access):**
- Username: `admin`
- Password: `AdminPass123!`
- Groups: `admin`

**Regular User (no admin access):**
- Username: `testuser`
- Password: `TestPass123!`
- Groups: none

## Testing Access Control

### 1. Test Admin Access
1. Login with `admin / AdminPass123!`
2. You'll see an "⚙️ Admin" button in the top menu
3. Click it to access `/admin.html`
4. You can create test users and perform admin functions

### 2. Test Regular User Access
1. Login with `testuser / TestPass123!`
2. No admin button appears in the menu
3. If you manually visit `/admin.html`, you'll see an access denied message

## Admin Functions

### Current Admin Features:
- **Create Test Users**: Generate users for testing
- **Audit Logging**: All admin actions are logged
- **Group Verification**: Shows user's group membership

### Access Control:
- **Authentication Required**: Must be logged in
- **Group Membership**: Must be in `admin` group
- **Audit Trail**: All actions logged to CloudWatch

## Manual Group Management

### Add User to Admin Group:
```bash
aws cognito-idp admin-add-user-to-group \
  --user-pool-id YOUR_USER_POOL_ID \
  --username USERNAME \
  --group-name admin
```

### Remove User from Admin Group:
```bash
aws cognito-idp admin-remove-user-from-group \
  --user-pool-id YOUR_USER_POOL_ID \
  --username USERNAME \
  --group-name admin
```

### List User's Groups:
```bash
aws cognito-idp admin-list-groups-for-user \
  --user-pool-id YOUR_USER_POOL_ID \
  --username USERNAME
```

## Security Features

### 1. Group-Based Access Control
- Only users in `admin` group can access admin functions
- Clear error messages for unauthorized access
- Group membership displayed in admin panel

### 2. Audit Logging
- All admin actions logged with user identification
- Timestamps and IP addresses recorded
- CloudWatch integration for audit trails

### 3. Session Management
- Automatic session validation
- Secure logout functionality
- Session expiration handling

## Troubleshooting

### "Admin group membership required" Error
- User is not in the `admin` group
- Run `npm run setup:admin` to create admin user
- Or manually add user to admin group using AWS CLI

### "Authentication Required" Error
- User session has expired
- Login again with valid credentials

### Admin Button Not Showing
- User is not in `admin` group
- Check group membership in Cognito console
- Refresh page after adding to group

## Production Considerations

### 1. Change Default Passwords
```bash
# Update admin password
aws cognito-idp admin-set-user-password \
  --user-pool-id YOUR_USER_POOL_ID \
  --username admin \
  --password NEW_SECURE_PASSWORD \
  --permanent
```

### 2. Use Real Email Addresses
- Update user attributes with real email addresses
- Enable email verification for production

### 3. Additional Security
- Enable MFA for admin users
- Set up CloudTrail for comprehensive audit logging
- Implement IP restrictions if needed

## Architecture

```
User Login → Cognito Authentication → JWT Token → Group Check → Admin Access
                                                      ↓
                                              CloudWatch Logging
```

The system uses Cognito groups embedded in JWT tokens to control access to admin functions, with comprehensive logging for security and compliance.