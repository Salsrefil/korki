import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mjniyyianfsrvxmuwnvz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qbml5eWlhbmZzcnZ4bXV3bnZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIwNDY5OTgsImV4cCI6MjA0NzYyMjk5OH0.EgWw4fiP6NY9LU0lzE6uL1FGf3ggB1YHi70DJlMxK20'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})