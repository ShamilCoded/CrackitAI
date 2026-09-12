import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { AuthProvider } from '@/lib/auth/auth-context';
import { ExamProvider } from '@/lib/context/exam-context';

export const metadata: Metadata = {
  title: 'CrackIt.ai - ECAT & MDCAT',
  description: 'Adaptive AI exam preparation platform for ECAT and MDCAT students with diagnostic assessments, timed mock exams, personalized study plans, AI tutoring, and read-focused Parent Dashboard.',
  openGraph: {
    title: 'CrackIt.ai - ECAT & MDCAT',
    description: 'Adaptive AI exam preparation platform for ECAT and MDCAT students with diagnostic assessments, timed mock exams, personalized study plans, AI tutoring, and read-focused Parent Dashboard.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CrackIt.ai - ECAT & MDCAT',
    description: 'Adaptive AI exam preparation platform for ECAT and MDCAT students with diagnostic assessments, timed mock exams, personalized study plans, AI tutoring, and read-focused Parent Dashboard.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="bg-stone-50 text-stone-900 antialiased font-sans">
        <AuthProvider>
          <ExamProvider>{children}</ExamProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
