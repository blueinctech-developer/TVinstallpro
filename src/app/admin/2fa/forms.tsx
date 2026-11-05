"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Icon } from "@/components/Icon";
import styles from "../admin.module.css";
import { confirmSetup, verifyMfa, type MfaState } from "./actions";
import m from "./mfa.module.css";

function CodeField({ label, hint, error, recovery }: { label: string; hint?: string; error?: string; recovery?: boolean }) {
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
          minHeight: 52,
          fontSize: "1.35rem",
          letterSpacing: recovery ? "0.08em" : "0.32em",
          fontVariantNumeric: "tabular-nums",
          textAlign: "center",
        }}
      />
      {hint && (
        <span id="mfa-hint" className={m.small}>
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

/** Set-up: scan, confirm one code, then the recovery codes (shown once) in the same panel. */
export function SetupScreen({ qr, secret, account }: { qr: string; secret: string; account: string }) {
  const [state, action, pending] = useActionState<MfaState, FormData>(confirmSetup, {});
  const [copied, setCopied] = useState(false);

  if (state.recoveryCodes) {
    const text = `TV Install Pro admin recovery codes\nEach code works once.\n\n${state.recoveryCodes.join("\n")}\n`;
    return (
      <div className={m.panel}>
        <section className={m.col}>
          <p className={styles.msg} data-kind="ok" role="status">
            <Icon name="check" size={16} /> Two-factor sign-in is on
          </p>
          <h1 className={m.title}>
            Save your <span className="ghost">recovery codes.</span>
          </h1>
          <p className={m.lead}>
            If you ever lose your phone, each of these codes lets you sign in once. Keep them somewhere safe, like a password
            manager or a printed copy. They won&apos;t be shown again.
          </p>
          <p className={m.small}>From now on, you&apos;ll enter a code from your authenticator app each time you sign in.</p>
        </section>
        <section className={m.col}>
          <ol className={m.codes} aria-label="Recovery codes">
            {state.recoveryCodes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ol>
          <div className={m.row}>
            <button
              type="button"
              className={`btn btn--ghost ${styles.btnSm}`}
              onClick={() => navigator.clipboard?.writeText(text).then(() => setCopied(true))}
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
          <div className={m.form}>
            <Link href="/admin" className="btn">
              I&apos;ve saved them, continue
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={m.panel}>
      <section className={m.col}>
        <h1 className={m.title}>
          Set up <span className="ghost">two-factor sign-in.</span>
        </h1>
        <p className={m.lead}>Required for every admin account. It takes a minute, and protects your bookings and customers.</p>
        <ol className={m.steps}>
          <li>
            <span>
              Install an authenticator app on your phone, such as <strong>Google Authenticator</strong>,{" "}
              <strong>Microsoft Authenticator</strong> or 1Password.
            </span>
          </li>
          <li>
            <span>In the app, add an account and scan this QR code.</span>
          </li>
        </ol>
        <div className={m.scan}>
          <div className={m.qr} role="img" aria-label="QR code for your authenticator app" dangerouslySetInnerHTML={{ __html: qr }} />
          <div>
            <p className={m.keyLabel}>Can&apos;t scan? Enter this key</p>
            <code className={m.key}>{secret}</code>
            <p className={m.small} style={{ marginTop: 6 }}>
              Account: {account} · Time-based
            </p>
          </div>
        </div>
      </section>

      <section className={m.col}>
        <ol className={m.steps} style={{ counterReset: "step 2" }}>
          <li>
            <span>
              <strong>Enter the 6-digit code</strong> the app now shows for TV Install Pro.
            </span>
          </li>
        </ol>
        <form action={action} className={m.form} noValidate>
          <CodeField label="6-digit code" error={state.error} />
          <ErrorMsg error={state.error} />
          <button type="submit" className="btn" disabled={pending} aria-busy={pending || undefined}>
            {pending ? "Checking…" : "Turn on two-factor sign-in"}
          </button>
        </form>
        <p className={m.small}>
          The code changes every 30 seconds. If it doesn&apos;t work, check your phone&apos;s time is set automatically and use the
          newest code.
        </p>
      </section>
    </div>
  );
}

/** Each sign-in. */
export function VerifyScreen() {
  const [state, action, pending] = useActionState<MfaState, FormData>(verifyMfa, {});
  const [recovery, setRecovery] = useState(false);
  return (
    <div className={m.panel}>
      <section className={m.col} style={{ alignContent: "center" }}>
        <h1 className={m.title}>
          Two-factor <span className="ghost">sign-in.</span>
        </h1>
        <p className={m.lead}>
          One more step to open the dashboard. Open your authenticator app and enter the current code for TV Install Pro.
        </p>
        <p className={m.small}>
          Lost your phone? Use one of the recovery codes you saved when you set this up, or ask another administrator to reset
          your two-factor sign-in.
        </p>
      </section>
      <section className={m.col}>
        <form action={action} className={m.form} noValidate key={recovery ? "r" : "c"}>
          <CodeField
            label={recovery ? "Recovery code" : "6-digit code"}
            hint={recovery ? "For example ABCDE-FGHJK. Each code works once." : undefined}
            error={state.error}
            recovery={recovery}
          />
          <ErrorMsg error={state.error} />
          <button type="submit" className="btn" disabled={pending} aria-busy={pending || undefined}>
            {pending ? "Checking…" : "Verify"}
          </button>
          <button type="button" className={`btn btn--ghost ${styles.btnSm}`} onClick={() => setRecovery((v) => !v)}>
            {recovery ? "Use the app code instead" : "Use a recovery code"}
          </button>
        </form>
      </section>
    </div>
  );
}
