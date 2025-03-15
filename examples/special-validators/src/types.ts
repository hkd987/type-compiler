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

/**
 * The following types demonstrate the new pattern-based validators
 * ================================================================
 */

/**
 * E-commerce product with various fields that will be matched by the validators
 */
export interface EcommerceProduct {
  productId: string;                  // Will match '.*(?:Id|Key|Code)$'
  sku: string;
  name: string;
  description: string;
  basePrice: number;                  // Will match '(?:amount|cost|price|fee|total)(?:$|[A-Z])'
  discountAmount: number;             // Will match '(?:amount|cost|price|fee|total)(?:$|[A-Z])'
  totalPrice: number;                 // Will match '(?:amount|cost|price|fee|total)(?:$|[A-Z])'
  taxRate: number;                    // Will match '.*(?:Percent|Rate|Ratio)$'
  stockCount: number;                 // Will match '.*Count$'
  dimensions: ProductDimensions;
  availableColors: string[];          // Not directly matched (array of colors)
  primaryColor: string;               // Will match '.*[Cc]olor$'
  tags: string[];                     // Will match '^(?:tags|categories|items|products|users)$'
  categories: string[];               // Will match '^(?:tags|categories|items|products|users)$'
  isAvailable: boolean;               // Will match '^is[A-Z]|^has[A-Z]|^can[A-Z]|^should[A-Z]'
  hasVariants: boolean;               // Will match '^is[A-Z]|^has[A-Z]|^can[A-Z]|^should[A-Z]'
  productStatus: string;              // Will match '.*Status$'
  createdAt: Date;                    // Will match '^.*(?:At|Date|Time)$'
  updatedAt: Date;                    // Will match '^.*(?:At|Date|Time)$'
}

/**
 * Product dimensions with fields that will match the dimension validators
 */
export interface ProductDimensions {
  width: number;                      // Will match '(?:width|height|depth|length|radius|size)(?:$|[A-Z])'
  height: number;                     // Will match '(?:width|height|depth|length|radius|size)(?:$|[A-Z])'
  depth: number;                      // Will match '(?:width|height|depth|length|radius|size)(?:$|[A-Z])'
  weight: number;                     // Not matched by dimension pattern
  sizeCategory: string;               // Not matched (doesn't end with 'size' or start with 'size')
}

/**
 * User activity tracking with timestamp fields
 */
export interface UserActivity {
  activityId: string;                 // Will match '.*(?:Id|Key|Code)$'
  userId: string;                     // Will match '.*(?:Id|Key|Code)$'
  sessionId: string;                  // Will match '.*(?:Id|Key|Code)$'
  activityType: string;
  startTime: Date;                    // Will match '^.*(?:At|Date|Time)$'
  endTime: Date;                      // Will match '^.*(?:At|Date|Time)$'
  loginDate: string;                  // Will match '^.*(?:At|Date|Time)$' (will be coerced to Date)
  durationSeconds: number;
  completionRate: number;             // Will match '.*(?:Percent|Rate|Ratio)$'
  clickCount: number;                 // Will match '.*Count$'
  pageViewCount: number;              // Will match '.*Count$'
  isCompleted: boolean;               // Will match '^is[A-Z]|^has[A-Z]|^can[A-Z]|^should[A-Z]'
  canResume: boolean;                 // Will match '^is[A-Z]|^has[A-Z]|^can[A-Z]|^should[A-Z]'
  activityStatus: string;             // Will match '.*Status$'
}

/**
 * Financial transaction with monetary values and status
 */
export interface Transaction {
  transactionId: string;              // Will match '.*(?:Id|Key|Code)$'
  referenceCode: string;              // Will match '.*(?:Id|Key|Code)$'
  amount: number;                     // Will match '(?:amount|cost|price|fee|total)(?:$|[A-Z])'
  fee: number;                        // Will match '(?:amount|cost|price|fee|total)(?:$|[A-Z])'
  totalAmount: number;                // Will match '(?:amount|cost|price|fee|total)(?:$|[A-Z])'
  interestRate: number;               // Will match '.*(?:Percent|Rate|Ratio)$'
  exchangeRate: number;               // Will match '.*(?:Percent|Rate|Ratio)$'
  transactionDate: Date;              // Will match '^.*(?:At|Date|Time)$'
  processedAt: Date;                  // Will match '^.*(?:At|Date|Time)$'
  shouldNotify: boolean;              // Will match '^is[A-Z]|^has[A-Z]|^can[A-Z]|^should[A-Z]'
  transactionStatus: string;          // Will match '.*Status$'
}

/**
 * UI Theme with color properties
 */
export interface Theme {
  themeId: string;                    // Will match '.*(?:Id|Key|Code)$'
  name: string;
  primaryColor: string;               // Will match '.*[Cc]olor$'
  secondaryColor: string;             // Will match '.*[Cc]olor$'
  backgroundColor: string;            // Will match '.*[Cc]olor$'
  textColor: string;                  // Will match '.*[Cc]olor$'
  accentColor: string;                // Will match '.*[Cc]olor$'
  isDefault: boolean;                 // Will match '^is[A-Z]|^has[A-Z]|^can[A-Z]|^should[A-Z]'
  createdAt: Date;                    // Will match '^.*(?:At|Date|Time)$'
}

/**
 * Analytics data with counts and rates
 */
export interface AnalyticsData {
  metricId: string;                   // Will match '.*(?:Id|Key|Code)$'
  pageId: string;                     // Will match '.*(?:Id|Key|Code)$'
  visitorCount: number;               // Will match '.*Count$'
  conversionCount: number;            // Will match '.*Count$'
  bounceCount: number;                // Will match '.*Count$'
  conversionRate: number;             // Will match '.*(?:Percent|Rate|Ratio)$'
  bounceRate: number;                 // Will match '.*(?:Percent|Rate|Ratio)$'
  engagementRatio: number;            // Will match '.*(?:Percent|Rate|Ratio)$'
  recordedAt: Date;                   // Will match '^.*(?:At|Date|Time)$'
  periodStartDate: string;            // Will match '^.*(?:At|Date|Time)$' (will be coerced to Date)
  periodEndDate: string;              // Will match '^.*(?:At|Date|Time)$' (will be coerced to Date)
  isRealTime: boolean;                // Will match '^is[A-Z]|^has[A-Z]|^can[A-Z]|^should[A-Z]'
  dataStatus: string;                 // Will match '.*Status$'
}

/**
 * Ship an order - demonstrates status validation
 */
export interface ShippingOrder {
  orderId: string;                    // Will match '.*(?:Id|Key|Code)$'
  trackingCode: string;               // Will match '.*(?:Id|Key|Code)$'
  shippingStatus: string;             // Will match '.*Status$' (should be one of enum values)
  paymentStatus: string;              // Will match '.*Status$' (should be one of enum values)
  orderStatus: string;                // Will match '.*Status$' (should be one of enum values)
  shippingCost: number;               // Will match '(?:amount|cost|price|fee|total)(?:$|[A-Z])'
  packageWidth: number;               // Will match '(?:width|height|depth|length|radius|size)(?:$|[A-Z])'
  packageHeight: number;              // Will match '(?:width|height|depth|length|radius|size)(?:$|[A-Z])'
  packageLength: number;              // Will match '(?:width|height|depth|length|radius|size)(?:$|[A-Z])'
  orderDate: Date;                    // Will match '^.*(?:At|Date|Time)$'
  shipByDate: Date;                   // Will match '^.*(?:At|Date|Time)$'
  deliveryTime: string;               // Will match '^.*(?:At|Date|Time)$' (will be coerced to Date)
  isExpress: boolean;                 // Will match '^is[A-Z]|^has[A-Z]|^can[A-Z]|^should[A-Z]'
  hasInsurance: boolean;              // Will match '^is[A-Z]|^has[A-Z]|^can[A-Z]|^should[A-Z]'
  items: string[];                    // Will match '^(?:tags|categories|items|products|users)$'
} 