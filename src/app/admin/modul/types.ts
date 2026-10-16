// apps/web/src/app/admin/modul/types.ts
import type { ChapterBlock } from '@/lib/api-types';

export const LEVELS = ['DASAR', 'MENENGAH', 'MAHIR'] as const;
export const CEFRS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export interface AdminModuleRow {
  id: string;
  slug: string;
  title: string;
  level: string;
  cefr: string;
  status: string;
  order: number;
  updatedAt: string;
  chapterCount: number;
  quizChapterCount: number;
  pendingQuizCount: number;
  readingCount: number;
}

export interface AdminLessonSummary {
  id: string;
  code: string;
  title: string;
  status: string;
  liveItemCount: number;
  draftItemCount: number;
}

export interface AdminModuleDetail {
  id: string;
  slug: string;
  title: string;
  summary: string;
  level: string;
  cefr: string;
  coverFile: string | null;
  coverUrl: string | null;
  order: number;
  status: string;
  /** kuis bab ikut Perjalanan & sesi harian */
  showInPath: boolean;
  chapters: { id: string; order: number; title: string; estMinutes: number; lesson: AdminLessonSummary | null }[];
}

export interface AdminChapterDetail {
  id: string;
  order: number;
  title: string;
  estMinutes: number;
  body: string;
  blocks: ChapterBlock[];
  module: { id: string; title: string; slug: string; status: string };
  lesson: AdminLessonSummary | null;
}

export type PreviewResult = { blocks: ChapterBlock[] } | { errors: { line: number; message: string }[] };
