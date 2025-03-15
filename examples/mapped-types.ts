/**
 * Example demonstrating mapped types support in the type-compiler
 * 
 * To run this example:
 * 1. Compile with: tsc --project tsconfig.json examples/mapped-types.ts
 * 2. Run with: node examples/mapped-types.js
 */

// Base interface we'll transform with mapped types
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Common TypeScript utility types (built-in mapped types)
type PartialProduct = Partial<Product>;
type ProductSummary = Pick<Product, 'id' | 'name' | 'price'>;
type ProductWithoutDates = Omit<Product, 'createdAt' | 'updatedAt'>;
type ReadonlyProduct = Readonly<Product>;

// Common record types
type ProductDictionary = Record<string, Product>;
type ProductAttributeMap = Record<keyof Product, string>;

// Custom mapped types
type NullableProduct = { [K in keyof Product]: Product[K] | null };
type OptionalProduct = { [K in keyof Product]?: Product[K] };

// More complex mapped types with conditionals
type ProductStringified = {
  [K in keyof Product]: Product[K] extends Date 
    ? string 
    : Product[K] extends number
      ? string
      : Product[K]
};

// Combining mapped types with generics
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
};

type DeepPartialProduct = DeepPartial<Product>;

// Sample data
const product: Product = {
  id: 1,
  name: "Laptop",
  description: "High-performance laptop with 16GB RAM",
  price: 999.99,
  stock: 10,
  tags: ["electronics", "computers"],
  createdAt: new Date(),
  updatedAt: new Date()
};

// Example of how the compiler would generate validators
/**
 * The compiler would generate validators like:
 * 
 * export const zProduct = z.object({
 *   id: z.number(),
 *   name: z.string(),
 *   description: z.string(),
 *   price: z.number(),
 *   stock: z.number(),
 *   tags: z.array(z.string()),
 *   createdAt: z.date(),
 *   updatedAt: z.date()
 * });
 * 
 * // Utility types
 * export const zPartialProduct = zProduct.partial();
 * 
 * export const zProductSummary = zProduct.pick({
 *   'id': true,
 *   'name': true,
 *   'price': true
 * });
 * 
 * export const zProductWithoutDates = zProduct.omit({
 *   'createdAt': true,
 *   'updatedAt': true
 * });
 * 
 * export const zReadonlyProduct = zProduct; // Same validation
 * 
 * export const zProductDictionary = z.record(z.string(), zProduct);
 * 
 * export const zProductAttributeMap = z.object({
 *   id: z.string(),
 *   name: z.string(),
 *   description: z.string(),
 *   price: z.string(),
 *   stock: z.string(),
 *   tags: z.string(),
 *   createdAt: z.string(),
 *   updatedAt: z.string()
 * });
 * 
 * export const zNullableProduct = z.object({
 *   id: z.number().nullable(),
 *   name: z.string().nullable(),
 *   description: z.string().nullable(),
 *   price: z.number().nullable(),
 *   stock: z.number().nullable(),
 *   tags: z.array(z.string()).nullable(),
 *   createdAt: z.date().nullable(),
 *   updatedAt: z.date().nullable()
 * });
 * 
 * export const zOptionalProduct = z.object({
 *   id: z.number().optional(),
 *   name: z.string().optional(),
 *   description: z.string().optional(),
 *   price: z.number().optional(),
 *   stock: z.number().optional(),
 *   tags: z.array(z.string()).optional(),
 *   createdAt: z.date().optional(),
 *   updatedAt: z.date().optional()
 * });
 * 
 * export const zProductStringified = z.object({
 *   id: z.string(),
 *   name: z.string(),
 *   description: z.string(),
 *   price: z.string(),
 *   stock: z.string(),
 *   tags: z.array(z.string()),
 *   createdAt: z.string(),
 *   updatedAt: z.string()
 * });
 */

// Usage example of how these validators would be used
async function main() {
  console.log('=== Product Validation ===');
  
  // This would normally use the generated validators
  console.log('Full Product:', product);
  
  // Partial product validation (missing some fields)
  const partialProduct: PartialProduct = {
    id: 2,
    name: "Smartphone"
  };
  console.log('Partial Product:', partialProduct);
  
  // Product summary (only id, name, price)
  const productSummary: ProductSummary = {
    id: product.id,
    name: product.name,
    price: product.price
  };
  console.log('Product Summary:', productSummary);
  
  // Product without dates
  const productWithoutDates: ProductWithoutDates = {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,
    tags: product.tags
  };
  console.log('Product Without Dates:', productWithoutDates);
  
  // Dictionary of products
  const productDictionary: ProductDictionary = {
    'laptop': product,
    'smartphone': {
      id: 2,
      name: "Smartphone",
      description: "Latest smartphone model",
      price: 699.99,
      stock: 25,
      tags: ["electronics", "phones"],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  };
  console.log('Product Dictionary Keys:', Object.keys(productDictionary));
  
  // Nullable product (some fields might be null)
  const nullableProduct: NullableProduct = {
    id: product.id,
    name: product.name,
    description: null,
    price: product.price,
    stock: null,
    tags: product.tags,
    createdAt: product.createdAt,
    updatedAt: null
  };
  console.log('Nullable Product (null fields):', 
    Object.entries(nullableProduct)
      .filter(([_, value]) => value === null)
      .map(([key]) => key)
  );
  
  // String representation of dates and numbers
  const productStringified: ProductStringified = {
    id: product.id.toString(),
    name: product.name,
    description: product.description,
    price: product.price.toString(),
    stock: product.stock.toString(),
    tags: product.tags,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString()
  };
  console.log('Product Stringified Date:', productStringified.createdAt);
  
  console.log('\n=== With Type Validation ===');
  console.log('(The compiler would generate Zod validators for these types)');
}

main().catch(console.error); 