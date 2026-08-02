/**
 * Races a promise against a timeout. Unlike a plain `setTimeout` fired
 * alongside an `await`, this actually stops the caller from waiting once the
 * timeout wins — a bare `setTimeout(...); await promise;` still blocks on
 * the original promise regardless of the timer, so a slow-but-eventually-
 * successful call can flip the UI from "timed out" back to "succeeded"
 * later with no way for the user to tell which state is current.
 *
 * If the timeout fires first, `onTimeout` runs once and the returned
 * promise rejects; the original promise's eventual result (if any) is
 * silently dropped rather than being acted on late.
 */
export function withAuthTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  onTimeout: () => void
): Promise<T> {
  let settled = false;
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      onTimeout();
      reject(new AuthTimeoutError());
    }, timeoutMs);

    promise.then(
      (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

/** Thrown when withAuthTimeout's timer wins the race — distinguishes a
 * "gave up waiting" state from a definitive server-side failure, since the
 * underlying request may still complete successfully after we stop waiting
 * on it. */
export class AuthTimeoutError extends Error {
  constructor() {
    super("Auth call timed out");
    this.name = "AuthTimeoutError";
  }
}
