/**
 * Example types that will use special field validators
 */

/**
 * User profile interface
 */
export interface User {
  uuid: string;
  username: string;
  email: string;
  password: string;
  birthDate: string;
  age: number;
  profileUrl: string;
  phoneNumber: string;
  createdAt: Date;
}

/**
 * Location data interface
 */
export interface Location {
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  zipCode: string;
}

/**
 * Server information interface
 */
export interface Server {
  hostname: string;
  ipAddress: string;
  url: string;
  port: number;
  lastChecked: Date;
}

/**
 * Contact information interface
 */
export interface Contact {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
}

/**
 * Order information
 */
export interface Order {
  uuid: string;
  userId: string;
  items: OrderItem[];
  total: number;
  billingEmail: string;
  shippingAddress: string;
  createdAt: Date;
}

/**
 * Order item
 */
export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

/**
 * Product information
 */
export interface Product {
  uuid: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  weight: number;
}

/**
 * Website configuration
 */
export interface WebsiteConfig {
  name: string;
  url: string;
  adminEmail: string;
  maxUploadSize: number;
  allowedDomains: string[];
}

/**
 * User credentials for login
 */
export type LoginCredentials = {
  email: string;
  password: string;
}

/**
 * Reset password request
 */
export type PasswordReset = {
  email: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Geographic point
 */
export type GeoPoint = {
  latitude: number;
  longitude: number;
  elevation?: number;
}

/**
 * The following types demonstrate pattern-based matching features
 * ===============================================================
 */

/**
 * Multiple email fields with similar naming patterns
 */
export interface EmailSubscription {
  id: string;
  primaryEmail: string;         // Will match ^.*Email$ pattern
  backupEmail: string;          // Will match ^.*Email$ pattern
  marketingEmail: string;       // Will match ^.*Email$ pattern
  unsubscribeReason: string;    // No special validation
  lastSent: Date;
}

/**
 * Fields with 'id' prefix that will be validated as UUIDs
 */
export interface EntityRelationship {
  idParent: string;             // Will match ^id[A-Z] pattern
  idChild: string;              // Will match ^id[A-Z] pattern
  idRelationType: string;       // Will match ^id[A-Z] pattern
  name: string;                 // No special validation
  description: string;          // No special validation
}

/**
 * Pricing information with price fields
 */
export interface ProductPricing {
  productId: string;            // Not matching the pattern (lowercase d)
  priceBase: number;            // Will match ^price[A-Z] pattern
  priceWithTax: number;         // Will match ^price[A-Z] pattern
  priceDiscount: number;        // Will match ^price[A-Z] pattern
  tax: number;                  // No special validation
  currency: string;             // No special validation
}

/**
 * Media item with image URLs
 */
export interface MediaItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;             // Not matching the pattern (lowercase all)
  imageThumbnail: string;       // Will match (^img|^image)[A-Z] pattern
  imageFullsize: string;        // Will match (^img|^image)[A-Z] pattern
  imgPreview: string;           // Will match (^img|^image)[A-Z] pattern
}

/**
 * Custom location format with different naming convention
 */
export interface CustomMapLocation {
  name: string;
  latPoint: number;             // Will match ^(lat|Long)[A-Z] pattern
  LongPosition: number;         // Will match ^(lat|Long)[A-Z] pattern
  altitude: number;             // No special validation
} 