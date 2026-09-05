'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { addUser, authenticateUser, updateUserAsync } from '@/lib/mockData';

import type { UserRole } from '@/lib/mockData';

const VALID_ROLES: UserRole[] = [
  'client',
  'vendor',
  'ambassador',
  'admin',
  'towing',
  'garage',
  'rider',
];

function normalizeSignupRole(role: unknown): UserRole {
  if (typeof role === 'string' && VALID_ROLES.includes(role as UserRole)) {
    return role as UserRole;
  }
  return 'client';
}

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: UserRole;
  whatsapp_number?: string;
  ambassador_code?: string;
  referred_by?: string;
  location_lat?: number;
  location_lng?: number;
  city?: string;
  is_active: boolean;
}

interface AuthContextType {
  user: any;
  profile: UserProfile | null;
  session: any;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: any) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  getCurrentUser: () => Promise<any>;
  isEmailVerified: () => boolean;
  getUserProfile: () => Promise<UserProfile | null>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const clearAuthState = useCallback(() => {
    setUser(null);
    setProfile(null);
    setSession(null);
    try {
      localStorage.removeItem('hapo_auth_user');
    } catch {}
  }, []);

  const fetchProfile = useCallback(
    async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();
        if (error) {
          console.warn('Profile fetch error:', error.message);
          return null;
        }
        return data as UserProfile;
      } catch {
        return null;
      }
    },
    [supabase]
  );

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const p = await fetchProfile(session.user.id);
        if (p?.is_active === false) {
          await supabase.auth.signOut();
          clearAuthState();
          setLoading(false);
          return;
        }
        setProfile(p);
        // Sync to localStorage for legacy components
        if (p) {
          try {
            localStorage.setItem(
              'hapo_auth_user',
              JSON.stringify({
                id: p.id,
                email: p.email,
                first_name: p.first_name,
                last_name: p.last_name,
                phone: p.phone,
                role: p.role,
                whatsapp_number: p.whatsapp_number,
                ambassador_code: p.ambassador_code,
                referred_by: p.referred_by,
                location_lat: p.location_lat,
                location_lng: p.location_lng,
                city: p.city,
                is_active: p.is_active,
              })
            );
          } catch {}
        }
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const p = await fetchProfile(session.user.id);
        if (p?.is_active === false) {
          await supabase.auth.signOut();
          clearAuthState();
          setLoading(false);
          return;
        }
        setProfile(p);
        if (p) {
          try {
            localStorage.setItem(
              'hapo_auth_user',
              JSON.stringify({
                id: p.id,
                email: p.email,
                first_name: p.first_name,
                last_name: p.last_name,
                phone: p.phone,
                role: p.role,
                whatsapp_number: p.whatsapp_number,
                ambassador_code: p.ambassador_code,
                referred_by: p.referred_by,
                location_lat: p.location_lat,
                location_lng: p.location_lng,
                city: p.city,
                is_active: p.is_active,
              })
            );
          } catch {}
        }
      } else {
        setProfile(null);
        try {
          localStorage.removeItem('hapo_auth_user');
        } catch {}
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [clearAuthState, fetchProfile, supabase]);

  const signUp = async (email: string, password: string, metadata: any = {}) => {
    const selectedRole = normalizeSignupRole(metadata?.role);

    try {
      localStorage.removeItem('hapo_auth_user');
    } catch {}

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name:
            metadata?.fullName ||
            `${metadata?.first_name || ''} ${metadata?.last_name || ''}`.trim(),
          role: selectedRole,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });
    if (error) throw error;

    // Create user profile
    if (data.user) {
      const profileData: any = {
        id: data.user.id,
        email,
        first_name: metadata?.first_name || '',
        last_name: metadata?.last_name || '',
        phone: metadata?.phone || null,
        role: selectedRole,
        whatsapp_number: metadata?.whatsapp_number || null,
        city: metadata?.city || null,
        is_active: true,
      };
      if (selectedRole === 'ambassador' && metadata?.ambassador_code) {
        profileData.ambassador_code = metadata.ambassador_code;
      }
      if (metadata?.referred_by) {
        // Look up ambassador by code
        const { data: ambData } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('ambassador_code', metadata.referred_by)
          .single();
        if (ambData) profileData.referred_by = ambData.id;
      }

      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert(profileData, { onConflict: 'id' });
      if (profileError) {
        console.warn('Profile creation error:', profileError.message);
      } else {
        setProfile(profileData as UserProfile);
        try {
          const localUser = {
            id: profileData.id,
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            phone: profileData.phone || '',
            email: profileData.email,
            role: profileData.role,
            whatsapp_number: profileData.whatsapp_number || undefined,
            ambassador_code: profileData.ambassador_code || undefined,
            referred_by: profileData.referred_by || undefined,
            city: profileData.city || undefined,
            is_active: profileData.is_active,
            password: '',
          };
          addUser(localUser);
        } catch {}
      }
    }
    return data;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data?.user) {
      const profile = await fetchProfile(data.user.id);
      if (!profile) {
        const localUser = authenticateUser(email, password);
        if (localUser) {
          if (!localUser.is_active) {
            await supabase.auth.signOut();
            throw new Error('This account is deactivated. Please contact support.');
          }
          const profileData: UserProfile = {
            id: data.user.id,
            email: localUser.email,
            first_name: localUser.first_name,
            last_name: localUser.last_name,
            phone: localUser.phone,
            role: localUser.role,
            whatsapp_number: localUser.whatsapp_number,
            ambassador_code: localUser.ambassador_code,
            referred_by: localUser.referred_by,
            location_lat: localUser.location_lat,
            location_lng: localUser.location_lng,
            city: localUser.city,
            is_active: localUser.is_active,
          };
          try {
            await supabase.from('user_profiles').upsert(profileData, { onConflict: 'id' });
          } catch {
            // continue with local fallback even if profile creation fails
          }
          setUser(data.user);
          setProfile(profileData);
          try {
            localStorage.setItem('hapo_auth_user', JSON.stringify(profileData));
          } catch {}
          return data;
        }
        await supabase.auth.signOut();
        throw new Error('Account profile was not found. Please contact support.');
      }
      if (profile.is_active === false) {
        await supabase.auth.signOut();
        throw new Error('This account is deactivated. Please contact support.');
      }
      setUser(data.user);
      setProfile(profile);
      try {
        localStorage.setItem('hapo_auth_user', JSON.stringify(profile));
      } catch {}
      return data;
    }

    const localUser = authenticateUser(email, password);
    if (localUser) {
      if (!localUser.is_active) {
        throw new Error('This account is deactivated. Please contact support.');
      }
      const profileData: UserProfile = {
        id: localUser.id,
        email: localUser.email,
        first_name: localUser.first_name,
        last_name: localUser.last_name,
        phone: localUser.phone,
        role: localUser.role,
        whatsapp_number: localUser.whatsapp_number,
        ambassador_code: localUser.ambassador_code,
        referred_by: localUser.referred_by,
        location_lat: localUser.location_lat,
        location_lng: localUser.location_lng,
        city: localUser.city,
        is_active: localUser.is_active,
      };
      setUser({ id: localUser.id, email: localUser.email });
      setProfile(profileData);
      try {
        localStorage.setItem('hapo_auth_user', JSON.stringify(profileData));
      } catch {}
      return { user: { id: localUser.id, email: localUser.email } };
    }

    if (error) throw error;
    throw new Error('Invalid credentials. Please try again.');
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const getCurrentUser = async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  };

  const isEmailVerified = () => {
    return user?.email_confirmed_at !== null;
  };

  const getUserProfile = async (): Promise<UserProfile | null> => {
    if (!user) return null;
    return fetchProfile(user.id);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    try {
      await supabase
        .from('user_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id);
    } catch {
      // ignore Supabase update errors in offline/demo mode
    }

    const currentProfile = profile || (await fetchProfile(user.id)) || ({} as UserProfile);
    const updated: UserProfile = {
      ...currentProfile,
      ...updates,
      id: user.id,
      email: currentProfile.email || user.email || '',
      first_name: updates.first_name ?? currentProfile.first_name ?? '',
      last_name: updates.last_name ?? currentProfile.last_name ?? '',
      role: updates.role ?? currentProfile.role ?? 'client',
      is_active: updates.is_active ?? currentProfile.is_active ?? true,
    };

    setProfile(updated);

    try {
      localStorage.setItem('hapo_auth_user', JSON.stringify(updated));
    } catch {}

    try {
      await updateUserAsync(user.id, updates as any);
    } catch {}
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    getCurrentUser,
    isEmailVerified,
    getUserProfile,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
