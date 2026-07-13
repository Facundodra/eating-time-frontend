import { expect, type Locator, type Page } from "@playwright/test";

import type {
  ClientRegistrationData,
  DeliveryPointData,
} from "../fixtures/test-data";
import { expectResultsOrEmpty, isVisible } from "../helpers/assertions";
import { restaurantCards } from "../helpers/navigation";

const restaurantEmptyText = /No hay locales|No se encontraron/i;
const dishEmptyText =
  /No se encontraron resultados|No se encontraron platos|No hay platos/i;

export class ClientAutomationService {
  constructor(private readonly page: Page) {}

  dishCards(): Locator {
    return this.page.locator('main a[href*="dishId="]');
  }

  async openRegistration() {
    await this.page.goto("/register/client");
    await expect(
      this.page.getByRole("heading", { name: /Crear cuenta cliente/i }),
    ).toBeVisible();
  }

  async assertPasswordMismatch(password: string, confirmation: string) {
    await this.page.getByLabel(/Contrase/i).first().fill(password);
    await this.page.getByLabel(/Confirmar contrase/i).fill(confirmation);
    await expect(this.page.getByText(/no coinciden/i)).toBeVisible();
  }

  async registerClient(client: ClientRegistrationData) {
    await this.openRegistration();
    await this.page.getByLabel(/Nombre y apellido/i).fill(client.name);
    await this.page.getByLabel(/Documento de identidad/i).fill(client.document);
    await this.page.getByLabel(/Telefono|Tel/i).fill(client.phone);
    await this.page.getByLabel(/Correo electr/i).fill(client.email);
    await this.page.getByLabel(/Contrase/i).first().fill(client.password);
    await this.page.getByLabel(/Confirmar contrase/i).fill(client.password);
    await this.page.getByRole("button", { name: /^Crear cuenta$/i }).click();
  }

  async expectRegistrationSuccess() {
    await expect(this.page.getByText(/Cuenta creada exitosamente/i)).toBeVisible({
      timeout: 30_000,
    });
    await expect(this.page.getByRole("link", { name: /Inici/i })).toBeVisible();
  }

  async openRestaurantSearch() {
    await this.page.goto("/client/restaurant");
    await expect(this.page.getByPlaceholder(/Buscar local/i).first()).toBeVisible();
  }

  async expectRestaurantResultsOrEmpty() {
    return expectResultsOrEmpty(
      this.page,
      restaurantCards(this.page),
      restaurantEmptyText,
    );
  }

  async sortRestaurantsByName() {
    await this.page.getByLabel(/Ordenar locales/i).selectOption("nombre-asc");
  }

  async filterOpenRestaurants() {
    await this.page.getByLabel(/Filtrar locales por estado/i).selectOption("open");
  }

  async searchRestaurant(name: string) {
    await this.page.getByPlaceholder(/Buscar local/i).first().fill(name);
  }

  async expectNoRestaurantResults() {
    await expect(this.page.getByText(restaurantEmptyText).first()).toBeVisible({
      timeout: 20_000,
    });
  }

  async openDishSearch() {
    await this.page.goto("/client/dishes");
    await expect(this.page.getByPlaceholder(/Buscar plato/i).first()).toBeVisible();
    await expect(this.page.getByLabel(/Ordenar platos/i).first()).toBeVisible();
  }

  async sortDishesByLowestPrice() {
    await this.page.getByLabel(/Ordenar platos/i).first().selectOption("precio-asc");
  }

  async filterDiscountedDishes() {
    await this.page.getByRole("button", { name: /Con descuento/i }).first().click();
  }

  async expectDishResultsOrEmpty() {
    return expectResultsOrEmpty(this.page, this.dishCards(), dishEmptyText);
  }

  async searchDish(name: string) {
    await this.page.getByPlaceholder(/Buscar plato/i).first().fill(name);
  }

  async expectNoDishResults() {
    await expect(this.page.getByText(dishEmptyText).first()).toBeVisible({
      timeout: 20_000,
    });
  }

  async openFirstRestaurantForOrder() {
    await this.openRestaurantSearch();

    const firstRestaurant = restaurantCards(this.page).first();
    if (!(await isVisible(firstRestaurant, 8_000))) {
      await expect(this.page.getByText(restaurantEmptyText).first()).toBeVisible({
        timeout: 5_000,
      });
      return false;
    }

    await firstRestaurant.click();
    await expect(this.page).toHaveURL(/\/client\/restaurant\/\d+/, {
      timeout: 10_000,
    });
    return true;
  }

  async assertRestaurantListOrReturn() {
    await this.expectRestaurantResultsOrEmpty();
  }

  async addFirstAvailableDishToCart() {
    await expect(
      this.page.getByRole("heading", { name: /Platos disponibles/i }),
    ).toBeVisible({ timeout: 20_000 });

    const addButton = this.page.getByRole("button", { name: /Agregar/i }).first();
    if (!(await isVisible(addButton, 8_000))) {
      await expect(this.page.getByText(dishEmptyText).first()).toBeVisible({
        timeout: 5_000,
      });
      return false;
    }

    await addButton.click();
    return true;
  }

  async openCart() {
    await this.page.getByRole("link", { name: /Ver carrito/i }).click();
    await expect(this.page.getByRole("heading", { name: /Tu carrito/i })).toBeVisible({
      timeout: 20_000,
    });
  }

  async openCheckoutIfCartHasItems() {
    if (await isVisible(this.page.getByText(/Tu carrito est/i).first(), 3_000)) {
      return false;
    }

    await this.page.getByRole("button", { name: /Realizar pedido/i }).click();
    await expect(
      this.page.getByText(/Direccion de entrega|Direcci/i).first(),
    ).toBeVisible({ timeout: 10_000 });

    return true;
  }

  async emptyCartIfPossible() {
    const emptyCartButton = this.page.getByRole("button", { name: /Vaciar carrito/i });
    if (await isVisible(emptyCartButton, 3_000)) {
      await emptyCartButton.click();
      await expect(this.page.getByText(/Tu carrito est/i)).toBeVisible({
        timeout: 10_000,
      });
    }
  }

  async openDeliveryPoints() {
    await this.page.goto("/client/mi-cuenta/puntos-de-entrega");
    await expect(
      this.page.getByRole("heading", { name: /^Puntos de entrega$/i }),
    ).toBeVisible();
  }

  async createDeliveryPoint(deliveryPoint: DeliveryPointData) {
    await this.openDeliveryPoints();
    await this.page.getByLabel(/Localidad/i).fill(deliveryPoint.city);
    await this.page.getByLabel(/^Calle$/i).fill(deliveryPoint.street);
    await this.page.getByLabel(/N.mero/i).fill(deliveryPoint.number);
    await this.page.getByLabel(/Indicaciones/i).fill(deliveryPoint.indications);
    await this.page.getByRole("button", { name: /Guardar punto/i }).click();
  }

  async expectDeliveryPointSaved() {
    await expect(this.page.getByText(/Punto guardado/i)).toBeVisible({
      timeout: 20_000,
    });
  }
}
