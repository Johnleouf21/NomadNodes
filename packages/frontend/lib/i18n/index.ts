/**
 * i18n System
 * Simple dictionary-based internationalization
 */

import enDict from "./dictionaries/en.json";
import frDict from "./dictionaries/fr.json";

export type Locale = "en" | "fr";

export type Dictionary = typeof enDict;

const dictionaries: Record<Locale, Dictionary> = {
  en: enDict,
  fr: frDict,
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] || dictionaries.en;
}

export const defaultLocale: Locale = "en";

export const locales: Locale[] = ["en", "fr"];
