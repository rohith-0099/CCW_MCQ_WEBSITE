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

const QUESTION_OPTIONS = [5, 10, 15, 20];
const OPTION_KEYS = ["A", "B", "C", "D"];

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
  const [showExplanation, setShowExplanation] = useState(true);

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

    const stored = localStorage.getItem(getSessionKey(subject));
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as PracticeSession;
        const validQuestionIds = parsed.questionIds.filter((id) => {
          const question = questionMap.get(id);
          return question?.subject === subject;
        });
        if (validQuestionIds.length > 0) {
          setSession({
            ...parsed,
            questionIds: validQuestionIds,
            count: validQuestionIds.length,
            currentIndex: Math.min(parsed.currentIndex, validQuestionIds.length - 1),
          });
        } else {
          localStorage.removeItem(getSessionKey(subject));
        }
      } catch {
        localStorage.removeItem(getSessionKey(subject));
      }
    }
    setLoading(false);
  }, [isValidSubject, questionMap, subject]);

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

  const clearSession = () => {
    localStorage.removeItem(getSessionKey(subject));
    setSession(null);
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
  const progressLabel = session ? Math.round(progress) : 0;
  const answeredCount = session ? Object.keys(session.answers).length : 0;
  const correctSoFar = session
    ? Object.entries(session.answers).reduce((total, [id, answer]) => {
        const question = questionMap.get(id);
        if (question && question.answer === answer) {
          return total + 1;
        }
        return total;
      }, 0)
    : 0;
  const elapsedMinutes = session
    ? Math.max(0, Math.floor((Date.now() - session.startedAt) / 60000))
    : 0;

  const renderOption = (question: Question, optionIndex: number) => {
    const isCorrect = optionIndex === question.answer;
    const isSelected = selectedAnswer === optionIndex;
    const isAnswered = selectedAnswer !== undefined;

    let classes = "border-white/[0.06] bg-panel text-zinc-100";
    let markerClasses = "border-white/[0.12] text-zinc-400";
    if (isAnswered && isCorrect) {
      classes = "border-correct bg-correct/10 text-zinc-100";
      markerClasses = "border-correct bg-correct text-background";
    } else if (isAnswered && isSelected && !isCorrect) {
      classes = "border-incorrect bg-incorrect/10 text-zinc-100";
      markerClasses = "border-incorrect bg-incorrect text-background";
    } else if (isSelected) {
      classes = "border-accent bg-accentSoft text-zinc-100";
      markerClasses = "border-accent bg-accent text-accentInk";
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
        className={`flex w-full items-start gap-3 rounded-[10px] border px-4 py-3.5 text-left text-[15px] leading-[1.45] transition hover:border-white/[0.12] ${classes}`}
      >
        <span
          className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md border font-mono text-[11px] font-medium ${markerClasses}`}
        >
          {OPTION_KEYS[optionIndex]}
        </span>
        <span className="pt-0.5">{question.options[optionIndex]}</span>
      </button>
    );
  };

  return (
    <main className="min-h-screen bg-background px-[22px] py-8 text-zinc-100">
      <div className="mx-auto flex w-full max-w-md flex-col gap-5">
        <header className="sticky top-0 z-10 -mx-[22px] flex flex-col gap-3 border-b border-white/[0.06] bg-background px-[22px] pb-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-400">
                {subject}
              </p>
              <h1 className="text-xl font-medium leading-tight">
                {SUBJECT_LABELS[subject]}
              </h1>
              <p className="mt-1 text-xs text-zinc-500">
                {subjectQuestions.length} questions available
              </p>
            </div>
            <div className="flex items-center gap-2">
              {session && (
                <span className="rounded-full border border-white/[0.06] bg-panel px-2.5 py-1 font-mono text-[10px] text-zinc-500">
                  autosaved
                </span>
              )}
              <Link
                href="/"
                className="rounded-lg border border-white/[0.06] px-3 py-2 text-sm text-zinc-400 transition hover:border-white/[0.12] hover:text-zinc-100"
              >
                Home
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-panel p-4">
            <p className="text-sm font-medium text-zinc-400">Choose question count</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {availableCounts.map((count) => (
                <button
                  key={count}
                  onClick={() => createSession(count)}
                  className="rounded-md border border-white/[0.06] bg-surface2 px-4 py-2 font-mono text-[11px] text-zinc-400 transition hover:border-white/[0.12] hover:text-zinc-100"
                >
                  {count}
                </button>
              ))}
              <button
                onClick={() => createSession(-1)}
                className="rounded-md border border-white/[0.06] bg-surface2 px-4 py-2 font-mono text-[11px] text-zinc-400 transition hover:border-white/[0.12] hover:text-zinc-100"
              >
                All
              </button>
            </div>
          </div>

          {session && (
            <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-panel px-4 py-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.1em] text-zinc-600">
                  Session in progress
                </p>
                <p className="text-sm text-zinc-300">
                  {session.questionIds.length} questions • {session.currentIndex + 1} answered
                </p>
              </div>
              <button
                onClick={clearSession}
                className="rounded-md border border-white/[0.06] bg-surface2 px-3 py-2 font-mono text-[10px] text-zinc-400 transition hover:border-white/[0.12] hover:text-zinc-100"
              >
                Clear
              </button>
            </div>
          )}
        </header>

        {!session || !currentQuestion ? (
          <div className="rounded-xl border border-white/[0.06] bg-panel p-4">
            <p className="text-sm text-zinc-400">
              Start a practice session to load questions.
            </p>
          </div>
        ) : (
          <section className="rounded-xl border border-white/[0.06] bg-panel p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3 text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-600">
              <span>
                Question {session.currentIndex + 1} / {session.questionIds.length}
              </span>
              <span>{answeredCount} answered</span>
              <span>{session.questionIds.length - answeredCount} remaining</span>
              <span>{elapsedMinutes} min</span>
              <button
                onClick={() => createSession(session.count)}
                className="rounded-md border border-white/[0.06] bg-surface2 px-3 py-2 font-mono text-[10px] text-zinc-400 transition hover:border-white/[0.12] hover:text-zinc-100"
              >
                New Session
              </button>
            </div>

            <div className="mt-3 h-0.5 w-full overflow-hidden rounded-sm bg-white/[0.06]">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Progress: {Math.round(progress)}%
            </p>
            <p className="mt-2 text-xs text-zinc-500">Progress: {progressLabel}%</p>

            <h2 className="mt-5 text-[21px] font-medium leading-[1.32] text-zinc-100">
              {currentQuestion.stem}
            </h2>
            <p className="mt-2 text-xs text-zinc-500">Question ID: {currentQuestion.id}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-medium uppercase tracking-[0.1em] text-zinc-500">
              {currentQuestion.module && (
                <span className="rounded-full border border-white/[0.06] bg-surface2 px-2.5 py-1">
                  Module {currentQuestion.module}
                </span>
              )}
              {currentQuestion.bloom && (
                <span className="rounded-full border border-white/[0.06] bg-surface2 px-2.5 py-1">
                  Bloom {currentQuestion.bloom}
                </span>
              )}
              {currentQuestion.confidence && (
                <span className="rounded-full border border-white/[0.06] bg-surface2 px-2.5 py-1">
                  {currentQuestion.confidence} confidence
                </span>
              )}
            </div>

            <div className="mt-5 grid gap-3">
              {currentQuestion.options.map((_, index) =>
                renderOption(currentQuestion, index)
              )}
            </div>

            {selectedAnswer !== undefined && showExplanation && (
              <div className="mt-5 rounded-[10px] border border-white/[0.06] bg-panel p-4">
                <p className="text-sm font-medium text-correct">
                  Correct answer: {currentQuestion.options[currentQuestion.answer]}
                </p>
                <p className="mt-2 text-sm leading-[1.55] text-zinc-400">
                  {currentQuestion.explanation}
                </p>
              </div>
            )}
            {selectedAnswer !== undefined && (
              <p className="mt-3 text-xs text-zinc-500">Answer saved.</p>
            )}

            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-xs text-zinc-500">
                Correct so far: {correctSoFar} / {answeredCount}
              </p>
              <button
                onClick={() => setShowExplanation((prev) => !prev)}
                className="rounded-md border border-white/[0.06] bg-surface2 px-3 py-2 font-mono text-[10px] text-zinc-400 transition hover:border-white/[0.12] hover:text-zinc-100"
              >
                {showExplanation ? "Hide" : "Show"} explanation
              </button>
              <button
                onClick={() =>
                  updateSession({
                    currentIndex: Math.max(session.currentIndex - 1, 0),
                  })
                }
                disabled={session.currentIndex === 0}
                className="rounded-[10px] border border-white/[0.06] bg-panel px-4 py-3.5 text-sm font-medium text-zinc-100 transition hover:border-white/[0.12] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => updateSession({ currentIndex: 0 })}
                disabled={session.currentIndex === 0}
                className="rounded-[10px] border border-white/[0.06] bg-panel px-4 py-3.5 text-sm font-medium text-zinc-100 transition hover:border-white/[0.12] disabled:cursor-not-allowed disabled:opacity-40"
              >
                First
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
                className="rounded-[10px] bg-accent px-5 py-3.5 text-sm font-semibold text-accentInk transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
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
