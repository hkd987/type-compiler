/**
 * Bootstrap script for the type-compiler plugin self-usage
 * 
 * This script facilitates the use of the type-compiler plugin during its own compilation
 * by setting up the necessary environment and plugin registration.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create a tsconfig.json for testing the plugin
function createTsConfig() {
  const tsconfig = {
    compilerOptions: {
      target: "ES2018",
      module: "CommonJS",
      outDir: "./dist",
      rootDir: "./src",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      plugins: [
        { transform: "type-compiler/dist/transformer.js" }
      ]
    },
    include: ["src/**/*"],
    exclude: ["node_modules", "**/*.spec.ts"]
  };
  
  fs.writeFileSync('tsconfig.plugin-test.json', JSON.stringify(tsconfig, null, 2));
}

// Bootstrap process
console.log('👉 Cleaning dist directory...');
try {
  execSync('npm run clean', { stdio: 'inherit' });
  console.log('✅ Dist directory cleaned');
  
  console.log('\n👉 Compiling plugin (first stage)...');
  try {
    execSync('npm run build -- --skipLibCheck', { stdio: 'inherit' });
    console.log('✅ First stage compilation completed');
  } catch (error) {
    console.error('❌ First stage compilation failed', error);
    process.exit(1);
  }
  
  console.log('\n👉 Creating test tsconfig with plugin...');
  createTsConfig();
  console.log('✅ Test tsconfig created');
  
  console.log('\n👉 Compiling with plugin (second stage)...');
  try {
    // Use tsc directly instead of ts-patch build
    execSync('npx tsc --skipLibCheck', { stdio: 'inherit' });
    console.log('✅ Second stage compilation completed');
  } catch (error) {
    console.error('❌ Second stage compilation failed', error);
    process.exit(1);
  }
  
  console.log('\n👉 Creating distribution package...');
  try {
    // Copy necessary files to dist directory
    execSync('cp package.json dist/', { stdio: 'inherit' });
    execSync('cp README.md dist/', { stdio: 'inherit' });
    console.log('✅ Distribution package created');
  } catch (error) {
    console.error('❌ Distribution package creation failed', error);
    process.exit(1);
  }
  
  console.log('\n🎉 Bootstrap completed successfully!');
} catch (error) {
  console.error('❌ Dist directory cleaning failed', error);
  process.exit(1);
}

// Ensure the dist directory exists
if (!fs.existsSync(path.join(__dirname, 'dist'))) {
  console.error('❌ Dist directory not found after first stage compilation');
  process.exit(1);
} else {
  console.log('✅ Dist directory created successfully');
  
  // Print the files in dist to verify
  const firstStageFiles = fs.readdirSync(path.join(__dirname, 'dist'));
  console.log(`   First stage compilation produced ${firstStageFiles.length} files:`);
  firstStageFiles.forEach(file => console.log(`   - ${file}`));
}

// Install ts-patch
console.log('\n👉 Installing ts-patch...');
try {
  execSync('npm run postinstall', { stdio: 'inherit' });
  console.log('✅ ts-patch installed');
} catch (error) {
  console.error('❌ ts-patch installation failed', error);
  process.exit(1);
}

// Take a backup of the first stage files to compare later
console.log('\n👉 Creating backup of first stage files...');
const backupDir = path.join(__dirname, 'dist-backup');
try {
  // Remove existing backup if it exists
  if (fs.existsSync(backupDir)) {
    execSync(`rm -rf ${backupDir}`, { stdio: 'inherit' });
  }
  
  // Create backup directory
  fs.mkdirSync(backupDir);
  
  // Copy all files from dist to backup
  const distFiles = fs.readdirSync(path.join(__dirname, 'dist'));
  distFiles.forEach(file => {
    fs.copyFileSync(
      path.join(__dirname, 'dist', file),
      path.join(backupDir, file)
    );
  });
  
  console.log(`✅ Backup created with ${distFiles.length} files`);
} catch (error) {
  console.error('❌ Failed to create backup', error);
  // Continue anyway
}

// Compare file timestamps between backup and current dist to see if files were updated
console.log('\n👉 Checking if files were updated during second stage compilation...');
if (fs.existsSync(backupDir)) {
  let updatedFiles = 0;
  let unchangedFiles = 0;
  
  const distFiles = fs.readdirSync(path.join(__dirname, 'dist'));
  distFiles.forEach(file => {
    const distFilePath = path.join(__dirname, 'dist', file);
    const backupFilePath = path.join(backupDir, file);
    
    if (!fs.existsSync(backupFilePath)) {
      console.log(`   ✅ New file created: ${file}`);
      updatedFiles++;
      return;
    }
    
    const distStat = fs.statSync(distFilePath);
    const backupStat = fs.statSync(backupFilePath);
    
    // Compare file sizes first (quick check)
    if (distStat.size !== backupStat.size) {
      console.log(`   ✅ File content changed: ${file}`);
      updatedFiles++;
      return;
    }
    
    // If sizes match, compare actual file content
    const distContent = fs.readFileSync(distFilePath, 'utf8');
    const backupContent = fs.readFileSync(backupFilePath, 'utf8');
    
    if (distContent !== backupContent) {
      console.log(`   ✅ File content changed: ${file}`);
      updatedFiles++;
    } else {
      unchangedFiles++;
    }
  });
  
  console.log(`   Files updated: ${updatedFiles}, Files unchanged: ${unchangedFiles}`);
  
  if (updatedFiles === 0) {
    console.warn('⚠️ No files were updated during second stage compilation');
    console.log('   This suggests the plugin might not be working correctly');
  } else {
    console.log('✅ Files were updated during second stage compilation');
  }
  
  // Clean up the backup
  execSync(`rm -rf ${backupDir}`, { stdio: 'inherit' });
}

// Verify that the Zod schemas were generated
console.log('\n👉 Checking for generated Zod schemas...');
const files = fs.readdirSync(path.join(__dirname, 'dist'));
let zodSchemaFound = false;
let zodSchemaFiles = [];

files.forEach(file => {
  if (!file.endsWith('.js')) return;
  
  const filePath = path.join(__dirname, 'dist', file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('z.object(') || content.includes('zod')) {
    zodSchemaFound = true;
    zodSchemaFiles.push(file);
    
    // Look for specific schemas we expect
    const expectedSchemas = [
      'zTestUser', 
      'zUserRole', 
      'zUserService',
      'zUserServiceConstructor',
      'zUserService_getUser_Params',
      'zUserService_getUser_Return',
      'zUserService_updateUser_Params',
      'zUserService_updateUser_Return'
    ];
    expectedSchemas.forEach(schema => {
      if (content.includes(schema)) {
        console.log(`  ✅ Found schema: ${schema} in ${file}`);
      }
    });
  }
});

// Specifically check the self-test.js file
console.log('\n👉 Checking self-test.js specifically...');
if (fs.existsSync(path.join(__dirname, 'dist', 'self-test.js'))) {
  const selfTestContent = fs.readFileSync(path.join(__dirname, 'dist', 'self-test.js'), 'utf8');
  
  // Check if Zod is imported
  if (selfTestContent.includes('import { z } from "zod"') || 
      selfTestContent.includes("import { z } from 'zod'")) {
    console.log('✅ Zod import found in self-test.js');
  } else {
    console.log('❌ No Zod import found in self-test.js');
  }
  
  // Check if schemas are defined
  if (selfTestContent.includes('export const zTestUser = z.object(') || 
      selfTestContent.includes('export const zUserRole = z.enum(')) {
    console.log('✅ Zod schemas found in self-test.js');
  } else {
    console.log('❌ No Zod schemas found in self-test.js');
  }
  
  // Print some content for diagnosis
  console.log('\nPreview of self-test.js:');
  console.log('-'.repeat(50));
  console.log(selfTestContent.slice(0, 500) + '...');
  console.log('-'.repeat(50));
} else {
  console.log('❌ self-test.js not found in dist directory');
}

if (zodSchemaFound) {
  console.log(`\n✅ Zod schemas were generated in ${zodSchemaFiles.length} files:`);
  zodSchemaFiles.forEach(file => console.log(`  - ${file}`));
} else {
  console.warn('\n⚠️ No Zod schemas were detected in the compiled output');
}

// Check for common issues
console.log('\n👉 Checking for potential issues...');

// Check plugin configuration
const tsConfigContent = fs.readFileSync(path.join(__dirname, 'tsconfig.json'), 'utf8');
const tsConfig = JSON.parse(tsConfigContent);
if (tsConfig.compilerOptions.plugins && 
    tsConfig.compilerOptions.plugins.some(p => p.name === 'type-compiler' && p.generateZodSchemas)) {
  console.log('✅ Plugin configuration looks correct in tsconfig.json');
} else {
  console.warn('⚠️ Plugin configuration in tsconfig.json might be incorrect');
}

// Check if plugin is properly registered
console.log('\n👉 Checking plugin registration...');
try {
  // Check if the dist directory exists
  if (fs.existsSync(path.join(__dirname, 'dist', 'index.js'))) {
    // Check if index.js has the plugin export
    const indexContent = fs.readFileSync(path.join(__dirname, 'dist', 'index.js'), 'utf8');
    if (indexContent.includes('exports.default = typeCompilerPlugin')) {
      console.log('✅ Plugin export found in index.js');
    } else {
      console.warn('⚠️ Plugin export not found in index.js');
    }
  }

  // Check if the node_modules has a reference to our local plugin
  const nodeModulesPath = path.join(__dirname, 'node_modules', 'type-compiler');
  if (fs.existsSync(nodeModulesPath)) {
    console.log('✅ type-compiler found in node_modules');
    
    // Check if it's linked to our current project
    const packageJsonPath = path.join(nodeModulesPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      console.log(`  - Version: ${packageJson.version}`);
    }
  } else {
    console.log('ℹ️ type-compiler not found in node_modules, which is expected for local development');
  }
} catch (error) {
  console.error('❌ Error checking plugin registration', error);
}

// Additional diagnostics
console.log('\n👉 Additional diagnostics:');

// Check if TypeScript can find the plugin
console.log('Checking TypeScript plugin resolution...');
try {
  const result = execSync('npx tsc --showConfig', { encoding: 'utf8' });
  if (result.includes('"plugins":') && result.includes('"name": "type-compiler"')) {
    console.log('✅ TypeScript config shows the plugin');
  } else {
    console.warn('⚠️ Plugin not found in TypeScript config');
  }
} catch (error) {
  console.error('❌ Error checking TypeScript config', error);
}

// Create a custom registration script for the plugin
console.log('\n👉 Creating a custom plugin loader script...');
const loaderScript = `
// Custom loader script to explicitly register the plugin
const ts = require('typescript');
const path = require('path');
const fs = require('fs');

// Import our plugin from the dist directory
const pluginPath = path.join(__dirname, 'dist', 'index.js');
const typeCompilerPlugin = require(pluginPath);

// Verify the plugin was loaded correctly
if (typeof typeCompilerPlugin.default !== 'function') {
  console.error('❌ Plugin could not be loaded correctly from ' + pluginPath);
  process.exit(1);
}

console.log('✅ Plugin loaded successfully: ' + pluginPath);

// Run TypeScript compiler with the plugin
const configPath = path.join(__dirname, 'tsconfig.json');

// Properly parse the tsconfig.json file
const configFileText = fs.readFileSync(configPath, 'utf8');
const result = ts.parseConfigFileTextToJson(configPath, configFileText);

if (result.error) {
  console.error('❌ Failed to parse tsconfig.json:', ts.formatDiagnostic(result.error, {
    getCanonicalFileName: fileName => fileName,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getNewLine: () => ts.sys.newLine
  }));
  process.exit(1);
}

// Parse the config into options
const configObject = result.config;
const parsedConfig = ts.parseJsonConfigFileContent(
  configObject,
  ts.sys,
  path.dirname(configPath)
);

if (parsedConfig.errors && parsedConfig.errors.length > 0) {
  console.error('❌ Error parsing tsconfig.json contents:');
  parsedConfig.errors.forEach(error => {
    console.error(ts.formatDiagnostic(error, {
      getCanonicalFileName: fileName => fileName,
      getCurrentDirectory: ts.sys.getCurrentDirectory,
      getNewLine: () => ts.sys.newLine
    }));
  });
  process.exit(1);
}

console.log('✅ Successfully parsed tsconfig.json');

// Create a compiler host with additional logging for diagnostic files
const host = ts.createCompilerHost(parsedConfig.options);

// Enhance readFile to log when self-test.ts is read
const originalReadFile = host.readFile;
host.readFile = function(fileName) {
  if (fileName.includes('self-test.ts')) {
    console.log('🔍 Reading self-test.ts file:', fileName);
  }
  return originalReadFile(fileName);
};

// Enhance writeFile to log when files are written and their content
const originalWriteFile = host.writeFile;
host.writeFile = function(fileName, data, ...args) {
  if (fileName.includes('self-test.js')) {
    console.log('🔍 Writing self-test.js file:', fileName);
    if (data.includes('zTestUser') || data.includes('z.object')) {
      console.log('✅ Found Zod schema in output file!');
    } else {
      console.log('❌ No Zod schema found in output file');
    }
  }
  return originalWriteFile(fileName, data, ...args);
};

// Explicitly include the self-test.ts file
const selfTestPath = path.join(__dirname, 'src', 'self-test.ts');
let fileNames = parsedConfig.fileNames;
if (!fileNames.includes(selfTestPath)) {
  console.log('👉 Adding self-test.ts to files to be processed');
  fileNames = [...fileNames, selfTestPath];
}

// Use the resolved file names from parsedConfig
const program = ts.createProgram(
  fileNames,
  parsedConfig.options,
  host
);

// Log source files in the program
console.log('Files in program:');
program.getSourceFiles().forEach(sf => {
  if (sf.fileName.includes('self-test.ts')) {
    console.log('✅ self-test.ts is in the program:', sf.fileName);
  }
});

// Run our plugin on the program
const pluginResult = typeCompilerPlugin.default(program, {
  generateZodSchemas: true,
  zodSchemaPrefix: "z",
  strictTypeChecking: true,
  validateClassMethods: true,
  useGlobalCache: true,
  incrementalCompilation: true,
  parallelProcessing: true
});

console.log('Transformers received from plugin:', pluginResult ? 'Yes' : 'No');
if (pluginResult && pluginResult.before) {
  console.log('Before transformers count:', pluginResult.before.length);
} else {
  console.log('No before transformers found in plugin result');
}

// Use the plugin transformers for compilation
const emitResult = program.emit(
  undefined,
  undefined,
  undefined,
  undefined,
  { before: pluginResult && pluginResult.before ? pluginResult.before : [] }
);

// Report diagnostics
const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
if (allDiagnostics.length > 0) {
  console.log('Compilation diagnostics:');
  allDiagnostics.forEach(diagnostic => {
    if (diagnostic.file) {
      const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\\n");
      console.log(\`\${diagnostic.file.fileName} (\${line + 1},\${character + 1}): \${message}\`);
    } else {
      console.log(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\\n"));
    }
  });
}

// Check the output file for self-test.js
const selfTestJsPath = path.join(__dirname, 'dist', 'self-test.js');
if (fs.existsSync(selfTestJsPath)) {
  const content = fs.readFileSync(selfTestJsPath, 'utf8');
  console.log('\\nAnalyzing self-test.js output:');
  
  if (content.includes('zTestUser')) {
    console.log('✅ Found zTestUser schema in output file');
  } else {
    console.log('❌ Missing zTestUser schema in output file');
  }
  
  if (content.includes('zUserRole')) {
    console.log('✅ Found zUserRole schema in output file');
  } else {
    console.log('❌ Missing zUserRole schema in output file');
  }
  
  if (content.includes('zUserService')) {
    console.log('✅ Found zUserService schema in output file');
  } else {
    console.log('❌ Missing zUserService schema in output file');
  }
} else {
  console.log('❌ self-test.js output file not found');
}

// Report whether compilation was successful
const exitCode = emitResult.emitSkipped ? 1 : 0;
console.log(\`Compilation finished with exit code \${exitCode}\`);
process.exit(exitCode);
`;

// Write the loader script to file
fs.writeFileSync('./plugin-loader.js', loaderScript);
console.log('✅ Written plugin-loader.js');

// Execute the plugin loader
try {
  console.log('\n👉 Running custom plugin loader...');
  execSync('node plugin-loader.js', { stdio: 'inherit' });
  console.log('✅ Custom plugin loader executed successfully');
} catch (error) {
  console.error('❌ Error running custom plugin loader:', error.message);
  // Continue despite error for diagnostics purposes
}

console.log('\n🎉 Bootstrap completed successfully!'); 