import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://khoinplnkdmwxxtfjsbp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtob2lucGxua2Rtd3h4dGZqc2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NzE0NjksImV4cCI6MjA3NjA0NzQ2OX0.q21lFmXsscfnJiAjxDUX_tj0jqsli0_gBE30kQF7Vu8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
