---
name: performance-optimization
description: Analyzes and optimizes application performance. Use when the user mentions performance, optimization, slow code, bundle size, or memory leaks.
triggers:
  - "Make it faster..."
  - "Optimize performance..."
  - "Slow..."
  - "Lighthouse..."
---

# Performance Optimization

## When to use this skill
- User mentions performance issues or slow application
- User asks to optimize code or reduce bundle size
- User reports memory leaks or high memory usage
- User wants to improve load times or rendering speed
- User mentions Core Web Vitals, LCP, FID, CLS

## Workflow

### 1. P.R.I.S.M.A. Phase 4: Stylization (Visual Excellence)
- [ ] **Depth & Layers**: Use subtle shadows, borders, or translucent backgrounds to create hierarchy.
- [ ] **Typography**: Prioritize modern, readable fonts with deliberate weight (e.g., Inter, Outfit, Roboto).
- [ ] **Consistency**: Ensure spacing (padding/margin) follows a strict mathematical scale (e.g., multiples of 4px).
- [ ] **Micro-animations**: Add subtle transitions (200ms-300ms) for hover, focus, and layout changes.
- [ ] **Color Harmony**: Use balanced palettes (HSL-based) instead of generic defaults.
- [ ] **Responsiveness**: Ensure fluid layouts across all breakpoints.

### 2. Optimization Categories

**Frontend Performance:**
- Bundle size reduction
- Code splitting & lazy loading
- Image optimization
- Caching strategies
- Rendering optimization

**Backend Performance:**
- Database query optimization
- API response time
- Caching layers
- Algorithmic improvements

**Network Performance:**
- Reduce HTTP requests
- Compression (gzip, brotli)
- CDN usage
- Prefetching & preloading

## Instructions

### Step 1: Baseline Measurement

**Frontend Metrics:**
```bash
# Lighthouse audit
npx lighthouse https://your-app.com --output=json --output-path=./lighthouse-report.json

# Bundle analysis
npx vite-bundle-visualizer
# or for webpack
npx webpack-bundle-analyzer dist/stats.json

# Core Web Vitals
# Use Chrome DevTools > Performance > Record page load
```

**Backend Metrics:**
```bash
# API response time
curl -w "@curl-format.txt" -o /dev/null -s https://api.example.com/endpoint

# Database query analysis (PostgreSQL example)
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
```

### Step 2: Bundle Size Optimization

**Identify Large Dependencies:**
```bash
# List package sizes
npx npkd <package-name>

# Find duplicate dependencies
npx depcheck
```

**Optimization Techniques:**

1. **Code Splitting:**
```typescript
// Before: Everything in one bundle
import { HeavyComponent } from './HeavyComponent';

// After: Lazy load on demand
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

2. **Tree Shaking:**
```typescript
// Before: Import entire library
import _ from 'lodash';

// After: Import only what you need
import debounce from 'lodash/debounce';
```

3. **Dynamic Imports:**
```typescript
// Load heavy library only when needed
async function processData() {
  const { default: heavyLib } = await import('heavy-library');
  return heavyLib.process(data);
}
```

### Step 3: Runtime Performance

**React Optimization:**
```typescript
// 1. Memoization
const MemoizedComponent = memo(({ data }) => {
  return <ExpensiveRender data={data} />;
});

// 2. useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);

// 3. useCallback for stable function references
const handleClick = useCallback(() => {
  doSomething(a);
}, [a]);

// 4. Virtual scrolling for long lists
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={1000}
  itemSize={35}
>
  {Row}
</FixedSizeList>
```

**Algorithmic Optimization:**
```typescript
// Before: O(n²) - nested loops
function findDuplicates(arr) {
  const duplicates = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j]) duplicates.push(arr[i]);
    }
  }
  return duplicates;
}

// After: O(n) - using Set
function findDuplicates(arr) {
  const seen = new Set();
  const duplicates = new Set();
  
  for (const item of arr) {
    if (seen.has(item)) {
      duplicates.add(item);
    } else {
      seen.add(item);
    }
  }
  
  return Array.from(duplicates);
}
```

### Step 4: Database Optimization

**Query Optimization:**
```sql
-- Before: N+1 query problem
SELECT * FROM users;
-- Then for each user:
SELECT * FROM posts WHERE user_id = ?;

-- After: Single query with JOIN
SELECT users.*, posts.*
FROM users
LEFT JOIN posts ON users.id = posts.user_id;

-- Add indexes for frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_user_id ON posts(user_id);
```

**Caching Strategy:**
```typescript
// Redis caching example
async function getUser(id: string) {
  // Check cache first
  const cached = await redis.get(`user:${id}`);
  if (cached) return JSON.parse(cached);
  
  // Fetch from database
  const user = await db.users.findById(id);
  
  // Cache for 1 hour
  await redis.setex(`user:${id}`, 3600, JSON.stringify(user));
  
  return user;
}
```

### Step 5: Image Optimization

```typescript
// Use next/image or similar optimized image component
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  loading="lazy"
  placeholder="blur"
  quality={85}
/>

// Or use modern formats
<picture>
  <source srcSet="/image.avif" type="image/avif" />
  <source srcSet="/image.webp" type="image/webp" />
  <img src="/image.jpg" alt="Fallback" />
</picture>
```

### Step 6: Network Optimization

**Resource Hints:**
```html
<!-- Preconnect to external domains -->
<link rel="preconnect" href="https://fonts.googleapis.com" />

<!-- Prefetch resources for next page -->
<link rel="prefetch" href="/next-page.js" />

<!-- Preload critical resources -->
<link rel="preload" href="/critical.css" as="style" />
```

**Compression:**
```javascript
// Vite config
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'ui': ['@/components/ui']
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
};
```

## Performance Targets

### Frontend
- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.8s
- **Total Blocking Time (TBT)**: < 200ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Bundle Size**: < 200KB (gzipped)

### Backend
- **API Response Time**: < 200ms (p95)
- **Database Query Time**: < 50ms (p95)
- **Memory Usage**: Stable (no leaks)
- **CPU Usage**: < 70% average

## Profiling Tools

**Browser DevTools:**
```bash
# Chrome DevTools
1. Performance tab > Record
2. Lighthouse tab > Generate report
3. Network tab > Throttling

# React DevTools Profiler
1. Install React DevTools extension
2. Profiler tab > Record
3. Analyze component render times
```

**Node.js Profiling:**
```bash
# CPU profiling
node --prof app.js
node --prof-process isolate-*.log > processed.txt

# Memory profiling
node --inspect app.js
# Open chrome://inspect
# Take heap snapshots
```

## Optimization Checklist
- [ ] Bundle size reduced by > 30%
- [ ] Lighthouse score > 90
- [ ] No unnecessary re-renders (React DevTools)
- [ ] Images optimized and lazy-loaded
- [ ] Database queries indexed
- [ ] API responses cached where appropriate
- [ ] Code split by route
- [ ] Critical CSS inlined
- [ ] Third-party scripts deferred

## Resources
- [Web.dev Performance](https://web.dev/performance/)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Vite Performance](https://vitejs.dev/guide/performance.html)

## Validation Loop
After optimization:
- [ ] Re-run Lighthouse audit
- [ ] Compare before/after metrics
- [ ] Verify functionality unchanged
- [ ] Test on slow network (3G throttling)
- [ ] Monitor production metrics
