import { Fragment } from "react";

/**
 * Server-rendered character split. Screen readers get the plain string; the
 * per-character spans are presentational targets for the stagger animation.
 */
export function SplitChars({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, w) => (
          <Fragment key={w}>
            <span className="split-word">
              {Array.from(word).map((ch, c) => (
                <span key={c} className="split-char" data-char="">
                  {ch}
                </span>
              ))}
            </span>
            {w < words.length - 1 && " "}
          </Fragment>
        ))}
      </span>
    </span>
  );
}
