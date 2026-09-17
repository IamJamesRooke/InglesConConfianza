import { randomBytes } from "node:crypto";

// `npm run admin:secret` — prints a random secret to paste into `.env` as
// ADMIN_SECRET. See docs/engineering/deploy.md.
console.log(randomBytes(32).toString("base64url"));
