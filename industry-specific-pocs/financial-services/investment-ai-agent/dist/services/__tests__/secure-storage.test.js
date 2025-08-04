"use strict";
/**
 * Tests for secure storage utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
const secure_storage_1 = require("../../utils/secure-storage");
describe('Secure Storage Utilities', () => {
    describe('hasAccess', () => {
        it('should grant access to public resources', () => {
            const accessControl = {
                visibility: 'public'
            };
            const result = (0, secure_storage_1.hasAccess)('user1', ['analyst'], 'org1', accessControl);
            expect(result).toBe(true);
        });
        it('should grant access to organization resources for organization members', () => {
            const accessControl = {
                visibility: 'organization',
                allowedOrganizations: ['org1']
            };
            const result = (0, secure_storage_1.hasAccess)('user1', ['analyst'], 'org1', accessControl);
            expect(result).toBe(true);
        });
        it('should deny access to organization resources for non-members', () => {
            const accessControl = {
                visibility: 'organization',
                allowedOrganizations: ['org1']
            };
            const result = (0, secure_storage_1.hasAccess)('user1', ['analyst'], 'org2', accessControl);
            expect(result).toBe(false);
        });
        it('should grant access to role-based resources for users with the role', () => {
            const accessControl = {
                visibility: 'role',
                allowedRoles: ['analyst', 'admin']
            };
            const result = (0, secure_storage_1.hasAccess)('user1', ['analyst'], 'org1', accessControl);
            expect(result).toBe(true);
        });
        it('should deny access to role-based resources for users without the role', () => {
            const accessControl = {
                visibility: 'role',
                allowedRoles: ['admin']
            };
            const result = (0, secure_storage_1.hasAccess)('user1', ['analyst'], 'org1', accessControl);
            expect(result).toBe(false);
        });
        it('should grant access to user-specific resources for allowed users', () => {
            const accessControl = {
                visibility: 'user',
                allowedUsers: ['user1', 'user2']
            };
            const result = (0, secure_storage_1.hasAccess)('user1', ['analyst'], 'org1', accessControl);
            expect(result).toBe(true);
        });
        it('should deny access to user-specific resources for non-allowed users', () => {
            const accessControl = {
                visibility: 'user',
                allowedUsers: ['user2', 'user3']
            };
            const result = (0, secure_storage_1.hasAccess)('user1', ['analyst'], 'org1', accessControl);
            expect(result).toBe(false);
        });
    });
    describe('createDefaultAccessControl', () => {
        it('should create user-specific access control for confidential resources', () => {
            const result = (0, secure_storage_1.createDefaultAccessControl)('user1', 'org1', true);
            expect(result.visibility).toBe('user');
            expect(result.allowedUsers).toEqual(['user1']);
        });
        it('should create organization-level access control for non-confidential resources', () => {
            const result = (0, secure_storage_1.createDefaultAccessControl)('user1', 'org1', false);
            expect(result.visibility).toBe('organization');
            expect(result.allowedOrganizations).toEqual(['org1']);
        });
    });
    describe('validateAccessControl', () => {
        it('should validate valid access control settings', () => {
            const accessControl = {
                visibility: 'organization',
                allowedOrganizations: ['org1']
            };
            const result = (0, secure_storage_1.validateAccessControl)(accessControl);
            expect(result).toBe(true);
        });
        it('should reject invalid visibility', () => {
            // Use type assertion to unknown first to avoid TypeScript error
            const accessControl = {
                visibility: 'invalid',
                allowedOrganizations: ['org1']
            };
            const result = (0, secure_storage_1.validateAccessControl)(accessControl);
            expect(result).toBe(false);
        });
        it('should reject organization visibility without allowed organizations', () => {
            const accessControl = {
                visibility: 'organization',
                allowedOrganizations: []
            };
            const result = (0, secure_storage_1.validateAccessControl)(accessControl);
            expect(result).toBe(false);
        });
        it('should reject role visibility without allowed roles', () => {
            const accessControl = {
                visibility: 'role',
                allowedRoles: []
            };
            const result = (0, secure_storage_1.validateAccessControl)(accessControl);
            expect(result).toBe(false);
        });
        it('should reject user visibility without allowed users', () => {
            const accessControl = {
                visibility: 'user',
                allowedUsers: []
            };
            const result = (0, secure_storage_1.validateAccessControl)(accessControl);
            expect(result).toBe(false);
        });
    });
    describe('mergeAccessControl', () => {
        it('should merge access control settings', () => {
            const base = {
                visibility: 'organization',
                allowedOrganizations: ['org1']
            };
            const override = {
                visibility: 'user',
                allowedUsers: ['user1']
            };
            const result = (0, secure_storage_1.mergeAccessControl)(base, override);
            expect(result.visibility).toBe('user');
            expect(result.allowedUsers).toEqual(['user1']);
            expect(result.allowedOrganizations).toEqual(['org1']);
        });
        it('should keep base values when override is empty', () => {
            const base = {
                visibility: 'organization',
                allowedOrganizations: ['org1']
            };
            const override = {};
            const result = (0, secure_storage_1.mergeAccessControl)(base, override);
            expect(result.visibility).toBe('organization');
            expect(result.allowedOrganizations).toEqual(['org1']);
        });
    });
    describe('restrictAccessControl', () => {
        it('should restrict public visibility when user cannot make resources public', () => {
            const accessControl = {
                visibility: 'public'
            };
            const result = (0, secure_storage_1.restrictAccessControl)(accessControl, 'user1', ['analyst'], false);
            expect(result.visibility).toBe('organization');
        });
        it('should keep public visibility when user can make resources public', () => {
            const accessControl = {
                visibility: 'public'
            };
            const result = (0, secure_storage_1.restrictAccessControl)(accessControl, 'user1', ['analyst'], true);
            expect(result.visibility).toBe('public');
        });
        it('should ensure user is included in allowed users for user-specific resources', () => {
            const accessControl = {
                visibility: 'user',
                allowedUsers: ['user2']
            };
            const result = (0, secure_storage_1.restrictAccessControl)(accessControl, 'user1', ['analyst'], false);
            expect(result.visibility).toBe('user');
            expect(result.allowedUsers).toContain('user1');
            expect(result.allowedUsers).toContain('user2');
        });
        it('should initialize allowedUsers array if it does not exist', () => {
            const accessControl = {
                visibility: 'user'
            };
            const result = (0, secure_storage_1.restrictAccessControl)(accessControl, 'user1', ['analyst'], false);
            expect(result.visibility).toBe('user');
            expect(result.allowedUsers).toEqual(['user1']);
        });
        it('should not modify non-user visibility settings', () => {
            const accessControl = {
                visibility: 'role',
                allowedRoles: ['analyst']
            };
            const result = (0, secure_storage_1.restrictAccessControl)(accessControl, 'user1', ['analyst'], false);
            expect(result.visibility).toBe('role');
            expect(result.allowedRoles).toEqual(['analyst']);
        });
    });
    describe('edge cases', () => {
        it('should handle undefined arrays in hasAccess', () => {
            const accessControl = {
                visibility: 'role'
                // allowedRoles is undefined
            };
            const result = (0, secure_storage_1.hasAccess)('user1', ['analyst'], 'org1', accessControl);
            // Should return false because allowedRoles is undefined
            expect(result).toBe(false);
        });
        it('should validate public visibility with no arrays', () => {
            const accessControl = {
                visibility: 'public'
                // No arrays needed for public visibility
            };
            const result = (0, secure_storage_1.validateAccessControl)(accessControl);
            expect(result).toBe(true);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjdXJlLXN0b3JhZ2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2aWNlcy9fX3Rlc3RzX18vc2VjdXJlLXN0b3JhZ2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgsK0RBTW9DO0FBR3BDLFFBQVEsQ0FBQywwQkFBMEIsRUFBRSxHQUFHLEVBQUU7SUFDeEMsUUFBUSxDQUFDLFdBQVcsRUFBRSxHQUFHLEVBQUU7UUFDekIsRUFBRSxDQUFDLHlDQUF5QyxFQUFFLEdBQUcsRUFBRTtZQUNqRCxNQUFNLGFBQWEsR0FBa0I7Z0JBQ25DLFVBQVUsRUFBRSxRQUFRO2FBQ3JCLENBQUM7WUFFRixNQUFNLE1BQU0sR0FBRyxJQUFBLDBCQUFTLEVBQUMsT0FBTyxFQUFFLENBQUMsU0FBUyxDQUFDLEVBQUUsTUFBTSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBRXRFLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUIsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsd0VBQXdFLEVBQUUsR0FBRyxFQUFFO1lBQ2hGLE1BQU0sYUFBYSxHQUFrQjtnQkFDbkMsVUFBVSxFQUFFLGNBQWM7Z0JBQzFCLG9CQUFvQixFQUFFLENBQUMsTUFBTSxDQUFDO2FBQy9CLENBQUM7WUFFRixNQUFNLE1BQU0sR0FBRyxJQUFBLDBCQUFTLEVBQUMsT0FBTyxFQUFFLENBQUMsU0FBUyxDQUFDLEVBQUUsTUFBTSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBRXRFLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUIsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsOERBQThELEVBQUUsR0FBRyxFQUFFO1lBQ3RFLE1BQU0sYUFBYSxHQUFrQjtnQkFDbkMsVUFBVSxFQUFFLGNBQWM7Z0JBQzFCLG9CQUFv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O1lBQ3hELE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDN0IsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsa0RBQWtELEVBQUUsR0FBRyxFQUFFO1lBQzFELE1BQU0sYUFBYSxHQUFrQjtnQkFDbkMsVUFBVSxFQUFFLFFBQVE7Z0JBQ3BCLHlDQUF5QzthQUMxQyxDQUFDO1lBRUYsTUFBTSxNQUFNLEdBQUcsSUFBQSxzQ0FBcUIsRUFBQyxhQUFhLENBQUMsQ0FBQztZQUVwRCxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVGVzdHMgZm9yIHNlY3VyZSBzdG9yYWdlIHV0aWxpdGllc1xuICovXG5cbmltcG9ydCB7IFxuICBoYXNBY2Nlc3MsIFxuICBjcmVhdGVEZWZhdWx0QWNjZXNzQ29udHJvbCwgXG4gIHZhbGlkYXRlQWNjZXNzQ29udHJvbCwgXG4gIG1lcmdlQWNjZXNzQ29udHJvbCwgXG4gIHJlc3RyaWN0QWNjZXNzQ29udHJvbCBcbn0gZnJvbSAnLi4vLi4vdXRpbHMvc2VjdXJlLXN0b3JhZ2UnO1xuaW1wb3J0IHsgQWNjZXNzQ29udHJvbCB9IGZyb20gJy4uLy4uL21vZGVscy9wcm9wcmlldGFyeS1kYXRhJztcblxuZGVzY3JpYmUoJ1NlY3VyZSBTdG9yYWdlIFV0aWxpdGllcycsICgpID0+IHtcbiAgZGVzY3JpYmUoJ2hhc0FjY2VzcycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGdyYW50IGFjY2VzcyB0byBwdWJsaWMgcmVzb3VyY2VzJywgKCkgPT4ge1xuICAgICAgY29uc3QgYWNjZXNzQ29udHJvbDogQWNjZXNzQ29udHJvbCA9IHtcbiAgICAgICAgdmlzaWJpbGl0eTogJ3B1YmxpYydcbiAgICAgIH07XG4gICAgICBcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGhhc0FjY2VzcygndXNlcjEnLCBbJ2FuYWx5c3QnXSwgJ29yZzEnLCBhY2Nlc3NDb250cm9sKTtcbiAgICAgIFxuICAgICAgZXhwZWN0KHJlc3VsdCkudG9CZSh0cnVlKTtcbiAgICB9KTtcbiAgICBcbiAgICBpdCgnc2hvdWxkIGdyYW50IGFjY2VzcyB0byBvcmdhbml6YXRpb24gcmVzb3VyY2VzIGZvciBvcmdhbml6YXRpb24gbWVtYmVycycsICgpID0+IHtcbiAgICAgIGNvbnN0IGFjY2Vzc0NvbnRyb2w6IEFjY2Vzc0NvbnRyb2wgPSB7XG4gICAgICAgIHZpc2liaWxpdHk6ICdvcmdhbml6YXRpb24nLFxuICAgICAgICBhbGxvd2VkT3JnYW5pemF0aW9uczogWydvcmcxJ11cbiAgICAgIH07XG4gICAgICBcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGhhc0FjY2VzcygndXNlcjEnLCBbJ2FuYWx5c3QnXSwgJ29yZzEnLCBhY2Nlc3NDb250cm9sKTtcbiAgICAgIFxuICAgICAgZXhwZWN0KHJlc3VsdCkudG9CZSh0cnVlKTtcbiAgICB9KTtcbiAgICBcbiAgICBpdCgnc2hvdWxkIGRlbnkgYWNjZXNzIHRvIG9yZ2FuaXphdGlvbiByZXNvdXJjZXMgZm9yIG5vbi1tZW1iZXJzJywgKCkgPT4ge1xuICAgICAgY29uc3QgYWNjZXNzQ29udHJvbDogQWNjZXNzQ29udHJvbCA9IHtcbiAgICAgICAgdmlzaWJpbGl0eTogJ29yZ2FuaXphdGlvbicsXG4gICAgICAgIGFsbG93ZWRPcmdhbml6YXRpb25zOiBbJ29yZzEnXVxuICAgICAgfTtcbiAgICAgIFxuICAgICAgY29uc3QgcmVzdWx0ID0gaGFzQWNjZXNzKCd1c2VyMScsIFsnYW5hbHlzdCddLCAnb3JnMicsIGFjY2Vzc0NvbnRyb2wpO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzdWx0KS50b0JlKGZhbHNlKTtcbiAgICB9KTtcbiAgICBcbiAgICBpdCgnc2hvdWxkIGdyYW50IGFjY2VzcyB0byByb2xlLWJhc2VkIHJlc291cmNlcyBmb3IgdXNlcnMgd2l0aCB0aGUgcm9sZScsICgpID0+IHtcbiAgICAgIGNvbnN0IGFjY2Vzc0NvbnRyb2w6IEFjY2Vzc0NvbnRyb2wgPSB7XG4gICAgICAgIHZpc2liaWxpdHk6ICdyb2xlJyxcbiAgICAgICAgYWxsb3dlZFJvbGVzOiBbJ2FuYWx5c3QnLCAnYWRtaW4nXVxuICAgICAgfTtcbiAgICAgIFxuICAgICAgY29uc3QgcmVzdWx0ID0gaGFzQWNjZXNzKCd1c2VyMScsIFsnYW5hbHlzdCddLCAnb3JnMScsIGFjY2Vzc0NvbnRyb2wpO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzdWx0KS50b0JlKHRydWUpO1xuICAgIH0pO1xuICAgIFxuICAgIGl0KCdzaG91bGQgZGVueSBhY2Nlc3MgdG8gcm9sZS1iYXNlZCByZXNvdXJjZXMgZm9yIHVzZXJzIHdpdGhvdXQgdGhlIHJvbGUnLCAoKSA9PiB7XG4gICAgICBjb25zdCBhY2Nlc3NDb250cm9sOiBBY2Nlc3NDb250cm9sID0ge1xuICAgICAgICB2aXNpYmlsaXR5OiAncm9sZScsXG4gICAgICAgIGFsbG93ZWRSb2xlczogWydhZG1pbiddXG4gICAgICB9O1xuICAgICAgXG4gICAgICBjb25zdCByZXN1bHQgPSBoYXNBY2Nlc3MoJ3VzZXIxJywgWydhbmFseXN0J10sICdvcmcxJywgYWNjZXNzQ29udHJvbCk7XG4gICAgICBcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvQmUoZmFsc2UpO1xuICAgIH0pO1xuICAgIFxuICAgIGl0KCdzaG91bGQgZ3JhbnQgYWNjZXNzIHRvIHVzZXItc3BlY2lmaWMgcmVzb3VyY2VzIGZvciBhbGxvd2VkIHVzZXJzJywgKCkgPT4ge1xuICAgICAgY29uc3QgYWNjZXNzQ29udHJvbDogQWNjZXNzQ29udHJvbCA9IHtcbiAgICAgICAgdmlzaWJpbGl0eTogJ3VzZXInLFxuICAgICAgICBhbGxvd2VkVXNlcnM6IFsndXNlcjEnLCAndXNlcjInXVxuICAgICAgfTtcbiAgICAgIFxuICAgICAgY29uc3QgcmVzdWx0ID0gaGFzQWNjZXNzKCd1c2VyMScsIFsnYW5hbHlzdCddLCAnb3JnMScsIGFjY2Vzc0NvbnRyb2wpO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzdWx0KS50b0JlKHRydWUpO1xuICAgIH0pO1xuICAgIFxuICAgIGl0KCdzaG91bGQgZGVueSBhY2Nlc3MgdG8gdXNlci1zcGVjaWZpYyByZXNvdXJjZXMgZm9yIG5vbi1hbGxvd2VkIHVzZXJzJywgKCkgPT4ge1xuICAgICAgY29uc3QgYWNjZXNzQ29udHJvbDogQWNjZXNzQ29udHJvbCA9IHtcbiAgICAgICAgdmlzaWJpbGl0eTogJ3VzZXInLFxuICAgICAgICBhbGxvd2VkVXNlcnM6IFsndXNlcjInLCAndXNlcjMnXVxuICAgICAgfTtcbiAgICAgIFxuICAgICAgY29uc3QgcmVzdWx0ID0gaGFzQWNjZXNzKCd1c2VyMScsIFsnYW5hbHlzdCddLCAnb3JnMScsIGFjY2Vzc0NvbnRyb2wpO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzdWx0KS50b0JlKGZhbHNlKTtcbiAgICB9KTtcbiAgfSk7XG4gIFxuICBkZXNjcmliZSgnY3JlYXRlRGVmYXVsdEFjY2Vzc0NvbnRyb2wnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBjcmVhdGUgdXNlci1zcGVjaWZpYyBhY2Nlc3MgY29udHJvbCBmb3IgY29uZmlkZW50aWFsIHJlc291cmNlcycsICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGNyZWF0ZURlZmF1bHRBY2Nlc3NDb250cm9sKCd1c2VyMScsICdvcmcxJywgdHJ1ZSk7XG4gICAgICBcbiAgICAgIGV4cGVjdChyZXN1bHQudmlzaWJpbGl0eSkudG9CZSgndXNlcicpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5hbGxvd2VkVXNlcnMpLnRvRXF1YWwoWyd1c2VyMSddKTtcbiAgICB9KTtcbiAgICBcbiAgICBpdCgnc2hvdWxkIGNyZWF0ZSBvcmdhbml6YXRpb24tbGV2ZWwgYWNjZXNzIGNvbnRyb2wgZm9yIG5vbi1jb25maWRlbnRpYWwgcmVzb3VyY2VzJywgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gY3JlYXRlRGVmYXVsdEFjY2Vzc0NvbnRyb2woJ3VzZXIxJywgJ29yZzEnLCBmYWxzZSk7XG4gICAgICBcbiAgICAgIGV4cGVjdChyZXN1bHQudmlzaWJpbGl0eSkudG9CZSgnb3JnYW5pemF0aW9uJyk7XG4gICAgICBleHBlY3QocmVzdWx0LmFsbG93ZWRPcmdhbml6YXRpb25zKS50b0VxdWFsKFsnb3JnMSddKTtcbiAgICB9KTtcbiAgfSk7XG4gIFxuICBkZXNjcmliZSgndmFsaWRhdGVBY2Nlc3NDb250cm9sJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgdmFsaWRhdGUgdmFsaWQgYWNjZXNzIGNvbnRyb2wgc2V0dGluZ3MnLCAoKSA9PiB7XG4gICAgICBjb25zdCBhY2Nlc3NDb250cm9sOiBBY2Nlc3NDb250cm9sID0ge1xuICAgICAgICB2aXNpYmlsaXR5OiAnb3JnYW5pemF0aW9uJyxcbiAgICAgICAgYWxsb3dlZE9yZ2FuaXphdGlvbnM6IFsnb3JnMSddXG4gICAgICB9O1xuICAgICAgXG4gICAgICBjb25zdCByZXN1bHQgPSB2YWxpZGF0ZUFjY2Vzc0NvbnRyb2woYWNjZXNzQ29udHJvbCk7XG4gICAgICBcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvQmUodHJ1ZSk7XG4gICAgfSk7XG4gICAgXG4gICAgaXQoJ3Nob3VsZCByZWplY3QgaW52YWxpZCB2aXNpYmlsaXR5JywgKCkgPT4ge1xuICAgICAgLy8gVXNlIHR5cGUgYXNzZXJ0aW9uIHRvIHVua25vd24gZmlyc3QgdG8gYXZvaWQgVHlwZVNjcmlwdCBlcnJvclxuICAgICAgY29uc3QgYWNjZXNzQ29udHJvbCA9IHtcbiAgICAgICAgdmlzaWJpbGl0eTogJ2ludmFsaWQnIGFzIGFueSxcbiAgICAgICAgYWxsb3dlZE9yZ2FuaXphdGlvbnM6IFsnb3JnMSddXG4gICAgICB9IGFzIEFjY2Vzc0NvbnRyb2w7XG4gICAgICBcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHZhbGlkYXRlQWNjZXNzQ29udHJvbChhY2Nlc3NDb250cm9sKTtcbiAgICAgIFxuICAgICAgZXhwZWN0KHJlc3VsdCkudG9CZShmYWxzZSk7XG4gICAgfSk7XG4gICAgXG4gICAgaXQoJ3Nob3VsZCByZWplY3Qgb3JnYW5pemF0aW9uIHZpc2liaWxpdHkgd2l0aG91dCBhbGxvd2VkIG9yZ2FuaXphdGlvbnMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBhY2Nlc3NDb250cm9sOiBBY2Nlc3NDb250cm9sID0ge1xuICAgICAgICB2aXNpYmlsaXR5OiAnb3JnYW5pemF0aW9uJyxcbiAgICAgICAgYWxsb3dlZE9yZ2FuaXphdGlvbnM6IFtdXG4gICAgICB9O1xuICAgICAgXG4gICAgICBjb25zdCByZXN1bHQgPSB2YWxpZGF0ZUFjY2Vzc0NvbnRyb2woYWNjZXNzQ29udHJvbCk7XG4gICAgICBcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvQmUoZmFsc2UpO1xuICAgIH0pO1xuICAgIFxuICAgIGl0KCdzaG91bGQgcmVqZWN0IHJvbGUgdmlzaWJpbGl0eSB3aXRob3V0IGFsbG93ZWQgcm9sZXMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBhY2Nlc3NDb250cm9sOiBBY2Nlc3NDb250cm9sID0ge1xuICAgICAgICB2aXNpYmlsaXR5OiAncm9sZScsXG4gICAgICAgIGFsbG93ZWRSb2xlczogW11cbiAgICAgIH07XG4gICAgICBcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHZhbGlkYXRlQWNjZXNzQ29udHJvbChhY2Nlc3NDb250cm9sKTtcbiAgICAgIFxuICAgICAgZXhwZWN0KHJlc3VsdCkudG9CZShmYWxzZSk7XG4gICAgfSk7XG4gICAgXG4gICAgaXQoJ3Nob3VsZCByZWplY3QgdXNlciB2aXNpYmlsaXR5IHdpdGhvdXQgYWxsb3dlZCB1c2VycycsICgpID0+IHtcbiAgICAgIGNvbnN0IGFjY2Vzc0NvbnRyb2w6IEFjY2Vzc0NvbnRyb2wgPSB7XG4gICAgICAgIHZpc2liaWxpdHk6ICd1c2VyJyxcbiAgICAgICAgYWxsb3dlZFVzZXJzOiBbXVxuICAgICAgfTtcbiAgICAgIFxuICAgICAgY29uc3QgcmVzdWx0ID0gdmFsaWRhdGVBY2Nlc3NDb250cm9sKGFjY2Vzc0NvbnRyb2wpO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzdWx0KS50b0JlKGZhbHNlKTtcbiAgICB9KTtcbiAgfSk7XG4gIFxuICBkZXNjcmliZSgnbWVyZ2VBY2Nlc3NDb250cm9sJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgbWVyZ2UgYWNjZXNzIGNvbnRyb2wgc2V0dGluZ3MnLCAoKSA9PiB7XG4gICAgICBjb25zdCBiYXNlOiBBY2Nlc3NDb250cm9sID0ge1xuICAgICAgICB2aXNpYmlsaXR5OiAnb3JnYW5pemF0aW9uJyxcbiAgICAgICAgYWxsb3dlZE9yZ2FuaXphdGlvbnM6IFsnb3JnMSddXG4gICAgICB9O1xuICAgICAgXG4gICAgICBjb25zdCBvdmVycmlkZTogUGFydGlhbDxBY2Nlc3NDb250cm9sPiA9IHtcbiAgICAgICAgdmlzaWJpbGl0eTogJ3VzZXInLFxuICAgICAgICBhbGxvd2VkVXNlcnM6IFsndXNlcjEnXVxuICAgICAgfTtcbiAgICAgIFxuICAgICAgY29uc3QgcmVzdWx0ID0gbWVyZ2VBY2Nlc3NDb250cm9sKGJhc2UsIG92ZXJyaWRlKTtcbiAgICAgIFxuICAgICAgZXhwZWN0KHJlc3VsdC52aXNpYmlsaXR5KS50b0JlKCd1c2VyJyk7XG4gICAgICBleHBlY3QocmVzdWx0LmFsbG93ZWRVc2VycykudG9FcXVhbChbJ3VzZXIxJ10pO1xuICAgICAgZXhwZWN0KHJlc3VsdC5hbGxvd2VkT3JnYW5pemF0aW9ucykudG9FcXVhbChbJ29yZzEnXSk7XG4gICAgfSk7XG4gICAgXG4gICAgaXQoJ3Nob3VsZCBrZWVwIGJhc2UgdmFsdWVzIHdoZW4gb3ZlcnJpZGUgaXMgZW1wdHknLCAoKSA9PiB7XG4gICAgICBjb25zdCBiYXNlOiBBY2Nlc3NDb250cm9sID0ge1xuICAgICAgICB2aXNpYmlsaXR5OiAnb3JnYW5pemF0aW9uJyxcbiAgICAgICAgYWxsb3dlZE9yZ2FuaXphdGlvbnM6IFsnb3JnMSddXG4gICAgICB9O1xuICAgICAgXG4gICAgICBjb25zdCBvdmVycmlkZSA9IHt9O1xuICAgICAgXG4gICAgICBjb25zdCByZXN1bHQgPSBtZXJnZUFjY2Vzc0NvbnRyb2woYmFzZSwgb3ZlcnJpZGUpO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzdWx0LnZpc2liaWxpdHkpLnRvQmUoJ29yZ2FuaXphdGlvbicpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5hbGxvd2VkT3JnYW5pemF0aW9ucykudG9FcXVhbChbJ29yZzEnXSk7XG4gICAgfSk7XG4gIH0pO1xuICBcbiAgZGVzY3JpYmUoJ3Jlc3RyaWN0QWNjZXNzQ29udHJvbCcsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHJlc3RyaWN0IHB1YmxpYyB2aXNpYmlsaXR5IHdoZW4gdXNlciBjYW5ub3QgbWFrZSByZXNvdXJjZXMgcHVibGljJywgKCkgPT4ge1xuICAgICAgY29uc3QgYWNjZXNzQ29udHJvbDogQWNjZXNzQ29udHJvbCA9IHtcbiAgICAgICAgdmlzaWJpbGl0eTogJ3B1YmxpYydcbiAgICAgIH07XG4gICAgICBcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHJlc3RyaWN0QWNjZXNzQ29udHJvbChhY2Nlc3NDb250cm9sLCAndXNlcjEnLCBbJ2FuYWx5c3QnXSwgZmFsc2UpO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzdWx0LnZpc2liaWxpdHkpLnRvQmUoJ29yZ2FuaXphdGlvbicpO1xuICAgIH0pO1xuICAgIFxuICAgIGl0KCdzaG91bGQga2VlcCBwdWJsaWMgdmlzaWJpbGl0eSB3aGVuIHVzZXIgY2FuIG1ha2UgcmVzb3VyY2VzIHB1YmxpYycsICgpID0+IHtcbiAgICAgIGNvbnN0IGFjY2Vzc0NvbnRyb2w6IEFjY2Vzc0NvbnRyb2wgPSB7XG4gICAgICAgIHZpc2liaWxpdHk6ICdwdWJsaWMnXG4gICAgICB9O1xuICAgICAgXG4gICAgICBjb25zdCByZXN1bHQgPSByZXN0cmljdEFjY2Vzc0NvbnRyb2woYWNjZXNzQ29udHJvbCwgJ3VzZXIxJywgWydhbmFseXN0J10sIHRydWUpO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzdWx0LnZpc2liaWxpdHkpLnRvQmUoJ3B1YmxpYycpO1xuICAgIH0pO1xuICAgIFxuICAgIGl0KCdzaG91bGQgZW5zdXJlIHVzZXIgaXMgaW5jbHVkZWQgaW4gYWxsb3dlZCB1c2VycyBmb3IgdXNlci1zcGVjaWZpYyByZXNvdXJjZXMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBhY2Nlc3NDb250cm9sOiBBY2Nlc3NDb250cm9sID0ge1xuICAgICAgICB2aXNpYmlsaXR5OiAndXNlcicsXG4gICAgICAgIGFsbG93ZWRVc2VyczogWyd1c2VyMiddXG4gICAgICB9O1xuICAgICAgXG4gICAgICBjb25zdCByZXN1bHQgPSByZXN0cmljdEFjY2Vzc0NvbnRyb2woYWNjZXNzQ29udHJvbCwgJ3VzZXIxJywgWydhbmFseXN0J10sIGZhbHNlKTtcbiAgICAgIFxuICAgICAgZXhwZWN0KHJlc3VsdC52aXNpYmlsaXR5KS50b0JlKCd1c2VyJyk7XG4gICAgICBleHBlY3QocmVzdWx0LmFsbG93ZWRVc2VycykudG9Db250YWluKCd1c2VyMScpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5hbGxvd2VkVXNlcnMpLnRvQ29udGFpbigndXNlcjInKTtcbiAgICB9KTtcbiAgICBcbiAgICBpdCgnc2hvdWxkIGluaXRpYWxpemUgYWxsb3dlZFVzZXJzIGFycmF5IGlmIGl0IGRvZXMgbm90IGV4aXN0JywgKCkgPT4ge1xuICAgICAgY29uc3QgYWNjZXNzQ29udHJvbDogQWNjZXNzQ29udHJvbCA9IHtcbiAgICAgICAgdmlzaWJpbGl0eTogJ3VzZXInXG4gICAgICB9O1xuICAgICAgXG4gICAgICBjb25zdCByZXN1bHQgPSByZXN0cmljdEFjY2Vzc0NvbnRyb2woYWNjZXNzQ29udHJvbCwgJ3VzZXIxJywgWydhbmFseXN0J10sIGZhbHNlKTtcbiAgICAgIFxuICAgICAgZXhwZWN0KHJlc3VsdC52aXNpYmlsaXR5KS50b0JlKCd1c2VyJyk7XG4gICAgICBleHBlY3QocmVzdWx0LmFsbG93ZWRVc2VycykudG9FcXVhbChbJ3VzZXIxJ10pO1xuICAgIH0pO1xuICAgIFxuICAgIGl0KCdzaG91bGQgbm90IG1vZGlmeSBub24tdXNlciB2aXNpYmlsaXR5IHNldHRpbmdzJywgKCkgPT4ge1xuICAgICAgY29uc3QgYWNjZXNzQ29udHJvbDogQWNjZXNzQ29udHJvbCA9IHtcbiAgICAgICAgdmlzaWJpbGl0eTogJ3JvbGUnLFxuICAgICAgICBhbGxvd2VkUm9sZXM6IFsnYW5hbHlzdCddXG4gICAgICB9O1xuICAgICAgXG4gICAgICBjb25zdCByZXN1bHQgPSByZXN0cmljdEFjY2Vzc0NvbnRyb2woYWNjZXNzQ29udHJvbCwgJ3VzZXIxJywgWydhbmFseXN0J10sIGZhbHNlKTtcbiAgICAgIFxuICAgICAgZXhwZWN0KHJlc3VsdC52aXNpYmlsaXR5KS50b0JlKCdyb2xlJyk7XG4gICAgICBleHBlY3QocmVzdWx0LmFsbG93ZWRSb2xlcykudG9FcXVhbChbJ2FuYWx5c3QnXSk7XG4gICAgfSk7XG4gIH0pO1xuICBcbiAgZGVzY3JpYmUoJ2VkZ2UgY2FzZXMnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgdW5kZWZpbmVkIGFycmF5cyBpbiBoYXNBY2Nlc3MnLCAoKSA9PiB7XG4gICAgICBjb25zdCBhY2Nlc3NDb250cm9sOiBBY2Nlc3NDb250cm9sID0ge1xuICAgICAgICB2aXNpYmlsaXR5OiAncm9sZSdcbiAgICAgICAgLy8gYWxsb3dlZFJvbGVzIGlzIHVuZGVmaW5lZFxuICAgICAgfTtcbiAgICAgIFxuICAgICAgY29uc3QgcmVzdWx0ID0gaGFzQWNjZXNzKCd1c2VyMScsIFsnYW5hbHlzdCddLCAnb3JnMScsIGFjY2Vzc0NvbnRyb2wpO1xuICAgICAgXG4gICAgICAvLyBTaG91bGQgcmV0dXJuIGZhbHNlIGJlY2F1c2UgYWxsb3dlZFJvbGVzIGlzIHVuZGVmaW5lZFxuICAgICAgZXhwZWN0KHJlc3VsdCkudG9CZShmYWxzZSk7XG4gICAgfSk7XG4gICAgXG4gICAgaXQoJ3Nob3VsZCB2YWxpZGF0ZSBwdWJsaWMgdmlzaWJpbGl0eSB3aXRoIG5vIGFycmF5cycsICgpID0+IHtcbiAgICAgIGNvbnN0IGFjY2Vzc0NvbnRyb2w6IEFjY2Vzc0NvbnRyb2wgPSB7XG4gICAgICAgIHZpc2liaWxpdHk6ICdwdWJsaWMnXG4gICAgICAgIC8vIE5vIGFycmF5cyBuZWVkZWQgZm9yIHB1YmxpYyB2aXNpYmlsaXR5XG4gICAgICB9O1xuICAgICAgXG4gICAgICBjb25zdCByZXN1bHQgPSB2YWxpZGF0ZUFjY2Vzc0NvbnRyb2woYWNjZXNzQ29udHJvbCk7XG4gICAgICBcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvQmUodHJ1ZSk7XG4gICAgfSk7XG4gIH0pO1xufSk7Il19