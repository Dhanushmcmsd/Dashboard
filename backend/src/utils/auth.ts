import jwt from "jsonwebtoken";

const accessSecret = process.env.JWT_ACCESS_SECRET || "access-secret";
const refreshSecret = process.env.JWT_REFRESH_SECRET || "refresh-secret";

export function signAccessToken(payload: Record<string, unknown>) {
  return jwt.sign(payload, accessSecret, { expiresIn: "15m" });
}

export function signRefreshToken(payload: Record<string, unknown>) {
  return jwt.sign(payload, refreshSecret, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, accessSecret);
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, refreshSecret);
}
