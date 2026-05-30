import axios from "axios";

import type {
  ClientDish,
  DeliveryPoint,
  DeliveryPointCredentials,
  DishFilter,
  LocalList,
} from "@/lib/client/types";
import { getStoredSession } from "@/lib/auth/session-store";

import { api, publicApi } from "../api-client";

type BackendErrorResponse = {
  error?: string;
  message?: string;
  detail?: string;
};

type PlatoDtoFromApi = {
  id: number;
  nombre: string;
  fotoUrl: string | null;
  precio: number;
  disponible: boolean;
  creacion: string;
  localId: number;
  categoriaIds: number[] | null;
};

type LocalDtoFromApi = Partial<{
  id: number;
  nombre: string;
  descripcion: string;
  direccion: string;
  urlFoto: string;
  url_foto: string;
  fotoUrl: string;
  calificacion: number;
  califiacion: number;
  estadoServicio: boolean;
  estado_servicio: boolean;
  abierto: boolean;
}>;

function requireSession() {
  const session = getStoredSession();

  if (!session) {
    throw new Error("Sesion no encontrada");
  }

  return session;
}

function getBackendMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<BackendErrorResponse>(error)) {
    const data = error.response?.data;

    return data?.error ?? data?.message ?? data?.detail ?? fallback;
  }

  return fallback;
}

function mapPlatoToClientDish(plato: PlatoDtoFromApi): ClientDish {
  return {
    id: String(plato.id),
    name: plato.nombre,
    price: plato.precio,
    imageUrl: plato.fotoUrl,
    status: plato.disponible ? "available" : "unavailable",
    createdAt: plato.creacion,
    localId: plato.localId,
    categories: plato.categoriaIds ?? [],
  };
}

function mapLocal(local: LocalDtoFromApi): LocalList {
  return {
    id: local.id ?? 0,
    nombre: local.nombre ?? "Local sin nombre",
    descripcion: local.descripcion ?? "Sin descripcion disponible.",
    direccion: local.direccion ?? "Direccion no disponible",
    url_foto:
      local.url_foto ??
      local.urlFoto ??
      local.fotoUrl ??
      "/images/el_sabor_criollo_1.png",
    calificacion: local.calificacion ?? local.califiacion ?? 0,
    estado_servicio:
      local.estado_servicio ?? local.estadoServicio ?? local.abierto ?? false,
  };
}

export async function addDeliveryPoint(
  credentials: DeliveryPointCredentials,
): Promise<void> {
  const session = requireSession();

  const body: Record<string, string> = {
    localidad: credentials.loc,
    numero: credentials.number,
    calle: credentials.street,
  };

  if (credentials.apto) {
    body.nroApto = credentials.apto;
  }

  if (credentials.indications) {
    body.indicaciones = credentials.indications;
  }

  try {
    await api.post(`/api/clientes/${session.idTipoUsuario}/puntos-entrega`, body);
  } catch (error) {
    throw new Error(
      getBackendMessage(error, "No se pudo agregar el punto de entrega."),
    );
  }
}

export async function getDeliveryPoints(): Promise<DeliveryPoint[]> {
  const session = requireSession();

  try {
    const response = await api.get<DeliveryPoint[]>(
      `/api/clientes/${session.idTipoUsuario}/puntos-entrega`,
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getBackendMessage(error, "No se pudieron cargar los puntos de entrega."),
    );
  }
}

export async function getLocales(): Promise<LocalList[]> {
  try {
    const response = await publicApi.get<LocalDtoFromApi[]>("/api/locales");
    return response.data.map(mapLocal).filter((local) => local.id > 0);
  } catch (error) {
    // If the backend requires authentication (401), return empty list for public users
    if (axios.isAxiosError<BackendErrorResponse>(error) && error.response?.status === 401) {
      return [];
    }

    throw new Error(getBackendMessage(error, "No se pudieron cargar los locales."));
  }
}

export async function getDishes(filter?: DishFilter): Promise<ClientDish[]> {
  const params = new URLSearchParams();
  if (filter?.idLocal != null) params.set("idLocal", String(filter.idLocal));
  if (filter?.precioMin != null) params.set("precioMin", String(filter.precioMin));
  if (filter?.precioMax != null) params.set("precioMax", String(filter.precioMax));
  if (filter?.q) params.set("q", filter.q);
  if (filter?.conDescuento) params.set("conDescuento", "true");
  if (filter?.orden) params.set("orden", filter.orden);
  if (filter?.sentido) params.set("sentido", filter.sentido);
  if (filter?.pagina != null) params.set("pagina", String(filter.pagina));
  if (filter?.tamano != null) params.set("tamano", String(filter.tamano));

  const query = params.toString();
  const url = `/api/locales/platos${query ? `?${query}` : ""}`;

  try {
    const response = await publicApi.get<PlatoDtoFromApi[]>(url);
    return response.data.map(mapPlatoToClientDish);
  } catch (error) {
    throw new Error(getBackendMessage(error, "No se pudieron cargar los platos."));
  }
}

export async function getDish(id: string): Promise<ClientDish> {
  requireSession();

  try {
    const response = await api.get<PlatoDtoFromApi>(
      `/api/platos/${encodeURIComponent(id)}`,
    );

    return mapPlatoToClientDish(response.data);
  } catch (error) {
    throw new Error(getBackendMessage(error, "No se pudo cargar el plato."));
  }
}
