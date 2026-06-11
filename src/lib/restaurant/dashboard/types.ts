import type { OrderStatus } from "@/lib/restaurant/workbench/types";

export type RestaurantDashboardStat = {
  label: string;
  tag: string;
  tone: "amber" | "emerald" | "slate";
  value: string;
};

export type RestaurantDashboardOrder = {
  id: number;
  customerLabel: string;
  status: OrderStatus;
  statusLabel: string;
  time: string;
  total: string;
};

export type RestaurantDashboardData = {
  ordersError: string | null;
  recentOrders: RestaurantDashboardOrder[];
  stats: RestaurantDashboardStat[];
  statsError: string | null;
};
