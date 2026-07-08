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

The tests use the credentials in `tests/fixtures/users.ts`. Emails can be overridden with environment variables such as `E2E_CLIENT_EMAIL`, `E2E_RESTAURANT_EMAIL`, and `E2E_ADMIN_EMAIL`. All test users use `12345678` as the password.
