import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Globe,
  MessageCircle,
  Mail,
  ChevronRight,
  Clock,
  CheckCircle2,
  Send,
  Loader2,
  Users,
  ChevronDown,
  Moon,
  Sun,
  ArrowUp,
  RefreshCw,
  Facebook,
  Twitter,
  Instagram,
  Youtube
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { LANGUAGES, Language, PrayerPoint } from './types';
import { generateSamplePrayerPoint } from './services/geminiService';
import { translations } from './translations';

// Localized WhatsApp Group Links
const WHATSAPP_GROUP_LINKS: Record<Language, string> = {
  'English': 'https://chat.whatsapp.com/ExampleEnglish',
  'Hindi': 'https://chat.whatsapp.com/ExampleHindi',
  'French': 'https://chat.whatsapp.com/ExampleFrench',
  'German': 'https://chat.whatsapp.com/ExampleGerman',
  'Portuguese': 'https://chat.whatsapp.com/ExamplePortuguese',
  'Spanish': 'https://chat.whatsapp.com/ExampleSpanish',
  'Italian': 'https://chat.whatsapp.com/ExampleItalian',
  'Japanese': 'https://chat.whatsapp.com/ExampleJapanese',
  'Arabic': 'https://chat.whatsapp.com/ExampleArabic',
  'Chinese': 'https://chat.whatsapp.com/ExampleChinese',
};

const FloatingParticles: React.FC<{ count?: number; color?: string; blur?: string; speedRange?: [number, number] }> = ({
  count = 8,
  color = "bg-orange-400",
  blur = "blur-[80px]",
  speedRange = [25, 45]
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute ${color} rounded-full ${blur}`}
          initial={{
            width: Math.random() * 200 + 100,
            height: Math.random() * 200 + 100,
            x: Math.random() * 100 + "%",
            y: Math.random() * 100 + "%",
            opacity: Math.random() * 0.4 + 0.1
          }}
          animate={{
            x: [
              (Math.random() * 20 - 10) + "%",
              (Math.random() * 100) + "%",
              (Math.random() * 20 + 80) + "%",
            ],
            y: [
              (Math.random() * 100) + "%",
              (Math.random() * 100) + "%",
              (Math.random() * 100) + "%",
            ],
            scale: [1, 1.2, 0.9, 1.1, 1],
          }}
          transition={{
            duration: Math.random() * (speedRange[1] - speedRange[0]) + speedRange[0],
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

const App: React.FC = () => {
  const [selectedLang, setSelectedLang] = useState<Language>('English');
  const [samplePrayer, setSamplePrayer] = useState<PrayerPoint | null>(null);
  const [isLoadingPrayer, setIsLoadingPrayer] = useState(false);
  const [showMobileLang, setShowMobileLang] = useState(false);
  const [refreshCooldown, setRefreshCooldown] = useState(false);
  const debounceTimerRef = useRef<number | null>(null);

  // Theme state initialized from localStorage
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [showScrollTop, setShowScrollTop] = useState(false);

  // Join Form State
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [formErrors, setFormErrors] = useState<{ email?: string, phone?: string }>({});
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactErrors, setContactErrors] = useState<{ email?: string }>({});
  const [contactStatus, setContactStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string) => phone.replace(/\D/g, '').length >= 10;

  const t = useMemo(() => {
    const base = translations['English'];
    const current = translations[selectedLang] || {};
    const merge = (b: any, c: any) => {
      const result = { ...b };
      for (const key in c) {
        if (c[key] && typeof c[key] === 'object' && !Array.isArray(c[key])) {
          result[key] = { ...b[key], ...c[key] };
        } else if (c[key] !== undefined) {
          result[key] = c[key];
        }
      }
      return result;
    };
    return merge(base, current);
  }, [selectedLang]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (root) {
      if (isDarkMode) {
        root.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        root.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchPrayer = async (lang: Language) => {
    // If we're already loading or in cooldown, ignore
    if (isLoadingPrayer) return;

    setIsLoadingPrayer(true);
    try {
      const prayer = await generateSamplePrayerPoint(lang);
      if (prayer) {
        setSamplePrayer(prayer);
      }
    } catch (err) {
      console.error("Prayer fetch error", err);
    } finally {
      setIsLoadingPrayer(false);
    }
  };

  useEffect(() => {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      fetchPrayer(selectedLang);
    }, 400);

    return () => {
      if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
    };
  }, [selectedLang]);

  const handleManualRefresh = () => {
    if (refreshCooldown) return;
    setRefreshCooldown(true);
    fetchPrayer(selectedLang);
    setTimeout(() => setRefreshCooldown(false), 5000);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { email?: string, phone?: string } = {};
    if (!validateEmail(email)) errors.email = "Please enter a valid email address.";
    if (!validatePhone(phone)) errors.phone = "Please enter a valid phone number.";
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setFormStatus('submitting');
    setTimeout(() => setFormStatus('success'), 1200);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(contactEmail)) {
      setContactErrors({ email: "Please enter a valid email address." });
      return;
    }
    setContactErrors({});
    setContactStatus('submitting');
    setTimeout(() => {
      setContactStatus('success');
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    }, 1200);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden selection:bg-orange-100 dark:selection:bg-orange-900 selection:text-orange-900 dark:selection:text-orange-100 transition-colors duration-500">
      <motion.header
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex justify-between items-center h-20">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-orange-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg transition-transform group-hover:rotate-12">P</div>
            <span className="text-lg md:text-xl lg:text-2xl font-black tracking-tighter font-heavy uppercase">Pray4India</span>
          </motion.div>

          <nav className="hidden lg:flex gap-10 items-center">
            <button onClick={() => scrollToSection('how-it-works')} className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-500 transition-colors uppercase tracking-widest">{t.nav.how}</button>
            <button onClick={() => scrollToSection('benefits')} className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-500 transition-colors uppercase tracking-widest">{t.nav.benefits}</button>
            <button onClick={() => scrollToSection('contact')} className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-500 transition-colors uppercase tracking-widest">{t.nav.contact}</button>
            <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2"></div>
            <div className="relative group">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                <Globe className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-bold uppercase">{selectedLang}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>
              <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-2 grid grid-cols-1 gap-1">
                {LANGUAGES.map(lang => (
                  <button key={lang} onClick={() => setSelectedLang(lang)} className={`px-4 py-2 text-left text-sm font-bold rounded-xl transition-all ${selectedLang === lang ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                    {lang}
                  </button>
                ))}
              </div>
            </div>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all">
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => scrollToSection('join')} className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-sm font-bold rounded-xl shadow-lg uppercase tracking-widest">
              {t.nav.join}
            </motion.button>
          </nav>

          <div className="flex lg:hidden items-center gap-2">
            <button onClick={() => setShowMobileLang(!showMobileLang)} className="p-2 bg-slate-100 dark:bg-slate-900 rounded-xl text-orange-600 border border-slate-200 dark:border-slate-800">
              <Globe className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 bg-slate-100 dark:bg-slate-900 rounded-xl text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
              {isDarkMode ? <Sun className="w-4 h-4 md:w-5 md:h-5" /> : <Moon className="w-4 h-4 md:w-5 md:h-5" />}
            </button>
            <button onClick={() => scrollToSection('join')} className="p-2 bg-orange-600 rounded-xl text-white">
              <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showMobileLang && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-4 grid grid-cols-2 gap-2">
                {LANGUAGES.map(lang => (
                  <button key={lang} onClick={() => { setSelectedLang(lang); setShowMobileLang(false); }} className={`px-4 py-3 text-sm font-bold rounded-xl text-center border transition-all ${selectedLang === lang ? 'bg-orange-600 text-white border-orange-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-700'}`}>
                    {lang}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <section className="relative min-h-screen pt-32 pb-20 flex items-center overflow-hidden">
        <FloatingParticles count={10} color="bg-orange-400" blur="blur-[80px]" speedRange={[30, 50]} />
        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="lg:flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-orange-600/10 text-orange-600 dark:text-orange-400 rounded-full text-xs font-bold mb-8 uppercase tracking-[0.2em]">
              <span className="w-2.5 h-2.5 bg-orange-600 dark:bg-orange-500 rounded-full animate-pulse"></span>
              {t.hero.tag}
            </div>
            <h1 className="text-5xl lg:text-8xl font-serif font-bold text-slate-900 dark:text-white leading-[1.05] mb-8 uppercase tracking-tighter">
              {t.hero.title} <br />
              <span className="text-orange-600 dark:text-orange-500 italic block mt-2">{t.hero.titleItalic}</span>
            </h1>
            <p className="text-lg lg:text-2xl text-slate-600 dark:text-slate-400 mb-12 max-w-xl leading-relaxed font-medium mx-auto lg:mx-0">{t.hero.desc}</p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start w-full sm:w-auto">
              <button onClick={() => scrollToSection('join')} className="w-full sm:w-auto px-10 py-5 bg-orange-600 text-white font-bold rounded-2xl shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest">
                {t.hero.ctaPrimary} <ChevronRight className="w-6 h-6" />
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="w-full sm:w-auto px-10 py-5 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold rounded-2xl border border-slate-200 dark:border-slate-800 uppercase tracking-widest">
                {t.hero.ctaSecondary}
              </button>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }} className="lg:flex-1 w-full max-w-xl aspect-square relative">
            <div className="w-full h-full rounded-[4rem] bg-gradient-to-br from-orange-500 to-orange-700 shadow-2xl flex flex-col items-center justify-center p-12 text-center text-white/90">
              <Users className="w-16 h-16 text-white mb-8" />
              <p className="text-sm font-bold mb-2 uppercase tracking-[0.2em] opacity-80">{t.hero.statsLabel}</p>
              <p className="text-5xl lg:text-7xl font-serif font-bold uppercase">{t.hero.statsValue}</p>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="how-it-works" className="py-24 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-6xl font-bold mb-6 uppercase tracking-tighter">{t.how.title}</h2>
            <p className="text-lg lg:text-2xl text-slate-500 dark:text-slate-400 max-w-3xl mx-auto">{t.how.desc}</p>
          </div>
          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="grid md:grid-cols-3 gap-10">
            {[
              { icon: <Globe />, title: t.how.step1, text: t.how.step1Desc },
              { icon: <Clock />, title: t.how.step2, text: t.how.step2Desc },
              { icon: <Send />, title: t.how.step3, text: t.how.step3Desc }
            ].map((step, idx) => (
              <motion.div variants={itemVariants} key={idx} className="p-10 bg-white dark:bg-slate-800 rounded-[3.5rem] shadow-xl border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-orange-600/10 text-orange-600 rounded-2xl flex items-center justify-center mb-8">{step.icon}</div>
                <h3 className="text-xl font-bold mb-4 uppercase">{step.title}</h3>
                <p className="text-lg text-slate-500 dark:text-slate-400">{step.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-slate-950 text-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl lg:text-6xl font-bold mb-8 uppercase tracking-tighter">{t.preview.title}</h2>
              <p className="text-lg lg:text-2xl text-slate-400 mb-12">{t.preview.desc}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {LANGUAGES.map(lang => (
                  <button key={lang} onClick={() => setSelectedLang(lang)} className={`px-5 py-4 rounded-xl text-xs font-bold border transition-all uppercase ${selectedLang === lang ? 'bg-orange-600 text-white border-orange-500 shadow-xl' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}>
                    {lang}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-10 lg:p-14 rounded-[4rem] shadow-2xl min-h-[500px] flex flex-col">
              <div className="flex justify-between items-center mb-10 border-b border-white/10 pb-6">
                <div className="flex items-center gap-3"><div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center font-bold">P</div><span className="uppercase tracking-tighter text-sm font-bold">Preview</span></div>
                <button onClick={handleManualRefresh} disabled={isLoadingPrayer || refreshCooldown} className={`p-2 rounded-full transition-all ${refreshCooldown ? 'text-slate-600' : 'text-orange-500 hover:bg-white/10'}`}>
                  <RefreshCw className={`w-5 h-5 ${isLoadingPrayer ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <AnimatePresence mode="wait">
                {isLoadingPrayer && !samplePrayer ? (
                  <motion.div key="loading" className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="w-16 h-16 animate-spin mb-8 text-orange-500" />
                    <p className="text-sm font-bold uppercase tracking-widest">{t.preview.loading.replace('{lang}', selectedLang)}</p>
                  </motion.div>
                ) : (
                  <motion.div key={selectedLang} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 flex-1 flex flex-col">
                    <div>
                      <div className="text-orange-500 text-sm font-bold tracking-widest mb-4 uppercase">{samplePrayer?.region}</div>
                      <h4 className="text-3xl lg:text-5xl font-bold leading-tight uppercase">{samplePrayer?.topic}</h4>
                    </div>
                    <div className="p-10 bg-white/5 rounded-[2.5rem] border-l-[10px] border-orange-600 italic text-slate-200 text-2xl font-medium shadow-inner">"{samplePrayer?.scripture}"</div>
                    <p className="text-xl lg:text-3xl text-slate-300 leading-relaxed font-light">{samplePrayer?.prayerText}</p>
                    <a href={WHATSAPP_GROUP_LINKS[selectedLang]} target="_blank" className="mt-auto inline-flex w-full sm:w-auto px-10 py-5 bg-green-600 text-white font-bold rounded-2xl shadow-xl items-center justify-center gap-4 text-base uppercase tracking-widest">
                      <MessageCircle className="w-6 h-6" /> {t.preview.joinGroup.replace('{lang}', selectedLang)}
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      <section id="benefits" className="py-24 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-6xl font-bold mb-6 uppercase tracking-tighter">{t.benefits.title}</h2>
            <p className="text-lg lg:text-2xl text-slate-500 dark:text-slate-400 max-w-3xl mx-auto">{t.benefits.desc}</p>
          </div>
          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[
              { icon: <MessageCircle className="text-green-600" />, title: t.benefits.b1, desc: t.benefits.b1Desc },
              { icon: <Mail className="text-blue-600" />, title: t.benefits.b2, desc: t.benefits.b2Desc },
              { icon: <Clock className="text-purple-600" />, title: t.benefits.b3, desc: t.benefits.b3Desc },
              { icon: <Globe className="text-orange-600" />, title: t.benefits.b4, desc: t.benefits.b4Desc },
              { icon: <CheckCircle2 className="text-teal-600" />, title: t.benefits.b5, desc: t.benefits.b5Desc },
              { icon: <Users className="text-indigo-600" />, title: t.benefits.b6, desc: t.benefits.b6Desc }
            ].map((benefit, i) => (
              <motion.div variants={itemVariants} key={i} className="p-12 rounded-[3.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 transition-all flex flex-col group hover:shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shadow-md mb-8 group-hover:scale-110 transition-all">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold mb-4 uppercase">{benefit.title}</h3>
                <p className="text-base lg:text-lg text-slate-500 dark:text-slate-400 leading-relaxed flex-1">{benefit.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="join" className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] md:rounded-[4rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
            <div className="p-6 md:p-20 text-center bg-slate-900 dark:bg-black text-white">
              <h2 className="text-3xl lg:text-5xl font-bold mb-6 tracking-tighter uppercase">{t.join.title}</h2>
              <p className="text-lg lg:text-2xl text-slate-400 max-w-2xl mx-auto">{t.join.desc}</p>
            </div>
            <div className="p-5 md:p-24">
              <AnimatePresence mode="wait">
                {formStatus === 'success' ? (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-10">
                    <CheckCircle2 className="w-24 h-24 text-green-600 mx-auto mb-10" />
                    <h3 className="text-3xl font-bold dark:text-white uppercase">{t.join.successTitle}</h3>
                    <p className="text-xl text-slate-500 dark:text-slate-400 mb-12 max-w-lg mx-auto">{t.join.successDesc}</p>
                    <button onClick={() => setFormStatus('idle')} className="text-orange-600 font-bold hover:underline text-sm uppercase">{t.join.successAction}</button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleJoinSubmit} className="space-y-6 md:space-y-10">
                    <div className="grid sm:grid-cols-2 gap-6 md:gap-10">
                      <div className="space-y-4">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">{t.join.langLabel}</label>
                        <select className="w-full px-5 py-4 md:px-8 md:py-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 dark:text-white focus:border-orange-600 outline-none font-bold uppercase" value={selectedLang} onChange={(e) => setSelectedLang(e.target.value as Language)} required>
                          {LANGUAGES.map(lang => (
                            <option key={lang} value={lang}>{lang}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-4">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">{t.join.phoneLabel}</label>
                        <input type="tel" placeholder="+91 00000 00000" className={`w-full px-5 py-4 md:px-8 md:py-5 rounded-2xl border-2 bg-slate-50 dark:bg-slate-950 dark:text-white focus:border-orange-600 outline-none font-bold ${formErrors.phone ? 'border-red-500' : 'border-slate-100 dark:border-slate-800'}`} value={phone} onChange={(e) => setPhone(e.target.value)} required />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">{t.join.emailLabel}</label>
                      <input type="email" placeholder="you@example.com" className={`w-full px-5 py-4 md:px-8 md:py-5 rounded-2xl border-2 bg-slate-50 dark:bg-slate-950 dark:text-white focus:border-orange-600 outline-none font-bold ${formErrors.email ? 'border-red-500' : 'border-slate-100 dark:border-slate-800'}`} value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <button type="submit" disabled={formStatus === 'submitting'} className="w-full py-4 md:py-6 bg-orange-600 text-white font-bold rounded-2xl hover:bg-orange-700 transition-all shadow-xl flex items-center justify-center gap-4 text-lg lg:text-xl uppercase tracking-widest">
                      {formStatus === 'submitting' ? <Loader2 className="w-8 h-8 animate-spin" /> : <Send className="w-8 h-8" />} {formStatus === 'submitting' ? t.join.submitting : t.join.submit}
                    </button>
                  </form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-24 items-start">
            <div className="space-y-12">
              <h2 className="text-4xl lg:text-6xl font-bold text-slate-900 dark:text-white leading-tight uppercase tracking-tighter">{t.contact.title}</h2>
              <p className="text-xl lg:text-3xl text-slate-500 dark:text-slate-400 font-medium">{t.contact.desc}</p>
              <div className="space-y-12 pt-14 border-t border-slate-100 dark:border-slate-800 flex items-center gap-10">
                <Mail className="w-10 h-10 text-orange-600" />
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.contact.support}</div>
                  <a href="mailto:support@pray4india.org" className="text-xl lg:text-3xl font-bold uppercase break-all">support@pray4india.org</a>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-5 md:p-12 lg:p-20 rounded-[2.5rem] md:rounded-[4rem] border-2 border-white dark:border-slate-800 shadow-2xl">
              <form onSubmit={handleContactSubmit} className="space-y-6 md:space-y-10">
                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">{t.contact.name}</label>
                  <input type="text" className="w-full px-5 py-4 md:px-8 md:py-5 rounded-2xl border-2 border-white dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-white focus:border-orange-600 outline-none font-bold" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
                </div>
                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">{t.contact.email}</label>
                  <input type="email" className={`w-full px-5 py-4 md:px-8 md:py-5 rounded-2xl border-2 bg-white dark:bg-slate-950 dark:text-white focus:border-orange-600 outline-none font-bold ${contactErrors.email ? 'border-red-500' : 'border-white dark:border-slate-800'}`} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
                </div>
                <textarea rows={5} placeholder={t.contact.message} className="w-full px-5 py-4 md:px-8 md:py-5 rounded-2xl border-2 border-white dark:border-slate-800 bg-white dark:bg-slate-950 dark:text-white focus:border-orange-600 outline-none font-bold resize-none" value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} required></textarea>
                <button type="submit" disabled={contactStatus === 'submitting'} className="w-full py-4 md:py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold rounded-2xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all flex items-center justify-center gap-4 uppercase tracking-widest text-lg lg:text-xl">
                  {contactStatus === 'submitting' ? <Loader2 className="w-8 h-8 animate-spin" /> : <Send className="w-8 h-8" />} {t.contact.submit}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 dark:bg-black text-slate-500 py-12 md:py-24 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-16 mb-24">
            <div className="col-span-1 lg:col-span-2">
              <div className="flex items-center gap-5 mb-12 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <div className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center text-white font-black text-4xl shadow-2xl group-hover:rotate-12 group-hover:scale-110 transition-all">P</div>
                <span className="text-3xl lg:text-5xl font-bold text-white tracking-tighter uppercase">Pray4India</span>
              </div>
              <p className="text-xl lg:text-2xl text-slate-400 max-w-sm leading-relaxed font-light italic opacity-80">{t.footer.desc}</p>
            </div>
            <div>
              <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-12">{t.nav.how}</h4>
              <ul className="space-y-6 text-xl font-bold uppercase">
                <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-all hover:translate-x-3">{t.nav.process}</button></li>
                <li><button onClick={() => scrollToSection('benefits')} className="hover:text-white transition-all hover:translate-x-3">{t.nav.perks}</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-12">{t.footer.connect || "Connect"}</h4>
              <div className="flex gap-4">
                <a href="#" className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-orange-600 flex items-center justify-center transition-all text-white group">
                  <Facebook className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </a>
                <a href="#" className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-orange-600 flex items-center justify-center transition-all text-white group">
                  <Twitter className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </a>
                <a href="#" className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-orange-600 flex items-center justify-center transition-all text-white group">
                  <Instagram className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </a>
                <a href="#" className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-orange-600 flex items-center justify-center transition-all text-white group">
                  <Youtube className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </a>
              </div>
            </div>
          </div>
          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-12 text-sm font-bold uppercase tracking-widest">
            <p>© {new Date().getFullYear()} {t.footer.copyright}</p>
            <div className="flex gap-14">
              <div className="flex items-center gap-4"><Users className="w-6 h-6 text-orange-600" /> 12,400+ {t.footer.intercessors}</div>
              <div className="flex items-center gap-4 text-green-500"><div className="w-3.5 h-3.5 bg-green-500 rounded-full animate-pulse" /> {t.footer.streamActive}</div>
            </div>
          </div>
        </div>
      </footer >

      <AnimatePresence>
        {showScrollTop && (
          <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="fixed bottom-10 right-10 z-[60] w-14 h-14 bg-orange-600 text-white rounded-2xl shadow-2xl flex items-center justify-center group" aria-label="Scroll to top">
            <ArrowUp className="w-7 h-7 group-hover:-translate-y-2 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>
    </div >
  );
}

export default App;