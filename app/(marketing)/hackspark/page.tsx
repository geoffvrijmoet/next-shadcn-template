'use client';

import { Sparkles, Slack, BarChart4, Gavel, Video } from 'lucide-react';
import Link from 'next/link';

export default function HackSparkPage() {
  const features = [
    {
      title: 'Theme & Challenge Generator',
      desc: 'AI crafts problem statements tailored to your goals.',
      icon: Sparkles,
    },
    {
      title: 'Auto Slack Setup',
      desc: 'Channels, roles, and intro messages provisioned instantly.',
      icon: Slack,
    },
    {
      title: 'Live Leaderboard',
      desc: 'Real-time voting and progress tracking keep energy high.',
      icon: BarChart4,
    },
    {
      title: 'Judge Portal',
      desc: 'Rubric-based scoring with automatic tie-breakers.',
      icon: Gavel,
    },
    {
      title: 'Recap Video & Wiki',
      desc: 'Auto-edited highlight reel and Confluence export.',
      icon: Video,
    },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-gradient-to-br from-fuchsia-600 via-pink-600 to-purple-600 text-white">
      {/* Hero */}
      <section className="relative mx-auto flex max-w-7xl flex-col items-center px-6 py-32 text-center">
        <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[60rem] w-[60rem] -translate-x-1/2 rounded-full bg-purple-400 opacity-30 blur-3xl" />
        <h1 className="text-4xl font-extrabold sm:text-6xl">Spin up a company hackathon in 60 seconds.</h1>
        <p className="mt-6 max-w-xl text-xl text-white/90">
          HackSpark auto-creates challenges, Slack channels, judging rubrics, and a slick demo-day site—so you just show up for the fun.
        </p>
        <Link href="/event-planner" className="mt-10 rounded-lg bg-white/90 px-8 py-3 font-medium text-fuchsia-700 shadow-md backdrop-blur hover:bg-white">
          Plan My Event
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
        <h2 className="text-center text-3xl font-bold">Base package $1 999 covers up to 50 participants</h2>
        <p className="mt-4 text-center text-gray-700">Need more room? Add participants at just $10 each.</p>
        <div className="mt-12 flex justify-center">
          <Link href="/event-planner" className="rounded-lg bg-fuchsia-600 px-8 py-3 font-medium text-white shadow hover:bg-fuchsia-700">
            Check Your Date
          </Link>
        </div>
      </section>
    </main>
  );
}