'use client';

import { CreditCard, Hammer, BookOpen, Users, Bell } from 'lucide-react';
import Link from 'next/link';

export default function BoardMatePage() {
  const features = [
    {
      title: 'Auto-Invoices & Payments',
      desc: 'Generate dues, accept cards & ACH, automate reminders.',
      icon: CreditCard,
    },
    {
      title: 'Maintenance Ticketing',
      desc: 'Residents submit issues, vendors invited with one click.',
      icon: Hammer,
    },
    {
      title: 'Meeting Minutes',
      desc: 'AI transcribes & publishes minutes within an hour.',
      icon: BookOpen,
    },
    {
      title: 'Resident Polls',
      desc: 'Instant sentiment checks on by-laws and budgets.',
      icon: Users,
    },
    {
      title: 'Delinquency Nudges',
      desc: 'Late-fee logic + escalating reminders save admins time.',
      icon: Bell,
    },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-500 text-white">
      {/* Hero */}
      <section className="relative mx-auto flex max-w-7xl flex-col items-center px-6 py-32 text-center">
        <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[60rem] w-[60rem] -translate-x-1/2 rounded-full bg-cyan-400 opacity-30 blur-3xl" />
        <h1 className="text-4xl font-extrabold sm:text-6xl">Run your HOA like a pro—without the headaches.</h1>
        <p className="mt-6 max-w-xl text-xl text-white/90">
          BoardMate automates dues, maintenance, and resident comms so your community thrives.
        </p>
        <Link href="/demo" className="mt-10 rounded-lg bg-white/90 px-8 py-3 font-medium text-emerald-700 shadow-md backdrop-blur hover:bg-white">
          Book a Demo
        </Link>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="absolute inset-x-0 -top-24 -z-10 h-48 bg-gradient-to-b from-white/0 via-white/30 to-white" />
        <h2 className="text-center text-3xl font-bold">Only $2 per door per month</h2>
        <p className="mt-4 text-center text-gray-700">Volume discounts kick in at 200 doors. Cancel anytime.</p>
        <div className="mt-12 flex justify-center">
          <Link href="/demo" className="rounded-lg bg-emerald-600 px-8 py-3 font-medium text-white shadow hover:bg-emerald-700">
            Get a Live Demo
          </Link>
        </div>
      </section>
    </main>
  );
}