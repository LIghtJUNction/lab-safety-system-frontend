import { useState } from "react";
import { api, type CarouselSlide, type LoginCarouselSettings } from "../api";
import { introSlides } from "../lib/constants";
import type { Language } from "../lib/types";

type NoticeSetter = (message: string) => void;

export function useLoginCarousel(setNotice: NoticeSetter, language: Language) {
  const [loginCarousel, setLoginCarousel] = useState<LoginCarouselSettings | null>(null);
  const [carouselSaving, setCarouselSaving] = useState(false);
  const [showLoginBanner, setShowLoginBanner] = useState(false);

  async function saveLoginCarousel(updated: LoginCarouselSettings) {
    setCarouselSaving(true);
    try {
      const saved = await api.updateLoginCarousel(normalizeLoginCarousel(updated));
      setLoginCarousel(saved);
      setNotice(language === "en" ? "Login carousel settings saved to the backend." : "登录页轮播设置已保存（后端持久化）");
    } catch (err: any) {
      setNotice((language === "en" ? "Save failed: " : "保存失败：") + (err?.message || String(err)));
    } finally {
      setCarouselSaving(false);
    }
  }

  async function resetToDefault() {
    if (!confirm(language === "en" ? "Reset to the default copy? This clears backend custom settings." : "确定要重置为默认文案吗？此操作会清除后端自定义设置。")) return;
    setCarouselSaving(true);
    try {
      await api.resetLoginCarousel();
      const fresh = await api.loginCarousel();
      setLoginCarousel(fresh);
      setNotice(language === "en" ? "Reset to the default copy." : "已重置为默认文案");
    } catch (err: any) {
      setNotice((language === "en" ? "Reset failed: " : "重置失败：") + (err?.message || String(err)));
    } finally {
      setCarouselSaving(false);
    }
  }

  function syncLanguages(from: "zh" | "en", to: "zh" | "en") {
    if (!loginCarousel) return;
    const source = loginCarousel[from] || getDefaultSlides(from);
    const next = { ...loginCarousel, [to]: source.map(cloneSlide) };
    setLoginCarousel(next);
    setNotice(
      language === "en"
        ? `Copied ${from === "zh" ? "Chinese" : "English"} to ${to === "zh" ? "Chinese" : "English"}`
        : `已将 ${from === "zh" ? "中文" : "英文"} 复制到 ${to === "zh" ? "中文" : "英文"}`,
    );
  }

  function cloneSlide(slide?: Partial<CarouselSlide>): CarouselSlide {
    return {
      stat: slide?.stat ?? "",
      title: slide?.title ?? "",
      body: slide?.body ?? "",
    };
  }

  function updateCarouselSlide(lang: "zh" | "en", index: number, patch: Partial<CarouselSlide>) {
    if (!loginCarousel) return;
    const arr = (loginCarousel[lang]?.length ? loginCarousel[lang] : [cloneSlide()]).map(cloneSlide);
    arr[index] = { ...cloneSlide(arr[index]), ...patch };
    setLoginCarousel({ ...loginCarousel, [lang]: arr });
  }

  function addCarouselSlide(lang: "zh" | "en") {
    if (!loginCarousel) return;
    const arr = (loginCarousel[lang]?.length ? loginCarousel[lang] : [cloneSlide()]).map(cloneSlide);
    setLoginCarousel({ ...loginCarousel, [lang]: [...arr, cloneSlide()] });
  }

  function removeCarouselSlide(lang: "zh" | "en", index: number) {
    if (!loginCarousel) return;
    const arr = (loginCarousel[lang]?.length ? loginCarousel[lang] : [cloneSlide()]).map(cloneSlide);
    if (arr.length <= 1) {
      updateCarouselSlide(lang, 0, cloneSlide());
      return;
    }
    setLoginCarousel({ ...loginCarousel, [lang]: arr.filter((_, i) => i !== index) });
  }

  function getDefaultSlides(lang: "zh" | "en"): CarouselSlide[] {
    return (introSlides[lang] || []).map((s) => ({
      stat: s.stat,
      title: s.title,
      body: s.body,
    }));
  }

  function normalizeSlides(lang: "zh" | "en", slides?: CarouselSlide[]): CarouselSlide[] {
    const cleaned = (slides || [])
      .map((slide) => ({
        stat: slide.stat.trim(),
        title: slide.title.trim(),
        body: slide.body.trim(),
      }))
      .filter((slide) => slide.stat || slide.title || slide.body);
    return cleaned.length ? cleaned : getDefaultSlides(lang).slice(0, 1);
  }

  function normalizeLoginCarousel(settings: LoginCarouselSettings): LoginCarouselSettings {
    return {
      zh: normalizeSlides("zh", settings.zh),
      en: normalizeSlides("en", settings.en),
    };
  }

  return {
    loginCarousel,
    setLoginCarousel,
    carouselSaving,
    showLoginBanner,
    setShowLoginBanner,
    saveLoginCarousel,
    resetToDefault,
    syncLanguages,
    cloneSlide,
    updateCarouselSlide,
    addCarouselSlide,
    removeCarouselSlide,
  };
}
