/**
 * Comparator helpers for table sorting.
 */

type Sortable = {
  created_at?: string | number | Date | null;
  createdAt?: string | number | Date | null;
  id?: string | number;
};

const toTime = (v: unknown): number => {
  if (v == null) return 0;
  const t = +new Date(v as string);
  return Number.isNaN(t) ? 0 : t;
};

const toIdNum = (v: unknown): number => {
  if (v == null) return 0;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
};

/**
 * Sort comparator: most recent first.
 * Uses `created_at` (or `createdAt`) when available, falls back to `id` desc.
 */
export const byCreatedDesc = <T extends Sortable>(a: T, b: T): number => {
  const ta = toTime(a.created_at ?? a.createdAt);
  const tb = toTime(b.created_at ?? b.createdAt);
  if (ta !== tb) return tb - ta;
  return toIdNum(b.id) - toIdNum(a.id);
};

/**
 * Return a new array sorted by most recent first. Safe on null/undefined input.
 */
export const sortByRecent = <T extends Sortable>(items: T[] | null | undefined): T[] => {
  if (!Array.isArray(items)) return [];
  return [...items].sort(byCreatedDesc);
};
