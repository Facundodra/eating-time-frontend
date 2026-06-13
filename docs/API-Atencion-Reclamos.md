# API - Atencion de reclamos y compensaciones

Contrato de integracion para la atencion de reclamos del local.

## Contexto

- Base URL local: `http://localhost:8080`
- Base URL testing: `https://eatingtimebackend-testing-60fe.up.railway.app`
- Content-Type en acciones: `application/json`
- Autenticacion: sesion HTTP activa con rol `LOCAL`

## Resumen de endpoints

| Accion | Metodo | Endpoint |
| --- | --- | --- |
| Listar reclamos del local | `GET` | `/api/reclamos/local/{idLocal}` |
| Obtener detalle del reclamo | `GET` | `/api/reclamos/{id}` |
| Aprobar reclamo y generar voucher | `PATCH` | `/api/reclamos/{id}/aprobar` |
| Rechazar reclamo | `PATCH` | `/api/reclamos/{id}/rechazar` |

## Estados de reclamo

El campo `estado` puede tomar estos valores:

| Estado | Descripcion |
| --- | --- |
| `PENDIENTE` | Reclamo pendiente de atencion |
| `APROBADO` | Reclamo aprobado, con compensacion generada |
| `RECHAZADO` | Reclamo rechazado |

## Modelo de reclamo

Los endpoints `GET /api/reclamos/local/{idLocal}`, `GET /api/reclamos/{id}` y `PATCH /api/reclamos/{id}/rechazar` devuelven `ReclamoDto` con datos del reclamo, cliente, pedido e items del pedido.

Campos principales:

- `id`: identificador del reclamo.
- `descripcion`: detalle ingresado por el cliente.
- `nota`: respuesta guardada al aprobar o rechazar; llega `null` si esta pendiente.
- `estado`: `PENDIENTE`, `APROBADO` o `RECHAZADO`.
- `creacion`: fecha de creacion del reclamo.
- `clienteId`, `clienteNombre`, `clienteEmail`: datos del cliente asociado al pedido.
- `pedidoId`, `pedidoTotal`, `pedidoEstado`, `pedidoCreacion`: resumen del pedido asociado.
- `items`: platos del pedido, con `plato`, `cantidad`, `precioUnitario` y `subtotal`.

Ejemplo:

```json
{
  "id": 7,
  "descripcion": "El pedido llego frio y con items faltantes",
  "nota": null,
  "estado": "PENDIENTE",
  "creacion": "2026-05-22T20:15:00",
  "pedidoId": 15,
  "pedidoTotal": 850.0,
  "pedidoEstado": "FINALIZADO",
  "pedidoCreacion": "2026-05-22T19:00:00",
  "clienteId": 3,
  "clienteNombre": "Juan Perez",
  "clienteEmail": "juan@gmail.com",
  "items": [
    {
      "plato": "Milanesa napolitana",
      "cantidad": 2,
      "precioUnitario": 350.0,
      "subtotal": 700.0
    },
    {
      "plato": "Gaseosa",
      "cantidad": 1,
      "precioUnitario": 150.0,
      "subtotal": 150.0
    }
  ]
}
```

## Listar reclamos del local

```http
GET /api/reclamos/local/{idLocal}
```

### Respuesta exitosa

`200 OK`

Devuelve `ReclamoDto[]`. Si no hay reclamos, devuelve una lista vacia:

```json
[]
```

## Detalle del reclamo

```http
GET /api/reclamos/{id}
```

### Respuesta exitosa

`200 OK`

Devuelve un `ReclamoDto`.

## Aprobar reclamo

```http
PATCH /api/reclamos/{id}/aprobar
```

Aprueba el reclamo y genera un voucher de compensacion para el cliente.

### Body

```json
{
  "nota": "Pedimos disculpas por el inconveniente",
  "valorVoucher": 350.0
}
```

| Campo | Tipo | Obligatorio | Descripcion |
| --- | --- | --- | --- |
| `nota` | `string` | No | Mensaje para el cliente |
| `valorVoucher` | `number` | No | Monto del voucher; si se omite usa el total del pedido |

### Respuesta exitosa

`201 Created`

Devuelve un `VoucherDto`.

## Rechazar reclamo

```http
PATCH /api/reclamos/{id}/rechazar
```

### Body

```json
{
  "nota": "El reclamo no cumple con los criterios establecidos"
}
```

| Campo | Tipo | Obligatorio | Descripcion |
| --- | --- | --- | --- |
| `nota` | `string` | No | Motivo del rechazo |

### Respuesta exitosa

`200 OK`

Devuelve el `ReclamoDto` actualizado.

## Errores comunes

| Codigo | Motivo |
| --- | --- |
| `401` | Sin sesion activa |
| `403` | Rol distinto de `LOCAL` |
| `404` | Reclamo no encontrado |

## Notas para frontend

- Las llamadas deben usar sesion HTTP con credenciales, igual que el resto de servicios del local.
- La pantalla de listado puede cargarse con `GET /api/reclamos/local/{idLocal}`.
- La pantalla de detalle puede cargarse con `GET /api/reclamos/{id}`.
- Los estados `APROBADO` y `RECHAZADO` deben bloquear nuevas acciones sobre el reclamo.
- Para aprobar con voucher, el frontend debe permitir ingresar `valorVoucher`; si queda vacio, backend usa el total del pedido.
- Para rechazar, el frontend debe permitir ingresar una `nota`.
- La `nota` se persiste al aprobar o rechazar y se devuelve en los endpoints.

## Referencia backend

| Capa | Archivo |
| --- | --- |
| Controller | `ReclamoController.java` |
| Logica | `ReclamoService.java` |
| Entidades | `Reclamo.java`, `Voucher.java`, `EstadoAprobacion.java` |
| DTOs | `ReclamoDto.java`, `ItemReclamoDto.java`, `ReclamoRequestDto.java`, `VoucherDto.java` |
