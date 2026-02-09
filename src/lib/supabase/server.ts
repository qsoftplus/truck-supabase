import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Server-side Supabase client (uses service role key for privileged operations)
// Use this in Server Actions and API Routes for admin operations
// NOTE: Database type generic removed due to type inference issues with Zod schemas
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
