import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { wineryCarouselConfig, navigationConfig } from '../config';
import { smoothScrollTo } from '../hooks/useGsapScrollSmoother';

gsap.registerPlugin(ScrollTrigger);

export function WineryCarousel() {
  if (!wineryCarouselConfig.mainTitle || wineryCarouselConfig.slides.length === 0) return null;

  const slides = wineryCarouselConfig.slides;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);

  // GSAP ScrollTrigger animations
  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          end: 'top 20%',
          toggleActions: 'play none none none',
        },
      });

      // 1. Header fades up
      tl.fromTo(
        headerRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );

      // 2. Carousel slides in from left
      tl.fromTo(
        carouselRef.current,
        { opacity: 0, x: -60 },
        { opacity: 1, x: 0, duration: 1, ease: 'power3.out' },
        '-=0.4'
      );

      // 3. Counter fades up
      tl.fromTo(
        counterRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
        '-=0.3'
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const goToSlide = (index: number, dir: 'next' | 'prev' = 'next') => {
    if (isAnimating) return;
    setIsAnimating(true);
    setDirection(dir);
    setCurrentSlide(index);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const nextSlide = () => {
    goToSlide((currentSlide + 1) % slides.length, 'next');
  };

  const prevSlide = () => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length, 'prev');
  };

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [currentSlide]);

  return (
    <section
      id="winery"
      ref={sectionRef}
      className="section-padding relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(45deg, #d2a855 25%, transparent 25%), linear-gradient(-45deg, #d2a855 25%, transparent 25%)`,
          backgroundSize: '60px 60px',
          backgroundPosition: '0 0, 30px 0'
        }} />
      </div>

      <div className="container-custom relative">
        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-12" style={{ opacity: 0 }}>
          <span className="font-script text-3xl text-gold-400 block mb-2">{wineryCarouselConfig.scriptText}</span>
          <span className="text-gold-500 text-xs uppercase tracking-[0.2em] mb-4 block">
            {wineryCarouselConfig.subtitle}
          </span>
          <h2 className="font-serif text-h1 text-white">
            {wineryCarouselConfig.mainTitle}
          </h2>
        </div>

        {/* Carousel */}
        <div ref={carouselRef} style={{ opacity: 0 }}>
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-0 items-stretch">
            {/* Image Side with Ken Burns */}
            <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[500px] rounded-lg lg:rounded-r-none overflow-hidden">
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-600 ease-out ${
                    index === currentSlide
                      ? 'opacity-100 scale-100 z-10'
                      : index === (currentSlide - 1 + slides.length) % slides.length && direction === 'next'
                        ? 'opacity-0 -translate-x-full z-0'
                        : index === (currentSlide + 1) % slides.length && direction === 'prev'
                          ? 'opacity-0 translate-x-full z-0'
                          : 'opacity-0 z-0'
                  }`}
                >
                  <img
                    src={slide.image}
                    alt={`${slide.title} - ${slide.description}`}
                    loading="lazy"
                    className={`w-full h-full object-cover ${index === currentSlide ? 'kenburns' : ''}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              ))}

              {/* Navigation Arrows */}
              <div className="absolute bottom-6 left-6 flex gap-3 z-20">
                <button
                  onClick={prevSlide}
                  className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-gold-500 hover:border-gold-500 transition-all duration-300"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextSlide}
                  className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-gold-500 hover:border-gold-500 transition-all duration-300"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Slide Indicators */}
              <div className="absolute bottom-6 right-6 flex gap-2 z-20">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index, index > currentSlide ? 'next' : 'prev')}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      index === currentSlide
                        ? 'w-8 bg-gold-500'
                        : 'w-4 bg-white/40 hover:bg-white/60'
                    }`}
                    aria-label={`Go to slide ${index + 1}: ${slides[index].title}`}
                  />
                ))}
              </div>
            </div>

            {/* Content Side */}
            <div className="lg:bg-white/5 lg:border-y lg:border-r lg:border-white/10 lg:rounded-r-lg p-8 lg:p-12 flex flex-col justify-center relative overflow-hidden">
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className={`transition-all duration-500 ${
                    index === currentSlide
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-4 absolute'
                  }`}
                  style={{ display: index === currentSlide ? 'block' : 'none' }}
                >
                  {/* Location Tag */}
                  {wineryCarouselConfig.locationTag && (
                    <div className="flex items-center gap-2 text-gold-500 text-sm mb-4">
                      <MapPin className="w-4 h-4" />
                      <span>{wineryCarouselConfig.locationTag}</span>
                    </div>
                  )}

                  {/* Title */}
                  <h3 className="font-serif text-h3 text-white mb-2">
                    {slide.title}
                  </h3>
                  <p className="text-white/70 text-lg mb-6">
                    {slide.subtitle}
                  </p>

                  {/* Area Stats */}
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="font-serif text-5xl lg:text-6xl text-gold-500">
                      {slide.area}
                    </span>
                    <span className="text-white/70 text-lg">{slide.unit}</span>
                  </div>

                  {/* Description */}
                  <p className="text-white/75 leading-relaxed mb-8">
                    {slide.description}
                  </p>

                  {/* CTA */}
                  {navigationConfig.ctaButtonText && (
                    <button
                      onClick={() => smoothScrollTo('#contact', { duration: 1.4 })}
                      className="btn-dark rounded-sm"
                      aria-label={navigationConfig.ctaButtonText}
                    >
                      {navigationConfig.ctaButtonText}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Slide Counter */}
        <div ref={counterRef} className="mt-8 flex justify-center lg:justify-start" style={{ opacity: 0 }}>
          <div className="flex items-center gap-4 text-sm">
            <span className="font-serif text-2xl text-gold-500">
              {String(currentSlide + 1).padStart(2, '0')}
            </span>
            <div className="w-12 h-px bg-white/30" />
            <span className="text-white/60">
              {String(slides.length).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
