'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  MoonStar,
  ShoppingBag,
  Sparkles,
  Truck,
  ShieldCheck,
  SunMedium,
} from 'lucide-react';

const featureList = [
  {
    icon: ShoppingBag,
    label: 'Fast Local Delivery',
    description: 'Order groceries, pharmacy items, and meals from nearby sellers in minutes.',
  },
  {
    icon: ShieldCheck,
    label: 'Trusted Vendors',
    description: 'Browse verified merchants with live availability and realistic pricing.',
  },
  {
    icon: Truck,
    label: 'Live Tracking',
    description: 'Watch your delivery arrive with transparent rider status and ETA updates.',
  },
  {
    icon: Sparkles,
    label: 'Secure Checkout',
    description: 'Pay safely with local options and one-click checkout for repeat orders.',
  },
];

export default function HomePage() {
  const [darkMode, setDarkMode] = useState(false);
  const [audience, setAudience] = useState<'client' | 'vendor' | 'ambassador'>('client');

  const audienceContent = {
    client: {
      label: 'Clients',
      title: 'Find what you need, close to home.',
      description: 'Browse trusted local vendors, add essentials to your cart, and get them delivered when it suits you.',
      action: 'Start shopping',
      href: '/auth?tab=signup',
    },
    vendor: {
      label: 'Vendors',
      title: 'Put your products in front of nearby customers.',
      description: 'List your catalogue, reach more people in your area, and grow your local business with every order.',
      action: 'Join as a vendor',
      href: '/auth?tab=signup',
    },
    ambassador: {
      label: 'Ambassadors',
      title: 'Build your network and earn from every referral.',
      description: 'Connect quality vendors with Hapo Ulipo and track the value you create in your community.',
      action: 'Become an ambassador',
      href: '/auth?tab=signup',
    },
  } as const;

  const selectedAudience = audienceContent[audience];

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('hapo-theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    window.localStorage.setItem('hapo-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const shellClassName = darkMode
    ? 'dark bg-slate-950 text-slate-100'
    : 'bg-[radial-gradient(circle_at_top,_rgba(45,138,78,0.18),_transparent_40%),linear-gradient(180deg,_rgba(244,246,251,1)_0%,_rgba(250,252,255,1)_100%)] text-slate-950';

  return (
    <main
      className={`${shellClassName} min-h-screen overflow-hidden transition-colors duration-500`}
    >
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#2d8a4e]/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-24 h-56 w-56 rounded-full bg-[#f07c2a]/15 blur-3xl" />

      <section className="relative mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-12">
        <header className="flex flex-col gap-4 pb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              HU
            </span>
            Hapo Ulipo
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <Link
              href="#services"
              className="transition hover:text-slate-950 dark:hover:text-white"
            >
              Services
            </Link>
            <Link
              href="#how-it-works"
              className="transition hover:text-slate-950 dark:hover:text-white"
            >
              How it works
            </Link>
            <Link
              href="#get-started"
              className="transition hover:text-slate-950 dark:hover:text-white"
            >
              Get started
            </Link>
            <button
              type="button"
              onClick={() => setDarkMode((value) => !value)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/90 px-4 py-2 text-slate-900 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {darkMode ? <SunMedium size={16} /> : <MoonStar size={16} />}
              {darkMode ? 'Light mode' : 'Dark mode'}
            </button>
          </div>
        </header>

        <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-20">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary shadow-sm shadow-primary/10 backdrop-blur-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              Anything. Anytime. Right at your door.
            </div>

            <div className="space-y-6">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-6xl lg:text-7xl">
                Bring your neighborhood market to your pocket.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-700 dark:text-slate-300 sm:text-xl">
                Discover sellers nearby and switch to a dedicated login or signup experience that
                keeps your journey clean and focused.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/auth?tab=login"
                className="btn-primary inline-flex items-center justify-center gap-2"
              >
                Sign in
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/auth?tab=signup"
                className="btn-secondary inline-flex items-center justify-center"
              >
                Create account
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-card-shadow transition hover:-translate-y-1 hover:shadow-card-shadow-lg dark:border-slate-700 dark:bg-slate-900/90">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                  Trusted by
                </p>
                <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">7,500+</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  happy customers across Nairobi, Mombasa and Kisumu.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-card-shadow transition hover:-translate-y-1 hover:shadow-card-shadow-lg dark:border-slate-700 dark:bg-slate-900/90">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                  On-demand
                </p>
                <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">60+</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  vendors and delivery partners ready to serve your street.
                </p>
              </div>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute -left-6 top-16 h-28 w-28 rounded-full bg-[#f07c2a]/20 blur-3xl" />
            <div className="absolute right-10 top-10 h-24 w-24 rounded-full bg-[#2d8a4e]/20 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/90 p-6 shadow-card-shadow-lg backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(45,138,78,0.14),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(240,124,42,0.12),_transparent_20%)]" />
              <div className="relative animate-entrance">
                <Image
                  src="/hero-illustration.svg"
                  alt="Hapo Ulipo hero illustration"
                  width={620}
                  height={480}
                  className="h-auto w-full"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12">
        <div className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primary">
              What we deliver
            </p>
            <h2 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
              Everything your day needs, delivered from nearby stores and kitchens.
            </h2>
            <p className="max-w-xl text-base leading-8 text-slate-600 dark:text-slate-300">
              From home-cooked meals to everyday essentials, Hapo Ulipo connects you with vendors
              already in your city so you can skip long waits and get what you need faster.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {featureList.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.label}
                  className="group rounded-[2rem] border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-primary/20 hover:shadow-card-shadow-lg dark:border-slate-700 dark:bg-slate-950/90"
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white dark:bg-primary/20">
                    <Icon size={24} />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-950 dark:text-white">
                    {feature.label}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-6 pb-20 sm:px-8 lg:px-12">
        <div className="rounded-[2.5rem] bg-slate-950 px-8 py-12 text-white shadow-card-shadow-lg sm:px-12 dark:bg-slate-900">
          <div className="grid gap-10 lg:grid-cols-3 lg:gap-8">
            <div className="space-y-4">
              <span className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.35em] text-slate-200">
                How it works
              </span>
              <h2 className="text-4xl font-semibold tracking-tight">
                Simple steps to shop smarter and faster.
              </h2>
            </div>

            <div className="space-y-5 rounded-[2rem] bg-white/5 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-lg font-bold text-primary">
                1
              </div>
              <h3 className="text-xl font-semibold">Choose your neighborhood</h3>
              <p className="text-sm leading-7 text-slate-300">
                Browse nearby vendors and services so you only shop from places that can deliver
                quickly.
              </p>
            </div>

            <div className="space-y-5 rounded-[2rem] bg-white/5 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-lg font-bold text-primary">
                2
              </div>
              <h3 className="text-xl font-semibold">Place an order</h3>
              <p className="text-sm leading-7 text-slate-300">
                Select items, add them to cart, and checkout with a fast and secure payment flow.
              </p>
            </div>

            <div className="space-y-5 rounded-[2rem] bg-white/5 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-lg font-bold text-primary">
                3
              </div>
              <h3 className="text-xl font-semibold">Track your delivery</h3>
              <p className="text-sm leading-7 text-slate-300">
                Follow your order in real time and receive it exactly when it arrives.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="get-started" className="mx-auto max-w-7xl px-6 pb-24 sm:px-8 lg:px-12">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-primary to-[#1e6b3a] px-8 py-16 text-white shadow-card-shadow-lg sm:px-12">
          <div className="absolute left-8 right-8 top-0 h-px bg-white/30" aria-hidden="true" />
          <div className="relative mb-10 flex flex-wrap items-center gap-2 border-b border-white/20 pb-4">
            <span className="mr-3 text-sm font-semibold uppercase tracking-[0.25em] text-[#b7e8c7]">
              How to get started
            </span>
            {Object.entries(audienceContent).map(([key, value]) => (
              <button
                key={key}
                type="button"
                onClick={() => setAudience(key as typeof audience)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${audience === key ? 'bg-white text-[#1e6b3a]' : 'text-white/75 hover:bg-white/10 hover:text-white'}`}
                aria-pressed={audience === key}
              >
                {value.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#b7e8c7]">
                Ready to move?
              </p>
              <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">{selectedAudience.title}</h2>
              <p className="text-base leading-7 text-[#def5d8]">
                {selectedAudience.description}
              </p>
              <div className="flex flex-wrap gap-3 text-sm text-[#def5d8]">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                  <CheckCircle2 size={16} /> Fresh deals every day
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                  <CheckCircle2 size={16} /> Fast checkout
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href={selectedAudience.href}
                className="btn-primary inline-flex items-center justify-center gap-2"
              >
                {selectedAudience.action} <ArrowRight size={18} />
              </Link>
              <Link
                href="#"
                className="btn-outline inline-flex items-center justify-center bg-white/10 text-white"
              >
                Request a vendor
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
