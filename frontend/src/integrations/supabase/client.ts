import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Get Supabase URL and key from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://wbqydwbbmepihqdsfahg.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  console.log('Using default Supabase URL:', SUPABASE_URL);
} 

// Configure Supabase client with enhanced settings
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      debug: true,
      storage: localStorage,
      storageKey: 'sb-auth-token',
    },
    global: {
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Info': 'safelens-web-app/1.0',
        'Accept': 'application/json',
        'X-Supabase-API-Version': '2024-06-27',
      },
      fetch: async (url: string, options: RequestInit = {}) => {
        const headers = new Headers(options?.headers);
        
        // Set default headers if not present
        if (!headers.has('Accept')) headers.set('Accept', 'application/json');
        if (!headers.has('Content-Type') && options?.method !== 'GET') {
          headers.set('Content-Type', 'application/json');
        }
        
        // Add required Supabase headers
        if (url.startsWith(SUPABASE_URL)) {
          headers.set('apikey', SUPABASE_KEY);
        }
        
        // For preflight requests, let the browser handle them
        if (options.method === 'OPTIONS') {
          return new Response(null, { 
            status: 204,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'apikey, authorization, content-type',
            }
          });
        }
        
        try {
          const response = await fetch(url, {
            ...options,
            headers,
            credentials: 'include',
            mode: 'cors',
          });

          // Handle CORS errors
          if (response.status === 0) {
            throw new Error('Network error: Failed to fetch - check CORS configuration');
          }

          // Log response for debugging
          console.log(`[${options.method || 'GET'}] ${url} - ${response.status}`);
          return response;
        } catch (error) {
          console.error('Fetch error:', error);
          if (error instanceof TypeError) {
            throw new Error('Network error: Failed to connect to the server. Please check your internet connection and CORS settings.');
          }
          throw error;
        }
      },
    },
  }
);

// Log auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth state changed:', event, session);
  
  // Handle specific auth events
  switch (event) {
    case 'SIGNED_IN':
      console.log('User signed in:', session?.user?.email);
      break;
    case 'SIGNED_OUT':
      console.log('User signed out');
      break;
    case 'TOKEN_REFRESHED':
      console.log('Auth token refreshed');
      break;
    case 'USER_UPDATED':
      console.log('User updated:', session?.user);
      break;
    case 'PASSWORD_RECOVERY':
      console.log('Password recovery initiated');
      break;
    default:
      console.log('Unknown auth event:', event);
  }
});