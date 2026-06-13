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

Respuesta esperada como `ReclamoDto`.

```json
{
  "id": 7,
  "descripcion": "El pedido llego frio y con items faltantes",
  "estado": "PENDIENTE",
  "creacion": "2026-05-22T20:15:00",
  "pedidoId": 15
}
```

## Listar reclamos del local

```http
GET /api/reclamos/local/{idLocal}
```

### Respuesta exitosa

`200 OK`

```json
[
  {
    "id": 7,
    "descripcion": "El pedido llego frio y con items faltantes",
    "estado": "PENDIENTE",
    "creacion": "2026-05-22T20:15:00",
    "pedidoId": 15
  },
  {
    "id": 4,
    "descripcion": "Producto incorrecto entregado",
    "estado": "APROBADO",
    "creacion": "2026-05-18T18:00:00",
    "pedidoId": 11
  }
]
```

Si no hay reclamos, devuelve una lista vacia:

```json
[]
```

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
| `valorVoucher` | `number` | No | Monto del voucher; si se omite usa el valor del pedido |

### Respuesta exitosa

`201 Created`

Devuelve un `VoucherDto`.

```json
{
  "id": 1,
  "codigo": "VCHR-ABC123",
  "descripcion": "Voucher por reclamo aprobado",
  "valor": 350.0,
  "creacion": "2026-05-22T21:00:00",
  "vencimiento": "2026-06-22T21:00:00",
  "reclamoId": 7,
  "pedidoId": 15
}
```

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

```json
{
  "id": 7,
  "descripcion": "El pedido llego frio y con items faltantes",
  "estado": "RECHAZADO",
  "creacion": "2026-05-22T20:15:00",
  "pedidoId": 15
}
```

## Errores comunes

| Codigo | Motivo |
| --- | --- |
| `401` | Sin sesion activa |
| `403` | Rol distinto de `LOCAL` |
| `404` | Reclamo no encontrado |

## Notas para frontend

- Las llamadas deben usar sesion HTTP con credenciales, igual que el resto de servicios del local.
- La pantalla de listado puede cargarse con `GET /api/reclamos/local/{idLocal}`.
- Los estados `APROBADO` y `RECHAZADO` deben bloquear nuevas acciones sobre el reclamo.
- Para aprobar con voucher, el frontend debe permitir ingresar `valorVoucher`.
- Para rechazar, el frontend debe permitir ingresar una `nota`.
- Luego de aprobar o rechazar, conviene refrescar el listado o actualizar el reclamo en memoria.

## Pendientes a confirmar

- El contrato no incluye un endpoint de detalle del reclamo.
- El contrato no incluye la informacion del pedido asociado. La UI actual necesita mostrar datos del pedido para decidir la accion.
- No aparece una accion de "retomar mas tarde"; podria resolverse solo no enviando ninguna accion, pero no queda registro de que el local reviso el caso.
- No hay accion de reembolso directo. El contrato solo permite aprobar con voucher o rechazar.
- Confirmar si `valorVoucher` acepta decimales y moneda, y si tiene minimo/maximo.
- Confirmar si `nota` se persiste y luego se devuelve en algun DTO.

## Referencia backend

| Capa | Archivo |
| --- | --- |
| Controller | `ReclamoController.java` |
| Logica | `ReclamoService.java` |
| Entidades | `Reclamo.java`, `Voucher.java`, `EstadoAprobacion.java` |
| DTOs | `ReclamoDto.java`, `ReclamoRequestDto.java`, `VoucherDto.java` |
