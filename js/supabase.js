// frontend-vercel/js/supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.4/+esm';

// ==========================================
// 🔐 SUPABASE CONFIGURATION
// ==========================================
// WARNING: Replace these with your actual Supabase project credentials.
// The ANON KEY is safe to expose in the browser because we enabled Row Level Security (RLS) in SQL!
const SUPABASE_URL = 'https://lvbxijzfpyzzmqbtafpm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_PQoI8dAh3ik4NdxeoUqHbg_a9TbQUKp';

// Initialize the Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// 🛡️ AUTHENTICATION UTILITIES
// ==========================================

/**
 * Checks if a user is currently logged in and has an active session.
 * Used to protect the dashboard.html route.
 */
export async function requireAuth() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
        console.warn("Unauthorized access attempt. Redirecting to auth portal.");
        window.location.href = 'auth.html';
        return null;
    }
    return session.user;
}

/**
 * Checks if a user is already logged in to prevent them from seeing the login screen.
 * Used on index.html and auth.html.
 */
export async function redirectIfAuthenticated() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        window.location.href = 'dashboard.html';
    }
}