"use client";

import Image from "next/image";
import { Icon, type IconName } from "@/components/Icon";
import styles from "./OptionCards.module.css";

export type Option = {
  id: string;
  label: string;
  /** one short line under the label */
  hint?: string;
  image?: string;
  icon?: IconName;
  /** a small tag in the corner, e.g. "Instant estimate" */
  tag?: string;
};

type Props = {
  /** the step's question, read out by screen readers as the group name */
  labelledBy: string;
  options: Option[];
  layout?: "photo" | "grid" | "list" | "pills";
} & (
  | { multiple?: false; value?: string; onPick: (id: string) => void }
  | { multiple: true; value: string[]; onPick: (ids: string[]) => void }
);

/**
 * Big tap targets for one question. Each option is a real button, so a click, Enter or Space picks it.
 * A single-choice pick is reported straight away (the flow moves on); multiple choice toggles.
 */
export function OptionCards(props: Props) {
  const { labelledBy, options, layout = "grid" } = props;
  const isOn = (id: string) => (props.multiple ? props.value.includes(id) : props.value === id);
  const pick = (id: string) => {
    if (props.multiple) {
      const v = props.value;
      props.onPick(v.includes(id) ? v.filter((x) => x !== id) : [...v, id]);
    } else props.onPick(id);
  };

  return (
    <div role="group" aria-labelledby={labelledBy} className={styles.options} data-layout={layout}>
      {options.map((o, i) => (
        <button
          key={o.id}
          type="button"
          className={styles.option}
          aria-pressed={isOn(o.id)}
          onClick={() => pick(o.id)}
          style={{ "--i": i } as React.CSSProperties}
        >
          {o.image && (
            <span className={styles.photo} aria-hidden="true">
              <Image src={o.image} alt="" fill sizes="(max-width: 700px) 100vw, 360px" />
            </span>
          )}
          {o.icon && !o.image && (
            <span className={styles.icon} aria-hidden="true">
              <Icon name={o.icon} size={22} />
            </span>
          )}
          <span className={styles.text}>
            <span className={styles.label}>{o.label}</span>
            {o.hint && <span className={styles.hint}>{o.hint}</span>}
          </span>
          {o.tag && <span className={styles.tag}>{o.tag}</span>}
          <span className={styles.tick} aria-hidden="true">
            <Icon name="check" size={14} strokeWidth={2.4} />
          </span>
        </button>
      ))}
    </div>
  );
}
