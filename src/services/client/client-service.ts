import axios, { AxiosError } from "axios";

import { api } from "../api-client";
import { getStoredSession } from "@/lib/auth/session-store";

import type {
    DeliveryPointCredentials,
    DeliveryPoint,
} from "@/lib/client/types"

export async function addDeliveryPoint(credentials: DeliveryPointCredentials): Promise<void>{
    const session = getStoredSession();
    if (!session) throw new Error("Sesión no encontrada");

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
    const session = getStoredSession();
    if (!session) throw new Error("Sesión no encontrada");

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