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