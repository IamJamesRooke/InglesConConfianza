import assert from "node:assert/strict";
import test from "node:test";

import { isAdminRequestAllowed } from "../../src/lib/admin/is-admin-request-allowed";

// Covers the pure decision function shared by src/proxy.ts and
// src/lib/admin/assert-admin.ts (assertAdmin/adminGuardResponse) — see
// src/lib/admin/is-admin-request-allowed.ts for the rules being tested.

test("secret unset, not production -> allowed (local dev, zero setup)", () => {
  assert.equal(
    isAdminRequestAllowed({
      nodeEnv: "development",
      adminSecret: undefined,
      cookieValue: "",
    }),
    true,
  );
});

test("secret unset, production -> NOT allowed", () => {
  assert.equal(
    isAdminRequestAllowed({
      nodeEnv: "production",
      adminSecret: undefined,
      cookieValue: "",
    }),
    false,
  );
});

test("secret set, correct cookie -> allowed", () => {
  assert.equal(
    isAdminRequestAllowed({
      nodeEnv: "production",
      adminSecret: "top-secret",
      cookieValue: "top-secret",
    }),
    true,
  );
});

test("secret set, correct cookie, not production -> allowed", () => {
  assert.equal(
    isAdminRequestAllowed({
      nodeEnv: "development",
      adminSecret: "top-secret",
      cookieValue: "top-secret",
    }),
    true,
  );
});

test("secret set, wrong cookie -> NOT allowed", () => {
  assert.equal(
    isAdminRequestAllowed({
      nodeEnv: "development",
      adminSecret: "top-secret",
      cookieValue: "not-the-secret",
    }),
    false,
  );
});

test("secret set, missing cookie -> NOT allowed", () => {
  assert.equal(
    isAdminRequestAllowed({
      nodeEnv: "production",
      adminSecret: "top-secret",
      cookieValue: "",
    }),
    false,
  );
});
