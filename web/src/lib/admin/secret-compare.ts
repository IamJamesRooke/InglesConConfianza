// Constant-time-ish string comparison for the admin guard. Runs inside
// `proxy.ts` (Edge-safe: no Node-only APIs, plain string/char-code work)
// as well as the `/api/admin-login` route handler. Not cryptographic-grade
// (this guards a local admin tool, belt-and-braces against an accidental
// public deploy — see docs/engineering/deploy.md) but avoids the most naive
// early-exit `===` timing leak on the secret's length/prefix.
export function timingSafeEqualStrings(a: string, b: string): boolean {
  const length = Math.max(a.length, b.length);
  let mismatch = a.length === b.length ? 0 : 1;
  for (let i = 0; i < length; i += 1) {
    const charA = i < a.length ? a.charCodeAt(i) : 0;
    const charB = i < b.length ? b.charCodeAt(i) : 0;
    mismatch |= charA ^ charB;
  }
  return mismatch === 0;
}
