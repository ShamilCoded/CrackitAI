'use client';

import React, { createContext, useContext, useEffect, useState, useTransition, useMemo, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type { StudentProfile } from '@/types';
import type { Database } from '@/types/database';
import { demoService } from '@/services/demo/demo.service';
import { safeStorage } from '@/lib/utils';

interface AuthContextType {
  user: User | null;
  profile: StudentProfile | null;
  isLoading: boolean;
  isDemo: boolean;
  isAdmin: boolean;
  isParent: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithDemo: (role?: 'student' | 'admin' | 'parent') => Promise<void>;
  signInWithDemoAdmin: () => Promise<void>;
  signInWithDemoParent: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_COOKIE_NAME = 'ai_exam_tutor_demo_session';
const DEMO_ROLE_STORAGE_KEY = 'ai_exam_tutor_demo_role';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isDemo, setIsDemo] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const supabase = useMemo(() => createClient(), []);

  // Helper to fetch or auto-create profile for authenticated Supabase user
  const fetchOrCreateProfile = useCallback(
    async (authUser: User): Promise<StudentProfile | null> => {
      try {
        const { data: rawData, error: profileError } = await (supabase
          .from('profiles') as any)
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        const data = rawData as Database['public']['Tables']['profiles']['Row'] | null;

        if (profileError && profileError.code !== 'PGRST116') {
          console.warn('Profile fetch warning:', profileError.message);
        }

        if (data) {
          return {
            id: data.id,
            email: data.email,
            fullName: data.full_name,
            targetExam: data.target_exam as 'ECAT' | 'MDCAT',
            examYear: data.exam_year,
            targetScore: data.target_score ?? undefined,
            baselineScore: data.baseline_score ?? undefined,
            currentScoreEstimate: data.current_score_estimate ?? undefined,
            streakDays: data.streak_days,
            lastActiveAt: data.last_active_at ?? undefined,
            avatarUrl: data.avatar_url ?? undefined,
            isDemo: data.is_demo,
            role: (data.role as 'student' | 'admin' | 'parent') || 'student',
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }

        // If profile does not exist yet (e.g. if DB trigger was pending), auto-create:
        const meta = authUser.user_metadata || {};
        const { data: rawInserted, error: insertError } = await (supabase
          .from('profiles') as any)
          .upsert({
            id: authUser.id,
            email: authUser.email || '',
            full_name: meta.full_name || meta.name || 'Student',
            target_exam: 'ECAT',
            exam_year: 2026,
            streak_days: 1,
            avatar_url: meta.avatar_url || null,
            is_demo: false,
            role: (meta.role as 'student' | 'admin' | 'parent') || 'student',
          })
          .select()
          .single();

        const inserted = rawInserted as Database['public']['Tables']['profiles']['Row'] | null;

        if (insertError || !inserted) {
          if (insertError) {
            console.warn('Profile upsert fallback warning:', insertError.message);
          }
          return {
            id: authUser.id,
            email: authUser.email || '',
            fullName: meta.full_name || meta.name || 'Student',
            targetExam: 'ECAT',
            examYear: 2026,
            streakDays: 1,
            avatarUrl: meta.avatar_url,
            isDemo: false,
            role: (meta.role as 'student' | 'admin' | 'parent') || 'student',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }

        return {
          id: inserted.id,
          email: inserted.email,
          fullName: inserted.full_name,
          targetExam: inserted.target_exam as 'ECAT' | 'MDCAT',
          examYear: inserted.exam_year,
          targetScore: inserted.target_score ?? undefined,
          baselineScore: inserted.baseline_score ?? undefined,
          currentScoreEstimate: inserted.current_score_estimate ?? undefined,
          streakDays: inserted.streak_days,
          lastActiveAt: inserted.last_active_at ?? undefined,
          avatarUrl: inserted.avatar_url ?? undefined,
          isDemo: inserted.is_demo,
          role: (inserted.role as 'student' | 'admin' | 'parent') || 'student',
          createdAt: inserted.created_at,
          updatedAt: inserted.updated_at,
        };
      } catch (err: unknown) {
        console.error('Error in fetchOrCreateProfile:', err);
        return null;
      }
    },
    [supabase]
  );

  // Initial Auth Check on Mount
  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        setIsLoading(true);

        // 1. Check if demo session cookie/storage is present
        const hasDemoStorage =
          typeof window !== 'undefined' &&
          (safeStorage.getItem(DEMO_COOKIE_NAME) === 'active' ||
            document.cookie.includes(`${DEMO_COOKIE_NAME}=active`));

        if (hasDemoStorage) {
          if (isMounted) {
            const demoRole =
              typeof window !== 'undefined'
                ? (safeStorage.getItem(DEMO_ROLE_STORAGE_KEY) as 'student' | 'admin' | 'parent')
                : 'student';
            const demoProfile =
              demoRole === 'admin'
                ? demoService.getDemoAdminProfile()
                : demoRole === 'parent'
                  ? demoService.getDemoParentProfile()
                  : demoService.getDemoProfile();

            setIsDemo(true);
            setProfile(demoProfile);
            setUser({
              id: demoProfile.id,
              email: demoProfile.email,
              app_metadata: { provider: 'demo', role: demoProfile.role },
              user_metadata: { full_name: demoProfile.fullName, role: demoProfile.role },
              aud: 'authenticated',
              created_at: demoProfile.createdAt,
            } as User);
            setIsLoading(false);
          }
          return;
        }

        // 2. Check Supabase real session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.warn('Session verification note:', sessionError.message);
        }

        if (session?.user && isMounted) {
          setUser(session.user);
          setIsDemo(false);
          const userProfile = await fetchOrCreateProfile(session.user);
          if (isMounted) setProfile(userProfile);
        } else if (isMounted) {
          setUser(null);
          setProfile(null);
          setIsDemo(false);
        }
      } catch (err: unknown) {
        console.error('Auth initialization error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initializeAuth();

    // Subscribe to auth state changes from Supabase
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Ignore if currently in demo mode
      if (typeof window !== 'undefined' && safeStorage.getItem(DEMO_COOKIE_NAME) === 'active') {
        return;
      }

      startTransition(async () => {
        if (session?.user) {
          setUser(session.user);
          setIsDemo(false);
          const userProfile = await fetchOrCreateProfile(session.user);
          setProfile(userProfile);
        } else {
          setUser(null);
          setProfile(null);
          setIsDemo(false);
        }
        setIsLoading(false);
      });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchOrCreateProfile, supabase]);

  // Google OAuth Login
  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Clear any prior demo session
      if (typeof window !== 'undefined') {
        safeStorage.removeItem(DEMO_COOKIE_NAME);
        document.cookie = `${DEMO_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !anonKey || supabaseUrl.includes('placeholder')) {
        throw new Error(
          'Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) are not configured. Please add them in your environment to use Google OAuth, or click "Try Demo" for the instant hackathon demo experience.'
        );
      }

      const redirectUrl = `${window.location.origin}/auth/callback`;

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (oauthError) {
        throw oauthError;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google authentication failed';
      console.error('Google Sign In Error:', err);
      setError(msg);
      setIsLoading(false);
    }
  };

  // One-Click "Try Demo" Experience (Supports Student, Admin, and Parent personas)
  const signInWithDemo = async (requestedRole: 'student' | 'admin' | 'parent' = 'student') => {
    try {
      setIsLoading(true);
      setError(null);

      // Set demo session storage and cookie (for server route middleware awareness)
      if (typeof window !== 'undefined') {
        safeStorage.setItem(DEMO_COOKIE_NAME, 'active');
        safeStorage.setItem(DEMO_ROLE_STORAGE_KEY, requestedRole);
        document.cookie = `${DEMO_COOKIE_NAME}=active; Path=/; Max-Age=86400; SameSite=Lax`;
        document.cookie = `${DEMO_ROLE_STORAGE_KEY}=${requestedRole}; Path=/; Max-Age=86400; SameSite=Lax`;
      }

      const demoProfile =
        requestedRole === 'admin'
          ? demoService.getDemoAdminProfile()
          : requestedRole === 'parent'
            ? demoService.getDemoParentProfile()
            : demoService.getDemoProfile();

      setIsDemo(true);
      setProfile(demoProfile);
      setUser({
        id: demoProfile.id,
        email: demoProfile.email,
        app_metadata: { provider: 'demo', role: demoProfile.role },
        user_metadata: { full_name: demoProfile.fullName, role: demoProfile.role },
        aud: 'authenticated',
        created_at: demoProfile.createdAt,
      } as User);

      setIsLoading(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to launch demo';
      setError(msg);
      setIsLoading(false);
    }
  };

  const signInWithDemoAdmin = async () => {
    return signInWithDemo('admin');
  };

  const signInWithDemoParent = async () => {
    return signInWithDemo('parent');
  };

  // Sign Out
  const signOut = async () => {
    try {
      setIsLoading(true);

      // Clear demo session
      if (typeof window !== 'undefined') {
        safeStorage.removeItem(DEMO_COOKIE_NAME);
        safeStorage.removeItem(DEMO_ROLE_STORAGE_KEY);
        document.cookie = `${DEMO_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
        document.cookie = `${DEMO_ROLE_STORAGE_KEY}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
      }

      // Sign out from Supabase
      await supabase.auth.signOut();

      setUser(null);
      setProfile(null);
      setIsDemo(false);
      setError(null);
    } catch (err: unknown) {
      console.error('Sign Out Error:', err);
    } finally {
      setIsLoading(false);
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  const refreshProfile = async () => {
    if (isDemo) {
      const demoRole =
        typeof window !== 'undefined'
          ? (safeStorage.getItem(DEMO_ROLE_STORAGE_KEY) as 'student' | 'admin')
          : 'student';
      setProfile(
        demoRole === 'admin'
          ? demoService.getDemoAdminProfile()
          : demoService.getDemoProfile()
      );
    } else if (user) {
      const p = await fetchOrCreateProfile(user);
      setProfile(p);
    }
  };

  const clearError = () => setError(null);

  const isAdmin = useMemo(() => {
    if (profile?.role === 'admin') return true;
    if (user?.user_metadata?.role === 'admin' || user?.app_metadata?.role === 'admin') {
      return true;
    }
    return false;
  }, [profile, user]);

  const isParent = useMemo(() => {
    if (profile?.role === 'parent' || profile?.role === 'admin') {
      return true;
    }
    const role = user?.user_metadata?.role || user?.app_metadata?.role;
    return role === 'parent' || role === 'admin';
  }, [profile, user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isDemo,
        isAdmin,
        isParent,
        error,
        signInWithGoogle,
        signInWithDemo,
        signInWithDemoAdmin,
        signInWithDemoParent,
        signOut,
        refreshProfile,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
