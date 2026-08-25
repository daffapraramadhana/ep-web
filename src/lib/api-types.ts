/**
 * api-types.ts — kontrak BE untuk app user, disalin verbatim dari source
 * Task 3-6 (JANGAN diketik ulang dari ingatan; field yang hilang di sini
 * berarti belum dibaca dari source-nya). Jangan menaruh field
 * answerKey/acceptedAnswers/explanation-di-luar-AnswerResult di sini — BE
 * sengaja tidak mengirimkannya sebelum soal dijawab.
 *
 * Sumber:
 * - SessionItemView / SessionView: apps/api/src/session/session.types.ts
 * - AnswerResult: apps/api/src/session/answer.service.ts
 * - MeView / PatchMeRequest: apps/api/src/me/me.controller.ts
 * - SummaryView / NextLessonView: apps/api/src/me/summary.service.ts
 * - JourneyView / JourneyTopicView / JourneyLessonView: apps/api/src/journey/journey.service.ts
 * - ProgressView / ProgressSkillView / ProgressWeekDayView: apps/api/src/progress/progress.service.ts
 * - OverviewView (+ HardestItemView/ExhaustedByLevelView/dst): apps/api/src/monitoring/monitoring.service.ts
 */

// ---------------------------------------------------------------------------
// Shared enums
// ---------------------------------------------------------------------------

export type Level = 'DASAR' | 'MENENGAH' | 'MAHIR';
export type SkillTag = 'VOCABULARY' | 'GRAMMAR' | 'LISTENING' | 'READING';

// ---------------------------------------------------------------------------
// GET /session/:id (dan endpoint start sesi) — apps/api/src/session/session.types.ts
// ---------------------------------------------------------------------------

export interface SessionItemView {
  itemId: string;
  source: 'LESSON' | 'REVIEW';
  order: number;
  type: 'PILIHAN_GANDA' | 'ISIAN' | 'SUSUN_KALIMAT';
  prompt: string;
  options: string[] | null;
  mediaUrl: string | null;
  passage: string | null;
  chips: string[] | null; // SUSUN_KALIMAT: kata answerKey sudah di-shuffle di BE
  answeredCorrect: boolean;
}

export interface SessionView {
  id: string;
  kind: 'DAILY' | 'REPLAY';
  status: 'IN_PROGRESS' | 'COMPLETED';
  lessonTitle: string | null;
  items: SessionItemView[];
  progress: { answered: number; total: number };
}

// ---------------------------------------------------------------------------
// POST /session/:id/answer — apps/api/src/session/answer.service.ts
// ---------------------------------------------------------------------------

export interface AnswerResult {
  correct: boolean;
  explanation: string;
  correctAnswer: string | null; // hanya diisi saat salah
  xpAwarded: number;
  sessionCompleted: boolean;
  summary: null | {
    xpSession: number;
    accuracyFirstTry: number; // 0-100
    streak: number;
    streakChanged: boolean;
    milestone: 7 | 30 | 100 | null;
  };
}

// ---------------------------------------------------------------------------
// GET/PATCH /me — apps/api/src/me/me.controller.ts
// ---------------------------------------------------------------------------

export interface MeView {
  id: string;
  name: string;
  email: string;
  level: Level | null;
  dailyTargetSessions: number;
  soundOn: boolean;
  onboarded: boolean;
}

export interface PatchMeRequest {
  level?: Level;
  dailyTargetSessions?: number;
  soundOn?: boolean;
}

// ---------------------------------------------------------------------------
// GET /me/summary — apps/api/src/me/summary.service.ts
// ---------------------------------------------------------------------------

export interface NextLessonView {
  id: string;
  title: string;
  topic: string;
  itemCount: number;
  estMinutes: number;
  xpEstimate: number;
}

export interface SummaryView {
  name: string;
  streak: number;
  xpTotal: number;
  freezeAvailableThisWeek: boolean;
  sessionsCompletedToday: number;
  dailyTarget: number;
  reviewsDue: number;
  contentExhausted: boolean;
  nextLesson: NextLessonView | null;
}

// ---------------------------------------------------------------------------
// GET /journey — apps/api/src/journey/journey.service.ts
// ---------------------------------------------------------------------------

export type JourneyLessonState = 'done' | 'now' | 'locked';

export interface JourneyLessonView {
  id: string;
  title: string;
  order: number;
  state: JourneyLessonState;
  accuracy: number | null; // first-try %, hanya untuk state 'done'
}

export interface JourneyTopicView {
  topic: string;
  lessons: JourneyLessonView[];
}

export interface JourneyView {
  topics: JourneyTopicView[];
}

// ---------------------------------------------------------------------------
// GET /progress — apps/api/src/progress/progress.service.ts
// ---------------------------------------------------------------------------

export type ProgressWeekDayState = 'active' | 'frozen' | 'empty';

export interface ProgressSkillView {
  skill: SkillTag;
  answered: number;
  accuracy: number | null;
}

export interface ProgressWeekDayView {
  date: string; // YYYY-MM-DD
  state: ProgressWeekDayState;
}

export interface ProgressView {
  skills: ProgressSkillView[];
  week: ProgressWeekDayView[];
  totals: { lessonsDone: number; xpTotal: number; longestStreak: number };
}

// ---------------------------------------------------------------------------
// GET /admin/monitoring/overview — apps/api/src/monitoring/monitoring.service.ts
// (OverviewView & tipe pendukungnya, disalin persis)
// ---------------------------------------------------------------------------

export interface OverviewTotals {
  employees: number;
  active: number;
  onTrack: number;
  needsAttention: number;
  notStarted: number;
}

export interface ActivitySeriesPoint {
  date: string;
  sessionsCompleted: number;
}

export interface HardestItemView {
  itemId: string;
  lessonId: string;
  lessonTitle: string;
  prompt: string;
  wrongRate: number;
  answers: number;
}

export interface ExhaustedByLevelView {
  level: Level;
  exhaustedPct: number;
  users: number;
}

export interface OverviewView {
  totals: OverviewTotals;
  activitySeries: ActivitySeriesPoint[];
  contentHealth: {
    hardestItems: HardestItemView[];
    exhaustedByLevel: ExhaustedByLevelView[];
  };
  openReports: number;
}
