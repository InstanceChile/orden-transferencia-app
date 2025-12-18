# 📊 Plantillas de Google Sheets

## Descripción General

Este directorio contiene las plantillas de Google Sheets necesarias para el sistema de gestión de Órdenes de Transferencia.

---

## 📋 Plantilla Principal: OT Completa

### Estructura del Google Sheet

El Google Sheet principal debe tener **4 pestañas** con la siguiente estructura:

---

### 🔹 Pestaña 1: OT (Orden de Transferencia - Solicitud)

**Propósito**: Registro de solicitudes de transferencia por parte de Abastecimiento

**Columnas obligatorias**:

| Columna | Tipo | Descripción | Ejemplo |
|---------|------|-------------|---------|
| `id_ot` | Texto | Identificador único de la OT | OT-2024-001 |
| `fecha_solicitud` | Fecha | Fecha en que se solicita la OT | 2024-11-20 |
| `fecha_transferencia_comprometida` | Fecha | Fecha comprometida de entrega | 2024-11-25 |
| `sku` | Texto | Código SKU del producto | SKU001 |
| `mlc` | Texto | Código MercadoLibre (opcional) | MLC123456 |
| `cantidad_solicitada` | Número | Cantidad solicitada | 100 |
| `procesado` | Checkbox | Marca si fue procesado por n8n | ☑ |

**Formato de ejemplo**:

```
id_ot         | fecha_solicitud | fecha_transferencia_comprometida | sku    | mlc       | cantidad_solicitada | procesado
OT-2024-001   | 2024-11-20     | 2024-11-25                       | SKU001 | MLC123456 | 100                 | ☐
OT-2024-001   | 2024-11-20     | 2024-11-25                       | SKU002 | MLC123457 | 50                  | ☐
OT-2024-002   | 2024-11-21     | 2024-11-26                       | SKU003 | MLC123458 | 200                 | ☐
```

**Validaciones recomendadas**:
- `id_ot`: No vacío
- `sku`: No vacío
- `cantidad_solicitada`: Mayor a 0
- `fecha_transferencia_comprometida`: Mayor o igual a `fecha_solicitud`

---

### 🔹 Pestaña 2: OTA (Orden de Transferencia Activa - Preparación)

**Propósito**: Registro de preparación de OT por parte de Operaciones

**Columnas obligatorias**:

| Columna | Tipo | Descripción | Ejemplo |
|---------|------|-------------|---------|
| `id_ot` | Texto | Identificador único de la OT | OT-2024-001 |
| `fecha_preparacion` | Fecha | Fecha en que se preparó | 2024-11-22 |
| `sku` | Texto | Código SKU del producto | SKU001 |
| `cantidad_preparada` | Número | Cantidad preparada | 98 |
| `procesado` | Checkbox | Marca si fue procesado por n8n | ☑ |

**Formato de ejemplo**:

```
id_ot         | fecha_preparacion | sku    | cantidad_preparada | procesado
OT-2024-001   | 2024-11-22       | SKU001 | 98                 | ☐
OT-2024-001   | 2024-11-22       | SKU002 | 50                 | ☐
OT-2024-002   | 2024-11-23       | SKU003 | 200                | ☐
```

**Validaciones recomendadas**:
- `id_ot`: Debe existir en pestaña OT
- `sku`: Debe existir en pestaña OT para ese `id_ot`
- `cantidad_preparada`: Mayor o igual a 0
- `fecha_preparacion`: Mayor o igual a `fecha_solicitud` de OT

---

### 🔹 Pestaña 3: OTADET (Detalle de OTA por EAN)

**Propósito**: Registro detallado de preparación por código EAN

**Columnas obligatorias**:

| Columna | Tipo | Descripción | Ejemplo |
|---------|------|-------------|---------|
| `id_ot` | Texto | Identificador único de la OT | OT-2024-001 |
| `sku` | Texto | Código SKU del producto | SKU001 |
| `ean` | Texto | Código de barras EAN | 7891234567890 |
| `cantidad_preparada_ean` | Número | Cantidad preparada de este EAN | 60 |
| `procesado` | Checkbox | Marca si fue procesado por n8n | ☑ |

**Formato de ejemplo**:

```
id_ot         | sku    | ean           | cantidad_preparada_ean | procesado
OT-2024-001   | SKU001 | 7891234567890 | 60                     | ☐
OT-2024-001   | SKU001 | 7891234567891 | 38                     | ☐
OT-2024-002   | SKU003 | 7891234567893 | 200                    | ☐
```

**Validaciones recomendadas**:
- `id_ot` + `sku`: Debe existir en pestaña OTA
- `ean`: Debe ser código válido (13 dígitos)
- `cantidad_preparada_ean`: Mayor a 0
- Suma de `cantidad_preparada_ean` por `id_ot` + `sku` debe coincidir con `cantidad_preparada` en OTA

---

### 🔹 Pestaña 4: OTF (Orden de Transferencia Full - Recepción)

**Propósito**: Registro de recepción en Full

**Columnas obligatorias**:

| Columna | Tipo | Descripción | Ejemplo |
|---------|------|-------------|---------|
| `id_ot` | Texto | Identificador único de la OT | OT-2024-001 |
| `fecha_recepcion` | Fecha | Fecha en que se recepcionó | 2024-11-24 |
| `sku` | Texto | Código SKU del producto | SKU001 |
| `cantidad_recepcionada` | Número | Cantidad recepcionada | 95 |
| `procesado` | Checkbox | Marca si fue procesado por n8n | ☑ |

**Formato de ejemplo**:

```
id_ot         | fecha_recepcion | sku    | cantidad_recepcionada | procesado
OT-2024-001   | 2024-11-24     | SKU001 | 95                    | ☐
OT-2024-001   | 2024-11-24     | SKU002 | 50                    | ☐
OT-2024-002   | 2024-11-25     | SKU003 | 198                   | ☐
```

**Validaciones recomendadas**:
- `id_ot` + `sku`: Debe existir en pestaña OTA
- `cantidad_recepcionada`: Mayor o igual a 0
- `fecha_recepcion`: Mayor o igual a `fecha_preparacion` de OTA

---

## 🎨 Formato y Estilo Recomendado

### Colores de Encabezados

- **OT**: Azul claro (`#4A86E8`)
- **OTA**: Verde claro (`#6AA84F`)
- **OTADET**: Naranja claro (`#F6B26B`)
- **OTF**: Morado claro (`#8E7CC3`)

### Formato de Celdas

- **Fechas**: Formato `YYYY-MM-DD` o `DD/MM/YYYY`
- **Números**: Sin decimales para cantidades enteras
- **Texto**: Mayúsculas para códigos (OT, SKU, EAN)

### Protección de Hojas

Recomendamos proteger las columnas `procesado` para que solo n8n pueda modificarlas (o usar Apps Script).

---

## 🔧 Configuración en Google Sheets

### 1. Crear el Google Sheet

1. Ve a [Google Sheets](https://sheets.google.com)
2. Crea un nuevo documento
3. Nómbralo: `Sistema OT - [Nombre Empresa]`

### 2. Crear las 4 Pestañas

Renombra las pestañas con estos nombres exactos:
- `OT`
- `OTA`
- `OTADET`
- `OTF`

### 3. Agregar Encabezados

Copia los encabezados de cada sección en la fila 1 de cada pestaña.

### 4. Aplicar Validaciones (Opcional pero Recomendado)

#### Validación de Fechas

```
Seleccionar columna de fecha → Datos → Validación de datos
- Criterio: Es una fecha válida
- Mostrar advertencia si los datos no son válidos
```

#### Validación de Números

```
Seleccionar columna de cantidad → Datos → Validación de datos
- Criterio: Número → Mayor o igual a → 0
- Rechazar entrada si los datos no son válidos
```

#### Validación de Checkbox

```
Seleccionar columna procesado → Datos → Validación de datos
- Criterio: Casilla de verificación
```

### 5. Formato Condicional (Opcional)

#### Resaltar filas procesadas

```
Seleccionar rango de datos → Formato → Formato condicional
- Formato de celdas si: La fórmula personalizada es
- Fórmula: =$G2=TRUE (ajustar columna según posición de "procesado")
- Formato: Fondo gris claro (#F3F3F3)
```

### 6. Compartir el Sheet

1. Clic en **Compartir** (esquina superior derecha)
2. Agregar usuarios con permisos de **Editor**:
   - Equipo de Abastecimiento (OT)
   - Equipo de Operaciones (OTA, OTADET, OTF)
3. Copiar el **ID del Google Sheet** (está en la URL):
   ```
   https://docs.google.com/spreadsheets/d/[ESTE_ES_EL_ID]/edit
   ```

---

## 🔗 Integración con n8n

### Configurar Credenciales de Google Sheets en n8n

1. En n8n, ir a **Credentials** → **New**
2. Seleccionar **Google Sheets OAuth2**
3. Seguir el flujo de autenticación
4. Guardar credencial con nombre: `Google Sheets - Sistema OT`

### Configurar ID del Sheet en n8n

En cada workflow de n8n, actualizar el nodo de Google Sheets con:
- **Credential**: `Google Sheets - Sistema OT`
- **Document ID**: `[TU_SHEET_ID]`
- **Sheet Name**: `OT`, `OTA`, `OTADET` o `OTF` según corresponda

---

## 📋 Plantilla de Gestión de Novedades

### Pestaña: Novedades

**Propósito**: Gestión y resolución de novedades detectadas

**Columnas**:

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id_alerta` | Texto | UUID de la alerta (desde Supabase) |
| `id_ot` | Texto | Identificador de la OT |
| `sku` | Texto | SKU afectado |
| `tipo_novedad` | Lista | Diferencia_OT_OTA / Inconsistencia_OTADET_PIM / Diferencia_OTA_OTF |
| `descripcion` | Texto | Descripción de la novedad |
| `estado` | Lista | Pendiente / En_Revision / Resuelta / Descartada |
| `fecha_deteccion` | Fecha | Fecha en que se detectó |
| `asignado_a` | Texto | Persona responsable |
| `notas_resolucion` | Texto | Notas sobre la resolución |
| `fecha_resolucion` | Fecha | Fecha en que se resolvió |

---

## 🧪 Datos de Prueba

Para probar el sistema, puedes usar estos datos de ejemplo:

### OT de Prueba

```
id_ot       | fecha_solicitud | fecha_transferencia_comprometida | sku      | mlc       | cantidad_solicitada
TEST-001    | 2024-11-22     | 2024-11-27                       | SKU001   | MLC999001 | 100
TEST-001    | 2024-11-22     | 2024-11-27                       | SKU002   | MLC999002 | 50
```

### OTA de Prueba

```
id_ot       | fecha_preparacion | sku      | cantidad_preparada
TEST-001    | 2024-11-23       | SKU001   | 98
TEST-001    | 2024-11-23       | SKU002   | 50
```

---

## 📞 Soporte

Si tienes problemas con las plantillas:

1. Verifica que los nombres de las pestañas sean exactos (mayúsculas/minúsculas)
2. Verifica que los nombres de las columnas sean exactos
3. Revisa los logs de n8n para ver errores específicos
4. Consulta la documentación técnica en `/docs/guia_tecnica.md`

---

**Versión**: 1.0.0  
**Última actualización**: Noviembre 2024

