"use client";

import { useActionState, useState } from "react";
import { Icon } from "@/components/Icon";
import { roles, type Role } from "@/lib/admin/vocab";
import styles from "../../admin.module.css";
import { addUser, updateUser, type UserActionResult } from "./actions";

/** Success/error line, plus the one-time link (shown once, never stored in readable form). */
export function Result({ state }: { state: UserActionResult }) {
  const [copied, setCopied] = useState(false);
  if (state.error)
    return (
      <p className={styles.msg} data-kind="error" role="alert">
        <Icon name="alert" size={16} /> {state.error}
      </p>
    );
  if (!state.ok) return null;
  return (
    <div role="status" style={{ display: "grid", gap: 8 }}>
      <p className={styles.msg} data-kind="ok">
        <Icon name="check" size={16} /> {state.ok}
      </p>
      {state.link && (
        <div className={styles.notice} style={{ display: "grid", gap: 8 }}>
          <span className={styles.small}>
            Send this link to {state.linkFor} (WhatsApp, text or email). It lets them choose their own password, works once, and
            expires in 72 hours. It won&apos;t be shown again.
          </span>
          <input className={styles.input} readOnly value={state.link} onFocus={(e) => e.currentTarget.select()} aria-label="Password link" />
          <button
            type="button"
            className={`btn btn--ghost ${styles.btnSm}`}
            onClick={() => navigator.clipboard.writeText(state.link!).then(() => setCopied(true))}
          >
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      )}
    </div>
  );
}

export function AddUserForm() {
  const [state, action, pending] = useActionState<UserActionResult, FormData>(addUser, {});
  return (
    <form action={action} className={styles.loginForm} key={state.link ?? "new"}>
      <label className={styles.control}>
        Name
        <input name="name" className={styles.input} required maxLength={120} />
      </label>
      <label className={styles.control}>
        Email
        <input name="email" type="email" className={styles.input} required autoComplete="off" />
      </label>
      <label className={styles.control}>
        Role
        <select name="role" className={styles.select} defaultValue="staff">
          {(Object.keys(roles) as Role[]).map((r) => (
            <option key={r} value={r}>
              {roles[r]}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className={`btn ${styles.btnSm}`} disabled={pending} aria-busy={pending || undefined}>
        {pending ? "Adding…" : "Add and create link"}
      </button>
      <Result state={state} />
    </form>
  );
}

export function UserRowActions({ id, role, disabled, isMe }: { id: number; role: Role; disabled: boolean; isMe: boolean }) {
  const [state, action, pending] = useActionState<UserActionResult, FormData>(updateUser, {});
  return (
    <div style={{ display: "grid", gap: 8, minWidth: 220 }}>
      <form action={action} className={styles.formRow}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="op" value="role" />
        <select name="role" defaultValue={role} className={styles.select} aria-label="Role" disabled={isMe}>
          {(Object.keys(roles) as Role[]).map((r) => (
            <option key={r} value={r}>
              {roles[r]}
            </option>
          ))}
        </select>
        {!isMe && (
          <button type="submit" className={`btn btn--ghost ${styles.btnSm}`} disabled={pending}>
            Save
          </button>
        )}
      </form>
      <div className={styles.formRow}>
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="op" value="reset" />
          <button type="submit" className={`btn btn--ghost ${styles.btnSm}`} disabled={pending}>
            Password link
          </button>
        </form>
        {!isMe && (
          <form
            action={action}
            onSubmit={(e) => {
              if (!disabled && !confirm("Disable this account? They'll be signed out and can't sign in until enabled again.")) e.preventDefault();
            }}
          >
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="op" value={disabled ? "enable" : "disable"} />
            <button type="submit" className={`btn btn--ghost ${styles.btnSm}`} disabled={pending}>
              {disabled ? "Enable" : "Disable"}
            </button>
          </form>
        )}
      </div>
      <Result state={state} />
    </div>
  );
}
