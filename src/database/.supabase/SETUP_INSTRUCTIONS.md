# Supabase Setup Instructions for Team Management

## Step 1: Run Database Migrations

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the file `migrations/001_team_management_setup.sql`
4. Copy all the SQL and paste it into the SQL Editor
5. Click **Run** to execute

This will:
- Create/update the `profiles`, `organizations`, and `organization_members` tables
- Set up Row Level Security (RLS) policies
- Create triggers for automatic profile creation on signup
- Add helper functions

## Step 2: Deploy the Edge Function

### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project (get project ref from dashboard URL)
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy create-team-member
```

### Option B: Manual Deployment via Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **Edge Functions**
3. Click **Create a new function**
4. Name it `create-team-member`
5. Copy the code from `functions/create-team-member/index.ts`
6. Click **Deploy**

## Step 3: Verify Environment Variables

The Edge Function needs these environment variables (automatically set by Supabase):
- `SUPABASE_URL` - Your project URL
- `SUPABASE_ANON_KEY` - Your anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Your service role key (secret)

These are automatically available in Edge Functions.

## Step 4: Test the Setup

1. Log into your app as an admin/owner
2. Go to Settings → Team Members
3. Try creating a new team member
4. The member should be created instantly without:
   - Rate limiting errors
   - Email confirmation required
   - Logging you out

## Troubleshooting

### "Function not found" error
- Make sure the function is deployed and named exactly `create-team-member`
- Check Edge Functions in your Supabase dashboard

### "Permission denied" error
- Ensure the SQL migration ran successfully
- Check that RLS policies are enabled
- Verify your user has `owner` or `admin` role in `organization_members`

### "Invalid token" error
- Make sure you're logged in
- Try logging out and back in
- Check that the session hasn't expired

## Security Notes

- The Edge Function uses the service role key (admin privileges)
- It verifies the calling user is authenticated
- It checks the caller has admin/owner role in the organization
- It auto-confirms email so new users can login immediately
- If membership creation fails, the user is automatically deleted (cleanup)

## Role Hierarchy

| Role    | Can View | Can Add Members | Can Remove Members | Can Edit Org |
|---------|----------|-----------------|--------------------|--------------|
| owner   | ✅       | ✅              | ✅ (except owners) | ✅           |
| admin   | ✅       | ✅              | ✅ (except owners) | ❌           |
| manager | ✅       | ❌              | ❌                 | ❌           |
| viewer  | ✅       | ❌              | ❌                 | ❌           |
