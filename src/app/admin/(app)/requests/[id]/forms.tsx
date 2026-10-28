"use client";

import { useActionState, useEffect, useRef } from "react";
import { Icon } from "@/components/Icon";
import { statusOrder, statuses, type Status } from "@/lib/admin/vocab";
import { addNoteAction, changeStatus, type ActionResult } from "../../../actions";
import styles from "../../../admin.module.css";

function Message({ state }: { state: ActionResult }) {
  if (state.error)
    return (
      <p className={styles.msg} data-kind="error" role="alert">
        <Icon name="alert" size={16} /> {state.error}
      </p>
    );
  if (state.ok)
    return (
      <p className={styles.msg} data-kind="ok" role="status">
        <Icon name="check" size={16} /> {state.ok}
      </p>
    );
  return null;
}

export function StatusForm({ id, current }: { id: number; current: Status }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(changeStatus, {});
  return (
    <form action={action} className={styles.loginForm}>
      <input type="hidden" name="id" value={id} />
      {/* The status the page was showing: if someone changed it meanwhile, the server refuses. */}
      <input type="hidden" name="from" value={current} />
      <label className={styles.control}>
        Change status to
        <select name="to" defaultValue={current} className={styles.select} key={current}>
          {statusOrder.map((s) => (
            <option key={s} value={s}>
              {statuses[s].label}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className={`btn ${styles.btnSm}`} disabled={pending} aria-busy={pending || undefined}>
        {pending ? "Saving…" : "Save status"}
      </button>
      <Message state={state} />
    </form>
  );
}

export function NoteForm({ id }: { id: number }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(addNoteAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form action={action} ref={ref} className={styles.loginForm}>
      <input type="hidden" name="id" value={id} />
      <label className={styles.control}>
        Add an internal note
        <textarea name="body" className={styles.textarea} maxLength={4000} placeholder="Called, left a voicemail…" required />
      </label>
      <button type="submit" className={`btn btn--ghost ${styles.btnSm}`} disabled={pending} aria-busy={pending || undefined}>
        {pending ? "Adding…" : "Add note"}
      </button>
      <Message state={state} />
    </form>
  );
}
