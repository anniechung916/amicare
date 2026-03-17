import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Phone, Ban, ClipboardList, Bot, Swords, DollarSign,
  CheckCircle2, ArrowRight, ChevronDown, Star, Lock, Zap, Clock,
  TrendingUp, Heart, Users, MessageSquare, ChevronRight, Menu, X,
  FileText, AlertTriangle, ThumbsUp, BadgeCheck, Sparkles
} from 'lucide-react';

// --- Animated counter ---
function AnimatedNumber({ target, prefix = '', suffix = '', duration = 2000 }) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = Date.now();
          const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(target * eased));
            if (progress < 1) requestAnimationFrame(tick);
          };
          tick();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{prefix}{value.toLocaleString()}{suffix}</span>;
}

// --- Fade-in on scroll ---
function FadeIn({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// --- Navbar ---
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Shield size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">AmiCare</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => scrollTo('problem')} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">The Problem</button>
          <button onClick={() => scrollTo('how-it-works')} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">How It Works</button>
          <button onClick={() => scrollTo('estimate')} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Smart Estimate</button>
          <button onClick={() => scrollTo('pricing')} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Pricing</button>
          <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Dashboard</Link>
          <Link to="/signup" className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-full hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
            Get Started Free
          </Link>
        </div>
        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-3">
          <button onClick={() => scrollTo('problem')} className="block w-full text-left text-sm text-gray-700 py-2">The Problem</button>
          <button onClick={() => scrollTo('how-it-works')} className="block w-full text-left text-sm text-gray-700 py-2">How It Works</button>
          <button onClick={() => scrollTo('estimate')} className="block w-full text-left text-sm text-gray-700 py-2">Smart Estimate</button>
          <button onClick={() => scrollTo('pricing')} className="block w-full text-left text-sm text-gray-700 py-2">Pricing</button>
          <Link to="/login" className="block w-full text-left text-sm text-gray-700 py-2">Dashboard</Link>
          <Link to="/signup" className="block w-full px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-full text-center">Get Started Free</Link>
        </div>
      )}
    </nav>
  );
}

export default function LandingPage() {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      <Navbar />

      {/* ============ HERO ============ */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-40" />
        <div className="absolute bottom-0 left-10 w-72 h-72 bg-purple-100 rounded-full blur-3xl opacity-30" />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-6">
                <Sparkles size={14} /> AI-Powered Insurance Advocacy
              </div>
            </FadeIn>

            <FadeIn delay={100}>
              <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight">
                Never fight
                <br />
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">insurance again.</span>
              </h1>
            </FadeIn>

            <FadeIn delay={200}>
              <p className="mt-6 text-xl md:text-2xl text-gray-600 font-medium leading-relaxed">
                See any doctor you want. We'll get you reimbursed.
              </p>
            </FadeIn>

            <FadeIn delay={300}>
              <p className="mt-4 text-base text-gray-500 max-w-xl leading-relaxed">
                Out-of-network providers often mean better care, faster appointments, and the specialists you trust. Stop letting insurance networks limit your healthcare decisions. AmiCare handles the paperwork, the phone calls, the denials, and the appeals—so you don't have to.
              </p>
            </FadeIn>

            <FadeIn delay={400}>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/signup"
                  className="group px-8 py-4 bg-indigo-600 text-white text-base font-semibold rounded-full hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 hover:shadow-2xl hover:shadow-indigo-300 flex items-center justify-center gap-2"
                >
                  Get Started Free
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <button
                  onClick={() => scrollTo('how-it-works')}
                  className="px-8 py-4 bg-white text-gray-700 text-base font-semibold rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                  See How It Works
                  <ChevronDown size={18} />
                </button>
              </div>
            </FadeIn>

            <FadeIn delay={500}>
              <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-1.5"><Lock size={14} className="text-green-600" /> HIPAA Compliant</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-600" /> No upfront fees</span>
                <span className="flex items-center gap-1.5"><DollarSign size={14} className="text-green-600" /> 20% fee only when you get paid</span>
              </div>
            </FadeIn>
          </div>

          {/* Hero visual - floating claim card */}
          <FadeIn delay={300} className="hidden lg:block absolute right-8 top-32 w-[380px]">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Claim Approved</p>
                  <p className="text-xs text-gray-500">Out-of-network reimbursement</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Provider visit</span>
                  <span className="font-semibold">$1,400.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Insurance paid</span>
                  <span className="font-semibold text-green-600">$980.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Your cost</span>
                  <span className="font-semibold">$420.00</span>
                </div>
                <div className="h-px bg-gray-100" />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">AmiCare fee (20%)</span>
                  <span className="font-medium text-gray-600">$196.00</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-gray-700">You saved</span>
                  <span className="text-green-600">$784.00</span>
                </div>
              </div>
              <div className="mt-4 px-3 py-2 bg-green-50 rounded-lg text-xs text-green-700 flex items-center gap-2">
                <BadgeCheck size={14} /> Deposited to your account
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ============ SOCIAL PROOF BAR ============ */}
      <section className="py-12 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <FadeIn delay={0}>
              <p className="text-3xl md:text-4xl font-extrabold text-indigo-600">
                <AnimatedNumber target={2400} prefix="$" suffix="+" />
              </p>
              <p className="text-sm text-gray-500 mt-1">Avg. reimbursement recovered</p>
            </FadeIn>
            <FadeIn delay={100}>
              <p className="text-3xl md:text-4xl font-extrabold text-indigo-600">
                <AnimatedNumber target={94} suffix="%" />
              </p>
              <p className="text-sm text-gray-500 mt-1">Claim success rate</p>
            </FadeIn>
            <FadeIn delay={200}>
              <p className="text-3xl md:text-4xl font-extrabold text-indigo-600">
                <AnimatedNumber target={24} suffix="hrs" />
              </p>
              <p className="text-sm text-gray-500 mt-1">Smart Estimate delivery</p>
            </FadeIn>
            <FadeIn delay={300}>
              <p className="text-3xl md:text-4xl font-extrabold text-indigo-600">
                <AnimatedNumber target={0} prefix="$" />
              </p>
              <p className="text-sm text-gray-500 mt-1">Upfront cost to you</p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ============ PROBLEM SECTION ============ */}
      <section id="problem" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">The Problem</p>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                Why patients avoid<br />out-of-network care
              </h2>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              {
                icon: <AlertTriangle size={28} className="text-amber-500" />,
                bg: 'bg-amber-50',
                title: "You don't know what you'll pay",
                body: "Insurance companies make reimbursement impossible to predict. You're left guessing whether you'll owe $200 or $2,000.",
              },
              {
                icon: <Phone size={28} className="text-blue-500" />,
                bg: 'bg-blue-50',
                title: "Hours on hold with insurance",
                body: "Navigating phone trees, waiting on hold, getting transferred, repeating your member ID 12 times\u2014just to get a vague answer.",
              },
              {
                icon: <Ban size={28} className="text-red-500" />,
                bg: 'bg-red-50',
                title: "Claims get denied for no reason",
                body: "Even when you do everything right, insurers delay, deny, or underpay. Fighting appeals is exhausting\u2014so most people give up.",
              },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 150}>
                <div className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-lg transition-shadow h-full">
                  <div className={`w-14 h-14 ${item.bg} rounded-xl flex items-center justify-center mb-5`}>
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn>
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 md:p-10 text-white text-center">
              <p className="text-lg md:text-xl font-semibold leading-relaxed max-w-3xl mx-auto">
                <strong>Result:</strong> Billions in out-of-network benefits go unclaimed every year. Patients default to in-network providers—even when they'd prefer someone else.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how-it-works" className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">Simple Process</p>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">How AmiCare works</h2>
              <p className="mt-4 text-gray-500 text-lg max-w-2xl mx-auto">Four simple steps from visit to reimbursement. We handle the hard parts.</p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                icon: <ClipboardList size={28} className="text-indigo-600" />,
                title: 'Tell us about your visit',
                desc: 'Upload your insurance card and provider details. Planning a visit or already went? Either works.',
                color: 'from-indigo-500 to-indigo-600',
              },
              {
                step: '02',
                icon: <Bot size={28} className="text-purple-600" />,
                title: 'We predict your reimbursement',
                desc: 'Our AI calls your insurance company, extracts your benefits, and generates a Smart Estimate\u2122 within 24 hours.',
                color: 'from-purple-500 to-purple-600',
                callout: 'Expected: $840\u2013$1,020 | Your cost: $380\u2013$560',
              },
              {
                step: '03',
                icon: <Swords size={28} className="text-rose-600" />,
                title: 'We fight for your money',
                desc: 'We submit claims, call insurers daily, handle denials, file appeals, and don\u2019t stop until you\u2019re reimbursed.',
                color: 'from-rose-500 to-rose-600',
              },
              {
                step: '04',
                icon: <DollarSign size={28} className="text-green-600" />,
                title: 'You get paid',
                desc: 'When your reimbursement arrives, we take 20%. No reimbursement? No fee. We only win when you win.',
                color: 'from-green-500 to-green-600',
              },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 150}>
                <div className="relative bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-shadow h-full group">
                  <div className={`absolute -top-3 -left-1 text-xs font-bold text-white px-3 py-1 rounded-full bg-gradient-to-r ${item.color}`}>
                    Step {item.step}
                  </div>
                  <div className="mt-4 mb-4">{item.icon}</div>
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                  {item.callout && (
                    <div className="mt-4 px-3 py-2 bg-purple-50 rounded-lg text-xs font-mono text-purple-700 border border-purple-100">
                      {item.callout}
                    </div>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SMART ESTIMATE SHOWCASE ============ */}
      <section id="estimate" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <FadeIn>
              <div>
                <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">Smart Estimate\u2122</p>
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
                  Know what you'll pay—
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">before you go</span>
                </h2>
                <p className="mt-6 text-gray-600 leading-relaxed text-lg">
                  No more guessing. Our AI calls your insurance, navigates their phone system, extracts your exact benefits, and calculates what you'll owe—down to the dollar.
                </p>
                <div className="mt-8 space-y-4">
                  {[
                    'Deductible status & remaining amount',
                    'Coinsurance percentage for your plan',
                    'Out-of-pocket max tracking',
                    'Reimbursement range with confidence score',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={200}>
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                {/* Estimate card header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-indigo-200 text-xs font-medium">SMART ESTIMATE\u2122</p>
                      <p className="text-white font-semibold mt-0.5">Out-of-Network Visit</p>
                    </div>
                    <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                      <Sparkles size={12} className="text-yellow-300" />
                      <span className="text-white text-xs font-semibold">89% Confidence</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* Benefits extracted */}
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Benefits Verified</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Individual Deductible</p>
                        <p className="text-lg font-bold text-gray-900">$500</p>
                        <p className="text-xs text-green-600 font-medium">$380 met</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Coinsurance</p>
                        <p className="text-lg font-bold text-gray-900">70%</p>
                        <p className="text-xs text-gray-500">After deductible</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">OOP Maximum</p>
                        <p className="text-lg font-bold text-gray-900">$4,000</p>
                        <p className="text-xs text-gray-500">$1,200 used</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Reimbursement</p>
                        <p className="text-lg font-bold text-gray-900">UCR</p>
                        <p className="text-xs text-gray-500">Usual & Customary</p>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-gray-100" />

                  {/* Estimate results */}
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Your Estimate</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Provider charge</span>
                        <span className="text-sm font-semibold">$1,400.00</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Expected reimbursement</span>
                        <span className="text-sm font-semibold text-green-600">$840 – $1,020</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Your estimated cost</span>
                        <span className="text-sm font-semibold text-indigo-600">$380 – $560</span>
                      </div>
                    </div>
                  </div>

                  {/* Confidence bar */}
                  <div className="bg-indigo-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-indigo-700">Confidence Score</span>
                      <span className="text-xs font-bold text-indigo-700">89%</span>
                    </div>
                    <div className="w-full bg-indigo-200 rounded-full h-2">
                      <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '89%' }} />
                    </div>
                    <p className="text-xs text-indigo-600 mt-2">Based on verified benefits and historical claim data</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">Testimonials</p>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Patients love AmiCare</h2>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "I was quoted $3,200 for an MRI. AmiCare got me $2,100 back from insurance. I would have never filed that claim myself.",
                name: "Sarah M.",
                role: "Physical therapy patient",
                stars: 5,
              },
              {
                quote: "They called Cigna for me and sat on hold for 47 minutes. Got my benefits verified and told me exactly what I'd owe. Incredible service.",
                name: "Marcus R.",
                role: "Specialist visit",
                stars: 5,
              },
              {
                quote: "My claim was denied twice. AmiCare filed two appeals and got it reversed. I got a $1,800 check I'd completely given up on.",
                name: "Jennifer L.",
                role: "Out-of-network surgery",
                stars: 5,
              },
            ].map((t, i) => (
              <FadeIn key={i} delay={i * 150}>
                <div className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-lg transition-shadow h-full flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {[...Array(t.stars)].map((_, j) => (
                      <Star key={j} size={16} className="text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 leading-relaxed flex-1 italic">"{t.quote}"</p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section id="pricing" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">Simple Pricing</p>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">We only win when you win</h2>
              <p className="mt-4 text-gray-500 text-lg max-w-2xl mx-auto">
                No upfront costs. No subscriptions. No hidden fees. We take 20% of what we recover—that's it.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <div className="max-w-lg mx-auto bg-white rounded-2xl border-2 border-indigo-200 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-center">
                <p className="text-indigo-200 text-sm font-medium">THE ONLY PLAN YOU NEED</p>
                <div className="mt-2 flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-extrabold text-white">20%</span>
                  <span className="text-indigo-200 text-lg">of recovery</span>
                </div>
                <p className="text-indigo-200 text-sm mt-2">Only charged when you receive money</p>
              </div>
              <div className="px-8 py-8">
                <div className="space-y-4">
                  {[
                    'Free Smart Estimate\u2122 report',
                    'AI-powered insurance calls',
                    'Claim submission & tracking',
                    'Denial appeals (unlimited)',
                    'Dedicated case manager',
                    'Real-time status updates',
                    'HIPAA-compliant data handling',
                    'No fee if no reimbursement',
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                <Link
                  to="/signup"
                  className="mt-8 block w-full py-4 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 text-base text-center"
                >
                  Get Started Free
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">FAQ</p>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Common questions</h2>
            </div>
          </FadeIn>

          <div className="space-y-4">
            {[
              {
                q: 'What if my claim is denied?',
                a: "That's where we shine. We handle all appeals\u2014first, second, and external reviews. Our AI identifies the exact denial reason and builds a targeted appeal. Most denials are overturned on first appeal.",
              },
              {
                q: 'Do I need to go out-of-network to use AmiCare?',
                a: "AmiCare is specifically designed for out-of-network visits, which is where patients typically struggle most with insurance. If you're going in-network, your provider usually handles claims directly.",
              },
              {
                q: 'How long does the process take?',
                a: "Smart Estimates are delivered within 24 hours. Claim submission happens immediately after your visit. Reimbursement timelines depend on your insurer, but we follow up daily and most claims are resolved within 30\u201360 days.",
              },
              {
                q: 'Is my data secure?',
                a: "Absolutely. All patient data is encrypted at rest and in transit. We're fully HIPAA compliant. Your information is never shared with third parties.",
              },
              {
                q: 'What if I don\'t get reimbursed?',
                a: 'You pay nothing. Zero. Our 20% fee only applies when money hits your account. If the insurance company won\'t pay, we don\'t get paid either.',
              },
            ].map((faq, i) => (
              <FadeIn key={i} delay={i * 100}>
                <FAQItem question={faq.q} answer={faq.a} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section id="cta-final" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/10 rounded-full blur-3xl" />

              <div className="relative">
                <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                  Stop leaving money on the table.
                </h2>
                <p className="mt-4 text-indigo-200 text-lg max-w-2xl mx-auto">
                  Join thousands of patients who chose the doctor they wanted—and got reimbursed. Start your free estimate today.
                </p>

                <div className="mt-8">
                  <WaitlistForm />
                </div>

                <p className="mt-6 text-indigo-300 text-sm">
                  No credit card required. Get your Smart Estimate\u2122 in 24 hours.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Shield size={18} className="text-white" />
                </div>
                <span className="text-lg font-bold text-white">AmiCare</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                AI-powered insurance advocacy. We fight so you don't have to.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Product</h4>
              <div className="space-y-2">
                <button onClick={() => scrollTo('how-it-works')} className="block text-gray-400 text-sm hover:text-white transition-colors">How It Works</button>
                <button onClick={() => scrollTo('estimate')} className="block text-gray-400 text-sm hover:text-white transition-colors">Smart Estimate</button>
                <button onClick={() => scrollTo('pricing')} className="block text-gray-400 text-sm hover:text-white transition-colors">Pricing</button>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Company</h4>
              <div className="space-y-2">
                <a href="#" className="block text-gray-400 text-sm hover:text-white transition-colors">About</a>
                <a href="#" className="block text-gray-400 text-sm hover:text-white transition-colors">Blog</a>
                <a href="#" className="block text-gray-400 text-sm hover:text-white transition-colors">Careers</a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Legal</h4>
              <div className="space-y-2">
                <a href="#" className="block text-gray-400 text-sm hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="block text-gray-400 text-sm hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="block text-gray-400 text-sm hover:text-white transition-colors">HIPAA Compliance</a>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-500 text-sm">&copy; 2026 AmiCare. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- FAQ Accordion Item ---
function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-900 pr-4">{question}</span>
        <ChevronDown
          size={18}
          className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-6 pb-5">
          <p className="text-gray-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

// --- Waitlist / Email Capture Form ---
function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-4 rounded-full">
        <CheckCircle2 size={20} className="text-green-300" />
        <span className="text-white font-medium">You're on the list! We'll be in touch soon.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
        className="flex-1 px-5 py-4 rounded-full text-gray-900 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
      />
      <button
        type="submit"
        className="px-8 py-4 bg-white text-indigo-700 font-bold rounded-full hover:bg-gray-100 transition-colors text-base shadow-lg"
      >
        Get My Estimate
      </button>
    </form>
  );
}
