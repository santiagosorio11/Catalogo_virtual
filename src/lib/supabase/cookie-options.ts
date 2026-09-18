const isProduction = process.env.NODE_ENV === "production";

/**
 * Authentication is rendered inside a cross-site CRM iframe in production.
 * SameSite=None makes that session eligible in the iframe, while Partitioned
 * keeps the cookie isolated to the CRM top-level site on browsers with CHIPS.
 */
export const authCookieOptions = {
  path: "/",
  sameSite: isProduction ? ("none" as const) : ("lax" as const),
  secure: isProduction,
  partitioned: isProduction,
  httpOnly: false,
  maxAge: 365 * 24 * 60 * 60,
};
