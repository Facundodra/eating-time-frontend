# Playwright use-case tests

Run all specs:

```bash
npm test
```

Useful variants:

```bash
npm run test:e2e:headed
npm run test:e2e:ui
```

The tests use the credentials in `tests/fixtures/users.ts`. They can be overridden with environment variables such as `E2E_CLIENT_EMAIL`, `E2E_RESTAURANT_EMAIL`, `E2E_ADMIN_EMAIL`, and their matching password variables.
