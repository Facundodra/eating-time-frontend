import axios, { AxiosError } from "axios";

import { api } from "../api-client";
import { getStoredSession } from "@/lib/auth/session-store";

import type {
    PuntoEntregaCredentials,
    PuntoDeEntrega,
    LocalList
} from "@/lib/client/types"

export async function addPuntoEntrega(credentials: PuntoEntregaCredentials): Promise<void>{
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

export async function getPuntosEntrega(): Promise<PuntoDeEntrega[]> {
    const session = getStoredSession();
    if (!session) throw new Error("Sesión no encontrada");

    try {
        const response = await api.get<PuntoDeEntrega[]>(
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




export async function getLocales(): Promise<LocalList[]>{
    const session = getStoredSession();
    if(!session) throw new Error("Sesión no encontrada");

    return [
        {
            id: 1,
            nombre: "McDonald's",
            descripcion: "Hamburguesas, papas fritas y menús para toda la familia",
            direccion: "Av. 18 de Julio 1360, Centro, Montevideo",
            url_foto: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/McDonald%27s_Golden_Arches.svg/250px-McDonald%27s_Golden_Arches.svg.png",
            califiacion: 3.8,
            estado_servicio: true,
        },
        {
            id: 2,
            nombre: "Burger King",
            descripcion: "Whopper a la parrilla y King deals exclusivos",
            direccion: "Punta Carretas Shopping, Montevideo",
            url_foto: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Burger_King_2020.svg/250px-Burger_King_2020.svg.png",
            califiacion: 3.9,
            estado_servicio: true,
        },
        {
            id: 3,
            nombre: "KFC",
            descripcion: "Pollo frito crujiente con la receta original de 11 especias",
            direccion: "Av. Brasil 2776, Pocitos, Montevideo",
            url_foto: "https://upload.wikimedia.org/wikipedia/en/thumb/5/57/KFC_logo-image.svg/250px-KFC_logo-image.svg.png",
            califiacion: 4.0,
            estado_servicio: true,
        },
        {
            id: 4,
            nombre: "Subway",
            descripcion: "Sándwiches frescos armados a tu gusto con pan horneado al momento",
            direccion: "Av. Rivera 2100, Pocitos, Montevideo",
            url_foto: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Subway_2016_logo.svg/250px-Subway_2016_logo.svg.png",
            califiacion: 3.7,
            estado_servicio: true,
        },
        {
            id: 5,
            nombre: "Pizza Hut",
            descripcion: "Pizzas al horno, pastas y breadsticks para compartir",
            direccion: "World Trade Center, Av. Luis A. de Herrera 1248, Montevideo",
            url_foto: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Pizza_Hut_2025.svg/250px-Pizza_Hut_2025.svg.png",
            califiacion: 4.1,
            estado_servicio: true,
        },
        {
            id: 6,
            nombre: "Domino's",
            descripcion: "Pizzas a domicilio en 30 minutos o menos",
            direccion: "Av. Agraciada 3560, Aguada, Montevideo",
            url_foto: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Domino%27s_2025.svg/250px-Domino%27s_2025.svg.png",
            califiacion: 4.2,
            estado_servicio: false,
        },
        {
            id: 7,
            nombre: "Starbucks",
            descripcion: "Cafés de especialidad, frappuccinos y pastelería artesanal",
            direccion: "Rambla República de México 6400, Carrasco, Montevideo",
            url_foto: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo_2011.svg/250px-Starbucks_Corporation_Logo_2011.svg.png",
            califiacion: 4.3,
            estado_servicio: true,
        },
        {
            id: 8,
            nombre: "Popeyes",
            descripcion: "Pollo frito cajún crujiente y biscuits al estilo Louisiana",
            direccion: "Ellauri 460, Punta Carretas, Montevideo",
            url_foto: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Popeyes_Logo_2020.svg/250px-Popeyes_Logo_2020.svg.png",
            califiacion: 4.4,
            estado_servicio: true,
        },
        {
            id: 9,
            nombre: "Dunkin'",
            descripcion: "Donuts, café y snacks para llevar a toda hora",
            direccion: "Av. Gral. Flores 3264, La Blanqueada, Montevideo",
            url_foto: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Dunkin%27_2022.svg/250px-Dunkin%27_2022.svg.png",
            califiacion: 4.0,
            estado_servicio: false,
        },
        {
            id: 10,
            nombre: "Dairy Queen",
            descripcion: "Blizzards, helados suaves y hamburguesas flame-grilled",
            direccion: "Br. Artigas 1340, Parque Rodó, Montevideo",
            url_foto: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Dairy_Queen_logo.svg/250px-Dairy_Queen_logo.svg.png",
            califiacion: 4.2,
            estado_servicio: true,
        },
        {
            id: 11,
            nombre: "Five Guys",
            descripcion: "Hamburguesas artesanales y papas fritas estilo cajún",
            direccion: "Av. Italia 3462, Tres Cruces, Montevideo",
            url_foto: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Five_Guys_logo.svg/250px-Five_Guys_logo.svg.png",
            califiacion: 4.6,
            estado_servicio: true,
        },
        {
            id: 12,
            nombre: "Shake Shack",
            descripcion: "ShackBurgers, shake de vainilla y crinkle fries",
            direccion: "Rambla Gandhi 400, Pocitos, Montevideo",
            url_foto: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Shake_Shack_logo.svg/250px-Shake_Shack_logo.svg.png",
            califiacion: 4.5,
            estado_servicio: true,
        },
        {
            id: 13,
            nombre: "Baskin-Robbins",
            descripcion: "31 sabores de helado artesanal y tortas heladas",
            direccion: "Av. Sarmiento 2530, Pocitos, Montevideo",
            url_foto: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Baskin-Robbins_logo_2022.svg/250px-Baskin-Robbins_logo_2022.svg.png",
            califiacion: 4.3,
            estado_servicio: false,
        },
        {
            id: 14,
            nombre: "Papa John's",
            descripcion: "Pizzas con ingredientes frescos y salsa de ajo especial",
            direccion: "Av. Luis Batlle Berres 5270, Montevideo",
            url_foto: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Papa_Johns_logo.svg/250px-Papa_Johns_logo.svg.png",
            califiacion: 4.0,
            estado_servicio: true,
        },
        {
            id: 15,
            nombre: "Panera Bread",
            descripcion: "Sándwiches, sopas y ensaladas con pan artesanal horneado",
            direccion: "Av. Dr. Luis Morquio 1820, Pocitos, Montevideo",
            url_foto: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Panera_Bread_wordmark.svg/250px-Panera_Bread_wordmark.svg.png",
            califiacion: 4.1,
            estado_servicio: true,
        },
    ];
}