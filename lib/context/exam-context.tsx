'use client';

import React, { createContext, useContext, useCallback, useMemo, useSyncExternalStore } from 'react';
import type { ExamType, ExamAppConfig } from '@/types';
import { getExamConfig } from '@/services/exam/exam-config.service';
import { useAuth } from '@/lib/auth/auth-context';
import { demoService } from '@/services/demo/demo.service';

const EXAM_STORAGE_KEY = 'crackit_selected_exam';

let memoryExam: ExamType = 'ECAT';
const listeners = new Set<() => void>();

function notifyExamListeners() {
  listeners.forEach((listener) => listener());
}

function subscribeToExam(callback: () => void) {
  listeners.add(callback);
  const onStorage = (e: StorageEvent) => {
    if (e.key === EXAM_STORAGE_KEY) {
      callback();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', onStorage);
  };
}

function getExamSnapshot(): ExamType {
  try {
    const stored = localStorage.getItem(EXAM_STORAGE_KEY);
    if (stored === 'ECAT' || stored === 'MDCAT') {
      return stored;
    }
  } catch {
    // Ignore storage read error
  }
  return memoryExam;
}

function getServerSnapshot(): ExamType {
  return 'ECAT';
}

interface ExamContextValue {
  selectedExam: ExamType;
  setSelectedExam: (exam: ExamType) => void;
  toggleExam: () => void;
  examConfig: ExamAppConfig;
  isEcat: boolean;
  isMdcat: boolean;
}

const ExamContext = createContext<ExamContextValue | undefined>(undefined);

export function ExamProvider({ children }: { children: React.ReactNode }) {
  const { profile, isDemo, refreshProfile } = useAuth();

  // Use React's useSyncExternalStore to avoid hydration mismatch and cascading renders
  const selectedExam = useSyncExternalStore(subscribeToExam, getExamSnapshot, getServerSnapshot);

  // Set selected exam function with persistence & service notification
  const setSelectedExam = useCallback(
    (newExam: ExamType) => {
      memoryExam = newExam;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(EXAM_STORAGE_KEY, newExam);
          document.cookie = `${EXAM_STORAGE_KEY}=${newExam}; Path=/; Max-Age=31536000; SameSite=Lax`;
        } catch {
          // Ignore storage write error
        }
      }
      notifyExamListeners();

      // Sync demo service state if in demo mode
      if (isDemo || !profile?.id) {
        demoService.setDemoTargetExam(newExam);
        if (refreshProfile) {
          refreshProfile();
        }
      }
    },
    [isDemo, profile?.id, refreshProfile]
  );

  const toggleExam = useCallback(() => {
    setSelectedExam(selectedExam === 'ECAT' ? 'MDCAT' : 'ECAT');
  }, [selectedExam, setSelectedExam]);

  const examConfig = useMemo(() => getExamConfig(selectedExam), [selectedExam]);
  const isEcat = selectedExam === 'ECAT';
  const isMdcat = selectedExam === 'MDCAT';

  const value = useMemo(
    () => ({
      selectedExam,
      setSelectedExam,
      toggleExam,
      examConfig,
      isEcat,
      isMdcat,
    }),
    [selectedExam, setSelectedExam, toggleExam, examConfig, isEcat, isMdcat]
  );

  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>;
}

export function useExam(): ExamContextValue {
  const context = useContext(ExamContext);
  if (!context) {
    throw new Error('useExam must be used within an ExamProvider');
  }
  return context;
}

