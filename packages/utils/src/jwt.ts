// import { SignJWT } from "jose";

// const sharedSecret = process.env.A0_SHARED_SECRET_KEY || "VeryS3cure";

// export async function issueM2MServiceToken(
//   sub: string,
//   payload: { [key: string]: any } = {}
// ): Promise<string> {
//   return await new SignJWT({
//     sub: sub,
//     aud: "service",
//     iss: "internal.auth",
//     ...payload,
//   })
//     .setProtectedHeader({ alg: "HS256", kid: "v1" })
//     .setIssuedAt()
//     .setExpirationTime("24h")
//     .sign(new TextEncoder().encode(sharedSecret));
// }
