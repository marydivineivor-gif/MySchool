
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://upywypwkmkrxbpogrwtw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVweXd5cHdrbWtyeGJwb2dyd3R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzg3MTMsImV4cCI6MjA4NTg1NDcxM30.jocfhAVby0EKds2v8xkSBxvcDvB0I1DvtH57a10MndA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
