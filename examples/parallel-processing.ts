/**
 * Example demonstrating parallel processing in type-compiler
 * 
 * This file contains complex nested types that benefit from parallel processing.
 * To run this example:
 * 1. Configure tsconfig.json with parallel processing enabled
 * 2. Compile with: tsc --project tsconfig.json examples/parallel-processing.ts
 * 3. Run with: node examples/parallel-processing.js
 */

// -------------------------------------------------------------------------
// Complex type definitions that will be processed in parallel
// -------------------------------------------------------------------------

/**
 * Product domain model with nested types
 */
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categories: Category[];
  variants: Variant[];
  inventoryStatus: InventoryStatus;
  manufacturer: Manufacturer;
  reviews: Review[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parentCategory?: Category;
  children: Category[];
  attributes: CategoryAttribute[];
}

interface CategoryAttribute {
  id: string;
  name: string;
  values: string[];
  required: boolean;
}

interface Variant {
  id: string;
  sku: string;
  name: string;
  attributes: Record<string, string>;
  price: number;
  salePrice?: number;
  stock: number;
  dimensions: Dimensions;
  weight: number;
  images: Image[];
}

interface Dimensions {
  width: number;
  height: number;
  depth: number;
  unit: 'cm' | 'in';
}

interface Image {
  id: string;
  url: string;
  alt: string;
  width: number;
  height: number;
  tags: string[];
}

type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'backorder';

interface Manufacturer {
  id: string;
  name: string;
  website: string;
  address: Address;
  contact: Contact;
}

interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface Contact {
  name: string;
  email: string;
  phone: string;
  position: string;
}

interface Review {
  id: string;
  authorId: string;
  rating: number;
  title: string;
  content: string;
  helpful: number;
  verified: boolean;
  createdAt: Date;
  images?: Image[];
  responses?: ReviewResponse[];
}

interface ReviewResponse {
  id: string;
  authorId: string;
  content: string;
  createdAt: Date;
}

/**
 * Order domain model with nested types
 */
interface Order {
  id: string;
  customerId: string;
  orderNumber: string;
  status: OrderStatus;
  items: OrderItem[];
  shipping: ShippingInfo;
  billing: BillingInfo;
  payment: PaymentInfo;
  totals: OrderTotals;
  discounts: Discount[];
  notes: Note[];
  createdAt: Date;
  updatedAt: Date;
}

type OrderStatus = 
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discounts: Discount[];
  metadata: Record<string, unknown>;
}

interface ShippingInfo {
  address: Address;
  method: ShippingMethod;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
}

interface ShippingMethod {
  id: string;
  name: string;
  carrier: string;
  price: number;
  estimatedDays: number;
}

interface BillingInfo {
  address: Address;
  vatNumber?: string;
}

interface PaymentInfo {
  method: 'credit_card' | 'paypal' | 'bank_transfer' | 'crypto';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  amount: number;
  currency: string;
  cardLast4?: string;
  paidAt?: Date;
}

interface OrderTotals {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
}

interface Discount {
  id: string;
  code?: string;
  description: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  appliesTo: 'order' | 'item';
  itemId?: string;
}

interface Note {
  id: string;
  authorId: string;
  content: string;
  isInternal: boolean;
  createdAt: Date;
}

/**
 * Customer domain model with nested types
 */
interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  addresses: Address[];
  paymentMethods: PaymentMethod[];
  orders: OrderSummary[];
  wishlist: WishlistItem[];
  preferences: CustomerPreferences;
  segments: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'paypal' | 'bank_account';
  isDefault: boolean;
  cardType?: string;
  cardLast4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  accountEmail?: string;
  accountName?: string;
}

interface OrderSummary {
  id: string;
  orderNumber: string;
  date: Date;
  status: OrderStatus;
  total: number;
  items: number;
}

interface WishlistItem {
  id: string;
  productId: string;
  variantId?: string;
  addedAt: Date;
  notes?: string;
}

interface CustomerPreferences {
  marketingEmails: boolean;
  productUpdates: boolean;
  orderUpdates: boolean;
  theme: 'light' | 'dark' | 'system';
  currency: string;
  language: string;
}

// -------------------------------------------------------------------------
// Example usage demonstrating how Zod schemas would be used
// -------------------------------------------------------------------------

/**
 * The type-compiler plugin will automatically generate Zod schemas for all
 * the interfaces and types defined above. Here's how you would use them:
 */
function validateProductData(data: unknown): Product {
  // In a real application, this would be imported from the generated code
  // import { zProduct } from './parallel-processing';
  
  // For this example, we're simulating the validation with a placeholder
  const zProduct = {
    parse: (data: unknown): Product => {
      console.log('Validating product data...');
      return data as Product;
    }
  };
  
  try {
    // Validate with Zod schema
    return zProduct.parse(data);
  } catch (error) {
    console.error('Invalid product data:', error);
    throw new Error('Product validation failed');
  }
}

function validateOrderData(data: unknown): Order {
  // In a real application, this would be imported from the generated code
  // import { zOrder } from './parallel-processing';
  
  // For this example, we're simulating the validation with a placeholder
  const zOrder = {
    parse: (data: unknown): Order => {
      console.log('Validating order data...');
      return data as Order;
    }
  };
  
  try {
    // Validate with Zod schema
    return zOrder.parse(data);
  } catch (error) {
    console.error('Invalid order data:', error);
    throw new Error('Order validation failed');
  }
}

function validateCustomerData(data: unknown): Customer {
  // In a real application, this would be imported from the generated code
  // import { zCustomer } from './parallel-processing';
  
  // For this example, we're simulating the validation with a placeholder
  const zCustomer = {
    parse: (data: unknown): Customer => {
      console.log('Validating customer data...');
      return data as Customer;
    }
  };
  
  try {
    // Validate with Zod schema
    return zCustomer.parse(data);
  } catch (error) {
    console.error('Invalid customer data:', error);
    throw new Error('Customer validation failed');
  }
}

// Demonstration
async function main() {
  console.log('===========================================================');
  console.log('Parallel Processing Example');
  console.log('===========================================================');
  console.log('');
  console.log('This file contains complex types that benefit from parallel processing.');
  console.log('');
  console.log('When compiled with parallel processing enabled, type-compiler will:');
  console.log('1. Distribute type processing across multiple worker threads');
  console.log('2. Process complex nested types in parallel batches');
  console.log('3. Combine the results to generate complete Zod schemas');
  console.log('');
  
  // Simulating data from API or database
  const productData = { id: 'prod-123', name: 'Sample Product' /* ... */ };
  const orderData = { id: 'order-456', customerId: 'cust-789' /* ... */ };
  const customerData = { id: 'cust-789', email: 'customer@example.com' /* ... */ };
  
  console.log('Validating data with generated Zod schemas:');
  console.log('-------------------------------------------');
  
  try {
    // In a real application, these would use the actual Zod schemas
    // generated by type-compiler with parallel processing enabled
    const validProduct = validateProductData(productData);
    const validOrder = validateOrderData(orderData);
    const validCustomer = validateCustomerData(customerData);
    
    console.log('✅ All data validated successfully!');
    
    // Use the validated data in your application...
  } catch (error) {
    console.error('❌ Validation failed:', error);
  }
}

// Run the example
main().catch(console.error); 