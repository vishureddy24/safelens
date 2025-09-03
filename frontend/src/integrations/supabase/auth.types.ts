import { User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js';

export type User = {
  id: string;
  email?: string | null;
  created_at?: string;
  updated_at?: string;
  // Add any additional user fields from your database
};

export type Session = {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  user: User;
} & Pick<SupabaseSession, 'expires_at'>;

export type AuthResponse = {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
};

export type AuthError = {
  message: string;
  status?: number;
  name?: string;
};

export const mapSupabaseUser = (user: SupabaseUser | null): User | null => {
  if (!user) return null;
  
  return {
    id: user.id,
    email: user.email || null,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
};

export const mapSupabaseSession = (session: SupabaseSession | null): Session | null => {
  if (!session) return null;
  
  return {
    access_token: session.access_token,
    token_type: session.token_type,
    expires_in: session.expires_in,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    user: mapSupabaseUser(session.user) as User,
  };
};
