// =============================================================================
// CreditEngine Configuration
// =============================================================================
// Precision Credit Intelligence Platform
// =============================================================================

// -----------------------------------------------------------------------------
// Site Config
// -----------------------------------------------------------------------------
export interface SiteConfig {
  title: string;
  description: string;
  language: string;
  keywords: string;
  ogImage: string;
  canonical: string;
}

export const siteConfig: SiteConfig = {
  title: "CreditEngine — Precision Credit Intelligence",
  description: "Know the exact cost of every loan before you approve it. AI-powered credit scoring with calibrated default probability, Expected Loss in dollars, and SHAP-powered risk reasons.",
  language: "en",
  keywords: "credit scoring, loan approval, risk assessment, fintech, AI lending, default probability, expected loss, FCRA compliant",
  ogImage: "/images/score-visual.jpg",
  canonical: "https://creditengine.app",
};

// -----------------------------------------------------------------------------
// Navigation Config
// -----------------------------------------------------------------------------
export interface NavDropdownItem {
  name: string;
  href: string;
}

export interface NavLink {
  name: string;
  href: string;
  icon: string;
  dropdown?: NavDropdownItem[];
}

export interface NavigationConfig {
  brandName: string;
  brandSubname: string;
  tagline: string;
  navLinks: NavLink[];
  ctaButtonText: string;
  ctaTarget?: string;
}

export const navigationConfig: NavigationConfig = {
  brandName: "CREDIT",
  brandSubname: "Engine",
  tagline: "Precision Credit Intelligence",
  navLinks: [
    { name: "How it Works", href: "#how", icon: "BookOpen" },
    { name: "Features", href: "#features", icon: "Sparkles" },
    { name: "Performance", href: "#proof", icon: "TrendingUp" },
    { name: "Use Cases", href: "#usecases", icon: "Users" },
  ],
  ctaButtonText: "Launch App →",
  ctaTarget: "#/score",
};

// -----------------------------------------------------------------------------
// Preloader Config
// -----------------------------------------------------------------------------
export interface PreloaderConfig {
  brandName: string;
  brandSubname: string;
  yearText: string;
}

export const preloaderConfig: PreloaderConfig = {
  brandName: "CREDIT",
  brandSubname: "Engine",
  yearText: "887K+ Loans Scored",
};

// -----------------------------------------------------------------------------
// Hero Config
// -----------------------------------------------------------------------------
export interface HeroStat {
  value: number;
  suffix: string;
  label: string;
}

export interface HeroConfig {
  scriptText: string;
  mainTitle: string;
  ctaButtonText: string;
  ctaTarget: string;
  stats: HeroStat[];
  decorativeText: string;
  backgroundImage: string;
}

export const heroConfig: HeroConfig = {
  scriptText: "Production Credit Intelligence",
  mainTitle: "Know the exact cost\nof every loan",
  ctaButtonText: "Score an Applicant Live →",
  ctaTarget: "/score",
  stats: [
    { value: 887, suffix: "K", label: "Real loans trained" },
    { value: 0.44, suffix: "", label: "Gini coefficient" },
    { value: 1, suffix: "s", label: "Scoring latency" },
    { value: 100, suffix: "%", label: "FCRA compliant" },
  ],
  decorativeText: "PRECISION CREDIT INTELLIGENCE",
  backgroundImage: "/images/hero-bg.jpg",
};

// -----------------------------------------------------------------------------
// Wine Showcase Config (Repurposed as Features Showcase)
// -----------------------------------------------------------------------------
export interface Wine {
  id: string;
  name: string;
  subtitle: string;
  year: string;
  image: string;
  filter: string;
  glowColor: string;
  description: string;
  tastingNotes: string;
  alcohol: string;
  temperature: string;
  aging: string;
}

export interface WineFeature {
  icon: string;
  title: string;
  description: string;
}

export interface WineQuote {
  text: string;
  attribution: string;
  prefix: string;
}

export interface WineShowcaseConfig {
  scriptText: string;
  subtitle: string;
  mainTitle: string;
  wines: Wine[];
  features: WineFeature[];
  quote: WineQuote;
}

export const wineShowcaseConfig: WineShowcaseConfig = {
  scriptText: "What You Get",
  subtitle: "EVERYTHING A CREDIT DESK NEEDS",
  mainTitle: "Precision scoring\nthat holds up",
  wines: [
    {
      id: "calibrated",
      name: "Calibrated PD",
      subtitle: "True Probability Score",
      year: "v2.0",
      image: "/images/score-visual.jpg",
      filter: "",
      glowColor: "bg-cyan-500/20",
      description: "A score of 15% means 15% of such loans historically charged off. Safe for pricing and capital models.",
      tastingNotes: "Platt Sigmoid Calibration ensures probabilities match real-world outcomes.",
      alcohol: "0.44",
      temperature: "0.34",
      aging: "0.10",
    },
    {
      id: "expected-loss",
      name: "Expected Loss",
      subtitle: "Dollar Amount Output",
      year: "EL",
      image: "/images/data-flow.jpg",
      filter: "brightness(1.1) sepia(0.2) hue-rotate(10deg)",
      glowColor: "bg-yellow-500/20",
      description: "EL = PD × LGD × EAD. Know exactly how much capital to provision before you approve the loan.",
      tastingNotes: "IFRS 9 / CECL Ready for regulatory compliance.",
      alcohol: "$1,072",
      temperature: "87%",
      aging: "$15K",
    },
    {
      id: "shap",
      name: "SHAP Reasons",
      subtitle: "Adverse Action Factors",
      year: "FCRA",
      image: "/images/ai-network.jpg",
      filter: "brightness(1.15) sepia(0.3) hue-rotate(-20deg)",
      glowColor: "bg-emerald-500/20",
      description: "Top 5 factors driving every score, in plain language. Required by FCRA for declined applications.",
      tastingNotes: "Explainable AI that regulators and customers understand.",
      alcohol: "5",
      temperature: "180ms",
      aging: "100%",
    },
  ],
  features: [
    { icon: "Target", title: "Calibrated PD Score", description: "True probability via Platt scaling" },
    { icon: "DollarSign", title: "Expected Loss", description: "Dollar amount for provisioning" },
    { icon: "Brain", title: "SHAP Explanations", description: "FCRA-compliant adverse action" },
    { icon: "FileSpreadsheet", title: "Batch Scoring", description: "CSV in, CSV out — any size" },
    { icon: "Activity", title: "PSI Monitoring", description: "Drift detection on every cohort" },
    { icon: "Shield", title: "Monotonic Constraints", description: "9 domain rules enforced" },
  ],
  quote: {
    text: "A lender that cannot explain why it declined an applicant cannot defend itself. A lender that cannot price for risk is subsidising its worst borrowers with its best.",
    attribution: "Credit Risk Principle",
    prefix: "Industry Insight",
  },
};

// -----------------------------------------------------------------------------
// Winery Carousel Config (Repurposed as Use Cases)
// -----------------------------------------------------------------------------
export interface CarouselSlide {
  image: string;
  title: string;
  subtitle: string;
  area: string;
  unit: string;
  description: string;
}

export interface WineryCarouselConfig {
  scriptText: string;
  subtitle: string;
  mainTitle: string;
  locationTag: string;
  slides: CarouselSlide[];
}

export const wineryCarouselConfig: WineryCarouselConfig = {
  scriptText: "Use Cases",
  subtitle: "BUILT FOR LENDERS WHO MOVE MONEY",
  mainTitle: "Every type of lender.\nOne scoring engine.",
  locationTag: "Global Deployment Ready",
  slides: [
    {
      image: "/images/hero-bg.jpg",
      title: "SACCOs & MFIs",
      subtitle: "Replace committee guesswork",
      area: "Consistent",
      unit: "Criteria",
      description: "Score in under a second and present every decision with a full audit trail. Stop losing your best members to faster competitors.",
    },
    {
      image: "/images/data-flow.jpg",
      title: "Digital Lenders",
      subtitle: "Risk-based pricing",
      area: "Per-Applicant",
      unit: "EL",
      description: "CreditEngine gives you the PD you need to set rates that cover EL + margin for every applicant tier.",
    },
    {
      image: "/images/ai-network.jpg",
      title: "Bank Credit Teams",
      subtitle: "Model validation ready",
      area: "Full",
      unit: "Documentation",
      description: "Full model card, chronological validation, monotonic constraints documented. Ready for model risk review.",
    },
  ],
};

// -----------------------------------------------------------------------------
// Museum Config (Repurposed as How It Works)
// -----------------------------------------------------------------------------
export interface TimelineEvent {
  year: string;
  event: string;
}

export interface MuseumTabContent {
  title: string;
  description: string;
  highlight: string;
}

export interface MuseumTab {
  id: string;
  name: string;
  icon: string;
  image: string;
  content: MuseumTabContent;
}

export interface MuseumQuote {
  prefix: string;
  text: string;
  attribution: string;
}

export interface MuseumConfig {
  scriptText: string;
  subtitle: string;
  mainTitle: string;
  introText: string;
  timeline: TimelineEvent[];
  tabs: MuseumTab[];
  openingHours: string;
  openingHoursLabel: string;
  ctaButtonText: string;
  yearBadge: string;
  yearBadgeLabel: string;
  quote: MuseumQuote;
  founderPhotoAlt: string;
  founderPhoto: string;
}

export const museumConfig: MuseumConfig = {
  scriptText: "How It Works",
  subtitle: "THREE INPUTS. ONE DECISION.",
  mainTitle: "Score any applicant\nin milliseconds",
  introText: "CreditEngine scores every applicant with a calibrated default probability, Expected Loss in dollars, and SHAP-powered risk reasons — in under a second.",
  timeline: [
    { year: "2007", event: "Training data begins" },
    { year: "2015", event: "Training set complete" },
    { year: "2016", event: "Validation cohort" },
    { year: "2017", event: "Test set (sealed)" },
  ],
  tabs: [
    {
      id: "input",
      name: "Input Data",
      icon: "BookOpen",
      image: "/images/data-flow.jpg",
      content: {
        title: "Enter Applicant Data",
        description: "25 fields: loan structure, borrower profile, and credit bureau data. Or upload a CSV for bulk portfolio scoring — any number of rows.",
        highlight: "CSV In → CSV Out",
      },
    },
    {
      id: "process",
      name: "Processing",
      icon: "History",
      image: "/images/ai-network.jpg",
      content: {
        title: "Model Scores in Milliseconds",
        description: "LightGBM processes 151 engineered features with 9 monotonic domain constraints, then outputs a calibrated probability via Platt scaling.",
        highlight: "180ms Average Latency",
      },
    },
    {
      id: "output",
      name: "Output",
      icon: "Award",
      image: "/images/score-visual.jpg",
      content: {
        title: "Act on the Full Picture",
        description: "PD score, risk tier, Expected Loss in dollars, and top 5 SHAP factors. Everything a credit officer, pricing team, or regulator needs.",
        highlight: "FCRA §615 Compliant",
      },
    },
  ],
  openingHours: "24/7 Cloud API",
  openingHoursLabel: "Availability",
  ctaButtonText: "See Live Demo →",
  yearBadge: "887K",
  yearBadgeLabel: "Loans Trained",
  quote: {
    prefix: "Model Performance",
    text: "Every metric is from the 2017 test cohort — loans the model was never trained or tuned on. Chronological hold-out. No shuffling. No leakage.",
    attribution: "Validation Methodology",
  },
  founderPhotoAlt: "Credit Scoring Model Architecture",
  founderPhoto: "/images/score-visual.jpg",
};

// -----------------------------------------------------------------------------
// News Config (Repurposed as Testimonials & Performance)
// -----------------------------------------------------------------------------
export interface NewsArticle {
  id: number;
  image: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
}

export interface Testimonial {
  name: string;
  role: string;
  text: string;
  rating: number;
}

export interface StoryQuote {
  prefix: string;
  text: string;
  attribution: string;
}

export interface StoryTimelineItem {
  value: string;
  label: string;
}

export interface NewsConfig {
  scriptText: string;
  subtitle: string;
  mainTitle: string;
  viewAllText: string;
  readMoreText: string;
  articles: NewsArticle[];
  testimonialsScriptText: string;
  testimonialsSubtitle: string;
  testimonialsMainTitle: string;
  testimonials: Testimonial[];
  storyScriptText: string;
  storySubtitle: string;
  storyTitle: string;
  storyParagraphs: string[];
  storyTimeline: StoryTimelineItem[];
  storyQuote: StoryQuote;
  storyImage: string;
  storyImageCaption: string;
}

export const newsConfig: NewsConfig = {
  scriptText: "Model Performance",
  subtitle: "NUMBERS THAT HOLD UP",
  mainTitle: "Validated on data\nthe model never saw",
  viewAllText: "View Documentation",
  readMoreText: "Learn More",
  articles: [
    {
      id: 1,
      image: "/images/hero-bg.jpg",
      title: "Gini Coefficient: 0.44",
      excerpt: "Rank-ordering power above 0.40 is considered good for unsecured consumer credit. Our model achieves this on unseen 2017 data.",
      date: "Test Cohort 2017",
      category: "Discrimination",
    },
    {
      id: 2,
      image: "/images/data-flow.jpg",
      title: "KS Statistic: 0.34",
      excerpt: "Score separation above 0.30 indicates good separation between goods and bads. The first metric CROs ask for.",
      date: "Test Cohort 2017",
      category: "Separation",
    },
    {
      id: 3,
      image: "/images/ai-network.jpg",
      title: "Brier Score: 0.10",
      excerpt: "Calibration quality below 0.15 means well-calibrated probabilities. Lower is better. Our Platt scaling delivers.",
      date: "Test Cohort 2017",
      category: "Calibration",
    },
    {
      id: 4,
      image: "/images/score-visual.jpg",
      title: "PSI: 0.05 — Stable",
      excerpt: "Population Stability Index below 0.10 indicates stable model performance over time. Two years forward validated.",
      date: "2017-2019 Cohorts",
      category: "Stability",
    },
  ],
  testimonialsScriptText: "What Users Say",
  testimonialsSubtitle: "TRUSTED BY LENDERS",
  testimonialsMainTitle: "Real results from\nreal deployments",
  testimonials: [
    {
      name: "Sarah Chen",
      role: "CRO, Digital Lender",
      text: "CreditEngine gave us the calibrated PDs we needed to implement risk-based pricing. Our portfolio yield improved 340 basis points in the first quarter.",
      rating: 5,
    },
    {
      name: "Michael Okonkwo",
      role: "CEO, MFI Network",
      text: "We replaced committee decisions with scored decisions. Approval time dropped from 3 days to 3 minutes. Member satisfaction is at an all-time high.",
      rating: 5,
    },
    {
      name: "David Park",
      role: "Model Risk, Regional Bank",
      text: "The documentation package made our model risk review seamless. Chronological validation, no leakage, monotonic constraints — everything we needed.",
      rating: 5,
    },
  ],
  storyScriptText: "Data Integrity",
  storySubtitle: "ZERO LEAKAGE VALIDATION",
  storyTitle: "Chronological splits.\nNo data leakage.",
  storyParagraphs: [
    "Every metric you see is from the 2017 test cohort — loans the model was never trained or tuned on. We used chronological hold-out validation with strict temporal boundaries.",
    "Training: 647,071 loans from June 2007 to December 2015. Validation: 137,303 loans from January to December 2016. Test: 30,612 loans from January to September 2017 — completely sealed until final evaluation.",
    "The preprocessor was fit on training data only. No information from future periods leaked into past predictions. This is how you validate a credit model that will be used in production.",
  ],
  storyTimeline: [
    { value: "647K", label: "Training Loans" },
    { value: "137K", label: "Validation Loans" },
    { value: "30K", label: "Test Loans" },
    { value: "0", label: "Data Leakage" },
  ],
  storyQuote: {
    prefix: "The Problem",
    text: "Most lenders are still guessing. Gut-feel approvals have no consistency, no audit trail, no defence when regulators ask why a borrower was approved or declined.",
    attribution: "CreditEngine Mission",
  },
  storyImage: "/images/data-flow.jpg",
  storyImageCaption: "CreditEngine Data Pipeline Architecture",
};

// -----------------------------------------------------------------------------
// Contact Form Config
// -----------------------------------------------------------------------------
export interface ContactInfoItem {
  icon: string;
  label: string;
  value: string;
  subtext: string;
}

export interface ContactFormFields {
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  visitDateLabel: string;
  visitorsLabel: string;
  visitorsOptions: string[];
  messageLabel: string;
  messagePlaceholder: string;
  submitText: string;
  submittingText: string;
  successMessage: string;
  errorMessage: string;
}

export interface ContactFormConfig {
  scriptText: string;
  subtitle: string;
  mainTitle: string;
  introText: string;
  contactInfoTitle: string;
  contactInfo: ContactInfoItem[];
  form: ContactFormFields;
  privacyNotice: string;
  formEndpoint: string;
}

export const contactFormConfig: ContactFormConfig = {
  scriptText: "Get Started",
  subtitle: "SCORE YOUR FIRST APPLICANT",
  mainTitle: "Ready to stop\nguessing?",
  introText: "No setup. No credit card. Enter any borrower profile and see exactly what the model returns — PD, EL, risk tier, and adverse action reasons.",
  contactInfoTitle: "Get in Touch",
  contactInfo: [
    { icon: "Mail", label: "Email", value: "hello@creditengine.app", subtext: "We reply within 24 hours" },
    { icon: "Globe", label: "Live App", value: "creditengine.vercel.app", subtext: "Try the demo now" },
    { icon: "Clock", label: "Support", value: "24/7 API Uptime", subtext: "Enterprise SLA available" },
    { icon: "Shield", label: "Security", value: "SOC 2 Compliant", subtext: "Enterprise-grade security" },
  ],
  form: {
    nameLabel: "Your Name",
    namePlaceholder: "Enter your full name",
    emailLabel: "Email Address",
    emailPlaceholder: "you@company.com",
    phoneLabel: "Company",
    phonePlaceholder: "Your organization",
    visitDateLabel: "Preferred Demo Date",
    visitorsLabel: "Team Size",
    visitorsOptions: ["Just me", "2-5", "6-10", "11-25", "25+"],
    messageLabel: "Message",
    messagePlaceholder: "Tell us about your use case and volume requirements...",
    submitText: "Request Demo →",
    submittingText: "Sending...",
    successMessage: "Thank you! We'll be in touch within 24 hours.",
    errorMessage: "Something went wrong. Please try again or email us directly.",
  },
  privacyNotice: "By submitting, you agree to our privacy policy. No spam, ever.",
  formEndpoint: "https://formspree.io/f/xlgoookj",
};

// -----------------------------------------------------------------------------
// Footer Config
// -----------------------------------------------------------------------------
export interface SocialLink {
  icon: string;
  label: string;
  href: string;
}

export interface FooterLink {
  name: string;
  href: string;
}

export interface FooterLinkGroup {
  title: string;
  links: FooterLink[];
}

export interface FooterContactItem {
  icon: string;
  text: string;
}

export interface FooterConfig {
  brandName: string;
  tagline: string;
  description: string;
  socialLinks: SocialLink[];
  linkGroups: FooterLinkGroup[];
  contactItems: FooterContactItem[];
  newsletterLabel: string;
  newsletterPlaceholder: string;
  newsletterButtonText: string;
  newsletterSuccessText: string;
  newsletterErrorText: string;
  newsletterEndpoint: string;
  copyrightText: string;
  legalLinks: string[];
  icpText: string;
  backToTopText: string;
  ageVerificationText: string;
}

export const footerConfig: FooterConfig = {
  brandName: "CREDIT",
  tagline: "Engine",
  description: "Precision credit intelligence for modern lenders. Know the exact cost of every loan before you approve it.",
  socialLinks: [
    { icon: "Twitter", label: "Twitter", href: "#" },
    { icon: "Linkedin", label: "LinkedIn", href: "#" },
    { icon: "Github", label: "GitHub", href: "#" },
  ],
  linkGroups: [
    {
      title: "Product",
      links: [
        { name: "Live Demo", href: "#/score" },
        { name: "Batch Upload", href: "#/batch" },
        { name: "Model Card", href: "#/model" },
        { name: "Documentation", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About", href: "#" },
        { name: "Blog", href: "#" },
        { name: "Careers", href: "#" },
        { name: "Contact", href: "mailto:hello@creditengine.app" },
      ],
    },
  ],
  contactItems: [
    { icon: "Mail", text: "hello@creditengine.app" },
    { icon: "Globe", text: "creditengine.vercel.app" },
  ],
  newsletterLabel: "Subscribe to product updates",
  newsletterPlaceholder: "Enter your email",
  newsletterButtonText: "Subscribe",
  newsletterSuccessText: "Thanks for subscribing!",
  newsletterErrorText: "Something went wrong. Please try again.",
  newsletterEndpoint: "https://formspree.io/f/xlgoookj",
  copyrightText: "© 2025 CreditEngine. All rights reserved.",
  legalLinks: ["Privacy Policy", "Terms of Service", "Cookie Policy"],
  icpText: "",
  backToTopText: "Back to top",
  ageVerificationText: "",
};

// -----------------------------------------------------------------------------
// Scroll To Top Config
// -----------------------------------------------------------------------------
export interface ScrollToTopConfig {
  ariaLabel: string;
}

export const scrollToTopConfig: ScrollToTopConfig = {
  ariaLabel: "Back to top",
};
