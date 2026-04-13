import { useState, useEffect, useRef } from 'react';
import { Menu, X, ChevronDown, Wine, Home, BookOpen, Newspaper, Users, Mail, Grape } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { navigationConfig } from '../config';
import { smoothScrollTo } from '../hooks/useGsapScrollSmoother';

gsap.registerPlugin(ScrollTrigger);

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Home, BookOpen, Newspaper, Users, Mail, Grape, Wine, Menu, X, ChevronDown,
};

export function Navigation() {
  if (!navigationConfig.brandName) return null;

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  // Use ScrollTrigger for navbar background transition
  useEffect(() => {
    const trigger = ScrollTrigger.create({
      start: 'top -100',
      end: 99999,
      onUpdate: (self) => {
        setIsScrolled(self.progress > 0);
      },
    });

    return () => trigger.kill();
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  // Lenis-powered smooth scroll to section
  const scrollToSection = (href: string) => {
    smoothScrollTo(href, { offset: -80, duration: 1.4 });
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  };

  const navLinks = navigationConfig.navLinks;

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-wine-800/95 backdrop-blur-md py-3'
          : 'bg-transparent py-5'
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container-custom flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => scrollToSection('#hero')}
          className="flex items-center gap-3 group"
          aria-label={navigationConfig.brandName}
        >
          <Wine className="w-8 h-8 text-gold-500 transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="font-serif text-xl text-white tracking-wide">{navigationConfig.brandName}</span>
            <span className="text-[10px] text-gold-400 tracking-widest uppercase">{navigationConfig.tagline}</span>
          </div>
        </button>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8" role="menubar">
          {navLinks.map((link) => (
              <div
                key={link.name}
                className="relative"
                onMouseEnter={() => link.dropdown && setActiveDropdown(link.name)}
                onMouseLeave={() => setActiveDropdown(null)}
                role="none"
              >
                <button
                  onClick={() => !link.dropdown && scrollToSection(link.href)}
                  className="flex items-center gap-1 text-sm text-white/80 hover:text-gold-400 transition-colors duration-300 py-2"
                  role="menuitem"
                  aria-haspopup={link.dropdown ? 'true' : undefined}
                  aria-expanded={link.dropdown ? activeDropdown === link.name : undefined}
                >
                  {link.name}
                  {link.dropdown && (
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${
                      activeDropdown === link.name ? 'rotate-180' : ''
                    }`} aria-hidden="true" />
                  )}
                </button>

                {/* Dropdown Menu */}
                {link.dropdown && (
                  <div
                    className={`absolute top-full left-0 pt-2 transition-all duration-300 ${
                      activeDropdown === link.name
                        ? 'opacity-100 visible translate-y-0'
                        : 'opacity-0 invisible -translate-y-2'
                    }`}
                    role="menu"
                  >
                    <div className="bg-wine-800/95 backdrop-blur-md rounded-md overflow-hidden min-w-[180px] border border-white/10">
                      {link.dropdown.map((item) => (
                        <button
                          key={item.name}
                          onClick={() => scrollToSection(item.href)}
                          className="block w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-gold-500/20 hover:text-gold-400 transition-colors"
                          role="menuitem"
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
          ))}
        </div>

        {/* CTA Button */}
        {navigationConfig.ctaButtonText && (
          <a
            href={navigationConfig.ctaTarget || '#/score'}
            className="hidden lg:block btn-primary rounded"
            aria-label={navigationConfig.ctaButtonText}
          >
            {navigationConfig.ctaButtonText}
          </a>
        )}

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden p-2 text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden fixed inset-0 top-[72px] bg-wine-900/98 backdrop-blur-lg transition-all duration-500 ${
          isMobileMenuOpen
            ? 'opacity-100 visible'
            : 'opacity-0 invisible pointer-events-none'
        }`}
        role="menu"
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="container-custom py-8 flex flex-col gap-2">
          {navLinks.map((link, index) => {
            const IconComponent = iconMap[link.icon];
            return (
              <div
                key={link.name}
                className="animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {link.dropdown ? (
                  <div>
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === link.name ? null : link.name)}
                      className="flex items-center justify-between w-full py-4 text-lg text-white border-b border-white/10"
                      aria-expanded={activeDropdown === link.name}
                      role="menuitem"
                    >
                      <span className="flex items-center gap-3">
                        {IconComponent && <IconComponent className="w-5 h-5 text-gold-500" />}
                        {link.name}
                      </span>
                      <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${
                        activeDropdown === link.name ? 'rotate-180' : ''
                      }`} aria-hidden="true" />
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-500 ${
                        activeDropdown === link.name ? 'max-h-40' : 'max-h-0'
                      }`}
                      role="menu"
                    >
                      {link.dropdown.map((item) => (
                        <button
                          key={item.name}
                          onClick={() => scrollToSection(item.href)}
                          className="block w-full text-left pl-12 py-3 text-white/70 hover:text-gold-400"
                          role="menuitem"
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => scrollToSection(link.href)}
                    className="flex items-center gap-3 w-full py-4 text-lg text-white border-b border-white/10 hover:text-gold-400 transition-colors"
                    role="menuitem"
                  >
                    {IconComponent && <IconComponent className="w-5 h-5 text-gold-500" />}
                    {link.name}
                  </button>
                )}
              </div>
            );
          })}

          {navigationConfig.ctaButtonText && (
            <button
              onClick={() => scrollToSection('#contact')}
              className="btn-primary rounded mt-6 text-center"
              role="menuitem"
            >
              {navigationConfig.ctaButtonText}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
