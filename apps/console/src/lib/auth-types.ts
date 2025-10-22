/**
 * Types for extending Better Auth's `getSession` return type
 * so that `session.user` includes both:
 *  - Built-in Better Auth user fields (id, name, email, image, etc.)
 *  - Your custom `additionalFields` from auth config
 */

import type { auth, authConfig } from './auth'

/**
 * Extracts the `additionalFields` object from your Better Auth config.
 * This will always stay in sync with whatever you define in `authConfig.user.additionalFields`.
 */
type AdditionalFields = typeof authConfig.user.additionalFields

/**
 * Shape of each field in `additionalFields`.
 * These keys match the Better Auth config options for a field.
 */
type FieldConfig = {
  type: string
  required?: boolean
  defaultValue?: unknown
  input?: boolean
}

/**
 * Maps Better Auth's string `"type"` values to actual TypeScript shared.
 *  - 'string'  → string
 *  - 'boolean' → boolean
 *  - anything else → unknown (fallback)
 */
type FieldType<T extends FieldConfig> = T['type'] extends 'string'
  ? string
  : T['type'] extends 'boolean'
    ? boolean
    : unknown

/**
 * Maps all `additionalFields` into a typed user object.
 * Rules:
 *  - If `input: true` → always required
 *  - Else if `defaultValue` is set → always required
 *  - Else if `required: true` → required
 *  - Otherwise → optional (`| undefined`)
 */
type MapFields<T extends Record<string, FieldConfig>> = {
  [K in keyof T]: T[K]['input'] extends true
    ? FieldType<T[K]> // input: true → required
    : T[K]['defaultValue'] extends undefined
      ? T[K]['required'] extends true
        ? FieldType<T[K]> // required: true → required
        : FieldType<T[K]> | undefined // optional
      : FieldType<T[K]> // defaultValue present → required
}

/**
 * Your custom user type derived from `additionalFields`.
 */
export type AuthUser = MapFields<AdditionalFields>

/**
 * The built-in Better Auth session type (when a session exists).
 * `getSession()` can return `null`, so we wrap it in `NonNullable` here.
 */
type BaseSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>

/**
 * Merge built-in Better Auth `user` type with your custom `AuthUser` fields.
 * This means `session.user` will autocomplete both sets of fields:
 *  - Built-in: id, name, email, image, etc.
 *  - Custom: username, githubId, isStaff, isBlocked
 */
type CustomUser = BaseSession['user'] & AuthUser

/**
 * Final session type that you can use for:
 * ```ts
 * const session = (await auth.api.getSession(...)) as CustomBetterAuthSession | null;
 * ```
 */
export type BetterAuthSession = Omit<BaseSession, 'user'> & {
  user: CustomUser
}
