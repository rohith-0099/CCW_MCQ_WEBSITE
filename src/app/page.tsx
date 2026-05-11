import Link from "next/link";
import { SUBJECT_LABELS } from "@/data/questions";
import { SUBJECTS } from "@/lib/question-utils";

const cardBase =
  "rounded-2xl border border-slate-800 bg-panel/80 p-6 shadow-lg transition hover:-translate-y-1 hover:border-accent/70 hover:shadow-glow";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-slate-900 to-black px-6 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="flex flex-col gap-4">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
            ADT308 Practice Hub
          </p>
          <h1 className="text-4xl font-semibold text-white md:text-5xl">
            Master your MCQs with focused practice sessions.
          </h1>
          <p className="max-w-2xl text-base text-slate-300">
            Pick a subject to drill down, or jump into a full-length mock test.
            Each session is freshly randomized for focused practice.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          {SUBJECTS.map((subject) => (
            <Link
              key={subject}
              href={`/practice/${subject}`}
              className={cardBase}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    {subject}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    {SUBJECT_LABELS[subject]}
                  </h2>
                </div>
                <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                  Practice
                </span>
              </div>
            </Link>
          ))}
        </section>

        <section className="flex flex-col items-start gap-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Mock Test
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Full-length exam simulation
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              50 questions • 1 hour • Subject order aligned with the paper
            </p>
          </div>
          <Link
            href="/mock-test"
            className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-accentSoft"
          >
            Start Mock Test
          </Link>
        </section>
      </div>
    </main>
  );
}
