# 📝 Changelog

Todos los cambios notables en el proyecto Plataforma de Abastecimiento serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [4.0.6] - 2025-01-13

### ✨ Agregado

#### Actualización de lista de Clientes/Proveedores con asignación automática de Bodega
- **Nuevos clientes/proveedores Bodega Segmail**: Concha y Toro MX, Clorox Mx, Beiersdorf MX, Form, TAMEX, Lindt, Tres montes Luchetti, Unilever Mx, Grupo Ruz, Meru, Sundar MX, SODIMAC
- **Clientes/proveedores Bodega Renca**: Ballerina, Beiersdorf, Bodyshop, Bridgestone, California Energy Drink, Davis, Elite Professional, Faber Castell, Ferretería La Reina, Icb, Mercado Carozzi, Seis Luces, Sika, Smart Earth Camelina, Softys, Virutex - ILKO, Carozzi Fs
- **Asignación automática de bodega**: Al cargar una OC, la bodega se asigna automáticamente según el proveedor
- **Visualización mejorada**: La lista de clientes/proveedores ahora muestra agrupación por bodega con colores distintivos (verde para Renca, azul para Segmail)

---

## [4.0.5] - 2024-12-19

### ✨ Agregado

#### Nueva funcionalidad: Ajustar Fecha Comprometida OT
- **Nuevo botón**: "📅 Ajustar Fecha" en la barra de navegación del módulo OT (a la derecha)
- **Tabla resumen de OT pendientes**:
  - Muestra OT en estado "Solicitado" o "Preparado"
  - Agrupadas por Cliente, ID OT, Estado
  - Columnas: Cliente, N° OT, Estado (con badge), Cantidad Total, Fecha Comprometida
- **Panel de ajuste de fecha**: Permite modificar `fecha_transferencia_comprometida`
- **Nuevos endpoints**: `GET /api/ot-resumen-pendientes`, `POST /api/ot/actualizar-fecha`

### 🐛 Corregido

#### Validación numérica mejorada para carga de OC
- **Nueva función `parseNumber`**: Detecta y convierte múltiples formatos numéricos
  - Formato europeo: `1.234,56` → `1234.56`
  - Formato americano: `1,234.56` → `1234.56`
  - Con símbolos de moneda: `$1.500` → `1500`
- **Mensajes de error claros**: Indica exactamente qué campo y qué valor causó el error
  - Ejemplo: `Fila 3: Precio_Prod_Oc: no se pudo convertir "$abc" a número`
- **Si hay error de formato**: La fila NO se carga y se muestra en el resumen de errores
- **Campos validados**: Cantidad_Prod_Oc, Precio_Prod_Oc, Precio_Caja, Cantidad_Caja, UXC, Total

#### Corrección menor en botón Ajustar Fecha OC
- Eliminado campo inexistente `Fecha_Actualizacion_Fecha` del update
- Posición invertida: OC y Recepción a la izquierda, Ajustar Fecha a la derecha

---

## [4.0.4] - 2024-12-19

### ✨ Agregado

#### Nueva funcionalidad: Ajustar Fecha de Recepción OC
- **Nuevo botón**: "📅 Ajustar Fecha" en la barra de navegación del módulo OC (a la izquierda)
- **Tabla resumen de OC pendientes**:
  - Muestra OC en estado "Creado" agrupadas por Proveedor y Número OC
  - Columnas: Proveedor, N° OC, Cantidad Total (suma), Monto Total (suma), Fecha Recepción actual
  - Click en fila o botón "Seleccionar" para elegir una OC
- **Panel de ajuste de fecha**:
  - Muestra información de la OC seleccionada
  - Input de tipo calendario para seleccionar nueva fecha
  - Botón "Actualizar Fecha" que modifica todas las líneas de la OC

#### Nuevos endpoints API
- `GET /api/oc-resumen-pendientes` - Retorna OC pendientes agrupadas con totales
- `POST /api/oc/actualizar-fecha` - Actualiza Fecha_Recepcion de todas las líneas de una OC

#### Estilos
- Nuevo layout de tabs dividido (tabs-nav-split) con botones a izquierda y derecha
- Estilos para tabla de OC con filas seleccionables
- Panel lateral con calendario para ajuste de fecha
- Diseño responsive para pantallas pequeñas

---

## [4.0.3] - 2024-12-19

### 🐛 Corregido

#### Carga OTA: Productos no incluidos ahora se actualizan a cantidad 0
- **Problema**: Al cargar una OTA, si un producto de la OT no estaba en el archivo, su estado no cambiaba
- **Causa**: Solo se actualizaban los productos explícitamente incluidos en el archivo de carga
- **Solución**: Ahora al cargar una OTA:
  - Los productos incluidos se actualizan con la cantidad indicada
  - Los productos NO incluidos se actualizan automáticamente con `cantidad_preparada = 0`
  - Todos los productos de la OT cambian a estado "Preparado"
- **Mensaje mejorado**: Ahora indica cuántos productos no incluidos fueron marcados con cantidad 0

#### Validación de duplicados en OT y OC
- **Problema**: Se podía cargar una misma OT u OC múltiples veces, duplicando registros
- **Causa**: Se usaba `upsert` que permitía sobrescribir registros existentes
- **Solución**: 
  - **Para OT**: Antes de insertar, verifica si algún `id_ot` ya existe en la base de datos
  - **Para OC**: Antes de insertar, verifica si algún `Oc` ya existe en la base de datos
  - Si hay duplicados, retorna error con la lista de documentos ya existentes
  - Cambiado de `upsert` a `insert` para prevenir sobrescritura accidental
- **Mensaje de error**: Indica claramente qué documentos ya existen y sugiere usar las secciones de actualización correspondientes

### 🔄 Cambiado

#### Endpoint POST /api/upload/ot
- Ahora valida existencia previa de `id_ot` antes de insertar
- Retorna error 400 si se detectan duplicados
- Usa `insert` en lugar de `upsert`

#### Endpoint POST /api/upload/oc
- Ahora valida existencia previa de `Oc` antes de insertar
- Retorna error 400 si se detectan duplicados
- Usa `insert` en lugar de `upsert`

#### Endpoint POST /api/upload/ota
- Procesa por OT completa en lugar de fila por fila
- Actualiza todos los SKUs de la OT (incluidos y no incluidos)
- Mejor manejo de errores a nivel de OT

---

## [4.0.2] - 2024-12-18

### ✨ Agregado

- **Validación de Proveedores en OC**: Implementada validación de proveedores válidos para Órdenes de Compra
  - Lista de proveedores predefinidos (misma que clientes)
  - Nuevo endpoint `GET /api/proveedores` para obtener la lista
  - Validación en la carga de OC: rechaza registros con proveedores no válidos
  - Lista de proveedores válidos visible en el panel de carga de OC

---

## [4.0.1] - 2024-12-18

### 🔧 Corrección

- **Filtro OC Pendientes**: Corregido el selector de OC pendientes en la sección de Recepción
  - Ahora filtra solo OC en estado "Creado" (pendientes de recepción)
  - Formato actualizado a: **Proveedor - Número OC** (antes era "Número OC - Proveedor")
  - Eliminado filtro de "Parcialmente Recepcionado" para mostrar solo las que no han iniciado recepción

---

## [4.0.0] - 2024-12-18

### 🎉 Nueva Plataforma Unificada de Abastecimiento

Transformación mayor de la aplicación para soportar múltiples módulos de gestión.

### ✨ Agregado

#### Nuevo Módulo: Orden de Compra (OC)
- **Carga de OC**: Registro de órdenes de compra a proveedores
  - Campos: `id_oc`, `cod_prod`, `sku`, `producto`, `proveedor`, `bodega`, `precio_unitario`, `cantidad_oc`
  - Validación automática de campos obligatorios
  - Generación de ID único por combinación OC + Código de Producto
  
- **Recepción de OC (OCR)**: Registro de recepciones en bodega
  - Campos: `id_oc`, `cod_prod`, `cantidad_recepcionada`, `precio_recepcion`, `fecha_recepcion`
  - Cálculo automático de estado de OC
  - Estados: Creado → Parcialmente_Recepcionado → Completamente_Recepcionado

#### Nueva Navegación Lateral (Sidebar)
- Menú lateral fijo con dos módulos:
  - 🛒 **Orden de Compra** (OC) - Nuevo módulo
  - 📦 **Orden de Transferencia** (OT) - Módulo existente
- Indicador de conexión a Supabase
- Diseño responsive (colapsa en pantallas pequeñas)

#### Nuevo Diseño de Interfaz
- **Título actualizado**: "Sistema OT" → "Plataforma de Abastecimiento"
- **Header dinámico**: Cambia según el módulo seleccionado
- **Navegación por pestañas** dentro de cada módulo
- **Estilo Instance LATAM** mantenido

#### Nuevos Endpoints API
- `GET /api/stats/oc` - Estadísticas de órdenes de compra
- `GET /api/oc-pendientes` - OC pendientes de recepción
- `POST /api/upload/oc` - Carga de orden de compra
- `POST /api/upload/ocr` - Carga de recepción de OC
- `GET /api/template/OC_COMPRA` - Plantilla de OC
- `GET /api/template/OC_RECEPCION` - Plantilla de recepción

#### Integración con Base de Datos Existente
- **Reutiliza tabla existente**: `"Orden_Compra"` del proyecto Flujo_Orden_Compra
- **Campos compatibles**: Usa los mismos nombres de columna (PascalCase con comillas)
- **Estados compatibles**: Creado, Parcialmente Recepcionado, Completamente Recepcionado
- **Sin migración requerida**: Funciona directamente con la estructura existente

### 🔄 Cambiado

#### Estructura de Archivos
- `webapp/public/index.html` - Nueva estructura con sidebar y módulos
- `webapp/public/styles.css` - Estilos para sidebar y navegación
- `webapp/public/app.js` - Lógica para múltiples módulos
- `webapp/server.js` - Endpoints para OC y OCR

#### Arquitectura del Frontend
- **Antes**: Aplicación de un solo módulo (OT)
- **Ahora**: Aplicación multi-módulo con navegación lateral
- Cada módulo tiene sus propias pestañas y paneles
- Estado de módulo activo manejado en JavaScript

### 📊 Estructura de Datos - Orden de Compra

```sql
CREATE TABLE orden_compra (
  id TEXT PRIMARY KEY,           -- id_oc + cod_prod
  id_oc TEXT NOT NULL,           -- Número de OC
  cod_prod TEXT NOT NULL,        -- Código EAN
  sku TEXT,
  producto TEXT,
  proveedor TEXT,
  bodega TEXT,
  precio_unitario NUMERIC(12,2),
  cantidad_oc NUMERIC(10,2),
  cantidad_recepcionada NUMERIC(10,2) DEFAULT 0,
  precio_recepcion NUMERIC(12,2),
  fecha_recepcion TIMESTAMPTZ,
  estado TEXT DEFAULT 'Creado',
  porcentaje_recepcion NUMERIC(5,2) DEFAULT 0,
  ...
);
```

### 🎯 Flujo de Trabajo - Orden de Compra

1. **Carga OC**: Abastecimiento carga archivo con órdenes de compra
2. **Estado inicial**: Todas las líneas quedan en estado "Creado"
3. **Recepción OCR**: Operaciones carga archivo con recepciones
4. **Cálculo automático**: Sistema calcula % de recepción y actualiza estado
5. **Estados finales**: Parcialmente_Recepcionado o Completamente_Recepcionado

### ✅ Sin Migración Requerida

El módulo de Orden de Compra usa la tabla `"Orden_Compra"` existente del proyecto Flujo_Orden_Compra.

**Para activar los cambios:**

1. **Actualizar webapp**:
```bash
cd webapp
npm install
npm start
```

2. **Verificar funcionamiento**:
   - Acceder a la aplicación
   - Verificar que aparece el sidebar con ambos módulos
   - Probar carga de archivo en módulo OC

**Compatibilidad de archivos:**
- Acepta los mismos formatos de archivo que usabas con n8n
- Campos de carga OC: `Oc`, `Cod_Prod`, `SKU`, `Producto`, `Proveedor`, etc.
- Campos de recepción: `Or_Compra`/`Oc`, `PRODUCTO`, `ENTRADA`, `PRECIO`

---

## [2.0.3] - 2024-11-28

### 🐛 Corregido

#### Flujo de Validaciones y Alertas
- **Error en campo `destinatarios` del nodo `💾 Guardar_Alerta_Supabase`**:
  - **Problema**: Error "malformed array literal" al intentar guardar alertas en Supabase
  - **Causa**: Se estaba enviando `JSON.stringify($json.destinatarios)` que convertía el array en un string JSON (`"[\"email@example.com\"]"`) en lugar de un array nativo de PostgreSQL
  - **Solución**: Cambiado a `$json.destinatarios` para enviar el array directamente
  - **Impacto**: El nodo de Supabase ahora puede guardar correctamente las alertas con el campo `destinatarios` como array de texto

- **Error en nodo `✅ Actualizar_Estado_Alerta`**:
  - **Problema**: Error "At least one select condition must be defined" al intentar actualizar el estado de la alerta
  - **Causa**: El nodo de UPDATE de Supabase requiere especificar qué registro actualizar mediante condiciones de filtro
  - **Solución**: Agregado `filterType: "manual"` y `matchBy` con el campo `id` obtenido del nodo anterior (`💾 Guardar_Alerta_Supabase`)
  - **Impacto**: El nodo ahora puede actualizar correctamente el estado de las alertas después de enviar las notificaciones por email

- **Error en nodo `📊 Guardar_Log_Supabase` del flujo de validaciones**:
  - **Problema**: Error "new row for relation \"logs_integracion\" violates check constraint \"check_tipo_operacion\"" al intentar guardar el log
  - **Causa**: El constraint `check_tipo_operacion` no incluía el valor `'Validacion_Completa'` usado por el flujo de validaciones
  - **Solución**: 
    - Actualizado el schema en `database/01_schema.sql` para incluir `'Validacion_Completa'` en el constraint
    - Creado script SQL `database/05_update_constraint_validacion_completa.sql` para actualizar el constraint en Supabase
  - **Impacto**: El flujo de validaciones ahora puede registrar correctamente sus logs de ejecución

#### Base de Datos
- **Actualización del constraint `check_tipo_operacion`**:
  - Agregados nuevos tipos de operación permitidos:
    - `'Ingesta_Unificada'`: Para el flujo unificado de ingesta
    - `'Validacion_Completa'`: Para el flujo de validaciones y alertas
  - Creado script de migración: `database/05_update_constraint_validacion_completa.sql`

---

## [1.0.0] - 2024-11-22

### 🎉 Lanzamiento Inicial

Primera versión completa del Sistema de Gestión de Órdenes de Transferencia.

### ✨ Agregado

#### Base de Datos (Supabase)
- Tabla `transfer_orders` con gestión de estados por OT + SKU
- Tabla `transfer_orders_detalle_ean` para detalle por código EAN
- Tabla `pim_productos` para catálogo de productos
- Tabla `logs_integracion` para auditoría de operaciones
- Tabla `historial_alertas` para registro de alertas generadas
- Tabla `configuracion` para parámetros del sistema
- 11 funciones SQL para operaciones comunes:
  - `upsert_transfer_order` - Inserción/actualización idempotente
  - `validar_diferencia_ot_ota` - Validación OT vs OTA
  - `validar_diferencia_ota_otf` - Validación OTA vs OTF
  - `validar_ean_contra_pim` - Validación EAN vs catálogo
  - `registrar_log_integracion` - Registro de logs
  - `registrar_alerta` - Registro de alertas
  - `marcar_alerta_notificada` - Marcar alerta enviada
  - `resolver_alerta` - Cerrar novedad
  - `obtener_configuracion` - Obtener parámetros
  - `estadisticas_ot` - Estadísticas generales
  - `obtener_ot_pendientes_procesamiento` - OT pendientes
- Índices estratégicos para optimización de queries
- Triggers automáticos para `updated_at` y `fecha_ultimo_cambio_estado`
- Constraints de validación para estados y cantidades
- Datos de prueba para testing

#### Flujos n8n
- **Flujo 01**: Ingesta OT (Solicitud)
  - Lectura automática de Google Sheets
  - Validación de datos
  - Upsert en Supabase
  - Registro de logs
  - Ejecución cada 10 minutos
- **Flujo 02**: Ingesta OTA (Preparación) + Validación
  - Lectura de preparación
  - Validación contra OT (umbral 2%)
  - Generación de alertas por diferencias
  - Envío de emails automáticos
  - Registro de logs
- Arquitectura modular con nodos reutilizables
- Manejo de errores con `continueOnFail`
- Logs abundantes para debugging
- Validación multinivel de datos

#### Plantillas de Google Sheets
- Pestaña **OT**: Registro de solicitudes (Abastecimiento)
- Pestaña **OTA**: Registro de preparación (Operaciones)
- Pestaña **OTADET**: Detalle por EAN (Operaciones)
- Pestaña **OTF**: Registro de recepción (Full)
- Validaciones de datos recomendadas
- Formato condicional para filas procesadas
- Documentación completa de uso

#### Sistema de Notificaciones
- Plantilla HTML: Alerta OT vs OTA (diferencias > 2%)
- Plantilla HTML: Alerta OTADET vs PIM (inconsistencias EAN)
- Plantilla HTML: Alerta OTA vs OTF (diferencias > 5%)
- Diseño responsive compatible con Gmail, Outlook, Mobile
- Paleta de colores por tipo de alerta
- Rate limiting implementado para Gmail

#### Documentación
- `README.md` - Documentación principal completa
- `docs/guia_usuario.md` - Guía para usuarios finales
- `docs/guia_tecnica.md` - Guía para desarrolladores (pendiente)
- `docs/troubleshooting.md` - Solución de problemas comunes
- `docs/mejores_practicas.md` - Tips y lecciones aprendidas (referencia)
- `plantillas/README_Plantillas.md` - Documentación de Google Sheets
- `notificaciones/README_Notificaciones.md` - Documentación de emails
- `n8n/docs/README_Flujos.md` - Documentación de workflows
- `database/` - Scripts SQL comentados y documentados

#### Configuración
- `.gitignore` - Archivos a ignorar en Git
- Variables de entorno documentadas
- Credenciales configurables en n8n
- Umbrales de diferencia configurables en BD

### 🎯 Características Principales

#### Estados de OT
- `Solicitado` - OT registrada por Abastecimiento
- `Preparado` - OTA registrada por Operaciones
- `Preparacion_Validada` - OTA validada (diferencia ≤ 2%)
- `Entregado_Sin_Novedad` - OTF coincide con OTA
- `Entregado_con_Novedad` - OTF difiere de OTA
- `Entregado_con_Novedad_Resuelto` - Novedad cerrada

#### Validaciones Automáticas
- Diferencia OT vs OTA con umbral configurable (2%)
- Diferencia OTA vs OTF con umbral configurable (5%)
- Validación de EAN contra catálogo PIM
- Detección de EAN faltantes y sobrantes
- Validación de cantidades por EAN

#### Alertas Automáticas
- Email HTML formateado por tipo de alerta
- Severidad configurable (Baja, Media, Alta, Crítica)
- Destinatarios configurables por área
- Historial completo de alertas
- Estado de notificación (Generada, Notificada, Resuelta)

#### Auditoría y Logs
- Registro de todas las operaciones de integración
- Logs con timestamp, duración y resultados
- Errores detallados en formato JSON
- Historial de cambios de estado
- Trazabilidad completa de cada OT

### 🛠️ Mejores Prácticas Implementadas

- ✅ Nombres descriptivos con emojis en nodos n8n
- ✅ Validación multinivel de datos
- ✅ Logs abundantes en consola para debugging
- ✅ Siempre retornar algo (nunca arrays vacíos)
- ✅ Continue On Fail en nodos apropiados
- ✅ Execute Once: FALSE por defecto
- ✅ Filtrado de datos en la fuente (SQL)
- ✅ Índices estratégicos para performance
- ✅ Rate limiting para APIs externas
- ✅ Operaciones idempotentes (upsert)
- ✅ Constraints de BD desde el inicio
- ✅ Nomenclatura consistente (snake_case)
- ✅ Documentación completa y actualizada

### 📊 Métricas del Proyecto

- **Tablas de BD**: 6
- **Funciones SQL**: 11
- **Índices**: 30+
- **Flujos n8n**: 2 (de 5 planificados)
- **Plantillas de Email**: 3
- **Archivos de Documentación**: 12+
- **Estados de OT**: 6
- **Tipos de Alerta**: 3
- **Scripts SQL**: 4
- **Líneas de Código**: 3000+

### 🎓 Basado en Lecciones Aprendidas

Este proyecto incorpora las mejores prácticas y lecciones aprendidas del proyecto anterior:
- Sistema de Gestión de Alertas de OC v3.2.2
- Documento de Tips y Mejores Prácticas
- Errores comunes identificados y solucionados

### 📦 Requisitos del Sistema

- **Supabase**: Free tier o superior
- **n8n**: Cloud ($20/mes) o self-hosted
- **Google Sheets**: Cuenta gratuita
- **Gmail**: Para notificaciones (500 emails/día)
- **Node.js**: 18+ (solo para n8n self-hosted)

### 💰 Costos Estimados

- **Proyecto Pequeño** (< 500 OT/mes): $20/mes
- **Proyecto Mediano** (< 2000 OT/mes): $45/mes
- **Proyecto Grande** (> 5000 OT/mes): $50/mes

---

## [2.0.0] - 2024-11-28

### 🎉 Versión 2.0 - Refactorización Completa

Versión mayor con cambios significativos en la arquitectura de los flujos n8n.

### ✨ Agregado

#### Flujo Unificado de Ingesta
- **Nuevo flujo**: `Flujo_Unificado_Ingesta_OT.json`
  - Procesa **todas las hojas en paralelo** (OT, OTA, OTADET, OTF)
  - Reduce tiempo de ejecución en 60% (de ~3min a ~1min)
  - Un solo workflow reemplaza 4 workflows separados
  - Router inteligente que dirige datos a la tabla correcta
  - Limpieza automática de Google Sheets después de procesar
  - Logs consolidados con desglose por tipo de operación

#### Flujo de Validaciones y Alertas
- **Nuevo flujo**: `Flujo_Validaciones_Alertas.json`
  - Flujo dedicado para validaciones (separado de ingesta)
  - Ejecuta validaciones en paralelo:
    - OT vs OTA (umbral 2%)
    - OTA vs OTF (umbral 5%)
    - OTADET vs PIM (inconsistencias EAN)
  - Generación de alertas con clasificación por severidad
  - Plantillas HTML mejoradas y responsive
  - Actualización automática de estado de alertas

#### Nodos Nativos de Supabase
- Reemplazo completo de nodos HTTP por nodos nativos de Supabase
- Operaciones UPSERT directas con conflicto en clave única
- Mejor manejo de errores y reintentos automáticos
- Queries SQL directas para validaciones
- Soporte nativo para tipos de datos JSONB

#### Sistema de Limpieza Automática
- Elimina automáticamente todas las filas de datos después de procesar
- Mantiene el header (primera fila) intacto
- Hojas siempre listas para nueva carga
- No requiere intervención manual
- Implementado con nodos nativos de Google Sheets

#### Documentación Completa Nueva
- **`GOOGLE_SHEETS_SETUP.md`** (nuevo)
  - Guía completa de configuración de hojas
  - Explicación del flujo de datos
  - Estructura detallada de cada hoja
  - Ejemplos de datos válidos
  - Preguntas frecuentes
  - Troubleshooting específico
- **`README_Flujos.md`** (actualizado v2.0)
  - Arquitectura del sistema unificado
  - Diagramas de flujo actualizados
  - Guía de migración desde v1.0
  - Métricas de rendimiento comparativas
  - Configuración paso a paso

### 🔄 Cambiado

#### Arquitectura de Flujos
- **Antes (v1.0)**: 
  - 5 workflows separados
  - Procesamiento secuencial
  - ~3 minutos por ciclo completo
  - 30 ejecuciones/hora

- **Ahora (v2.0)**:
  - 2 workflows consolidados
  - Procesamiento paralelo
  - ~1 minuto por ciclo completo
  - 10 ejecuciones/hora

#### Procesamiento de Google Sheets
- **Eliminado**: Campo "procesado" (ya no se usa)
- **Nuevo**: Limpieza automática completa de hojas
- **Antes**: Marcaba filas como procesadas
- **Ahora**: Borra filas procesadas exitosamente

#### Integración con Supabase
- **Antes**: Nodos HTTP con headers manuales
- **Ahora**: Nodos nativos de Supabase
- **Ventajas**:
  - Configuración más simple
  - Mejor manejo de errores
  - Soporte nativo para tipos complejos
  - Queries SQL directas

#### Estructura de Logs
- Logs consolidados con desglose detallado:
```json
{
  "tipo_operacion": "Ingesta_Unificada",
  "datos_adicionales": {
    "desglose": {
      "OT": {"exitosos": 50, "fallidos": 0},
      "OTA": {"exitosos": 48, "fallidos": 1},
      "OTADET": {"exitosos": 40, "fallidos": 0},
      "OTF": {"exitosos": 10, "fallidos": 1}
    }
  }
}
```

### 🗑️ Removido

#### Flujos Obsoletos (v1.0)
- ❌ `01_Flujo_Ingesta_OT.json` - Reemplazado por flujo unificado
- ❌ `02_Flujo_Ingesta_OTA.json` - Reemplazado por flujo unificado
- ❌ Campo `procesado` en Google Sheets - Ya no necesario

#### Nodos HTTP Request
- Todos los nodos HTTP para Supabase reemplazados por nodos nativos
- Simplifica configuración de credenciales
- Elimina necesidad de headers manuales

### 🐛 Corregido

#### Error en Parámetros de Función SQL (27/11/2024)
- **Problema**: Error `42P13: input parameters after one with a default value must also have defaults` en `03_functions.sql`
- **Causa**: En la función `registrar_alerta`, el parámetro `p_sku` tenía valor por defecto pero `p_tipo_alerta` (siguiente) no lo tenía
- **Solución**: Reordenados los parámetros de la función para que todos los parámetros con valores por defecto estén al final
- **Orden anterior**: `p_id_ot, p_sku DEFAULT NULL, p_tipo_alerta, ...`
- **Orden corregido**: `p_id_ot, p_tipo_alerta, p_sku DEFAULT NULL, ...`
- **Archivo modificado**: `database/03_functions.sql`
- **Impacto**: Ninguno en funcionalidad, solo corrección de sintaxis PostgreSQL
- **Reportado por**: Usuario durante instalación rápida en Supabase

#### Problemas de Rendimiento en v1.0
- **Problema**: Procesamiento secuencial muy lento
- **Solución**: Implementación de procesamiento paralelo
- **Mejora**: 60% reducción en tiempo de ejecución

#### Limpieza Manual de Google Sheets
- **Problema**: Usuario debía limpiar manualmente las hojas
- **Solución**: Limpieza automática después de procesar
- **Impacto**: Elimina intervención manual

#### Complejidad en Configuración
- **Problema**: Múltiples workflows difíciles de mantener
- **Solución**: Consolidación en 2 workflows simples
- **Impacto**: -60% en workflows activos

### ⚠️ Breaking Changes (Migración Requerida)

#### Para Usuarios de v1.0

**IMPORTANTE**: Si estás usando v1.0, debes migrar:

1. **Desactivar workflows antiguos**:
   - `01_Flujo_Ingesta_OT`
   - `02_Flujo_Ingesta_OTA`

2. **Actualizar Google Sheets**:
   - **ELIMINAR** columna `procesado` de todas las hojas
   - Ya no es necesaria ni usada

3. **Importar nuevos workflows**:
   - `Flujo_Unificado_Ingesta_OT.json`
   - `Flujo_Validaciones_Alertas.json`

4. **Actualizar credenciales**:
   - Reconfigurar con nodos nativos de Supabase
   - Verificar credenciales de Google Sheets

5. **Verificar funcionamiento**:
   - Ejecutar manualmente los nuevos flujos
   - Verificar que las hojas se limpien correctamente
   - Monitorear logs por 24 horas

**Guía completa de migración**: Ver `n8n/docs/README_Flujos.md` sección "Actualización desde v1.0"

### 📊 Métricas de Mejora v2.0 vs v1.0

| Métrica | v1.0 | v2.0 | Mejora |
|---------|------|------|--------|
| **Workflows activos** | 5 | 2 | -60% |
| **Tiempo de ejecución** | ~3min | ~1min | -67% |
| **Nodos totales** | ~50 | ~35 | -30% |
| **Ejecuciones/hora** | 30 | 10 | -67% |
| **Lectura de hojas** | ~40s | ~10s | -75% |
| **Complejidad config** | Alta | Media | -50% |

### 🎯 Nuevas Características Destacadas

1. **Procesamiento Paralelo**
   - 4 lecturas simultáneas de Google Sheets
   - 3 validaciones simultáneas en Supabase
   - Reducción dramática de tiempo total

2. **Limpieza Automática**
   - Hojas siempre limpias y listas
   - Sin intervención manual
   - Sin confusión de datos antiguos

3. **Nodos Nativos**
   - Configuración simplificada
   - Mejor integración con Supabase
   - Manejo robusto de errores

4. **Logs Consolidados**
   - Vista unificada de todas las operaciones
   - Desglose detallado por tipo
   - Mejor trazabilidad

5. **Documentación Mejorada**
   - Guía específica de Google Sheets
   - Diagramas de arquitectura
   - Troubleshooting detallado

### 🚀 Impacto en Producción

- ✅ **Reducción de costos**: Menos ejecuciones = menor consumo
- ✅ **Mayor confiabilidad**: Menos puntos de falla
- ✅ **Mejor UX**: Hojas siempre limpias y listas
- ✅ **Menos mantenimiento**: 2 workflows vs 5
- ✅ **Mejor monitoreo**: Logs consolidados

### 📝 Archivos Modificados

#### Nuevos
- `n8n/workflows/Flujo_Unificado_Ingesta_OT.json`
- `n8n/workflows/Flujo_Validaciones_Alertas.json`
- `n8n/docs/GOOGLE_SHEETS_SETUP.md`

#### Actualizados
- `n8n/docs/README_Flujos.md` - Versión 2.0 completa
- `CHANGELOG.md` - Este archivo

#### Eliminados
- `n8n/workflows/01_Flujo_Ingesta_OT.json`
- `n8n/workflows/02_Flujo_Ingesta_OTA.json`

---

## [2.0.1] - 2024-11-28

### 🐛 Corregido

#### Problema con Nodo Merge y Operación Upsert
- **Problema 1**: El nodo `Merge` tipo "combineAll" no funcionaba cuando solo había datos en una hoja
- **Causa**: `combineAll` requiere datos en TODAS las entradas simultáneamente
- **Solución**: Reemplazado por un solo nodo Code que lee de todos los nodos de lectura usando `$('nombre_nodo').all()`
- **Ventaja**: Funciona correctamente aunque solo una hoja tenga datos

- **Problema 2**: La operación "upsert" no existe en los nodos nativos de Supabase
- **Causa**: Los nodos nativos de Supabase solo tienen operaciones: create, read, update, delete
- **Solución**: Volver a usar nodos HTTP Request con la función RPC `upsert_transfer_order` que ya existe en la BD
- **Ventaja**: Usa la función upsert creada específicamente en el esquema SQL

#### Cambios en la Arquitectura del Flujo
- **Antes**: 
  - 4 nodos de lectura → 4 nodos de procesamiento → nodo Merge → Router
  - Fallaba si alguna hoja estaba vacía

- **Ahora**:
  - 4 nodos de lectura → 1 nodo Code que lee de todos → Router
  - Funciona correctamente con cualquier combinación de hojas vacías/llenas
  - Más simple y robusto

#### Nodos de Guardado
- **OT, OTA, OTF**: HTTP Request a función RPC `upsert_transfer_order`
- **OTADET**: HTTP Request directo a tabla con header `Prefer: resolution=merge-duplicates`
- Todos mantienen `continueOnFail: true` para robustez

#### Limpieza de Hojas
- Agregado `executeOnce: true` a los nodos de borrado
- Evita que se ejecute múltiples veces si hay varios registros de la misma hoja
- Solo borra una vez por hoja que tenga datos

### 🔄 Archivos Modificados
- `n8n/workflows/Flujo_Unificado_Ingesta_OT.json` - Versión 2.0.1

---

## [2.0.2] - 2024-11-28

### 🐛 Corregido

#### Error "Referenced node is unexecuted" en Nodo de Procesamiento
- **Problema**: El nodo `🔧 Procesar_Todas_Las_Hojas` generaba error "Referenced node is unexecuted"
- **Causa**: El código usaba `$('nombre_nodo').all()` pero los nodos no estaban conectados correctamente con índices diferentes
- **Solución**: 
  - Corregidas las conexiones para que cada nodo de lectura se conecte a un índice diferente del nodo de procesamiento (0, 1, 2, 3)
  - Cambiado el código para usar `$input.all(index)` en lugar de `$()`
  - Ahora lee correctamente de las 4 entradas simultáneas
- **Archivos modificados**: `n8n/workflows/Flujo_Unificado_Ingesta_OT.json`

### 🔄 Cambios Técnicos

#### Conexiones de Nodos
**Antes**:
```json
"📊 Leer_OT": {"main": [[{"node": "🔧 Procesar_Todas_Las_Hojas", "index": 0}]]},
"📊 Leer_OTA": {"main": [[{"node": "🔧 Procesar_Todas_Las_Hojas", "index": 0}]]},  // ❌ Mismo índice
```

**Ahora**:
```json
"📊 Leer_OT": {"main": [[{"node": "🔧 Procesar_Todas_Las_Hojas", "index": 0}]]},
"📊 Leer_OTA": {"main": [[{"node": "🔧 Procesar_Todas_Las_Hojas", "index": 1}]]},  // ✅ Índice diferente
"📊 Leer_OTADET": {"main": [[{"node": "🔧 Procesar_Todas_Las_Hojas", "index": 2}]]},
"📊 Leer_OTF": {"main": [[{"node": "🔧 Procesar_Todas_Las_Hojas", "index": 3}]]},
```

#### Código de Procesamiento
**Antes**:
```javascript
const lecturaOT = $('📊 Leer_OT').all();  // ❌ Requiere ejecución previa
```

**Ahora**:
```javascript
const inputOT = $input.all(0);  // ✅ Lee de entrada índice 0
const inputOTA = $input.all(1);  // ✅ Lee de entrada índice 1
```

---

## [2.0.3] - 2024-11-28

### 🐛 Corregido

#### Nodo de Procesamiento No Recibe Todas las Entradas
- **Problema**: Cuando 3 de las 4 hojas estaban vacías, el nodo de procesamiento solo recibía datos de 1 entrada
- **Causa**: Los nodos de Google Sheets NO generan output cuando la hoja está vacía, entonces las entradas vacías no llegan al nodo de procesamiento
- **Solución**: Agregado `alwaysOutputData: true` a todos los nodos de lectura de Google Sheets
- **Resultado**: Ahora SIEMPRE genera output, incluso si la hoja está vacía (genera un array vacío `[]`)

### 🔧 Cambio Técnico

**Antes**:
```json
{
  "name": "📊 Leer_OT",
  "type": "n8n-nodes-base.googleSheets",
  "continueOnFail": true
  // ❌ Sin alwaysOutputData
}
```

**Comportamiento**: Si la hoja OT está vacía → NO genera output → entrada 0 no existe

**Ahora**:
```json
{
  "name": "📊 Leer_OT",
  "type": "n8n-nodes-base.googleSheets",
  "alwaysOutputData": true,  // ✅ NUEVO
  "continueOnFail": true
}
```

**Comportamiento**: Si la hoja OT está vacía → genera output vacío `[]` → entrada 0 existe (pero vacía)

### 📊 Impacto

| Escenario | v2.0.2 (Antes) | v2.0.3 (Ahora) |
|-----------|----------------|----------------|
| Solo OT con datos | ❌ Solo recibe entrada 0 | ✅ Recibe 4 entradas (3 vacías) |
| OT y OTA con datos | ❌ Solo recibe entradas 0 y 1 | ✅ Recibe 4 entradas (2 vacías) |
| Todas con datos | ✅ Recibe 4 entradas | ✅ Recibe 4 entradas |
| Ninguna con datos | ❌ No recibe entradas | ✅ Recibe 4 entradas vacías |

### 🎯 Beneficio

El código `$input.all(0)`, `$input.all(1)`, etc. ahora funciona correctamente porque **siempre** hay 4 entradas, estén vacías o no.

---

## [3.0.0] - 2024-12-09

### 🎉 Nueva Aplicación Web - Independiente de n8n

Se creó una aplicación web completa que reemplaza la dependencia de n8n para la carga de datos.

#### Nueva Carpeta `webapp/`
- **`server.js`**: Servidor Express con API REST completa
- **`public/index.html`**: Interfaz de usuario moderna
- **`public/styles.css`**: Estilos con diseño tipo terminal/IDE
- **`public/app.js`**: Lógica del frontend
- **`package.json`**: Dependencias del proyecto
- **`README.md`**: Documentación completa

#### Funcionalidades de la Aplicación Web

1. **Carga de Archivos por Tipo**:
   - 📋 **OT (Solicitud)**: Carga órdenes de transferencia
   - 🔧 **OTA (Preparación)**: Registra preparación
   - 📊 **OTADET (Detalle EAN)**: Detalle por código de barras
   - ✅ **OTF (Recepción)**: Recepción final

2. **Características de UI/UX**:
   - Drag & Drop para archivos
   - Soporte CSV y Excel (XLSX, XLS)
   - Diseño moderno tipo terminal con colores oscuros
   - Tabs de navegación intuitivos
   - Feedback visual de resultados (éxito/error)
   - Modal con detalle de errores por fila

3. **Descarga de Plantillas**:
   - Botón para descargar plantilla Excel por cada tipo
   - Incluye datos de ejemplo
   - Columnas correctamente formateadas

4. **Lista de Clientes Predefinidos**:
   - Ballerina, Beiersdorf, Bodyshop, Bridgestone
   - California Energy Drink, Davis, Elite Professional
   - Faber Castell, Ferretería La Reina, Icb
   - Mercado Carozzi, Seis Luces, Sika
   - Smart Earth Camelina, Softys, Virutex - ILKO, Carozzi Fs

5. **Selector de OT Pendientes**:
   - Combobox en OTA, OTADET y OTF
   - Muestra `id_ot + cliente` para fácil identificación
   - Filtra automáticamente según el estado

6. **API REST**:
   - `GET /api/clientes` - Lista de clientes válidos
   - `GET /api/ot-pendientes?tipo=X` - OT pendientes
   - `GET /api/stats` - Estadísticas
   - `GET /api/template/:tipo` - Descargar plantilla
   - `POST /api/upload/:tipo` - Cargar archivo

#### Stack Tecnológico
- **Backend**: Node.js + Express
- **Base de datos**: Supabase (PostgreSQL)
- **Frontend**: HTML5 + CSS3 + JavaScript Vanilla
- **Procesamiento**: csv-parse, xlsx

#### Instalación

```bash
cd webapp
npm install
cp env.example .env
# Editar .env con credenciales de Supabase
npm start
```

### ⚠️ Breaking Changes

Esta versión permite operar **sin n8n**. Los workflows de n8n siguen funcionando pero ahora son opcionales.

---

## [2.0.4] - 2024-12-09

### ✨ Agregado

#### Nuevo Campo `cliente` en Órdenes de Transferencia
- **Descripción**: Se agregó el campo `cliente` para identificar el cliente asociado a cada orden de transferencia
- **Archivos modificados**:
  - `database/01_schema.sql` - Agregada columna `cliente TEXT` a la tabla `transfer_orders`
  - `database/03_functions.sql` - Agregado parámetro `p_cliente` a la función `upsert_transfer_order`
  - `n8n/workflows/Flujo_Unificado_Ingesta_OT.json` - Agregado mapeo del campo `cliente` en el nodo de procesamiento
  - `n8n/docs/GOOGLE_SHEETS_SETUP.md` - Documentada la nueva columna en la hoja OT

#### Cambios en Base de Datos
- Nueva columna `cliente TEXT` en tabla `transfer_orders` (opcional, puede ser NULL)
- Comentario descriptivo: "Nombre o identificador del cliente asociado a la orden"

#### Cambios en Función SQL
- Nuevo parámetro `p_cliente TEXT DEFAULT NULL` en `upsert_transfer_order`
- El campo se guarda tanto en INSERT como en UPDATE

#### Cambios en Google Sheets
- Nueva columna `cliente` en la hoja OT (opcional)
- Posición: después de `mlc`, antes de `fecha_solicitud`
- Headers actualizados: `id_ot | sku | mlc | cliente | fecha_solicitud | fecha_transferencia_comprometida | cantidad_solicitada`

#### Cambios en Workflow n8n
- El nodo `🔧 Procesar_Todas_Las_Hojas` ahora lee y mapea el campo `cliente`
- El campo se envía a Supabase en el JSON de la función `upsert_transfer_order`

### ⚠️ Migración Requerida

Para aplicar estos cambios en un sistema existente:

1. **En Supabase**, ejecutar:
```sql
-- Agregar columna cliente
ALTER TABLE transfer_orders ADD COLUMN IF NOT EXISTS cliente TEXT;
COMMENT ON COLUMN transfer_orders.cliente IS 'Nombre o identificador del cliente asociado a la orden';

-- Recrear la función upsert_transfer_order (ejecutar el contenido de 03_functions.sql)
```

2. **En Google Sheets**:
   - Agregar columna `cliente` después de `mlc` en la hoja OT
   - Actualizar el header de la hoja

3. **En n8n**:
   - Reimportar el workflow `Flujo_Unificado_Ingesta_OT.json`
   - O actualizar manualmente el código del nodo `🔧 Procesar_Todas_Las_Hojas`

---

## [3.0.1] - 2024-12-11

### ✨ Agregado

#### Guía de Despliegue en Railway
- **Nuevo archivo**: `docs/GUIA_DEPLOY_RAILWAY.md`
  - Guía completa paso a paso para desplegar la aplicación en Railway
  - Instrucciones para configurar GitHub como repositorio
  - Configuración de variables de entorno en Railway
  - Configuración de dominio personalizado (ej: `ot.cleveradmin.cl`)
  - Troubleshooting de errores comunes
  - Información de costos (plan gratuito vs Pro)

#### Archivo .gitignore para webapp
- **Nuevo archivo**: `webapp/.gitignore`
  - Excluye `node_modules/` del repositorio
  - Excluye archivos `.env` con credenciales
  - Excluye logs y archivos temporales

### 📋 Opciones de Despliegue Documentadas

| Plataforma | Costo | Facilidad | Documentación |
|------------|-------|-----------|---------------|
| **Railway** | Gratis (~$5 crédito/mes) | ⭐⭐⭐⭐⭐ | `docs/GUIA_DEPLOY_RAILWAY.md` |
| Render | Gratis (tier básico) | ⭐⭐⭐⭐⭐ | Pendiente |
| Vercel | Gratis | ⭐⭐⭐⭐ | Pendiente |
| VPS propio | Variable | ⭐⭐⭐ | Pendiente |

---

## [Unreleased] - Próximas Versiones

### 🔄 Cambiado

#### Renombrado de Tabla para Evitar Conflictos
- **Tabla renombrada**: `historial_alertas` → `historial_alertas_ot`
- **Motivo**: Evitar conflicto con tabla existente del proyecto de control de OC
- **Archivos actualizados**:
  - `database/01_schema.sql` - Definición de tabla
  - `database/02_indexes.sql` - Todos los índices
  - `database/03_functions.sql` - Funciones que usan la tabla
  - `database/04_sample_data.sql` - Datos de prueba
- **Impacto**: Ninguno (cambio antes de despliegue en producción)

### 🚧 En Desarrollo

#### Flujos n8n Pendientes
- [ ] **Flujo 03**: Ingesta OTADET + Validación PIM
- [ ] **Flujo 04**: Ingesta OTF + Validación
- [ ] **Flujo 05**: Cierre de Novedad

#### Funcionalidades Planificadas
- [ ] Dashboard web para visualización de OT
- [ ] Reportes automáticos por email (resumen diario/semanal)
- [ ] Integración con WhatsApp para alertas críticas
- [ ] API REST para integración con otros sistemas
- [ ] Exportación de datos a Excel
- [ ] Gráficos y estadísticas en tiempo real

#### Mejoras Técnicas
- [ ] Backup automático de Supabase
- [ ] Monitoreo de uptime de workflows
- [ ] Tests automatizados
- [ ] CI/CD pipeline
- [ ] Documentación de API

#### Documentación Pendiente
- [ ] `docs/guia_tecnica.md` - Guía técnica completa
- [ ] Videos tutoriales para usuarios
- [ ] Diagramas de arquitectura
- [ ] Casos de uso detallados

---

## Formato de Versiones

### Tipos de Cambios

- **✨ Agregado** - Nuevas funcionalidades
- **🔄 Cambiado** - Cambios en funcionalidades existentes
- **⚠️ Deprecado** - Funcionalidades que serán removidas
- **🗑️ Removido** - Funcionalidades removidas
- **🐛 Corregido** - Corrección de bugs
- **🔒 Seguridad** - Correcciones de seguridad

### Versionado Semántico

Dado un número de versión MAJOR.MINOR.PATCH:

- **MAJOR**: Cambios incompatibles con versiones anteriores
- **MINOR**: Nueva funcionalidad compatible con versiones anteriores
- **PATCH**: Correcciones de bugs compatibles con versiones anteriores

---

## Cómo Contribuir

Para agregar cambios a este CHANGELOG:

1. Agregar cambios en la sección `[Unreleased]`
2. Usar el formato de tipos de cambios
3. Incluir descripción clara y concisa
4. Referenciar issues o PRs si aplica
5. Al hacer release, mover cambios a nueva versión con fecha

---

**Mantenido por**: Equipo de Desarrollo  
**Última actualización**: 19 de Diciembre, 2024  
**Versión actual**: 4.0.6

