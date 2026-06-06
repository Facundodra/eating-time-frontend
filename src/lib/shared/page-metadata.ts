type PageMetadata = {
  breadcrumb: string;
  description: string;
  title: string;
};

export const pageMetadata: Record<string, PageMetadata> = {
  "/admin": {
    breadcrumb: "Administracion / Inicio",
    title: "Panel de administracion",
    description: "Resumen general de administracion",
  },
  "/admin/blocks": {
    breadcrumb: "Administracion / Bloqueos",
    title: "Bloqueo de cuentas",
    description: "Gestion de bloqueo de usuarios",
  },
  "/admin/change-password": {
    breadcrumb: "Administracion / Seguridad",
    title: "Cambiar contrasena",
    description: "Actualizacion de contrasena del administrador",
  },
  "/admin/my-data": {
    breadcrumb: "Administracion / Perfil",
    title: "Mis datos",
    description: "Informacion y configuracion de la cuenta",
  },
  "/admin/requests": {
    breadcrumb: "Administracion / Solicitudes",
    title: "Solicitudes de locales",
    description: "Gestion y revision de solicitudes de registro",
  },
  "/admin/usuarios": {
    breadcrumb: "Administracion / Usuarios",
    title: "Usuarios",
    description: "Gestion de usuarios registrados",
  },
  "/restaurant": {
    breadcrumb: "Resumen operativo del local",
    title: "Inicio",
    description: "Resumen general del local",
  },
  "/restaurant/workbench": {
    breadcrumb: "Trabajo diario del local",
    title: "Mesa de trabajo",
    description: "Gestion de mesas y pedidos en curso",
  },
  "/restaurant/orders": {
    breadcrumb: "Analisis comercial del local",
    title: "Pedidos",
    description: "Historial y estado de pedidos",
  },
  "/restaurant/dishes": {
    breadcrumb: "Configuracion operativa del local",
    title: "Platos",
    description: "Menu y gestion de platos",
  },
  "/restaurant/coupons": {
    breadcrumb: "Configuracion operativa del local",
    title: "Cupones",
    description: "Creacion y administracion de cupones",
  },
  "/restaurant/discounts": {
    breadcrumb: "Configuracion operativa del local",
    title: "Descuentos del local",
    description: "Configuracion de descuentos",
  },
  "/restaurant/customers": {
    breadcrumb: "Analisis comercial del local",
    title: "Clientes",
    description: "Base de clientes del local",
  },
  "/restaurant/claims": {
    breadcrumb: "Trabajo diario del local",
    title: "Reclamos",
    description: "Gestion de reclamos y devoluciones",
  },
  "/restaurant/statistics": {
    breadcrumb: "Analisis comercial del local",
    title: "Estadisticas",
    description: "Metricas y reportes del local",
  },
  "/restaurant/schedules": {
    breadcrumb: "Configuracion operativa del local",
    title: "Horarios y estado de servicio",
    description: "Configuracion de horarios de atencion",
  },
  "/restaurant/my-data": {
    breadcrumb: "Cuenta del local",
    title: "Mis datos",
    description: "Informacion y configuracion de la cuenta",
  },
  "/restaurant/change-password": {
    breadcrumb: "Cuenta del local",
    title: "Cambiar contrasena",
    description: "Actualizacion de contrasena de la cuenta",
  },
  "/my-data": {
    breadcrumb: "Cuenta / Perfil",
    title: "Mis datos",
    description: "Informacion y configuracion de la cuenta",
  },
  "/change-password": {
    breadcrumb: "Cuenta / Seguridad",
    title: "Cambiar contrasena",
    description: "Actualizacion de contrasena de la cuenta",
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
