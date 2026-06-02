import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import uz from "./locales/uz.json";
import en from "./locales/en.json";
import ru from "./locales/ru.json";

const rawSaved = (localStorage.getItem("i18nextLng") || "uz").toString();
const savedLanguage = rawSaved.split("-")[0].toLowerCase();

i18n.use(initReactI18next).init({
  resources: {
    uz: { translation: uz },
    en: { translation: en },
    ru: { translation: ru },
  },
  lng: savedLanguage,
  fallbackLng: "uz",
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

// Debug info to help diagnosing missing translations during development
if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.info("i18n initialized:", { language: i18n.language, resources: Object.keys(i18n.options.resources || {}) });
}

export default i18n;