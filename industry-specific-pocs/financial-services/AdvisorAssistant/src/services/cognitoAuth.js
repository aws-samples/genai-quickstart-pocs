const { CognitoIdentityProviderClient, InitiateAuthCommand, RespondToAuthChallengeCommand, AdminCreateUserCommand, AdminSetUserPasswordCommand, AdminGetUserCommand, ListUsersCommand, AdminInitiateAuthCommand, AdminAddUserToGroupCommand } = require('@aws-sdk/client-cognito-identity-provider');
const jwt = require('jsonwebtoken');

class CognitoAuth {
  constructor() {
    this.client = new CognitoIdentityProviderClient({ 
      region: process.env.AWS_REGION || 'us-east-1' 
    });
    this.userPoolId = process.env.COGNITO_USER_POOL_ID;
    this.clientId = process.env.COGNITO_CLIENT_ID;
    this.userPoolDomain = process.env.COGNITO_DOMAIN;
  }

  // Authenticate user with username/password
  async authenticateUser(username, password) {
    try {
      const command = new AdminInitiateAuthCommand({
        UserPoolId: this.userPoolId,
        ClientId: this.clientId,
        AuthFlow: 'ADMIN_NO_SRP_AUTH',
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
        },
      });

      const response = await this.client.send(command);
      
      if (response.ChallengeName) {
        return {
          success: false,
          challengeName: response.ChallengeName,
          session: response.Session,
          challengeParameters: response.ChallengeParameters
        };
      }

      return {
        success: true,
        tokens: response.AuthenticationResult,
        user: this.decodeToken(response.AuthenticationResult.IdToken)
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Handle auth challenges (like password reset)
  async respondToAuthChallenge(challengeName, session, challengeResponses) {
    try {
      const command = new RespondToAuthChallengeCommand({
        ClientId: this.clientId,
        ChallengeName: challengeName,
        Session: session,
        ChallengeResponses: challengeResponses
      });

      const response = await this.client.send(command);
      
      if (response.ChallengeName) {
        return {
          success: false,
          challengeName: response.ChallengeName,
          session: response.Session,
          challengeParameters: response.ChallengeParameters
        };
      }

      return {
        success: true,
        tokens: response.AuthenticationResult,
        user: this.decodeToken(response.AuthenticationResult.IdToken)
      };
    } catch (error) {
      console.error('Challenge response error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create a new user (admin function)
  async createUser(username, email, temporaryPassword, userAttributes = {}) {
    try {
      console.log(`🔧 Creating new user: ${username} (${email}) in User Pool: ${this.userPoolId}`);
      
      const attributes = [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
        ...Object.entries(userAttributes).map(([key, value]) => ({
          Name: key,
          Value: value
        }))
      ];

      const command = new AdminCreateUserCommand({
        UserPoolId: this.userPoolId,
        Username: username, // This should be the email address
        UserAttributes: attributes,
        TemporaryPassword: temporaryPassword,
        MessageAction: 'SUPPRESS' // Email suppressed - will send custom welcome email
      });

      console.log(`📧 Attempting to create user with command:`, {
        UserPoolId: this.userPoolId,
        Username: username,
        Email: email,
        MessageAction: 'SUPPRESS'
      });

      const response = await this.client.send(command);
      
      console.log(`✅ User created successfully:`, {
        Username: response.User.Username,
        UserStatus: response.User.UserStatus,
        Enabled: response.User.Enabled
      });
      
      return {
        success: true,
        user: response.User,
        username: username,
        temporaryPassword: temporaryPassword
      };
    } catch (error) {
      console.error('❌ Create user error:', {
        error: error.message,
        errorCode: error.name,
        userPoolId: this.userPoolId,
        username: username,
        email: email
      });
      
      // Handle specific error cases
      if (error.name === 'UsernameExistsException') {
        return {
          success: false,
          error: `User ${username} already exists in the system`
        };
      }
      
      if (error.name === 'InvalidParameterException') {
        return {
          success: false,
          error: `Invalid parameters: ${error.message}`
        };
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Set permanent password for user
  async setUserPassword(username, password) {
    try {
      const command = new AdminSetUserPasswordCommand({
        UserPoolId: this.userPoolId,
        Username: username,
        Password: password,
        Permanent: true
      });

      await this.client.send(command);
      
      return {
        success: true,
        message: 'Password set successfully'
      };
    } catch (error) {
      console.error('Set password error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get user details
  async getUser(username) {
    try {
      // Validate username parameter
      if (!username || username.trim() === '') {
        throw new Error('Username is required and cannot be empty');
      }
      
      const command = new AdminGetUserCommand({
        UserPoolId: this.userPoolId,
        Username: username.trim()
      });

      const response = await this.client.send(command);
      
      const userAttributes = {};
      response.UserAttributes.forEach(attr => {
        userAttributes[attr.Name] = attr.Value;
      });

      return {
        success: true,
        user: {
          username: response.Username,
          userStatus: response.UserStatus,
          enabled: response.Enabled,
          attributes: userAttributes,
          created: response.UserCreateDate,
          modified: response.UserLastModifiedDate
        }
      };
    } catch (error) {
      console.error('Get user error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // List all users (admin function)
  async listUsers(limit = 10) {
    try {
      const command = new ListUsersCommand({
        UserPoolId: this.userPoolId,
        Limit: limit
      });

      const response = await this.client.send(command);
      
      const users = response.Users.map(user => {
        const userAttributes = {};
        user.Attributes.forEach(attr => {
          userAttributes[attr.Name] = attr.Value;
        });

        return {
          username: user.Username,
          userStatus: user.UserStatus,
          enabled: user.Enabled,
          attributes: userAttributes,
          created: user.UserCreateDate,
          modified: user.UserLastModifiedDate
        };
      });

      return {
        success: true,
        users: users,
        totalCount: users.length
      };
    } catch (error) {
      console.error('List users error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      // For production, you should verify the token signature with Cognito's public keys
      // For POC, we'll just decode it
      const decoded = jwt.decode(token);
      
      if (!decoded || decoded.exp < Date.now() / 1000) {
        return {
          valid: false,
          error: 'Token expired or invalid'
        };
      }

      return {
        valid: true,
        user: {
          username: decoded.email || decoded['cognito:username'] || decoded.preferred_username,
          email: decoded.email,
          sub: decoded.sub,
          groups: decoded['cognito:groups'] || [],
          attributes: decoded,
          name: decoded.name,
          given_name: decoded.given_name,
          family_name: decoded.family_name,
          preferred_username: decoded.preferred_username
        }
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  // Decode JWT token without verification (for development)
  decodeToken(token) {
    try {
      const decoded = jwt.decode(token);
      
      // Extract email and username from the right JWT fields
      // Cognito typically stores email in the 'email' claim
      const email = decoded.email || decoded['cognito:email'] || decoded['custom:email'];
      
      // Username can be in several places
      const username = decoded['cognito:username'] || 
                      decoded.preferred_username || 
                      decoded.username ||
                      email; // Use email as username if no dedicated username
      
      return {
        username: username,
        email: email,
        sub: decoded.sub,
        groups: decoded['cognito:groups'] || [],
        attributes: decoded,
        preferred_username: decoded.preferred_username
      };
    } catch (error) {
      console.error('Token decode error:', error);
      return null;
    }
  }

  // Generate OAuth URLs
  getAuthUrls() {
    const baseUrl = `https://${this.userPoolDomain}.auth.${process.env.AWS_REGION}.amazoncognito.com`;
    const redirectUri = encodeURIComponent(process.env.COGNITO_REDIRECT_URI || 'http://localhost:3000/auth/callback');
    
    return {
      login: `${baseUrl}/login?client_id=${this.clientId}&response_type=code&scope=email+openid+profile&redirect_uri=${redirectUri}`,
      logout: `${baseUrl}/logout?client_id=${this.clientId}&logout_uri=${redirectUri}`,
      signup: `${baseUrl}/signup?client_id=${this.clientId}&response_type=code&scope=email+openid+profile&redirect_uri=${redirectUri}`
    };
  }

  // Middleware for protecting routes
  requireAuth() {
    return (req, res, next) => {
      // Try ID token first (contains user attributes), then access token
      const token = req.headers.authorization?.replace('Bearer ', '') || 
                   req.session?.idToken || 
                   req.session?.accessToken;
      
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const verification = this.verifyToken(token);
      if (!verification.valid) {
        return res.status(401).json({ error: verification.error });
      }

      // Ensure user object has required fields with fallbacks
      const userEmail = verification.user.email || verification.user.attributes?.email;
      const userName = verification.user.username || verification.user.attributes?.preferred_username || verification.user.preferred_username;
      
      req.user = {
        username: userEmail || userName || 'User', // Prioritize email as username
        email: userEmail || null,
        sub: verification.user.sub || 'unknown',
        groups: verification.user.groups || [],
        attributes: verification.user.attributes || {},
        displayName: userEmail || userName || 'User',
        preferred_username: verification.user.preferred_username
      };
      
      next();
    };
  }

  // Middleware for admin-only routes
  requireAdmin() {
    return (req, res, next) => {
      if (!req.user || !req.user.groups.includes('admin')) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      next();
    };
  }
  
  // Add user to group (admin function)
  async addUserToGroup(username, groupName) {
    try {
      const { AdminAddUserToGroupCommand } = require('@aws-sdk/client-cognito-identity-provider');
      
      const command = new AdminAddUserToGroupCommand({
        UserPoolId: this.userPoolId,
        Username: username,
        GroupName: groupName
      });
      
      await this.client.send(command);
      
      console.log(`✅ Added user ${username} to group ${groupName}`);
      
      return {
        success: true,
        message: `User added to ${groupName} group successfully`
      };
    } catch (error) {
      console.error(`❌ Error adding user to group:`, error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = CognitoAuth;