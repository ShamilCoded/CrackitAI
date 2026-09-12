import React from 'react';
import { ParentDashboardView } from '@/components/parent/ParentDashboardView';

export const metadata = {
  title: 'Parent Progress Dashboard | CrackIt.ai',
  description:
    'Read-focused Parent Portal tracking syllabus mastery, subject readiness, study consistency, and upcoming priorities.',
};

export default function ParentDashboardPage() {
  return <ParentDashboardView initialExam="ECAT" />;
}
