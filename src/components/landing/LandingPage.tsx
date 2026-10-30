import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Layers,
  CheckSquare,
  Users,
  CalendarCheck,
  MessageSquare,
  FileText,
  Video,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  BrainCircuit,
  Bot,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { setCurrentView } = useApp();

  const handleStart = () => {
    setCurrentView('signup');
  };

  const handleSignIn = () => {
    setCurrentView('login');
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A] text-[#171717] dark:text-[#FAFAFA] flex flex-col font-sans transition-colors">
      {/* LANDING HEADER */}
      <header className="sticky top-0 z-40 h-20 bg-white/80 dark:bg-[#141414]/80 backdrop-blur-lg border-b border-[#E5E5E5] dark:border-[#333333] px-6 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('landing')}>
          <div className="w-10 h-10 rounded-2xl bg-[#F97316] flex items-center justify-center text-white shadow-sm">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-[#171717] dark:text-[#FAFAFA]">WorkNest</span>
            <span className="hidden sm:block text-[11px] text-[#737373] dark:text-[#A3A3A3] font-medium">
              Everything your work needs, in one place.
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#737373] dark:text-[#A3A3A3]">
          <button onClick={() => scrollTo('features')} className="hover:text-[#F97316] transition-colors">
            Features
          </button>
          <button onClick={() => scrollTo('how-it-works')} className="hover:text-[#F97316] transition-colors">
            How It Works
          </button>
          <button onClick={() => scrollTo('ai-assistant')} className="hover:text-[#F97316] transition-colors">
            AI Assistant
          </button>
        </nav>

        {/* Auth CTA buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSignIn}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-[#171717] dark:text-[#FAFAFA] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={handleStart}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#F97316] hover:bg-[#EA580C] dark:hover:bg-[#FB923C] text-white shadow-sm active:scale-95 transition-colors"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-20 pb-16 px-6 lg:px-12 max-w-7xl mx-auto text-center overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 dark:bg-orange-950/60 border border-orange-200/80 dark:border-orange-800/60 text-orange-700 dark:text-orange-300 text-xs font-semibold mb-6 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
          <span>Next-Generation SaaS Productivity Platform</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#171717] dark:text-[#FAFAFA] tracking-tight leading-tight max-w-4xl mx-auto">
          Work together. Stay organized. <br className="hidden sm:block" />
          <span className="text-[#F97316]">
            Get more done.
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-[#737373] dark:text-[#A3A3A3] max-w-2xl mx-auto leading-relaxed">
          WorkNest brings tasks, teams, communication, files, meetings, and AI-powered productivity into one connected workspace.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={handleStart}
            className="px-8 py-3.5 rounded-2xl text-base font-bold bg-[#F97316] hover:bg-[#EA580C] dark:hover:bg-[#FB923C] text-white shadow-sm flex items-center gap-2.5 active:scale-95 transition-colors"
          >
            <span>Get Started</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={handleSignIn}
            className="px-8 py-3.5 rounded-2xl text-base font-bold bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#333333] text-[#171717] dark:text-[#FAFAFA] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] transition-colors"
          >
            Sign In
          </button>
        </div>

        {/* HERO DASHBOARD PREVIEW CARD */}
        <div className="mt-14 relative max-w-5xl mx-auto rounded-3xl p-3 bg-[#E5E5E5]/60 dark:bg-[#1C1C1C]/60 border border-[#E5E5E5] dark:border-[#333333] shadow-2xl overflow-hidden">
          <div className="bg-[#141414] rounded-2xl p-6 text-left text-neutral-100 shadow-inner border border-[#333333]">
            {/* Top Bar Mock */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#333333]">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs text-neutral-400 font-mono">worknest.app/dashboard</span>
              </div>
              <span className="text-xs bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full border border-orange-500/30 font-medium">
                Live Interactive Workspace
              </span>
            </div>

            {/* Dashboard grid preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Task Progress widget */}
              <div className="bg-[#1C1C1C] p-4 rounded-xl border border-[#333333] space-y-3">
                <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold uppercase tracking-wider">
                  <span>Sprint Deliverables</span>
                  <span className="text-emerald-400">78%</span>
                </div>
                <div className="h-2 rounded-full bg-[#141414] overflow-hidden border border-[#333333]">
                  <div className="h-full bg-[#F97316] w-3/4 rounded-full" />
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/60 border border-[#333333]">
                    <span className="truncate">OAuth 2.0 Access Control</span>
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px]">Urgent</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/60 border border-[#333333]">
                    <span className="truncate">Kanban View Redesign</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">Done</span>
                  </div>
                </div>
              </div>

              {/* Team Activity feed */}
              <div className="bg-[#1C1C1C] p-4 rounded-xl border border-[#333333] space-y-3">
                <div className="text-xs text-neutral-400 font-semibold uppercase tracking-wider flex items-center justify-between">
                  <span>Recent Team Activity</span>
                  <Activity className="w-4 h-4 text-[#F97316]" />
                </div>
                <div className="space-y-2 text-xs text-neutral-300">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#F97316] shrink-0" />
                    <span>David Chen completed JWT Refresh Tokens</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#F97316] shrink-0" />
                    <span>Sarah uploaded Q4 Brand Specs file</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#F97316] shrink-0" />
                    <span>Meeting scheduled for 10:00 AM Today</span>
                  </div>
                </div>
              </div>

              {/* AI Insights Card */}
              <div className="bg-[#1C1C1C] p-4 rounded-xl border border-orange-500/40 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-[#F97316]" />
                  <span>WorkNest AI Insights</span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  "Core SaaS team is operating at optimal velocity. 2 high-priority tasks are due next week."
                </p>
                <button
                  onClick={handleStart}
                  className="w-full py-1.5 rounded-lg bg-[#F97316] text-white text-xs font-semibold hover:bg-[#EA580C] transition-colors"
                >
                  Explore Workspace Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-20 px-6 lg:px-12 bg-white dark:bg-[#0A0A0A] border-y border-[#E5E5E5] dark:border-[#333333] transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F97316]">
              Powerful Modular Tools
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-[#171717] dark:text-[#FAFAFA]">
              Everything your team needs
            </h2>
            <p className="mt-4 text-[#737373] dark:text-[#A3A3A3] text-base">
              Eliminate software fragmentation. WorkNest unites all essential team tools in one harmonious interface.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <CheckSquare className="w-6 h-6 text-[#F97316]" />,
                title: 'Personal Task Management',
                desc: 'Create to-do lists, filter by priority, toggle status completion, and track individual daily goals with clear progress bars.',
              },
              {
                icon: <Users className="w-6 h-6 text-[#F97316]" />,
                title: 'Team Collaboration',
                desc: 'Organize team workspaces, assign task columns, establish group leaders & sub-group leaders with permissions.',
              },
              {
                icon: <CalendarCheck className="w-6 h-6 text-emerald-500" />,
                title: 'Daily Work Tracking',
                desc: 'Log hours worked, completed tasks, roadblocks, and next-day plans with an automated leader dashboard.',
              },
              {
                icon: <MessageSquare className="w-6 h-6 text-[#F97316]" />,
                title: 'Real-Time Communication',
                desc: 'Dedicated general and subgroup chat channels with rich file sharing, text formatting, and emoji reactions.',
              },
              {
                icon: <FileText className="w-6 h-6 text-amber-500" />,
                title: 'File Sharing & Assets',
                desc: 'Upload presentations (PPTX), PDF specs, images, and spreadsheets with interactive drag-and-drop support.',
              },
              {
                icon: <Video className="w-6 h-6 text-rose-500" />,
                title: 'HD Video Meetings',
                desc: 'Conduct high-quality audio and video conferences with participant tiles, screen sharing, and call chat.',
              },
              {
                icon: <Sparkles className="w-6 h-6 text-[#F97316]" />,
                title: 'AI-Powered Insights',
                desc: 'Automatic project risk alerts, task step breakdowns, work log summaries, and intelligent priority recommendations.',
              },
            ].map((f, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-[#FAFAFA] dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#333333] hover:border-[#F97316]/50 transition group"
              >
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] shadow-sm flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-[#171717] dark:text-[#FAFAFA]">{f.title}</h3>
                <p className="mt-2 text-sm text-[#737373] dark:text-[#A3A3A3] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI SECTION */}
      <section id="ai-assistant" className="py-20 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-[#141414] text-white p-8 lg:p-14 border border-[#333333] shadow-xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 text-[#F97316] border border-orange-500/20 text-xs font-semibold mb-4">
                <BrainCircuit className="w-4 h-4 text-[#F97316]" />
                WorkNest AI Core
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#FAFAFA]">Work smarter with AI</h2>
              <p className="mt-4 text-[#A3A3A3] text-base leading-relaxed">
                WorkNest AI sits right inside your workspace, analyzing tasks, team daily logs, and discussion channels to deliver actionable intelligence.
              </p>

              <div className="mt-8 space-y-3.5">
                {[
                  'Break complex tasks into smaller actionable steps',
                  'Suggest smart priority ordering based on deadlines',
                  'Summarize team daily progress and hours logged',
                  'Identify project risks before deadlines slip',
                  'Summarize long team chat discussions instantly',
                  'Answer project-related questions with context',
                ].map((capability, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm text-neutral-300">
                    <CheckCircle2 className="w-5 h-5 text-[#F97316] shrink-0" />
                    <span>{capability}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleStart}
                className="mt-8 px-6 py-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] dark:hover:bg-[#FB923C] text-white font-bold text-sm shadow-sm active:scale-95 transition"
              >
                Try WorkNest AI Free
              </button>
            </div>

            {/* AI Assistant Graphic Card */}
            <div className="bg-[#0A0A0A] rounded-2xl p-6 border border-[#333333] shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#333333]">
                <div className="flex items-center gap-2.5">
                  <Bot className="w-5 h-5 text-[#F97316]" />
                  <span className="text-sm font-bold text-[#FAFAFA]">WorkNest AI Assistant</span>
                </div>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">ONLINE</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-[#1C1C1C] border border-[#333333] text-neutral-300">
                  <span className="font-semibold block mb-1 text-neutral-400">User Query:</span>
                  "Analyze our engineering team velocity for today."
                </div>

                <div className="p-3 rounded-xl bg-[#1C1C1C] border border-[#333333] text-neutral-200 space-y-2">
                  <span className="font-semibold text-[#F97316] block">WorkNest AI Response:</span>
                  <p>Your team logged 22.5 hours today with 3 tasks completed ahead of schedule. "OAuth 2.0 RBAC" requires attention before Friday.</p>
                  <div className="pt-2 flex gap-2">
                    <span className="px-2 py-1 rounded bg-[#222222] text-emerald-400 text-[10px]">Health: 94%</span>
                    <span className="px-2 py-1 rounded bg-[#222222] text-orange-400 text-[10px]">Velocity: High</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-20 px-6 lg:px-12 bg-white dark:bg-[#0A0A0A] border-t border-[#E5E5E5] dark:border-[#333333] transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F97316]">
              Simple Onboarding Flow
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-[#171717] dark:text-[#FAFAFA]">
              How It Works
            </h2>
            <p className="mt-3 text-[#737373] dark:text-[#A3A3A3] text-base">
              Get your entire team set up and collaborating in under 5 minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[
              { step: '01', title: 'Create workspace', desc: 'Sign up and create your personal or team hub.' },
              { step: '02', title: 'Organize tasks', desc: 'Add personal to-dos or team project tasks.' },
              { step: '03', title: 'Invite your team', desc: 'Assign subgroup leaders and member roles.' },
              { step: '04', title: 'Collaborate', desc: 'Share files, chat, submit daily logs & meet.' },
              { step: '05', title: 'AI Assistance', desc: 'Get smart summaries and workload suggestions.' },
            ].map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-[#FAFAFA] dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#333333] relative">
                <div className="text-2xl font-black text-[#F97316] mb-2">{s.step}</div>
                <h3 className="text-base font-bold text-[#171717] dark:text-[#FAFAFA]">{s.title}</h3>
                <p className="mt-1.5 text-xs text-[#737373] dark:text-[#A3A3A3] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 px-6 lg:px-12 text-center max-w-4xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#171717] dark:text-[#FAFAFA]">
          Bring your work together with WorkNest.
        </h2>
        <p className="mt-4 text-[#737373] dark:text-[#A3A3A3] text-base">
          Join thousands of professionals and teams who streamline daily tasks and project management in one unified workspace.
        </p>
        <button
          onClick={handleStart}
          className="mt-8 px-8 py-4 rounded-xl text-base font-bold bg-[#F97316] hover:bg-[#EA580C] dark:hover:bg-[#FB923C] text-white shadow-sm active:scale-95 transition"
        >
          Get Started
        </button>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto py-12 px-6 lg:px-12 bg-white dark:bg-[#0A0A0A] border-t border-[#E5E5E5] dark:border-[#333333] text-xs text-[#737373] dark:text-[#A3A3A3]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 font-bold text-[#171717] dark:text-[#FAFAFA] text-base mb-2">
              <Layers className="w-5 h-5 text-[#F97316]" /> WorkNest
            </div>
            <p className="text-xs text-[#737373] dark:text-[#A3A3A3] leading-relaxed">
              Everything your work needs, in one place. AI-powered personal and team productivity platform.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-[#171717] dark:text-[#FAFAFA] mb-3">Product</h4>
            <ul className="space-y-2">
              <li><button onClick={() => scrollTo('features')} className="hover:text-[#F97316] transition-colors">Task Management</button></li>
              <li><button onClick={() => scrollTo('features')} className="hover:text-[#F97316] transition-colors">Team Collaboration</button></li>
              <li><button onClick={() => scrollTo('ai-assistant')} className="hover:text-[#F97316] transition-colors">WorkNest AI</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[#171717] dark:text-[#FAFAFA] mb-3">Company & Legal</h4>
            <ul className="space-y-2">
              <li><a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-[#F97316] transition-colors">Privacy Policy</a></li>
              <li><a href="#terms" onClick={(e) => e.preventDefault()} className="hover:text-[#F97316] transition-colors">Terms of Service</a></li>
              <li><a href="#contact" onClick={(e) => e.preventDefault()} className="hover:text-[#F97316] transition-colors">Contact Us</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[#171717] dark:text-[#FAFAFA] mb-3">Security & Compliance</h4>
            <div className="flex items-center gap-2 text-xs text-[#737373] dark:text-[#A3A3A3]">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>SOC2 Type II & End-to-End Encryption</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-[#E5E5E5] dark:border-[#333333] flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 WorkNest Inc. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span className="hover:text-[#F97316] cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-[#F97316] cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-[#F97316] cursor-pointer transition-colors">Security</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
