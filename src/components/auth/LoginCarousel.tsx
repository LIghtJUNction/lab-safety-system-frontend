import { useEffect, useState } from "react";
import { introSlides } from "../../lib/constants";
import { cn } from "../../lib/cn";
import { Language } from "../../lib/types";

export type CarouselSlide = { stat: string; title: string; body: string };

export function LoginCarousel({
  language,
  isDark = true,
  slidesOverride,
}: {
  language: Language;
  isDark?: boolean;
  slidesOverride?: CarouselSlide[];
}) {
  // Prefer backend override (fetched on login page); fallback to built-in defaults
  const slides: CarouselSlide[] =
    slidesOverride && slidesOverride.length > 0 ? slidesOverride : introSlides[language];
  const [activeIndex, setActiveIndex] = useState(0);

  // Reset index if slides change (e.g. custom edit preview)
  useEffect(() => {
    setActiveIndex(0);
  }, [slides.length, slides[0]?.title]);

  // Auto rotate
  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  function goTo(index: number) {
    setActiveIndex(index);
  }

  const current = slides[activeIndex];

  const textColor = isDark ? 'text-white' : 'text-stone-900';
  const subtleText = isDark ? 'text-white/70' : 'text-stone-600';
  const pillBg = isDark ? 'bg-white/10 text-white/70 ring-white/15' : 'bg-stone-200 text-stone-700 ring-stone-300';
  const dotActive = isDark ? 'bg-white/80' : 'bg-stone-900';
  const dotInactive = isDark ? 'bg-white/30 hover:bg-white/50' : 'bg-stone-300 hover:bg-stone-400';

  return (
    <div className={`relative flex h-full flex-col justify-center ${textColor}`}>
      {/* Single slide with nice fade transition */}
      <div className="transition-opacity duration-700" key={activeIndex}>
        <div className="mb-4">
          <span className={`inline-block rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[1.5px] ring-1 ${pillBg}`}>
            {current.stat}
          </span>
        </div>

        <h2 className={`text-4xl font-semibold leading-[1.05] tracking-tighter lg:text-5xl ${textColor}`}>
          {current.title}
        </h2>

        <p className={`mt-4 max-w-md text-base leading-relaxed ${subtleText}`}>
          {current.body}
        </p>
      </div>

      {/* Subtle dots for manual control and progress */}
      <div className="mt-8 flex items-center gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goTo(index)}
            className={cn(
              "h-1 rounded-full transition-all duration-300",
              index === activeIndex
                ? `w-8 ${dotActive}`
                : `w-1.5 ${dotInactive}`
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
