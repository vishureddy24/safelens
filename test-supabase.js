const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://eouzksgkezyxllffnljo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvdXprc2drZXp5eGxsZmZubGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzEyNTksImV4cCI6MjA3MTUwNzI1OX0.TgF2LaLpOGsEm2_UrqsTHmkYuqdnn2nkegGBvMyRl0o';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
});

async function testAuth() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test connection by fetching auth settings
    const { data: settings, error: settingsError } = await supabase.auth.getSession();
    
    if (settingsError) throw settingsError;
    console.log('Connection successful!');
    
    // Test sign in
    console.log('\nTesting sign in...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com', // Replace with your test email
      password: 'password'      // Replace with your test password
    });
    
    if (error) throw error;
    
    console.log('Sign in successful!');
    console.log('User:', data.user?.email);
    console.log('Session expires at:', data.session?.expires_at);
    
  } catch (error) {
    console.error('Test failed:');
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      name: error.name
    });
    
    if (error.status === 400) {
      console.error('Invalid login credentials. Please check your email and password.');
    } else if (error.message.includes('Failed to fetch')) {
      console.error('Network error. Please check your internet connection.');
    } else if (error.message.includes('Invalid API key')) {
      console.error('Invalid Supabase API key. Please verify your project configuration.');
    }
  }
}

testAuth();
