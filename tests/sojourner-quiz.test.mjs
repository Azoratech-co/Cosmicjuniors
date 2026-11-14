import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SOJOURNER_QUIZ } from "../lib/sojourner-quiz.ts";

const story = JSON.parse(readFileSync(new URL("../content/stories.json", import.meta.url), "utf8")).sojourner;

test("the quiz covers all ten story chapters with four distinct choices and one answer each", () => {
  assert.equal(SOJOURNER_QUIZ.length, 10);
  assert.deepEqual(SOJOURNER_QUIZ.map((q) => q.chapter), story.chapters.map((c) => c.n));
  assert.equal(new Set(SOJOURNER_QUIZ.map((q) => q.id)).size, 10);
  for (const question of SOJOURNER_QUIZ) {
    assert.equal(question.choices.length, 4);
    assert.equal(new Set(question.choices).size, 4);
    assert.ok(Number.isInteger(question.correctIndex));
    assert.ok(question.correctIndex >= 0 && question.correctIndex < 4);
    assert.ok(question.choices.every((choice) => choice.trim().length > 0));
    assert.ok(question.explanation.trim().length > 0);
  }
});

test("every question has exact evidence in its published story chapter", () => {
  for (const question of SOJOURNER_QUIZ) {
    const chapter = story.chapters.find((c) => c.n === question.chapter);
    const paragraph = chapter.paragraphs[question.evidence.paragraph - 1];
    assert.ok(paragraph?.includes(question.evidence.quote), `${question.id}: manuscript evidence changed; review the question and answer`);
  }
});
