import { useEffect, useRef } from 'react';
import { History, Award, BookOpen } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { museumConfig } from '../config';
import { smoothScrollTo } from '../hooks/useGsapScrollSmoother';

gsap.registerPlugin(ScrollTrigger);

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  History, Award, BookOpen,
};

export function Museum() {
  if (!museumConfig.mainTitle) return null;

  const sectionRef = useRef<HTMLDivElement>(null);
  const leftContentRef = useRef<(HTMLDivElement | null)[]>([]);
  const rightImagesRef = useRef<(HTMLDivElement | null)[]>([]);
  const progressLineRef = useRef<HTMLDivElement>(null);
  const timelinePointsRef = useRef<(HTMLDivElement | null)[]>([]);

  // GSAP ScrollTrigger Scrub Animation
  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Pinned scrolling timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'center center', // Pin perfectly in the middle
          end: '+=300%', // 3 panels worth of scrolling
          pin: true,
          scrub: 1,
        }
      });

      const numTabs = museumConfig.tabs.length;
      if (numTabs > 1) {
        const stepDuration = 1 / (numTabs - 1);

        museumConfig.tabs.forEach((_, i) => {
          if (i === 0) return;

          const startTime = (i - 1) * stepDuration;
          const crossfadeDuration = stepDuration * 0.5;

          // Texts crossfade
          tl.to(leftContentRef.current[i - 1], { opacity: 0, y: -30, duration: crossfadeDuration }, startTime);
          tl.fromTo(leftContentRef.current[i], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: crossfadeDuration }, startTime + crossfadeDuration);

          // Images crossfade (with slight scale effect for depth)
          tl.to(rightImagesRef.current[i - 1], { opacity: 0, scale: 1.05, duration: crossfadeDuration }, startTime);
          tl.fromTo(rightImagesRef.current[i], { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: crossfadeDuration }, startTime + crossfadeDuration);
        });

        // The golden progress line filling up continuously across the whole scroll duration
        if (progressLineRef.current) {
          tl.fromTo(progressLineRef.current, { scaleX: 0 }, { scaleX: 1, ease: 'none', duration: 1 }, 0);
        }

        // Highlight timeline points as the progress bar reaches them
        museumConfig.timeline.forEach((_, i) => {
          if (i === 0) return; // point 0 is already lit
          const hitTime = (i / (museumConfig.timeline.length - 1)) * 1;
          tl.to(timelinePointsRef.current[i], {
            borderColor: '#e8f532', // gold-500
            boxShadow: '0 0 10px rgba(232,245,50,0.5)',
            duration: 0.1
          }, hitTime);
        });
      }

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="how"
      ref={sectionRef}
      className="relative overflow-hidden min-h-screen flex flex-col justify-center py-20"
      style={{ backgroundColor: '#05060f' }}
    >
      {/* Background Accent */}
      <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-gold-500/5 to-transparent pointer-events-none" />

      <div className="container-custom relative w-full h-full flex flex-col justify-center">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 h-[600px] border border-white/5 rounded-3xl bg-[#0a0a0a]/50 p-8 lg:p-12 shadow-2xl overflow-hidden">
          
          {/* Left Content */}
          <div className="relative flex flex-col justify-between h-full">
            <div>
              {/* Section Header */}
              <div className="museum-header mb-8">
                <span className="font-script text-3xl text-gold-400 block mb-2">{museumConfig.scriptText}</span>
                <span className="text-gold-500 text-xs uppercase tracking-[0.2em] mb-4 block">
                  {museumConfig.subtitle}
                </span>
                <h2 className="font-serif text-h2 text-white">
                  {museumConfig.mainTitle}
                </h2>
              </div>

              {/* Dynamic Text Items container */}
              <div className="relative h-[200px]">
                {museumConfig.tabs.map((tab, i) => {
                  const IconComponent = iconMap[tab.icon];
                  return (
                    <div 
                      key={tab.id}
                      ref={el => { leftContentRef.current[i] = el; }}
                      className="absolute inset-0 pointer-events-none"
                      style={{ opacity: i === 0 ? 1 : 0 }}
                    >
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-gold-500 text-black text-sm font-medium mb-6">
                        {IconComponent && <IconComponent className="w-4 h-4" />}
                        {tab.name}
                      </div>

                      <h3 className="font-serif text-3xl text-white mb-4">
                        {tab.content.title}
                      </h3>
                      <p className="text-white/70 leading-relaxed max-w-md">
                        {tab.content.description}
                      </p>
                      
                      <div className="flex items-center gap-3 mt-6 text-gold-500">
                        <div className="w-8 h-px bg-gold-500" />
                        <span className="text-sm font-medium">
                          {tab.content.highlight}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scroll Scrub Progress Timeline */}
            <div className="mt-8 relative z-10 w-full max-w-md pt-4">
               {/* Timeline labels positioned absolutely to avoid flex squeezing */}
               <div className="absolute top-0 w-full flex justify-between px-1">
                 {museumConfig.timeline.map((event) => (
                   <div key={`lbl-${event.year}`} className="flex flex-col items-center">
                     <span className="font-serif text-sm text-gold-500 mb-1">{event.year}</span>
                     <span className="text-[10px] text-white/50 whitespace-nowrap hidden sm:block max-w-[80px] text-center leading-tight">{event.event}</span>
                   </div>
                 ))}
               </div>

               {/* Track underneath */}
               <div className="absolute top-[32px] sm:top-[44px] left-0 right-0 h-1 bg-white/10 rounded-full" />
               
               {/* Filling Progress line */}
               <div 
                 ref={progressLineRef}
                 className="absolute top-[32px] sm:top-[44px] left-0 right-0 h-1 bg-gradient-to-r from-gold-500/50 to-gold-400 rounded-full origin-left"
               />

               {/* Nodes */}
               <div className="absolute top-[29px] sm:top-[41px] w-full flex justify-between px-[2px]">
                 {museumConfig.timeline.map((_, i) => (
                   <div 
                     key={i} 
                     ref={el => { timelinePointsRef.current[i] = el; }}
                     className="w-2.5 h-2.5 rounded-full bg-[#0a0a0a] border-2 transition-all duration-300"
                     style={{ 
                       borderColor: i === 0 ? '#e8f532' : 'rgba(255,255,255,0.2)',
                       boxShadow: i === 0 ? '0 0 10px rgba(232,245,50,0.5)' : 'none'
                     }} 
                   />
                 ))}
               </div>
            </div>
          </div>

          {/* Right Image Display Area */}
          <div className="relative h-full w-full rounded-2xl overflow-hidden border border-white/10 hidden lg:block">
            {museumConfig.tabs.map((tab, i) => (
              <div
                key={tab.id}
                ref={el => { rightImagesRef.current[i] = el; }}
                className="absolute inset-0"
                style={{ opacity: i === 0 ? 1 : 0 }}
              >
                <img
                  src={tab.image}
                  alt={tab.name}
                  className="w-full h-full object-cover"
                />
                {/* Gradient vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                
                {/* Image overlay text/stats */}
                {i === 2 && museumConfig.yearBadge && (
                  <div className="absolute top-6 right-6 w-24 h-24 rounded-full bg-black/40 backdrop-blur-md border border-gold-500/40 flex items-center justify-center shadow-2xl">
                    <div className="text-center">
                      <div className="font-serif text-2xl text-gold-400">{museumConfig.yearBadge}</div>
                      <div className="text-[10px] text-white/70 uppercase tracking-wider">{museumConfig.yearBadgeLabel}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Persistent Bottom Action Bar overlapping the images */}
            <div className="absolute bottom-6 left-6 right-6 p-6 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-between z-20">
              <div>
                {museumConfig.openingHoursLabel && <p className="text-gold-400 text-xs uppercase tracking-wider mb-1">{museumConfig.openingHoursLabel}</p>}
                {museumConfig.openingHours && <p className="text-white text-base font-medium">{museumConfig.openingHours}</p>}
              </div>
              {museumConfig.ctaButtonText && (
                <button
                  onClick={() => smoothScrollTo('#contact', { duration: 1.4 })}
                  className="btn-primary rounded-sm text-sm px-6 hover:scale-105 transition-transform"
                >
                  {museumConfig.ctaButtonText}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
