import type { Question, Subject } from "@/data/questions";

export const SUBJECTS: Subject[] = ["IML", "DS", "OS", "DBMS", "FDS"];

export function shuffleArray<T>(items: T[]): T[] {
  const array = [...items];
  for (let index = array.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[swapIndex]] = [array[swapIndex], array[index]];
  }
  return array;
}

export function pickRandom<T>(items: T[], count: number): T[] {
  if (count >= items.length) {
    return shuffleArray(items);
  }
  return shuffleArray(items).slice(0, count);
}

export function groupBySubject(questions: Question[]): Record<Subject, Question[]> {
  return questions.reduce(
    (acc, question) => {
      acc[question.subject].push(question);
      return acc;
    },
    {
      IML: [],
      DS: [],
      OS: [],
      DBMS: [],
      FDS: [],
    } satisfies Record<Subject, Question[]>
  );
}
