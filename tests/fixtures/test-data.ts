function uniqueSuffix() {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function makeUruguayanDocument(seed: string) {
  const base = seed.slice(-7).padStart(7, "0");
  const weights = [2, 9, 8, 7, 6, 3, 4];
  const sum = base
    .split("")
    .reduce((total, digit, index) => total + Number(digit) * weights[index], 0);
  const verifier = (10 - (sum % 10)) % 10;

  return `${base}${verifier}`;
}

export type ClientRegistrationData = ReturnType<typeof makeClientRegistrationData>;
export type DeliveryPointData = ReturnType<typeof makeDeliveryPointData>;

export function makeClientRegistrationData() {
  const suffix = uniqueSuffix();
  const numericSuffix = suffix.slice(-7).padStart(7, "0");

  return {
    document: makeUruguayanDocument(suffix),
    email: `e2e.client.${suffix}@gmail.com`,
    name: `Cliente E2E ${suffix.slice(-5)}`,
    password: "12345678",
    phone: `09${numericSuffix}`,
  };
}

export function makeDeliveryPointData() {
  const suffix = uniqueSuffix().slice(-5);
  const numericSuffix = suffix.replace(/\D/g, "").padStart(5, "0");

  return {
    apartment: numericSuffix.slice(-3),
    city: "Montevideo",
    indications: `Punto creado por Playwright ${suffix}`,
    number: `1${numericSuffix.slice(-3)}`,
    street: "Av. Italia",
  };
}

export function makeRestaurantRequestData() {
  const suffix = uniqueSuffix();

  return {
    address: `Av Test ${suffix.slice(-4)}`,
    description: "Local de prueba generado para validar el formulario de solicitud.",
    email: `e2e.local.${suffix}@gmail.com`,
    name: `Local E2E ${suffix.slice(-5)}`,
    phone: `09${suffix.slice(-7).padStart(7, "0")}`,
  };
}

export const searchData = {
  impossibleDishName: "plato-e2e-sin-resultados-999",
  impossibleRestaurantName: "local-e2e-sin-resultados-999",
};
