import { db } from "../db";
import { eq } from "drizzle-orm";
import { users, SelectUser, UpdateUser } from "../db/schema";
import { fn } from "@a0dotrun/utils";
import z from "zod/v4";

export namespace User {
  export const fromUsername = fn(z.string(), async (username) =>
    db.transaction(async (tx) => {
      return tx
        .select({
          userId: users.id,
          username: users.username,
          image: users.image,
          name: users.name,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.username, username))
        .execute()
        .then((rows) => rows[0]);
    })
  );

  export const toSession = fn(SelectUser, (user) => {
    const avatarUrl = user.image || `https://avatar.vercel.sh/${user.username}`;
    return {
      userId: user.id,
      name: user.name,
      username: user.username,
      githubId: user.githubId,
      email: user.email,
      emailVerified: user.emailVerified,
      isStaff: user.isStaff,
      isBlocked: user.isBlocked,
      image: avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  });

  export const fromID = fn(z.string(), async (id) =>
    db.transaction(async (tx) => {
      return tx
        .select()
        .from(users)
        .where(eq(users.id, id))
        .execute()
        .then((rows) => rows[0]);
    })
  );

  export const update = fn(
    UpdateUser.extend({ id: z.string() }),
    async (updates) =>
      db.transaction(async (tx) => {
        const { id, ...values } = updates;
        return tx
          .update(users)
          .set({ ...values })
          .where(eq(users.id, updates.id))
          .execute();
      })
  );
}
