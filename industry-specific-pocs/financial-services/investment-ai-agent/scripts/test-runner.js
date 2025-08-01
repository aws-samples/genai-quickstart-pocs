#!/usr/bin/env node

/**
 * Test runner script for the Investment AI Agent
 * Provides utilities for running different test suites and generating reports
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

function log(message, color = 'reset') {
  console.log(colorize(message, color));
}

function runCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      stdio: 'inherit',
      cwd: process.cwd(),
      ...options
    });
    return { success: true, result };
  } catch (error) {
    return { success: false, error };
  }
}

function getTestSuites() {
  const testDirs = [
    'src/models/__tests__',
    'src/utils/__tests__',
    'src/services/__tests__',
    'src/api/controllers/__tests__',
    'src/api/middleware/__tests__'
  ];

  const suites = {};
  
  testDirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      const files = fs.readdirSync(fullPath)
        .filter(file => file.endsWith('.test.ts'))
        .map(file => path.join(dir, file));
      
      const suiteName = dir.split('/')[1]; // Extract suite name (models, utils, services, etc.)
      suites[suiteName] = files;
    }
  });

  return suites;
}

function displayHelp() {
  log('\n📋 Investment AI Agent Test Runner', 'cyan');
  log('=====================================\n', 'cyan');
  
  log('Usage:', 'bright');
  log('  npm run test:runner [command] [options]\n');
  
  log('Commands:', 'bright');
  log('  all          Run all test suites');
  log('  models       Run model tests');
  log('  utils        Run utility tests');
  log('  services     Run service tests');
  log('  controllers  Run controller tests');
  log('  coverage     Run tests with coverage report');
  log('  watch        Run tests in watch mode');
  log('  ci           Run tests for CI/CD pipeline');
  log('  list         List available test suites');
  log('  help         Show this help message\n');
  
  log('Options:', 'bright');
  log('  --verbose    Show detailed output');
  log('  --silent     Suppress output');
  log('  --bail       Stop on first failure');
  log('  --update     Update snapshots\n');
  
  log('Examples:', 'bright');
  log('  npm run test:runner all');
  log('  npm run test:runner models --verbose');
  log('  npm run test:runner coverage');
  log('  npm run test:runner watch services\n');
}

function listTestSuites() {
  const suites = getTestSuites();
  
  log('\n📁 Available Test Suites:', 'cyan');
  log('========================\n', 'cyan');
  
  Object.entries(suites).forEach(([suiteName, files]) => {
    log(`${colorize(suiteName, 'bright')} (${files.length} files)`, 'green');
    files.forEach(file => {
      log(`  └─ ${file}`, 'yellow');
    });
    log('');
  });
}

function runTestSuite(suiteName, options = {}) {
  const suites = getTestSuites();
  
  if (!suites[suiteName]) {
    log(`❌ Test suite '${suiteName}' not found`, 'red');
    log('Available suites:', 'yellow');
    Object.keys(suites).forEach(name => log(`  - ${name}`, 'yellow'));
    return false;
  }

  const testFiles = suites[suiteName];
  const testPattern = testFiles.join('|');
  
  log(`\n🧪 Running ${suiteName} tests...`, 'blue');
  log(`Found ${testFiles.length} test files\n`, 'blue');
  
  let jestCommand = `jest --testPathPattern="${testPattern}"`;
  
  if (options.verbose) jestCommand += ' --verbose';
  if (options.silent) jestCommand += ' --silent';
  if (options.bail) jestCommand += ' --bail';
  if (options.update) jestCommand += ' --updateSnapshot';
  if (options.coverage) jestCommand += ' --coverage';
  
  const result = runCommand(jestCommand);
  
  if (result.success) {
    log(`\n✅ ${suiteName} tests completed successfully`, 'green');
  } else {
    log(`\n❌ ${suiteName} tests failed`, 'red');
  }
  
  return result.success;
}

function runAllTests(options = {}) {
  log('\n🚀 Running all test suites...', 'magenta');
  
  let jestCommand = 'jest';
  
  if (options.verbose) jestCommand += ' --verbose';
  if (options.silent) jestCommand += ' --silent';
  if (options.bail) jestCommand += ' --bail';
  if (options.update) jestCommand += ' --updateSnapshot';
  if (options.coverage) jestCommand += ' --coverage';
  
  const result = runCommand(jestCommand);
  
  if (result.success) {
    log('\n✅ All tests completed successfully', 'green');
  } else {
    log('\n❌ Some tests failed', 'red');
  }
  
  return result.success;
}

function runCoverageReport() {
  log('\n📊 Generating coverage report...', 'blue');
  
  const result = runCommand('jest --coverage --coverageReporters=text --coverageReporters=html --coverageReporters=lcov');
  
  if (result.success) {
    log('\n✅ Coverage report generated', 'green');
    log('📁 HTML report available at: coverage/lcov-report/index.html', 'cyan');
  } else {
    log('\n❌ Coverage report generation failed', 'red');
  }
  
  return result.success;
}

function runWatchMode(suiteName = null) {
  log('\n👀 Starting tests in watch mode...', 'blue');
  
  let jestCommand = 'jest --watch';
  
  if (suiteName) {
    const suites = getTestSuites();
    if (suites[suiteName]) {
      const testPattern = suites[suiteName].join('|');
      jestCommand += ` --testPathPattern="${testPattern}"`;
      log(`Watching ${suiteName} tests only`, 'yellow');
    }
  }
  
  runCommand(jestCommand);
}

function runCITests() {
  log('\n🔄 Running tests for CI/CD pipeline...', 'blue');
  
  const result = runCommand('jest --ci --coverage --watchAll=false --passWithNoTests');
  
  if (result.success) {
    log('\n✅ CI tests completed successfully', 'green');
  } else {
    log('\n❌ CI tests failed', 'red');
    process.exit(1);
  }
  
  return result.success;
}

function parseOptions(args) {
  const options = {};
  
  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const option = arg.slice(2);
      options[option] = true;
    }
  });
  
  return options;
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const options = parseOptions(args.slice(1));
  
  switch (command) {
    case 'all':
      runAllTests(options);
      break;
      
    case 'models':
      runTestSuite('models', options);
      break;
      
    case 'utils':
      runTestSuite('utils', options);
      break;
      
    case 'services':
      runTestSuite('services', options);
      break;
      
    case 'controllers':
      runTestSuite('controllers', options);
      break;
      
    case 'coverage':
      runCoverageReport();
      break;
      
    case 'watch':
      const watchSuite = args[1];
      runWatchMode(watchSuite);
      break;
      
    case 'ci':
      runCITests();
      break;
      
    case 'list':
      listTestSuites();
      break;
      
    case 'help':
    default:
      displayHelp();
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  runTestSuite,
  runAllTests,
  runCoverageReport,
  runWatchMode,
  runCITests,
  getTestSuites
};