// ponytail: wraps console, no transport/levels config — add when a real log backend is needed
export const logger = {
  log: (...args: unknown[]) => {
    if (import.meta.env.DEV) console.log(...args)
  },
  warn: (...args: unknown[]) => {
    if (import.meta.env.DEV) console.warn(...args)
  },
  error: (...args: unknown[]) => {
    if (import.meta.env.DEV) console.error(...args)
  },
}
