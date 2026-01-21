#!/bin/bash
# Pre-deployment validation script

set -e  # Exit on any error

echo "🔍 Running pre-deployment checks..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
ERRORS=0

# 1. Clean install
echo -e "\n📦 Installing dependencies..."
if npm ci; then
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${RED}✗${NC} Dependency installation failed"
    ((ERRORS++))
fi

# 2. Linting
echo -e "\n🔍 Running linter..."
if npm run lint; then
    echo -e "${GREEN}✓${NC} Linting passed"
else
    echo -e "${RED}✗${NC} Linting failed"
    ((ERRORS++))
fi

# 3. Type checking
echo -e "\n📝 Type checking..."
if npm run typecheck 2>/dev/null || npx tsc --noEmit; then
    echo -e "${GREEN}✓${NC} Type checking passed"
else
    echo -e "${RED}✗${NC} Type checking failed"
    ((ERRORS++))
fi

# 4. Tests
echo -e "\n🧪 Running tests..."
if npm test -- --coverage --passWithNoTests; then
    echo -e "${GREEN}✓${NC} Tests passed"
else
    echo -e "${RED}✗${NC} Tests failed"
    ((ERRORS++))
fi

# 5. Build
echo -e "\n🏗️  Building production bundle..."
if npm run build; then
    echo -e "${GREEN}✓${NC} Build succeeded"
else
    echo -e "${RED}✗${NC} Build failed"
    ((ERRORS++))
fi

# 6. Security audit
echo -e "\n🔒 Security audit..."
if npm audit --audit-level=high; then
    echo -e "${GREEN}✓${NC} No high/critical vulnerabilities"
else
    echo -e "${YELLOW}⚠${NC}  Security vulnerabilities found"
    ((ERRORS++))
fi

# 7. Check for secrets (if gitleaks is available)
if command -v gitleaks &> /dev/null; then
    echo -e "\n🔐 Scanning for secrets..."
    if gitleaks detect --source . --no-git; then
        echo -e "${GREEN}✓${NC} No secrets detected"
    else
        echo -e "${RED}✗${NC} Secrets detected in code!"
        ((ERRORS++))
    fi
else
    echo -e "\n${YELLOW}⚠${NC}  gitleaks not installed, skipping secrets scan"
fi

# 8. Check for console.log in production code
echo -e "\n🔍 Checking for console.log..."
if git grep -n "console\.log" -- '*.ts' '*.tsx' '*.js' '*.jsx' ':!*.test.*' ':!*.spec.*' &> /dev/null; then
    echo -e "${YELLOW}⚠${NC}  console.log found in production code"
    git grep -n "console\.log" -- '*.ts' '*.tsx' '*.js' '*.jsx' ':!*.test.*' ':!*.spec.*' | head -5
else
    echo -e "${GREEN}✓${NC} No console.log in production code"
fi

# Final summary
echo -e "\n=================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready to deploy.${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS check(s) failed. Fix issues before deploying.${NC}"
    exit 1
fi
