import axios from "axios";

import { clientApi as api } from "@/services/shared/api-client";
import { requireCurrentSession } from "@/services/shared/auth-service";

import type {
    RestaurantList,
    Restaurant,
    DeliveryPointCredentials,
    DeliveryPoint,
    ClientDish,
    ClientDishCategory,
    ClientDishCategorySummary,
    Discount,
    Cart,
    CartItem,
    ClientVoucher,
    Order,
    OrderHistoryStatus,
    OrderRating,
    OrderRatingValue,
    OrderRequest,
    PaymentResponse,
    LocalRating,
} from "@/lib/client/types";

export type { RestaurantList, DeliveryPointCredentials, DeliveryPoint, ClientDish, ClientDishCategory, ClientDishCategorySummary, Cart, ClientVoucher, Order, OrderHistoryStatus, OrderRating, OrderRatingValue, OrderRequest, PaymentResponse };

const CATEGORY_RELATION_PAGE_SIZE = 100;
const RESTAURANT_FETCH_PAGE_SIZE = 100;

type ApiCollectionResponse<T> =
    | T[]
    | {
        content?: T[];
        data?: T[];
        items?: T[];
        results?: T[];
        totalPages?: number;
        totalPaginas?: number;
        totalElements?: number;
        totalElementos?: number;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getCollectionFromResponse<T>(data: ApiCollectionResponse<T> | unknown): T[] {
    if (Array.isArray(data)) return data as T[];
    if (!isRecord(data)) return [];

    const collectionKeys = ["content", "data", "items", "results"];
    for (const key of collectionKeys) {
        const value = data[key];
        if (Array.isArray(value)) return value as T[];
    }

    return [];
}

function getNumericValue(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
}

function getStringValue(value: unknown): string | null {
    return typeof value === "string" && value.trim() ? value : null;
}

function getFirstStringValue(...values: unknown[]): string | null {
    for (const value of values) {
        const stringValue = getStringValue(value);
        if (stringValue) return stringValue;
    }

    return null;
}

function getBooleanValue(value: unknown): boolean | null {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value !== "string") return null;

    const normalized = value.trim().toLowerCase();
    if (["true", "activo", "activa", "abierto", "abierta", "available", "disponible"].includes(normalized)) {
        return true;
    }
    if (["false", "inactivo", "inactiva", "cerrado", "cerrada", "unavailable", "no disponible"].includes(normalized)) {
        return false;
    }

    return null;
}

function getNestedId(value: unknown): number | null {
    if (!isRecord(value)) return null;
    return getNumericValue(value.id ?? value.localId ?? value.idLocal);
}

function getTotalPagesFromResponse(
    data: unknown,
    itemCount: number,
    requestedSize?: number,
) {
    if (isRecord(data)) {
        const totalPages = getNumericValue(data.totalPages ?? data.totalPaginas);
        if (totalPages != null) return totalPages;

        const totalElements = getNumericValue(data.totalElements ?? data.totalElementos);
        if (totalElements != null && requestedSize && requestedSize > 0) {
            return Math.ceil(totalElements / requestedSize);
        }
    }

    return itemCount > 0 ? 1 : 0;
}

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
    id?: number | string;
    platoId?: number | string;
    nombre?: string | null;
    name?: string | null;
    descripcion?: string | null;
    description?: string | null;
    fotoUrl?: string | null;
    urlFoto?: string | null;
    imagenUrl?: string | null;
    imageUrl?: string | null;
    precio?: number | string;
    price?: number | string;
    cantidadVentas?: number | string | null;
    cantidadVendida?: number | string | null;
    totalVentas?: number | string | null;
    ventas?: number | string | null;
    sales?: number | string | null;
    salesCount?: number | string | null;
    orderCount?: number | string | null;
    cantidadPedidos?: number | string | null;
    disponible?: boolean | string | number | null;
    estado?: boolean | string | number | null;
    status?: boolean | string | number | null;
    creacion?: string | null;
    createdAt?: string | null;
    localId?: number | string | null;
    idLocal?: number | string | null;
    local?: unknown;
    categoriaIds?: Array<number | string> | null;
    categorias?: Array<number | string | { id?: number | string }> | null;
    categories?: Array<number | string | { id?: number | string }> | null;
}

interface CategoriaDtoFromApi {
    id?: number | string;
    categoriaId?: number | string;
    nombre?: string | null;
    name?: string | null;
    fotoUrl?: string | null;
    urlFoto?: string | null;
    imagenUrl?: string | null;
    imageUrl?: string | null;
}

function getCategoryIdsFromDish(plato: PlatoDtoFromApi): number[] {
    const rawCategories =
        plato.categoriaIds ??
        plato.categorias ??
        plato.categories ??
        [];

    return rawCategories
        .map((category) => {
            if (typeof category === "number" || typeof category === "string") {
                return getNumericValue(category);
            }

            return getNestedId(category);
        })
        .filter((categoryId): categoryId is number => categoryId != null);
}

function mapPlatoToClientDish(plato: PlatoDtoFromApi): ClientDish {
    const id = getNumericValue(plato.id ?? plato.platoId) ?? 0;
    const localId =
        getNumericValue(plato.localId ?? plato.idLocal) ??
        getNestedId(plato.local) ??
        0;
    const available =
        getBooleanValue(plato.disponible ?? plato.estado ?? plato.status) ?? true;

    return {
        id,
        name: getFirstStringValue(plato.nombre, plato.name) ?? `Plato #${id}`,
        description: getFirstStringValue(plato.descripcion, plato.description) ?? "",
        price: getNumericValue(plato.precio ?? plato.price) ?? 0,
        salesCount: getNumericValue(
            plato.cantidadVentas ??
            plato.cantidadVendida ??
            plato.totalVentas ??
            plato.ventas ??
            plato.sales ??
            plato.salesCount ??
            plato.orderCount ??
            plato.cantidadPedidos,
        ) ?? 0,
        imageUrl: getFirstStringValue(
            plato.fotoUrl,
            plato.urlFoto,
            plato.imagenUrl,
            plato.imageUrl,
        ),
        status: available ? "available" : "unavailable",
        createdAt: getFirstStringValue(plato.creacion, plato.createdAt) ?? "",
        localId,
        categories: getCategoryIdsFromDish(plato),
    };
}

function mapCategoriaToClientDishCategory(categoria: CategoriaDtoFromApi): ClientDishCategory {
    const id = getNumericValue(categoria.id ?? categoria.categoriaId) ?? 0;

    return {
        id,
        name: getFirstStringValue(categoria.nombre, categoria.name) ?? `Categoria #${id}`,
        imageUrl: getFirstStringValue(
            categoria.fotoUrl,
            categoria.urlFoto,
            categoria.imagenUrl,
            categoria.imageUrl,
        ),
    };
}


export type DishFilter = {
    idLocal?: number;
    categoriaId?: number;
    precioMin?: number;
    precioMax?: number;
    conDescuento?: boolean;
    orden?: "precio" | "ventas";
    sentido?: "asc" | "desc";
    pagina?: number;
    tamano?: number;
};

function buildDishQuery(filter?: DishFilter) {
    const params = new URLSearchParams();
    if (filter?.idLocal != null) params.set("idLocal", String(filter.idLocal));
    if (filter?.categoriaId != null) {
        params.set("categoriaId", String(filter.categoriaId));
        params.set("idCategoria", String(filter.categoriaId));
    }
    if (filter?.precioMin != null) params.set("precioMin", String(filter.precioMin));
    if (filter?.precioMax != null) params.set("precioMax", String(filter.precioMax));
    if (filter?.conDescuento) params.set("conDescuento", "true");
    if (filter?.orden) params.set("orden", filter.orden);
    if (filter?.sentido) params.set("sentido", filter.sentido);
    if (filter?.pagina != null) params.set("pagina", String(Math.max(filter.pagina - 1, 0)));
    if (filter?.tamano != null) params.set("tamano", String(filter.tamano));

    return params;
}

function buildCompatibleDishQuery(filter?: DishFilter) {
    return buildDishQuery({
        idLocal: filter?.idLocal,
        precioMin: filter?.precioMin,
        precioMax: filter?.precioMax,
        conDescuento: filter?.conDescuento,
        orden: filter?.orden === "precio" ? "precio" : undefined,
        sentido: filter?.orden === "precio" ? filter.sentido : undefined,
        pagina: filter?.pagina,
        tamano: filter?.tamano,
    });
}

function applyDishClientFilters(
    dishes: ClientDish[],
    filter?: DishFilter,
): ClientDish[] {
    const filteredDishes = dishes.filter((dish) => {
        if (filter?.idLocal != null && dish.localId !== filter.idLocal) return false;
        if (
            filter?.categoriaId != null &&
            !dish.categories.includes(filter.categoriaId)
        ) {
            return false;
        }
        if (filter?.precioMin != null && dish.price < filter.precioMin) return false;
        if (filter?.precioMax != null && dish.price > filter.precioMax) return false;

        return true;
    });

    if (!filter?.orden) return filteredDishes;

    const direction = filter.sentido === "desc" ? -1 : 1;

    return [...filteredDishes].sort((left, right) => {
        const leftValue =
            filter.orden === "ventas" ? left.salesCount : left.price;
        const rightValue =
            filter.orden === "ventas" ? right.salesCount : right.price;
        const comparison = leftValue - rightValue;

        if (comparison !== 0) return comparison * direction;
        return left.name.localeCompare(right.name, "es");
    });
}

async function fetchDishesFromEndpoint(
    endpoint: string,
    params: URLSearchParams,
): Promise<ClientDish[]> {
    const query = params.toString();
    const response = await api.get<ApiCollectionResponse<PlatoDtoFromApi>>(
        `${endpoint}${query ? `?${query}` : ""}`,
    );

    return getCollectionFromResponse<PlatoDtoFromApi>(response.data).map(mapPlatoToClientDish);
}

function shouldTryRestaurantDishFallback(error: unknown, filter?: DishFilter) {
    if (filter?.idLocal == null || !axios.isAxiosError(error)) return false;
    const status = error.response?.status;

    return status === 400 || status === 401 || status === 403 || status === 404 || status === 405;
}

function shouldTryCompatibleDishQuery(error: unknown) {
    if (!axios.isAxiosError(error)) return false;
    const status = error.response?.status;

    return status === 400 || status === 404 || status === 405;
}

export async function getDishes(filter?: DishFilter): Promise<ClientDish[]>{
    const params = buildDishQuery(filter);
    const compatibleParams = buildCompatibleDishQuery(filter);

    try{
        const dishes = await fetchDishesFromEndpoint("/api/locales/platos", params);
        return applyDishClientFilters(dishes, filter);
    } catch (error) {
        if (
            shouldTryCompatibleDishQuery(error) &&
            compatibleParams.toString() !== params.toString()
        ) {
            try {
                const dishes = await fetchDishesFromEndpoint(
                    "/api/locales/platos",
                    compatibleParams,
                );
                return applyDishClientFilters(dishes, filter);
            } catch {
                // Continue with the legacy endpoint fallback below.
            }
        }

        if (shouldTryRestaurantDishFallback(error, filter)) {
            try {
                const dishes = await fetchDishesFromEndpoint(
                    "/api/platos",
                    compatibleParams,
                );
                return applyDishClientFilters(dishes, filter);
            } catch {
                // Keep the original catalog error because it is the preferred client endpoint.
            }
        }

        if (axios.isAxiosError(error)) {
            const data = error.response?.data;
            const message = data?.error ?? data?.message ?? `Error al obtener platos (${error.response?.status})`;
            throw new Error(message);
        }
        throw new Error("No se pudieron cargar los platos.");
    }
}

export async function getAllDishes(
    filter: DishFilter = {},
    pageSize = CATEGORY_RELATION_PAGE_SIZE,
): Promise<ClientDish[]> {
    const safePageSize = Math.max(pageSize, 1);
    const baseFilter: DishFilter = { ...filter };
    delete baseFilter.pagina;
    delete baseFilter.tamano;

    const dishes: ClientDish[] = [];
    const seenDishIds = new Set<number>();
    let page = 1;

    while (true) {
        const pageDishes = await getDishes({
            ...baseFilter,
            pagina: page,
            tamano: safePageSize,
        });
        const newDishes = pageDishes.filter((dish) => !seenDishIds.has(dish.id));

        newDishes.forEach((dish) => {
            seenDishIds.add(dish.id);
            dishes.push(dish);
        });

        if (pageDishes.length < safePageSize || newDishes.length === 0) {
            break;
        }

        page += 1;
    }

    return applyDishClientFilters(dishes, baseFilter);
}

export async function getClientDishCategories(): Promise<ClientDishCategory[]> {
    try {
        const response = await api.get<ApiCollectionResponse<CategoriaDtoFromApi>>("/api/categorias");
        return getCollectionFromResponse<CategoriaDtoFromApi>(response.data).map(mapCategoriaToClientDishCategory);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const data = error.response?.data;
            const message = data?.error ?? data?.message ?? `Error al obtener categorias (${error.response?.status})`;
            throw new Error(message);
        }
        throw new Error("No se pudieron cargar las categorias.");
    }
}

async function getDishesForCategoryRelations(): Promise<ClientDish[]> {
    return getAllDishes({}, CATEGORY_RELATION_PAGE_SIZE);
}

export async function getClientDishCategorySummaries(): Promise<ClientDishCategorySummary[]> {
    const categories = await getClientDishCategories();
    const dishes = await getDishesForCategoryRelations().catch(() => []);
    const dishCountByCategoryId = new Map<number, number>();
    const dishImageByCategoryId = new Map<number, string>();

    dishes.forEach((dish) => {
        new Set(dish.categories).forEach((categoryId) => {
            dishCountByCategoryId.set(
                categoryId,
                (dishCountByCategoryId.get(categoryId) ?? 0) + 1,
            );
            if (dish.imageUrl && !dishImageByCategoryId.has(categoryId)) {
                dishImageByCategoryId.set(categoryId, dish.imageUrl);
            }
        });
    });

    return categories
        .map((category) => ({
            ...category,
            imageUrl: category.imageUrl ?? dishImageByCategoryId.get(category.id) ?? null,
            dishCount: dishCountByCategoryId.get(category.id) ?? 0,
        }))
        .sort((left, right) => {
            const countComparison = right.dishCount - left.dishCount;
            return countComparison !== 0
                ? countComparison
                : left.name.localeCompare(right.name, "es");
        });
}

export async function getTopClientDishCategorySummaries(
    limit: number,
): Promise<ClientDishCategorySummary[]> {
    const categories = await getClientDishCategorySummaries();

    return categories.slice(0, limit);
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
    try {
        const dishes = await getAllDishes({ idLocal, conDescuento: true });
        return new Set(dishes.map((dish) => dish.id));
    } catch {
        return new Set<number>();
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
    id?: number | string;
    localId?: number | string;
    idLocal?: number | string;
    nombre?: string | null;
    name?: string | null;
    razonSocial?: string | null;
    urlFoto?: string | null;
    fotoUrl?: string | null;
    imagenUrl?: string | null;
    imageUrl?: string | null;
    urlFotoPerfil?: string | null;
    fotoPerfilUrl?: string | null;
    profilePhotoUrl?: string | null;
    urlPortada?: string | null;
    urlFotoPortada?: string | null;
    urlPortadaMobile?: string | null;
    urlPortadaDesktop?: string | null;
    fotoPortadaUrl?: string | null;
    coverPhotoUrl?: string | null;
    estadoServicio?: boolean | string | number | null;
    servicio?: boolean | string | number | null;
    estado?: boolean | string | number | null;
    calificacion?: number | string | null;
    rating?: number | string | null;
    stars?: number | string | null;
}

function mapRestaurantDtoApiToRestaurantType(r: RestaurantDtoFromApi): RestaurantList {
    const id = getNumericValue(r.id ?? r.localId ?? r.idLocal) ?? 0;
    const legacyPhotoUrl = getFirstStringValue(
        r.urlFoto,
        r.fotoUrl,
        r.imagenUrl,
        r.imageUrl,
    );
    const explicitCoverPhotoUrl = getFirstStringValue(
        r.urlPortadaDesktop,
        r.urlPortada,
        r.urlFotoPortada,
        r.fotoPortadaUrl,
        r.coverPhotoUrl,
        r.urlPortadaMobile,
    );

    return {
        id,
        name: getFirstStringValue(r.nombre, r.name, r.razonSocial) ?? `Local #${id}`,
        coverPhotoUrl: explicitCoverPhotoUrl ?? "",
        coverPhotoMobileUrl: getFirstStringValue(r.urlPortadaMobile) ?? explicitCoverPhotoUrl ?? "",
        coverPhotoDesktopUrl: getFirstStringValue(r.urlPortadaDesktop) ?? explicitCoverPhotoUrl ?? "",
        profilePhotoUrl: getFirstStringValue(
            r.urlFotoPerfil,
            r.fotoPerfilUrl,
            r.profilePhotoUrl,
            legacyPhotoUrl,
        ) ?? "",
        stars: getNumericValue(r.calificacion ?? r.rating ?? r.stars) ?? 0,
        state: getBooleanValue(r.estadoServicio ?? r.servicio ?? r.estado) ?? false,
    };
}

function normalizeComparableText(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function applyRestaurantClientFilters(
    restaurants: RestaurantList[],
    filter: RestaurantFilter,
): RestaurantList[] {
    const normalizedName = filter.nombre
        ? normalizeComparableText(filter.nombre)
        : "";
    const filteredRestaurants = restaurants.filter((restaurant) => {
        if (
            normalizedName &&
            !normalizeComparableText(restaurant.name).includes(normalizedName)
        ) {
            return false;
        }
        if (filter.servicio === "ACTIVO" && !restaurant.state) return false;
        if (filter.servicio === "INACTIVO" && restaurant.state) return false;
        if (
            filter.calificacionMin != null &&
            restaurant.stars < filter.calificacionMin
        ) {
            return false;
        }
        if (
            filter.calificacionMax != null &&
            restaurant.stars > filter.calificacionMax
        ) {
            return false;
        }

        return true;
    });

    if (!filter.ordenarPor) return filteredRestaurants;

    const direction = filter.direccion === "desc" ? -1 : 1;

    return [...filteredRestaurants].sort((left, right) => {
        const comparison =
            filter.ordenarPor === "calificacion"
                ? left.stars - right.stars
                : left.name.localeCompare(right.name, "es");

        if (comparison !== 0) return comparison * direction;
        return left.name.localeCompare(right.name, "es");
    });
}

export async function getRestaurants(
    filter: RestaurantFilter = {}
): Promise<{ restaurants: RestaurantList[]; totalPages: number }> {
    try {
        const response = await api.get<ApiCollectionResponse<RestaurantDtoFromApi>>(`/api/locales`, { params: filter });
        const restaurants = applyRestaurantClientFilters(
            getCollectionFromResponse<RestaurantDtoFromApi>(response.data)
                .map(mapRestaurantDtoApiToRestaurantType),
            filter,
        );

        return {
            restaurants,
            totalPages: getTotalPagesFromResponse(response.data, restaurants.length, filter.size),
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

export async function getAllRestaurants(
    filter: RestaurantFilter = {},
    pageSize = RESTAURANT_FETCH_PAGE_SIZE,
): Promise<RestaurantList[]> {
    const safePageSize = Math.max(pageSize, 1);
    const baseFilter: RestaurantFilter = { ...filter };
    delete baseFilter.page;
    delete baseFilter.size;

    const restaurants: RestaurantList[] = [];
    const seenRestaurantIds = new Set<number>();
    let page = 0;

    while (true) {
        const {
            restaurants: pageRestaurants,
            totalPages,
        } = await getRestaurants({
            ...baseFilter,
            page,
            size: safePageSize,
        });
        const newRestaurants = pageRestaurants.filter(
            (restaurant) => !seenRestaurantIds.has(restaurant.id),
        );

        newRestaurants.forEach((restaurant) => {
            seenRestaurantIds.add(restaurant.id);
            restaurants.push(restaurant);
        });

        const hasNextMetadataPage = page + 1 < totalPages;
        const maybeHasNextPage = pageRestaurants.length >= safePageSize;

        if (
            (!hasNextMetadataPage && !maybeHasNextPage) ||
            newRestaurants.length === 0
        ) {
            break;
        }

        page += 1;
    }

    return applyRestaurantClientFilters(restaurants, baseFilter);
}



interface RestaurantSingleDtoFromApi {
    id?: number | string;
    localId?: number | string;
    idLocal?: number | string;
    nombre?: string | null;
    name?: string | null;
    razonSocial?: string | null;
    urlFoto?: string | null;
    fotoUrl?: string | null;
    imagenUrl?: string | null;
    imageUrl?: string | null;
    urlFotoPerfil?: string | null;
    fotoPerfilUrl?: string | null;
    profilePhotoUrl?: string | null;
    urlPortada?: string | null;
    urlFotoPortada?: string | null;
    urlPortadaMobile?: string | null;
    urlPortadaDesktop?: string | null;
    fotoPortadaUrl?: string | null;
    coverPhotoUrl?: string | null;
    estadoServicio?: boolean | string | number | null;
    servicio?: boolean | string | number | null;
    estado?: boolean | string | number | null;
    calificacion?: number | string | null;
    rating?: number | string | null;
    stars?: number | string | null;
    direccion?: string | null;
    address?: string | null;
    descripcion?: string | null;
    description?: string | null;
}

function mapRestaurantDtoApiToRestaurant(r: RestaurantSingleDtoFromApi): Restaurant {
    const summary = mapRestaurantDtoApiToRestaurantType(r);

    return {
        ...summary,
        address: getFirstStringValue(r.direccion, r.address),
        description: getFirstStringValue(r.descripcion, r.description),
    };
}


export async function getRestaurantName(id: number): Promise<string> {
    const restaurant = await getRestaurant(String(id));
    return restaurant.name;
}

export async function getDishName(id: number): Promise<string> {
    const dish = await getDish(String(id));
    return dish.name;
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
type CartFromApi = Omit<Cart, "restaurantId"> & { localId: number };

function mapCartFromApi(cart: CartFromApi): Cart {
    const { localId, voucherId, cuponCodigo, cuponPorcentaje, ...rest } = cart;
    return {
        ...rest,
        restaurantId: localId,
        voucherId: voucherId ?? null,
        cuponCodigo: cuponCodigo ?? null,
        cuponPorcentaje: cuponPorcentaje ?? null,
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

// ── Cupones del carrito ────────────────────────────────────────────────────────

export async function applyCartCoupon(
    restaurantId: number,
    code: string
): Promise<Cart> {
    const session = await requireCurrentSession();

    try {
        const response = await api.patch<CartFromApi>(
            `/api/clientes/${session.idTipoUsuario}/carritos/${restaurantId}/cupon`,
            { codigo: code.trim() }
        );
        return mapCartFromApi(response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const data = error.response?.data;
            const message =
                data?.error ?? data?.message ?? `Error al aplicar cupón (${error.response?.status})`;
            throw new Error(message);
        }
        throw new Error("No se pudo aplicar el cupón.");
    }
}

export async function removeCartCoupon(restaurantId: number): Promise<Cart> {
    const session = await requireCurrentSession();

    try {
        const response = await api.delete<CartFromApi>(
            `/api/clientes/${session.idTipoUsuario}/carritos/${restaurantId}/cupon`
        );
        return mapCartFromApi(response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const data = error.response?.data;
            const message =
                data?.error ?? data?.message ?? `Error al quitar cupón (${error.response?.status})`;
            throw new Error(message);
        }
        throw new Error("No se pudo quitar el cupón.");
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
    tieneCalificacionLocal?: unknown;
    calificadoLocal?: unknown;
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

interface OrderHistoryPageResponse {
    content: PedidoDtoFromApi[];
    totalPages: number;
    totalElements: number;
    number: number;
}

async function fetchOrderHistoryPage(
    clientId: number,
    params: Record<string, string | number>,
): Promise<OrderHistoryPageResponse> {
    const response = await api.get<OrderHistoryPageResponse>(
        `/api/clientes/${clientId}/pedidos`,
        { params },
    );

    return response.data;
}

function mapOrderFromApi(dto: PedidoDtoFromApi): Order {
    const {
        localId,
        items,
        calificacionLocal,
        localCalificacion,
        tieneCalificacionLocal,
        calificadoLocal,
        ...rest
    } = dto;
    const rating = mapOrderRatingFromApi(
        calificacionLocal ?? localCalificacion ?? null,
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
            ),
    };
}

function mapOrderRatingFromApi(
    rating: unknown,
    orderId: number,
): OrderRating | null {
    if (!rating) return null;

    if (typeof rating === "string" || typeof rating === "number") {
        const calificacion = normalizeRatingValue(rating);
        if (!calificacion) return null;

        return {
            pedidoId: orderId,
            calificacion,
            comentario: null,
            creacion: null,
        };
    }

    if (typeof rating !== "object") return null;

    const record = rating as Record<string, unknown>;
    const nestedRating =
        record.calificacionLocal ??
        record.localCalificacion ??
        record.rating ??
        record.data;

    if (nestedRating && nestedRating !== rating) {
        const mappedNestedRating = mapOrderRatingFromApi(nestedRating, orderId);
        if (mappedNestedRating) return mappedNestedRating;
    }

    const calificacion = normalizeRatingValue(record.calificacion);
    if (!calificacion) return null;

    return {
        id: typeof record.id === "number" ? record.id : undefined,
        pedidoId: typeof record.pedidoId === "number" ? record.pedidoId : orderId,
        calificacion,
        comentario: typeof record.comentario === "string" ? record.comentario : null,
        creacion: typeof record.creacion === "string" ? record.creacion : null,
    };
}

function normalizeRatingValue(value: unknown): string | null {
    if (typeof value === "string") {
        const normalized = value.trim();
        return normalized.length > 0 ? normalized : null;
    }

    if (typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5) {
        return value === 1 ? "1_ESTRELLA" : `${value}_ESTRELLAS`;
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
            Boolean(normalizeRatingValue(record.calificacion)) ||
            hasOrderRatingFromApi(
                record.id,
                record.pedidoId,
                record.calificacionLocal,
                record.localCalificacion,
                record.calificadoLocal,
                record.tieneCalificacionLocal,
                record.rating,
                record.data,
            )
        );
    });
}

async function fetchOrderLocalRating(
    clientId: number,
    orderId: number,
): Promise<OrderRating | null> {
    const urls = [
        `/api/pedidos/${orderId}/calificacion-local`,
        `/api/clientes/${clientId}/pedidos/${orderId}/calificacion-local`,
    ];

    for (const url of urls) {
        try {
            const response = await api.get<unknown>(url);
            return mapOrderRatingFromApi(response.data, orderId);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;

                if (status === 404 || status === 405) {
                    continue;
                }

                const data = error.response?.data as { error?: string; message?: string } | string | undefined;
                const message =
                    typeof data === "string"
                        ? data
                        : data?.error ?? data?.message ?? `Error al obtener calificacion (${status})`;
                throw new Error(message);
            }

            throw new Error("No se pudo cargar la calificacion del pedido.");
        }
    }

    return null;
}

async function hydrateOrdersWithLocalRatings(
    clientId: number,
    orders: Order[],
): Promise<Order[]> {
    const ordersToHydrate = orders.filter(
        (order) => order.estado === "FINALIZADO" && !order.hasLocalRating,
    );

    if (ordersToHydrate.length === 0) return orders;

    const ratingResults = await Promise.all(
        ordersToHydrate.map(async (order) => ({
            orderId: order.id,
            rating: await fetchOrderLocalRating(clientId, order.id).catch(() => null),
        })),
    );

    const ratingsByOrderId = new Map(
        ratingResults
            .filter((result): result is { orderId: number; rating: OrderRating } =>
                Boolean(result.rating),
            )
            .map((result) => [result.orderId, result.rating]),
    );

    if (ratingsByOrderId.size === 0) return orders;

    return orders.map((order) => {
        const rating = ratingsByOrderId.get(order.id);

        return rating
            ? { ...order, calificacionLocal: rating, hasLocalRating: true }
            : order;
    });
}

// Historial de pedidos cerrados del cliente, paginado en el backend.
export async function getOrderHistory(
    filter: OrderHistoryFilter = {}
): Promise<{ orders: Order[]; totalPages: number; totalElements: number }> {
    const session = await requireCurrentSession();
    const requestedPage = filter.page ?? 0;
    const requestedSize = filter.size ?? 10;

    const params: Record<string, string | number> = {};
    if (filter.orderId != null) params.identificador = filter.orderId;
    if (filter.localId != null) params.localId = filter.localId;
    if (filter.estado) params.estado = filter.estado;
    if (filter.desde) params.desde = filter.desde;
    if (filter.hasta) params.hasta = filter.hasta;
    if (filter.ordenarPor) params.ordenarPor = filter.ordenarPor;
    if (filter.direccion) params.direccion = filter.direccion;

    try {
        if (filter.estado) {
            const fetchSize = Math.max(requestedSize, 100);
            let currentPage = 0;
            let totalBackendPages = 1;
            const matchingOrders: Order[] = [];

            while (currentPage < totalBackendPages) {
                const data = await fetchOrderHistoryPage(session.idTipoUsuario, {
                    ...params,
                    page: currentPage,
                    size: fetchSize,
                });

                totalBackendPages = data.totalPages;
                matchingOrders.push(
                    ...data.content
                        .map(mapOrderFromApi)
                        .filter((order) => order.estado === filter.estado),
                );
                currentPage += 1;
            }

            const totalElements = matchingOrders.length;
            const totalPages = Math.ceil(totalElements / requestedSize);
            const start = requestedPage * requestedSize;
            const paginatedOrders = matchingOrders.slice(start, start + requestedSize);
            const orders =
                filter.includeRatings === false
                    ? paginatedOrders
                    : await hydrateOrdersWithLocalRatings(
                          session.idTipoUsuario,
                          paginatedOrders,
                      );

            return {
                orders,
                totalPages,
                totalElements,
            };
        }

        const response = await fetchOrderHistoryPage(session.idTipoUsuario, {
            ...params,
            page: requestedPage,
            size: requestedSize,
        });
        const mappedOrders = response.content.map(mapOrderFromApi);
        const orders = filter.includeRatings === false
            ? mappedOrders
            : await hydrateOrdersWithLocalRatings(session.idTipoUsuario, mappedOrders);

        return {
            orders,
            totalPages: response.totalPages,
            totalElements: response.totalElements,
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

export class CancelOrderError extends Error {
    constructor(
        message: string,
        public readonly status?: number,
        public readonly notCancelable = false,
    ) {
        super(message);
        this.name = "CancelOrderError";
    }
}

export async function getPendingConfirmationOrders(): Promise<Order[]> {
    const session = await requireCurrentSession();

    try {
        const response = await api.get<PedidoDtoFromApi[]>(
            `/api/clientes/${session.idTipoUsuario}/pedidos/pendientes-confirmacion`,
        );

        return response.data.map(mapOrderFromApi);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const message = getApiErrorMessage(error.response?.data);

            if (status === 404) {
                throw new Error(
                    "Los pedidos pendientes de confirmación no están disponibles en el servidor.",
                );
            }

            throw new Error(
                message ?? `Error al obtener pedidos pendientes (${status})`,
            );
        }

        throw new Error("No se pudieron cargar los pedidos en curso.");
    }
}

export async function getPendingConfirmationOrdersCount(): Promise<number> {
    try {
        const orders = await getPendingConfirmationOrders();
        return orders.length;
    } catch {
        return 0;
    }
}

export async function cancelClientOrder(orderId: number): Promise<Order> {
    const session = await requireCurrentSession();

    try {
        const response = await api.patch<PedidoDtoFromApi>(
            `/api/clientes/${session.idTipoUsuario}/pedidos/${orderId}/cancelar`,
        );

        return mapOrderFromApi(response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const message = getApiErrorMessage(error.response?.data);

            if (status === 409) {
                throw new CancelOrderError(
                    "Tu pedido ya no es cancelable.",
                    409,
                    true,
                );
            }

            if (status === 404) {
                throw new CancelOrderError(
                    message ?? "Pedido no encontrado.",
                    404,
                );
            }

            if (status === 403) {
                throw new CancelOrderError(
                    message ?? "No tenés permiso para cancelar este pedido.",
                    403,
                );
            }

            throw new CancelOrderError(
                message ?? "No se pudo cancelar el pedido. Intentalo nuevamente.",
                status,
            );
        }

        throw new CancelOrderError(
            "No se pudo cancelar el pedido. Intentalo nuevamente.",
        );
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
    if (typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5) {
        return value;
    }

    if (typeof value !== "string") {
        return null;
    }

    const normalized = value.trim();
    const match = normalized.match(/^([1-5])(?:_|$)/);
    return match ? Number(match[1]) : null;
}

export async function getOrderLocalRating(orderId: number): Promise<OrderRating | null> {
    const session = await requireCurrentSession();
    return fetchOrderLocalRating(session.idTipoUsuario, orderId);
}

export async function submitOrderLocalRating(
    orderId: number,
    request: SubmitOrderRatingRequest,
): Promise<OrderRating> {
    await requireCurrentSession();
    const ratingNumber = parseRatingValueToNumber(request.calificacion);

    if (ratingNumber == null) {
        throw new Error("La calificación debe ser un número entre 1 y 5.");
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
