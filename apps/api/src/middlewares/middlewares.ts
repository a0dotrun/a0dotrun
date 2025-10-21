import type { Context } from "hono";
import { jwtVerify, createRemoteJWKSet } from "jose";
import { a0BaseUrl, a0APIBaseUrl } from "@a0dotrun/app/config";
import type { JWTVerifiedUser } from "../lib/auth-types";
import { defaultAvatarUrl } from "@a0dotrun/app";

export async function verifyBetterAuthToken(token: string, c: Context) {
  try {
    const JWKS = createRemoteJWKSet(new URL(`${a0BaseUrl()}/api/auth/jwks`));
    const { payload } = (await jwtVerify(token, JWKS, {
      issuer: a0BaseUrl(), // Should match your JWT issuer, which is the BASE_URL
      audience: a0APIBaseUrl(), // Should match your JWT audience, which is the BASE_URL by default
    })) as { payload: JWTVerifiedUser };
    const user = {
      userId: payload.sub,
      username: payload.username,
      email: payload.email,
      name: payload.name,
      emailVerified: payload.emailVerified,
      image: payload.image || defaultAvatarUrl(payload.username),
      createdAt: payload.createdAt,
      updatedAt: payload.updatedAt,
      githubId: payload.githubId,
      isStaff: payload.isStaff,
      isBlocked: payload.isBlocked,
    };
    c.set("user", user);
    return true;
  } catch (error) {
    console.error(error, "token validation failed");
    return false;
  }
}

// export async function verifyInternalServiceToken(
//   token: string,
//   c: Context
// ): Promise<boolean> {
//   try {
//     const sharedSecret = new TextEncoder().encode(A0_SHARED_SECRET_KEY!);
//     const { payload } = await jwtVerify(token, sharedSecret, {
//       audience: "service",
//       issuer: "internal.auth",
//     });

//     const userId = payload.sub;
//     if (!userId) return false;

//     const user = await User.fromID(userId);
//     if (!user) return false;
//     const sessionUser = User.toSession(user);
//     c.set("user", sessionUser);
//     return true;
//   } catch (error) {
//     console.error(error, "failed to verify internal service token");
//     return false;
//   }
// }
