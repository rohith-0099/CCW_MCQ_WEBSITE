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
const OPTION_KEYS = ["A", "B", "C", "D"];

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
      <main className="min-h-screen bg-background px-4 py-5 text-slate-100 sm:px-6 sm:py-8">
        <div className="mx-auto w-full max-w-4xl">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-[22px] py-8 text-zinc-100">
      <div className="mx-auto flex w-full max-w-md flex-col gap-5">
        <header className="sticky top-0 z-10 -mx-[22px] flex flex-col gap-2 border-b border-white/[0.06] bg-background px-[22px] pb-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-400">
                Mock Test
              </p>
              <h1 className="text-xl font-medium leading-tight">
                Full-length MCQ Exam
              </h1>
            </div>
            <Link
              href="/"
              className="rounded-lg border border-white/[0.06] px-3 py-2 text-sm text-zinc-400 transition hover:border-white/[0.12] hover:text-zinc-100"
            >
              Home
            </Link>
          </div>
          <p className="text-sm text-zinc-400">
            50 questions • 10 per subject • 1 hour timer
          </p>
        </header>

        {!session ? (
          <section className="rounded-xl border border-white/[0.06] bg-panel p-5">
            <p className="text-sm leading-[1.55] text-zinc-400">
              Start the mock test to get a randomized set of questions in the
              official subject order.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={startNewSession}
                className="w-full rounded-[10px] bg-accent px-4 py-3.5 text-sm font-semibold text-accentInk transition hover:opacity-90 sm:w-auto"
              >
                Start Mock Test
              </button>
            </div>
          </section>
        ) : submitted ? (
          <section className="flex flex-col gap-6">
            <div className="rounded-xl border border-white/[0.06] bg-panel p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-medium">Results</h2>
                  <p className="mt-1 text-sm text-zinc-300">
                    Score: {scoreSummary?.correct} / {TOTAL_QUESTIONS}
                  </p>
                  <p className="text-sm text-zinc-600">
                    Correct: {scoreSummary?.correct} • Wrong: {scoreSummary?.wrong}
                  </p>
                </div>
                <button
                  onClick={startNewSession}
                  className="w-full rounded-[10px] border border-white/[0.06] bg-panel px-4 py-3.5 text-sm font-medium text-zinc-100 transition hover:border-white/[0.12] sm:w-auto"
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
                    className="rounded-xl border border-white/[0.06] bg-panel p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-600">
                      <span>
                        {index + 1}. {question.subject}
                      </span>
                      <span
                        className={`rounded-md border px-2 py-1 text-[10px] ${
                          isCorrect
                            ? "border-correct text-correct"
                            : "border-incorrect text-incorrect"
                        }`}
                      >
                        {isCorrect ? "Correct" : "Wrong"}
                      </span>
                    </div>
                    <h3 className="mt-4 text-[15px] font-medium leading-[1.45] text-zinc-100">
                      {question.stem}
                    </h3>
                    <div className="mt-4 grid gap-2 text-sm">
                      {question.options.map((option, optionIndex) => {
                        const isAnswer = optionIndex === question.answer;
                        const isSelected = optionIndex === selected;
                        const optionStyles = isAnswer
                          ? "border-correct bg-correct/10 text-zinc-100"
                          : isSelected
                          ? "border-incorrect bg-incorrect/10 text-zinc-100"
                          : "border-white/[0.06] bg-panel text-zinc-100";
                        const markerStyles = isAnswer
                          ? "border-correct bg-correct text-background"
                          : isSelected
                          ? "border-incorrect bg-incorrect text-background"
                          : "border-white/[0.12] text-zinc-400";
                        return (
                          <div
                            key={option}
                            className={`flex items-start gap-3 rounded-[10px] border px-4 py-3.5 text-[15px] leading-[1.45] ${optionStyles}`}
                          >
                            <span
                              className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md border font-mono text-[11px] font-medium ${markerStyles}`}
                            >
                              {OPTION_KEYS[optionIndex]}
                            </span>
                            <span className="pt-0.5">{option}</span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-4 text-sm text-zinc-300">
                      <span className="font-semibold text-correct">
                        Correct answer:
                      </span>{" "}
                      {question.options[question.answer]}
                    </p>
                    <p className="mt-2 text-sm leading-[1.55] text-zinc-400">
                      {question.explanation}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="rounded-xl border border-white/[0.06] bg-panel p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-600">
              <span>
                Question {session.currentIndex + 1} / {session.questionIds.length}
              </span>
              <span className="rounded-md border border-white/[0.06] bg-surface2 px-3 py-2 font-mono text-[10px] text-zinc-400">
                {formatTime(timeLeftMs)} remaining
              </span>
            </div>

            <div className="mt-3 h-0.5 w-full overflow-hidden rounded-sm bg-white/[0.06]">
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
                <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-600">
                  {currentQuestion.subject} — {SUBJECT_LABELS[currentQuestion.subject]}
                </div>
                <h2 className="mt-3 text-[21px] font-medium leading-[1.32] text-zinc-100">
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
                        className={`flex w-full items-start gap-3 rounded-[10px] border px-4 py-3.5 text-left text-[15px] leading-[1.45] transition hover:border-white/[0.12] ${
                          isSelected
                            ? "border-accent bg-accentSoft text-zinc-100"
                            : "border-white/[0.06] bg-panel text-zinc-100"
                        }`}
                      >
                        <span
                          className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md border font-mono text-[11px] font-medium ${
                            isSelected
                              ? "border-accent bg-accent text-accentInk"
                              : "border-white/[0.12] text-zinc-400"
                          }`}
                        >
                          {OPTION_KEYS[optionIndex]}
                        </span>
                        <span className="pt-0.5">{option}</span>
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
                    className="rounded-[10px] border border-white/[0.06] bg-panel px-4 py-3.5 text-sm font-medium text-zinc-100 transition hover:border-white/[0.12] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleSubmit}
                      className="rounded-[10px] border border-white/[0.06] bg-panel px-4 py-3.5 text-sm font-medium text-zinc-100 transition hover:border-white/[0.12]"
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
                      className="rounded-[10px] bg-accent px-5 py-3.5 text-sm font-semibold text-accentInk transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
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
