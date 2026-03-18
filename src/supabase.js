import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xakxzdkttkcjujqxvahb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhha3h6ZGt0dGtjanVqcXh2YWhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjA0NTIsImV4cCI6MjA4OTI5NjQ1Mn0.BoMcJEeKJ60nY9L2HJUx87supVtwzUWK2cwtNSlHdhI'

export const supabase = createClient(supabaseUrl, supabaseKey)