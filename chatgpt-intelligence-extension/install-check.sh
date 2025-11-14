#!/bin/bash
###############################################################################
# ChatGPT Intelligence Monitor - Installation Check Script
# Verifies extension is ready to load in Chrome
###############################################################################

echo "🔍 ChatGPT Intelligence Monitor - Installation Check"
echo "========================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASS=0
FAIL=0

# Test function
test_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $1 - MISSING!"
        ((FAIL++))
    fi
}

test_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $1/ - MISSING!"
        ((FAIL++))
    fi
}

# Check core files
echo "📋 Checking Core Files..."
echo "──────────────────────────────────────────────────"
test_file "manifest.json"
test_file "background.js"
test_file "content.js"
test_file "popup.html"
test_file "popup.js"
echo ""

# Check icon files
echo "🎨 Checking Icon Files..."
echo "──────────────────────────────────────────────────"
test_file "icons/icon16.png"
test_file "icons/icon48.png"
test_file "icons/icon128.png"
echo ""

# Check dashboard files
echo "📊 Checking Dashboard Files..."
echo "──────────────────────────────────────────────────"
test_dir "dashboard"
test_file "dashboard/dashboard.html"
test_file "dashboard/dashboard.js"
echo ""

# Check library files
echo "📚 Checking Library Files..."
echo "──────────────────────────────────────────────────"
test_dir "lib"
test_file "lib/parser.js"
test_file "lib/storage.js"
echo ""

# Check documentation
echo "📖 Checking Documentation..."
echo "──────────────────────────────────────────────────"
test_file "README.md"
test_file "INSTALLATION.md"
test_file "QUICK_START.md"
test_file "LICENSE"
echo ""

# Check manifest.json validity
echo "🔧 Validating manifest.json..."
echo "──────────────────────────────────────────────────"
if command -v python3 &> /dev/null; then
    if python3 -m json.tool manifest.json > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} manifest.json is valid JSON"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} manifest.json has syntax errors!"
        ((FAIL++))
    fi
else
    echo -e "${YELLOW}⚠${NC}  Python3 not found, skipping JSON validation"
fi
echo ""

# Check JavaScript syntax
echo "🔍 Checking JavaScript Syntax..."
echo "──────────────────────────────────────────────────"
if command -v node &> /dev/null; then
    for file in background.js content.js popup.js dashboard/dashboard.js lib/parser.js lib/storage.js; do
        if node --check "$file" 2>&1 | grep -q "SyntaxError"; then
            echo -e "${RED}✗${NC} $file has syntax errors!"
            ((FAIL++))
        else
            echo -e "${GREEN}✓${NC} $file"
            ((PASS++))
        fi
    done
else
    echo -e "${YELLOW}⚠${NC}  Node.js not found, skipping syntax check"
fi
echo ""

# Summary
echo "========================================================"
echo -e "${GREEN}✓ Passed: $PASS${NC}"
if [ $FAIL -gt 0 ]; then
    echo -e "${RED}✗ Failed: $FAIL${NC}"
else
    echo -e "✗ Failed: $FAIL"
fi
echo "========================================================"
echo ""

# Final result
if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 All checks passed! Extension is ready to load.${NC}"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo "  1. Open Chrome: chrome://extensions/"
    echo "  2. Enable 'Developer mode' (top-right toggle)"
    echo "  3. Click 'Load unpacked'"
    echo "  4. Select this directory"
    echo "  5. Visit https://chatgpt.com and test!"
    echo ""
    echo -e "${BLUE}Quick Test:${NC}"
    echo "  • Click the extension icon"
    echo "  • Open Dashboard"
    echo "  • Ask ChatGPT: 'What are the best SEO tools?'"
    echo "  • Watch data populate in real-time!"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some checks failed!${NC}"
    echo ""
    echo "Please fix the missing/invalid files above before loading."
    echo ""
    echo "Common fixes:"
    echo "  • Missing icons: Run 'python3 create-icons.py'"
    echo "  • Syntax errors: Check the file with your editor"
    echo "  • Missing files: Re-download the extension"
    echo ""
    exit 1
fi
