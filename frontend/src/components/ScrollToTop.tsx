import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrollToTopConfig } from '../config';
import { smoothScrollTo } from '../hooks/useGsapScrollSmoother';

gsap.registerPlugin(ScrollTrigger);

export function ScrollToTop() {
  if (!scrollToTopConfig.ariaLabel) return null;

  const [isVisible, setIsVisible] = useState(false);

  // Use ScrollTrigger to toggle visibility based on scroll position
  useEffect(() => {
    const trigger = ScrollTrigger.create({
      start: 'top -600',
      end: 99999,
      onUpdate: (self) => {
        setIsVisible(self.progress > 0);
      },
    });

    return () => trigger.kill();
  }, []);

  // Use Lenis for smooth momentum-consistent scroll to top
  const scrollToTop = () => {
    smoothScrollTo(0, { duration: 1.8 });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label={scrollToTopConfig.ariaLabel}
      className={`fixed bottom-8 right-8 z-40 w-12 h-12 rounded-full bg-gold-500/90 text-white flex items-center justify-center shadow-lg shadow-gold-500/20 backdrop-blur-sm transition-all duration-300 hover:bg-gold-500 hover:scale-110 ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}
