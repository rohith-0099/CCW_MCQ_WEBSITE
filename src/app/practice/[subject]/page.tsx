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
      <main className="min-h-screen bg-background px-6 py-10 text-slate-100">
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
      <main className="min-h-screen bg-background px-6 py-10 text-slate-100">
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

    let classes = "border-slate-700 bg-slate-900/60 text-slate-100";
    if (isAnswered && isCorrect) {
      classes = "border-emerald-400 bg-emerald-500/20 text-emerald-100";
    } else if (isAnswered && isSelected && !isCorrect) {
      classes = "border-rose-400 bg-rose-500/20 text-rose-100";
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
        className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition hover:border-accent/70 ${classes}`}
      >
        {question.options[optionIndex]}
      </button>
    );
  };

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-slate-100">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                {subject}
              </p>
              <h1 className="text-2xl font-semibold">
                {SUBJECT_LABELS[subject]}
              </h1>
            </div>
            <Link
              href="/"
              className="text-sm text-slate-300 transition hover:text-white"
            >
              Home
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-panel/70 p-4">
            <p className="text-sm text-slate-300">Choose question count</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {availableCounts.map((count) => (
                <button
                  key={count}
                  onClick={() => createSession(count)}
                  className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-200 transition hover:border-accent"
                >
                  {count}
                </button>
              ))}
              <button
                onClick={() => createSession(-1)}
                className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-200 transition hover:border-accent"
              >
                All
              </button>
            </div>
          </div>
        </header>

        {!session || !currentQuestion ? (
          <div className="rounded-2xl border border-slate-800 bg-panel/70 p-6">
            <p className="text-slate-300">
              Start a practice session to load questions.
            </p>
          </div>
        ) : (
          <section className="rounded-2xl border border-slate-800 bg-panel/70 p-6">
            <div className="flex items-center justify-between text-xs uppercase tracking-wider text-slate-400">
              <span>
                Question {session.currentIndex + 1} / {session.questionIds.length}
              </span>
              <button
                onClick={() => createSession(session.count)}
                className="rounded-full border border-slate-700 px-3 py-1 text-[10px] text-slate-200 transition hover:border-accent"
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

            <h2 className="mt-6 text-lg font-semibold text-white">
              {currentQuestion.stem}
            </h2>

            <div className="mt-5 grid gap-3">
              {currentQuestion.options.map((_, index) =>
                renderOption(currentQuestion, index)
              )}
            </div>

            {selectedAnswer !== undefined && (
              <div className="mt-6 rounded-xl border border-slate-700 bg-slate-950/80 p-4">
                <p className="text-sm text-emerald-200">
                  Correct answer: {currentQuestion.options[currentQuestion.answer]}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  {currentQuestion.explanation}
                </p>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() =>
                  updateSession({
                    currentIndex: Math.max(session.currentIndex - 1, 0),
                  })
                }
                disabled={session.currentIndex === 0}
                className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-accent disabled:cursor-not-allowed disabled:opacity-40"
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
                className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accentSoft disabled:cursor-not-allowed disabled:opacity-40"
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
