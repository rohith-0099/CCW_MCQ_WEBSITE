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
      <main className="min-h-screen bg-background px-6 py-10 text-slate-100">
        <div className="mx-auto w-full max-w-4xl">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Mock Test
              </p>
              <h1 className="text-2xl font-semibold">
                Full-length MCQ Exam
              </h1>
            </div>
            <Link
              href="/"
              className="text-sm text-slate-300 transition hover:text-white"
            >
              Home
            </Link>
          </div>
          <p className="text-sm text-slate-400">
            50 questions • 10 per subject • 1 hour timer
          </p>
        </header>

        {!session ? (
          <section className="rounded-2xl border border-slate-800 bg-panel/70 p-6">
            <p className="text-slate-300">
              Start the mock test to get a randomized set of questions in the
              official subject order.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={startNewSession}
                className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-accentSoft"
              >
                Start Mock Test
              </button>
            </div>
          </section>
        ) : submitted ? (
          <section className="flex flex-col gap-6">
            <div className="rounded-2xl border border-slate-800 bg-panel/70 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">Results</h2>
                  <p className="mt-1 text-sm text-slate-300">
                    Score: {scoreSummary?.correct} / {TOTAL_QUESTIONS}
                  </p>
                  <p className="text-sm text-slate-400">
                    Correct: {scoreSummary?.correct} • Wrong: {scoreSummary?.wrong}
                  </p>
                </div>
                <button
                  onClick={startNewSession}
                  className="rounded-full border border-slate-700 px-5 py-2 text-sm text-slate-200 transition hover:border-accent"
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
                    className="rounded-2xl border border-slate-800 bg-panel/70 p-6"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-wider text-slate-400">
                      <span>
                        {index + 1}. {question.subject}
                      </span>
                      <span
                        className={`rounded-full border px-3 py-1 text-[10px] ${
                          isCorrect
                            ? "border-emerald-400 text-emerald-200"
                            : "border-rose-400 text-rose-200"
                        }`}
                      >
                        {isCorrect ? "Correct" : "Wrong"}
                      </span>
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-white">
                      {question.stem}
                    </h3>
                    <div className="mt-4 grid gap-2 text-sm">
                      {question.options.map((option, optionIndex) => {
                        const isAnswer = optionIndex === question.answer;
                        const isSelected = optionIndex === selected;
                        const optionStyles = isAnswer
                          ? "border-emerald-400 bg-emerald-500/10 text-emerald-100"
                          : isSelected
                          ? "border-rose-400 bg-rose-500/10 text-rose-100"
                          : "border-slate-700 bg-slate-900/50 text-slate-200";
                        return (
                          <div
                            key={option}
                            className={`rounded-xl border px-3 py-2 ${optionStyles}`}
                          >
                            {option}
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-4 text-sm text-slate-300">
                      <span className="font-semibold text-emerald-200">
                        Correct answer:
                      </span>{" "}
                      {question.options[question.answer]}
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      {question.explanation}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-slate-800 bg-panel/70 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs uppercase tracking-wider text-slate-400">
              <span>
                Question {session.currentIndex + 1} / {session.questionIds.length}
              </span>
              <span className="rounded-full border border-slate-700 px-3 py-1 text-[10px] text-slate-200">
                {formatTime(timeLeftMs)} remaining
              </span>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
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
                <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  {currentQuestion.subject} — {SUBJECT_LABELS[currentQuestion.subject]}
                </div>
                <h2 className="mt-3 text-lg font-semibold text-white">
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
                        className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition hover:border-accent/70 ${
                          isSelected
                            ? "border-accent bg-accent/10 text-white"
                            : "border-slate-700 bg-slate-900/60 text-slate-200"
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
                    className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-accent disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleSubmit}
                      className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-accent"
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
                      className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accentSoft disabled:cursor-not-allowed disabled:opacity-40"
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
