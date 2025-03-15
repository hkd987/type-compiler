/**
 * Example demonstrating generic type support in the type-compiler
 * 
 * To run this example:
 * 1. Compile with: tsc --project tsconfig.json examples/generic-types.ts
 * 2. Run with: node examples/generic-types.js
 */

// Generic data container
interface Container<T> {
  value: T;
  metadata: {
    timestamp: number;
    source: string;
  };
}

// Generic API response
type ApiResponse<T, E = Error> = {
  data?: T;
  error?: E;
  success: boolean;
  statusCode: number;
};

// Concrete types
interface User {
  id: number;
  name: string;
  email: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  inStock: boolean;
}

// Generic repository class
class Repository<T> {
  constructor(private items: T[] = []) {}
  
  findAll(): Promise<ApiResponse<T[]>> {
    return Promise.resolve({
      data: this.items,
      success: true,
      statusCode: 200
    });
  }
  
  findById(id: number): Promise<ApiResponse<T>> {
    const item = this.items.find((item: any) => item.id === id);
    
    if (!item) {
      return Promise.resolve({
        error: new Error('Not found'),
        success: false,
        statusCode: 404
      });
    }
    
    return Promise.resolve({
      data: item,
      success: true,
      statusCode: 200
    });
  }
  
  create(item: T): Promise<ApiResponse<T>> {
    this.items.push(item);
    return Promise.resolve({
      data: item,
      success: true,
      statusCode: 201
    });
  }
}

// Sample data
const users: User[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' }
];

const products: Product[] = [
  { id: 1, name: 'Laptop', price: 999.99, inStock: true },
  { id: 2, name: 'Phone', price: 699.99, inStock: false }
];

// Create repositories
const userRepo = new Repository<User>(users);
const productRepo = new Repository<Product>(products);

// Usage example (would normally use the generated Zod validators)
async function main() {
  console.log('=== User Repository ===');
  
  const usersResponse = await userRepo.findAll();
  if (usersResponse.success) {
    console.log('All users:', usersResponse.data);
  }
  
  const userResponse = await userRepo.findById(1);
  if (userResponse.success) {
    console.log('User with ID 1:', userResponse.data);
  }
  
  console.log('\n=== Product Repository ===');
  
  const productsResponse = await productRepo.findAll();
  if (productsResponse.success) {
    console.log('All products:', productsResponse.data);
  }
  
  const productResponse = await productRepo.findById(2);
  if (productResponse.success) {
    console.log('Product with ID 2:', productResponse.data);
  }
  
  // This is where we would use the Zod validators
  console.log('\n=== With Type Validation ===');
  console.log('(The compiler would generate Zod validators for these types)');
  
  /**
   * The compiler would generate validators like:
   * 
   * export const zContainer = () => z.object({
   *   value: z.any(),
   *   metadata: z.object({
   *     timestamp: z.number(),
   *     source: z.string()
   *   })
   * });
   * 
   * export const zApiResponse = () => z.object({
   *   data: z.any().optional(),
   *   error: z.any().optional(),
   *   success: z.boolean(),
   *   statusCode: z.number()
   * });
   * 
   * export const zUser = z.object({
   *   id: z.number(),
   *   name: z.string(),
   *   email: z.string()
   * });
   * 
   * export const zProduct = z.object({
   *   id: z.number(),
   *   name: z.string(),
   *   price: z.number(),
   *   inStock: z.boolean()
   * });
   * 
   * // Concrete validator for Container<User>
   * const UserContainer = zContainer().extend({
   *   value: zUser
   * });
   * 
   * // Concrete validator for ApiResponse<Product[]>
   * const ProductsResponse = zApiResponse().extend({
   *   data: z.array(zProduct).optional()
   * });
   */
}

main().catch(console.error); 