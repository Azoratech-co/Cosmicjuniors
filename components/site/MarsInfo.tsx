import { Children, cloneElement, isValidElement, type ReactNode } from "react";
import TypedDescription from "./TypedDescription";
import styles from "./LandingGlobe.module.css";

type InfoProps = {
  title: string;
  label?: string;
  summary?: ReactNode;
  fields?: readonly (readonly [label: string, value: ReactNode])[];
  more?: { title?: string; content: ReactNode };
  sources?: ReactNode;
  action?: ReactNode;
  reveal?: boolean;
};

// Sequence text in render order while keeping semantic elements like links and dates intact.
function createTextReveal(active: boolean | undefined) {
  let offset = 0;

  function render(node: ReactNode): ReactNode {
    if (active === undefined) return node;
    return Children.map(node, (child) => {
      if (typeof child === "string" || typeof child === "number") {
        const text = String(child);
        const startAt = offset;
        offset += text.length;
        return text.trim() ? <TypedDescription text={text} active={active} startAt={startAt} /> : child;
      }
      if (isValidElement<{ children?: ReactNode }>(child) && child.props.children != null) {
        return cloneElement(child, undefined, render(child.props.children));
      }
      return child;
    });
  }

  return render;
}

export default function MarsInfo({ title, label, summary, fields, more, sources, action, reveal }: InfoProps) {
  const render = createTextReveal(reveal);
  return (
    <>
      <div className={styles.infoIntro}>
        {label && <p className={styles.infoLabel}>{render(label)}</p>}
        <h4 className={styles.infoTitle}>{render(title)}</h4>
        {summary && <p className={styles.summary}>{render(summary)}</p>}
      </div>
      <div>
        {fields && <dl className={styles.metadata}>
          {fields.map(([name, value]) => <div key={name}>
            <dt>{render(`${name}:`)}</dt>{" "}<dd>{render(value)}</dd>
          </div>)}
        </dl>}
        {more && <div className={styles.infoHighlight}>
          <h5 className={styles.infoLabel}>{render("More information")}</h5>
          {more.title && <h6>{render(more.title)}</h6>}
          <p>{render(more.content)}</p>
        </div>}
      </div>
      {sources && <div className={styles.sources}>{render(sources)}</div>}
      {render(action)}
    </>
  );
}
