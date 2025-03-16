/**
 * Example demonstrating the pattern-based validation rule suggestions in IDEs
 * 
 * This example shows how the TypeScript Language Service plugin will suggest
 * field names based on pattern-based validators configured in tsconfig.json.
 * 
 * To see this in action:
 * 1. Open this file in an IDE that supports TypeScript Language Service plugins
 * 2. Place your cursor inside one of the interface definitions
 * 3. Start typing a field name or press Ctrl+Space to see suggestions
 * 4. Hover over the suggested field names to see validation info
 */

// When you create a new interface, you'll get suggestions for fields that
// have special validation rules configured in your tsconfig.json
interface User {
  // Type 'em' and press Ctrl+Space to see suggestions like 'email'
  email: string;  // Hover to see: Will be validated as email address
  
  // Type 'contact' and press Ctrl+Space to see suggestions like 'contactEmail'
  contactEmail: string;  // Hover to see: Matches pattern ^.*Email$ - will be validated as email address
  
  // Type 'id' and press Ctrl+Space to see suggestions like 'id', 'userId'
  id: string;  // Hover to see: Matches pattern ^id - will be validated as UUID
  
  // Try typing 'primary' to see suggestions like 'primaryEmail'
  primaryEmail: string;  // Hover to see: Matches pattern ^.*Email$ - will be validated as email address
  
  // Regular fields with no special validation
  name: string;
  age: number;
}

// Different context, same validation rules apply
interface Product {
  // You'll get the same suggestions here for validation patterns
  productId: string;  // Hover to see: Matches pattern ^.*Id$ - will be validated as UUID
  productUrl: string; // Hover to see: Matches pattern ^.*Url$ - will be validated as URL
  
  // Regular fields with no special validation
  name: string;
  price: number;
}

// Fields matching multiple patterns will use the first matching pattern
interface ApiResponse {
  // If you have overlapping patterns, the first match in your config wins
  userId: string;  // If both "^user" and ".*Id$" patterns exist, first one in config wins
  
  // Regular fields with no special validation
  timestamp: number;
  status: string;
}

/**
 * Benefits of pattern-based validation rule suggestions:
 * 
 * 1. Discoverability - Easily discover field names that trigger validation
 * 2. Consistency - Encourages consistent naming patterns across your codebase
 * 3. Documentation - Shows validation rules during development
 * 4. Efficiency - Reduces the need to check configuration for validation rules
 */ 