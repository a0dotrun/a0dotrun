import { z } from "zod";

export function fn<T extends z.ZodType, Result>(
  schema: T,
  cb: (input: z.infer<T>) => Result
) {
  const result = (input: z.infer<T>) => {
    const parsed = schema.parse(input);
    return cb(parsed);
  };
  result.force = (input: z.infer<T>) => cb(input);
  result.schema = schema;
  return result;
}

export function toErrorValue<T, Args extends any[]>(
  fn: (...args: Args) => T,
  ...args: Args
): [Error | null, T | null] {
  try {
    const result = fn(...args);
    return [null, result];
  } catch (err: any) {
    return [err instanceof Error ? err : new Error(String(err)), null];
  }
}

export async function toAsyncErrorValue<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  ...args: Args
): Promise<[Error | null, T | null]> {
  try {
    const result = await fn(...args);
    return [null, result];
  } catch (err: unknown) {
    return [err instanceof Error ? err : new Error(String(err)), null];
  }
}
