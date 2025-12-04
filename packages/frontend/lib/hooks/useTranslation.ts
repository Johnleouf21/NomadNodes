/**
 * useTranslation Hook
 * Access translations in components
 */

import { useUserStore } from "@/lib/store";
import { getDictionary, type Locale } from "@/lib/i18n";
// type Dictionary is not used

export function useTranslation() {
  const language = useUserStore((state) => state.profile.language);
  const locale = (language || "en") as Locale;
  const dict = getDictionary(locale);

  // Helper function to get nested translations
  const t = (key: string): string => {
    const keys = key.split(".");
    let value: any = dict;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }

    return typeof value === "string" ? value : key;
  };

  return { t, dict, locale };
}
