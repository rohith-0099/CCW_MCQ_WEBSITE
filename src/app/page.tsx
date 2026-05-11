import Link from "next/link";
import { SUBJECT_LABELS } from "@/data/questions";
import { SUBJECTS } from "@/lib/question-utils";

const cardBase =
  "rounded-lg border border-slate-200 bg-panel p-4 shadow-sm transition hover:border-accent hover:shadow-md";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            ADT308 Practice Hub
          </p>
          <h1 className="text-2xl font-semibold leading-tight text-slate-950 sm:text-3xl">
            MCQ practice, kept focused.
          </h1>
          <p className="text-sm leading-6 text-slate-600">
            Pick a subject to drill down, or jump into a full-length mock test.
            Each session is freshly randomized for focused practice.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2">
          {SUBJECTS.map((subject) => (
            <Link
              key={subject}
              href={`/practice/${subject}`}
              className={cardBase}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {subject}
                  </p>
                  <h2 className="mt-1 text-base font-semibold leading-snug text-slate-950">
                    {SUBJECT_LABELS[subject]}
                  </h2>
                </div>
                <span className="shrink-0 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600">
                  Practice
                </span>
              </div>
            </Link>
          ))}
        </section>

        <section className="flex flex-col items-start gap-4 rounded-lg border border-slate-200 bg-panel p-4 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Mock Test
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">
              Full-length exam simulation
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              50 questions • 1 hour • Subject order aligned with the paper
            </p>
          </div>
          <Link
            href="/mock-test"
            className="inline-flex w-full justify-center rounded-md bg-accent px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accentSoft sm:w-auto"
          >
            Start Mock Test
          </Link>
        </section>
      </div>
    </main>
  );
}
