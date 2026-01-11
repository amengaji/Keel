import jwt, { SignOptions, JwtPayload } from "jsonwebtoken";

const accessSecret = process.env.ACCESS_TOKEN_SECRET as string;
const refreshSecret = process.env.REFRESH_TOKEN_SECRET as string;

// Helper to bypass TS type issues for expiresIn
function normalizeOptions(expiresIn: string): SignOptions {
  return { expiresIn: expiresIn as any }; // CAST to any to fix TS bug
}

export function generateAccessToken(payload: object) {
  const options = normalizeOptions(process.env.ACCESS_TOKEN_EXPIRES_IN || "150m");
  return jwt.sign(payload as JwtPayload, accessSecret, options);
}

export function generateRefreshToken(payload: object) {
  const options = normalizeOptions(process.env.REFRESH_TOKEN_EXPIRES_IN || "7d");
  return jwt.sign(payload as JwtPayload, refreshSecret, options);
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, accessSecret) as JwtPayload;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, refreshSecret) as JwtPayload;
}
