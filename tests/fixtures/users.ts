export const TEST_PASSWORD = "12345678";

export const testUsers = {
  admin: {
    email: process.env.E2E_ADMIN_EMAIL ?? "admin@eatingtime.com",
    password: TEST_PASSWORD,
  },
  client: {
    email: process.env.E2E_CLIENT_EMAIL ?? "lucas.rodriguez@gmail.com",
    password: TEST_PASSWORD,
  },
  restaurant: {
    email: process.env.E2E_RESTAURANT_EMAIL ?? "burguerqueen26@gmail.com",
    password: TEST_PASSWORD,
  },
} as const;

export type TestUserRole = keyof typeof testUsers;
