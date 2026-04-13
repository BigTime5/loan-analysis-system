import { useEffect, useRef } from 'react';
import { Wine, Sparkles, Thermometer, Clock, ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { wineShowcaseConfig } from '../config';
import { smoothScrollTo } from '../hooks/useGsapScrollSmoother';

gsap.registerPlugin(ScrollTrigger);

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Wine, Sparkles, Thermometer, Clock,
};

export function WineShowcase() {
  if (!wineShowcaseConfig.mainTitle || wineShowcaseConfig.wines.length === 0) return null;

  const sectionRef = useRef<HTMLDivElement>(null);
  const leftItemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const centerItemsRef = useRef<(HTMLImageElement | null)[]>([]);
  const rightListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // 1. Initial fade-in of the right side features
      gsap.fromTo(
        '.wine-feature-item',
        { opacity: 0, x: 30 },
        { opacity: 1, x: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out', scrollTrigger: { trigger: sectionRef.current, start: 'top 60%' } }
      );

      // 2. The Pinned Scrub Timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'center center', // Pin perfectly in center
          end: '+=300%', // Pin for 3 full viewport heights
          pin: true,
          scrub: 1,
        }
      });

      const numItems = wineShowcaseConfig.wines.length;
      if (numItems > 1) {
        const stepDuration = 1 / (numItems - 1); 

        wineShowcaseConfig.wines.forEach((_, i) => {
          if (i === 0) return; // Item 0 is visible initially

          const prevText = leftItemsRef.current[i - 1];
          const nextText = leftItemsRef.current[i];
          const prevBottle = centerItemsRef.current[i - 1];
          const nextBottle = centerItemsRef.current[i];
          
          const startTime = (i - 1) * stepDuration;

          // Crossfade and slide text
          tl.to(prevText, { opacity: 0, y: -40, duration: stepDuration * 0.4 }, startTime);
          tl.fromTo(nextText, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: stepDuration * 0.4 }, startTime + stepDuration * 0.4);

          // Morph/swap bottle images (scale and blur)
          tl.to(prevBottle, { opacity: 0, scale: 0.8, filter: 'blur(10px)', duration: stepDuration * 0.4 }, startTime);
          tl.fromTo(nextBottle, { opacity: 0, scale: 0.8, filter: 'blur(10px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: stepDuration * 0.4 }, startTime + stepDuration * 0.4);
        });
      }

      // Parallax scroll the right features list slowly upward
      if (rightListRef.current) {
        tl.to(rightListRef.current, {
          y: -400, 
          ease: 'none',
          duration: 1 // Runs continuously across the entire timeline
        }, 0);
      }

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const features = wineShowcaseConfig.features;
  const quote = wineShowcaseConfig.quote;

  return (
    <section
      id="wines"
      ref={sectionRef}
      className="relative overflow-hidden min-h-screen flex flex-col justify-center py-20"
      style={{ backgroundColor: '#05060f' }}
    >
      {/* Subtle Texture Overlay */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #d2a855 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="container-custom relative w-full h-full flex flex-col justify-center">
        {/* Section Header */}
        <div className="text-center mb-16 shrink-0">
          <span className="font-script text-3xl text-gold-400 block mb-2">{wineShowcaseConfig.scriptText}</span>
          <span className="text-gold-500 text-xs uppercase tracking-[0.2em] mb-4 block">
            {wineShowcaseConfig.subtitle}
          </span>
          <h2 className="font-serif text-h2 text-white">{wineShowcaseConfig.mainTitle}</h2>
        </div>

        {/* Storyboard Grid */}
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-center relative h-[500px]">
          
          {/* Left: Dynamic Text Stack */}
          <div className="lg:col-span-2 order-2 lg:order-1 relative h-full">
            {wineShowcaseConfig.wines.map((wine, i) => (
              <div 
                key={wine.id}
                ref={el => { leftItemsRef.current[i] = el; }}
                className="absolute inset-0 pointer-events-none flex flex-col justify-center"
                style={{ opacity: i === 0 ? 1 : 0 }}
              >
                <div className="flex items-baseline gap-4 mb-3">
                  <span className="font-serif text-5xl lg:text-6xl text-gold-500/30 leading-none">{wine.year}</span>
                  <div>
                    <h2 className="font-serif text-h3 text-white leading-tight">{wine.name}</h2>
                    <span className="font-script text-xl text-gold-400">{wine.subtitle}</span>
                  </div>
                </div>
                <div className="w-16 h-px bg-gold-500 mt-4 mb-6" />

                <p className="text-white/85 leading-relaxed mb-4 pr-4 text-sm lg:text-base">{wine.description}</p>
                <p className="text-white/65 leading-relaxed text-xs lg:text-sm mb-6 pr-4">{wine.tastingNotes}</p>

                <div className="flex justify-between max-w-[280px]">
                  <div>
                    <div className="font-serif text-xl lg:text-2xl text-gold-500">{wine.alcohol}</div>
                    <div className="text-[10px] text-white/50 uppercase tracking-wider mt-1">Value</div>
                  </div>
                  <div className="w-px bg-white/10" />
                  <div>
                    <div className="font-serif text-xl lg:text-2xl text-gold-500">{wine.temperature}</div>
                    <div className="text-[10px] text-white/50 uppercase tracking-wider mt-1">Metric</div>
                  </div>
                  <div className="w-px bg-white/10" />
                  <div>
                    <div className="font-serif text-xl lg:text-2xl text-gold-500">{wine.aging}</div>
                    <div className="text-[10px] text-white/50 uppercase tracking-wider mt-1">Status</div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Floating Action Button */}
            <div className="absolute bottom-0 left-0 z-20">
              <button
                onClick={() => smoothScrollTo('#contact', { duration: 1.4 })}
                className="btn-primary rounded-sm flex items-center gap-2 group"
                aria-label={wineShowcaseConfig.mainTitle}
              >
                {wineShowcaseConfig.mainTitle}
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Center: Dynamic Image Swap */}
          <div className="lg:col-span-1 order-1 lg:order-2 flex justify-center relative h-full">
            {wineShowcaseConfig.wines.map((wine, i) => (
              <img
                key={wine.id}
                ref={el => { centerItemsRef.current[i] = el; }}
                src={wine.image}
                alt={wine.name}
                className="absolute inset-x-0 top-1/2 -translate-y-1/2 mx-auto w-[220px] max-h-[400px] object-contain z-10 drop-shadow-[0_0_20px_rgba(232,245,50,0.15)] pointer-events-none"
                style={{ opacity: i === 0 ? 1 : 0, filter: wine.filter }}
              />
            ))}
            {/* Deep Glow background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
              <div className="w-48 h-48 bg-gold-500/10 rounded-full blur-3xl" />
            </div>
          </div>

          {/* Right: Parallax Scrolling Features */}
          <div className="lg:col-span-2 order-3 overflow-hidden h-full relative">
            <div 
              ref={rightListRef} 
              className="absolute top-[10%] w-full space-y-6 lg:pr-2 pb-96"
            >
              {features.map((feature) => {
                const IconComponent = iconMap[feature.icon] || Wine;
                return (
                  <div
                    key={feature.title}
                    className="wine-feature-item flex items-start gap-4 group bg-white/5 p-4 rounded-lg border border-white/10 backdrop-blur-sm"
                  >
                    <div className="w-12 h-12 rounded-lg bg-black/30 border border-white/5 flex items-center justify-center flex-shrink-0 group-hover:border-gold-500/40 transition-colors">
                      <IconComponent className="w-5 h-5 text-gold-500" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg text-white mb-1">{feature.title}</h3>
                      <p className="text-sm text-white/65 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                );
              })}

              {quote.text && (
                <div className="wine-feature-item mt-6 p-6 bg-black/30 rounded-lg border-l-2 border-gold-500/50 backdrop-blur-sm">
                  {quote.prefix && <p className="font-script text-2xl text-gold-400 mb-2">{quote.prefix}</p>}
                  <p className="text-white/70 text-sm italic leading-relaxed">"{quote.text}"</p>
                  {quote.attribution && <p className="text-gold-500 text-xs mt-3">— {quote.attribution}</p>}
                </div>
              )}
            </div>

            {/* Gradient masks for smooth fading of the scrolling list */}
            <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-[#05060f] to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#05060f] to-transparent z-10 pointer-events-none" />
          </div>

        </div>
      </div>
    </section>
  );
}
