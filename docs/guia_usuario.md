# 👥 Guía de Usuario - Sistema de Gestión de OT

## Introducción

Esta guía está dirigida a los usuarios finales que trabajarán con el sistema de Órdenes de Transferencia: equipos de Abastecimiento, Operaciones y Full.

---

## 🎯 ¿Qué es el Sistema de OT?

El Sistema de Gestión de Órdenes de Transferencia es una herramienta automatizada que:

- ✅ Registra y hace seguimiento de órdenes de transferencia
- ✅ Valida cantidades en cada etapa del proceso
- ✅ Genera alertas automáticas cuando hay diferencias
- ✅ Mantiene un historial completo de cada orden

---

## 👥 Roles y Responsabilidades

### 🔵 Área de Abastecimiento

**Responsabilidad**: Crear y registrar Órdenes de Transferencia (OT)

**Tareas**:
1. Registrar nuevas OT en Google Sheets (pestaña OT)
2. Especificar cantidades solicitadas
3. Definir fechas de transferencia comprometida
4. Revisar alertas de diferencias en preparación

### 🟢 Área de Operaciones

**Responsabilidad**: Preparar órdenes y registrar detalle

**Tareas**:
1. Registrar preparación en Google Sheets (pestaña OTA)
2. Registrar detalle por EAN (pestaña OTADET)
3. Revisar alertas de diferencias
4. Coordinar ajustes con Abastecimiento

### 🟣 Área de Full

**Responsabilidad**: Recepcionar órdenes

**Tareas**:
1. Registrar recepción en Google Sheets (pestaña OTF)
2. Revisar alertas de diferencias en recepción
3. Documentar novedades (productos dañados, faltantes, etc.)
4. Coordinar resolución de novedades

---

## 📊 Cómo Usar Google Sheets

### Pestaña OT (Abastecimiento)

#### Paso 1: Abrir el Google Sheet

1. Acceder al link compartido por el equipo de IT
2. Ir a la pestaña **OT**

#### Paso 2: Registrar Nueva OT

| Columna | Qué Ingresar | Ejemplo |
|---------|--------------|---------|
| `id_ot` | Código único de la OT | OT-2024-001 |
| `fecha_solicitud` | Fecha de hoy | 22/11/2024 |
| `fecha_transferencia_comprometida` | Fecha de entrega esperada | 27/11/2024 |
| `sku` | Código del producto | SKU001 |
| `mlc` | Código MercadoLibre (opcional) | MLC123456 |
| `cantidad_solicitada` | Cantidad que necesitas | 100 |
| `procesado` | **NO TOCAR** (lo marca el sistema) | ☐ |

#### Ejemplo de Registro

```
id_ot       | fecha_solicitud | fecha_transferencia_comprometida | sku    | mlc       | cantidad_solicitada | procesado
OT-2024-001 | 22/11/2024     | 27/11/2024                       | SKU001 | MLC123456 | 100                 | ☐
OT-2024-001 | 22/11/2024     | 27/11/2024                       | SKU002 | MLC123457 | 50                  | ☐
```

**Importante**:
- ✅ Una OT puede tener múltiples SKU (una fila por SKU)
- ✅ El `id_ot` debe ser el mismo para todos los SKU de una orden
- ✅ No modificar la columna `procesado`

---

### Pestaña OTA (Operaciones)

#### Paso 1: Verificar OT Existente

Antes de registrar OTA, verificar que la OT exista en la pestaña OT.

#### Paso 2: Registrar Preparación

| Columna | Qué Ingresar | Ejemplo |
|---------|--------------|---------|
| `id_ot` | Mismo ID de la OT | OT-2024-001 |
| `fecha_preparacion` | Fecha de hoy | 23/11/2024 |
| `sku` | Mismo SKU de la OT | SKU001 |
| `cantidad_preparada` | Cantidad real preparada | 98 |
| `procesado` | **NO TOCAR** | ☐ |

#### Ejemplo de Registro

```
id_ot       | fecha_preparacion | sku    | cantidad_preparada | procesado
OT-2024-001 | 23/11/2024       | SKU001 | 98                 | ☐
OT-2024-001 | 23/11/2024       | SKU002 | 50                 | ☐
```

**Importante**:
- ⚠️ Si la cantidad preparada difiere más del 2% de la solicitada, recibirás una alerta por email
- ✅ Registrar la cantidad real, aunque sea diferente a la solicitada

---

### Pestaña OTADET (Operaciones)

#### Paso 1: Escanear Productos

Al preparar, escanear cada código EAN.

#### Paso 2: Registrar Detalle por EAN

| Columna | Qué Ingresar | Ejemplo |
|---------|--------------|---------|
| `id_ot` | ID de la OT | OT-2024-001 |
| `sku` | SKU del producto | SKU001 |
| `ean` | Código de barras escaneado | 7891234567890 |
| `cantidad_preparada_ean` | Cantidad de ese EAN | 60 |
| `procesado` | **NO TOCAR** | ☐ |

#### Ejemplo de Registro

```
id_ot       | sku    | ean           | cantidad_preparada_ean | procesado
OT-2024-001 | SKU001 | 7891234567890 | 60                     | ☐
OT-2024-001 | SKU001 | 7891234567891 | 38                     | ☐
```

**Importante**:
- ✅ Un SKU puede tener múltiples EAN (variantes del mismo producto)
- ✅ La suma de `cantidad_preparada_ean` debe coincidir con `cantidad_preparada` en OTA
- ⚠️ Si hay EAN que no están en el catálogo, recibirás una alerta

---

### Pestaña OTF (Full)

#### Paso 1: Verificar OTA Existente

Antes de registrar OTF, verificar que la OTA exista.

#### Paso 2: Registrar Recepción

| Columna | Qué Ingresar | Ejemplo |
|---------|--------------|---------|
| `id_ot` | ID de la OT | OT-2024-001 |
| `fecha_recepcion` | Fecha de hoy | 24/11/2024 |
| `sku` | SKU del producto | SKU001 |
| `cantidad_recepcionada` | Cantidad real recibida | 95 |
| `procesado` | **NO TOCAR** | ☐ |

#### Ejemplo de Registro

```
id_ot       | fecha_recepcion | sku    | cantidad_recepcionada | procesado
OT-2024-001 | 24/11/2024     | SKU001 | 95                    | ☐
OT-2024-001 | 24/11/2024     | SKU002 | 50                    | ☐
```

**Importante**:
- ⚠️ Si la cantidad recepcionada difiere más del 5% de la preparada, recibirás una alerta
- ✅ Documentar cualquier novedad (productos dañados, faltantes, etc.)

---

## 📧 Alertas por Email

### Tipos de Alertas

#### 🟡 Alerta: Diferencia OT vs OTA

**Cuándo se genera**: Cuando la diferencia entre solicitado y preparado supera el 2%

**Qué hacer**:
1. Revisar el email con los detalles
2. Verificar si la diferencia es correcta
3. Coordinar con Abastecimiento si se necesita ajuste
4. Si es correcto, continuar con el proceso

**Ejemplo**:
```
OT-2024-001 | SKU001
Solicitado: 100
Preparado: 90
Diferencia: 10% (10 unidades)
```

---

#### 🟠 Alerta: Inconsistencia OTADET vs PIM

**Cuándo se genera**: Cuando hay EAN que no coinciden con el catálogo

**Qué hacer**:
1. Revisar el email con los EAN problemáticos
2. **EAN Faltantes**: Verificar si fueron escaneados. Agregar si falta.
3. **EAN Sobrantes**: Verificar si el código es correcto. Contactar IT si es un producto nuevo.

**Ejemplo**:
```
OT-2024-001 | SKU001
EAN Faltantes: 7891234567890
EAN Sobrantes: 7891234567999
```

---

#### 🔴 Alerta: Diferencia OTA vs OTF

**Cuándo se genera**: Cuando la diferencia entre preparado y recepcionado supera el 5%

**Qué hacer**:
1. Revisar el email con los detalles
2. Verificar físicamente los productos
3. Documentar si hay productos dañados o faltantes
4. Coordinar con Operaciones y Abastecimiento
5. Registrar la resolución de la novedad

**Ejemplo**:
```
OT-2024-001 | SKU001
Preparado: 100
Recepcionado: 90
Diferencia: 10% (10 unidades faltantes)
Posible causa: Daño en tránsito
```

---

## ❓ Preguntas Frecuentes (FAQ)

### ¿Qué hago si me equivoco al registrar datos?

**Respuesta**: Simplemente corrige el dato en Google Sheets. El sistema procesará la corrección en la próxima ejecución (cada 10 minutos).

---

### ¿Por qué la columna "procesado" no se marca?

**Respuesta**: El sistema marca automáticamente cada 10 minutos. Si después de 15 minutos no se marca:
1. Verificar que los datos estén completos
2. Contactar al equipo de IT

---

### ¿Puedo eliminar filas del Google Sheet?

**Respuesta**: ❌ NO. Los datos ya procesados no deben eliminarse. Si hay un error, contactar al equipo de IT.

---

### ¿Qué hago si recibo una alerta incorrecta?

**Respuesta**:
1. Verificar los datos en Google Sheets
2. Si los datos son correctos, la alerta es válida
3. Si hay un error en el sistema, contactar IT

---

### ¿Cómo sé en qué estado está una OT?

**Respuesta**: Contactar al equipo de IT para acceso al dashboard de Supabase, donde se puede ver el estado en tiempo real.

---

### ¿Puedo registrar OTA antes de que se procese la OT?

**Respuesta**: ⚠️ No es recomendable. Esperar a que la OT esté marcada como procesada (columna `procesado` = ☑).

---

## 📞 Contacto y Soporte

### Soporte Técnico

- **Email**: it@empresa.com
- **Horario**: Lunes a Viernes, 9:00 - 18:00

### Soporte Operativo

- **Abastecimiento**: abastecimiento@empresa.com
- **Operaciones**: operaciones@empresa.com
- **Full**: full@empresa.com

---

## 📚 Recursos Adicionales

- [Guía Técnica](guia_tecnica.md) - Para desarrolladores
- [Troubleshooting](troubleshooting.md) - Solución de problemas
- [Mejores Prácticas](mejores_practicas.md) - Tips y recomendaciones

---

**Versión**: 1.0.0  
**Última actualización**: Noviembre 2024  
**Dirigido a**: Usuarios finales (Abastecimiento, Operaciones, Full)

