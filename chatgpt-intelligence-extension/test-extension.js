#!/usr/bin/env node
/**
 * ChatGPT Intelligence Monitor - Extension Validation & Test Script
 * Validates extension structure, files, and simulates basic functionality
 */

const fs = require('fs');
const path = require('path');

console.log('🔬 ChatGPT Intelligence Monitor - Extension Validation\n');

// Test results
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
    failed++;
  }
}

// Test 1: Required files exist
test('manifest.json exists', () => {
  if (!fs.existsSync('manifest.json')) throw new Error('File not found');
});

test('background.js exists', () => {
  if (!fs.existsSync('background.js')) throw new Error('File not found');
});

test('content.js exists', () => {
  if (!fs.existsSync('content.js')) throw new Error('File not found');
});

test('popup.html exists', () => {
  if (!fs.existsSync('popup.html')) throw new Error('File not found');
});

test('popup.js exists', () => {
  if (!fs.existsSync('popup.js')) throw new Error('File not found');
});

// Test 2: Icon files exist
test('icon16.png exists', () => {
  if (!fs.existsSync('icons/icon16.png')) throw new Error('File not found');
});

test('icon48.png exists', () => {
  if (!fs.existsSync('icons/icon48.png')) throw new Error('File not found');
});

test('icon128.png exists', () => {
  if (!fs.existsSync('icons/icon128.png')) throw new Error('File not found');
});

// Test 3: Dashboard files exist
test('dashboard/dashboard.html exists', () => {
  if (!fs.existsSync('dashboard/dashboard.html')) throw new Error('File not found');
});

test('dashboard/dashboard.js exists', () => {
  if (!fs.existsSync('dashboard/dashboard.js')) throw new Error('File not found');
});

// Test 4: Library files exist
test('lib/parser.js exists', () => {
  if (!fs.existsSync('lib/parser.js')) throw new Error('File not found');
});

test('lib/storage.js exists', () => {
  if (!fs.existsSync('lib/storage.js')) throw new Error('File not found');
});

// Test 5: Manifest validation
test('manifest.json is valid JSON', () => {
  const content = fs.readFileSync('manifest.json', 'utf8');
  JSON.parse(content);
});

test('manifest.json has required fields', () => {
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  if (!manifest.manifest_version) throw new Error('Missing manifest_version');
  if (!manifest.name) throw new Error('Missing name');
  if (!manifest.version) throw new Error('Missing version');
  if (manifest.manifest_version !== 3) throw new Error('Must use Manifest V3');
});

test('manifest.json has correct permissions', () => {
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  const required = ['storage', 'webRequest', 'tabs', 'downloads'];
  for (const perm of required) {
    if (!manifest.permissions.includes(perm)) {
      throw new Error(`Missing permission: ${perm}`);
    }
  }
});

test('manifest.json has host permissions for ChatGPT', () => {
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  if (!manifest.host_permissions.includes('https://chatgpt.com/*')) {
    throw new Error('Missing ChatGPT host permission');
  }
});

// Test 6: Content script validation
test('content.js has fetch interception', () => {
  const content = fs.readFileSync('content.js', 'utf8');
  if (!content.includes('window.fetch')) {
    throw new Error('Missing fetch interception code');
  }
  if (!content.includes('backend-api/f/conversation')) {
    throw new Error('Missing ChatGPT API endpoint check');
  }
});

test('content.js sends messages to background', () => {
  const content = fs.readFileSync('content.js', 'utf8');
  if (!content.includes('chrome.runtime.sendMessage')) {
    throw new Error('Missing chrome.runtime.sendMessage');
  }
});

// Test 7: Background script validation
test('background.js handles messages', () => {
  const content = fs.readFileSync('background.js', 'utf8');
  if (!content.includes('chrome.runtime.onMessage.addListener')) {
    throw new Error('Missing message listener');
  }
});

test('background.js has storage functions', () => {
  const content = fs.readFileSync('background.js', 'utf8');
  if (!content.includes('chrome.storage.local')) {
    throw new Error('Missing storage code');
  }
});

// Test 8: Parser library validation
test('parser.js has search detection', () => {
  const content = fs.readFileSync('lib/parser.js', 'utf8');
  if (!content.includes('isSearchFunctionCall')) {
    throw new Error('Missing isSearchFunctionCall function');
  }
  if (!content.includes('extractSearchQuery')) {
    throw new Error('Missing extractSearchQuery function');
  }
});

test('parser.js has citation detection', () => {
  const content = fs.readFileSync('lib/parser.js', 'utf8');
  if (!content.includes('isCitationEvent')) {
    throw new Error('Missing isCitationEvent function');
  }
  if (!content.includes('extractCitations')) {
    throw new Error('Missing extractCitations function');
  }
});

// Test 9: Popup validation
test('popup.html references popup.js', () => {
  const content = fs.readFileSync('popup.html', 'utf8');
  if (!content.includes('popup.js')) {
    throw new Error('popup.js not referenced in HTML');
  }
});

test('popup.js has dashboard opener', () => {
  const content = fs.readFileSync('popup.js', 'utf8');
  if (!content.includes('openDashboard')) {
    throw new Error('Missing openDashboard function');
  }
});

test('popup.js has export functions', () => {
  const content = fs.readFileSync('popup.js', 'utf8');
  if (!content.includes('exportJSON')) {
    throw new Error('Missing exportJSON function');
  }
  if (!content.includes('exportCSV')) {
    throw new Error('Missing exportCSV function');
  }
});

// Test 10: Dashboard validation
test('dashboard.html references dashboard.js', () => {
  const content = fs.readFileSync('dashboard/dashboard.html', 'utf8');
  if (!content.includes('dashboard.js')) {
    throw new Error('dashboard.js not referenced in HTML');
  }
});

test('dashboard.js has filter functions', () => {
  const content = fs.readFileSync('dashboard/dashboard.js', 'utf8');
  if (!content.includes('filterSearches')) {
    throw new Error('Missing filterSearches function');
  }
  if (!content.includes('filterCitations')) {
    throw new Error('Missing filterCitations function');
  }
});

// Test 11: Documentation exists
test('README.md exists', () => {
  if (!fs.existsSync('README.md')) throw new Error('File not found');
});

test('INSTALLATION.md exists', () => {
  if (!fs.existsSync('INSTALLATION.md')) throw new Error('File not found');
});

test('LICENSE exists', () => {
  if (!fs.existsSync('LICENSE')) throw new Error('File not found');
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`✓ Passed: ${passed}`);
console.log(`✗ Failed: ${failed}`);
console.log('='.repeat(50));

if (failed === 0) {
  console.log('\n🎉 All tests passed! Extension is ready to load.');
  console.log('\nNext steps:');
  console.log('1. Open Chrome: chrome://extensions/');
  console.log('2. Enable "Developer mode"');
  console.log('3. Click "Load unpacked"');
  console.log('4. Select this directory');
  console.log('5. Visit https://chatgpt.com and test!');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed. Please fix the issues above.');
  process.exit(1);
}
