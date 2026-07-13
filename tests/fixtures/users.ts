export const TEST_PASSWORD = "12345678";

export const testUsers = {
  admin: {
    email: process.env.E2E_ADMIN_EMAIL ?? "admin@eatingtime.com",
    password: process.env.E2E_ADMIN_PASSWORD ?? TEST_PASSWORD,
  },
  client: {
    email: process.env.E2E_CLIENT_EMAIL ?? "lucas.rodriguez@gmail.com",
    password: process.env.E2E_CLIENT_PASSWORD ?? TEST_PASSWORD,
  },
  restaurant: {
    email: process.env.E2E_RESTAURANT_EMAIL ?? "contacto7@tokyobowl.com",
    password: process.env.E2E_RESTAURANT_PASSWORD ?? TEST_PASSWORD,
  },
} as const;

export type TestUserRole = keyof typeof testUsers;
