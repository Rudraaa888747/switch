require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use the exact URL and ANON KEY from the live setup
const SUPABASE_URL = "https://xrlobwvtxkehazwrqtgq.supabase.co";
// Extracted from test-orders.js
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhybG9idnZ0eGtlaGF6d3JxdGdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwMzUzNzQsImV4cCI6MjA1NTYxMTM3NH0.p0Zt8KxZ_S0Qz0_T-X_Y0Z_Q0Z_Q0Z_Q0Z_Q0Z_Q0Z8"; 
// wait, I need the actual anon key. Let me read it from test-orders.js!
