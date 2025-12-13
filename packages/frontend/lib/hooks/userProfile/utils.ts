import type { DateFilterOption } from "./types";

export function getDateFilterTimestamp(filter: DateFilterOption): number | null {
  if (filter === "all") return null;

  const now = new Date();
  switch (filter) {
    case "7d":
      return Math.floor((now.getTime() - 7 * 24 * 60 * 60 * 1000) / 1000);
    case "30d":
      return Math.floor((now.getTime() - 30 * 24 * 60 * 60 * 1000) / 1000);
    case "90d":
      return Math.floor((now.getTime() - 90 * 24 * 60 * 60 * 1000) / 1000);
    case "1y":
      return Math.floor((now.getTime() - 365 * 24 * 60 * 60 * 1000) / 1000);
    default:
      return null;
  }
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks !== 1 ? "s" : ""} ago`;
  if (diffMonths < 12) return `${diffMonths} month${diffMonths !== 1 ? "s" : ""} ago`;

  return date.toLocaleDateString();
}
