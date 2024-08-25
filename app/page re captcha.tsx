'use client'

import React, { useState, useEffect, useRef, createContext, useContext, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Head from 'next/head'
import { motion, AnimatePresence, useAnimation, useInView } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Palette, Brush, Layers, Zap, Share2, ChevronDown, Facebook, Twitter, Instagram, Linkedin, Moon, Sun, Globe, MessageCircle, ArrowUp, Menu, Trophy, BookOpen, CheckCircle, Video, Download, Users, Image as ImageIcon, Star, Gift, Newspaper, RoadMap } from 'lucide-react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sphere } from '@react-three/drei'
import * as THREE from 'three'
import Cookies from 'js-cookie'
import { Analytics } from '@vercel/analytics/react'
import { usePathname, useSearchParams } from 'next/navigation'
import OpenAI from 'openai'
import dynamic from 'next/dynamic'
import ReCAPTCHA from "react-google-recaptcha"

// Basic translations for fallback
const basicTranslations = {
  "app_name": "Illustrator Pro",
  "features": "Features",
  "pricing": "Pricing",
  "testimonials": "Testimonials",
  "faq": "FAQ",
  "get_started": "Get Started",
  "hero": {
    "title": "Unleash Your Creative Potential",
    "subtitle": "Professional illustration tools at your fingertips",
    "cta": "Start Creating Now",
    "learn_more": "Learn More"
  },
  "pricingDetails": {
    "title": "Choose Your Plan",
    "monthly": "Monthly",
    "yearly": "Yearly",
    "per_month": "/month",
    "per_year": "/year",
    "choose_plan": "Choose {{plan}}",
    "plan_free": {
      "name": "Free"
    },
    "plan_pro": {
      "name": "Pro"
    },
    "plan_enterprise": {
      "name": "Enterprise"
    }
  },
  "footer": {
    "all_rights_reserved": "All rights reserved."
  },
  "cookie_consent": {
    "accept": "Accept"
  },
  "chatbot": {
    "send": "Send"
  }
};

// Lazy load full translation files
const loadTranslations = async (lang: string) => {
  try {
    const response = await fetch(`/locales/${lang || 'en'}/common.json`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const translations = await response.json();
    return translations;
  } catch (error) {
    console.error(`Could not load translations for language: ${lang}`, error);
    return {};
  }
};

// Lazy load the IllustrationAppDemo component
const IllustrationAppDemo = dynamic(() => import('@/components/sections/IllustrationAppDemo').then((mod) => mod.IllustrationAppDemo), {
  loading: () => <p>Loading demo...</p>,
  ssr: false,
})

i18next
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: basicTranslations },
      es: { translation: basicTranslations },
      ar: { translation: basicTranslations },
      zh: { translation: basicTranslations },
      it: { translation: basicTranslations },
      fr: { translation: basicTranslations },
      de: { translation: basicTranslations },
      nl: { translation: basicTranslations },
      tr: { translation: basicTranslations },
      'pt-br': { translation: basicTranslations },
      pt: { translation: basicTranslations },
      'es-mx': { translation: basicTranslations },
    },
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

// Create context for theme
const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {},
});

// A/B Testing variants
const ABTestContext = createContext({
  variant: 'A',
  trackConversion: (variantId: string, eventName: string) => {},
});

const ABTestProvider = ({ children }) => {
  const [variant, setVariant] = useState('A');
  const [conversions, setConversions] = useState({});

  useEffect(() => {
    const variants = ['A', 'B', 'C', 'D'];
    setVariant(variants[Math.floor(Math.random() * variants.length)]);
  }, []);

  const trackConversion = (variantId: string, eventName: string) => {
    setConversions(prev => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        [eventName]: (prev[variantId]?.[eventName] || 0) + 1
      }
    }));
    console.log(`Conversion tracked for variant ${variantId}: ${eventName}`);
  };

  useEffect(() => {
    console.log('Current conversions:', conversions);
    // Here you would typically send this data to your analytics service
  }, [conversions]);

  return (
    <ABTestContext.Provider value={{ variant, trackConversion }}>
      {children}
    </ABTestContext.Provider>
  );
};

// Analytics tracking function
const trackEvent = (eventName, eventProperties = {}) => {
  console.log('Event tracked:', eventName, eventProperties);
  // Here you would typically send this data to your analytics service
};

// OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// Gamification context
const GamificationContext = createContext({
  points: 0,
  level: 1,
  addPoints: (amount: number) => {},
  achievements: [],
  unlockAchievement: (achievement: string) => {},
});

const GamificationProvider = ({ children }) => {
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [achievements, setAchievements] = useState([]);

  const addPoints = (amount: number) => {
    setPoints(prev => {
      const newPoints = prev + amount;
      const newLevel = Math.floor(newPoints / 100) + 1;
      if (newLevel > level) {
        setLevel(newLevel);
        unlockAchievement(`Reached Level ${newLevel}`);
      }
      return newPoints;
    });
  };

  const unlockAchievement = (achievement: string) => {
    if (!achievements.includes(achievement)) {
      setAchievements(prev => [...prev, achievement]);
    }
  };

  return (
    <GamificationContext.Provider value={{ points, level, addPoints, achievements, unlockAchievement }}>
      {children}
    </GamificationContext.Provider>
  );
};

export default function LandingPage() {
  const [isDark, setIsDark] = useState(false);
  const [cookieConsent, setCookieConsent] = useState(false);
  const { i18n } = useTranslation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    setIsDark(savedTheme === 'dark');
    const consentGiven = Cookies.get('cookieConsent');
    setCookieConsent(consentGiven === 'true');

    const urlLang = searchParams.get('lang');
    if (urlLang && ['en', 'es', 'ar', 'zh', 'it', 'fr', 'de', 'nl', 'tr', 'pt-br', 'pt', 'es-mx'].includes(urlLang)) {
      changeLanguage(urlLang);
    } else {
      const browserLang = navigator.language.split('-')[0];
      if (['en', 'es', 'ar', 'zh', 'it', 'fr', 'de', 'nl', 'tr', 'pt', 'pt-br', 'es-mx'].includes(browserLang)) {
        changeLanguage(browserLang);
      }
    }

    const handleScroll = () => {
      setShowBackToTop(window.pageYOffset > 300);
    };

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, [searchParams]);

  const changeLanguage = async (lng: string) => {
    try {
      const translations = await loadTranslations(lng || 'en');
      i18n.addResourceBundle(lng, 'translation', translations, true, true);
    } catch (error) {
      console.error(`Failed to load translations for ${lng}`, error);
      // Fallback to basic translations
      i18n.addResourceBundle(lng, 'translation', basicTranslations, true, true);
    }
    i18n.changeLanguage(lng);
    const params = new URLSearchParams(searchParams.toString());
    params.set('lang', lng);
    window.history.pushState(null, '', `${pathname}?${params.toString()}`);
    trackEvent('language_changed', { new_language: lng });
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    localStorage.setItem('theme', !isDark ? 'dark' : 'light');
    trackEvent('theme_changed', { new_theme: !isDark ? 'dark' : 'light' });
  };

  const handleCookieConsent = () => {
    setCookieConsent(true);
    Cookies.set('cookieConsent', 'true', { expires: 365 });
    trackEvent('cookie_consent_given');
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <ABTestProvider>
        <GamificationProvider>
          <div className={`${isDark ? 'dark' : ''} ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`}>
            <Head>
              <title>{i18n.t('app_name')} - Unleash Your Creative Potential</title>
              <meta name="description" content="Professional illustration tools at your fingertips. Create stunning artwork with our intuitive app." />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <link rel="icon" href="/favicon.ico" />
              {/* Open Graph / Facebook */}
              <meta property="og:type" content="website" />
              <meta property="og:url" content="https://www.illustratorpro.com/" />
              <meta property="og:title" content={`${i18n.t('app_name')} - Unleash Your Creative Potential`} />
              <meta property="og:description" content="Professional illustration tools at your fingertips. Create stunning artwork with our intuitive app." />
              <meta property="og:image" content="https://www.illustratorpro.com/og-image.jpg" />
              {/* Twitter */}
              <meta property="twitter:card" content="summary_large_image" />
              <meta property="twitter:url" content="https://www.illustratorpro.com/" />
              <meta property="twitter:title" content={`${i18n.t('app_name')} - Unleash Your Creative Potential`} />
              <meta property="twitter:description" content="Professional illustration tools at your fingertips. Create stunning artwork with our intuitive app." />
              <meta property="twitter:image" content="https://www.illustratorpro.com/twitter-image.jpg" />
              {/* Content Security Policy */}
              <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.openai.com;" />
            </Head>
            <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-white transition-colors duration-300">
              <Header changeLanguage={changeLanguage} />
              <main>
                <HeroSection />
                <FeaturesSection />
                <InteractiveDemoSection />
                <PricingSection />
                <TestimonialsSection />
                <FAQSection />
                <BlogSection />
                <ResourcesSection />
                <GamificationSection />
                <ShowcaseSection />
                <CommunityShowcaseSection />
                <ComparisonTableSection />
                <AffiliateProgramSection />
                <PressSection />
                <RoadmapSection />
                <SocialProofWidget />
              </main>
              <Footer />
              {!cookieConsent && <CookieConsent onAccept={handleCookieConsent} />}
              <AIChatbot />
              {showBackToTop && (
                <Button
                  className="fixed bottom-20 right-4 rounded-full p-2 shadow-lg hover:scale-105 transition-transform"
                  onClick={scrollToTop}
                >
                  <ArrowUp className="h-6 w-6" />
                </Button>
              )}
              <MobileNavigation show={showMobileMenu} onClose={() => setShowMobileMenu(false)} />
            </div>
          </div>
        </GamificationProvider>
      </ABTestProvider>
      <Analytics />
    </ThemeContext.Provider>
  )
}

function Header({ changeLanguage }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const { t, i18n } = useTranslation()
  const { isDark, toggleTheme } = useContext(ThemeContext)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/80 backdrop-blur-md shadow-md dark:bg-gray-900/80' : ''
      }`}
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Palette className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <span className="text-xl font-bold">{t('app_name')}</span>
        </Link>
        <nav className="hidden md:flex space-x-8">
          <Link href="#features" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">
            {t('features')}
          </Link>
          <Link href="#pricing" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">
            {t('pricing')}
          </Link>
          <Link href="#testimonials" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">
            {t('testimonials')}
          </Link>
          <Link href="#faq" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">
            {t('faq')}
          </Link>
          <Link href="#blog" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">
            Blog
          </Link>
        </nav>
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <div className="relative group">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <Globe className="h-5 w-5" />
            </Button>
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
              <button onClick={() => changeLanguage('en')} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left">English</button>
              <button onClick={() => changeLanguage('es')} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left">Español</button>
              <button onClick={() => changeLanguage('ar')} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left">العربية</button>
              <button onClick={() => changeLanguage('zh')} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left">中文</button>
              <button onClick={() => changeLanguage('it')} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left">Italiano</button>
              <button onClick={() => changeLanguage('fr')} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left">Français</button>
              <button onClick={() => changeLanguage('de')} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left">Deutsch</button>
              <button onClick={() => changeLanguage('nl')} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left">Nederlands</button>
              <button onClick={() => changeLanguage('tr')} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left">Türkçe</button>
              <button onClick={() => changeLanguage('pt-br')} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left">Português (BR)</button>
              <button onClick={() => changeLanguage('pt')} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left">Português</button>
              <button onClick={() => changeLanguage('es-mx')} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left">Español (MX)</button>
            </div>
          </div>
          <Button asChild onClick={() => trackEvent('cta_clicked', { location: 'header' })}>
            <Link href="#pricing">{t('get_started')}</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setShowMobileMenu(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </header>
  )
}

function MobileNavigation({ show, onClose }) {
  const { t } = useTranslation()

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%'}}
          transition={{ type: 'tween' }}
          className="fixed inset-y-0 right-0 w-64 bg-white dark:bg-gray-800 shadow-lg z-50"
        >
          <div className="p-4">
            <Button variant="ghost" size="icon" onClick={onClose} className="mb-4">
              <ChevronDown className="h-6 w-6 transform rotate-90" />
            </Button>
            <nav className="space-y-4">
              <Link href="#features" className="block text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">
                {t('features')}
              </Link>
              <Link href="#pricing" className="block text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">
                {t('pricing')}
              </Link>
              <Link href="#testimonials" className="block text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">
                {t('testimonials')}
              </Link>
              <Link href="#faq" className="block text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">
                {t('faq')}
              </Link>
              <Link href="#blog" className="block text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">
                Blog
              </Link>
            </nav>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function HeroSection() {
  const controls = useAnimation()
  const ref = useRef(null)
  const inView = useInView(ref)
  const { t } = useTranslation()
  const { variant, trackConversion } = useContext(ABTestContext)

  useEffect(() => {
    if (inView) {
      controls.start('visible')
    }
  }, [controls, inView])

  const heroContent = {
    A: {
      title: t('hero.title'),
      subtitle: t('hero.subtitle'),
      cta: t('hero.cta'),
    },
    B: {
      title: "Create Stunning Illustrations with Ease",
      subtitle: "Professional-grade tools, user-friendly interface",
      cta: "Start Your Free Trial",
    },
    C: {
      title: "Bring Your Ideas to Life",
      subtitle: "Powerful illustration tools for every skill level",
      cta: "Explore Features",
    },
    D: {
      title: "Elevate Your Artistic Vision",
      subtitle: "Advanced tools, intuitive design, endless possibilities",
      cta: "Join Our Community",
    }
  }

  const content = heroContent[variant]

  return (
    <section className="py-20 md:py-32 relative overflow-hidden" ref={ref}>
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
        <motion.div
          className="md:w-1/2 mb-10 md:mb-0"
          initial="hidden"
          animate={controls}
          variants={{
            hidden: { opacity: 0, x: -50 },
            visible: { opacity: 1, x: 0 },
          }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            {content.title}
          </h1>
          <p className="text-xl mb-8 text-gray-600 dark:text-gray-300">
            {content.subtitle}
          </p>
          <div className="space-x-4">
            <Button 
              size="lg" 
              asChild 
              className="hover:scale-105 transition-transform" 
              onClick={() => {
                trackEvent('cta_clicked', { location: 'hero', button: 'primary', variant })
                trackConversion(variant, 'hero_cta_click')
              }}
            >
              <a href="#pricing">{content.cta}</a>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              asChild 
              className="hover:scale-105 transition-transform" 
              onClick={() => {
                trackEvent('cta_clicked', { location: 'hero', button: 'secondary', variant })
                trackConversion(variant, 'hero_learn_more_click')
              }}
            >
              <a href="#features">{t('hero.learn_more')}</a>
            </Button>
          </div>
        </motion.div>
        <motion.div
          className="md:w-1/2"
          initial="hidden"
          animate={controls}
          variants={{
            hidden: { opacity: 0, scale: 0.8 },
            visible: { opacity: 1, scale: 1 },
          }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Image
            src="/placeholder.svg"
            alt="Illustrator App Interface"
            width={600}
            height={400}
            className="rounded-lg shadow-2xl"
          />
        </motion.div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 -z-10" />
    </section>
  )
}

function FeaturesSection() {
  const controls = useAnimation()
  const ref = useRef(null)
  const inView = useInView(ref)
  const { t } = useTranslation()

  useEffect(() => {
    if (inView) {
      controls.start('visible')
    }
  }, [controls, inView])

  const features = [
    {
      icon: Brush,
      title: t('featuresDetails.feature_1.title'),
      description: t('featuresDetails.feature_1.description'),
    },
    {
      icon: Layers,
      title: t('featuresDetails.feature_2.title'),
      description: t('featuresDetails.feature_2.description'),
    },
    {
      icon: Zap,
      title: t('featuresDetails.feature_3.title'),
      description: t('featuresDetails.feature_3.description'),
    },
    {
      icon: Share2,
      title: t('featuresDetails.feature_4.title'),
      description: t('featuresDetails.feature_4.description'),
    },
  ]

  return (
    <section id="features" className="py-20 bg-gray-100 dark:bg-gray-800" ref={ref}>
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{t('features')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
              initial="hidden"
              animate={controls}
              variants={{
                hidden: { opacity: 0, y: 50 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onClick={() => trackEvent('feature_viewed', { feature: feature.title })}
            >
              <feature.icon className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function InteractiveDemoSection() {
  const { t } = useTranslation()

  return (
    <section id="demo" className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{t('demo.title')}</h2>
        <Suspense fallback={<div className="w-full h-[400px] bg-gray-200 dark:bg-gray-700 rounded-lg shadow-lg flex items-center justify-center">Loading demo...</div>}>
          <ErrorBoundary fallback={<div className="w-full h-[400px] bg-gray-200 dark:bg-gray-700 rounded-lg shadow-lg flex items-center justify-center">Error loading demo. Please try again later.</div>}>
            <IllustrationAppDemo />
          </ErrorBoundary>
        </Suspense>
        <p className="text-center mt-4 text-gray-600 dark:text-gray-300">
          {t('demo.description')}
        </p>
      </div>
    </section>
  )
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

function PricingSection() {
  const [isYearly, setIsYearly] = useState(false)
  const { t } = useTranslation()
  const { variant, trackConversion } = useContext(ABTestContext)

  const plans = [
    {
      name: t('pricingDetails.plan_free.name'),
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [t('pricingDetails.plan_free.feature_1'), t('pricingDetails.plan_free.feature_2'), t('pricingDetails.plan_free.feature_3')],
    },
    {
      name: t('pricingDetails.plan_pro.name'),
      monthlyPrice: 19,
      yearlyPrice: 190,
      features: [t('pricingDetails.plan_pro.feature_1'), t('pricingDetails.plan_pro.feature_2'), t('pricingDetails.plan_pro.feature_3'), t('pricingDetails.plan_pro.feature_4')],
    },
    {
      name: t('pricingDetails.plan_enterprise.name'),
      monthlyPrice: 49,
      yearlyPrice: 490,
      features: [t('pricingDetails.plan_enterprise.feature_1'), t('pricingDetails.plan_enterprise.feature_2'), t('pricingDetails.plan_enterprise.feature_3'), t('pricingDetails.plan_enterprise.feature_4')],
    },
  ]

  // A/B test variants for pricing
  const pricingVariants = {
    A: plans,
    B: [
      ...plans,
      {
        name: t('pricingDetails.plan_ultimate.name'),
        monthlyPrice: 79,
        yearlyPrice: 790,
        features: [t('pricingDetails.plan_ultimate.feature_1'), t('pricingDetails.plan_ultimate.feature_2'), t('pricingDetails.plan_ultimate.feature_3'), t('pricingDetails.plan_ultimate.feature_4')],
      },
    ],
    C: plans.map(plan => ({
      ...plan,
      monthlyPrice: Math.round(plan.monthlyPrice * 0.9),
      yearlyPrice: Math.round(plan.yearlyPrice * 0.9),
    })),
    D: plans.map(plan => ({
      ...plan,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: Math.round(plan.yearlyPrice * 0.8),
    })),
  }

  const currentPlans = pricingVariants[variant]

  return (
    <section id="pricing" className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{t('pricingDetails.title')}</h2>
        <div className="flex justify-center items-center mb-8">
          <span className={`mr-2 ${isYearly ? 'text-gray-600 dark:text-gray-400' : 'font-semibold'}`}>{t('pricingDetails.monthly')}</span>
          <Switch checked={isYearly} onCheckedChange={(checked) => {
            setIsYearly(checked)
            trackEvent('pricing_toggle', { isYearly: checked, variant })
          }} />
          <span className={`ml-2 ${isYearly ? 'font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>{t('pricingDetails.yearly')}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {currentPlans.map((plan, index) => (
            <motion.div
              key={index}
              className={`bg-gray-100 dark:bg-gray-800 p-8 rounded-lg shadow-lg ${
                plan.name === t('pricingDetails.plan_pro.name') ? 'border-2 border-blue-500' : ''
              }`}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
              <div className="text-4xl font-bold mb-6">
                ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                <span className="text-base font-normal text-gray-600 dark:text-gray-400">
                  {isYearly ? t('pricingDetails.per_year') : t('pricingDetails.per_month')}
                </span>
              </div>
              <ul className="mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="mb-2 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-blue-500"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button 
                className="w-full hover:scale-105 transition-transform" 
                variant={plan.name === t('pricingDetails.plan_pro.name') ? 'default' : 'outline'}
                onClick={() => {
                  trackEvent('plan_selected', { plan: plan.name, isYearly, variant })
                  trackConversion(variant, `plan_selected_${plan.name.toLowerCase()}`)
                }}
              >
                {t('pricingDetails.choose_plan', { plan: plan.name })}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TestimonialsSection() {
  const controls = useAnimation()
  const ref = useRef(null)
  const inView = useInView(ref)
  const { t } = useTranslation()

  useEffect(() => {
    if (inView) {
      controls.start('visible')
    }
  }, [controls, inView])

  const testimonials = [
    {
      name: t('testimonialsDetails.testimonial_1.name'),
      role: t('testimonialsDetails.testimonial_1.role'),
      image: '/placeholder.svg',
      quote: t('testimonialsDetails.testimonial_1.quote'),
    },
    {
      name: t('testimonialsDetails.testimonial_2.name'),
      role: t('testimonialsDetails.testimonial_2.role'),
      image: '/placeholder.svg',
      quote: t('testimonialsDetails.testimonial_2.quote'),
    },
    {
      name: t('testimonialsDetails.testimonial_3.name'),
      role: t('testimonialsDetails.testimonial_3.role'),
      image: '/placeholder.svg',
      quote: t('testimonialsDetails.testimonial_3.quote'),
    },
  ]

  return (
    <section id="testimonials" className="py-20 bg-gray-100 dark:bg-gray-800" ref={ref}>
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{t('testimonials')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg"
              initial="hidden"
              animate={controls}
              variants={{
                hidden: { opacity: 0, y: 50 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="flex items-center mb-4">
                <Image
                  src={testimonial.image}
                  alt={testimonial.name}
                  width={50}
                  height={50}
                  className="rounded-full mr-4"
                />
                <div>
                  <h3 className="font-semibold">{testimonial.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</p>
                </div>
              </div>
              <p className="italic text-gray-700 dark:text-gray-300">&ldquo;{testimonial.quote}&rdquo;</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const { t } = useTranslation()

  const faqs = [
    {
      question: t('faqDetails.question_1'),
      answer: t('faqDetails.answer_1'),
    },
    {
      question: t('faqDetails.question_2'),
      answer: t('faqDetails.answer_2'),
    },
    {
      question: t('faqDetails.question_3'),
      answer: t('faqDetails.answer_3'),
    },
    {
      question: t('faqDetails.question_4'),
      answer: t('faqDetails.answer_4'),
    },
    {
      question: t('faqDetails.question_5'),
      answer: t('faqDetails.answer_5'),
    },
  ]

  return (
    <section id="faq" className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{t('faq')}</h2>
        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <div key={index} className="mb-4">
              <button
                className="flex justify-between items-center w-full text-left p-4 bg-gray-100 dark:bg-gray-800 rounded-lg focus:outline-none hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                onClick={() => {
                  setActiveIndex(activeIndex === index ? null : index)
                  trackEvent('faq_toggled', { question: faq.question, isOpen: activeIndex !== index })
                }}
              >
                <span className="font-semibold">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 transition-transform duration-300 ${
                    activeIndex === index ? 'transform rotate-180' : ''
                  }`}
                />
              </button>
              <AnimatePresence>
                {activeIndex === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="p-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">{faq.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function BlogSection() {
  const { t } = useTranslation()

  const blogPosts = [
    {
      title: "10 Essential Illustration Techniques",
      excerpt: "Learn the fundamental techniques that every illustrator should master.",
      image: "/placeholder.svg",
      slug: "essential-illustration-techniques"
    },
    {
      title: "Color Theory for Digital Artists",
      excerpt: "Understand how to use color effectively in your digital illustrations.",
      image: "/placeholder.svg",
      slug: "color-theory-digital-artists"
    },
    {
      title: "From Sketch to Final Artwork: A Complete Guide",
      excerpt: "Follow our step-by-step process to turn your sketches into polished illustrations.",
      image: "/placeholder.svg",
      slug: "sketch-to-final-artwork"
    }
  ]

  return (
    <section id="blog" className="py-20 bg-gray-100 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Latest from Our Blog</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {blogPosts.map((post, index) => (
            <motion.div 
              key={index} 
              className="bg-white dark:bg-gray-700 rounded-lg shadow-lg overflow-hidden"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Image src={post.image} alt={post.title} width={400} height={200} className="w-full h-48 object-cover" />
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{post.excerpt}</p>
                <Link href={`/blog/${post.slug}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                  Read more
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-12">
          <Button asChild>
            <Link href="/blog">View All Posts</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function ResourcesSection() {
  const { t } = useTranslation()

  const resources = [
    {
      title: "Beginner's Guide to Digital Illustration",
      description: "A comprehensive PDF guide for those just starting out.",
      icon: BookOpen,
      link: "/resources/beginners-guide.pdf"
    },
    {
      title: "Illustration Technique Video Series",
      description: "Access our exclusive video tutorials on advanced techniques.",
      icon: Video,
      link: "/resources/video-series"
    },
    {
      title: "Customizable Brush Pack",
      description: "Download our set of professional Illustrator brushes.",
      icon: Download,
      link: "/resources/brush-pack.zip"
    }
  ]

  return (
    <section id="resources" className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Free Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {resources.map((resource, index) => (
            <motion.div 
              key={index} 
              className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-lg"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <resource.icon className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{resource.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{resource.description}</p>
              <Button asChild variant="outline">
                <Link href={resource.link}>Download</Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function GamificationSection() {
  const { points, level, achievements } = useContext(GamificationContext)
  const { t } = useTranslation()

  return (
    <section id="gamification" className="py-20 bg-gray-100 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Your Progress</h2>
        <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-semibold">Level: {level}</h3>
              <p className="text-gray-600 dark:text-gray-300">Points: {points}</p>
            </div>
            <Trophy className="h-12 w-12 text-yellow-500" />
          </div>
          <div className="mb-6">
            <div className="bg-gray-200 dark:bg-gray-600 h-4 rounded-full">
              <motion.div 
                className="bg-blue-500 h-4 rounded-full" 
                style={{ width: `${(points % 100) / 100 * 100}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${(points % 100) / 100 * 100}%` }}
                transition={{ duration: 0.5 }}
              ></motion.div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {100 - (points % 100)} points to next level
            </p>
          </div>
          <h4 className="text-xl font-semibold mb-4">Achievements</h4>
          <ul className="space-y-2">
            {achievements.map((achievement, index) => (
              <motion.li 
                key={index} 
                className="flex items-center"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span>{achievement}</span>
              </motion.li>
            ))}
          </ul>
          <div className="mt-6">
            <Button asChild>
              <Link href="/challenges">Take on New Challenges</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

function ShowcaseSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const illustrations = [
    { src: "/placeholder.svg", alt: "Illustration 1" },
    { src: "/placeholder.svg", alt: "Illustration 2" },
    { src: "/placeholder.svg", alt: "Illustration 3" },
  ];

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % illustrations.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + illustrations.length) % illustrations.length);
  };

  return (
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Example Illustrations</h2>
        <div className="relative">
          <div className="overflow-hidden">
            <motion.div
              className="flex"
              animate={{ x: `${-currentIndex * 100}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {illustrations.map((illustration, index) => (
                <div key={index} className="w-full flex-shrink-0">
                  <Image
                    src={illustration.src}
                    alt={illustration.alt}
                    width={800}
                    height={600}
                    className="mx-auto rounded-lg shadow-lg"
                  />
                </div>
              ))}
            </motion.div>
          </div>
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg"
          >
            <ChevronDown className="h-6 w-6 transform rotate-90" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg"
          >
            <ChevronDown className="h-6 w-6 transform -rotate-90" />
          </button>
        </div>
      </div>
    </section>
  );
}

function CommunityShowcaseSection() {
  const communityArtworks = [
    { src: "/placeholder.svg", alt: "Community Artwork 1", artist: "John Doe" },
    { src: "/placeholder.svg", alt: "Community Artwork 2", artist: "Jane Smith" },
    { src: "/placeholder.svg", alt: "Community Artwork 3", artist: "Alex Johnson" },
  ];

  return (
    <section className="py-20 bg-gray-100 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Community Showcase</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {communityArtworks.map((artwork, index) => (
            <motion.div
              key={index}
              className="bg-white dark:bg-gray-700 rounded-lg shadow-lg overflow-hidden"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Image
                src={artwork.src}
                alt={artwork.alt}
                width={400}
                height={300}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <p className="text-center text-gray-600 dark:text-gray-300">By {artwork.artist}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-12">
          <Button asChild>
            <Link href="/community-gallery">View Full Gallery</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function ComparisonTableSection() {
  const features = [
    { name: "Basic Tools", us: true, competitor1: true, competitor2: true },
    { name: "Advanced Brushes", us: true, competitor1: true, competitor2: false },
    { name: "Layer Management", us: true, competitor1: true, competitor2: true },
    { name: "Cloud Storage", us: true, competitor1: false, competitor2: true },
    { name: "Collaboration Features", us: true, competitor1: false, competitor2: false },
    { name: "24/7 Support", us: true, competitor1: false, competitor2: false },
  ];

  return (
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">How We Compare</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="py-4 px-6 bg-gray-100 dark:bg-gray-800 font-bold uppercase text-sm text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Feature</th>
                <th className="py-4 px-6 bg-gray-100 dark:bg-gray-800 font-bold uppercase text-sm text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Us</th>
                <th className="py-4 px-6 bg-gray-100 dark:bg-gray-800 font-bold uppercase text-sm text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Competitor 1</th>
                <th className="py-4 px-6 bg-gray-100 dark:bg-gray-800 font-bold uppercase text-sm text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Competitor 2</th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr key={index}>
                  <td className="py-4 px-6 border-b border-gray-200 dark:border-gray-700">{feature.name}</td>
                  <td className="py-4 px-6 border-b border-gray-200 dark:border-gray-700">{feature.us ? "✅" : "❌"}</td>
                  <td className="py-4 px-6 border-b border-gray-200 dark:border-gray-700">{feature.competitor1 ? "✅" : "❌"}</td>
                  <td className="py-4 px-6 border-b border-gray-200 dark:border-gray-700">{feature.competitor2 ? "✅" : "❌"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function AffiliateProgramSection() {
  return (
    <section className="py-20 bg-gray-100 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Join Our Affiliate Program</h2>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-lg mb-8">Earn commissions by promoting our app to your audience. It's easy to get started!</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
              <Gift className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Generous Commissions</h3>
              <p>Earn up to 30% on each sale you refer</p>
            </div>
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
              <Share2 className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Easy Promotion</h3>
              <p>Get access to banners, links, and promotional materials</p>
            </div>
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
              <Zap className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Quick Payouts</h3>
              <p>Receive your earnings monthly via PayPal or bank transfer</p>
            </div>
          </div>
          <Button asChild size="lg">
            <Link href="/affiliate-program">Join Now</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function PressSection() {
  const pressItems = [
    { logo: "/placeholder.svg", name: "TechCrunch", quote: "A game-changer in digital illustration" },
    { logo: "/placeholder.svg", name: "Wired", quote: "Sets a new standard for creativity tools" },
    { logo: "/placeholder.svg", name: "Forbes", quote: "The go-to app for professional illustrators" },
  ];

  return (
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">In the Press</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pressItems.map((item, index) => (
            <div key={index} className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center">
              <Image src={item.logo} alt={item.name} width={150} height={50} className="mx-auto mb-4" />
              <p className="text-lg font-semibold mb-2">{item.name}</p>
              <p className="italic">&ldquo;{item.quote}&rdquo;</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <Button asChild variant="outline">
            <Link href="/press-kit">Download Press Kit</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function RoadmapSection() {
  const [newFeature, setNewFeature] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const recaptchaRef = useRef();

  const roadmapItems = [
    { title: "Collaborative Editing", description: "Work on projects with your team in real-time", status: "In Progress" },
    { title: "AI-Assisted Coloring", description: "Intelligent color suggestions based on your artwork", status: "Planned" },
    { title: "Advanced Export Options", description: "More file formats and customization for exports", status: "Upcoming" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recaptchaToken) {
      alert("Please complete the reCAPTCHA");
      return;
    }
    // Here you would typically send the new feature request to your backend
    console.log("New feature request:", newFeature);
    setNewFeature("");
    // Reset reCAPTCHA
    recaptchaRef.current.reset();
    setRecaptchaToken("");
  };

  return (
    <section className="py-20 bg-gray-100 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Our Roadmap</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {roadmapItems.map((item, index) => (
            <div key={index} className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="mb-4">{item.description}</p>
              <span className={`px-2 py-1 rounded-full text-sm ${
                item.status === "In Progress" ? "bg-yellow-200 text-yellow-800" :
                item.status === "Planned" ? "bg-blue-200 text-blue-800" :
                "bg-green-200 text-green-800"
              }`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
        <div className="max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold mb-4">Request a Feature</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              placeholder="Describe your feature idea"
              required
            />
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
              onChange={(token) => setRecaptchaToken(token)}
            />
            <Button type="submit">Submit Feature Request</Button>
          </form>
        </div>
      </div>
    </section>
  );
}

function SocialProofWidget() {
  const [stats, setStats] = useState({
    activeUsers: 0,
    projectsCreated: 0,
  });

  useEffect(() => {
    // Simulating API call to get real-time stats
    const fetchStats = () => {
      // Replace with actual API call
      setStats({
        activeUsers: Math.floor(Math.random() * 10000),
        projectsCreated: Math.floor(Math.random() * 100000),
      });
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 left-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-2">Live Stats</h3>
      <p>Active Users: {stats.activeUsers.toLocaleString()}</p>
      <p>Projects Created: {stats.projectsCreated.toLocaleString()}</p>
    </div>
  );
}

function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="bg-gray-100 dark:bg-gray-800 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold mb-4">{t('app_name')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('footer.description')}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{t('footer.quick_links')}</h4>
            <ul className="space-y-2">
              <li><Link href="#features" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">{t('features')}</Link></li>
              <li><Link href="#pricing" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">{t('pricing')}</Link></li>
              <li><Link href="#testimonials" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">{t('testimonials')}</Link></li>
              <li><Link href="#faq" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">{t('faq')}</Link></li>
              <li><Link href="#blog" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="#resources" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Resources</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{t('footer.legal')}</h4>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">{t('footer.privacy_policy')}</Link></li>
              <li><Link href="/terms" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">{t('footer.terms_of_service')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{t('footer.newsletter')}</h4>
            <form className="space-y-2" onSubmit={(e) => {
              e.preventDefault()
              trackEvent('newsletter_signup')
            }}>
              <Input type="email" placeholder={t('footer.enter_email')} className="hover:border-blue-500 focus:border-blue-500 transition-colors" />
              <Button type="submit" className="w-full hover:scale-105 transition-transform">{t('footer.subscribe')}</Button>
            </form>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-300 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">&copy; {new Date().getFullYear()} {t('app_name')}. {t('footer.all_rights_reserved')}</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><Facebook className="w-5 h-5" /></a>
            <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
            <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
            <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
          </div>
        </div>
      </div>
    </footer>
  )
}

function CookieConsent({ onAccept }: { onAccept: () => void }) {
  const { t } = useTranslation()

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 p-4 shadow-lg border-t border-gray-200 dark:border-gray-700">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 md:mb-0">
          {t('cookie_consent.message')}
        </p>
        <Button onClick={onAccept} className="hover:scale-105 transition-transform">{t('cookie_consent.accept')}</Button>
      </div>
    </div>
  )
}

function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! How can I help you today?', timestamp: new Date() }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const { t } = useTranslation()
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      const userMessage = { role: 'user', content: input, timestamp: new Date() }
      setMessages(prev => [...prev, userMessage])
      setInput('')
      setIsTyping(true)
      trackEvent('chatbot_message_sent')

      try {
        const stream = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: 'user', content: input }],
          stream: true,
        });

        let fullResponse = '';
        for await (const chunk of stream) {
          fullResponse += chunk.choices[0]?.delta?.content || "";
          setMessages(prev => [
            ...prev.slice(0, -1),
            { role: 'assistant', content: fullResponse, timestamp: new Date() }
          ]);
        }
      } catch (error) {
        console.error('Error calling OpenAI:', error)
        const errorMessage = { 
          role: 'assistant', 
          content: "I'm sorry, I encountered an error. Please try again later.", 
          timestamp: new Date() 
        }
        setMessages(prev => [...prev, errorMessage])
      } finally {
        setIsTyping(false)
      }
    }
  }

  return (
    <>
      <Button
        className="fixed bottom-4 right-4 rounded-full p-4 shadow-lg hover:scale-105 transition-transform"
        onClick={() => {
          setIsOpen(!isOpen)
          trackEvent('chatbot_toggled', { isOpen: !isOpen })
        }}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
      {isOpen && (
        <div className="fixed bottom-20 right-4 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="h-96 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((message, index) => (
                <div key={index} className={`mb-2 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <span className={`inline-block p-2 rounded-lg ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                    {message.content}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="text-left">
                  <span className="inline-block p-2 rounded-lg bg-gray-200 dark:bg-gray-700">
                    <span className="typing-indicator"></span>
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
              <Input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('chatbot.type_your_message')}
                className="mb-2"
              />
              <Button type="submit" className="w-full">{t('chatbot.send')}</Button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}