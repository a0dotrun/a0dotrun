import z from "zod/v4";

export const sessionUserSchema = z.object({
  userId: z.string(),
  name: z.string(),
  username: z.string(),
  githubId: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  isStaff: z.boolean(),
  isBlocked: z.boolean(),
  image: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type SessionUser = z.infer<typeof sessionUserSchema>;
