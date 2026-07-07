import { Plus, Trash2 } from "lucide-react";
import type { CarouselSlide, LoginCarouselSettings } from "../../api";
import type { Language } from "../../lib/types";

type LoginCarouselEditorProps = {
  loginCarousel: LoginCarouselSettings | null;
  carouselSaving: boolean;
  language: Language;
  syncLanguages: (from: "zh" | "en", to: "zh" | "en") => void;
  resetToDefault: () => void;
  saveLoginCarousel: (settings: LoginCarouselSettings) => Promise<void>;
  cloneSlide: (slide?: Partial<CarouselSlide>) => CarouselSlide;
  addCarouselSlide: (language: "zh" | "en") => void;
  removeCarouselSlide: (language: "zh" | "en", index: number) => void;
  updateCarouselSlide: (
    language: "zh" | "en",
    index: number,
    patch: Partial<CarouselSlide>,
  ) => void;
};

const panelLanguages = ["zh", "en"] as const;

export function LoginCarouselEditor({
  loginCarousel,
  carouselSaving,
  language,
  syncLanguages,
  resetToDefault,
  saveLoginCarousel,
  cloneSlide,
  addCarouselSlide,
  removeCarouselSlide,
  updateCarouselSlide,
}: LoginCarouselEditorProps) {
  const isEn = language === "en";

  return (
    <section className="mt-6 rounded-2xl border border-stone-200 bg-white/80 p-5 dark:border-stone-700 dark:bg-stone-900/60">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">
            {isEn ? "Login carousel copy" : "登录页轮播文案"}
          </h3>
          <p className="text-xs text-stone-500">
            {isEn
              ? "Saved in backend storage and editable only by system administrators."
              : "保存到后端，仅 system_admin 可修改，登录页实时拉取。"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() => syncLanguages("zh", "en")}
            disabled={carouselSaving || !loginCarousel}
            className="rounded-lg border border-stone-300 px-2 py-1 hover:bg-stone-100 disabled:opacity-50 dark:border-stone-600 dark:hover:bg-stone-800"
          >
            {isEn ? "Copy Chinese to English" : "中文 → 英文"}
          </button>
          <button
            type="button"
            onClick={() => syncLanguages("en", "zh")}
            disabled={carouselSaving || !loginCarousel}
            className="rounded-lg border border-stone-300 px-2 py-1 hover:bg-stone-100 disabled:opacity-50 dark:border-stone-600 dark:hover:bg-stone-800"
          >
            {isEn ? "Copy English to Chinese" : "英文 → 中文"}
          </button>
          <button
            type="button"
            onClick={resetToDefault}
            disabled={carouselSaving}
            className="rounded-lg border border-amber-300 px-2 py-1 text-amber-700 hover:bg-amber-50 disabled:opacity-50 dark:text-amber-400"
          >
            {isEn ? "Reset defaults" : "重置默认"}
          </button>
          <button
            type="button"
            onClick={() => loginCarousel && void saveLoginCarousel(loginCarousel)}
            disabled={carouselSaving || !loginCarousel}
            className="rounded-lg bg-stone-900 px-3 py-1 text-white disabled:opacity-50"
          >
            {carouselSaving ? (isEn ? "Saving..." : "保存中...") : isEn ? "Save" : "保存"}
          </button>
        </div>
      </div>

      {loginCarousel ? (
        <div className="grid gap-6 md:grid-cols-2">
          {panelLanguages.map((slideLanguage) => {
            const slides = loginCarousel[slideLanguage]?.length
              ? loginCarousel[slideLanguage]
              : [cloneSlide()];
            return (
              <div key={slideLanguage} className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-medium uppercase tracking-widest text-stone-500">
                    {slideLanguage === "zh" ? "中文" : "English"}
                  </div>
                  <button
                    type="button"
                    onClick={() => addCarouselSlide(slideLanguage)}
                    disabled={carouselSaving}
                    className="inline-flex items-center gap-1 rounded-lg border border-stone-300 px-2 py-1 text-xs hover:bg-stone-100 disabled:opacity-50 dark:border-stone-600 dark:hover:bg-stone-800"
                    title={isEn ? "Add carousel slide" : "新增轮播页"}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {isEn ? "Add" : "新增"}
                  </button>
                </div>

                {slides.map((slide, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-stone-200 p-3 text-xs dark:border-stone-700"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="text-[10px] text-stone-500">
                        {isEn ? "Slide" : "轮播页"} {index + 1}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCarouselSlide(slideLanguage, index)}
                        disabled={carouselSaving}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 text-stone-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:border-stone-700 dark:hover:bg-red-950/30"
                        title={slides.length > 1 ? (isEn ? "Delete this slide" : "删除此页") : isEn ? "Clear this slide" : "清空此页"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <input
                      className="mb-1 w-full rounded border border-stone-200 bg-white px-2 py-1 dark:bg-stone-950"
                      placeholder={isEn ? "Badge or stat" : "标签或数据"}
                      value={slide.stat}
                      onChange={(event) =>
                        updateCarouselSlide(slideLanguage, index, {
                          stat: event.target.value,
                        })
                      }
                    />
                    <input
                      className="mb-1 w-full rounded border border-stone-200 bg-white px-2 py-1 font-medium dark:bg-stone-950"
                      placeholder={isEn ? "Main title" : "主标题"}
                      value={slide.title}
                      onChange={(event) =>
                        updateCarouselSlide(slideLanguage, index, {
                          title: event.target.value,
                        })
                      }
                    />
                    <textarea
                      className="w-full rounded border border-stone-200 bg-white px-2 py-1 text-xs dark:bg-stone-950"
                      rows={2}
                      placeholder={isEn ? "Subtitle or description" : "副标题或说明"}
                      value={slide.body}
                      onChange={(event) =>
                        updateCarouselSlide(slideLanguage, index, {
                          body: event.target.value,
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-xs text-stone-500">{isEn ? "Loading..." : "加载中..."}</div>
      )}
    </section>
  );
}
