import { useEffect, useRef } from 'react';
import { ArrowRight, Calendar, Star, Quote } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { newsConfig } from '../config';

gsap.registerPlugin(ScrollTrigger);

export function News() {
  if (!newsConfig.mainTitle) return null;

  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const testimonialsHeaderRef = useRef<HTMLDivElement>(null);
  const testimonialsGridRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);

  // GSAP ScrollTrigger animations
  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // --- News section timeline ---
      const newsTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });

      // Header fades up
      newsTl.fromTo(
        headerRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );

      // News cards stagger in with subtle rotation
      if (gridRef.current) {
        newsTl.fromTo(
          gridRef.current.children,
          { opacity: 0, y: 50, rotateY: 5 },
          {
            opacity: 1,
            y: 0,
            rotateY: 0,
            duration: 0.7,
            stagger: 0.12,
            ease: 'power3.out',
          },
          '-=0.3'
        );
      }

      // --- Testimonials section timeline ---
      if (testimonialsHeaderRef.current) {
        const testTl = gsap.timeline({
          scrollTrigger: {
            trigger: testimonialsHeaderRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        });

        testTl.fromTo(
          testimonialsHeaderRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }
        );

        if (testimonialsGridRef.current) {
          testTl.fromTo(
            testimonialsGridRef.current.children,
            { opacity: 0, scale: 0.9, y: 30 },
            {
              opacity: 1,
              scale: 1,
              y: 0,
              duration: 0.6,
              stagger: 0.15,
              ease: 'back.out(1.3)',
            },
            '-=0.3'
          );
        }
      }

      // --- Story section timeline ---
      if (storyRef.current) {
        const storyTl = gsap.timeline({
          scrollTrigger: {
            trigger: storyRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        });

        // Story text slides from left
        const storyLeft = storyRef.current.querySelector('.story-left');
        if (storyLeft) {
          storyTl.fromTo(
            storyLeft,
            { opacity: 0, x: -50 },
            { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out' }
          );
        }

        // Story paragraphs reveal progressively
        const storyParagraphs = storyRef.current.querySelectorAll('.story-paragraph');
        if (storyParagraphs.length) {
          storyTl.fromTo(
            storyParagraphs,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' },
            '-=0.4'
          );
        }

        // Story timeline highlights
        const storyHighlights = storyRef.current.querySelectorAll('.story-highlight');
        if (storyHighlights.length) {
          storyTl.fromTo(
            storyHighlights,
            { opacity: 0, y: 20, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out' },
            '-=0.2'
          );
        }

        // Story image slides from right with parallax
        const storyRight = storyRef.current.querySelector('.story-right');
        if (storyRight) {
          storyTl.fromTo(
            storyRight,
            { opacity: 0, x: 60, scale: 0.95 },
            { opacity: 1, x: 0, scale: 1, duration: 1, ease: 'power3.out' },
            '-=0.8'
          );
        }
      }

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="news"
      ref={sectionRef}
      className="section-padding relative overflow-hidden"
    >
      {/* Decorative Elements */}
      <div className="absolute left-0 top-1/4 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl" />
      <div className="absolute right-0 bottom-1/4 w-48 h-48 bg-gold-500/5 rounded-full blur-3xl" />

      <div className="container-custom relative">
        {/* Section Header */}
        <div ref={headerRef} className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12" style={{ opacity: 0 }}>
          <div>
            <span className="font-script text-3xl text-gold-400 block mb-2">{newsConfig.scriptText}</span>
            <span className="text-gold-500 text-xs uppercase tracking-[0.2em] mb-4 block">
              {newsConfig.subtitle}
            </span>
            <h2 className="font-serif text-h1 text-white has-bar">
              {newsConfig.mainTitle}
            </h2>
          </div>
          {newsConfig.viewAllText && (
            <a href="#/model" className="btn-dark rounded-sm flex items-center gap-2 group w-fit" aria-label={newsConfig.viewAllText}>
              {newsConfig.viewAllText}
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          )}
        </div>

        {/* News Grid */}
        {newsConfig.articles.length > 0 && (
          <div ref={gridRef} className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {newsConfig.articles.map((item) => (
              <a
                href="#/model"
                key={item.id}
                className="group cursor-pointer block"
                style={{ opacity: 0 }}
              >
                {/* Image */}
                <div className="relative aspect-[3/2] rounded-lg overflow-hidden mb-5">
                  <img
                    src={item.image}
                    alt={`${item.title} - ${item.category}`}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Category Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-gold-500/90 text-white text-xs rounded-sm">
                      {item.category}
                    </span>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <ArrowRight className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <div className="flex items-center gap-2 text-white/60 text-sm mb-3">
                    <Calendar className="w-4 h-4" />
                    <span>{item.date}</span>
                  </div>

                  <h3 className="font-serif text-h5 text-white mb-3 group-hover:text-gold-400 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-white/70 text-sm leading-relaxed mb-4 line-clamp-3">
                    {item.excerpt}
                  </p>

                  {newsConfig.readMoreText && (
                    <span className="inline-flex items-center gap-2 text-gold-500 text-sm group-hover:gap-3 transition-all duration-300">
                      {newsConfig.readMoreText}
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Testimonials Section */}
        {newsConfig.testimonials.length > 0 && (
          <div className="mt-24">
            <div ref={testimonialsHeaderRef} className="text-center mb-12" style={{ opacity: 0 }}>
              <span className="font-script text-3xl text-gold-400 block mb-2">{newsConfig.testimonialsScriptText}</span>
              <span className="text-gold-500 text-xs uppercase tracking-[0.2em] mb-4 block">
                {newsConfig.testimonialsSubtitle}
              </span>
              <h2 className="font-serif text-h2 text-white">
                {newsConfig.testimonialsMainTitle}
              </h2>
            </div>

            <div ref={testimonialsGridRef} className="grid md:grid-cols-3 gap-8">
              {newsConfig.testimonials.map((t) => (
                <div
                  key={t.name}
                  className="p-8 bg-white/5 rounded-lg border border-white/10 relative"
                  style={{ opacity: 0 }}
                >
                  <Quote className="w-8 h-8 text-gold-500/30 absolute top-6 right-6" />
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-gold-500 fill-gold-500" />
                    ))}
                  </div>
                  <p className="text-white/80 leading-relaxed mb-6 italic">
                    "{t.text}"
                  </p>
                  <div>
                    <p className="text-white font-medium text-sm">{t.name}</p>
                    <p className="text-white/50 text-xs">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Story Section */}
        {newsConfig.storyTitle && (
          <div ref={storyRef} id="story" className="mt-24 pt-20 border-t border-white/10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Content */}
              <div className="story-left" style={{ opacity: 0 }}>
                <span className="font-script text-3xl text-gold-400 block mb-2">{newsConfig.storyScriptText}</span>
                <span className="text-gold-500 text-xs uppercase tracking-[0.2em] mb-4 block">
                  {newsConfig.storySubtitle}
                </span>
                <h2 className="font-serif text-h2 text-white mb-6">
                  {newsConfig.storyTitle}
                </h2>
                <div className="space-y-4 text-white/75 leading-relaxed">
                  {newsConfig.storyParagraphs.map((paragraph, index) => (
                    <p key={index} className="story-paragraph">{paragraph}</p>
                  ))}
                </div>

                {/* Timeline Highlights */}
                {newsConfig.storyTimeline.length > 0 && (
                  <div className="mt-8 grid grid-cols-3 gap-4">
                    {newsConfig.storyTimeline.map((item, index) => (
                      <div key={index} className="story-highlight text-center p-4 bg-white/5 rounded-lg border border-white/10" style={{ opacity: 0 }}>
                        <div className="font-serif text-2xl text-gold-500 mb-1">{item.value}</div>
                        <div className="text-xs text-white/60">{item.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Image */}
              <div className="story-right relative" style={{ opacity: 0 }}>
                <div className="relative aspect-[4/5] rounded-lg overflow-hidden">
                  {newsConfig.storyImage && (
                    <>
                      <img
                        src={newsConfig.storyImage}
                        alt={newsConfig.storyImageCaption}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </>
                  )}
                </div>

                {/* Quote Overlay */}
                {newsConfig.storyQuote.text && (
                  <div className="absolute bottom-6 left-6 right-6 p-6 bg-black/60 backdrop-blur-sm rounded-lg">
                    {newsConfig.storyQuote.prefix && (
                      <p className="font-script text-2xl text-gold-400 mb-1">{newsConfig.storyQuote.prefix}</p>
                    )}
                    <p className="text-white italic text-sm leading-relaxed mb-2">
                      "{newsConfig.storyQuote.text}"
                    </p>
                    {newsConfig.storyQuote.attribution && (
                      <p className="text-gold-400 text-xs">— {newsConfig.storyQuote.attribution}</p>
                    )}
                  </div>
                )}

                {/* Decorative Frame */}
                <div className="absolute -top-4 -right-4 w-full h-full border border-gold-500/20 rounded-lg -z-10" />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
