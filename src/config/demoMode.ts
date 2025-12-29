
/**
 * Demo Mode Configuration
 * 
 * When DEMO_MODE is true, the app bypasses all Supabase calls
 * and shows mock data as the default experience.
 * 
 * To reconnect a backend later:
 * 1. Set DEMO_MODE = false
 * 2. Update Supabase credentials in src/integrations/supabase/client.ts
 * 3. Run migrations to set up the database
 */

export const DEMO_MODE = true;
