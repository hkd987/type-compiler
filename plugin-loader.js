
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
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
      console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
    } else {
      console.log(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
    }
  });
}

// Check the output file for self-test.js
const selfTestJsPath = path.join(__dirname, 'dist', 'self-test.js');
if (fs.existsSync(selfTestJsPath)) {
  const content = fs.readFileSync(selfTestJsPath, 'utf8');
  console.log('\nAnalyzing self-test.js output:');
  
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
console.log(`Compilation finished with exit code ${exitCode}`);
process.exit(exitCode);
