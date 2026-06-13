# API - Gestion de cupones

Contrato de integracion para la gestion de cupones del local.

## Contexto

- Base URL local: `http://localhost:8080`
- Base URL testing: `https://eatingtimebackend-testing-60fe.up.railway.app`
- Content-Type: `application/json`
- Autenticacion: sesion HTTP activa con rol `LOCAL`
- La baja es logica: los cupones eliminados tienen fecha de eliminacion y no vuelven en el listado.

## Resumen de endpoints

| Accion | Metodo | Endpoint |
| --- | --- | --- |
| Listar cupones del local | `GET` | `/api/cupones/local/{idLocal}` |
| Crear cupon | `POST` | `/api/cupones` |
| Modificar cupon | `PATCH` | `/api/cupones/{id}` |
| Eliminar cupon | `DELETE` | `/api/cupones/{id}` |

## Modelo de cupon

Respuesta esperada como `CuponDto`.

```json
{
  "id": 1,
  "codigo": "VERANO20",
  "descripcion": "Descuento de verano",
  "porcentaje": 20,
  "estado": true,
  "creacion": "2026-05-10T10:00:00",
  "vencimiento": "2026-08-31T23:59:00",
  "eliminacion": null,
  "localId": 3,
  "platos": [
    {
      "id": 5,
      "nombre": "Milanesa napolitana"
    },
    {
      "id": 6,
      "nombre": "Milanesa con papas"
    }
  ]
}
```

## Listar cupones del local

```http
GET /api/cupones/local/{idLocal}
```

Devuelve solo cupones no eliminados, es decir, con `eliminacion IS NULL`.

### Respuesta exitosa

`200 OK`

```json
[
  {
    "id": 1,
    "codigo": "VERANO20",
    "descripcion": "Descuento de verano",
    "porcentaje": 20,
    "estado": true,
    "creacion": "2026-05-10T10:00:00",
    "vencimiento": "2026-08-31T23:59:00",
    "eliminacion": null,
    "localId": 3,
    "platos": [
      {
        "id": 5,
        "nombre": "Milanesa napolitana"
      },
      {
        "id": 6,
        "nombre": "Milanesa con papas"
      }
    ]
  }
]
```

Si no hay cupones activos, devuelve una lista vacia:

```json
[]
```

## Crear cupon

```http
POST /api/cupones
```

### Body

```json
{
  "codigo": "VERANO20",
  "descripcion": "Descuento de verano",
  "porcentaje": 20,
  "vencimiento": "2026-08-31T23:59:00",
  "idPlatos": [1, 2, 3]
}
```

| Campo | Tipo | Obligatorio | Descripcion |
| --- | --- | --- | --- |
| `codigo` | `string` | Si | Codigo unico del cupon |
| `descripcion` | `string` | No | Descripcion visible para el cliente |
| `porcentaje` | `number` | Si | Entero entre 1 y 100 |
| `vencimiento` | `string` | Si | Fecha futura en formato ISO-8601 |
| `idPlatos` | `number[]` | No | Platos a los que aplica el cupon |

### Respuesta exitosa

`201 Created`

Devuelve un `CuponDto`.

### Errores

| Codigo | Motivo |
| --- | --- |
| `400` | `vencimiento` nulo o pasado; `porcentaje` fuera de rango |
| `404` | Algun plato enviado en `idPlatos` no existe |
| `409` | Ya existe un cupon con ese `codigo` |

## Modificar cupon

```http
PATCH /api/cupones/{id}
```

Usa el mismo body que el `POST`.

Solo se actualizan los campos enviados, excepto `idPlatos`: si se envia, reemplaza la lista completa de platos asociados.

### Respuesta exitosa

`200 OK`

Devuelve un `CuponDto`.

### Errores

Mismas reglas que la creacion:

| Codigo | Motivo |
| --- | --- |
| `400` | `vencimiento` nulo o pasado; `porcentaje` fuera de rango |
| `404` | El cupon no existe o algun plato enviado en `idPlatos` no existe |
| `409` | Ya existe otro cupon con ese `codigo` |

## Eliminar cupon

```http
DELETE /api/cupones/{id}
```

Realiza baja logica seteando `eliminacion = now()`. Luego el cupon no aparece mas en el listado.

### Respuesta exitosa

`200 OK`

```json
{
  "mensaje": "Cupon eliminado correctamente"
}
```

### Errores

| Codigo | Motivo |
| --- | --- |
| `404` | El cupon no existe |

## Notas para frontend

- Las llamadas deben usar sesion HTTP con credenciales, igual que el resto de servicios del local.
- El formulario puede seguir la misma estrategia que descuentos: editar una copia local, persistir al guardar y descartar cambios al cambiar de seleccion.
- Al modificar platos asociados, el frontend debe enviar la lista completa de `idPlatos` para reemplazar la asociacion.
- El `GET /api/cupones/local/{idLocal}` devuelve los platos asociados en `platos`, con el mismo criterio que descuentos.
- Si `DELETE` devuelve `200 OK`, el frontend puede quitar el cupon del listado localmente y luego refrescar desde backend.

## Pendientes a confirmar

- Confirmar si `estado` se puede modificar con `PATCH` y cual es el nombre exacto esperado en el body.
- Confirmar si el codigo del cupon debe normalizarse en backend, por ejemplo mayusculas y trim, o si debe hacerlo el frontend.

## Referencia backend

| Capa | Archivo |
| --- | --- |
| Controller | `CuponController.java` |
| Logica | `CuponService.java` |
| Repositorio | `CuponRepository.java` |
| DTOs | `CuponDto.java`, `CuponRequestDto.java` |

Documento relacionado: `3_7-Gestion_Descuentos.md`.
