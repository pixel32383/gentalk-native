const REMOTE_WRITE_TIMEOUT_MS = 8_000;

/** Prevents an offline Firestore write from leaving the UI waiting indefinitely. */
export async function waitForRemoteWrite<T>(operation: Promise<T>): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error('REMOTE_WRITE_TIMEOUT')), REMOTE_WRITE_TIMEOUT_MS);
  });

  try {
    return await Promise.race([operation, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
