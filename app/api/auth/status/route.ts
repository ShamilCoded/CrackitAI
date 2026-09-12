import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const appUrl = process.env.APP_URL || 'https://ais-dev-xlwe54e5kfy7imy4nmaosv-30785908205.asia-east1.run.app';

  const isConfigured = Boolean(
    supabaseUrl &&
      anonKey &&
      !supabaseUrl.includes('placeholder') &&
      !anonKey.includes('placeholder')
  );

  let dbStatus = 'unconfigured';
  let dbError: string | null = null;

  if (isConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase.from('exams').select('id, code').limit(1);
      if (error) {
        dbStatus = 'error';
        dbError = error.message;
      } else {
        dbStatus = 'connected';
      }
    } catch (err: unknown) {
      dbStatus = 'connection_failed';
      dbError = err instanceof Error ? err.message : 'Unknown connection error';
    }
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    supabase: {
      isConfigured,
      urlConfigured: Boolean(supabaseUrl),
      anonKeyConfigured: Boolean(anonKey),
      serviceRoleKeyConfigured: Boolean(serviceRoleKey),
      dbStatus,
      dbError,
    },
    oauth: {
      provider: 'google',
      callbackUrlDevelopment: `${appUrl}/auth/callback`,
      callbackUrlLocal: 'http://localhost:3000/auth/callback',
      instructions: [
        '1. In Google Cloud Console: Enable Google OAuth 2.0 Client ID.',
        '2. In Supabase Dashboard: Go to Authentication -> Providers -> Google, toggle ON, and paste Google Client ID and Secret.',
        '3. Add the redirect URL shown in Supabase (https://<project-ref>.supabase.co/auth/v1/callback) to Authorized redirect URIs in Google Cloud Console.',
      ],
    },
    demo: {
      isAvailable: true,
      demoStudentId: '00000000-0000-4000-a000-000000000001',
      isolation: 'RLS policies & client-scoped memory enforce strict isolation from other students',
    },
  });
}
