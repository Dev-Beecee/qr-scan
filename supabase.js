// supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vibualoihoprrcaddlin.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpYnVhbG9paG9wcnJjYWRkbGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3Mjk4MTcsImV4cCI6MjA2NTMwNTgxN30.ig7UzDK9SYSYF6G7sOzL1_Hv0W0oTSRg-PJZhde-AYQ'


export const supabase = createClient(supabaseUrl, supabaseAnonKey);
