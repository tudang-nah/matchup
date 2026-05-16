import { useCallback, useState } from "react";
import { type Lang, translations } from "../lang";

const LS_KEY = "matchup_lang";

function getInitialLang(): Lang {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved === "en" || saved === "vi") return saved;
    // Auto-detect from browser
    return navigator.language.startsWith("vi") ? "vi" : "en";
  } catch {
    return "vi";
  }
}

export function useLang() {
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(LS_KEY, l); } catch {}
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "vi" ? "en" : "vi");
  }, [lang, setLang]);

  const t = translations[lang];

  return { lang, setLang, toggleLang, t };
}
