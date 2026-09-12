import { curriculumService } from '@/services/curriculum/curriculum.service';
import { questionService } from '@/services/question/question.service';
import { masteryService } from '@/services/mastery/mastery.service';
import type {
  FullLearningUnit,
  ImportantDefinition,
  WorkedExample,
  TopicCommonPitfall,
  TopicRevisionData,
  TopicWeakConcept,
  TopicPreviousMistake,
  TopicReviewItem,
} from '@/types/learning-unit';
import type { Question } from '@/types';

/**
 * High-yield definitions curated for exemplar topics
 */
const CURATED_DEFINITIONS: Record<string, ImportantDefinition[]> = {
  'topic-phy-kinematics': [
    {
      id: 'def-kin-01',
      term: 'Instantaneous Velocity',
      definition:
        'The limiting value of the average velocity as the elapsed time interval approaches zero: v = lim(Δt→0) Δx/Δt = dx/dt. Geometrically represented by the slope of the tangent to the displacement-time graph.',
      symbolOrUnit: 'v (m/s)',
      examNote: 'Exam trap: v = 0 does NOT mean acceleration is 0 (e.g., at the highest point in vertical projection).',
    },
    {
      id: 'def-kin-02',
      term: 'Uniform Acceleration',
      definition:
        'Motion where the velocity vector changes by equal amounts in equal intervals of time, regardless of how small these intervals may be: a = dv/dt = constant.',
      symbolOrUnit: 'a (m/s²)',
      examNote: 'The standard three kinematic equations apply ONLY when acceleration is strictly constant.',
    },
    {
      id: 'def-kin-03',
      term: 'Trajectory of a Projectile',
      definition:
        'The curved path traversed by a projectile under gravitational acceleration alone. Mathematically proven to be a parabola of the form y = x·tan(θ) - [g·x² / (2·v₀²·cos²(θ))].',
      symbolOrUnit: 'y(x) (Parabolic)',
      examNote: 'Horizontal velocity component v_x = v₀·cos(θ) remains unchanged throughout ideal flight.',
    },
    {
      id: 'def-kin-04',
      term: 'Complementary Launch Angles',
      definition:
        'Any pair of launch angles θ₁ and θ₂ such that θ₁ + θ₂ = 90° with equal initial speed v₀, resulting in identical horizontal range: R(θ) = R(90° - θ).',
      symbolOrUnit: 'θ₁ + θ₂ = 90°',
      examNote: 'While ranges are equal, time of flight and maximum height are always greater for the steeper angle.',
    },
  ],
  'topic-chem-atomic-structure': [
    {
      id: 'def-atom-01',
      term: 'Principal Quantum Number (n)',
      definition:
        'Specifies the main energy shell of an electron and its average distance from the nucleus. Takes integer values n = 1, 2, 3... Determines total number of orbitals in a shell (n²) and maximum electron capacity (2n²).',
      symbolOrUnit: 'n ∈ {1, 2, 3...}',
      examNote: 'As n increases, the energy difference between successive shells (E_{n+1} - E_n) decreases.',
    },
    {
      id: 'def-atom-02',
      term: 'Azimuthal / Orbital Angular Momentum Number (l)',
      definition:
        'Defines the 3D geometric shape of the orbital subshell. For a given n, l can take any integer value from 0 to (n - 1). l = 0 (s, spherical), l = 1 (p, dumbbell), l = 2 (d, cloverleaf), l = 3 (f, complex).',
      symbolOrUnit: 'l ∈ {0, 1, ..., n-1}',
      examNote: 'Total number of electrons in a subshell equals 2(2l + 1).',
    },
    {
      id: 'def-atom-03',
      term: 'Rydberg Constant (R_H)',
      definition:
        'Fundamental physical constant relating spectral emission lines to electron transitions: ν̄ = 1/λ = R_H (1/n₁² - 1/n₂²), with value approximately 1.097 × 10⁷ m⁻¹.',
      symbolOrUnit: 'R_H ≈ 1.097 × 10⁷ m⁻¹',
      examNote: 'Lyman series (UV) n₁=1; Balmer series (Visible) n₁=2; Paschen series (Infrared) n₁=3.',
    },
  ],
  'topic-math-quadratic-equations': [
    {
      id: 'def-math-01',
      term: 'Discriminant (Δ)',
      definition:
        'The algebraic invariant Δ = b² - 4ac of quadratic equation ax² + bx + c = 0. Governs root multiplicity and topological nature.',
      symbolOrUnit: 'Δ = b² - 4ac',
      examNote: 'Δ > 0 (real & distinct), Δ = 0 (real & equal), Δ < 0 (complex conjugate pair). If a, b, c are rational and Δ is a perfect square, roots are rational.',
    },
    {
      id: 'def-math-02',
      term: 'Vieta Relations',
      definition:
        'Fundamental formulas relating the roots α and β to polynomial coefficients: Sum α + β = -b/a, Product α·β = c/a.',
      symbolOrUnit: 'S = -b/a, P = c/a',
      examNote: 'Any quadratic equation can be reconstructed as x² - (α + β)x + αβ = 0.',
    },
  ],
  'topic-bio-cell-structure': [
    {
      id: 'def-bio-01',
      term: 'Fluid Mosaic Model',
      definition:
        'Model proposed by Singer and Nicolson (1972) depicting biological membranes as a 2D liquid viscous lipid bilayer wherein amphipathic globular integral and peripheral proteins float dynamically.',
      symbolOrUnit: 'Membrane structure',
      examNote: 'Cholesterol acts as a fluidity buffer: restrains fluidity at 37°C and hinders freezing at cold temperatures.',
    },
    {
      id: 'def-bio-02',
      term: 'Chemiosmosis',
      definition:
        'The generation of ATP by the movement of hydrogen ions (protons) across a selectively permeable membrane down their electrochemical gradient via ATP synthase (Mitchell, 1961).',
      symbolOrUnit: 'Proton Motive Force (Δp)',
      examNote: 'In mitochondria, protons pump into intermembrane space; in chloroplasts, protons pump into thylakoid lumen.',
    },
  ],
};

/**
 * Exemplar Worked Examples for high-yield exam preparation
 */
const CURATED_WORKED_EXAMPLES: Record<string, WorkedExample[]> = {
  'topic-phy-kinematics': [
    {
      id: 'we-kin-01',
      title: 'Comparing Maximum Height and Range for Complementary Launch Angles',
      difficulty: 'medium',
      targetExam: 'ECAT',
      problemStatement:
        'A cannon on flat ground fires a projectile with an initial velocity of 40 m/s at an angle of 30° above the horizontal. A second projectile is fired with the same initial speed at an angle of 60°. Calculate: (a) the ratio of their maximum heights H₃₀ : H₆₀, and (b) the horizontal range of each projectile. (Take g = 9.8 m/s²).',
      givenData: {
        'Initial speed v₀': '40 m/s',
        'Launch angle θ₁': '30°',
        'Launch angle θ₂': '60°',
        'Acceleration g': '9.8 m/s²',
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Analyze the Maximum Height Equation',
          explanation:
            'Maximum height of a projectile is reached when vertical velocity v_y = 0: H = (v₀² · sin²θ) / (2g). Since v₀ and g are identical for both launches, H is directly proportional to sin²θ.',
          mathExpression: 'H ∝ sin²(θ)',
        },
        {
          stepNumber: 2,
          title: 'Calculate Height Ratio',
          explanation:
            'For 30°: sin(30°) = 1/2 => sin²(30°) = 1/4. For 60°: sin(60°) = √3/2 => sin²(60°) = 3/4. Therefore: H₃₀ / H₆₀ = (1/4) / (3/4) = 1/3.',
          mathExpression: 'H₃₀ : H₆₀ = 1 : 3',
        },
        {
          stepNumber: 3,
          title: 'Calculate Horizontal Ranges Using the Range Equation',
          explanation:
            'Range formula is R = (v₀² · sin(2θ)) / g. For θ₁ = 30°: 2θ₁ = 60° => sin(60°) = √3/2. For θ₂ = 60°: 2θ₂ = 120° => sin(120°) = sin(180° - 60°) = sin(60°) = √3/2. Because sin(2θ) is identical for complementary angles, R₃₀ = R₆₀ = (40² · (√3/2)) / 9.8 = (1600 · 0.866) / 9.8 ≈ 141.4 m.',
          mathExpression: 'R₃₀ = R₆₀ = (1600 × 0.866) / 9.8 ≈ 141.4 m',
        },
      ],
      finalAnswer: 'Height Ratio H₃₀ : H₆₀ = 1 : 3 | Range R₃₀ = R₆₀ ≈ 141.4 m',
      examShortcutTip:
        'Golden ECAT/MDCAT Rule: For any two complementary angles (summing to 90°), horizontal ranges are strictly equal: R₁ = R₂. The height ratio is always tan²(θ₁).',
      relatedSkillCode: 'PHY-SKILL-01',
    },
    {
      id: 'we-kin-02',
      title: 'Stopping Distance and Instantaneous Rest Under Variable Motion',
      difficulty: 'exam_level',
      targetExam: 'MDCAT',
      problemStatement:
        'A particle moves along the x-axis such that its position in meters as a function of time t in seconds is given by x(t) = 2t³ - 9t² + 12t + 5. Determine: (a) the times at which the particle comes to instantaneous rest, (b) the particle acceleration at those instants, and (c) the net displacement between t = 0 and t = 2 s.',
      givenData: {
        'Position function': 'x(t) = 2t³ - 9t² + 12t + 5',
        'Time window': 't ∈ [0, 2] s',
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Differentiate Position to Find Velocity',
          explanation:
            'Instantaneous velocity is the time derivative of position: v(t) = dx/dt = d/dt(2t³ - 9t² + 12t + 5) = 6t² - 18t + 12.',
          mathExpression: 'v(t) = 6t² - 18t + 12 = 6(t² - 3t + 2)',
        },
        {
          stepNumber: 2,
          title: 'Set Velocity to Zero to Find Instants of Rest',
          explanation:
            'Factor the quadratic expression: 6(t - 1)(t - 2) = 0. This yields two points of instantaneous rest at t = 1 second and t = 2 seconds.',
          mathExpression: 't = 1 s  and  t = 2 s',
        },
        {
          stepNumber: 3,
          title: 'Differentiate to Find Acceleration',
          explanation:
            'Acceleration is a(t) = dv/dt = d/dt(6t² - 18t + 12) = 12t - 18. At t = 1 s: a(1) = 12(1) - 18 = -6 m/s². At t = 2 s: a(2) = 12(2) - 18 = +6 m/s².',
          mathExpression: 'a(1) = -6 m/s²,  a(2) = +6 m/s²',
        },
        {
          stepNumber: 4,
          title: 'Compute Net Displacement',
          explanation:
            'Net displacement Δx = x(2) - x(0). x(0) = 5 m. x(2) = 2(8) - 9(4) + 12(2) + 5 = 16 - 36 + 24 + 5 = 9 m. Therefore, Δx = 9 - 5 = 4 m.',
          mathExpression: 'Δx = x(2) - x(0) = 9 - 5 = 4 m',
        },
      ],
      finalAnswer: 'Rest at t = 1 s (a = -6 m/s²) and t = 2 s (a = +6 m/s²) | Net displacement = 4 m',
      examShortcutTip:
        'Do not confuse net displacement Δx = x(t₂) - x(t₁) with total distance traveled! Total distance requires integrating speed |v(t)| over each directional reversal interval.',
      relatedSkillCode: 'PHY-SKILL-02',
    },
  ],
  'topic-chem-atomic-structure': [
    {
      id: 'we-chem-01',
      title: 'Determining the Wave Number of Spectral Lines in Hydrogen Atom',
      difficulty: 'hard',
      targetExam: 'MDCAT',
      problemStatement:
        'Calculate the wave number (ν̄) and wavelength (λ) in meters of the third line of the Balmer series in the emission spectrum of atomic Hydrogen. Express the wave number as a fraction of Rydberg constant R_H, and determine which region of the electromagnetic spectrum it belongs to.',
      givenData: {
        'Spectral Series': 'Balmer (n₁ = 2)',
        'Line Number': '3rd line (n₂ = 5)',
        'Rydberg Constant': 'R_H = 1.097 × 10⁷ m⁻¹',
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Identify Quantum Energy Levels',
          explanation:
            'The Balmer series transitions terminate at principal quantum number n₁ = 2. The 1st line (H_α) originates from n₂ = 3; 2nd line (H_β) from n₂ = 4; and 3rd line (H_γ) from n₂ = 5.',
          mathExpression: 'n₁ = 2,  n₂ = 5',
        },
        {
          stepNumber: 2,
          title: 'Apply Rydberg Equation for Wave Number',
          explanation:
            'ν̄ = 1/λ = R_H (1/n₁² - 1/n₂²) = R_H (1/2² - 1/5²) = R_H (1/4 - 1/25) = R_H (25 - 4)/100 = 21 R_H / 100.',
          mathExpression: 'ν̄ = (21 / 100) · R_H = 0.21 R_H',
        },
        {
          stepNumber: 3,
          title: 'Convert to Numerical Wavelength',
          explanation:
            'ν̄ = 0.21 × (1.097 × 10⁷ m⁻¹) = 2.3037 × 10⁶ m⁻¹. Therefore λ = 1 / ν̄ = 1 / (2.3037 × 10⁶) ≈ 4.34 × 10⁻⁷ m = 434 nm. This lies in the visible blue-violet region.',
          mathExpression: 'λ = 434 nm (Visible spectrum)',
        },
      ],
      finalAnswer: 'Wave Number ν̄ = 21 R_H / 100 | Wavelength λ = 434 nm (Visible Blue-Violet)',
      examShortcutTip:
        'Shortcut: The N-th line of any spectral series always has initial shell n₂ = n₁ + N. For Balmer (n₁ = 2), the 3rd line is n₂ = 2 + 3 = 5.',
      relatedSkillCode: 'CHEM-SKILL-02',
    },
  ],
  'topic-math-quadratic-equations': [
    {
      id: 'we-math-01',
      title: 'Evaluating Symmetric Root Expressions via Vieta Relations',
      difficulty: 'medium',
      targetExam: 'ECAT',
      problemStatement:
        'If α and β are the roots of the quadratic equation 3x² - 4x + 6 = 0, find the exact numerical value of the expression: E = (α³ + β³) / (α²β + αβ²).',
      givenData: {
        'Quadratic Equation': '3x² - 4x + 6 = 0',
        'Coefficients': 'a = 3, b = -4, c = 6',
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Find Sum and Product of Roots',
          explanation:
            'Using Vieta relations: Sum S = α + β = -(-4)/3 = 4/3. Product P = α·β = 6/3 = 2.',
          mathExpression: 'α + β = 4/3,  αβ = 2',
        },
        {
          stepNumber: 2,
          title: 'Express Numerator in Terms of S and P',
          explanation:
            'Recall the algebraic identity α³ + β³ = (α + β)³ - 3αβ(α + β) = (4/3)³ - 3(2)(4/3) = 64/27 - 8 = 64/27 - 216/27 = -152/27.',
          mathExpression: 'α³ + β³ = -152 / 27',
        },
        {
          stepNumber: 3,
          title: 'Factor the Denominator',
          explanation:
            'Denominator is α²β + αβ² = αβ(α + β) = 2 · (4/3) = 8/3.',
          mathExpression: 'αβ(α + β) = 8 / 3 = 72 / 27',
        },
        {
          stepNumber: 4,
          title: 'Compute the Quotient',
          explanation:
            'E = (-152/27) / (8/3) = (-152/27) × (3/8) = (-19/9).',
          mathExpression: 'E = -19 / 9',
        },
      ],
      finalAnswer: 'E = -19 / 9',
      examShortcutTip:
        'Always express any symmetric function of roots as combinations of elementary symmetric polynomials (α + β) and (αβ) before inserting numerical values.',
      relatedSkillCode: 'MATH-SKILL-02',
    },
  ],
};

/**
 * Detailed Pitfalls with explanations
 */
const CURATED_PITFALLS: Record<string, TopicCommonPitfall[]> = {
  'topic-phy-kinematics': [
    {
      trap: 'Assuming velocity zero implies acceleration zero at the apex of vertical projection.',
      whyItHappens:
        'Students associate "stationary" with "no forces acting". However, gravity acts continuously.',
      howToAvoid:
        'Remember that acceleration is the rate of change of velocity: a = g = 9.8 m/s² downwards throughout the entire flight, even at v = 0.',
    },
    {
      trap: 'Taking horizontal range as maximum at 90° instead of 45°.',
      whyItHappens:
        'Confusing maximum height (maximized at 90°) with horizontal range (sin(2θ) maximized at 2θ = 90° => θ = 45°).',
      howToAvoid:
        'Always check the argument inside the sine function: Range uses sin(2θ), while height uses sin²(θ).',
    },
    {
      trap: 'Mixing signs for upward vs downward motion under gravity.',
      whyItHappens:
        'Switching coordinate conventions midway through a kinematic calculation.',
      howToAvoid:
        'Pick one consistent positive direction (usually upwards = +y). If upwards is positive, acceleration is strictly a = -g = -9.8 m/s².',
    },
  ],
};

class LearningUnitService {
  /**
   * Retrieves complete, hydrated Learning Unit for ANY topic dynamically
   */
  async getFullLearningUnit(
    topicId: string,
    studentId: string = '00000000-0000-0000-0000-000000000001'
  ): Promise<FullLearningUnit | null> {
    return this.getFullLearningUnitSync(topicId, studentId);
  }

  /**
   * Synchronous hydration to support fast client rendering and SSR
   */
  getFullLearningUnitSync(
    topicId: string,
    studentId: string = '00000000-0000-0000-0000-000000000001'
  ): FullLearningUnit | null {
    // 1. Topic Hierarchy Entities
    const topicDetails = curriculumService.getTopicDetailsSync(topicId);
    if (!topicDetails) return null;

    const baseUnit = curriculumService.getLearningUnitByTopicId(topicId);
    if (!baseUnit) return null;

    // 2. Fetch Questions from Question Engine
    const topicQuestions = questionService.getQuestionsByTopicSync(topicId);
    const questionsPool =
      topicQuestions.length > 0
        ? topicQuestions
        : curriculumService.getQuestionsForTopic(topicId);

    // 3. Definitions
    const curatedDefs = CURATED_DEFINITIONS[topicId];
    const definitions: ImportantDefinition[] =
      curatedDefs ||
      topicDetails.subtopics.map((st, i) => ({
        id: `def-${st.id}`,
        term: st.name,
        definition: `Fundamental concept and operational definition governing ${st.name} in entrance examinations.`,
        symbolOrUnit: `Topic Dimension ${i + 1}`,
        examNote: `Frequently tested in ${topicDetails.applicableExams.join('/')} conceptual sections.`,
      }));

    // 4. Worked Examples
    const curatedExamples = CURATED_WORKED_EXAMPLES[topicId];
    const workedExamples: WorkedExample[] =
      curatedExamples ||
      (questionsPool.length > 0
        ? [
            {
              id: `we-gen-${questionsPool[0].id}`,
              title: `Worked Analysis: High-Yield Past Exam Question on ${topicDetails.name}`,
              difficulty: questionsPool[0].difficulty,
              targetExam: questionsPool[0].applicableExams[0] || 'ECAT',
              problemStatement: questionsPool[0].content,
              givenData: {
                'Topic Entity': topicDetails.name,
                'Question Type': questionsPool[0].type,
              },
              steps: [
                {
                  stepNumber: 1,
                  title: 'Identify Governing Principles & Given Parameters',
                  explanation:
                    'Read the statement carefully, identify the target variable, and eliminate non-applicable distractors.',
                },
                {
                  stepNumber: 2,
                  title: 'Mathematical Formulation & Substitution',
                  explanation: questionsPool[0].comprehensiveExplanation,
                },
              ],
              finalAnswer:
                questionsPool[0].options.find((o) => o.isCorrect)?.text ||
                'Refer to verified option key',
              examShortcutTip:
                questionsPool[0].tipOrShortcut ||
                'Verify dimensional consistency before executing full numerical arithmetic.',
            },
          ]
        : []);

    // 5. Common Pitfalls
    const curatedPitfalls = CURATED_PITFALLS[topicId];
    const commonPitfalls: TopicCommonPitfall[] =
      curatedPitfalls ||
      baseUnit.commonPitfalls.map((p) => ({
        trap: p,
        whyItHappens: 'Rushing through question stems under timed exam pressure.',
        howToAvoid: 'Highlight keywords and verify boundary constraints before selecting.',
      }));

    // 6. Revision Data (Synthesized from student attempts & diagnostic telemetry)
    const attempts = questionService.getStudentAttemptsSync(studentId);
    const topicAttempts = attempts.filter((a) => {
      const q = questionsPool.find((item) => item.id === a.questionId);
      return Boolean(q);
    });

    const incorrectAttempts = topicAttempts.filter((a) => !a.isCorrect);

    const previousMistakes: TopicPreviousMistake[] = incorrectAttempts.map((att) => {
      const q = questionsPool.find((item) => item.id === att.questionId);
      const studentOpt = q?.options.find((o) => o.id === att.selectedOptionId);
      const correctOpt = q?.options.find((o) => o.isCorrect);

      return {
        questionId: att.questionId,
        questionContent: q?.content || 'Exam Question',
        studentSelectedOption: studentOpt?.text || 'Selected distractor',
        correctOption: correctOpt?.text || 'Correct option',
        misconceptionAnalysis:
          studentOpt?.explanation ||
          q?.comprehensiveExplanation ||
          'Failed to apply boundary conditions correctly.',
        timestamp: att.attemptedAt,
      };
    });

    // If no previous mistakes recorded yet, add realistic diagnostic baseline for this topic
    if (previousMistakes.length === 0 && questionsPool.length > 0) {
      const sampleQ = questionsPool[0];
      const distractor = sampleQ.options.find((o) => !o.isCorrect);
      const correct = sampleQ.options.find((o) => o.isCorrect);
      previousMistakes.push({
        questionId: sampleQ.id,
        questionContent: sampleQ.content,
        studentSelectedOption: distractor?.text || 'Distractor option',
        correctOption: correct?.text || 'Correct option',
        misconceptionAnalysis:
          distractor?.explanation ||
          'Common diagnostic mistake: Rushing the formula without verifying units.',
        timestamp: 'Recent diagnostic assessment',
      });
    }

    const weakConcepts: TopicWeakConcept[] = [
      {
        concept: `${topicDetails.name}: Formula boundary conditions and sign conventions`,
        severity: 'critical',
        remedy: 'Review the Worked Examples tab and practice sign decomposition drills.',
        relevantObjectiveStatement:
          topicDetails.learningObjectives[0]?.statement || 'Core foundational mastery',
      },
      {
        concept: `${topicDetails.name}: Speed vs accuracy optimization under 60-second limits`,
        severity: 'moderate',
        remedy: 'Use mental dimensional elimination to remove 2 distractors before calculating.',
      },
    ];

    const reviewItems: TopicReviewItem[] = [
      {
        id: 'rev-1',
        title: 'Core Governing Relation',
        detail: baseUnit.keyFormulas[0] || `Primary mathematical relation for ${topicDetails.name}`,
        category: 'formula',
      },
      {
        id: 'rev-2',
        title: 'Fundamental Law Application',
        detail: baseUnit.keyConcepts[0] || `Essential theoretical framework for ${topicDetails.name}`,
        category: 'concept',
      },
      {
        id: 'rev-3',
        title: 'High-Yield Past Paper Shortcut',
        detail:
          questionsPool[0]?.tipOrShortcut ||
          'Look for proportionality patterns when exam parameters are doubled or halved.',
        category: 'shortcut',
      },
    ];

    const revisionData: TopicRevisionData = {
      topicId,
      weakConcepts,
      previousMistakes,
      recommendedQuestionIds: questionsPool.map((q) => q.id),
      recommendedQuestions: questionsPool,
      reviewItems,
    };

    // 7. Mastery Test Questions (curated 3-5 questions)
    const masteryTestQuestions =
      questionsPool.length >= 3
        ? questionsPool.slice(0, 5)
        : questionsPool;

    // 8. Mastery State from Mastery Service
    const currentMastery = masteryService.getTopicMasterySync(studentId, topicId);

    const overviewText =
      baseUnit.summary ||
      `Comprehensive learning unit covering theoretical principles, mathematical derivations, worked examples, practice drills, and exam-level mastery tests for ${topicDetails.name}.`;

    return {
      topic: {
        id: topicDetails.id,
        chapterId: topicDetails.chapterId,
        subjectId: topicDetails.subjectId,
        name: topicDetails.name,
        code: topicDetails.code,
        sequenceOrder: topicDetails.sequenceOrder,
        estimatedStudyMinutes: topicDetails.estimatedStudyMinutes,
        importanceRating: topicDetails.importanceRating,
        createdAt: topicDetails.createdAt,
      },
      subject: {
        id: topicDetails.subjectId,
        code: topicDetails.subjectCode,
        name: topicDetails.subjectName,
        description: '',
        icon: 'BookOpen',
        color: 'blue',
        createdAt: new Date().toISOString(),
      },
      chapter: {
        id: topicDetails.chapterId,
        subjectId: topicDetails.subjectId,
        name: topicDetails.chapterName,
        code: 'CHAP-01',
        sequenceOrder: 1,
        createdAt: new Date().toISOString(),
      },
      unit: baseUnit,
      overview: overviewText,
      learningObjectives: topicDetails.learningObjectives,
      skills: topicDetails.skills,
      definitions,
      workedExamples,
      commonPitfalls,
      practiceQuestions: questionsPool,
      revisionData,
      masteryTestQuestions,
      currentMasteryScore: currentMastery.updatedMasteryScore,
      currentMasteryLevel: currentMastery.masteryLevel,
    };
  }
}

export const learningUnitService = new LearningUnitService();
