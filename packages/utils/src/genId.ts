import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 63);

export function genId(length = 21) {
  return nanoid(length);
}