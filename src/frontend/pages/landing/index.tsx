import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Shield,
  Zap,
  Layers,
  Activity,
  Clock,
  TrendingUp,
  Menu,
  FileText,
  Target,
  Star,
  Cpu,
  BarChart3,
} from 'lucide-react';
import { PLANS_DATA } from '@/frontend/constants';
import { LANDING_COPY } from '@/frontend/content';
import { ManifestoModal } from '@/frontend/components/modals/ManifestoModal';
import { WhatIsDetailModal } from '@/frontend/components/modals/WhatIsDetailModal';
import { ContactModal } from '@/frontend/components/modals/ContactModal';
import { ArmoCreditsModal } from '@/frontend/components/modals/ArmoCreditsModal';
import { ArchitectureDetailModal } from '@/frontend/components/modals/ArchitectureDetailModal';
import { ASSETS } from '@/frontend/assets';

interface LandingPageProps {
  onLogin: () => void;
  onSignUp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onSignUp }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modal states
  const [showManifesto, setShowManifesto] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showArmoCredits, setShowArmoCredits] = useState(false);
  const [whatIsDetail, setWhatIsDetail] = useState<{
    type: 'WHAT' | 'HOW' | 'RESULT';
    content: typeof LANDING_COPY.WHAT_IS.WHAT;
  } | null>(null);
  const [activeConstructId, setActiveConstructId] = useState<
    keyof typeof LANDING_COPY.CORE_CONSTRUCTS | null
  >(null);

  // Animation States
  const [latency, setLatency] = useState(24);
  const [arsBars, setArsBars] = useState([40, 60, 45, 70, 50, 80, 75]);
  const [logs, setLogs] = useState<string[]>([
    '✔ Decision-Audit passed',
    '→ Encrypting handshake...',
    '→ Verifying AEM hash...',
    '✔ Proof-of-Control valid',
  ]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animation Effects
  useEffect(() => {
    // Latency Animation
    const latencyInterval = setInterval(() => {
      setLatency((prev) => {
        const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
        const newVal = prev + change;
        return newVal < 15 ? 15 : newVal > 35 ? 35 : newVal;
      });
    }, 2000);

    // ARS Bars Animation
    const barsInterval = setInterval(() => {
      setArsBars((prev) => prev.map(() => Math.floor(Math.random() * 60) + 20)); // 20-80%
    }, 800);

    // Logs Animation
    const logMessages = [
      '→ Optimizing neural paths...',
      '✔ Governance check: OK',
      '→ Syncing node state...',
      '✔ Policy v2.4 verified',
      '→ Awaiting input...',
      '✔ Protocol handshake valid',
      '→ Refreshing cache...',
      '✔ Audit trail secured',
    ];

    const logsInterval = setInterval(() => {
      const randomMsg = logMessages[Math.floor(Math.random() * logMessages.length)];
      setLogs((prev) => {
        const newLogs = [...prev, randomMsg];
        return newLogs.slice(-4); // Keep last 4
      });
    }, 2500);

    return () => {
      clearInterval(latencyInterval);
      clearInterval(barsInterval);
      clearInterval(logsInterval);
    };
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const navHeight = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navHeight;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F0F0EE] font-sans text-stone-900 selection:bg-[#f5d47c] selection:text-stone-900 overflow-x-hidden">
      <style>{`
        .force-gold-icon {
          color: #f5d47c !important;
          stroke: #f5d47c !important;
          filter: none !important;
          opacity: 1 !important;
        }
        .force-gold-text {
          color: #f5d47c !important;
          filter: none !important;
        }
        .architecture-card:hover .architecture-icon {
          background: #1a1a1a !important;
          color: #f5d47c !important;
          box-shadow: 0 0 30px rgba(245, 212, 124, 0.2) !important;
          border-color: #f5d47c !important;
        }
        .architecture-icon-container {
          position: relative;
          overflow: hidden;
        }
        .architecture-logo-bg {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80%;
          height: 80%;
          opacity: 0.05;
          pointer-events: none;
          transition: all 0.5s ease;
        }
        .architecture-card:hover .architecture-logo-bg {
          opacity: 0.15;
          scale: 1.2;
        }
      `}</style>
      {/* --- NAVBAR --- */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${scrolled ? 'bg-[#F0F0EE]/95 backdrop-blur-xl py-5 border-stone-200 shadow-sm' : 'py-8 bg-[#F0F0EE]/80 backdrop-blur-sm border-transparent'}`}
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 flex items-center justify-between">
          <div className="flex items-center gap-16">
            <div
              className="flex items-center cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                e.key === 'Enter' && window.scrollTo({ top: 0, behavior: 'smooth' })
              }
              aria-label="Scroll to top"
            >
              <img src={ASSETS.logos.full} alt="Armonyco" className="h-10 w-auto" />
            </div>

            <div className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-stone-500">
              <button
                onClick={() => scrollToSection('what-is')}
                className="hover:text-[#f5d47c] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(245,212,124,0.5)]"
              >
                DecisionOS™
              </button>
              <button
                onClick={() => scrollToSection('architecture')}
                className="hover:text-[#f5d47c] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(245,212,124,0.5)]"
              >
                Architecture
              </button>
              <button
                onClick={() => scrollToSection('results')}
                className="hover:text-[#f5d47c] transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(245,212,124,0.5)]"
              >
                Results
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onLogin}
              className="hidden md:block text-[11px] font-bold uppercase tracking-widest text-stone-500 hover:text-stone-900 transition-colors px-3 py-2"
            >
              Log in
            </button>
            <button
              onClick={onSignUp}
              className="bg-stone-900 hover:bg-stone-800 text-white px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg flex items-center gap-2"
            >
              {LANDING_COPY.HERO.PRIMARY_CTA}
            </button>
            <button
              className="md:hidden text-stone-900 p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* (1) HERO */}
      <div className="pt-40 px-4 md:px-6 pb-12">
        <div className="max-w-[1400px] mx-auto bg-stone-900 rounded-[3rem] p-8 md:p-16 lg:p-20 text-white relative overflow-hidden shadow-2xl min-h-[80vh] flex flex-col justify-center border border-stone-800">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-b from-stone-800/30 to-transparent rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none"></div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10 items-center">
            <div className="space-y-10">
              <div className="inline-flex items-center gap-3">
                <div className="h-px w-8 gold-gradient"></div>
                <span className="text-[11px] font-bold tracking-widest uppercase text-gold-gradient">
                  Powered by DecisionOS™
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-[3.6rem] font-serif text-white leading-[1.1] mb-8 tracking-tighter max-w-6xl">
                The first DecisionOS™ <br /> for flexible hospitality.
              </h1>

              <p className="text-xl text-stone-400 max-w-xl leading-relaxed font-light">
                {LANDING_COPY.HERO.SUBHEADLINE}
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <button
                  onClick={onSignUp}
                  className="gold-gradient hover:opacity-90 text-stone-900 px-10 py-4 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-gold-glow hover:shadow-gold-glow-lg hover:-translate-y-1 hover:scale-[1.02]"
                >
                  {LANDING_COPY.HERO.PRIMARY_CTA}
                </button>
                <button
                  onClick={() => setShowManifesto(true)}
                  className="text-white hover:text-gold-start px-6 py-4 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors"
                >
                  {LANDING_COPY.HERO.SECONDARY_CTA} <ArrowRight size={16} />
                </button>
              </div>

              {/* Trusted By Social Proof */}
              <div className="mt-12 flex flex-col items-start gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {ASSETS.socials.map((src, i) => (
                      <div
                        key={i}
                        className="w-12 h-12 rounded-full border-[3px] border-stone-950 bg-stone-900 overflow-hidden shadow-lg"
                      >
                        <img src={src} alt="Operator" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-0.5 text-left">
                  <div className="text-sm text-stone-200 font-medium tracking-wide">
                    Trusted by <span className="text-gold-gradient font-bold">Verified</span>{' '}
                    Property Managers
                  </div>
                  <p className="text-xs text-stone-500 font-light">
                    Governing decisions, not just automation.
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: The Living Scene */}
            <div className="relative h-[550px] w-full hidden lg:block">
              {/* Background Element: ARS System */}
              <div className="absolute top-0 right-10 w-[280px] opacity-40 scale-90 blur-[1px]">
                <div className="bg-stone-900/60 border border-stone-800/50 backdrop-blur-sm rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded bg-stone-800 flex items-center justify-center text-stone-500">
                      <Shield size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-stone-500 uppercase">
                        ARS - Armonyco Reliability System™
                      </div>
                      <div className="text-[10px] text-stone-700">Governance Substrate</div>
                    </div>
                  </div>
                  <div className="h-12 flex items-end justify-between gap-1 opacity-50">
                    {arsBars.map((h, i) => (
                      <div
                        key={i}
                        className="w-full bg-stone-700 rounded-t transition-all duration-700 ease-in-out"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Main Element: Amelia (Decision Guardian) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px]">
                <div className="relative group">
                  {/* Glow Effect */}
                  <div className="absolute -inset-1 bg-gradient-to-tr from-gold-start via-gold-mid-2 to-white opacity-20 blur-xl rounded-[2rem]" />

                  <div className="relative bg-[#0A0A0A] rounded-[1.8rem] border border-white/10 backdrop-blur-2xl shadow-2xl overflow-hidden p-1.5">
                    <div className="bg-stone-900/50 rounded-[1.4rem] p-6 border border-white/5">
                      <div className="flex justify-between items-start mb-8">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-stone-800 to-black border border-stone-700 flex items-center justify-center shadow-[0_0_25px_rgba(245,212,124,0.4)]">
                            <Shield size={32} color="#f5d47c" strokeWidth={2.5} fill="#f5d47c" fillOpacity={0.2} className="force-gold-icon drop-shadow-[0_0_15px_rgba(245,212,124,0.6)]" />
                          </div>
                          <div>
                            <h3 className="text-white font-bold text-xl tracking-tight">Amelia</h3>
                            <div className="text-[11px] text-gold-gradient uppercase tracking-[0.2em] font-bold mt-1">
                              Decision Guardian
                            </div>
                          </div>
                        </div>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_#10b981]" />
                      </div>

                      <div className="space-y-4 mb-8">
                        <div className="flex justify-between text-xs py-2 border-b border-white/5">
                          <span className="text-stone-500 font-medium">Status</span>
                          <span className="text-white font-mono tracking-wide">
                            Governance Active
                          </span>
                        </div>
                        <div className="flex justify-between text-xs py-2 border-b border-white/5">
                          <span className="text-stone-500 font-medium">Compliance</span>
                          <span className="text-emerald-500 font-mono font-bold tracking-wide">
                            Active
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-3 items-center">
                        <div className="h-1.5 flex-1 bg-stone-800 rounded-full overflow-hidden">
                          <div className="h-full gold-gradient w-[92%]" />
                        </div>
                        <span className="text-[11px] font-mono text-stone-400 font-bold">92%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Element: Latency KPI Badge */}
              <div className="absolute bottom-24 left-4">
                <div className="bg-black/60 backdrop-blur-xl border border-white/10 px-5 py-4 rounded-2xl flex items-center gap-4 shadow-2xl">
                  <div className="p-2 bg-[#f5d47c]/25 rounded-xl text-[#f5d47c] shadow-[0_0_20px_rgba(245,212,124,0.5)] border border-[#f5d47c]/30">
                    <Zap size={20} color="#f5d47c" strokeWidth={2.5} fill="#f5d47c" className="force-gold-icon" />
                  </div>
                  <div>
                    <div className="text-[10px] text-stone-500 uppercase font-black tracking-wider">
                      Latency
                    </div>
                    <div className="text-base font-bold text-white mt-0.5 tabular-nums transition-all duration-300">
                      {latency}ms{' '}
                      <span className="text-emerald-500 text-[10px] ml-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10">
                        Operational
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Element: Verification Log */}
              <div className="absolute bottom-8 right-4">
                <div className="bg-stone-950/80 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl font-mono text-[9px] text-stone-500 space-y-1 w-[220px]">
                  <div className="flex justify-between border-b border-white/5 pb-1 mb-2">
                    <span className="text-gold-gradient">Verification.log</span>
                    <span className="text-stone-600">LIVE</span>
                  </div>
                  {logs.map((log, i) => (
                    <div
                      key={i}
                      className={`truncate transition-all duration-300 ${log.includes('✔') ? 'text-emerald-500/80' : 'text-stone-400'}`}
                    >
                      {log}
                    </div>
                  ))}
                  <div className="animate-pulse inline-block w-1.5 h-3 bg-stone-700 ml-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* (2) WHAT IS DECISIONOS™ */}
      <section id="what-is" className="py-20 px-6 max-w-[1400px] mx-auto">
        <div className="text-center mb-20 text-stone-900">
          <span className="text-gold-gradient font-bold text-[11px] uppercase tracking-[0.4em] mb-3 block">
            Industrial Category
          </span>
          <h2 className="text-4xl md:text-5xl font-serif tracking-tight mb-6">
            {LANDING_COPY.WHAT_IS.TITLE}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { ...LANDING_COPY.WHAT_IS.WHAT, icon: <Zap color="#f5d47c" strokeWidth={2.5} />, type: 'WHAT' as const },
            { ...LANDING_COPY.WHAT_IS.HOW, icon: <Layers color="#f5d47c" strokeWidth={2.5} />, type: 'HOW' as const },
            { ...LANDING_COPY.WHAT_IS.RESULT, icon: <Target color="#f5d47c" strokeWidth={2.5} />, type: 'RESULT' as const },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white p-10 rounded-[2.5rem] border border-stone-200 hover:border-gold-start/50 hover:shadow-gold-glow-lg transition-all duration-500 flex flex-col h-full group"
            >
              <div className="w-12 h-12 bg-stone-900 rounded-xl flex items-center justify-center text-[#f5d47c] mb-8 shadow-lg shrink-0 group-hover:gold-gradient group-hover:text-stone-900 group-hover:shadow-gold-glow transition-all duration-300">
                {item.icon}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-gradient mb-3">
                {i === 0 ? 'The Category' : i === 1 ? 'The Process' : 'The Value'}
              </div>
              <h3 className="text-2xl font-medium tracking-tight mb-4 text-stone-900">
                {item.TITLE}
              </h3>
              <p className="text-stone-500 leading-relaxed font-light text-sm mb-8 flex-1">
                {item.DESC}
              </p>
              <button
                onClick={() =>
                  setWhatIsDetail({ type: item.type as 'WHAT' | 'HOW' | 'RESULT', content: item })
                }
                className="text-[10px] font-bold uppercase tracking-widest text-[#f5d47c] hover:text-stone-900 transition-colors flex items-center gap-2 group w-fit"
              >
                Learn more{' '}
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* (3) CORE ARCHITECTURE (THE 5 CORES) */}
      <section
        id="architecture"
        className="py-20 px-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)' }}
      >
        {/* Radial glow effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(191, 161, 100, 0.15) 0%, transparent 60%)',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 40% at 50% 100%, rgba(191, 161, 100, 0.08) 0%, transparent 50%)',
          }}
        />

        <div className="max-w-[1400px] mx-auto relative z-10">
          <div className="text-center mb-20">
            <span className="text-gold-gradient font-bold text-[11px] uppercase tracking-[0.4em] mb-3 block">
              Immutable Foundation
            </span>
            <h2 className="text-4xl md:text-5xl font-serif tracking-tight text-white mb-6">
              Core Architecture
            </h2>
          </div>
          <div className="space-y-6">
            {[
              {
                id: 'AEM',
                title: 'Armonyco Event Model™',
                desc: 'Autonomous general reasoning to comprehend flexible request types in hospitality.',
                icon: <Activity size={24} color="#f5d47c" strokeWidth={2.5} fill="#f5d47c" fillOpacity={0.4} className="force-gold-icon transition-colors" />,
              },
              {
                id: 'ASRS',
                title: 'Armonyco Reliability System™',
                desc: 'Decentralized Execution Core with Proof-of-Control auditability.',
                icon: <ShieldCheck size={24} color="#f5d47c" strokeWidth={2.5} fill="#f5d47c" fillOpacity={0.4} className="force-gold-icon transition-colors" />,
              },
              {
                id: 'AOS',
                title: 'Armonyco Operating System™',
                desc: 'The orchestration layer for standardized, high-performance hospitality protocols.',
                icon: <Cpu size={24} color="#f5d47c" strokeWidth={2.5} fill="#f5d47c" fillOpacity={0.4} className="force-gold-icon transition-colors" />,
              },
              {
                id: 'AIM',
                title: 'Armonyco Intelligence Matrix™',
                desc: '4-Agent Harmony ensuring every action is verified for accuracy.',
                icon: <Zap size={24} color="#f5d47c" strokeWidth={2.5} fill="#f5d47c" fillOpacity={0.4} className="force-gold-icon transition-colors" />,
              },
              {
                id: 'AGS',
                title: 'Armonyco Governance Scorecard™',
                desc: 'Final verification and ROI measurement layer for stakeholders.',
                icon: <BarChart3 size={24} color="#f5d47c" strokeWidth={2.5} fill="#f5d47c" fillOpacity={0.4} className="force-gold-icon transition-colors" />,
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-6 rounded-[2rem] border border-stone-500/60 bg-stone-900/80 backdrop-blur-md hover:border-[#f5d47c] hover:shadow-[0_0_50px_rgba(245,212,124,0.15)] transition-all group flex flex-col md:flex-row items-center gap-6 architecture-card"
              >
                <div className="w-12 h-12 bg-stone-900 rounded-xl flex items-center justify-center text-[#f5d47c] architecture-icon transition-all shrink-0 shadow-[0_0_20px_rgba(245,212,124,0.4)] border border-[#f5d47c]/40 architecture-icon-container">
                  <img src={ASSETS.logos.icon} alt="" className="architecture-logo-bg" />
                  <div className="relative z-10 transition-all duration-300 group-hover:scale-110">
                    {item.icon}
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-medium text-white mb-1">{item.title}</h3>
                  <p className="text-stone-300 text-sm leading-relaxed font-light">{item.desc}</p>
                </div>
                <button
                  onClick={() =>
                    setActiveConstructId(item.id as keyof typeof LANDING_COPY.CORE_CONSTRUCTS)
                  }
                  className="text-[10px] font-bold uppercase tracking-widest text-gold-mid-2 hover:text-white transition-all flex items-center gap-2 group shrink-0 hover:drop-shadow-[0_0_8px_rgba(245,212,124,0.5)]"
                >
                  Learn more{' '}
                  <ArrowRight
                    size={14}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* (4) RESULTS */}
      <section id="results" className="py-20 px-6 max-w-[1400px] mx-auto">
        <div className="text-center mb-20 text-stone-900 font-light">
          <span className="text-gold-gradient font-bold text-[11px] uppercase tracking-[0.4em] mb-3 block text-center">
            Operational Proof
          </span>
          <h2 className="text-4xl md:text-5xl font-serif tracking-tight mb-6">
            Results with Proof
          </h2>
        </div>
        <div className="space-y-6">
          {Object.values(LANDING_COPY.RESULTS).map((item, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-[2rem] border border-stone-200 hover:border-gold-start hover:shadow-gold-glow transition-all duration-500 group flex flex-col md:flex-row items-center gap-6"
            >
              <div className="w-12 h-12 bg-stone-50 rounded-xl flex items-center justify-center text-[#f5d47c] group-hover:gold-gradient group-hover:text-stone-900 group-hover:shadow-gold-glow transition-all duration-300 shrink-0">
                {i === 0 ? (
                  <ShieldCheck size={24} color="#f5d47c" strokeWidth={2.5} />
                ) : i === 1 ? (
                  <Activity size={24} color="#f5d47c" strokeWidth={2.5} />
                ) : i === 2 ? (
                  <TrendingUp size={24} color="#f5d47c" strokeWidth={2.5} />
                ) : i === 3 ? (
                  <Clock size={24} color="#f5d47c" strokeWidth={2.5} />
                ) : (
                  <FileText size={24} color="#f5d47c" strokeWidth={2.5} />
                )}
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-medium mb-1">{item.TITLE}</h3>
                <p className="text-stone-500 text-sm leading-relaxed font-light">{item.DESC}</p>
              </div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-stone-400 flex items-center gap-2 shrink-0">
                Verified <CheckCircle2 size={14} className="text-green-500" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="py-20 px-6 max-w-[1400px] mx-auto border-t border-stone-200">
        <div className="text-center mb-20 text-stone-900">
          <span className="text-gold-gradient font-bold text-[11px] uppercase tracking-[0.4em] mb-3 block">
            Governance Architecture
          </span>
          <h2 className="text-4xl md:text-5xl font-serif tracking-tight">Governance Tiers</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {PLANS_DATA.map((plan, i) => {
            const isPopular = plan.tag === 'POPULAR';
            const isVIP = plan.id === 'vip';
            const icons = [
              <Zap key={0} />,
              <Layers key={1} />,
              <ShieldCheck key={2} />,
              <Star key={3} />,
            ];
            const labels = ['Starter Tier', 'Pro Tier', 'Elite Tier', 'VIP Tier'];

            return (
              <div
                key={plan.id}
                className={`p-10 rounded-[2.5rem] border flex flex-col h-full relative ${isPopular ? 'bg-stone-900 text-white border-stone-800 shadow-2xl' : 'bg-white border-stone-200'} hover:border-gold-start/50 hover:shadow-gold-glow-lg hover:scale-[1.02] hover:-translate-y-1 transition-all duration-500 group`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 gold-gradient text-stone-900 text-[10px] font-bold px-4 py-1.5 rounded-full shadow-lg z-20 uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap">
                    <Star size={10} fill="currentColor" /> Most Popular
                  </div>
                )}

                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-8 shadow-lg shrink-0 transition-all duration-300 ${isPopular ? 'gold-gradient text-stone-900 shadow-gold-glow' : 'bg-stone-900 text-[#f5d47c] group-hover:border group-hover:border-[#f5d47c] group-hover:shadow-gold-glow'}`}
                >
                  {icons[i]}
                </div>

                {/* Label */}
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 text-gold-gradient">
                  {labels[i]}
                </div>

                {/* Title */}
                <h3
                  className={`text-2xl font-medium tracking-tight mb-2 ${isPopular ? 'text-white' : 'text-stone-900'}`}
                >
                  {plan.name}
                </h3>

                {/* Units */}
                <p
                  className={`text-[11px] font-bold uppercase tracking-widest mb-4 ${isPopular ? 'text-stone-400' : 'text-stone-400'}`}
                >
                  {plan.units}
                </p>

                {/* Price */}
                <div
                  className={`text-4xl font-bold mb-1 ${isPopular ? 'text-white' : 'text-stone-900'}`}
                >
                  {plan.price}
                </div>
                <p className={`text-xs mb-6 ${isPopular ? 'text-stone-400' : 'text-stone-400'}`}>
                  {plan.period}
                </p>

                {/* ArmoCredits */}
                <div
                  className={`text-sm leading-relaxed font-light mb-8 flex-1 ${isPopular ? 'text-stone-300' : 'text-stone-500'}`}
                >
                  {isVIP ? (
                    'Includes custom tailored ArmoCredits™.'
                  ) : (
                    <>
                      Includes{' '}
                      <span className="font-bold">{plan.includedCredits.toLocaleString()}</span>{' '}
                      ArmoCredits™ per month.
                      <div className="mt-2 text-[10px] uppercase tracking-wider font-bold text-gold-start/80">
                        Pay-per-use: €1 / 1,000 extra credits
                      </div>
                    </>
                  )}
                  <button
                    onClick={() => setShowArmoCredits(true)}
                    className="text-[#f5d47c] hover:underline ml-1 hover:drop-shadow-[0_0_6px_rgba(245,212,124,0.5)] transition-all inline-block mt-2"
                  >
                    Learn more →
                  </button>
                </div>

                {/* CTA */}
                <button
                  onClick={isVIP ? () => setShowContact(true) : onSignUp}
                  className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 w-fit transition-all duration-300 ${isPopular ? 'text-gold-gradient hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-gold-gradient hover:text-stone-900 hover:drop-shadow-[0_0_8px_rgba(191,161,100,0.5)]'}`}
                >
                  {plan.cta}{' '}
                  <ArrowRight
                    size={12}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <footer
        className="relative overflow-hidden border-t border-stone-800 font-light mt-40"
        style={{ background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)' }}
      >
        {/* Radial glow effects */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 40% at 10% 50%, rgba(191, 161, 100, 0.08) 0%, transparent 50%)',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 40% 30% at 90% 20%, rgba(191, 161, 100, 0.05) 0%, transparent 40%)',
          }}
        />

        <div className="max-w-[1400px] mx-auto px-6 py-10 relative z-10 text-white">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            {/* Left: Brand, Narrative & CTA */}
            <div className="space-y-4">
              <div className="space-y-1">
                <img src={ASSETS.logos.footer} alt="Armonyco" className="h-10 w-auto" />
                <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-gold-gradient ml-1">
                  Powered by DecisionOS™
                </p>
              </div>

              <div className="space-y-8">
                <h2 className="text-5xl md:text-6xl font-serif tracking-tight leading-[1.1]">
                  Stop reacting. <br /> Start operating.
                </h2>
                <div className="flex flex-col sm:flex-row items-center gap-8">
                  <button
                    onClick={onSignUp}
                    className="px-10 py-4 gold-gradient text-stone-900 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-gold-glow hover:-translate-y-1"
                  >
                    START OPERATING
                  </button>
                  <button
                    onClick={() => setShowManifesto(true)}
                    className="text-white hover:text-[#f5d47c] transition-colors text-[11px] font-bold uppercase tracking-[0.2em] flex items-center gap-3 group"
                  >
                    READ THE MANIFESTO{' '}
                    <ArrowRight
                      size={14}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Links */}
            <div className="flex gap-24 lg:justify-end pt-20 lg:pt-32">
              <div>
                <h4 className="text-[12px] font-serif tracking-tight text-white mb-8">Product</h4>
                <ul className="space-y-4 text-[11px] text-stone-500 uppercase font-bold tracking-[0.2em]">
                  <li>
                    <button
                      onClick={() => scrollToSection('what-is')}
                      className="hover:text-[#f5d47c] transition-all duration-300 hover:drop-shadow-[0_0_6px_rgba(245,212,124,0.5)]"
                    >
                      DecisionOS™
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => scrollToSection('architecture')}
                      className="hover:text-[#f5d47c] transition-all duration-300 hover:drop-shadow-[0_0_6px_rgba(245,212,124,0.5)]"
                    >
                      Architecture
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => scrollToSection('results')}
                      className="hover:text-[#f5d47c] transition-all duration-300 hover:drop-shadow-[0_0_6px_rgba(245,212,124,0.5)]"
                    >
                      Results
                    </button>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-[12px] font-serif tracking-tight text-white mb-8">Support</h4>
                <ul className="space-y-4 text-[11px] text-stone-500 uppercase font-bold tracking-[0.2em]">
                  <li>
                    <button
                      onClick={onLogin}
                      className="hover:text-[#f5d47c] transition-all duration-300 hover:drop-shadow-[0_0_6px_rgba(245,212,124,0.5)]"
                    >
                      Login Access
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={onLogin}
                      className="hover:text-[#f5d47c] transition-all duration-300 hover:drop-shadow-[0_0_6px_rgba(245,212,124,0.5)]"
                    >
                      Apply Node
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={onLogin}
                      className="hover:text-[#f5d47c] transition-all duration-300 hover:drop-shadow-[0_0_6px_rgba(245,212,124,0.5)]"
                    >
                      Core Docs
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-stone-800 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] uppercase font-bold tracking-[0.3em] text-stone-500 mt-16">
            <div className="flex gap-12">
              <button className="hover:text-white transition-colors">Privacy</button>
              <button className="hover:text-white transition-colors">Terms</button>
            </div>
            <p>© 2025 ARMONYCO. ALL RIGHTS RESERVED.</p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ManifestoModal isOpen={showManifesto} onClose={() => setShowManifesto(false)} />
      {whatIsDetail && (
        <WhatIsDetailModal
          isOpen={!!whatIsDetail}
          onClose={() => setWhatIsDetail(null)}
          type={whatIsDetail.type}
          content={whatIsDetail.content}
        />
      )}
      <ContactModal isOpen={showContact} onClose={() => setShowContact(false)} />
      <ArmoCreditsModal isOpen={showArmoCredits} onClose={() => setShowArmoCredits(false)} />

      {activeConstructId && (
        <ArchitectureDetailModal
          isOpen={!!activeConstructId}
          onClose={() => setActiveConstructId(null)}
          constructId={activeConstructId}
        />
      )}
    </div>
  );
};

export default LandingPage;
