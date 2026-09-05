'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import AppLogo from '@/components/ui/AppLogo';
import { ToastProvider } from '@/components/ui/Toast';
import { getAuthUser } from '@/lib/authStore';
import { getRoleDashboard } from '@/lib/mockData';

type AuthPageClientProps = {
  initialTab?: 'login' | 'signup';
};

export default function AuthPageClient({ initialTab }: AuthPageClientProps) {
  const [tab, setTab] = useState<'login' | 'signup'>(initialTab ?? 'login');
  const router = useRouter();

  useEffect(() => {
    const user = getAuthUser();
    if (user) {
      router.replace(getRoleDashboard(user.role));
    }
  }, [router]);

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Brand Panel */}
        <div
          className="hidden lg:flex lg:w-[45%] flex-col justify-between p-10 relative overflow-hidden"
          style={{ backgroundColor: '#1a2744' }}
        >
          {/* Decorative circles */}
          <div className="absolute top-[-80px] right-[-80px] w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute bottom-[-60px] left-[-60px] w-80 h-80 rounded-full bg-white/5" />
          <div className="absolute top-1/2 left-[-100px] w-48 h-48 rounded-full bg-white/5" />
          {/* Green accent bar */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1"
            style={{ backgroundColor: '#2d8a4e' }}
          />

          {/* Logo + Brand */}
          <div className="flex items-center gap-4 relative z-10">
            <AppLogo size={56} className="rounded-xl overflow-hidden shadow-lg" />
            <div>
              <span className="font-extrabold text-2xl text-white tracking-tight block leading-tight">
                Hapo Ulipo Services
              </span>
              <span className="text-sm font-medium italic" style={{ color: '#f07c2a' }}>
                Anything. Anytime. Right at your door.
              </span>
            </div>
          </div>

          {/* Hero text */}
          <div className="relative z-10">
            <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
              Kenya's Neighbourhood
              <br />
              Marketplace
            </h1>
            <p className="text-white/70 text-lg leading-relaxed mb-8">
              Discover vendors near you selling fresh food, groceries, pharmacy items and more — all
              at fair Kenyan prices.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-3">
              {[
                '📍 Nearest vendors first',
                '💚 Trusted local sellers',
                '💬 Order via WhatsApp',
                '🛒 All categories',
              ].map((feature) => (
                <span
                  key={`feature-${feature.slice(0, 8)}`}
                  className="px-3 py-1.5 rounded-full bg-white/10 text-white text-sm font-medium border border-white/10"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 relative z-10">
            {[
              { value: '2,400+', label: 'Active Vendors' },
              { value: '18,000+', label: 'Products Listed' },
              { value: '47 Cities', label: 'Across Kenya' },
            ].map((stat) => (
              <div
                key={`stat-${stat.label}`}
                className="rounded-2xl p-4 text-center border border-white/10"
                style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
              >
                <div className="text-2xl font-extrabold font-tabular" style={{ color: '#f07c2a' }}>
                  {stat.value}
                </div>
                <div className="text-white/60 text-xs mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Panel */}
        <div className="flex-1 flex flex-col min-h-screen lg:overflow-y-auto bg-background">
          {/* Mobile header */}
          <div
            className="lg:hidden flex items-center gap-3 px-6 pt-8 pb-4"
            style={{ backgroundColor: '#1a2744' }}
          >
            <AppLogo size={40} className="rounded-lg overflow-hidden" />
            <div>
              <span className="font-bold text-lg text-white tracking-tight block leading-tight">
                Hapo Ulipo Services
              </span>
              <span className="text-xs font-medium italic" style={{ color: '#f07c2a' }}>
                Anything. Anytime. Right at your door.
              </span>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center px-6 py-8">
            <div className="w-full max-w-md">
              {/* Tab switcher */}
              <div className="flex bg-muted rounded-2xl p-1 mb-8">
                {(['login', 'signup'] as const).map((t) => (
                  <button
                    key={`tab-${t}`}
                    onClick={() => setTab(t)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      tab === t
                        ? 'bg-white card-shadow'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    style={tab === t ? { color: '#1a2744' } : {}}
                  >
                    {t === 'login' ? 'Sign In' : 'Create Account'}
                  </button>
                ))}
              </div>

              {/* Forms */}
              {tab === 'login' ? (
                <LoginForm onSwitchToSignup={() => setTab('signup')} />
              ) : (
                <SignupForm onSwitchToLogin={() => setTab('login')} />
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center py-4 px-6">
            <p className="text-xs text-muted-foreground">
              © 2026 Hapo Ulipo Services. Made with 💚 for Kenya.
            </p>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
