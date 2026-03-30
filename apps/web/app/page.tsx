import Link from 'next/link';

const features = [
  'Adaptive AI-style difficulty like the CAT exam',
  'Five curated databases with realistic schemas',
  'Deterministic grading plus AI-powered coaching',
  'Keyboard-friendly SQL workspace with Monaco editor',
];

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-16">
      <section className="rounded-3xl bg-white p-10 shadow-lg shadow-indigo-100">
        <p className="mb-4 inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
          SQL CAT-Style Trainer · Railway ready
        </p>
        <h1 className="mb-6 text-4xl font-semibold text-slate-900 sm:text-5xl">
          Master SQL with adaptive challenges and instant coaching.
        </h1>
        <p className="mb-8 text-lg text-slate-600">
          Practice against production-grade schemas, watch the difficulty climb with every correct answer, and learn why the
          optimal query wins. No login required.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/practice"
            className="rounded-full bg-brand-600 px-6 py-3 text-white shadow-lg shadow-brand-200 transition hover:bg-brand-500"
          >
            Start Practicing
          </Link>
          <a
            href="https://railway.app"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-slate-300 px-6 py-3 text-slate-700 hover:border-slate-400"
          >
            Deploy on Railway
          </a>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        {features.map((feature) => (
          <div key={feature} className="rounded-2xl border border-slate-100 bg-white/90 p-6 shadow-sm">
            <span className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-brand-600">
              ?
            </span>
            <p className="text-lg font-medium text-slate-900">{feature}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
