/**
 * Types demonstrating contextual validation
 * 
 * This file contains TypeScript interfaces that will have different validation rules
 * applied based on their type name using the contextualValidators feature.
 */

/**
 * User type with company-specific validation:
 * - email must end with @company.com
 * - role must be one of: admin, user, guest
 * - status must be one of: active, inactive
 */
export interface User {
  id: string;
  name: string;
  email: string;           // Must end with @company.com
  role: string;            // Must be 'admin', 'user', or 'guest'
  status: string;          // Must be 'active' or 'inactive'
  createdAt: Date;
}

/**
 * Customer type with different validation rules than User:
 * - email can be any valid email (no domain restriction)
 * - type must be one of: individual, business
 * - status has more options: active, inactive, pending, suspended
 */
export interface Customer {
  id: string;
  name: string;
  email: string;           // Any valid email
  type: string;            // Must be 'individual' or 'business'
  status: string;          // Can be 'active', 'inactive', 'pending', or 'suspended'
  createdAt: Date;
}

/**
 * AdminUser type matches the pattern "^(Admin|Super)User$"
 * - permissions must be a non-empty array of strings
 */
export interface AdminUser {
  id: string;
  name: string;
  email: string;           // Must end with @company.com (matches User pattern)
  role: string;            // Must be 'admin', 'user', or 'guest' (matches User pattern)
  permissions: string[];   // Must be a non-empty array (from pattern match)
  createdAt: Date;
}

/**
 * SuperUser type also matches the pattern "^(Admin|Super)User$"
 * - permissions must be a non-empty array of strings (same as AdminUser)
 */
export interface SuperUser {
  id: string;
  name: string;
  email: string;           // Must end with @company.com (matches User pattern)
  role: string;            // Must be 'admin', 'user', or 'guest' (matches User pattern)
  permissions: string[];   // Must be a non-empty array (from pattern match)
  createdAt: Date;
}

/**
 * PhysicalProduct type matches the pattern "^.*Product$"
 * - price must be positive and >= 0.01
 * - inventory must be a non-negative integer
 */
export interface PhysicalProduct {
  id: string;
  name: string;
  description: string;
  price: number;           // Must be >= 0.01 (from pattern match)
  inventory: number;       // Must be an integer >= 0 (from pattern match)
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  createdAt: Date;
}

/**
 * DigitalProduct type also matches the pattern "^.*Product$"
 * - price must be positive and >= 0.01 (same as PhysicalProduct)
 * - inventory must be a non-negative integer (same as PhysicalProduct)
 */
export interface DigitalProduct {
  id: string;
  name: string;
  description: string;
  price: number;           // Must be >= 0.01 (from pattern match)
  inventory: number;       // Must be an integer >= 0 (from pattern match)
  downloadUrl: string;
  fileSize: number;
  createdAt: Date;
}

/**
 * A regular product type that doesn't match any special patterns
 * - price gets the default specialFieldValidator (just positive)
 */
export interface RegularProduct {
  id: string;
  name: string;
  price: number;           // Just positive (from specialFieldValidators)
  createdAt: Date;
} 