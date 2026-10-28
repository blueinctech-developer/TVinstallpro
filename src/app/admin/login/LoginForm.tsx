"use client";

import { useActionState } from "react";
import { Icon } from "@/components/Icon";
import { login, type LoginState } from "../actions";
import styles from "../admin.module.css";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className={styles.loginForm} noValidate>
      <label className={styles.control}>
        Email
        <input
          className={styles.input}
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          defaultValue={state.email}
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "login-error" : undefined}
        />
      </label>
      <label className={styles.control}>
        Password
        <input
          className={styles.input}
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "login-error" : undefined}
        />
      </label>
      {state.error && (
        <p id="login-error" className={styles.msg} data-kind="error" role="alert">
          <Icon name="alert" size={16} /> {state.error}
        </p>
      )}
      <button type="submit" className="btn" disabled={pending} aria-busy={pending || undefined}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
