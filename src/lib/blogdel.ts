// Shared client-safe constants and helpers.

export const CATEGORY_ORDER = [
  "technology","health","sports","politics","entertainment",
  "business","science","education","food","history",
] as const;
export type CategorySlug = (typeof CATEGORY_ORDER)[number];

export const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  review: "Review",
  scheduled: "Scheduled",
  published: "Published",
  failed: "Failed",
  archived: "Archived",
};

export const JOB_STATUS_LABELS: Record<string, string> = {
  queued: "Queued",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  retrying: "Retrying",
  cancelled: "Cancelled",
};

export function readingMinutes(wordCount: number): number {
  return Math.max(1, Math.round(wordCount / 220));
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}
