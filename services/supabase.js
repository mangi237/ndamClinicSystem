import { createClient } from '@supabase/supabase-js'

// Replace these with your actual values from Supabase dashboard
const supabaseUrl = 'https://spapghjxeojrfrrubxyy.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwYXBnaGp4ZW9qcmZycnVieHl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMDU2NDYsImV4cCI6MjA3MjU4MTY0Nn0.ZFFLYZzfw_g1VhzbBn_297oznfEuTA4a9z_iR1VBseE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)