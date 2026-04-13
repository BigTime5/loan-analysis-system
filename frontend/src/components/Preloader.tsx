import { useEffect, useRef } from 'react';
import { Wine } from 'lucide-react';
import gsap from 'gsap';
import { preloaderConfig } from '../config';

export function Preloader({ onComplete }: { onComplete: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoWrapperRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const subnameRef = useRef<HTMLSpanElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    // If no config, skip preloader
    if (!preloaderConfig.brandName) {
      onComplete();
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          onComplete();
        }
      });

      // 1. Logo fades in and floats up slightly
      tl.fromTo(
        logoWrapperRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );

      // 2. Cursor blinks twice before typing
      tl.fromTo(
        cursorRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, repeat: 3, yoyo: true, ease: 'steps(1)' },
        '-=0.2'
      );

      // 3. Print out "CREDIT" character by character
      const chars = textRef.current?.querySelectorAll('.brand-char');
      if (chars && chars.length > 0) {
        tl.to(chars, {
          opacity: 1,
          duration: 0.04,
          stagger: 0.08,
          ease: 'none'
        });
      }

      // 4. Cursor hides 
      tl.to(cursorRef.current, { opacity: 0, duration: 0.1 });

      // 5. "Engine" script fades in & moves from left slightly
      tl.fromTo(
        subnameRef.current,
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' },
        '-=0.1'
      );

      // 6. Underline expands from center
      tl.fromTo(
        lineRef.current,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.8, ease: 'power3.inOut' },
        '-=0.4'
      );

      // 7. Year stats fade in below
      if (yearRef.current) {
        tl.fromTo(
          yearRef.current,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
          '-=0.3'
        );
      }

      // 8. Hold the finished logo for a moment so the user sees it
      tl.to({}, { duration: 0.6 });

      // 9. Slide the entire preloader UP like a curtain to usher into the app
      tl.to(containerRef.current, {
        yPercent: -100,
        duration: 1.2,
        ease: 'power3.inOut'
      });

    }, containerRef);

    return () => ctx.revert();
  }, [onComplete]);

  // If no brand name configured, we don't render anything 
  // (the hook above will instantly call onComplete)
  if (!preloaderConfig.brandName) return null;

  const brandChars = preloaderConfig.brandName.split('');

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[9999] bg-[#05060f] flex flex-col items-center justify-center`}
    >
      {/* Logo Icon */}
      <div ref={logoWrapperRef} className="mb-6 opacity-0">
        <Wine className="w-12 h-12 text-gold-500" />
      </div>

      {/* Brand Name Typography Area */}
      <div className="flex flex-col items-center">
        <h1 className="font-serif text-3xl md:text-5xl text-white tracking-widest mb-2 flex items-center h-12">
          {/* Typwriter text */}
          <span ref={textRef} className="flex">
            {brandChars.map((char, i) => (
              <span key={i} className="brand-char opacity-0">{char}</span>
            ))}
          </span>

          {/* Cursor */}
          <span
            ref={cursorRef}
            className="inline-block w-[3px] md:w-[4px] h-[28px] md:h-[40px] bg-gold-500 ml-1 opacity-0"
          />

          {/* Subname -> Engine */}
          <span
            ref={subnameRef}
            className="font-script text-3xl md:text-5xl text-gold-400 ml-3 opacity-0 pb-1"
          >
            {preloaderConfig.brandSubname}
          </span>
        </h1>

        {/* Loading Line - expands from center */}
        <div className="mt-8 w-48 h-px bg-white/10 overflow-hidden relative flex justify-center">
          <div
            ref={lineRef}
            className="absolute inset-0 h-full bg-gradient-to-r from-transparent via-gold-500 to-transparent transform origin-center scale-x-0"
          />
        </div>

        {/* Dynamic Data / Year Text */}
        {preloaderConfig.yearText && (
          <p
            ref={yearRef}
            className="mt-6 text-[10px] md:text-xs text-white/40 uppercase tracking-[0.3em] opacity-0"
          >
            {preloaderConfig.yearText}
          </p>
        )}
      </div>
    </div>
  );
}
