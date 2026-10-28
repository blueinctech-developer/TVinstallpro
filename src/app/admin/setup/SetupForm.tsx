"use client";

import { useActionState } from "react";
import { Icon } from "@/components/Icon";
import { setPassword, type SetupState } from "./actions";
import styles from "../admin.module.css";

export function SetupForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<SetupState, FormData>(setPassword, {});
  return (
    <form action={action} className={styles.loginForm}>
      <input type="hidden" name="token" value={token} />
      <label className={styles.control}>
        New password
        <input className={styles.input} name="password" type="password" autoComplete="new-password" minLength={12} required />
      </label>
      <label className={styles.control}>
        Repeat it
        <input className={styles.input} name="again" type="password" autoComplete="new-password" minLength={12} required />
      </label>
      {state.error && (
        <p className={styles.msg} data-kind="error" role="alert">
          <Icon name="alert" size={16} /> {state.error}
        </p>
      )}
      <button type="submit" className="btn" disabled={pending} aria-busy={pending || undefined}>
        {pending ? "Saving…" : "Save password and sign in"}
      </button>
    </form>
  );
}
