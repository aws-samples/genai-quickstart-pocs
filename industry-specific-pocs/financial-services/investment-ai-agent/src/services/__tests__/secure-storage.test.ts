/**
 * Tests for secure storage utilities
 */

import { 
  hasAccess, 
  createDefaultAccessControl, 
  validateAccessControl, 
  mergeAccessControl, 
  restrictAccessControl 
} from '../../utils/secure-storage';
import { AccessControl } from '../../models/proprietary-data';

describe('Secure Storage Utilities', () => {
  describe('hasAccess', () => {
    it('should grant access to public resources', () => {
      const accessControl: AccessControl = {
        visibility: 'public'
      };
      
      const result = hasAccess('user1', ['analyst'], 'org1', accessControl);
      
      expect(result).toBe(true);
    });
    
    it('should grant access to organization resources for organization members', () => {
      const accessControl: AccessControl = {
        visibility: 'organization',
        allowedOrganizations: ['org1']
      };
      
      const result = hasAccess('user1', ['analyst'], 'org1', accessControl);
      
      expect(result).toBe(true);
    });
    
    it('should deny access to organization resources for non-members', () => {
      const accessControl: AccessControl = {
        visibility: 'organization',
        allowedOrganizations: ['org1']
      };
      
      const result = hasAccess('user1', ['analyst'], 'org2', accessControl);
      
      expect(result).toBe(false);
    });
    
    it('should grant access to role-based resources for users with the role', () => {
      const accessControl: AccessControl = {
        visibility: 'role',
        allowedRoles: ['analyst', 'admin']
      };
      
      const result = hasAccess('user1', ['analyst'], 'org1', accessControl);
      
      expect(result).toBe(true);
    });
    
    it('should deny access to role-based resources for users without the role', () => {
      const accessControl: AccessControl = {
        visibility: 'role',
        allowedRoles: ['admin']
      };
      
      const result = hasAccess('user1', ['analyst'], 'org1', accessControl);
      
      expect(result).toBe(false);
    });
    
    it('should grant access to user-specific resources for allowed users', () => {
      const accessControl: AccessControl = {
        visibility: 'user',
        allowedUsers: ['user1', 'user2']
      };
      
      const result = hasAccess('user1', ['analyst'], 'org1', accessControl);
      
      expect(result).toBe(true);
    });
    
    it('should deny access to user-specific resources for non-allowed users', () => {
      const accessControl: AccessControl = {
        visibility: 'user',
        allowedUsers: ['user2', 'user3']
      };
      
      const result = hasAccess('user1', ['analyst'], 'org1', accessControl);
      
      expect(result).toBe(false);
    });
  });
  
  describe('createDefaultAccessControl', () => {
    it('should create user-specific access control for confidential resources', () => {
      const result = createDefaultAccessControl('user1', 'org1', true);
      
      expect(result.visibility).toBe('user');
      expect(result.allowedUsers).toEqual(['user1']);
    });
    
    it('should create organization-level access control for non-confidential resources', () => {
      const result = createDefaultAccessControl('user1', 'org1', false);
      
      expect(result.visibility).toBe('organization');
      expect(result.allowedOrganizations).toEqual(['org1']);
    });
  });
  
  describe('validateAccessControl', () => {
    it('should validate valid access control settings', () => {
      const accessControl: AccessControl = {
        visibility: 'organization',
        allowedOrganizations: ['org1']
      };
      
      const result = validateAccessControl(accessControl);
      
      expect(result).toBe(true);
    });
    
    it('should reject invalid visibility', () => {
      // Use type assertion to unknown first to avoid TypeScript error
      const accessControl = {
        visibility: 'invalid' as any,
        allowedOrganizations: ['org1']
      } as AccessControl;
      
      const result = validateAccessControl(accessControl);
      
      expect(result).toBe(false);
    });
    
    it('should reject organization visibility without allowed organizations', () => {
      const accessControl: AccessControl = {
        visibility: 'organization',
        allowedOrganizations: []
      };
      
      const result = validateAccessControl(accessControl);
      
      expect(result).toBe(false);
    });
    
    it('should reject role visibility without allowed roles', () => {
      const accessControl: AccessControl = {
        visibility: 'role',
        allowedRoles: []
      };
      
      const result = validateAccessControl(accessControl);
      
      expect(result).toBe(false);
    });
    
    it('should reject user visibility without allowed users', () => {
      const accessControl: AccessControl = {
        visibility: 'user',
        allowedUsers: []
      };
      
      const result = validateAccessControl(accessControl);
      
      expect(result).toBe(false);
    });
  });
  
  describe('mergeAccessControl', () => {
    it('should merge access control settings', () => {
      const base: AccessControl = {
        visibility: 'organization',
        allowedOrganizations: ['org1']
      };
      
      const override: Partial<AccessControl> = {
        visibility: 'user',
        allowedUsers: ['user1']
      };
      
      const result = mergeAccessControl(base, override);
      
      expect(result.visibility).toBe('user');
      expect(result.allowedUsers).toEqual(['user1']);
      expect(result.allowedOrganizations).toEqual(['org1']);
    });
    
    it('should keep base values when override is empty', () => {
      const base: AccessControl = {
        visibility: 'organization',
        allowedOrganizations: ['org1']
      };
      
      const override = {};
      
      const result = mergeAccessControl(base, override);
      
      expect(result.visibility).toBe('organization');
      expect(result.allowedOrganizations).toEqual(['org1']);
    });
  });
  
  describe('restrictAccessControl', () => {
    it('should restrict public visibility when user cannot make resources public', () => {
      const accessControl: AccessControl = {
        visibility: 'public'
      };
      
      const result = restrictAccessControl(accessControl, 'user1', ['analyst'], false);
      
      expect(result.visibility).toBe('organization');
    });
    
    it('should keep public visibility when user can make resources public', () => {
      const accessControl: AccessControl = {
        visibility: 'public'
      };
      
      const result = restrictAccessControl(accessControl, 'user1', ['analyst'], true);
      
      expect(result.visibility).toBe('public');
    });
    
    it('should ensure user is included in allowed users for user-specific resources', () => {
      const accessControl: AccessControl = {
        visibility: 'user',
        allowedUsers: ['user2']
      };
      
      const result = restrictAccessControl(accessControl, 'user1', ['analyst'], false);
      
      expect(result.visibility).toBe('user');
      expect(result.allowedUsers).toContain('user1');
      expect(result.allowedUsers).toContain('user2');
    });
    
    it('should initialize allowedUsers array if it does not exist', () => {
      const accessControl: AccessControl = {
        visibility: 'user'
      };
      
      const result = restrictAccessControl(accessControl, 'user1', ['analyst'], false);
      
      expect(result.visibility).toBe('user');
      expect(result.allowedUsers).toEqual(['user1']);
    });
    
    it('should not modify non-user visibility settings', () => {
      const accessControl: AccessControl = {
        visibility: 'role',
        allowedRoles: ['analyst']
      };
      
      const result = restrictAccessControl(accessControl, 'user1', ['analyst'], false);
      
      expect(result.visibility).toBe('role');
      expect(result.allowedRoles).toEqual(['analyst']);
    });
  });
  
  describe('edge cases', () => {
    it('should handle undefined arrays in hasAccess', () => {
      const accessControl: AccessControl = {
        visibility: 'role'
        // allowedRoles is undefined
      };
      
      const result = hasAccess('user1', ['analyst'], 'org1', accessControl);
      
      // Should return false because allowedRoles is undefined
      expect(result).toBe(false);
    });
    
    it('should validate public visibility with no arrays', () => {
      const accessControl: AccessControl = {
        visibility: 'public'
        // No arrays needed for public visibility
      };
      
      const result = validateAccessControl(accessControl);
      
      expect(result).toBe(true);
    });
  });
});