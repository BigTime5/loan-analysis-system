import { useState, useEffect, useRef } from 'react';
import { Send, CheckCircle, AlertCircle, MapPin, Phone, Mail, Clock } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { contactFormConfig } from '../config';

gsap.registerPlugin(ScrollTrigger);

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  MapPin, Phone, Mail, Clock,
};

export function ContactForm() {
  if (!contactFormConfig.mainTitle) return null;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    visitDate: '',
    visitors: '2',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const contactInfoRef = useRef<HTMLDivElement>(null);
  const formPanelRef = useRef<HTMLDivElement>(null);

  // GSAP ScrollTrigger animations
  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });

      // 1. Header fades up
      tl.fromTo(
        headerRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );

      // 2. Contact info cards cascade from left
      if (contactInfoRef.current) {
        const cards = contactInfoRef.current.querySelectorAll('.contact-card');
        tl.fromTo(
          cards,
          { opacity: 0, x: -40, y: 10 },
          { opacity: 1, x: 0, y: 0, duration: 0.6, stagger: 0.12, ease: 'power3.out' },
          '-=0.3'
        );
      }

      // 3. Form panel slides from right
      tl.fromTo(
        formPanelRef.current,
        { opacity: 0, x: 50 },
        { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out' },
        '-=0.5'
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate success if the user hasn't provided a real Formspree ID yet
      if (contactFormConfig.formEndpoint.includes('YOUR_FORM_ID')) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        setStatus('success');
        setFormData({ name: '', email: '', phone: '', visitDate: '', visitors: '2', message: '' });
      } else {
        const response = await fetch(contactFormConfig.formEndpoint, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            visitDate: formData.visitDate,
            visitors: formData.visitors,
            message: formData.message,
          }),
        });

        if (response.ok) {
          setStatus('success');
          setFormData({ name: '', email: '', phone: '', visitDate: '', visitors: '2', message: '' });
        } else {
          setStatus('error');
        }
      }
    } catch {
      setStatus('error');
    }

    setIsSubmitting(false);
    setTimeout(() => setStatus('idle'), 5000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const form = contactFormConfig.form;

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="section-padding relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #d2a855 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className="container-custom relative">
        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-16" style={{ opacity: 0 }}>
          <span className="font-script text-3xl text-gold-400 block mb-2">{contactFormConfig.scriptText}</span>
          <span className="text-gold-500 text-xs uppercase tracking-[0.2em] mb-4 block">
            {contactFormConfig.subtitle}
          </span>
          <h2 className="font-serif text-h1 text-white mb-4">
            {contactFormConfig.mainTitle}
          </h2>
          {contactFormConfig.introText && (
            <p className="text-white/70 max-w-2xl mx-auto">
              {contactFormConfig.introText}
            </p>
          )}
        </div>

        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-6">
            <div ref={contactInfoRef}>
              {contactFormConfig.contactInfoTitle && (
                <h3 className="font-serif text-h5 text-white mb-6">{contactFormConfig.contactInfoTitle}</h3>
              )}
              <div className="space-y-4" role="list" aria-label="Contact information">
                {contactFormConfig.contactInfo.map((item) => {
                  const IconComponent = iconMap[item.icon];
                  return (
                    <div
                      key={item.label}
                      className="contact-card flex items-start gap-4 p-4 bg-white/5 rounded-lg border border-white/10 hover:border-gold-500/30 transition-colors"
                      role="listitem"
                      style={{ opacity: 0 }}
                    >
                      <div className="w-10 h-10 rounded-full bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                        {IconComponent && <IconComponent className="w-5 h-5 text-gold-500" />}
                      </div>
                      <div>
                        <p className="text-xs text-white/60 uppercase tracking-wider mb-1">{item.label}</p>
                        <p className="text-white font-medium">{item.value}</p>
                        <p className="text-sm text-white/60">{item.subtext}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <div ref={formPanelRef} className="bg-white/5 rounded-lg border border-white/10 p-8" style={{ opacity: 0 }}>
              {status === 'success' ? (
                <div className="text-center py-12" role="alert">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="font-serif text-h5 text-white mb-2">
                    {form.successMessage}
                  </h3>
                </div>
              ) : status === 'error' ? (
                <div className="text-center py-12" role="alert">
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="font-serif text-h5 text-white mb-2">
                    {form.errorMessage}
                  </h3>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div>
                      <label htmlFor="contact-name" className="block text-sm text-white/80 mb-2">
                        {form.nameLabel} <span className="text-gold-500">*</span>
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder={form.namePlaceholder}
                        autoComplete="name"
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-sm text-white placeholder-white/40 focus:outline-none focus:border-gold-500 transition-colors"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label htmlFor="contact-phone" className="block text-sm text-white/80 mb-2">
                        {form.phoneLabel} <span className="text-gold-500">*</span>
                      </label>
                      <input
                        id="contact-phone"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        placeholder={form.phonePlaceholder}
                        autoComplete="tel"
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-sm text-white placeholder-white/40 focus:outline-none focus:border-gold-500 transition-colors"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="contact-email" className="block text-sm text-white/80 mb-2">
                        {form.emailLabel} <span className="text-gold-500">*</span>
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder={form.emailPlaceholder}
                        autoComplete="email"
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-sm text-white placeholder-white/40 focus:outline-none focus:border-gold-500 transition-colors"
                      />
                    </div>

                    {/* Visit Date */}
                    <div>
                      <label htmlFor="contact-date" className="block text-sm text-white/80 mb-2">
                        {form.visitDateLabel} <span className="text-gold-500">*</span>
                      </label>
                      <input
                        id="contact-date"
                        type="date"
                        name="visitDate"
                        value={formData.visitDate}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-sm text-white focus:outline-none focus:border-gold-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Number of Visitors */}
                  {form.visitorsOptions.length > 0 && (
                    <div>
                      <label htmlFor="contact-visitors" className="block text-sm text-white/80 mb-2">
                        {form.visitorsLabel}
                      </label>
                      <select
                        id="contact-visitors"
                        name="visitors"
                        value={formData.visitors}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-sm text-white focus:outline-none focus:border-gold-500 transition-colors"
                      >
                        {form.visitorsOptions.map((option) => (
                          <option key={option} value={option} className="bg-wine-800">{option}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Message */}
                  <div>
                    <label htmlFor="contact-message" className="block text-sm text-white/80 mb-2">
                      {form.messageLabel}
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={4}
                      placeholder={form.messagePlaceholder}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-sm text-white placeholder-white/40 focus:outline-none focus:border-gold-500 transition-colors resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full btn-primary rounded-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {form.submittingText}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        {form.submitText}
                      </>
                    )}
                  </button>

                  {contactFormConfig.privacyNotice && (
                    <p className="text-xs text-white/50 text-center">
                      {contactFormConfig.privacyNotice}
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
