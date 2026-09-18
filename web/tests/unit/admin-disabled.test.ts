import assert from "node:assert/strict";
import test from "node:test";

import { isAdminDisabledInProduction } from "../../src/lib/admin/admin-disabled";

test("production with no ADMIN_SECRET disables admin", () => {
  assert.equal(
    isAdminDisabledInProduction({ NODE_ENV: "production", ADMIN_SECRET: undefined }),
    true,
  );
  assert.equal(
    isAdminDisabledInProduction({ NODE_ENV: "production", ADMIN_SECRET: "" }),
    true,
  );
});

test("production with ADMIN_SECRET set keeps admin available (guarded)", () => {
  assert.equal(
    isAdminDisabledInProduction({ NODE_ENV: "production", ADMIN_SECRET: "s3cret" }),
    false,
  );
});

test("non-production is never disabled by this check", () => {
  assert.equal(
    isAdminDisabledInProduction({ NODE_ENV: "development", ADMIN_SECRET: undefined }),
    false,
  );
  assert.equal(
    isAdminDisabledInProduction({ NODE_ENV: "test", ADMIN_SECRET: undefined }),
    false,
  );
  assert.equal(isAdminDisabledInProduction({}), false);
});
