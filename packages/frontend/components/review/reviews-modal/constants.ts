/**
 * Constants for Reviews Modal
 */

import type { SortOption } from "./types";

/**
 * Sort options configuration
 */
export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "highest", label: "Highest rated" },
  { value: "lowest", label: "Lowest rated" },
];

/**
 * Ratings for distribution display
 */
export const RATINGS = [5, 4, 3, 2, 1] as const;
