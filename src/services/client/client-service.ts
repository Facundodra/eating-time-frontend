import axios from "axios";

import { clientApi as api } from "@/services/shared/api-client";
import { requireCurrentSession } from "@/services/shared/auth-service";

import type {
    RestaurantList,
    Restaurant,
    DeliveryPointCredentials,
    DeliveryPoint,
    ClientDish,
    Discount,
    Cart,
    CartItem,
    Order,
    OrderHistoryStatus,
    CustomerRating,
    CustomerRatingValue,
    OrderRating,
    OrderRatingValue,
    OrderRequest,
    PaymentResponse,
    LocalRating,
} from "@/lib/client/types";

export type { RestaurantList, DeliveryPointCredentials, DeliveryPoint, ClientDish, Cart, Order, OrderHistoryStatus, CustomerRating, CustomerRatingValue, OrderRating, OrderRatingValue, OrderRequest, PaymentResponse };

export async function addDeliveryPoint(credentials: DeliveryPointCredentials): Promise<void>{
    const session = await requireCurrentSession();

    const body: Record<string, string> = {
        localidad: credentials.loc,
        numero: credentials.number,
        calle: credentials.street,
    };

    if(credentials.apto){
        body.nroApto = credentials.apto;
    }

    if(credentials.indications){
        body.indicaciones = credentials.indications;
    }

    try{
        await api.post(`/api/clientes/${session.idTipoUsuario}/puntos-entrega`, body);
    } catch(error){
        if (axios.isAxiosError(error)) {
            const data = error.response?.data;
            const message = data?.error ?? data?.message ?? `Error al agregar punto (${error.response?.status})`;
            throw new Error(message);
        }
        throw new Error("No se pudo agregar el punto de entrega. Intentalo nuevamente.");
    }

}

export async function getDeliveryPoints(): Promise<DeliveryPoint[]> {
    const session = await requireCurrentSession();

    try {
        const response = await api.get<DeliveryPoint[]>(
            `/api/clientes/${session.idTipoUsuario}/puntos-entrega`
        );
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const data = error.response?.data;
            const message = data?.error ?? data?.message ?? `Error al obtener puntos (${error.response?.status})`;
            throw new Error(message);
        }
        throw new Error("No se pudieron cargar los puntos de entrega.");
    }
}



// Listado de Platos
interface PlatoDtoFromApi {
    id: number;
    nombre: string;
    descripcion: string | null;
    fotoUrl: string | null;
    precio: number;
    disponible: boolean;
    creacion: string;
    localId: number;
    categoriaIds: number[] | null;
}

function mapPlatoToClientDish(plato: PlatoDtoFromApi): ClientDish {
    return {
        id: plato.id,
        name: plato.nombre,
        description: plato.descripcion ?? "",
        price: plato.precio,
        imageUrl: plato.fotoUrl,
        status: plato.disponible ? "available" : "unavailable",
        createdAt: plato.creacion,
        localId: plato.localId,
        categories: plato.categoriaIds ?? [],
    };
}


export type DishFilter = {
    idLocal?: number;
    precioMin?: number;
    precioMax?: number;
    conDescuento?: boolean;
    orden?: "precio";
    sentido?: "asc" | "desc";
    pagina?: number;
    tamano?: number;
};

export async function getDishes(filter?: DishFilter): Promise<ClientDish[]>{
    const params = new URLSearchParams();
    if (filter?.idLocal != null)    params.set("idLocal",      String(filter.idLocal));
    if (filter?.precioMin != null)  params.set("precioMin",    String(filter.precioMin));
    if (filter?.precioMax != null)  params.set("precioMax",    String(filter.precioMax));
    if (filter?.conDescuento)       params.set("conDescuento", "true");
    if (filter?.orden)              params.set("orden",        filter.orden);
    if (filter?.sentido)            params.set("sentido",      filter.sentido);
    if (filter?.pagina != null)     params.set("pagina",       String(filter.pagina));
    if (filter?.tamano != null)     params.set("tamano",       String(filter.tamano));

    const query = params.toString();
    const url = `/api/locales/platos${query ? `?${query}` : ""}`;

    try{
        const response = await api.get<PlatoDtoFromApi[]>(url);
        return response.data.map(mapPlatoToClientDish);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const data = error.response?.data;
            const message = data?.error ?? data?.message ?? `Error al obtener platos (${error.response?.status})`;
            throw new Error(message);
        }
        throw new Error("No se pudieron cargar los platos.");
    }
}

export async function getDish(id: string): Promise<ClientDish> {
    try {
        const response = await api.get<PlatoDtoFromApi>(`/api/platos/${id}`);
        return mapPlatoToClientDish(response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const data = error.response?.data;
            const message = data?.error ?? data?.message ?? `Error al obtener plato (${error.response?.status})`;
            throw new Error(message);
        }
        throw new Error("No se pudo cargar el plato.");
    }
}


// Descuentos de plato
export async function getDishDiscount(dishId: number): Promise<Discount | null> {
    try {
        const response = await api.get<Discount>(`/api/descuentos/plato/${dishId}`);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 404) return null;
            const data = error.response?.data;
            const message = data?.error ?? data?.message ?? `Error al obtener descuento (${error.response?.status})`;
            throw new Error(message);
        }
        throw new Error("No se pudo cargar el descuento.");
    }
}

// Devuelve los IDs de los platos con descuento activo, reutilizando el filtro conDescuento ya soportado por /api/locales/platos
export async function getDiscountedDishIds(idLocal?: number): Promise<Set<number>> {
    const dishes = await getDishes({ idLocal, conDescuento: true, tamano: 100 });
    return new Set(dishes.map((dish) => dish.id));
}


// Listado de locales
export type RestaurantFilter = {
    nombre?: string;
    calificacionMin?: number;
    calificacionMax?: number;
    servicio?: 'ACTIVO' | 'INACTIVO';
    ordenarPor?: 'calificacion' | 'nombre';
    direccion?: 'asc' | 'desc';
    page?: number;
    size?: number;
};

interface RestaurantDtoFromApi {
    id: number;
    nombre: string;
    urlFoto: string | null;
    estadoServicio: boolean;
    calificacion: number | null;
}

interface RestaurantPageResponse {
    content: RestaurantDtoFromApi[];
    totalPages: number;
}

function mapRestaurantDtoApiToRestaurantType(r: RestaurantDtoFromApi): RestaurantList {
    return {
        id: r.id,
        name: r.nombre,
        url_photo: r.urlFoto ?? "",
        stars: r.calificacion ?? 0,
        state: r.estadoServicio,
    };
}



export async function getRestaurants(
    filter: RestaurantFilter = {}
): Promise<{ restaurants: RestaurantList[]; totalPages: number }> {
    try {
        const response = await api.get<RestaurantPageResponse>(`/api/locales`, { params: filter });
        return {
            restaurants: response.data.content.map(mapRestaurantDtoApiToRestaurantType),
            totalPages: response.data.totalPages,
        };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const data = error.response?.data;
            const message = data?.error ?? data?.message ?? `Error al obtener locales (${error.response?.status})`;
            throw new Error(message);
        }
        throw new Error("No se pudieron cargar los locales.");
    }
}



interface RestaurantSingleDtoFromApi {
    id: number;
    nombre: string;
    urlFoto: string | null;
    estadoServicio: boolean;
    calificacion: number | null;
    direccion: string | null;
    descripcion: string | null;
}

function mapRestaurantDtoApiToRestaurant(r: RestaurantSingleDtoFromApi): Restaurant {
    return {
        id: r.id,
        name: r.nombre,
        url_photo: r.urlFoto ?? "",
        stars: r.calificacion ?? 0,
        state: r.estadoServicio,
        address : r.direccion,
        description: r.descripcion
    };
}


export async function getRestaurantName(id: number): Promise<string> {
    const restaurant = await getRestaurant(String(id));
    return restaurant.name;
}

export async function getRestaurant(id: string): Promise<Restaurant> {
    if (typeof window !== 'undefined') {
        await requireCurrentSession();
    }

    try {
        const response = await api.get<RestaurantSingleDtoFromApi>(`/api/locales/${id}`);
        return mapRestaurantDtoApiToRestaurant(response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const data = error.response?.data;
            const message = data?.error ?? data?.message ?? `Error al obtener local (${error.response?.status})`;
            throw new Error(message);
        }
        throw new Error("No se pudo cargar el local.");
    }
}

// ── Carrito ────────────────────────────────────────────────────────────────────

/** Respuesta del backend (campo `localId` en PedidoDto). */
type CartItemFromApi = CartItem & {
    nombrePlato?: string | null;
    platoNombre?: string | null;
    plato?: unknown;
};

type CartFromApi = Omit<Cart, "restaurantId" | "items"> & {
    localId: number;
    items: CartItemFromApi[] | null;
};

function getNestedCartDishName(item: CartItemFromApi) {
    if (!item.plato || typeof item.plato !== "object") return null;

    const dish = item.plato as Record<string, unknown>;
    const name = dish.nombre ?? dish.name;

    return typeof name === "string" && name.trim() ? name : null;
}

function mapCartItemFromApi(item: CartItemFromApi): CartItem {
    return {
        ...item,
        nombre:
            item.nombre ??
            item.nombrePlato ??
            item.platoNombre ??
            getNestedCartDishName(item) ??
            undefined,
    };
}

function mapCartFromApi(cart: CartFromApi): Cart {
    const { localId, ...rest } = cart;
    return {
        ...rest,
        restaurantId: localId,
        items: (cart.items ?? []).map(mapCartItemFromApi),
    };
}

// Devuelve todos los carritos activos (EN_CARRITO) del cliente, uno por restaurante
export async function getCarts(): Promise<Cart[]> {
    const session = await requireCurrentSession();

    try {
        const response = await api.get<CartFromApi[]>(
            `/api/clientes/${session.idTipoUsuario}/carritos`
        );
        return response.data.map(mapCartFromApi);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const data = error.response?.data;
            const message = data?.error ?? data?.message ?? `Error al obtener carritos (${error.response?.status})`;
            throw new Error(message);
        }
        throw new Error("No se pudieron cargar los carritos.");
    }
}

// Devuelve el carrito activo del cliente para un restaurante específico
// Lanza error con status 404 si no hay carrito para ese restaurante
export async function getCart(restaurantId: number): Promise<Cart | null> {
    const session = await requireCurrentSession();

    try {
        const response = await api.get<CartFromApi>(
            `/api/clientes/${session.idTipoUsuario}/carritos/${restaurantId}`
        );
        return mapCartFromApi(response.data);
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            return null;
        }
        if (axios.isAxiosError(error)) {
            const data = error.response?.data;
            const message = data?.error ?? data?.message ?? `Error al obtener carrito (${error.response?.status})`;
            throw new Error(message);
        }
        throw new Error("No se pudo cargar el carrito.");
    }
}

// Agrega o quita unidades de un plato en el carrito de un restaurante.
// cantidad es un delta: positivo suma, negativo resta.
// Si el carrito no existe, el backend lo crea automáticamente.
export async function updateCartItem(
    restaurantId: number,
    platoId: number,
    cantidad: number
): Promise<Cart> {
    const session = await requireCurrentSession();

    try {
        const response = await api.post<CartFromApi>(
            `/api/clientes/${session.idTipoUsuario}/local/${restaurantId}/agregar-plato/${platoId}/cantidad/${cantidad}`
        );
        return mapCartFromApi(response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const data = error.response?.data;
            const message = data?.error ?? data?.message ?? `Error al actualizar carrito (${error.response?.status})`;
            throw new Error(message);
        }
        throw new Error("No se pudo actualizar el carrito.");
    }
}

// Elimina (soft delete) el carrito activo de un restaurante
export async function deleteCart(restaurantId: number): Promise<void> {
    const session = await requireCurrentSession();

    try {
        await api.delete(`/api/clientes/${session.idTipoUsuario}/carritos/${restaurantId}`);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const data = error.response?.data;
            const message = data?.error ?? data?.message ?? `Error al eliminar carrito (${error.response?.status})`;
            throw new Error(message);
        }
        throw new Error("No se pudo eliminar el carrito.");
    }
}

// Realiza el pedido: envía la dirección de entrega, cambia el carrito a ETAPA_DE_PAGO
// y devuelve el link de pago de Mercado Pago
export async function placeOrder(restaurantId: number, body: OrderRequest): Promise<PaymentResponse> {
    const session = await requireCurrentSession();

    try {
        const response = await api.patch<PaymentResponse>(
            `/api/clientes/${session.idTipoUsuario}/carritos/${restaurantId}`,
            body
        );
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const data = error.response?.data;
            const message = data?.error ?? data?.message ?? `Error al realizar pedido (${error.response?.status})`;
            throw new Error(message);
        }
        throw new Error("No se pudo realizar el pedido.");
    }
}

// ── Historial de pedidos ────────────────────────────────────────────────────────

export type OrderHistoryFilter = {
    orderId?: number;
    localId?: number;
    estado?: OrderHistoryStatus;
    desde?: string; // ISO datetime enviado al backend, ej "2026-06-01T00:00:00"
    hasta?: string;
    ordenarPor?: "fecha" | "precio";
    direccion?: "asc" | "desc";
    page?: number;
    size?: number;
    includeRatings?: boolean;
};

interface PedidoDtoFromApi {
    id: number;
    localId: number;
    nombreLocal?: string | null;
    localNombre?: string | null;
    localName?: string | null;
    restaurantName?: string | null;
    local?: unknown;
    clienteId: number;
    cuponId: number | null;
    estado: OrderHistoryStatus;
    total: number;
    descuento: number | null;
    tiempoEstimado: string | null;
    urlFactura: string | null;
    comentario: string | null;
    direccion: string | null;
    indicaciones: string | null;
    motivoRechazo: string | null;
    creacion: string;
    eliminacion: string | null;
    items: CartItem[] | null;
    calificacionLocal?: unknown;
    localCalificacion?: unknown;
    calificacionCliente?: unknown;
    clienteCalificacion?: unknown;
    calificacionDelCliente?: unknown;
    calificacionACliente?: unknown;
    calificacionClienteDto?: unknown;
    calificacionClienteDTO?: unknown;
    tieneCalificacionLocal?: unknown;
    calificadoLocal?: unknown;
    localCalificado?: unknown;
    tieneCalificacionCliente?: unknown;
    calificadoCliente?: unknown;
    tieneCalificacion?: unknown;
    calificado?: unknown;
    calificacion?: unknown;
    rating?: unknown;
}

function getNestedStringField(value: unknown, keys: string[]): string | null {
    if (!value || typeof value !== "object") return null;

    const record = value as Record<string, unknown>;

    for (const key of keys) {
        const fieldValue = record[key];
        if (typeof fieldValue === "string" && fieldValue.trim()) {
            return fieldValue;
        }
    }

    return null;
}

function getOrderRestaurantName(dto: PedidoDtoFromApi): string | null {
    return (
        dto.nombreLocal ??
        dto.localNombre ??
        dto.localName ??
        dto.restaurantName ??
        getNestedStringField(dto.local, ["nombre", "name", "nombreLocal"]) ??
        null
    );
}

interface OrderRatingDtoFromApi {
    id?: number;
    pedidoId?: number;
    calificacion?: OrderRatingValue | string | null;
    comentario?: string | null;
    creacion?: string | null;
}

type OrderHistoryApiResponse =
    | PedidoDtoFromApi[]
    | {
          content?: PedidoDtoFromApi[];
          data?: PedidoDtoFromApi[];
          pedidos?: PedidoDtoFromApi[];
          orders?: PedidoDtoFromApi[];
          totalPages?: number;
          totalElements?: number;
          number?: number;
      };

function mapOrderFromApi(dto: PedidoDtoFromApi): Order {
    const {
        localId,
        items,
        calificacionLocal,
        localCalificacion,
        calificacionCliente,
        clienteCalificacion,
        calificacionDelCliente,
        calificacionACliente,
        calificacionClienteDto,
        calificacionClienteDTO,
        tieneCalificacionLocal,
        calificadoLocal,
        localCalificado,
        tieneCalificacionCliente,
        calificadoCliente,
        tieneCalificacion,
        calificado,
        calificacion,
        rating: ratingValue,
        ...rest
    } = dto;
    const rating = mapOrderRatingFromApi(
        calificacionLocal ?? localCalificacion ?? calificacion ?? ratingValue ?? null,
        dto.id,
    );
    const customerRating = mapOrderCustomerRatingFromApi(
        calificacionCliente ??
            clienteCalificacion ??
            calificacionDelCliente ??
            calificacionACliente ??
            calificacionClienteDto ??
            calificacionClienteDTO ??
            null,
        dto.id,
    );

    return {
        ...rest,
        restaurantId: localId,
        restaurantName: getOrderRestaurantName(dto),
        items: items ?? [],
        calificacionLocal: rating,
        hasLocalRating:
            Boolean(rating) ||
            hasOrderRatingFromApi(
                calificacionLocal,
                localCalificacion,
                tieneCalificacionLocal,
                calificadoLocal,
                localCalificado,
                tieneCalificacion,
                calificado,
                calificacion,
                ratingValue,
            ),
        calificacionCliente: customerRating,
        hasCustomerRating:
            Boolean(customerRating) ||
            hasOrderCustomerRatingFromApi(
                calificacionCliente,
                clienteCalificacion,
                calificacionDelCliente,
                calificacionACliente,
                calificacionClienteDto,
                calificacionClienteDTO,
                tieneCalificacionCliente,
                calificadoCliente,
            ),
    };
}

function mapOrderRatingFromApi(
    rating: unknown,
    orderId: number,
): OrderRating | null {
    if (rating == null) return null;

    if (typeof rating === "string" || typeof rating === "number") {
        const calificacion = normalizeRatingValue(rating);
        if (calificacion == null) return null;

        return {
            pedidoId: orderId,
            calificacion,
            comentario: null,
            creacion: null,
        };
    }

    if (typeof rating !== "object") return null;

    const record = rating as Record<string, unknown>;
    const directRating = normalizeRatingValue(
        record.calificacion ??
            record.valor ??
            record.value ??
            record.puntaje ??
            record.estrellas,
    );

    if (directRating != null) {
        return {
            id: typeof record.id === "number" ? record.id : undefined,
            pedidoId: typeof record.pedidoId === "number" ? record.pedidoId : orderId,
            calificacion: directRating,
            comentario: typeof record.comentario === "string" ? record.comentario : null,
            creacion: typeof record.creacion === "string" ? record.creacion : null,
        };
    }

    const nestedRating =
        record.calificacionLocal ??
        record.localCalificacion ??
        record.calificacion ??
        record.rating ??
        record.data;

    if (nestedRating != null && nestedRating !== rating) {
        const mappedNestedRating = mapOrderRatingFromApi(nestedRating, orderId);
        if (mappedNestedRating) return mappedNestedRating;
    }

    return null;
}

interface CustomerRatingDtoFromApi {
    id?: number;
    pedidoId?: number;
    idPedido?: number;
    orderId?: number;
    calificacion?: CustomerRatingValue | string | null;
    valor?: CustomerRatingValue | string | null;
    value?: CustomerRatingValue | string | null;
    tipo?: CustomerRatingValue | string | null;
    comentario?: string | null;
    creacion?: string | null;
}

function normalizeCustomerRatingValue(value: unknown): CustomerRatingValue | null {
    if (typeof value === "string") {
        const normalized = value.trim().toUpperCase();

        if (
            normalized === "N" ||
            normalized === "0" ||
            normalized === "NO_ME_GUSTA" ||
            normalized === "PULGAR_ABAJO" ||
            normalized === "DISLIKE" ||
            normalized === "DISLIKED"
        ) {
            return "N";
        }

        if (
            normalized === "P" ||
            normalized === "1" ||
            normalized === "ME_GUSTA" ||
            normalized === "PULGAR_ARRIBA" ||
            normalized === "LIKE" ||
            normalized === "LIKED"
        ) {
            return "P";
        }
    }

    if (typeof value === "number") {
        if (value === 0) return "N";
        if (value === 1) return "P";
    }

    return null;
}

function mapOrderCustomerRatingFromApi(
    rating: unknown,
    orderId: number,
): CustomerRating | null {
    if (rating == null) return null;

    if (typeof rating === "string" || typeof rating === "number") {
        const calificacion = normalizeCustomerRatingValue(rating);
        if (calificacion == null) return null;

        return {
            pedidoId: orderId,
            calificacion,
            comentario: null,
            creacion: null,
        };
    }

    if (typeof rating !== "object") return null;

    const record = rating as Record<string, unknown>;
    const directRating = normalizeCustomerRatingValue(
        record.calificacion ?? record.valor ?? record.value ?? record.tipo,
    );

    if (directRating != null) {
        return {
            id: typeof record.id === "number" ? record.id : undefined,
            pedidoId:
                typeof record.pedidoId === "number"
                    ? record.pedidoId
                    : typeof record.idPedido === "number"
                      ? record.idPedido
                      : typeof record.orderId === "number"
                        ? record.orderId
                        : orderId,
            calificacion: directRating,
            comentario: typeof record.comentario === "string" ? record.comentario : null,
            creacion: typeof record.creacion === "string" ? record.creacion : null,
        };
    }

    const nestedRating =
        record.calificacionCliente ??
        record.clienteCalificacion ??
        record.calificacionDelCliente ??
        record.calificacionACliente ??
        record.calificacionClienteDto ??
        record.calificacionClienteDTO ??
        record.calificacion ??
        record.rating ??
        record.data;

    if (nestedRating != null && nestedRating !== rating) {
        const mappedNestedRating = mapOrderCustomerRatingFromApi(nestedRating, orderId);
        if (mappedNestedRating) return mappedNestedRating;
    }

    return null;
}

function normalizeRatingValue(value: unknown): OrderRatingValue | null {
    if (typeof value === "number" && Number.isInteger(value)) {
        if (value >= 1 && value <= 5) return value as OrderRatingValue;
        if (value === 0) return 1;
    }

    if (typeof value === "string") {
        const normalized = value.trim().toUpperCase();
        const numericValue = Number(normalized);

        if (
            Number.isInteger(numericValue) &&
            numericValue >= 1 &&
            numericValue <= 5
        ) {
            return numericValue as OrderRatingValue;
        }

        if (
            normalized === "0" ||
            normalized === "DISLIKE" ||
            normalized === "DISLIKED" ||
            normalized === "NO_ME_GUSTA" ||
            normalized === "PULGAR_ABAJO"
        ) {
            return 1;
        }

        if (
            normalized === "LIKE" ||
            normalized === "LIKED" ||
            normalized === "ME_GUSTA" ||
            normalized === "PULGAR_ARRIBA"
        ) {
            return 5;
        }

        const starMatch = normalized.match(/^([1-5])_?ESTRELLAS?$/);
        if (starMatch) {
            return Number(starMatch[1]) as OrderRatingValue;
        }
    }

    return null;
}

function hasOrderRatingFromApi(...values: unknown[]): boolean {
    return values.some((value) => {
        if (value == null) return false;
        if (typeof value === "boolean") return value;
        if (typeof value === "number") return value > 0;

        if (typeof value === "string") {
            const normalized = value.trim().toLowerCase();
            return normalized !== "" && normalized !== "false" && normalized !== "0";
        }

        if (typeof value !== "object") return false;

        const record = value as Record<string, unknown>;
        return (
            normalizeRatingValue(record.calificacion) != null ||
            hasOrderRatingFromApi(
                record.id,
                record.pedidoId,
                record.calificacionLocal,
                record.localCalificacion,
                record.calificadoLocal,
                record.tieneCalificacionLocal,
                record.localCalificado,
                record.tieneCalificacion,
                record.calificado,
                record.calificacion,
                record.rating,
                record.data,
            )
        );
    });
}

function hasOrderCustomerRatingFromApi(...values: unknown[]): boolean {
    return values.some((value) => {
        if (value == null) return false;
        if (typeof value === "boolean") return value;
        if (typeof value === "number") return value > 0;

        if (typeof value === "string") {
            const normalized = value.trim().toLowerCase();
            return normalized !== "" && normalized !== "false";
        }

        if (typeof value !== "object") return false;

        const record = value as Record<string, unknown>;
        return (
            normalizeCustomerRatingValue(record.calificacion) != null ||
            hasOrderCustomerRatingFromApi(
                record.id,
                record.pedidoId,
                record.idPedido,
                record.orderId,
                record.calificacionCliente,
                record.clienteCalificacion,
                record.calificacionDelCliente,
                record.calificacionACliente,
                record.calificacionClienteDto,
                record.calificacionClienteDTO,
                record.tieneCalificacionCliente,
                record.calificadoCliente,
                record.calificacion,
                record.rating,
                record.data,
            )
        );
    });
}

function getOrderHistoryContent(data: OrderHistoryApiResponse): PedidoDtoFromApi[] {
    if (Array.isArray(data)) return data;
    return data.content ?? data.data ?? data.pedidos ?? data.orders ?? [];
}

async function hydrateOrdersWithLocalRatings(
    clientId: number,
    orders: Order[],
): Promise<Order[]> {
    const ordersToHydrate = orders.filter(
        (order) => order.estado === "FINALIZADO" && !order.hasLocalRating,
    );

    if (ordersToHydrate.length === 0) return orders;

    const uniqueLocalIds = Array.from(
        new Set(ordersToHydrate.map((order) => order.restaurantId)),
    );

    const localRatingsResults = await Promise.all(
        uniqueLocalIds.map(async (localId) => ({
            localId,
            ratings: await fetchLocalRatings(localId).catch((error) => {
                console.warn(
                    `No se pudieron cargar las calificaciones del local ${localId}:`,
                    error,
                );

                return [];
            }),
        })),
    );

    const ratingsByOrderId = new Map<number, OrderRating>();

    for (const localResult of localRatingsResults) {
        for (const rawRating of localResult.ratings) {
            const orderId = getRatingOrderId(rawRating);

            if (!orderId) continue;

            const mappedRating = mapOrderRatingFromApi(rawRating, orderId);

            if (mappedRating) {
                ratingsByOrderId.set(orderId, mappedRating);
            }
        }
    }

    if (ratingsByOrderId.size === 0) return orders;

    return orders.map((order) => {
        const rating = ratingsByOrderId.get(order.id);

        return rating
            ? {
                  ...order,
                  calificacionLocal: rating,
                  hasLocalRating: true,
              }
            : order;
    });
}

// Historial de pedidos cerrados del cliente, paginado en el backend.
export async function getOrderHistory(
    filter: OrderHistoryFilter = {}
): Promise<{ orders: Order[]; totalPages: number; totalElements: number }> {
    const session = await requireCurrentSession();

    const params: Record<string, string | number> = {};
    if (filter.orderId != null) params.identificador = filter.orderId;
    if (filter.localId != null) params.localId = filter.localId;
    if (filter.estado) params.estado = filter.estado;
    if (filter.desde) params.desde = filter.desde;
    if (filter.hasta) params.hasta = filter.hasta;
    if (filter.ordenarPor) params.ordenarPor = filter.ordenarPor;
    if (filter.direccion) params.direccion = filter.direccion;
    params.page = filter.page ?? 0;
    params.size = filter.size ?? 10;

    try {
        const response = await api.get<OrderHistoryApiResponse>(
            `/api/clientes/${session.idTipoUsuario}/pedidos`,
            { params }
        );
        const content = getOrderHistoryContent(response.data);
        const mappedOrders = content.map(mapOrderFromApi);
        const orders = filter.includeRatings === false
            ? mappedOrders
            : await hydrateOrdersWithLocalRatings(session.idTipoUsuario, mappedOrders);
        const totalPages = Array.isArray(response.data)
            ? 1
            : response.data.totalPages ?? 1;
        const totalElements = Array.isArray(response.data)
            ? response.data.length
            : response.data.totalElements ?? content.length;

        return {
            orders,
            totalPages,
            totalElements,
        };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const data = error.response?.data as { error?: string; message?: string } | string | undefined;

            if (status === 404) {
                throw new Error(
                    "El historial de pedidos no está disponible en el servidor. El backend desplegado aún no incluye este endpoint; pedile al equipo que actualice el backend o probá apuntando NEXT_PUBLIC_API_BASE_URL a un backend local actualizado.",
                );
            }

            const message =
                typeof data === "string"
                    ? data
                    : data?.error ?? data?.message ?? `Error al obtener pedidos (${status})`;
            throw new Error(message);
        }
        throw new Error("No se pudieron cargar los pedidos.");
    }
}

export async function getPendingOrderRatingsCount(): Promise<number> {
    let page = 0;
    let totalPages = 1;
    let pendingRatings = 0;

    while (page < totalPages) {
        const { orders, totalPages: pages } = await getOrderHistory({
            page,
            size: 100,
            ordenarPor: "fecha",
            direccion: "desc",
        });

        totalPages = pages;
        pendingRatings += orders.filter(
            (order) => order.estado === "FINALIZADO" && !order.hasLocalRating,
        ).length;
        page += 1;
    }

    return pendingRatings;
}

export type SubmitOrderRatingRequest = {
    calificacion: OrderRatingValue;
    comentario?: string;
};

function parseRatingValueToNumber(value: OrderRatingValue | string): number | null {
    return normalizeRatingValue(value);
}

export async function getOrderLocalRating(orderId: number): Promise<OrderRating | null> {
    await requireCurrentSession();

    try {
        const response = await api.get<OrderRatingDtoFromApi | null>(
            `/api/pedidos/${encodeURIComponent(orderId.toString())}/calificacion-local`,
            { timeout: 10000 },
        );

        return mapOrderRatingFromApi(response.data, orderId);
    } catch (error) {
        if (
            axios.isAxiosError(error) &&
            (error.response?.status === 404 || error.response?.status === 405)
        ) {
            return null;
        }

        if (axios.isAxiosError(error)) {
            const data = error.response?.data as { error?: string; message?: string } | string | undefined;
            const message =
                typeof data === "string"
                    ? data
                    : data?.error ??
                      data?.message ??
                      `Error al obtener calificacion del pedido (${error.response?.status})`;
            throw new Error(message);
        }

        throw new Error("No se pudo cargar la calificacion del pedido.");
    }
}

export async function getOrderCustomerRating(orderId: number): Promise<CustomerRating | null> {
    await requireCurrentSession();

    try {
        const response = await api.get<CustomerRatingDtoFromApi | null>(
            `/api/pedidos/${encodeURIComponent(orderId.toString())}/calificacion-cliente`,
            { timeout: 10000 },
        );

        return mapOrderCustomerRatingFromApi(response.data, orderId);
    } catch (error) {
        if (
            axios.isAxiosError(error) &&
            (error.response?.status === 403 ||
                error.response?.status === 404 ||
                error.response?.status === 405)
        ) {
            return null;
        }

        if (axios.isAxiosError(error)) {
            const data = error.response?.data as { error?: string; message?: string } | string | undefined;
            const message =
                typeof data === "string"
                    ? data
                    : data?.error ??
                      data?.message ??
                      `Error al obtener calificacion del cliente (${error.response?.status})`;
            throw new Error(message);
        }

        throw new Error("No se pudo cargar la calificacion del cliente.");
    }
}

export async function submitOrderLocalRating(
    orderId: number,
    request: SubmitOrderRatingRequest,
): Promise<OrderRating> {
    await requireCurrentSession();
    const ratingNumber = parseRatingValueToNumber(request.calificacion);

    if (ratingNumber == null) {
        throw new Error("La calificación debe ser like o dislike.");
    }

    const body = {
        pedidoId: orderId,
        calificacion: ratingNumber,
        comentario: request.comentario?.trim() || null,
    };

    try {
        const response = await api.post<OrderRatingDtoFromApi>(
            `/api/pedidos/${orderId}/calificacion-local`,
            body,
            { headers: { "Content-Type": "application/json" } },
        );

        return mapOrderRatingFromApi(response.data, orderId) ?? {
            pedidoId: orderId,
            calificacion: request.calificacion,
            comentario: body.comentario,
        };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const data = error.response?.data as { error?: string; message?: string } | string | undefined;
            const message =
                typeof data === "string"
                    ? data
                    : data?.error ?? data?.message ?? `Error al calificar pedido (${error.response?.status})`;
            throw new Error(message);
        }

        throw new Error("No se pudo registrar la calificacion del pedido.");
    }
}
export type OrderHistoryRestaurant = {
    id: number;
    name: string;
};

interface LocalResumenDtoFromApi {
    id: number;
    nombre: string;
}

// Locales distintos con al menos un pedido en el historial del cliente (para el filtro).
// El backend resuelve los locales distintos con un único query (endpoint dedicado).
export async function getOrderHistoryRestaurants(): Promise<OrderHistoryRestaurant[]> {
    const session = await requireCurrentSession();

    try {
        const response = await api.get<LocalResumenDtoFromApi[]>(
            `/api/clientes/${session.idTipoUsuario}/pedidos/locales`
        );
        return response.data
            .map((local) => ({ id: local.id, name: local.nombre }))
            .sort((a, b) => a.name.localeCompare(b.name, "es"));
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const data = error.response?.data;
            const message = data?.error ?? data?.message ?? `Error al obtener locales (${error.response?.status})`;
            throw new Error(message);
        }
        throw new Error("No se pudieron cargar los locales del historial.");
    }
}

export class AccountDeletionError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly hasPendingOrders = false,
  ) {
    super(message);
    this.name = "AccountDeletionError";
  }
}

function getApiErrorMessage(data: unknown): string | undefined {
  if (!data || typeof data !== "object") {
    return undefined;
  }

  const payload = data as Record<string, unknown>;

  if (typeof payload.message === "string") {
    return payload.message;
  }

  if (typeof payload.error === "string") {
    return payload.error;
  }

  if (typeof payload.detail === "string") {
    return payload.detail;
  }

  return undefined;
}

export async function deleteClientAccount(): Promise<void> {
  const session = await requireCurrentSession();

  try {
    await api.delete(`/api/clientes/${session.idTipoUsuario}/cuenta`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = getApiErrorMessage(error.response?.data);

      if (status === 403) {
        throw new AccountDeletionError(
          message ?? "No tenés permiso para eliminar esta cuenta.",
          403,
        );
      }

      if (status === 404) {
        throw new AccountDeletionError(
          message ?? "Cuenta no encontrada.",
          404,
        );
      }

      if (status === 409) {
        throw new AccountDeletionError(
          message ?? "No podés eliminar la cuenta en este momento.",
          409,
          true,
        );
      }

      throw new AccountDeletionError(
        message ?? `Error al eliminar la cuenta (${status})`,
        status,
      );
    }

    throw new AccountDeletionError(
      "No se pudo eliminar la cuenta. Intentalo nuevamente.",
    );
  }
}




// ── Calificaciones ─────────────────────────────────────────────────────────────
export async function getLocalRatings(restaurantId: number): Promise<LocalRating[]> {
    try {
        const response = await api.get<LocalRating[]>(`/api/locales/${restaurantId}/comentarios`);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const data = error.response?.data;
            const message = data?.error ?? data?.message ?? `Error al obtener comentarios (${error.response?.status})`;
            throw new Error(message);
        }
        throw new Error("No se pudo cargar los comentarios.");
    }
}


type LocalRatingsApiResponse =
    | unknown[]
    | {
          content?: unknown[];
      };

function getRatingOrderId(rating: unknown): number | null {
    if (!rating || typeof rating !== "object") return null;

    const record = rating as Record<string, unknown>;

    if (typeof record.pedidoId === "number") return record.pedidoId;
    if (typeof record.idPedido === "number") return record.idPedido;
    if (typeof record.orderId === "number") return record.orderId;

    const pedido = record.pedido;
    if (pedido && typeof pedido === "object") {
        const pedidoRecord = pedido as Record<string, unknown>;
        if (typeof pedidoRecord.id === "number") return pedidoRecord.id;
    }

    return null;
}

function getRatingsArrayFromApi(response: LocalRatingsApiResponse): unknown[] {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.content)) return response.content;
    return [];
}

async function fetchLocalRatings(localId: number): Promise<unknown[]> {
    try {
        const response = await api.get<LocalRatingsApiResponse>(
            `/api/locales/${localId}/calificaciones`,
        );

        return getRatingsArrayFromApi(response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const data = error.response?.data as
                | { error?: string; message?: string }
                | string
                | undefined;

            const message =
                typeof data === "string"
                    ? data
                    : data?.error ??
                      data?.message ??
                      `Error al obtener calificaciones del local (${error.response?.status})`;

            throw new Error(message);
        }

        throw new Error("No se pudieron cargar las calificaciones del local.");
    }
}
