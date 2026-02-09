import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client (uses anon key + RLS)
// NOTE: Database type generic removed due to type inference issues
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
