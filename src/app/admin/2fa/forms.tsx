"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Icon } from "@/components/Icon";
import styles from "../admin.module.css";
import { confirmSetup, verifyMfa, type MfaState } from "./actions";

function CodeField({
  label,
  hint,
  error,
  recovery,
}: {
  label: string;
  hint?: string;
  error?: string;
  recovery?: boolean;
}) {
  return (
    <label className={styles.control}>
      {label}
      <input
        className={styles.input}
        name="code"
        type="text"
        inputMode={recovery ? "text" : "numeric"}
        autoComplete="one-time-code"
        autoCapitalize="characters"
        spellCheck={false}
        maxLength={recovery ? 12 : 7}
        pattern={recovery ? undefined : "[0-9 ]*"}
        required
        autoFocus
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "mfa-error" : hint ? "mfa-hint" : undefined}
        style={{
          fontSize: "1.25rem",
          letterSpacing: recovery ? "0.08em" : "0.3em",
          fontVariantNumeric: "tabular-nums",
        }}
      />
      {hint && (
        <span
          id="mfa-hint"
          className={styles.sub}
          style={{ fontSize: "0.875rem" }}
        >
          {hint}
        </span>
      )}
    </label>
  );
}

function ErrorMsg({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p id="mfa-error" className={styles.msg} data-kind="error" role="alert">
      <Icon name="alert" size={16} /> {error}
    </p>
  );
}

/** Set-up: scan, confirm one code, then show the recovery codes exactly once. */
export function SetupForm({
  qr,
  secret,
  account,
}: {
  qr: string;
  secret: string;
  account: string;
}) {
  const [state, action, pending] = useActionState<MfaState, FormData>(
    confirmSetup,
    {},
  );
  const [copied, setCopied] = useState(false);

  if (state.recoveryCodes) {
    const text = `TV Install Pro admin recovery codes\nEach code works once.\n\n${state.recoveryCodes.join("\n")}\n`;
    return (
      <div className={styles.loginForm}>
        <p className={styles.msg} data-kind="ok" role="status">
          <Icon name="check" size={16} /> Two-factor sign-in is on.
        </p>
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
            Save your recovery codes
          </h2>
          <p className={styles.sub}>
            If you lose your phone, each code lets you sign in once. Keep them
            somewhere safe, like a password manager. They won&apos;t be shown
            again.
          </p>
        </div>
        <ol
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px 16px",
            margin: 0,
            padding: "16px 20px",
            listStyle: "none",
            borderRadius: 12,
            background: "var(--surface)",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: "0.95rem",
          }}
        >
          {state.recoveryCodes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ol>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button
            type="button"
            className={`btn btn--ghost ${styles.btnSm}`}
            onClick={() =>
              navigator.clipboard?.writeText(text).then(() => setCopied(true))
            }
          >
            {copied ? "Copied" : "Copy codes"}
          </button>
          <a
            className={`btn btn--ghost ${styles.btnSm}`}
            href={`data:text/plain;charset=utf-8,${encodeURIComponent(text)}`}
            download="tvinstallpro-recovery-codes.txt"
          >
            Download .txt
          </a>
        </div>
        <Link href="/admin" className="btn">
          I&apos;ve saved them, continue
        </Link>
      </div>
    );
  }

  return (
    <>
      <ol
        style={{
          display: "grid",
          gap: 14,
          margin: 0,
          paddingLeft: 20,
          fontSize: "0.95rem",
        }}
      >
        <li>
          Install an authenticator app on your phone, such as{" "}
          <strong>Google Authenticator</strong>,{" "}
          <strong>Microsoft Authenticator</strong> or 1Password.
        </li>
        <li>In the app, add an account and scan this code:</li>
      </ol>
      <div
        aria-label="QR code for your authenticator app"
        role="img"
        style={{
          width: 196,
          padding: 14,
          margin: "0 auto",
          background: "#fff",
          border: "1px solid var(--line)",
          borderRadius: 14,
          lineHeight: 0,
        }}
        dangerouslySetInnerHTML={{ __html: qr }}
      />
      <details>
        <summary
          style={{ cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" }}
        >
          Can&apos;t scan? Enter this key instead
        </summary>
        <p style={{ marginTop: 8, fontSize: "0.9rem" }} className={styles.sub}>
          Account: {account} · Time-based
        </p>
        <code
          style={{
            display: "block",
            marginTop: 6,
            padding: "10px 12px",
            borderRadius: 10,
            background: "var(--surface)",
            fontSize: "0.95rem",
            letterSpacing: "0.06em",
            wordBreak: "break-all",
          }}
        >
          {secret}
        </code>
      </details>
      <ol start={3} style={{ margin: 0, paddingLeft: 20, fontSize: "0.95rem" }}>
        <li>Enter the 6-digit code the app shows for TV Install Pro.</li>
      </ol>
      <form action={action} className={styles.loginForm} noValidate>
        <CodeField label="6-digit code from the app" error={state.error} />
        <ErrorMsg error={state.error} />
        <button
          type="submit"
          className="btn"
          disabled={pending}
          aria-busy={pending || undefined}
        >
          {pending ? "Checking…" : "Turn on two-factor sign-in"}
        </button>
      </form>
    </>
  );
}

/** Each sign-in. */
export function VerifyForm() {
  const [state, action, pending] = useActionState<MfaState, FormData>(
    verifyMfa,
    {},
  );
  const [recovery, setRecovery] = useState(false);
  return (
    <form
      action={action}
      className={styles.loginForm}
      noValidate
      key={recovery ? "r" : "c"}
    >
      <CodeField
        label={recovery ? "Recovery code" : "6-digit code"}
        hint={
          recovery
            ? "One of the codes you saved when you set up 2FA, e.g. ABCDE-FGHJK."
            : "Open your authenticator app and enter the code for TV Install Pro."
        }
        error={state.error}
        recovery={recovery}
      />
      <ErrorMsg error={state.error} />
      <button
        type="submit"
        className="btn"
        disabled={pending}
        aria-busy={pending || undefined}
      >
        {pending ? "Checking…" : "Verify"}
      </button>
      <button
        type="button"
        className={`btn btn--ghost ${styles.btnSm}`}
        onClick={() => setRecovery((v) => !v)}
      >
        {recovery
          ? "Use the app code instead"
          : "Lost your phone? Use a recovery code"}
      </button>
    </form>
  );
}
