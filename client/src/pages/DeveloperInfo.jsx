import React, { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import {
  Sparkles,
  ExternalLink,
  Code2,
  Heart,
  Copy,
  Check,
  Mail,
  Send,
  Terminal,
  Layers,
  Globe,
  Cpu,
  Coffee,
  CheckCircle2,
  Star,
  UserCheck,
} from 'lucide-react';

export const SOCIAL_LINKS = [
  {
    name: 'LinkedIn',
    handle: '@ms-hossen',
    subHandle: 'parttimecoder',
    role: 'Professional Network & Career',
    description: 'Connect for collaborations, technical discussions, and professional networking.',
    link: 'https://www.linkedin.com/in/ms-hossen/',
    secondaryLink: 'https://www.linkedin.com/in/parttimecoder/',
    color: '#0A66C2',
    bgBadge: 'bg-[#0A66C2]/10 text-[#0A66C2] border-[#0A66C2]/25',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
      </svg>
    ),
  },
  {
    name: 'YouTube',
    handle: '@Part-TimeCoder',
    subHandle: 'Tutorials & Dev Vlogs',
    role: 'Tech Content & Code Teardowns',
    description: 'Programming walkthroughs, modern stack architectures, and real-world dev projects.',
    link: 'https://www.youtube.com/@Part-TimeCoder',
    color: '#FF0000',
    bgBadge: 'bg-[#FF0000]/10 text-[#FF0000] border-[#FF0000]/25',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    name: 'GitHub',
    handle: '@MSabbirHossen',
    subHandle: 'Source Repositories',
    role: 'Open Source & Codebases',
    description: 'Explore active repositories, stars, and full-stack personal systems codebases.',
    link: 'https://github.com/MSabbirHossen',
    color: '#6366F1',
    bgBadge: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/25',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        />
      </svg>
    ),
  },
  {
    name: 'Facebook',
    handle: '@parttimecoder',
    subHandle: 'Community & Discussion',
    role: 'Community Updates & Insights',
    description: 'Community interactions, quick programming notes, and project launch updates.',
    link: 'https://www.facebook.com/parttimecoder/',
    color: '#1877F2',
    bgBadge: 'bg-[#1877F2]/10 text-[#1877F2] border-[#1877F2]/25',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    name: 'Instagram',
    handle: '@parttimecoder',
    subHandle: 'Visual Stories & Work',
    role: 'Creative Highlights & BTS',
    description: 'Behind the scenes, developer workspace snapshots, and daily tech reflections.',
    link: 'https://www.instagram.com/parttimecoder/',
    color: '#E4405F',
    bgBadge: 'bg-[#E4405F]/10 text-[#E4405F] border-[#E4405F]/25',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
];

export const DeveloperInfo = ({ isCompact = false }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const handleCopyProfile = () => {
    navigator.clipboard.writeText('https://www.linkedin.com/in/ms-hossen/');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackText('');
      setFeedbackSent(false);
    }, 3500);
  };

  if (isCompact) {
    return (
      <div className="p-4 rounded-2xl bg-surface border border-theme card-shadow space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-extrabold text-sm shadow-sm shadow-indigo-500/25">
              MS
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-primary">MS Hossen</h4>
              <p className="text-xs text-secondary font-medium">Part-Time Coder • Life OS Creator</p>
            </div>
          </div>
          <Badge variant="purple" size="xs" dot>
            Creator
          </Badge>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {SOCIAL_LINKS.map((s) => (
            <a
              key={s.name}
              href={s.link}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-subtle hover:bg-surface border border-theme text-secondary hover:text-primary transition-all flex items-center gap-1.5 text-xs font-semibold"
              title={s.name}
            >
              {s.icon}
              <span className="hidden sm:inline">{s.name}</span>
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-6xl mx-auto">
      <PageHeader
        category="Creator & Community"
        title="Developer & Community Hub"
        description="Connect with MS Hossen (Part-Time Coder), the architect behind Life OS. Reach out for feedback, collaborations, feature ideas, or software opportunities."
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="secondary"
              size="md"
              icon={copiedLink ? Check : Copy}
              onClick={handleCopyProfile}
            >
              {copiedLink ? 'Profile Copied!' : 'Copy Profile Link'}
            </Button>
            <a
              href="https://www.linkedin.com/in/ms-hossen/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="gradient" size="md" icon={ExternalLink}>
                Connect on LinkedIn
              </Button>
            </a>
          </div>
        }
      />

      {/* Hero Developer Showcase Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600/10 via-purple-600/10 to-surface border border-indigo-500/25 p-6 sm:p-8 card-shadow">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/25 flex items-center justify-center">
                <div className="w-full h-full bg-surface rounded-[22px] flex items-center justify-center text-primary font-black text-2xl sm:text-3xl tracking-tight">
                  MS
                </div>
              </div>
              <span
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-surface flex items-center justify-center animate-pulse"
                title="Active Developer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
                  MS Hossen
                </h2>
                <Badge variant="purple" size="sm" dot>
                  Part-Time Coder
                </Badge>
                <Badge variant="success" size="sm">
                  Available for Hire & Collabs
                </Badge>
              </div>
              <p className="text-sm font-semibold text-accent">
                Full-Stack Software Engineer • Creator & Maintainer of Life OS
              </p>
              <p className="text-xs text-secondary leading-relaxed max-w-2xl font-medium">
                Designing cohesive, human-centered operating systems that bring structure to personal growth, daily discipline, spirituality, health, and finance. Crafted with Next.js, React, Node.js, and modern aesthetic design.
              </p>
            </div>
          </div>

          <div className="flex flex-row md:flex-col gap-2 shrink-0 w-full sm:w-auto">
            <a
              href="https://github.com/MSabbirHossen"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none"
            >
              <Button variant="secondary" size="sm" icon={Star} className="w-full">
                Star on GitHub
              </Button>
            </a>
            <a
              href="https://www.youtube.com/@Part-TimeCoder"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none"
            >
              <Button variant="ghost" size="sm" icon={ExternalLink} className="w-full">
                YouTube Channel
              </Button>
            </a>
          </div>
        </div>

        {/* Tech Stack & Core Domains Pill Strip */}
        <div className="mt-6 pt-6 border-t border-theme/60 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] font-bold text-secondary uppercase tracking-wider mr-1">
            Core Toolkit:
          </span>
          {['React 19', 'Next.js 14', 'Node.js', 'Express', 'MongoDB / Prisma', 'Tailwind CSS', 'System Architecture'].map((tech) => (
            <span
              key={tech}
              className="px-2.5 py-1 rounded-xl bg-surface/80 border border-theme text-secondary font-semibold text-[11px]"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Social Channels Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-primary tracking-tight">
              Connect Across Platforms
            </h3>
            <p className="text-xs text-secondary font-medium">
              Direct links to official profiles and developer communities
            </p>
          </div>
          <span className="text-xs font-semibold text-secondary">{SOCIAL_LINKS.length} channels</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {SOCIAL_LINKS.map((item) => (
            <Card
              key={item.name}
              hover
              className="flex flex-col justify-between group transition-all duration-200 border-theme hover:border-accent/40"
              action={
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-xl text-secondary hover:text-accent hover:bg-accent/10 transition-colors"
                  title={`Open ${item.name}`}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              }
            >
              <div className="space-y-3.5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm transition-transform group-hover:scale-105"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-base font-extrabold text-primary tracking-tight truncate">
                      {item.name}
                    </h4>
                    <span className="text-xs font-semibold text-accent block truncate">
                      {item.handle}
                    </span>
                  </div>
                </div>

                <div>
                  <Badge variant="neutral" size="xs" className="mb-1.5">
                    {item.role}
                  </Badge>
                  <p className="text-xs text-secondary font-medium leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-subtle flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-secondary">
                  {item.subHandle}
                </span>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-accent group-hover:underline flex items-center gap-1"
                >
                  Visit Channel <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Collaboration & Feedback Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* About Life OS Vision Card */}
        <Card
          hover
          title="About The Life OS Vision"
          subtitle="Built by MS Hossen for intentional living"
          icon={Code2}
          className="lg:col-span-1"
        >
          <div className="space-y-3.5 text-xs text-secondary leading-relaxed font-medium mt-1">
            <p>
              Life OS was born from a personal conviction: productivity apps are often fragmented, noisy, and disconnected from our values.
            </p>
            <p>
              By fusing <strong className="text-primary font-bold">Spiritual Accountability (Salah & Qada)</strong>, <strong className="text-primary font-bold">Physical Health (Calories & Gym)</strong>, <strong className="text-primary font-bold">Deep Work & Study</strong>, and <strong className="text-primary font-bold">Financial Clarity</strong> into a single cohesive dashboard, Life OS empowers you to design a balanced, focused life.
            </p>
            <div className="p-3 bg-subtle rounded-2xl border border-theme space-y-1">
              <span className="text-[11px] font-bold text-primary block">
                Open to Feedback & Collaboration
              </span>
              <span className="text-[10px] text-secondary block">
                Got feature suggestions, questions, or ideas for improvement? Send a note below or reach out via LinkedIn.
              </span>
            </div>
          </div>
        </Card>

        {/* Quick Connect & Feedback Box */}
        <Card
          hover
          title="Send a Note to MS Hossen"
          subtitle="Direct thoughts, feedback, or collaboration queries"
          icon={Mail}
          className="lg:col-span-2"
        >
          {feedbackSent ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col items-center justify-center text-center space-y-2 animate-fade-in my-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-primary">Thank you for connecting!</h4>
              <p className="text-xs text-secondary max-w-sm">
                Your message has been captured. Feel free to also reach out directly on LinkedIn for immediate discussions.
              </p>
            </div>
          ) : (
            <form onSubmit={handleFeedbackSubmit} className="space-y-4 mt-2">
              <div className="flex gap-2 flex-wrap">
                {[
                  '🚀 Feature Suggestion',
                  '🐞 Bug Report',
                  '🤝 Freelance / Hire',
                  '💡 General Feedback',
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setFeedbackText((prev) =>
                        prev ? `${prev}\n[Topic: ${tag}] ` : `[Topic: ${tag}] `
                      )
                    }
                    className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-subtle hover:bg-surface border border-theme text-secondary hover:text-primary transition-all cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                  Your Message / Feedback
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Share your thoughts about Life OS, request new integrations, or say hello..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="textarea-base"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 text-xs text-secondary font-medium">
                  <UserCheck className="w-4 h-4 text-accent" />
                  <span>Direct Creator Channel</span>
                </div>
                <Button
                  type="submit"
                  variant="gradient"
                  size="md"
                  icon={Send}
                  className="shadow-sm shadow-indigo-500/20"
                >
                  Send Note to Developer
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>

      {/* Project Attribution Footer */}
      <footer className="mt-8 pt-6 border-t border-theme flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-secondary">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
            MS
          </div>
          <span>
            Crafted with passion by{' '}
            <a
              href="https://www.linkedin.com/in/ms-hossen/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-primary hover:text-accent transition-colors underline"
            >
              MS Hossen
            </a>{' '}
            (@parttimecoder)
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-medium">
          <span>Life OS Personal Productivity System</span>
          <span>•</span>
          <span>© {new Date().getFullYear()} All Rights Reserved</span>
        </div>
      </footer>
    </div>
  );
};

export default DeveloperInfo;
