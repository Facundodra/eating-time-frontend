# API Endpoints

This file lists the endpoints currently referenced by the frontend code.

Backend base URL is read from:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_API_BASE_URL`
- `http://localhost:8080` fallback in some local services

Authenticated backend calls must send cookies with the request (`withCredentials: true` or `credentials: "include"`).

## Authentication

| Method | Endpoint | Used for | Source |
| --- | --- | --- | --- |
| `POST` | `/api/auth/login-web` | Web login | `src/services/auth-service.ts` |
| `POST` | `/api/auth/logout` | Logout | `src/services/auth-service.ts` |
| `POST` | `/api/auth/registro` | Client registration | `src/services/auth-service.ts` |
| `POST` | `/api/auth/activar-cuenta-local` | Activate/confirm local account | `src/services/auth-service.ts`, `src/services/gestion-service.ts` |
| `POST` | `/api/auth/confirmar-cuenta` | Fallback local account confirmation endpoint | `src/services/auth-service.ts` |
| `PATCH` | `/api/auth/change-password` | Fallback password change endpoint | `src/services/account-service.ts` |

## Account

These endpoints are tried according to the authenticated user's role.

| Method | Endpoint | Used for | Source |
| --- | --- | --- | --- |
| `GET` | `/api/local/{roleId}` | Local profile | `src/services/account-service.ts` |
| `PATCH` | `/api/local/{roleId}` | Update local profile | `src/services/account-service.ts` |
| `GET` | `/api/clientes/{roleId}` | Client profile | `src/services/account-service.ts` |
| `PATCH` | `/api/clientes/{roleId}` | Update client profile | `src/services/account-service.ts` |
| `GET` | `/api/cliente/{roleId}` | Fallback client profile | `src/services/account-service.ts` |
| `PATCH` | `/api/cliente/{roleId}` | Fallback update client profile | `src/services/account-service.ts` |
| `GET` | `/api/admin/{roleId}` | Admin profile | `src/services/account-service.ts` |
| `PATCH` | `/api/admin/{roleId}` | Update admin profile | `src/services/account-service.ts` |
| `GET` | `/api/administradores/{roleId}` | Fallback admin profile | `src/services/account-service.ts` |
| `PATCH` | `/api/administradores/{roleId}` | Fallback update admin profile | `src/services/account-service.ts` |
| `GET` | `/api/usuarios/{userId}` | Fallback user profile | `src/services/account-service.ts` |
| `PATCH` | `/api/usuarios/{userId}` | Fallback update user profile | `src/services/account-service.ts` |
| `PATCH` | `/api/usuarios/{userId}/cambiar-contrasena` | Change password | `src/services/account-service.ts` |
| `PATCH` | `/api/usuarios/{userId}/password` | Fallback password change | `src/services/account-service.ts` |

## Client

| Method | Endpoint | Used for | Source |
| --- | --- | --- | --- |
| `GET` | `/api/locales` | List restaurants/locals | `src/services/client/client-service.ts` |
| `GET` | `/api/locales/platos` | List dishes for clients | `src/services/client/client-service.ts` |
| `GET` | `/api/platos/{id}` | Dish detail | `src/services/client/client-service.ts` |
| `GET` | `/api/clientes/{clientId}/puntos-entrega` | List delivery points | `src/services/client/client-service.ts` |
| `POST` | `/api/clientes/{clientId}/puntos-entrega` | Add delivery point | `src/services/client/client-service.ts` |

Supported query params for `GET /api/locales/platos`:

- `idLocal`
- `precioMin`
- `precioMax`
- `q`
- `conDescuento`
- `orden`
- `sentido`
- `pagina`
- `tamano`

## Local / Restaurant

### Dishes

| Method | Endpoint | Used for | Source |
| --- | --- | --- | --- |
| `GET` | `/api/platos?idLocal={localId}` | List local dishes | `src/services/local-dish-service.ts` |
| `POST` | `/api/platos` | Create dish | `src/services/local-dish-service.ts` |
| `PATCH` | `/api/platos/{dishId}` | Update dish | `src/services/local-dish-service.ts` |
| `DELETE` | `/api/platos/{dishId}` | Delete dish | `src/services/local-dish-service.ts` |
| `PATCH` | `/api/platos/{dishId}/disponibilidad` | Toggle dish availability | `src/services/local-dish-service.ts` |

### Workbench / Orders

| Method | Endpoint | Used for | Source |
| --- | --- | --- | --- |
| `GET` | `/api/local/{localId}/mesa-trabajo` | List local workbench orders | `src/services/local-workbench-service.ts` |
| `PATCH` | `/api/local/{localId}/pedido/{orderId}/confirmar` | Confirm order | `src/services/local-workbench-service.ts` |
| `PATCH` | `/api/local/{localId}/pedido/{orderId}/rechazar` | Reject order | `src/services/local-workbench-service.ts` |

Supported query params for `GET /api/local/{localId}/mesa-trabajo`:

- `orden`
- `sentido`
- `identificador`
- `rangoInicio`
- `rangoFin`

### Planned / Bypassed

These endpoints are documented in TODO comments but are not active yet.

| Method | Endpoint | Used for | Source |
| --- | --- | --- | --- |
| `GET` | `/api/locals/{localId}/schedule` | Future local schedule API | `src/services/local-schedule-service.ts` |
| `GET` | `/api/locals/{localId}/discounts` | Future local discounts API | `src/services/local-discount-service.ts` |

## Gestion / Admin Registration Requests

| Method | Endpoint | Used for | Source |
| --- | --- | --- | --- |
| `GET` | `/api/gestion/solicitudes` | List local registration requests | `src/services/gestion-service.ts` |
| `GET` | `/api/gestion/solicitudes/{id}` | Registration request detail | `src/services/gestion-service.ts` |
| `POST` | `/api/gestion/solicitud-registro` | Submit local registration request | `src/services/gestion-service.ts` |
| `PATCH` | `/api/gestion/solicitudes/{id}/aprobar` | Approve local registration request | `src/services/gestion-service.ts` |
| `PATCH` | `/api/gestion/solicitudes/{id}/rechazar` | Reject local registration request | `src/services/gestion-service.ts` |
| `GET` | `/api/gestion/solicitudes/pendientes` | Commented alternative for pending requests | `src/services/gestion-service.ts` |

## Next.js Internal API Routes

These are frontend-owned routes, not backend endpoints.

| Method | Endpoint | Used for | Source |
| --- | --- | --- | --- |
| `DELETE` | `/api/auth/session` | Clear frontend session cookies | `src/app/api/auth/session/route.ts` |
| `GET` | `/api/auth/session/gestion/solicitud-registro` | Proxy to backend `/api/gestion/solicitud-registro` | `src/app/api/auth/session/gestion/solicitud-registro/route.ts` |
