import type { CSSProperties } from "react";
import styles from "./TypedDescription.module.css";

export default function TypedDescription({ text, active }: { text: string; active: boolean }) {
  const words = text.split(" ");
  let offset = 0;
  return (
    <>
      <span className={styles.visuallyHidden}>{text}</span>
      <span aria-hidden="true" className={styles.description} data-active={active}>
        {words.map((word, index) => {
          const start = offset;
          offset += word.length + 1;
          return (
            <span key={index} className={styles.word}>
              {Array.from(word, (letter, letterIndex) => (
                <span key={letterIndex} style={{ "--letter-delay": `${5 * (start + letterIndex)}ms` } as CSSProperties}>{letter}</span>
              ))}
              {index < words.length - 1 ? " " : ""}
            </span>
          );
        })}
      </span>
    </>
  );
}
