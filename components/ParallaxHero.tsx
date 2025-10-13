"use client";
import { useEffect, useRef } from 'react';

interface ParallaxHeroProps {
  imageUrl?: string | null;
  heightClass?: string; // tailwind height classes
}

export function ParallaxHero({ imageUrl, heightClass = 'h-72 md:h-[420px]' }: ParallaxHeroProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function onScroll() {
      if (!ref.current) return;
      const y = window.scrollY;
      const damp = Math.min(y / 3, 140); // limit translation
      const scale = 1 + Math.min(y / 3000, 0.08);
      ref.current.style.transform = `translateY(${damp * 0.2}px) scale(${scale})`;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div className={`relative -mx-6 overflow-hidden ${heightClass}`}>
      <div ref={ref} className="absolute inset-0 will-change-transform transition-transform duration-75 ease-linear">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="Hero" className="w-full h-full object-cover object-center" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900" />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_35%,rgba(255,45,85,0.30),transparent_65%)] pointer-events-none" />
    </div>
  );
}
