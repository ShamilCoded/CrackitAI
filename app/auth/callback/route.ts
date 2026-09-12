import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  if (error) {
    console.error('OAuth callback error from provider:', error, errorDescription);
    return NextResponse.redirect(
      new URL(`/?auth_error=${encodeURIComponent(errorDescription || error)}`, request.url)
    );
  }

  if (code) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('Error exchanging code for session:', exchangeError.message);
        return NextResponse.redirect(
          new URL(`/?auth_error=${encodeURIComponent(exchangeError.message)}`, request.url)
        );
      }

      if (data?.user) {
        // Auto-create or synchronize the student profile
        const user = data.user;
        const meta = user.user_metadata || {};

        const profileData: Database['public']['Tables']['profiles']['Insert'] = {
          id: user.id,
          email: user.email || '',
          full_name: meta.full_name || meta.name || 'Student',
          target_exam: 'ECAT',
          exam_year: 2026,
          streak_days: 1,
          avatar_url: meta.avatar_url || null,
          is_demo: false,
        };

        const { error: profileError } = await (supabase
          .from('profiles') as any)
          .upsert(profileData);

        if (profileError) {
          console.warn('Profile synchronization warning in callback:', profileError.message);
        }
      }

      return NextResponse.redirect(new URL('/student', request.url));
    } catch (err: unknown) {
      console.error('Unexpected error in /auth/callback:', err);
      return NextResponse.redirect(
        new URL('/?auth_error=Unexpected+authentication+error', request.url)
      );
    }
  }

  // If no code is present, return to landing page
  return NextResponse.redirect(new URL('/', request.url));
}
