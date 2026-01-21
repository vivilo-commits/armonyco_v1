---
name: security-auditing
description: Performs comprehensive security audits including vulnerability scanning and secrets detection. Use when the user mentions security, vulnerabilities, or secrets.
triggers:
  - "Security audit..."
  - "Vulnerability..."
  - "Is it secure..."
  - "Secrets..."
---

# Security Auditing

## When to use this skill
- User requests security audit or vulnerability scan
- User mentions OWASP, penetration testing, security review
- User asks to check for secrets or credentials in code
- User wants dependency vulnerability analysis
- User mentions security best practices or compliance

## Workflow

### 1. Security Scope Definition
- [ ] Identify attack surface (frontend, backend, API, database)
- [ ] Determine compliance requirements (GDPR, SOC2, HIPAA)
- [ ] Define security priorities (data protection, auth, injection)
- [ ] Set severity thresholds (Critical, High, Medium, Low)

### 2. Multi-Layer Security Audit

**OWASP Top 10 Coverage:**
1. Broken Access Control
2. Cryptographic Failures
3. Injection
4. Insecure Design
5. Security Misconfiguration
6. Vulnerable Components
7. Authentication Failures
8. Software/Data Integrity Failures
9. Security Logging Failures
10. Server-Side Request Forgery (SSRF)

## Instructions

### Step 1: Secrets Detection

**Scan for hardcoded secrets:**
```bash
# Install gitleaks (if not available)
brew install gitleaks

# Scan entire repository
gitleaks detect --source . --report-path gitleaks-report.json

# Or use trufflehog
docker run --rm -v "$(pwd):/repo" trufflesecurity/trufflehog:latest filesystem /repo --json > secrets-report.json
```

**Manual pattern search:**
```bash
# Search for common secret patterns
rg -i "(api_key|apikey|api-key|password|passwd|pwd|secret|token|auth_token|access_token|private_key|aws_access_key_id|aws_secret_access_key)\s*[:=]\s*['\"][^'\"]{8,}" --type-add 'code:*.{ts,tsx,js,jsx,py,go,java}' -t code

# Check for .env files in git
git ls-files | grep -E "\.env$|\.env\."

# Find hardcoded URLs with credentials
rg "https?://[^:]+:[^@]+@" --type-add 'code:*.{ts,tsx,js,jsx}' -t code
```

### Step 2: Dependency Vulnerability Scan

**NPM/Node.js:**
```bash
# Audit dependencies
npm audit --json > npm-audit.json

# Check for high/critical only
npm audit --audit-level=high

# Fix automatically (review changes!)
npm audit fix

# Use Snyk for deeper analysis
npx snyk test --json > snyk-report.json
```

**Python:**
```bash
# Safety check
pip install safety
safety check --json > safety-report.json

# Or use pip-audit
pip install pip-audit
pip-audit --format json > pip-audit.json
```

### Step 3: Code Security Analysis

**SQL Injection Detection:**
```typescript
// ❌ VULNERABLE: String concatenation
const query = `SELECT * FROM users WHERE email = '${userInput}'`;

// ✅ SAFE: Parameterized queries
const query = 'SELECT * FROM users WHERE email = $1';
const result = await db.query(query, [userInput]);

// Search for vulnerable patterns
rg "SELECT.*\$\{|INSERT.*\$\{|UPDATE.*\$\{|DELETE.*\$\{" --type ts
```

**XSS (Cross-Site Scripting) Detection:**
```typescript
// ❌ VULNERABLE: Direct HTML injection
element.innerHTML = userInput;

// ✅ SAFE: Use textContent or sanitize
element.textContent = userInput;
// Or use DOMPurify
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userInput);

// Search for dangerous patterns
rg "\.innerHTML\s*=|dangerouslySetInnerHTML" --type tsx
```

**Authentication & Authorization Checks:**
```typescript
// Check for missing auth guards
rg "router\.(get|post|put|delete|patch)" --type ts -A 5 | rg -v "authenticate|authorize|requireAuth"

// Verify JWT validation
rg "jwt\.verify|jwt\.decode" --type ts

// Check for secure cookie settings
rg "cookie.*httpOnly.*secure.*sameSite" --type ts
```

### Step 4: Infrastructure Security

**Environment Variables:**
```bash
# Check for missing .env.example
test -f .env.example || echo "⚠️  Missing .env.example"

# Verify .env is gitignored
grep -q "^\.env$" .gitignore || echo "⚠️  .env not in .gitignore"

# Check for production secrets in code
rg "process\.env\.(API_KEY|SECRET|PASSWORD)" --type ts
```

**HTTPS & Security Headers:**
```typescript
// Verify security headers middleware
// helmet.js or custom headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
```

### Step 5: Database Security

**Check for exposed credentials:**
```bash
# Database connection strings
rg "postgresql://|mysql://|mongodb://" --type ts

# Verify connection uses environment variables
rg "new Pool\(\{|createConnection\(\{" --type ts -A 3
```

**SQL Injection Prevention:**
```sql
-- Enable prepared statements
-- PostgreSQL: Use $1, $2 placeholders
-- MySQL: Use ? placeholders

-- Check for dynamic table/column names (risky)
SELECT * FROM ${tableName}; -- ❌ DANGEROUS

-- Use whitelist validation instead
const allowedTables = ['users', 'posts'];
if (!allowedTables.includes(tableName)) throw new Error('Invalid table');
```

### Step 6: API Security

**Rate Limiting:**
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

**Input Validation:**
```typescript
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  age: z.number().int().min(0).max(150)
});

// Validate all user input
const validatedData = userSchema.parse(req.body);
```

**CORS Configuration:**
```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'https://yourdomain.com',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## Security Checklist

### Authentication & Authorization
- [ ] Passwords hashed with bcrypt/argon2 (not MD5/SHA1)
- [ ] JWT tokens have expiration
- [ ] Refresh tokens stored securely
- [ ] Multi-factor authentication available
- [ ] Session management secure (httpOnly, secure, sameSite)
- [ ] Password reset tokens expire
- [ ] Account lockout after failed attempts

### Data Protection
- [ ] Sensitive data encrypted at rest
- [ ] TLS/SSL for data in transit
- [ ] PII data properly masked in logs
- [ ] Database backups encrypted
- [ ] File uploads validated and sanitized
- [ ] No sensitive data in URLs/query params

### Input Validation
- [ ] All user input validated (whitelist approach)
- [ ] SQL queries use parameterized statements
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented
- [ ] File upload restrictions (type, size)
- [ ] API rate limiting enabled

### Infrastructure
- [ ] No secrets in code/git history
- [ ] Environment variables for config
- [ ] Security headers configured
- [ ] HTTPS enforced
- [ ] Dependencies up to date
- [ ] Error messages don't leak info
- [ ] Logging & monitoring enabled

## Severity Classification

**Critical (P0):**
- Hardcoded secrets/credentials
- SQL injection vulnerabilities
- Authentication bypass
- Remote code execution

**High (P1):**
- XSS vulnerabilities
- Insecure direct object references
- Missing authentication
- Sensitive data exposure

**Medium (P2):**
- Missing security headers
- Weak password policy
- Insufficient logging
- Outdated dependencies (non-critical)

**Low (P3):**
- Information disclosure
- Missing CSRF tokens (low-risk endpoints)
- Verbose error messages

## Output Format

```markdown
# Security Audit Report

## Executive Summary
- **Scan Date**: YYYY-MM-DD
- **Critical Issues**: X
- **High Issues**: Y
- **Overall Risk**: Critical/High/Medium/Low

## Critical Findings

### [OWASP Category] Vulnerability Title
**Severity**: Critical  
**CWE**: CWE-XXX  
**Location**: [file.ts](file:///path/to/file.ts#L123)  
**Description**: [What is vulnerable]  
**Impact**: [Potential damage]  
**Exploit Scenario**: [How attacker could exploit]  
**Remediation**:
\```typescript
// Secure implementation
\```

## Dependency Vulnerabilities
| Package | Version | Severity | CVE | Fix Available |
|---------|---------|----------|-----|---------------|
| lodash  | 4.17.15 | High     | CVE-2020-8203 | 4.17.21 |

## Recommendations
1. [Immediate action items]
2. [Long-term improvements]
3. [Security best practices to adopt]
```

## Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Snyk Vulnerability Database](https://security.snyk.io/)

## Validation Loop
- [ ] All Critical/High issues documented with fixes
- [ ] Secrets scan shows 0 findings
- [ ] Dependency audit shows no high/critical vulns
- [ ] Security headers verified with securityheaders.com
- [ ] OWASP Top 10 coverage complete
