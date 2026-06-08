export type StatisticsGranularity = "dia" | "mes";

export type StatisticsFilters = {
  from: string;
  to: string;
  granularity: StatisticsGranularity;
  limit: number;
  orderStatusDate: string;
};

export type TopSellingDish = {
  dishId: number;
  name: string;
  quantitySold: number;
  revenue: number;
};

export type TopSellingDishesReport = {
  from: string;
  to: string;
  items: TopSellingDish[];
};

export type DishSalesPoint = {
  period: string;
  quantity: number;
  revenue: number;
};

export type DishSalesSeries = {
  dishId: number;
  name: string;
  points: DishSalesPoint[];
};

export type DishSalesEvolutionReport = {
  from: string;
  to: string;
  granularity: StatisticsGranularity;
  series: DishSalesSeries[];
};

export type RevenuePoint = {
  period: string;
  revenue: number;
  orders: number;
};

export type RevenueReport = {
  from: string;
  to: string;
  granularity: StatisticsGranularity;
  periodTotal: number;
  points: RevenuePoint[];
};

export type OrderStatusCategory =
  | "PENDIENTES"
  | "ACEPTADOS"
  | "EN_CURSO"
  | "EN_CAMINO"
  | "COMPLETADOS"
  | "RECHAZADOS"
  | "CANCELADOS";

export type OrderStatusSlice = {
  category: OrderStatusCategory;
  label: string;
  count: number;
};

export type OrderStatusReport = {
  date: string;
  total: number;
  slices: OrderStatusSlice[];
};

export type PromotionUsageType = "descuento" | "cupon";

export type PromotionUsageItem = {
  type: PromotionUsageType;
  promotionId: number;
  code: string | null;
  percentage: number | null;
  uses: number;
  discountedAmount: number;
  label: string;
};

export type PromotionsReport = {
  from: string;
  to: string;
  items: PromotionUsageItem[];
};

export type PopularityRatingItem = {
  dishId: number;
  name: string;
  quantitySold: number;
  averageRating: number;
  ratedOrders: number;
};

export type PopularityRatingReport = {
  from: string;
  to: string;
  globalRestaurantRating: number;
  items: PopularityRatingItem[];
};

export type RestaurantStatistics = {
  topSellingDishes: TopSellingDishesReport;
  dishSalesEvolution: DishSalesEvolutionReport;
  revenue: RevenueReport;
  orderStatus: OrderStatusReport;
  promotions: PromotionsReport;
  popularityRating: PopularityRatingReport;
};

export type TopSellingDishesApiResponse = {
  desde: string;
  hasta: string;
  items: Array<{
    platoId: number;
    nombre: string;
    cantidadVendida: number;
    ingresos: number;
  }>;
};

export type DishSalesEvolutionApiResponse = {
  desde: string;
  hasta: string;
  granularidad: StatisticsGranularity;
  series: Array<{
    platoId: number;
    nombre: string;
    puntos: Array<{
      periodo: string;
      cantidad: number;
      ingresos: number;
    }>;
  }>;
};

export type RevenueApiResponse = {
  desde: string;
  hasta: string;
  granularidad: StatisticsGranularity;
  totalPeriodo: number;
  puntos: Array<{
    periodo: string;
    ingresos: number;
    pedidos: number;
  }>;
};

export type OrderStatusApiResponse = {
  fecha: string;
  total: number;
  slices: Array<{
    categoria: OrderStatusCategory;
    etiqueta: string;
    cantidad: number;
  }>;
};

export type PromotionsApiResponse = {
  desde: string;
  hasta: string;
  items: Array<{
    tipo: PromotionUsageType;
    promocionId: number;
    codigo: string | null;
    porcentaje: number | null;
    usos: number;
    montoDescontado: number;
  }>;
};

export type PopularityRatingApiResponse = {
  desde: string;
  hasta: string;
  valoracionLocalGlobal: number;
  items: Array<{
    platoId: number;
    nombre: string;
    cantidadVendida: number;
    valoracionPromedio: number;
    pedidosCalificados: number;
  }>;
};
