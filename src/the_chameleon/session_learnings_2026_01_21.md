# Session Learnings - Multi-Tenancy & Data Management (2026-01-21)

## MCP Tools - Effective Usage Patterns

### ✅ Supabase MCP
**When to use**:
- Direct database inspection to verify data exists before debugging display logic
- Bulk data cleanup (DELETE queries for mock/test data)
- Running migrations for trigger fixes
- Aggregating data across tables with complex queries

**Key patterns**:
```sql
-- Always verify data exists first
SELECT COUNT(*), DATE(created_at) 
FROM table_name 
WHERE organization_id = 'xxx'
GROUP BY DATE(created_at);

-- Clean mock data in production
DELETE FROM table_name 
WHERE execution_id LIKE 'hist-%' OR execution_id LIKE 'test-%';

-- Apply security fixes to triggers
CREATE OR REPLACE FUNCTION trigger_name() ...
```

### ✅ n8n MCP
**When to use**:
- Inspecting workflow structure to understand data flow
- Identifying which workflows write to which tables
- Debugging automation issues (why data isn't being saved)

**Key learnings**:
- n8n workflows are simpler than they appear - most delegate to central "execution" workflows
- The "Execution Governance System" is actually just an observer, not a writer
- Real database writes happen via Supabase triggers, not direct n8n nodes in many cases

## Multi-Tenancy Security

### Critical Pattern
**ALWAYS filter by organization_id in database triggers**:
```sql
-- ❌ WRONG - Cross-tenant collision risk
SELECT id FROM escalations 
WHERE execution_id = NEW.execution_id 
AND status = 'OPEN';

-- ✅ CORRECT - Tenant-isolated
SELECT id FROM escalations 
WHERE organization_id = NEW.organization_id  -- CRITICAL
AND execution_id = NEW.execution_id 
AND status = 'OPEN';
```

### n8n Workflow Security
- Verify `organization_id` is included in ALL Supabase node filters
- "Governed Cashflow" workflow was missing this - potential data leak

## Data Accuracy Issues

### Mock Data Contamination
**Problem**: Test data with prefixes like `hist-*`, `test-*` inflates production counts

**Solutions**:
1. **Database-level**: Delete mock data from production
   ```sql
   DELETE FROM table WHERE execution_id LIKE 'hist-%' OR execution_id LIKE 'test-%';
   ```

2. **Code-level**: Filter at query time
   ```typescript
   const isMockData = (executionId: string | null | undefined): boolean => {
     if (!executionId) return false;
     return executionId.startsWith('hist-') || executionId.startsWith('test-');
   };
   ```

### Data Deduplication
**Problem**: Unified queries from two tables created duplicates (9 + 65 = 74 instead of 9 unique)

**Solution**: Track IDs from primary source, exclude from secondary source
```typescript
const existingExecutionIds = new Set(
  primaryRecords.map(r => r.execution_id).filter(id => id !== null)
);

const filtered = secondaryRecords.filter(r => 
  !existingExecutionIds.has(r.execution_id)
);
```

## Currency Parsing (European Format)

### The Bug
```typescript
// ❌ WRONG - Treats dots as decimals
parseCurrency("€ 179.917,92") // → 179.917 (incorrect)

// ✅ CORRECT - Dots are thousand separators
parseCurrency("€ 179.917,92") // → 179917.92
```

### The Fix
```typescript
export function parseCurrency(value: string): number {
  if (!value) return 0;
  let cleaned = value.replace('€', '').replace(/\\s/g, '');
  
  // European format: comma = decimal, dot = thousands
  if (cleaned.includes(',')) {
    cleaned = cleaned.replace(/\\./g, '').replace(',', '.');
  }
  
  return parseFloat(cleaned) || 0;
}
```

## Debugging Methodology

### Rule: Data First, Display Second
When user reports "missing data":
1. **First**: Query database directly to verify data exists
   ```sql
   SELECT COUNT(*), DATE(created_at) FROM table 
   WHERE org_id = 'x' GROUP BY DATE(created_at);
   ```
2. **Then**: If data exists, debug display/filtering logic
3. **If missing**: Problem is in data pipeline (n8n, triggers), not frontend

### Example from this session
- User: "Message Log showing only old messages"
- My mistake: Immediately debugged filtering logic
- Actual issue: No new messages in database (n8n not saving)
- Lesson: 5 minutes of SQL would have saved 20 minutes of code debugging

## Mistakes to Avoid

1. **Assuming code is the problem when data is missing** - Always verify data exists first
2. **Over-aggressive filtering** - Don't filter valid data thinking it's "internal traces"
3. **Forgetting deduplication** - When unifying two data sources, check for duplicates
4. **Missing organization_id in triggers** - Cross-tenant data leaks are critical security bugs
5. **Not cleaning test data from production** - Inflates counts and confuses users

## What Worked Well

1. **Using Supabase MCP for direct DB operations** - Much faster than writing backend endpoints
2. **Hardening triggers at DB level** - Security enforced regardless of application code
3. **Deduplication via Set tracking** - Clean, performant pattern
4. **Documenting in chef_memory.md** - Persistent learning across sessions
