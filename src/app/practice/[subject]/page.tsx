"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { QUESTIONS, SUBJECT_LABELS, type Question, type Subject } from "@/data/questions";
import { SUBJECTS, pickRandom, shuffleArray } from "@/lib/question-utils";

type PracticeSession = {
  subject: Subject;
  count: number;
  questionIds: string[];
  currentIndex: number;
  answers: Record<string, number>;
  startedAt: number;
};

const QUESTION_OPTIONS = [5, 10, 20];

function getSessionKey(subject: Subject) {
  return `practice:${subject}`;
}

export default function PracticePage({ params }: { params: { subject: string } }) {
  const subject = params.subject.toUpperCase() as Subject;
  const isValidSubject = SUBJECTS.includes(subject);

  const subjectQuestions = useMemo(
    () => QUESTIONS.filter((question) => question.subject === subject),
    [subject]
  );

  const questionMap = useMemo(() => {
    return new Map(QUESTIONS.map((question) => [question.id, question]));
  }, []);

  const [session, setSession] = useState<PracticeSession | null>(null);
  const [loading, setLoading] = useState(true);

  const availableCounts = useMemo(() => {
    if (!isValidSubject) {
      return [] as number[];
    }
    return QUESTION_OPTIONS.filter((count) => count <= subjectQuestions.length);
  }, [isValidSubject, subjectQuestions.length]);

  useEffect(() => {
    if (!isValidSubject) {
      setLoading(false);
      return;
    }
    setLoading(false);
  }, [isValidSubject]);

  const createSession = (count: number) => {
    const total = count === -1 ? subjectQuestions.length : count;
    const selectedQuestions = pickRandom(subjectQuestions, total);
    const questionIds = shuffleArray(selectedQuestions.map((question) => question.id));
    const nextSession: PracticeSession = {
      subject,
      count: total,
      questionIds,
      currentIndex: 0,
      answers: {},
      startedAt: Date.now(),
    };
    localStorage.setItem(getSessionKey(subject), JSON.stringify(nextSession));
    setSession(nextSession);
  };

  const updateSession = (updates: Partial<PracticeSession>) => {
    setSession((prev) => {
      if (!prev) return prev;
      const nextSession = { ...prev, ...updates };
      localStorage.setItem(getSessionKey(subject), JSON.stringify(nextSession));
      return nextSession;
    });
  };

  if (!isValidSubject) {
    return (
      <main className="min-h-screen bg-background px-4 py-5 text-slate-100 sm:px-6 sm:py-8">
        <div className="mx-auto w-full max-w-3xl">
          <h1 className="text-2xl font-semibold">Unknown subject.</h1>
          <Link href="/" className="mt-4 inline-flex text-accent">
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-4 py-5 text-slate-100 sm:px-6 sm:py-8">
        <div className="mx-auto w-full max-w-3xl">Loading...</div>
      </main>
    );
  }

  const currentQuestion = session
    ? questionMap.get(session.questionIds[session.currentIndex])
    : null;

  const selectedAnswer = currentQuestion
    ? session?.answers[currentQuestion.id]
    : undefined;

  const progress = session
    ? ((session.currentIndex + 1) / session.questionIds.length) * 100
    : 0;

  const renderOption = (question: Question, optionIndex: number) => {
    const isCorrect = optionIndex === question.answer;
    const isSelected = selectedAnswer === optionIndex;
    const isAnswered = selectedAnswer !== undefined;

    let classes =
      "border-white/10 bg-white/[0.06] text-slate-100 shadow-glow backdrop-blur-md";
    if (isAnswered && isCorrect) {
      classes =
        "border-emerald-400/70 bg-emerald-500/15 text-emerald-100 shadow-glow backdrop-blur-md";
    } else if (isAnswered && isSelected && !isCorrect) {
      classes =
        "border-rose-400/70 bg-rose-500/15 text-rose-100 shadow-glow backdrop-blur-md";
    }

    return (
      <button
        key={optionIndex}
        onClick={() =>
          updateSession({
            answers: {
              ...(session?.answers ?? {}),
              [question.id]: optionIndex,
            },
          })
        }
        className={`w-full rounded-lg border px-4 py-3 text-left text-sm leading-6 transition hover:border-accent ${classes}`}
      >
        {question.options[optionIndex]}
      </button>
    );
  };

  return (
    <main className="min-h-screen bg-background px-4 py-5 text-slate-100 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <header className="flex flex-col gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                {subject}
              </p>
              <h1 className="text-xl font-semibold leading-tight sm:text-2xl">
                {SUBJECT_LABELS[subject]}
              </h1>
            </div>
            <Link
              href="/"
              className="rounded-md border border-slate-700/80 bg-slate-950/40 px-3 py-2 text-sm text-slate-300 transition hover:border-accent hover:text-accent"
            >
              Home
            </Link>
          </div>

          <div className="rounded-lg border border-slate-800/80 bg-panel p-4 shadow-glow">
            <p className="text-sm font-medium text-slate-300">Choose question count</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {availableCounts.map((count) => (
                <button
                  key={count}
                  onClick={() => createSession(count)}
                  className="rounded-md border border-slate-700/80 bg-slate-950/70 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-300 transition hover:border-accent hover:text-accent"
                >
                  {count}
                </button>
              ))}
              <button
                onClick={() => createSession(-1)}
                className="rounded-md border border-slate-700/80 bg-slate-950/70 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-300 transition hover:border-accent hover:text-accent"
              >
                All
              </button>
            </div>
          </div>
        </header>

        {!session || !currentQuestion ? (
          <div className="rounded-lg border border-slate-800/80 bg-panel p-4 shadow-glow">
            <p className="text-sm text-slate-400">
              Start a practice session to load questions.
            </p>
          </div>
        ) : (
          <section className="rounded-lg border border-slate-800/80 bg-panel p-4 shadow-glow sm:p-5">
            <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <span>
                Question {session.currentIndex + 1} / {session.questionIds.length}
              </span>
              <button
                onClick={() => createSession(session.count)}
                className="rounded-md border border-slate-700/80 bg-slate-950/40 px-3 py-2 text-[10px] text-slate-300 transition hover:border-accent hover:text-accent"
              >
                New Session
              </button>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            <h2 className="mt-5 text-base font-semibold leading-7 text-slate-100 sm:text-lg">
              {currentQuestion.stem}
            </h2>

            <div className="mt-5 grid gap-3">
              {currentQuestion.options.map((_, index) =>
                renderOption(currentQuestion, index)
              )}
            </div>

            {selectedAnswer !== undefined && (
              <div className="mt-5 rounded-lg border border-slate-800/80 bg-slate-900/80 p-4 shadow-glow">
                <p className="text-sm font-medium text-emerald-300">
                  Correct answer: {currentQuestion.options[currentQuestion.answer]}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {currentQuestion.explanation}
                </p>
              </div>
            )}

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                onClick={() =>
                  updateSession({
                    currentIndex: Math.max(session.currentIndex - 1, 0),
                  })
                }
                disabled={session.currentIndex === 0}
                className="rounded-md border border-slate-700/80 bg-slate-950/40 px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  updateSession({
                    currentIndex: Math.min(
                      session.currentIndex + 1,
                      session.questionIds.length - 1
                    ),
                  })
                }
                disabled={session.currentIndex >= session.questionIds.length - 1}
                className="rounded-md bg-accent px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-accentSoft disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
