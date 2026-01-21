---
name: database-managing
description: Manages database operations including schema design, migrations, query optimization, and data integrity. Use when the user mentions database, SQL, migrations, schema, or data modeling.
triggers:
  - "Create table..."
  - "Database migration..."
  - "Optimize query..."
  - "SQL..."
---

# Database Managing

## When to use this skill
- User requests database schema design or modifications
- User mentions migrations, schema changes, or database setup
- User asks about query optimization or performance
- User wants to design data models or relationships
- User mentions database backup, restore, or data integrity

## Workflow

### 1. P.R.I.S.M.A. Phase 2: Reach (Connectivity)
- [ ] Test database connection and credentials in `src/.env`.
- [ ] Build a minimal **Handshake Script** using the **Supabase JS Client** (`.from().select()`) for a simple query. **RAW `fetch()` is FORBIDDEN for authenticated data.**
- [ ] **Data Integrity**: Ensure all tables have `created_at` and `updated_at` timestamps.
- [ ] **Migration Discipline**: Follow a `YYYYMMDD_feature_name.sql` naming convention.
- [ ] **Security (RLS)**: Define strict Row Level Security using the `organization_members` subquery pattern:
```sql
-- Armonyco Standard RLS Pattern
CREATE POLICY "allow tenant access"
ON public.your_table FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid()
  )
);
```

### 2. Migration Management
- [ ] Create reversible migrations (UP/DOWN)
- [ ] Test migrations on development database
- [ ] Backup production before migration
- [ ] Execute migration with rollback plan
- [ ] Verify data integrity post-migration

## Instructions

### Step 1: Schema Design

**Entity-Relationship Analysis:**
```markdown
# Example: E-commerce Schema

## Entities
- Users (customers, admins)
- Products (items for sale)
- Orders (purchase records)
- OrderItems (products in an order)
- Categories (product categories)

## Relationships
- User → Orders (1:N) - One user has many orders
- Order → OrderItems (1:N) - One order has many items
- Product → OrderItems (1:N) - One product in many orders
- Category → Products (1:N) - One category has many products
```

**SQL Schema Implementation:**
```sql
-- PostgreSQL example
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10, 2) NOT NULL,
  UNIQUE(order_id, product_id)
);

-- Indexes for performance
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- Full-text search index
CREATE INDEX idx_products_search ON products USING GIN(to_tsvector('english', name || ' ' || description));
```

### Step 2: Migration Creation

**Migration Template (Node.js/Knex):**
```typescript
// migrations/20240119_create_users_table.ts
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email', 255).unique().notNullable();
    table.string('password_hash', 255).notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('users');
}
```

**Migration Commands:**
```bash
# Create new migration
npx knex migrate:make create_users_table

# Run pending migrations
npx knex migrate:latest

# Rollback last migration
npx knex migrate:rollback

# Check migration status
npx knex migrate:status
```

### Step 3: Query Optimization

**Identify Slow Queries:**
```sql
-- PostgreSQL: Enable query logging
ALTER DATABASE mydb SET log_min_duration_statement = 100; -- Log queries > 100ms

-- View slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

**Optimization Techniques:**

**1. Use EXPLAIN ANALYZE:**
```sql
EXPLAIN ANALYZE
SELECT p.*, c.name as category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.price > 100;

-- Look for:
-- - Seq Scan (bad) → should be Index Scan
-- - High cost values
-- - Nested loops on large datasets
```

**2. Add Indexes:**
```sql
-- Before: Seq Scan on products (cost=0.00..1234.56)
SELECT * FROM products WHERE price > 100;

-- Add index
CREATE INDEX idx_products_price ON products(price);

-- After: Index Scan using idx_products_price (cost=0.42..123.45)
```

**3. Avoid N+1 Queries:**
```typescript
// ❌ BAD: N+1 query problem
const users = await db.select('*').from('users');
for (const user of users) {
  const orders = await db.select('*').from('orders').where('user_id', user.id);
  user.orders = orders;
}

// ✅ GOOD: Single query with JOIN
const users = await db
  .select('users.*', db.raw('json_agg(orders.*) as orders'))
  .from('users')
  .leftJoin('orders', 'users.id', 'orders.user_id')
  .groupBy('users.id');
```

**4. Use Pagination:**
```sql
-- ❌ BAD: Load all records
SELECT * FROM products;

-- ✅ GOOD: Paginate with LIMIT/OFFSET
SELECT * FROM products
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;

-- ✅ BETTER: Cursor-based pagination (for large datasets)
SELECT * FROM products
WHERE id > $1
ORDER BY id
LIMIT 20;
```

### Step 4: Data Integrity

**Constraints:**
```sql
-- NOT NULL constraint
ALTER TABLE users ALTER COLUMN email SET NOT NULL;

-- UNIQUE constraint
ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);

-- CHECK constraint
ALTER TABLE products ADD CONSTRAINT products_price_positive CHECK (price >= 0);

-- FOREIGN KEY constraint
ALTER TABLE orders ADD CONSTRAINT orders_user_fk 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

**Transactions:**
```typescript
// Ensure atomicity for multi-step operations
await db.transaction(async (trx) => {
  // 1. Create order
  const [order] = await trx('orders').insert({
    user_id: userId,
    total: 0,
  }).returning('*');

  // 2. Add order items
  const items = await trx('order_items').insert(
    products.map(p => ({
      order_id: order.id,
      product_id: p.id,
      quantity: p.quantity,
      price: p.price,
    }))
  ).returning('*');

  // 3. Update order total
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  await trx('orders').where('id', order.id).update({ total });

  // 4. Decrease product stock
  for (const item of items) {
    await trx('products')
      .where('id', item.product_id)
      .decrement('stock', item.quantity);
  }

  return order;
});
```

### Step 5: Backup & Restore

**PostgreSQL Backup:**
```bash
# Full database backup
pg_dump -h localhost -U postgres -d mydb -F c -f backup.dump

# Backup specific tables
pg_dump -h localhost -U postgres -d mydb -t users -t orders -F c -f backup.dump

# Backup with compression
pg_dump -h localhost -U postgres -d mydb | gzip > backup.sql.gz

# Automated daily backups
# Add to crontab: 0 2 * * * /path/to/backup-script.sh
```

**Restore:**
```bash
# Restore from custom format
pg_restore -h localhost -U postgres -d mydb backup.dump

# Restore from SQL
psql -h localhost -U postgres -d mydb < backup.sql

# Restore from compressed
gunzip -c backup.sql.gz | psql -h localhost -U postgres -d mydb
```

### Step 6: Database Seeding

**Seed Data for Development:**
```typescript
// seeds/01_users.ts
import { Knex } from 'knex';
import bcrypt from 'bcrypt';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data
  await knex('order_items').del();
  await knex('orders').del();
  await knex('products').del();
  await knex('categories').del();
  await knex('users').del();

  // Insert users
  await knex('users').insert([
    {
      email: 'admin@example.com',
      password_hash: await bcrypt.hash('password123', 10),
    },
    {
      email: 'user@example.com',
      password_hash: await bcrypt.hash('password123', 10),
    },
  ]);

  // Insert categories
  await knex('categories').insert([
    { name: 'Electronics', slug: 'electronics' },
    { name: 'Books', slug: 'books' },
  ]);

  // Insert products
  await knex('products').insert([
    { category_id: 1, name: 'Laptop', price: 999.99, stock: 10 },
    { category_id: 1, name: 'Mouse', price: 29.99, stock: 50 },
    { category_id: 2, name: 'Clean Code', price: 39.99, stock: 20 },
  ]);
}
```

**Run seeds:**
```bash
# Run all seeds
npx knex seed:run

# Run specific seed
npx knex seed:run --specific=01_users.ts
```

## Database Patterns

### Soft Deletes
```sql
-- Add deleted_at column
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP;

-- "Delete" a record
UPDATE users SET deleted_at = NOW() WHERE id = $1;

-- Query only active records
SELECT * FROM users WHERE deleted_at IS NULL;

-- Restore a record
UPDATE users SET deleted_at = NULL WHERE id = $1;
```

### Audit Trail
```sql
-- Create audit table
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(50) NOT NULL,
  record_id VARCHAR(255) NOT NULL,
  action VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
  old_values JSONB,
  new_values JSONB,
  user_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Trigger function
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (table_name, record_id, action, old_values)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (table_name, record_id, action, old_values, new_values)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (table_name, record_id, action, new_values)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW));
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to table
CREATE TRIGGER users_audit
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION audit_trigger();
```

## Resources
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Database Normalization](https://en.wikipedia.org/wiki/Database_normalization)
- [Use The Index, Luke](https://use-the-index-luke.com/)

## Validation Checklist
- [ ] Schema follows 3NF normalization
- [ ] All foreign keys have indexes
- [ ] Migrations are reversible (UP/DOWN)
- [ ] Constraints enforce data integrity
- [ ] Queries use indexes (verify with EXPLAIN)
- [ ] Backup strategy documented and tested
- [ ] Seed data available for development
