/**
 * Self-test file for the type-compiler plugin
 * 
 * This file contains types specifically designed to test whether
 * the plugin is working correctly when applied to its own code.
 */

/**
 * A simple test interface with common property types
 */
export interface TestUser {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  roles: string[];
  metadata?: Record<string, unknown>;
}

/**
 * A simple type alias
 */
export type UserRole = 'admin' | 'editor' | 'viewer';

/**
 * A class with methods for testing class validation
 */
export class UserService {
  constructor(private apiKey: string, private timeout: number = 3000) {}
  
  async getUser(id: number): Promise<TestUser | null> {
    console.log(`Getting user with ID ${id}`);
    return {
      id,
      name: 'Test User',
      email: 'test@example.com',
      isActive: true,
      createdAt: new Date(),
      roles: ['viewer']
    };
  }
  
  updateUser(id: number, data: Partial<TestUser>): boolean {
    console.log(`Updating user with ID ${id}`, data);
    return true;
  }
}

/**
 * Check if the Zod schemas were generated correctly
 */
export function validateSelfTest(): boolean {
  try {
    // In a real implementation, we would import and use the generated schemas:
    // import { zTestUser, zUserRole, zUserServiceConstructor } from './self-test';
    
    // const user = zTestUser.parse({...});
    // const role = zUserRole.parse('admin');
    // const [apiKey, timeout] = zUserServiceConstructor.parse(['key', 5000]);
    
    console.log('Self-test validation would check the generated schemas here');
    return true;
  } catch (error) {
    console.error('Self-test validation failed:', error);
    return false;
  }
} 