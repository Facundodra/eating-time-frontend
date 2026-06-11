type PageMetadata = {
  breadcrumb: string;
  description: string;
  title: string;
};

export const pageMetadata: Record<string, PageMetadata> = {
  "/admin": {
    breadcrumb: "Administración / Inicio",
    title: "Panel de administración",
    description: "Resumen general de administración",
  },
  "/admin/blocks": {
    breadcrumb: "Administración / Bloqueos",
    title: "Bloqueo de cuentas",
    description: "Gestión de bloqueo de usuarios",
  },
  "/admin/change-password": {
    breadcrumb: "Administración / Seguridad",
    title: "Cambiar contraseña",
    description: "Actualización de contraseña del administrador",
  },
  "/admin/my-data": {
    breadcrumb: "Administración / Perfil",
    title: "Mis datos",
    description: "Información y configuración de la cuenta",
  },
  "/admin/requests": {
    breadcrumb: "Administración / Solicitudes",
    title: "Solicitudes de locales",
    description: "Gestión y revisión de solicitudes de registro",
  },
  "/admin/usuarios": {
    breadcrumb: "Administración / Usuarios",
    title: "Usuarios",
    description: "Gestión de usuarios registrados",
  },
  "/restaurant": {
    breadcrumb: "Resumen operativo del local",
    title: "Inicio",
    description: "Resumen general del local",
  },
  "/restaurant/workbench": {
    breadcrumb: "Pedidos de las últimas 24 horas",
    title: "Mesa de trabajo",
    description: "Gestión de mesas y pedidos en curso",
  },
  "/restaurant/orders": {
    breadcrumb: "Análisis comercial del local",
    title: "Pedidos",
    description: "Historial y estado de pedidos",
  },
  "/restaurant/dishes": {
    breadcrumb: "Configuración operativa del local",
    title: "Platos",
    description: "Menú y gestión de platos",
  },
  "/restaurant/coupons": {
    breadcrumb: "Configuración operativa del local",
    title: "Cupones",
    description: "Creación y administración de cupones",
  },
  "/restaurant/discounts": {
    breadcrumb: "Configuración operativa del local",
    title: "Descuentos del local",
    description: "Configuración de descuentos",
  },
  "/restaurant/customers": {
    breadcrumb: "Análisis comercial del local",
    title: "Clientes",
    description: "Base de clientes del local",
  },
  "/restaurant/claims": {
    breadcrumb: "Trabajo diario del local",
    title: "Reclamos",
    description: "Gestión de reclamos y devoluciones",
  },
  "/restaurant/statistics": {
    breadcrumb: "Análisis comercial del local",
    title: "Estadísticas",
    description: "Métricas y reportes del local",
  },
  "/restaurant/schedules": {
    breadcrumb: "Configuración operativa del local",
    title: "Horarios y estado de servicio",
    description: "Configuración de horarios de atención",
  },
  "/restaurant/my-data": {
    breadcrumb: "Cuenta del local",
    title: "Mis datos",
    description: "Información y configuración de la cuenta",
  },
  "/restaurant/change-password": {
    breadcrumb: "Cuenta del local",
    title: "Cambiar contraseña",
    description: "Actualización de contraseña de la cuenta",
  },
};

export function getPageMetadata(pathname: string) {
  const matchingPath = Object.keys(pageMetadata)
    .filter((path) => pathname === path || pathname.startsWith(`${path}/`))
    .sort((a, b) => b.length - a.length)[0];

  if (matchingPath) {
    return pageMetadata[matchingPath];
  }

  return pathname.startsWith("/admin")
    ? pageMetadata["/admin"]
    : pageMetadata["/restaurant"];
}
