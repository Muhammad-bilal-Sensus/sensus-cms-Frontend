These tests run against a production frontend build with synthetic API responses. They do not contact or change the live backend.

Run `npx playwright install chromium` once, then `npm run test:browser`.
Run `npm test` for validation-contract, routing, and RTK Query tests.

If Chromium is already installed at another location, set `SENSUS_TEST_CHROMIUM_PATH` to the executable path before running the browser suite.
