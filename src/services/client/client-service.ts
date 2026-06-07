import axios from "axios";

import { clientApi, publicApi } from "../shared/api-client";
import { requireCurrentSession } from "@/services/shared/auth-service";

import type {
    RestaurantList,
    Restaurant,
    DeliveryPointCredentials,
    DeliveryPoint,
    ClientDish,
    Cart,
    CartItem,
    Order,
    OrderHistoryStatus,
    OrderRequest,
    PaymentResponse,
} from "@/lib/client/types";

export type { RestaurantList, DeliveryPointCredentials, DeliveryPoint, ClientDish, Cart, Order, OrderHistoryStatus, OrderRequest, PaymentResponse };

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
        await clientApi.post(`/api/clientes/${session.idTipoUsuario}/puntos-entrega`, body);
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
        const response = await clientApi.get<DeliveryPoint[]>(
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
        id: String(plato.id),
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
        const response = await clientApi.get<PlatoDtoFromApi[]>(url);
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
        const response = await publicApi.get<PlatoDtoFromApi>(`/api/platos/${id}`);
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
        const response = await clientApi.get<RestaurantPageResponse>(`/api/locales`, { params: filter });
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
        const response = await clientApi.get<RestaurantSingleDtoFromApi>(`/api/locales/${id}`);
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
type CartFromApi = Omit<Cart, "restaurantId"> & { localId: number };

function mapCartFromApi(cart: CartFromApi): Cart {
    const { localId, ...rest } = cart;
    return { ...rest, restaurantId: localId };
}

// Devuelve todos los carritos activos (EN_CARRITO) del cliente, uno por restaurante
export async function getCarts(): Promise<Cart[]> {
    const session = await requireCurrentSession();

    try {
        const response = await clientApi.get<CartFromApi[]>(
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
        const response = await clientApi.get<CartFromApi>(
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
        const response = await clientApi.post<CartFromApi>(
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
        await clientApi.delete(`/api/clientes/${session.idTipoUsuario}/carritos/${restaurantId}`);
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
        const response = await clientApi.patch<PaymentResponse>(
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
    localId?: number;
    desde?: string; // ISO datetime enviado al backend, ej "2026-06-01T00:00:00"
    hasta?: string;
    ordenarPor?: "fecha" | "precio";
    direccion?: "asc" | "desc";
    page?: number;
    size?: number;
};

interface PedidoDtoFromApi {
    id: number;
    localId: number;
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
}

interface OrderHistoryPageResponse {
    content: PedidoDtoFromApi[];
    totalPages: number;
    totalElements: number;
    number: number;
}

function mapOrderFromApi(dto: PedidoDtoFromApi): Order {
    const { localId, items, ...rest } = dto;
    return { ...rest, restaurantId: localId, items: items ?? [] };
}

// Historial de pedidos cerrados del cliente, paginado en el backend.
export async function getOrderHistory(
    filter: OrderHistoryFilter = {}
): Promise<{ orders: Order[]; totalPages: number; totalElements: number }> {
    const session = await requireCurrentSession();

    const params: Record<string, string | number> = {};
    if (filter.localId != null) params.localId = filter.localId;
    if (filter.desde) params.desde = filter.desde;
    if (filter.hasta) params.hasta = filter.hasta;
    if (filter.ordenarPor) params.ordenarPor = filter.ordenarPor;
    if (filter.direccion) params.direccion = filter.direccion;
    params.page = filter.page ?? 0;
    params.size = filter.size ?? 10;

    try {
        const response = await clientApi.get<OrderHistoryPageResponse>(
            `/api/clientes/${session.idTipoUsuario}/pedidos`,
            { params }
        );
        return {
            orders: response.data.content.map(mapOrderFromApi),
            totalPages: response.data.totalPages,
            totalElements: response.data.totalElements,
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
        const response = await clientApi.get<LocalResumenDtoFromApi[]>(
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
