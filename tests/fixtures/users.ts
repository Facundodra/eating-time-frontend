export const testUsers = {
  admin: {
    email: process.env.E2E_ADMIN_EMAIL ?? "admin@eatingtime.com",
    password: process.env.E2E_ADMIN_PASSWORD ?? "12345678",
  },
  client: {
    email: process.env.E2E_CLIENT_EMAIL ?? "lucas.rodriguez@gmail.com",
    password: process.env.E2E_CLIENT_PASSWORD ?? "12345678",
  },
  restaurant: {
    email: process.env.E2E_RESTAURANT_EMAIL ?? "contacto7@tokyobowl.com",
    password: process.env.E2E_RESTAURANT_PASSWORD ?? "12345678",
  },
} as const;

export type TestUserRole = keyof typeof testUsers;
