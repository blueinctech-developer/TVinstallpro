"use client";

import { startTransition, useActionState, type FormEvent } from "react";

/**
 * useActionState for editing forms, without React's automatic form reset.
 * With <form action={…}>, React 19 resets uncontrolled fields after every submit, so a
 * validation error would wipe what the person typed. This submits through onSubmit instead.
 */
export function useKeepForm<S>(fn: (state: Awaited<S>, form: FormData) => S | Promise<S>, initial: Awaited<S>) {
  const [state, action, pending] = useActionState<S, FormData>(fn, initial);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
    startTransition(() => action(form));
  };
  return [state, onSubmit, pending] as const;
}
