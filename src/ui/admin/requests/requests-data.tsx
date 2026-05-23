export type RequestStatus = "pending" | "approved" | "rejected";

export type LocalRequest = {
  restaurant: string;
  email: string;
  phone: string;
  date: string;
  status: RequestStatus;
  address: string;
  foodType: string;
  description: string;
  images: string[];
};

export const initialRequests: LocalRequest[] = [
  {
    restaurant: "La Pasta Nostra",
    email: "lapastanostra@email.com",
    phone: "099 123 456",
    date: "12/05/2026",
    status: "pending",
    address: "Av. Italia 2450, Montevideo",
    foodType: "Comida italiana artesanal",
    description:
      "Somos un emprendimiento familiar especializado en cocina italiana artesanal. Nuestro menú incluye pastas frescas, pizzas al horno de piedra y postres tradicionales. Trabajamos con ingredientes frescos y producción diaria.",
    images: [
      "/images/la_pasta_nostra_1.png",
      "/images/la_pasta_nostra_2.png",
      "/images/la_pasta_nostra_3.png",
      "/images/la_pasta_nostra_4.png",
    ],
  },
  {
    restaurant: "Sabor Criollo",
    email: "saborcriollo@email.com",
    phone: "098 456 789",
    date: "10/05/2026",
    status: "approved",
    address: "Bulevar Artigas 1820, Montevideo",
    foodType: "Comida criolla",
    description:
      "Local gastronómico enfocado en platos tradicionales uruguayos, minutas, guisos, carnes y comidas caseras.",
    images: [
      "/images/el_sabor_criollo_1.png",
      "/images/el_sabor_criollo_2.png",
      "/images/el_sabor_criollo_3.png",
      "/images/el_sabor_criollo_4.png",
    ],
  },
  {
    restaurant: "Wok Express",
    email: "wokexpress@email.com",
    phone: "091 852 741",
    date: "08/05/2026",
    status: "rejected",
    address: "18 de Julio 1450, Montevideo",
    foodType: "Comida asiática",
    description:
      "Propuesta gastronómica rápida basada en woks, arroz, noodles y platos de inspiración asiática.",
    images: [
      "/images/wok_express_1.png",
      "/images/wok_express_2.png",
      "/images/wok_express_3.png",
      "/images/wok_express_4.png",
    ],
  },
];
