"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SOJOURNER_QUIZ } from "@/lib/sojourner-quiz";
import styles from "./StoryQuiz.module.css";

const LETTERS = ["A", "B", "C", "D"];
const STORY_HREF = "/story/sojourner/text";

function AnswerMark({ correct }: { correct: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={correct ? "m5 12 4 4L19 6" : "m6 6 12 12M18 6 6 18"} />
    </svg>
  );
}

export default function StoryQuiz() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const navigated = useRef(false);
  const question = SOJOURNER_QUIZ[current];
  const selected = answers[current];
  const answered = selected !== undefined;
  const correct = answered && selected === question.correctIndex;
  const score = answers.filter((answer, i) => answer === SOJOURNER_QUIZ[i].correctIndex).length;
  const total = SOJOURNER_QUIZ.length;

  // Keep keyboard and screen-reader users at the new question after Next/Retry.
  useEffect(() => {
    if (navigated.current) heading.current?.focus();
  }, [current, finished]);

  function choose(index: number) {
    // One scored answer per question, including rapid repeated taps.
    setAnswers((previous) => previous.length === current ? [...previous, index] : previous);
  }

  function next() {
    if (!answered) return;
    navigated.current = true;
    if (current === total - 1) setFinished(true);
    else setCurrent((value) => value + 1);
  }

  function restart() {
    navigated.current = true;
    setAnswers([]);
    setCurrent(0);
    setFinished(false);
  }

  return (
    <div className={styles.quiz}>
      <div className={styles.toolbar}>
        <span className={styles.eyebrow}>Story check · Sojourner</span>
        <Link className={styles.exit} href={STORY_HREF}>
          <span aria-hidden="true">×</span> Exit quiz
        </Link>
      </div>

      {finished ? (
        <section className={styles.card} aria-labelledby="quiz-result-title">
          <div className={styles.result}>
            <span className={styles.resultIcon} aria-hidden="true">★</span>
            <p className={styles.eyebrow}>Adventure remembered</p>
            <h2 id="quiz-result-title" ref={heading} tabIndex={-1} className={styles.title}>Quiz complete!</h2>
            <p className={styles.score} aria-label={`${score} out of ${total} correct`}>
              {score}<span> / {total}</span>
            </p>
            <p className={styles.resultMessage}>
              {score === total
                ? "Good job! You remembered every part of Sojourner's adventure."
                : score >= 7
                  ? "Good job! You remembered a lot. Revisit a few chapters and try again."
                  : "Every explorer learns along the way. Revisit the story and give it another go!"}
            </p>
            <div className={styles.resultActions}>
              <button type="button" className={styles.primary} onClick={restart}>Try again <span aria-hidden="true">↻</span></button>
              <Link className={styles.secondary} href={STORY_HREF}>Read the story</Link>
            </div>
          </div>

          <details className={styles.review}>
            <summary>Review your {total} answers</summary>
            <ol className={styles.reviewList}>
              {SOJOURNER_QUIZ.map((item, i) => {
                const right = answers[i] === item.correctIndex;
                return (
                  <li key={item.id}>
                    <p className={styles.reviewQuestion}>
                      <span className={right ? styles.goodIcon : styles.wrongIcon}><AnswerMark correct={right} /></span>
                      <span><span className="sr-only">{right ? "Correct. " : "Incorrect. "}</span>{i + 1}. {item.question}</span>
                    </p>
                    {!right && <p>Your answer: {item.choices[answers[i]]}</p>}
                    <p><strong>Correct answer:</strong> {item.choices[item.correctIndex]}</p>
                    <p>{item.explanation}</p>
                    <Link href={`${STORY_HREF}#chapter-${item.chapter}`}>Revisit chapter {item.chapter} <span aria-hidden="true">↗</span></Link>
                  </li>
                );
              })}
            </ol>
          </details>
        </section>
      ) : (
        <section className={styles.card} aria-labelledby="quiz-question-title">
          <div className={styles.progressLabels}>
            <p>Question <strong>{current + 1}</strong> of {total}</p>
            <p>{score} correct</p>
          </div>
          <div className={styles.progress} role="progressbar" aria-label="Questions answered" aria-valuemin={0} aria-valuemax={total} aria-valuenow={answers.length}>
            {SOJOURNER_QUIZ.map((item, i) => (
              <span key={item.id} data-state={i < answers.length ? "answered" : i === current ? "current" : "waiting"} />
            ))}
          </div>

          <div className={styles.questionHead}>
            <p className={styles.eyebrow}>Chapter {String(question.chapter).padStart(2, "0")}</p>
            <h2 id="quiz-question-title" ref={heading} tabIndex={-1} className={styles.title}>{question.question}</h2>
            <p className={styles.hint}>Choose one answer. Every answer is in the story.</p>
          </div>

          <div className={styles.choices} role="group" aria-labelledby="quiz-question-title">
            {question.choices.map((choice, index) => {
              const isCorrect = answered && index === question.correctIndex;
              const isWrong = answered && selected === index && !isCorrect;
              const state = isCorrect ? "correct" : isWrong ? "wrong" : "idle";
              return (
                <button
                  key={`${question.id}-${index}`}
                  type="button"
                  className={styles.choice}
                  data-state={state}
                  aria-disabled={answered}
                  aria-pressed={selected === index}
                  onClick={() => choose(index)}
                >
                  <span className={styles.letter} aria-hidden="true">{LETTERS[index]}</span>
                  <span className={styles.choiceCopy}>
                    <span>{choice}</span>
                    {isCorrect && <span className={styles.choiceStatus}>{correct ? "Good job!" : "Correct answer"}</span>}
                    {isWrong && <span className={styles.choiceStatus}>Not quite</span>}
                  </span>
                  {(isCorrect || isWrong) && <AnswerMark correct={isCorrect} />}
                </button>
              );
            })}
          </div>

          <div className={styles.feedback} role="status" aria-live="polite" aria-atomic="true">
            {answered && (
              <div className={styles.feedbackContent}>
                <span className={correct ? styles.goodIcon : styles.wrongIcon}><AnswerMark correct={correct} /></span>
                <div>
                  <p className={styles.feedbackTitle}>{correct ? "Good job! You got it right." : "Not quite. Here's the story reminder."}</p>
                  <p>{question.explanation}</p>
                  <Link href={`${STORY_HREF}#chapter-${question.chapter}`}>Revisit chapter {question.chapter} <span aria-hidden="true">↗</span></Link>
                </div>
              </div>
            )}
          </div>

          <div className={styles.bottom}>
            <p>No timer. Take your time.</p>
            <button type="button" className={styles.primary} onClick={next} disabled={!answered}>
              {current === total - 1 ? "See results" : "Next question"} <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>
      )}
      <p className={styles.footnote}>Based on <Link href={STORY_HREF}>Sojourner: The Journey Through the Stars</Link>.<br />Ten questions, one from each chapter. You can leave whenever you like.</p>
    </div>
  );
}
