/**
 * Lightweight i18n (CR-01 #1): a flat key → string map per locale with {token}
 * interpolation. No hardcoded user-facing text in components — everything
 * resolves through `useT()`. Locale comes from the persisted settings store, so
 * switching language updates the UI live without a reload.
 *
 * Mixed TH/EN is intentional and allowed (CR-01): proper nouns and the brand
 * stay English; Thai glyphs are rendered by Bai Jamjuree via the font stacks.
 */
import en from "./en.json" with { type: "json" };
import th from "./th.json" with { type: "json" };
import { useSettings, type Locale } from "../settings/store.js";

type Dict = Record<string, string>;
const DICTS: Record<Locale, Dict> = { en: en as Dict, th: th as Dict };

export type Vars = Record<string, string | number>;

/** Resolve a key for a locale with {token} interpolation; falls back en → key. */
export function translate(locale: Locale, key: string, vars?: Vars): string {
  const template = DICTS[locale][key] ?? DICTS.en[key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_m, name: string) =>
    name in vars ? String(vars[name]) : `{${name}}`,
  );
}

/** Hook: returns a `t(key, vars)` bound to the current locale (re-renders on switch). */
export function useT() {
  const locale = useSettings((s) => s.locale);
  return (key: string, vars?: Vars) => translate(locale, key, vars);
}

/** Current locale (non-reactive read) for occasional imperative use. */
export function currentLocale(): Locale {
  return useSettings.getState().locale;
}
