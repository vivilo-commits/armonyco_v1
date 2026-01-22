-- ============================================================================
-- TEAM MANAGEMENT SETUP FOR ARMONYCO SAAS
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Ensure profiles table exists with correct structure
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Ensure organizations table exists
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Ensure organization_members table exists with correct structure
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'manager', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ============================================================================
-- TRIGGERS: Auto-create profile when user signs up
-- ============================================================================

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- RLS POLICIES FOR PROFILES
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can view profiles of members in their organizations
DROP POLICY IF EXISTS "Users can view org member profiles" ON profiles;
CREATE POLICY "Users can view org member profiles" ON profiles
  FOR SELECT USING (
    id IN (
      SELECT om.user_id FROM organization_members om
      WHERE om.organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  );

-- Service role can do anything (for Edge Functions)
DROP POLICY IF EXISTS "Service role full access profiles" ON profiles;
CREATE POLICY "Service role full access profiles" ON profiles
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- RLS POLICIES FOR ORGANIZATIONS
-- ============================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Users can view organizations they belong to
DROP POLICY IF EXISTS "Users can view own organizations" ON organizations;
CREATE POLICY "Users can view own organizations" ON organizations
  FOR SELECT USING (
    id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

-- Only owners can update organization
DROP POLICY IF EXISTS "Owners can update organization" ON organizations;
CREATE POLICY "Owners can update organization" ON organizations
  FOR UPDATE USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Service role can do anything
DROP POLICY IF EXISTS "Service role full access organizations" ON organizations;
CREATE POLICY "Service role full access organizations" ON organizations
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- RLS POLICIES FOR ORGANIZATION_MEMBERS
-- ============================================================================

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Users can view members of their organizations
DROP POLICY IF EXISTS "Users can view org members" ON organization_members;
CREATE POLICY "Users can view org members" ON organization_members
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Owners and admins can add members
DROP POLICY IF EXISTS "Admins can insert members" ON organization_members;
CREATE POLICY "Admins can insert members" ON organization_members
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Owners and admins can update members (but not owners)
DROP POLICY IF EXISTS "Admins can update members" ON organization_members;
CREATE POLICY "Admins can update members" ON organization_members
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
    AND role != 'owner' -- Cannot modify owners
  );

-- Owners and admins can delete members (but not owners)
DROP POLICY IF EXISTS "Admins can delete members" ON organization_members;
CREATE POLICY "Admins can delete members" ON organization_members
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
    AND role != 'owner' -- Cannot delete owners
  );

-- Service role can do anything
DROP POLICY IF EXISTS "Service role full access members" ON organization_members;
CREATE POLICY "Service role full access members" ON organization_members
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- HELPER FUNCTION: Get user's organization_id
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id
  FROM organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================================
-- HELPER FUNCTION: Check if user is admin of organization
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = auth.uid()
    AND organization_id = org_id
    AND role IN ('owner', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
