"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  EXAM_ORDER,
  QUESTIONS,
  SUBJECT_LABELS,
  type Question,
  type Subject,
} from "@/data/questions";
import { groupBySubject, pickRandom } from "@/lib/question-utils";

type MockTestSession = {
  questionIds: string[];
  answers: Record<string, number>;
  currentIndex: number;
  startedAt: number;
  durationMs: number;
  completedAt?: number;
};

const SESSION_KEY = "mock-test";
const TOTAL_QUESTIONS = 50;
const QUESTIONS_PER_SUBJECT = 10;
const DURATION_MS = 60 * 60 * 1000;

function formatTime(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

function buildSession(subjectGroups: Record<Subject, Question[]>): MockTestSession {
  const questionIds = EXAM_ORDER.flatMap((subject) =>
    pickRandom(subjectGroups[subject], QUESTIONS_PER_SUBJECT).map(
      (question) => question.id
    )
  );
  return {
    questionIds,
    answers: {},
    currentIndex: 0,
    startedAt: Date.now(),
    durationMs: DURATION_MS,
  };
}

export default function MockTestPage() {
  const questionMap = useMemo(
    () => new Map(QUESTIONS.map((question) => [question.id, question])),
    []
  );
  const subjectGroups = useMemo(() => groupBySubject(QUESTIONS), []);

  const [session, setSession] = useState<MockTestSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeftMs, setTimeLeftMs] = useState(DURATION_MS);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!session || submitted) return;

    const tick = () => {
      const remaining = Math.max(
        0,
        session.durationMs - (Date.now() - session.startedAt)
      );
      setTimeLeftMs(remaining);
      if (remaining === 0) {
        handleSubmit();
      }
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [session, submitted]);

  const startNewSession = () => {
    const nextSession = buildSession(subjectGroups);
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
    setSubmitted(false);
    setTimeLeftMs(DURATION_MS);
  };

  const updateSession = (updates: Partial<MockTestSession>) => {
    setSession((prev) => {
      if (!prev) return prev;
      const nextSession = { ...prev, ...updates };
      localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
      return nextSession;
    });
  };

  const handleSubmit = () => {
    setSession((prev) => {
      if (!prev) return prev;
      const nextSession = { ...prev, completedAt: Date.now() };
      localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
      return nextSession;
    });
    setSubmitted(true);
  };

  const currentQuestion = session
    ? questionMap.get(session.questionIds[session.currentIndex])
    : null;

  const selectedAnswer = currentQuestion
    ? session?.answers[currentQuestion.id]
    : undefined;

  const scoreSummary = useMemo(() => {
    if (!session) return null;
    let correct = 0;
    session.questionIds.forEach((id) => {
      const question = questionMap.get(id);
      if (!question) return;
      const selected = session.answers[id];
      if (selected === question.answer) correct += 1;
    });
    return {
      correct,
      wrong: session.questionIds.length - correct,
    };
  }, [session, questionMap]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-4 py-5 text-slate-950 sm:px-6 sm:py-8">
        <div className="mx-auto w-full max-w-4xl">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-5 text-slate-950 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <header className="flex flex-col gap-2 border-b border-slate-200 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Mock Test
              </p>
              <h1 className="text-xl font-semibold leading-tight sm:text-2xl">
                Full-length MCQ Exam
              </h1>
            </div>
            <Link
              href="/"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:border-accent hover:text-accent"
            >
              Home
            </Link>
          </div>
          <p className="text-sm text-slate-600">
            50 questions • 10 per subject • 1 hour timer
          </p>
        </header>

        {!session ? (
          <section className="rounded-lg border border-slate-200 bg-panel p-4 shadow-sm">
            <p className="text-sm leading-6 text-slate-600">
              Start the mock test to get a randomized set of questions in the
              official subject order.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={startNewSession}
                className="w-full rounded-md bg-accent px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accentSoft sm:w-auto"
              >
                Start Mock Test
              </button>
            </div>
          </section>
        ) : submitted ? (
          <section className="flex flex-col gap-6">
            <div className="rounded-lg border border-slate-200 bg-panel p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">Results</h2>
                  <p className="mt-1 text-sm text-slate-700">
                    Score: {scoreSummary?.correct} / {TOTAL_QUESTIONS}
                  </p>
                  <p className="text-sm text-slate-500">
                    Correct: {scoreSummary?.correct} • Wrong: {scoreSummary?.wrong}
                  </p>
                </div>
                <button
                  onClick={startNewSession}
                  className="w-full rounded-md border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-accent hover:text-accent sm:w-auto"
                >
                  Start New Mock Test
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {session.questionIds.map((id, index) => {
                const question = questionMap.get(id);
                if (!question) return null;
                const selected = session.answers[id];
                const isCorrect = selected === question.answer;
                return (
                  <div
                    key={id}
                    className="rounded-lg border border-slate-200 bg-panel p-4 shadow-sm sm:p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <span>
                        {index + 1}. {question.subject}
                      </span>
                      <span
                        className={`rounded-md border px-2 py-1 text-[10px] ${
                          isCorrect
                            ? "border-emerald-500 text-emerald-700"
                            : "border-rose-500 text-rose-700"
                        }`}
                      >
                        {isCorrect ? "Correct" : "Wrong"}
                      </span>
                    </div>
                    <h3 className="mt-4 text-base font-semibold leading-7 text-slate-950">
                      {question.stem}
                    </h3>
                    <div className="mt-4 grid gap-2 text-sm">
                      {question.options.map((option, optionIndex) => {
                        const isAnswer = optionIndex === question.answer;
                        const isSelected = optionIndex === selected;
                        const optionStyles = isAnswer
                          ? "border-emerald-500 bg-emerald-50 text-emerald-950"
                          : isSelected
                          ? "border-rose-500 bg-rose-50 text-rose-950"
                          : "border-slate-200 bg-white text-slate-900";
                        return (
                          <div
                            key={option}
                            className={`rounded-lg border px-3 py-2 leading-6 ${optionStyles}`}
                          >
                            {option}
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-4 text-sm text-slate-700">
                      <span className="font-semibold text-emerald-700">
                        Correct answer:
                      </span>{" "}
                      {question.options[question.answer]}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {question.explanation}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="rounded-lg border border-slate-200 bg-panel p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <span>
                Question {session.currentIndex + 1} / {session.questionIds.length}
              </span>
              <span className="rounded-md border border-slate-200 px-3 py-2 text-[10px] text-slate-700">
                {formatTime(timeLeftMs)} remaining
              </span>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-accent transition-all"
                style={{
                  width: `${
                    ((session.currentIndex + 1) / session.questionIds.length) *
                    100
                  }%`,
                }}
              />
            </div>

            {currentQuestion && (
              <div className="mt-6">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  {currentQuestion.subject} — {SUBJECT_LABELS[currentQuestion.subject]}
                </div>
                <h2 className="mt-3 text-base font-semibold leading-7 text-slate-950 sm:text-lg">
                  {currentQuestion.stem}
                </h2>

                <div className="mt-5 grid gap-3">
                  {currentQuestion.options.map((option, optionIndex) => {
                    const isSelected = selectedAnswer === optionIndex;
                    return (
                      <button
                        key={option}
                        onClick={() =>
                          updateSession({
                            answers: {
                              ...(session?.answers ?? {}),
                              [currentQuestion.id]: optionIndex,
                            },
                          })
                        }
                        className={`w-full rounded-lg border px-4 py-3 text-left text-sm leading-6 transition hover:border-accent ${
                          isSelected
                            ? "border-accent bg-blue-50 text-slate-950"
                            : "border-slate-200 bg-white text-slate-900"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={() =>
                      updateSession({
                        currentIndex: Math.max(session.currentIndex - 1, 0),
                      })
                    }
                    disabled={session.currentIndex === 0}
                    className="rounded-md border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleSubmit}
                      className="rounded-md border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-accent hover:text-accent"
                    >
                      Submit
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
                      disabled={
                        session.currentIndex >= session.questionIds.length - 1
                      }
                      className="rounded-md bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accentSoft disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
