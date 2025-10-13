"use client";
import React, { useEffect, useRef, useState } from 'react';

interface Props {
  imageUrl: string;
  children: React.ReactNode;
  className?: string;
  darkness?: number; // base darkness factor 0-1
  variant?: 'blur' | 'sharp'; // sharp shows original image (if provided) behind content
}

// Lightweight average color sampler to derive a tinted dark layer for readable foreground text.
export function ArtworkBackdrop({ imageUrl, children, className = '', darkness = 0.55, variant = 'blur' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [avg, setAvg] = useState<{ r: number; g: number; b: number; l: number }>();

  useEffect(() => {
    if (!imageUrl) return;
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.loading = 'eager';
    img.src = imageUrl;
    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const w = 40;
        const h = Math.max(1, Math.round((img.height / img.width) * w));
        canvas.width = w; canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a < 180) continue;
          r += data[i]; g += data[i + 1]; b += data[i + 2];
          count++;
        }
        if (!count) return;
        r = Math.round(r / count); g = Math.round(g / count); b = Math.round(b / count);
        const l = 0.2126 * r + 0.7152 * g + 0.0722 * b; // perceived luminance
        setAvg({ r, g, b, l });
      } catch {
        /* ignore */
      }
    };
    return () => { cancelled = true; };
  }, [imageUrl]);

  const isSharp = variant === 'sharp';

  const overlayDark = (() => {
    if (!avg) return darkness;
    if (avg.l > 180) return Math.min(0.8, darkness + 0.2);
    if (avg.l > 130) return Math.min(0.72, darkness + 0.12);
    if (avg.l < 70) return Math.max(0.45, darkness - 0.1);
    return darkness;
  })();

  // Adjust opacities to let more of the underlying image show when sharp
  const tint = avg ? `rgba(${avg.r},${avg.g},${avg.b},${isSharp?0.22:0.35})` : `rgba(70,70,80,${isSharp?0.22:0.35})`;
  const tint2 = avg ? `rgba(${Math.min(255, avg.r + 25)},${Math.min(255, avg.g + 25)},${Math.min(255, avg.b + 25)},${isSharp?0.12:0.18})` : `rgba(120,120,130,${isSharp?0.12:0.18})`;
  const effectiveDark = isSharp ? Math.max(0, (overlayDark - 0.18)) : overlayDark;
  const darkLayer = `rgba(0,0,0,${effectiveDark.toFixed(2)})`;

  return (
    <div ref={ref} className={"relative overflow-hidden rounded-[inherit] " + className}>
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt="Background"
          className={
            'absolute inset-0 w-full h-full object-cover object-center transition-[filter,opacity,transform] duration-700 ' +
            (isSharp
              ? 'scale-105 md:scale-100 brightness-[0.92] contrast-110 opacity-65 blur-[2px]'
              : 'blur-xl scale-110 opacity-40')
          }
        />
      )}
      <div className="absolute inset-0" style={{ background: `linear-gradient(120deg, ${tint}, ${tint2})` }} />
      <div className="absolute inset-0" style={{ background: darkLayer }} />
      <div className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-40" style={{ background: 'radial-gradient(circle at 30% 35%, rgba(255,255,255,0.12), transparent 68%)' }} />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
