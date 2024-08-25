'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { ArrowRight, Check, ChevronDown, Globe, Zap, Code, Users, Moon, Sun } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import CookieConsent from 'react-cookie-consent'

export default function Component() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [showCookieConsent, setShowCookieConsent] = useState(true)
  const [demoText, setDemoText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const { t, i18n } = useTranslation()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  const handleDemoTranslation = () => {
    // Simulated translation (replace with actual API call in production)
    setTranslatedText(demoText.split('').reverse().join(''))
  }

  return (
    <div className={`flex flex-col min-h-screen ${darkMode ? 'dark' : ''}`}>
      <header className={`sticky top-0 z-50 transition-colors duration-300 ${isScrolled ? 'bg-white dark:bg-gray-800 shadow-md' : 'bg-transparent'}`}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span className="font-bold text-xl dark:text-white">{t('appName')}</span>
          </Link>
          <nav className="hidden md:flex space-x-6">
            <Link href="#features" className="text-sm font-medium hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">{t('features')}</Link>
            <Link href="#integrations" className="text-sm font-medium hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">{t('integrations')}</Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">{t('pricing')}</Link>
            <Link href="#testimonials" className="text-sm font-medium hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">{t('testimonials')}</Link>
          </nav>
          <div className="flex items-center space-x-4">
            <select
              onChange={(e) => changeLanguage(e.target.value)}
              className="text-sm bg-transparent dark:text-white"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
            </select>
            <Button onClick={toggleDarkMode} variant="ghost" size="icon">
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button>{t('getStarted')}</Button>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-800 dark:to-purple-800 text-white py-20 md:py-32"
        >
          <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('heroTitle')}</h1>
              <p className="text-xl mb-6">{t('heroSubtitle')}</p>
              <div className="flex space-x-4">
                <Button size="lg" variant="secondary">{t('getStartedFree')}</Button>
                <Button size="lg" variant="outline">{t('exploreFeatures')}</Button>
              </div>
            </div>
            <div className="md:w-1/2">
              <Image
                src="/placeholder.svg?height=400&width=400"
                width={400}
                height={400}
                alt="AI Translation App Interface"
                className="rounded-lg shadow-2xl"
              />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white dark:from-gray-900 to-transparent"></div>
        </motion.section>

        {/* Features Section */}
        <section id="features" className="py-20 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">{t('powerfulFeatures')}</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: <Zap className="h-10 w-10 text-blue-600 dark:text-blue-400" />, title: t('featureAI'), description: t('featureAIDesc') },
                { icon: <Code className="h-10 w-10 text-blue-600 dark:text-blue-400" />, title: t('featureIntegration'), description: t('featureIntegrationDesc') },
                { icon: <Globe className="h-10 w-10 text-blue-600 dark:text-blue-400" />, title: t('featureLanguages'), description: t('featureLanguagesDesc') },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="transition-all duration-300 hover:shadow-lg dark:bg-gray-800">
                    <CardContent className="p-6 text-center">
                      <motion.div 
                        className="mb-4"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {feature.icon}
                      </motion.div>
                      <h3 className="text-xl font-semibold mb-2 dark:text-white">{feature.title}</h3>
                      <p className="text-muted-foreground dark:text-gray-400">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Interactive Demo Section */}
        <section className="py-20 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">{t('tryItOut')}</h2>
            <div className="max-w-3xl mx-auto">
              <div className="mb-4">
                <Input
                  type="text"
                  placeholder={t('enterTextToTranslate')}
                  value={demoText}
                  onChange={(e) => setDemoText(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="mb-4">
                <Button onClick={handleDemoTranslation} className="w-full">
                  {t('translate')}
                </Button>
              </div>
              <div className="bg-white dark:bg-gray-700 p-4 rounded-md shadow">
                <h3 className="font-semibold mb-2 dark:text-white">{t('translatedText')}:</h3>
                <p className="dark:text-gray-300">{translatedText || t('translationWillAppearHere')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Integrations Section */}
        <section id="integrations" className="bg-gray-50 dark:bg-gray-900 py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">{t('seamlessIntegrations')}</h2>
            <div className="flex overflow-x-auto pb-4 space-x-6">
              {['React', 'Angular', 'Vue', 'Next.js', 'Gatsby', 'Svelte'].map((tech) => (
                <motion.div
                  key={tech}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Card className="flex-shrink-0 w-40 dark:bg-gray-800">
                    <CardContent className="p-4 text-center">
                      <Image
                        src={`/placeholder.svg?height=50&width=50&text=${tech}`}
                        width={50}
                        height={50}
                        alt={tech}
                        className="mx-auto mb-2"
                      />
                      <p className="font-medium dark:text-white">{tech}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">{t('simplePricing')}</h2>
            <Tabs defaultValue="monthly" className="w-full max-w-3xl mx-auto">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="monthly">{t('monthlyBilling')}</TabsTrigger>
                <TabsTrigger value="yearly">{t('yearlyBilling')}</TabsTrigger>
              </TabsList>
              <TabsContent value="monthly">
                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    { name: t('free'), price: '$0', features: [t('freeFeature1'), t('freeFeature2'), t('freeFeature3')] },
                    { name: t('pro'), price: '$29', features: [t('proFeature1'), t('proFeature2'), t('proFeature3'), t('proFeature4')] },
                    { name: t('enterprise'), price: t('custom'), features: [t('enterpriseFeature1'), t('enterpriseFeature2'), t('enterpriseFeature3'), t('enterpriseFeature4')] },
                  ].map((plan) => (
                    <motion.div
                      key={plan.name}
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Card className={`${plan.name === t('pro') ? 'border-blue-600 dark:border-blue-400 shadow-lg' : ''} dark:bg-gray-700`}>
                        <CardContent className="p-6">
                          <h3 className="text-2xl font-bold mb-2 dark:text-white">{plan.name}</h3>
                          <p className="text-3xl font-bold mb-4 dark:text-gray-300">{plan.price}</p>
                          <ul className="space-y-2 mb-6">
                            {plan.features.map((feature) => (
                              <li key={feature} className="flex items-center dark:text-gray-300">
                                <Check className="h-5 w-5 text-green-500 mr-2" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                          <Button className="w-full">{plan.name === t('enterprise') ? t('contactSales') : t('getStarted')}</Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="yearly">
                {/* Similar structure as monthly, but with discounted prices */}
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="bg-gray-50 dark:bg-gray-900 py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">{t('customerTestimonials')}</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { name: 'John Doe', role: t('johnRole'), quote: t('johnQuote') },
                { name: 'Jane Smith', role: t('janeRole'), quote: t('janeQuote') },
                { name: 'Alex Johnson', role: t('alexRole'), quote: t('alexQuote') },
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="dark:bg-gray-800">
                    <CardContent className="p-6">
                      <p className="mb-4 italic dark:text-gray-300">"{testimonial.quote}"</p>
                      <div className="flex items-center">
                        <div className="mr-4">
                          <Image
                            src={`/placeholder.svg?height=50&width=50&text=${testimonial.name[0]}`}
                            width={50}
                            height={50}
                            alt={testimonial.name}
                            className="rounded-full"
                          />
                        </div>
                        <div>
                          <p className="font-semibold dark:text-white">{testimonial.name}</p>
                          <p className="text-sm text-muted-foreground dark:text-gray-400">{testimonial.role}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">{t('howItWorks')}</h2>
            <div className="max-w-3xl mx-auto">
              {[
                { step: 1, title: t('step1Title'), description: t('step1Desc') },
                { step: 2, title: t('step2Title'), description: t('step2Desc') },
                { step: 3, title: t('step3Title'), description: t('step3Desc') },
                { step: 4, title: t('step4Title'), description: t('step4Desc') },
              ].map((step) => (
                <motion.div
                  key={step.step}
                  className="flex items-start mb-8"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: step.step * 0.1 }}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center font-bold mr-4">
                    {step.step}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 dark:text-white">{step.title}</h3>
                    <p className="text-muted-foreground dark:text-gray-400">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-12">
              <Button size="lg">{t('tryItNow')}</Button>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-gray-50 dark:bg-gray-900 py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">{t('faq')}</h2>
            <div className="max-w-3xl mx-auto">
              {[
                { question: t('faq1Question'), answer: t('faq1Answer') },
                { question: t('faq2Question'), answer: t('faq2Answer') },
                { question: t('faq3Question'), answer: t('faq3Answer') },
                { question: t('faq4Question'), answer: t('faq4Answer') },
              ].map((faq, index) => (
                <motion.details
                  key={index}
                  className="mb-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <summary className="cursor-pointer p-4 font-semibold flex justify-between items-center dark:text-white">
                    {faq.question}
                    <ChevronDown className="h-5 w-5 text-muted-foreground dark:text-gray-400" />
                  </summary>
                  <p className="p-4 pt-0 text-muted-foreground dark:text-gray-300">{faq.answer}</p>
                </motion.details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">{t('appName')}</h3>
              <p className="text-sm text-gray-400">{t('footerTagline')}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('quickLinks')}</h4>
              <ul className="space-y-2">
                <li><Link href="#features" className="text-sm hover:text-blue-400 transition-colors">{t('features')}</Link></li>
                <li><Link href="#pricing" className="text-sm hover:text-blue-400 transition-colors">{t('pricing')}</Link></li>
                <li><Link href="#testimonials" className="text-sm hover:text-blue-400 transition-colors">{t('testimonials')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('legal')}</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-sm hover:text-blue-400 transition-colors">{t('privacyPolicy')}</Link></li>
                <li><Link href="#" className="text-sm hover:text-blue-400 transition-colors">{t('termsOfService')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('stayUpdated')}</h4>
              <form className="flex">
                <Input type="email" placeholder={t('enterEmail')} className="rounded-r-none" />
                <Button type="submit" className="rounded-l-none">{t('subscribe')}</Button>
              </form>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            © {new Date().getFullYear()} {t('appName')}. {t('allRightsReserved')}.
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {showCookieConsent && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed bottom-0 left-0 right-0 bg-gray-100 dark:bg-gray-800 p-4 shadow-lg"
          >
            <CookieConsent
              location="bottom"
              buttonText={t('acceptCookies')}
              declineButtonText={t('declineCookies')}
              cookieName="myAwesomeCookieName2"
              style={{ background: "transparent" }}
              buttonStyle={{ background: "#4F46E5", color: "white", fontSize: "13px" }}
              expires={150}
              onAccept={() => setShowCookieConsent(false)}
            >
              {t('cookieConsentMessage')} <Link href="/privacy-policy" className="underline">{t('privacyPolicy')}</Link>
            </CookieConsent>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}