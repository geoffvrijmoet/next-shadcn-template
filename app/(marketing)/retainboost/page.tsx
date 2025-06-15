'use client';

import { TrendingUp, Mail, FlaskConical, DollarSign } from 'lucide-react';
import Link from 'next/link';

export default function RetainBoostPage() {
  const features = [
    {
      title: 'Predictive Churn Scoring',
      desc: 'Machine-learning model flags accounts 30 days before they quit.',
      icon: TrendingUp,
    },
    {
      title: 'Auto-Personalized Outreach',
      desc: "Emails & in-app nudges tailored to each user's behavior.",
      icon: Mail,
    },
    {
      title: 'Experiment Engine',
      desc: 'Run A/B tests on subject lines, discounts & timing—zero code.',
      icon: FlaskConical,
    },
    {
      title: 'ROI Dashboard',
      desc: 'Track every saved dollar back to the exact playbook.',
      icon: DollarSign,
    },
  ];

  const tiers = [
    { name: 'Starter', price: '$49/mo', desc: 'Up to $10 K MRR', href: '/signup' },
    { name: 'Growth', price: '1% recovered', desc: 'Over $10 K MRR', href: '/contact' },
    { name: 'Enterprise', price: 'Custom', desc: 'Dedicated CSM & SSO', href: '/contact' },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">
      {/* Hero */}
      <section className="relative mx-auto flex max-w-7xl flex-col items-center px-6 py-32 text-center">
        {/* Decorative gradient blob */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[60rem] w-[60rem] -translate-x-1/2 rounded-full bg-pink-400 opacity-30 blur-3xl" />
        <h1 className="text-4xl font-extrabold sm:text-6xl">
          Win back customers before they click&nbsp;"Cancel".
        </h1>
        <p className="mt-6 max-w-xl text-xl text-white/90">
          RetainBoost predicts churn 30 days early and launches AI-written win-back playbooks—so you grow MRR while you sleep.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/signup" className="rounded-lg bg-white/90 px-8 py-3 font-medium text-indigo-700 shadow-md backdrop-blur hover:bg-white">
            Start Free Trial
          </Link>
          <Link href="#features" className="text-white/90 underline-offset-4 hover:underline">
            See How It Works →
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ title, desc, icon: Icon }) => (
            <div
              key={title}
              className="group relative overflow-hidden rounded-3xl bg-white/10 p-6 backdrop-blur-lg transition hover:scale-105 hover:bg-white/20"
            >
              <Icon className="h-10 w-10 text-white" />
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-white/90">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="relative bg-white py-24 text-gray-900">
        {/* background glass overlay */}
        <div className="absolute inset-x-0 -top-24 -z-10 h-48 bg-gradient-to-b from-white/0 via-white/30 to-white" />
        <h2 className="text-center text-3xl font-bold">Simple, performance-based pricing</h2>
        <div className="mx-auto mt-12 grid max-w-4xl gap-8 px-6 sm:grid-cols-3">
          {tiers.map(({ name, price, desc, href }) => (
            <div
              key={name}
              className="rounded-3xl border border-gray-200/40 bg-white/60 p-8 shadow-2xl backdrop-blur-lg backdrop-filter transition hover:shadow-3xl"
            >
              <h3 className="text-xl font-semibold text-indigo-700">{name}</h3>
              <p className="mt-4 text-3xl font-bold text-gray-900">{price}</p>
              <p className="mt-2 text-sm text-gray-600">{desc}</p>
              <Link
                href={href}
                className="mt-6 inline-block rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
              >
                {name === 'Starter' ? 'Start Now' : 'Contact Sales'}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}