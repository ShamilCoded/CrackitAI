/**
 * Test Suite for Centralized Topic Mastery Engine
 * Verifies all requirements:
 * 1. calculateTopicMastery() formula and bounded values [0, 100]
 * 2. updateTopicMastery() mutation and history generation
 * 3. getStudentMastery() filtering and summary aggregation
 * 4. getWeakTopics() and getStrongTopics() detection
 * 5. Diagnostic -> mastery integration
 * 6. Practice -> mastery update integration
 * 7. Repeated attempts -> progressive mastery update
 * 8. Demo student's existing mastery data
 */

import { masteryService } from '../services/mastery/mastery.service';
import { topicMasteryScoringEngine } from '../services/mastery/topic-mastery.scoring';
import { DEMO_STUDENT_ID } from '../database/demo-data';
import type { TopicAttemptEvidence } from '../types/mastery';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ ${message}`);
  }
}

async function runTests() {
  console.log('=== RUNNING TOPIC MASTERY ENGINE TEST SUITE ===\n');

  // Test 1: Formula Calculation and Bounded Range [0, 100]
  console.log('--- Test 1: calculateTopicMastery() Bounds and Logic ---');
  const attemptsEasyAllCorrect: TopicAttemptEvidence[] = [
    { questionId: 'q1', isCorrect: true, difficulty: 'easy', timeSpentSeconds: 40, sourceContext: 'practice', attemptedAt: '2026-09-01T10:00:00Z' },
    { questionId: 'q2', isCorrect: true, difficulty: 'easy', timeSpentSeconds: 45, sourceContext: 'practice', attemptedAt: '2026-09-02T10:00:00Z' },
    { questionId: 'q3', isCorrect: true, difficulty: 'easy', timeSpentSeconds: 50, sourceContext: 'practice', attemptedAt: '2026-09-03T10:00:00Z' },
  ];
  const easyCalc = masteryService.calculateTopicMastery({ attempts: attemptsEasyAllCorrect });
  assert(easyCalc.finalScore >= 0 && easyCalc.finalScore <= 100, `Score bounded between 0 and 100: ${easyCalc.finalScore}`);
  assert(easyCalc.accuracySignal === 100, 'Accuracy signal is 100%');

  const attemptsHardMiss: TopicAttemptEvidence[] = [
    { questionId: 'q4', isCorrect: false, difficulty: 'exam_level', timeSpentSeconds: 120, confidence: 'high', sourceContext: 'practice', attemptedAt: '2026-09-01T10:00:00Z' },
    { questionId: 'q5', isCorrect: false, difficulty: 'hard', timeSpentSeconds: 90, confidence: 'high', sourceContext: 'practice', attemptedAt: '2026-09-02T10:00:00Z' },
  ];
  const hardCalc = masteryService.calculateTopicMastery({ attempts: attemptsHardMiss });
  assert(hardCalc.finalScore >= 0 && hardCalc.finalScore <= 100, `Missed score bounded between 0 and 100: ${hardCalc.finalScore}`);
  assert(hardCalc.finalScore < 30, `Score drops significantly on high-confidence misses: ${hardCalc.finalScore}`);

  // Test 2: Status Classification
  console.log('\n--- Test 2: Status Classification Thresholds ---');
  assert(topicMasteryScoringEngine.determineStatus(90, 5) === 'mastered', 'Score 90 is mastered');
  assert(topicMasteryScoringEngine.determineStatus(75, 5) === 'strong', 'Score 75 is strong');
  assert(topicMasteryScoringEngine.determineStatus(55, 5) === 'developing', 'Score 55 is developing');
  assert(topicMasteryScoringEngine.determineStatus(35, 5) === 'weak', 'Score 35 is weak');
  assert(topicMasteryScoringEngine.determineStatus(0, 0) === 'unassessed', '0 attempts is unassessed');

  // Test 3: Demo Student Baseline Data
  console.log('\n--- Test 3: Demo Student Baseline Mastery ---');
  const demoSummary = masteryService.getStudentMastery(DEMO_STUDENT_ID);
  assert(demoSummary.assessedTopics > 0, `Demo student has assessed topics: ${demoSummary.assessedTopics}`);
  assert(demoSummary.averageMasteryScore > 0, `Demo student average score: ${demoSummary.averageMasteryScore}%`);

  // Test 4: Weak Topic Detection
  console.log('\n--- Test 4: Weak Topic Detection ---');
  const weakTopics = masteryService.getWeakTopics(DEMO_STUDENT_ID);
  assert(weakTopics.length > 0, `Found ${weakTopics.length} weak topics for demo student`);
  assert(weakTopics[0].masteryScore < 50, `Weak topic score is below 50%: ${weakTopics[0].masteryScore}%`);
  console.log(`Detected weak topic: ${weakTopics[0].topicId} (Score: ${weakTopics[0].masteryScore}%, Status: ${weakTopics[0].status})`);

  // Test 5: Strong Topic Detection
  console.log('\n--- Test 5: Strong Topic Detection ---');
  const strongTopics = masteryService.getStrongTopics(DEMO_STUDENT_ID);
  assert(strongTopics.length > 0, `Found ${strongTopics.length} strong topics for demo student`);
  assert(strongTopics[0].masteryScore >= 70, `Strong topic score is >= 70%: ${strongTopics[0].masteryScore}%`);
  console.log(`Detected strong topic: ${strongTopics[0].topicId} (Score: ${strongTopics[0].masteryScore}%, Status: ${strongTopics[0].status})`);

  // Test 6: Practice -> Mastery Update & History
  console.log('\n--- Test 6: Practice -> Mastery Update ---');
  const testStudentId = 'test-student-unit-001';
  const testTopicId = 'topic-phy-centripetal-force';

  const practice1 = masteryService.recordPracticeAttempt({
    studentId: testStudentId,
    topicId: testTopicId,
    isCorrect: true,
    difficulty: 'medium',
    timeSpentSeconds: 50,
    confidence: 'high',
    sourceContext: 'practice',
  });
  assert(practice1.totalAttempted === 1, 'Attempt recorded');
  assert(practice1.correctCount === 1, 'Correct count is 1');
  assert(practice1.streakCount === 1, 'Streak is 1');

  // Test 7: Repeated Practice Attempts -> Progressive Update
  console.log('\n--- Test 7: Repeated Attempts Progressive Update ---');
  const initialScore = practice1.masteryScore;
  const practice2 = masteryService.recordPracticeAttempt({
    studentId: testStudentId,
    topicId: testTopicId,
    isCorrect: true,
    difficulty: 'hard',
    timeSpentSeconds: 65,
    confidence: 'high',
    sourceContext: 'practice',
  });
  assert(practice2.totalAttempted === 2, 'Total attempts is 2');
  assert(practice2.streakCount === 2, 'Streak increased to 2');
  assert(practice2.masteryScore >= initialScore, `Mastery increased on successive correct hard attempt: ${initialScore} -> ${practice2.masteryScore}`);

  // Test 8: Diagnostic -> Mastery Assessment
  console.log('\n--- Test 8: Diagnostic -> Mastery Assessment ---');
  const diagStudent = 'test-diag-student-002';
  const diagTopic = 'topic-math-chain-rule';

  const diagResult = masteryService.recordDiagnosticAssessment({
    studentId: diagStudent,
    topicId: diagTopic,
    subjectId: 'subj-math',
    attemptedCount: 5,
    correctCount: 4,
    accuracy: 80,
  });

  assert(diagResult.totalAttempted === 5, 'Diagnostic attempts recorded: 5');
  assert(diagResult.correctCount === 4, 'Diagnostic correct count: 4');
  assert(diagResult.masteryScore >= 70, `Diagnostic 80% yields strong mastery: ${diagResult.masteryScore}%`);
  assert(Boolean(diagResult.history && diagResult.history.length > 0), 'History entry logged for diagnostic');
  assert(diagResult.history![0].sourceContext === 'diagnostic', 'History source context is diagnostic');

  // Test 9: Auditable History Tracking
  console.log('\n--- Test 9: Auditable History Tracking ---');
  const history = masteryService.getMasteryHistory(testStudentId, testTopicId);
  assert(history.length >= 2, `History contains ${history.length} entries for practice attempts`);
  assert(history[0].delta !== undefined, `Delta recorded in history: ${history[0].delta}%`);

  console.log('\n🎉 ALL CENTRALIZED TOPIC MASTERY ENGINE TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
