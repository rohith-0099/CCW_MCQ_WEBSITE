import Link from "next/link";
import { QUESTIONS, SUBJECT_LABELS } from "@/data/questions";
import { SUBJECTS } from "@/lib/question-utils";

const cardBase =
  "group flex items-center gap-3 border-b border-white/[0.06] px-4 py-3.5 transition last:border-b-0 hover:bg-surface2";

export default function HomePage() {
  const subjectCounts = SUBJECTS.reduce<Record<string, number>>((acc, subject) => {
    acc[subject] = QUESTIONS.filter((question) => question.subject === subject).length;
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-background px-[22px] py-12">
      <div className="mx-auto flex w-full max-w-md flex-col">
        <header className="mb-9 flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-400">
            ADT 308
          </p>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-white/[0.06] bg-panel px-2.5 py-1 font-mono text-[10px] text-zinc-400">
              {QUESTIONS.length} Qs
            </span>
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/[0.06] bg-panel font-mono text-[10px] text-zinc-400">
              A
            </div>
          </div>
        </header>

        <section className="mb-9">
          <h1 className="text-[32px] font-medium leading-[1.12] text-zinc-100">
            MCQ practice,
            <br />
            <span className="font-normal text-zinc-400">kept focused.</span>
          </h1>
          <p className="mt-4 text-sm leading-[1.55] text-zinc-400">
            Pick a subject to drill down, or jump into a full-length mock test.
            Each session is freshly randomized.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500">
            <span className="rounded-full border border-white/[0.06] bg-panel px-3 py-1">
              {SUBJECTS.length} subjects
            </span>
            <span className="rounded-full border border-white/[0.06] bg-panel px-3 py-1">
              {QUESTIONS.length} questions
            </span>
            <span className="rounded-full border border-white/[0.06] bg-panel px-3 py-1">
              randomized sets
            </span>
          </div>
        </section>

        <section className="mb-9">
          <div className="mb-3.5 flex items-baseline justify-between">
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-400">
              Subjects
            </p>
            <p className="font-mono text-[10px] text-zinc-600">{SUBJECTS.length}</p>
          </div>
          <p className="mb-3 text-xs text-zinc-500">
            Pick a topic to start a focused practice run.
          </p>

          <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-panel">
            {SUBJECTS.map((subject) => (
              <Link key={subject} href={`/practice/${subject}`} className={cardBase}>
                <span className="flex h-8 min-w-11 items-center justify-center rounded-md border border-white/[0.06] bg-surface2 px-2 font-mono text-[11px] font-medium text-zinc-100">
                  {subject}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium leading-5 text-zinc-100">
                    {SUBJECT_LABELS[subject]}
                  </span>
                  <span className="mt-0.5 block text-xs text-zinc-600">
                    {subjectCounts[subject]} questions
                  </span>
                </span>
                <span className="font-mono text-sm text-zinc-600 transition group-hover:text-zinc-100">
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-9 rounded-xl border border-white/[0.06] bg-panel p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-400">
            Practice tips
          </p>
          <ul className="mt-3 space-y-2 text-xs text-zinc-500">
            <li>Start with 10-15 question bursts to warm up.</li>
            <li>Use mock mode to simulate the full exam flow.</li>
            <li>Review explanations after each attempt.</li>
          </ul>
        </section>

        <section>
          <p className="mb-3.5 text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-400">
            Mock test
          </p>
          <Link
            href="/mock-test"
            className="block rounded-xl border border-white/[0.06] bg-panel p-5 transition hover:border-white/[0.12]"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-white/[0.06] bg-surface2 px-2.5 py-1 font-mono text-[10px] text-zinc-400">
                exam mode
              </span>
            </div>
            <h2 className="text-xl font-medium leading-tight text-zinc-100">
              Full-length exam simulation
            </h2>
            <p className="mt-2.5 text-[13px] leading-5 text-zinc-400">
              Subject order aligned with the paper.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-medium uppercase tracking-[0.1em] text-zinc-500">
              {SUBJECTS.map((subject) => (
                <span
                  key={subject}
                  className="rounded-full border border-white/[0.06] bg-surface2 px-2.5 py-1"
                >
                  {subject}
                </span>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <span className="rounded-md border border-white/[0.06] bg-surface2 px-2.5 py-1.5 font-mono text-[11px] text-zinc-400">
                50 questions
              </span>
              <span className="rounded-md border border-white/[0.06] bg-surface2 px-2.5 py-1.5 font-mono text-[11px] text-zinc-400">
                1 hour
              </span>
              <span className="rounded-md border border-white/[0.06] bg-surface2 px-2.5 py-1.5 font-mono text-[11px] text-zinc-400">
                5 subjects
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-4">
              <span className="text-[13px] font-medium text-zinc-100">
                Start mock test
              </span>
              <span className="font-mono text-sm text-zinc-100">→</span>
            </div>
          </Link>
        </section>
      </div>
    </main>
  );
}
