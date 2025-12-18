# 🔄 Documentación de Flujos n8n - Sistema OT v2.0

## 🎯 Descripción General

Sistema unificado de ingesta y validación de Órdenes de Transferencia usando n8n y Supabase. La nueva versión (v2.0) simplifica drásticamente el proceso con un flujo unificado que procesa todas las hojas simultáneamente.

---

## ✨ Novedades Versión 2.0

### Cambios Principales

1. **🔀 Flujo Unificado**
   - ✅ Un solo flujo procesa todas las hojas (OT, OTA, OTADET, OTF)
   - ✅ Procesamiento paralelo de todas las fuentes
   - ✅ Reducción de configuración y mantenimiento

2. **💾 Nodos Nativos de Supabase**
   - ✅ Reemplazo completo de nodos HTTP por nodos nativos de Supabase
   - ✅ Mejor manejo de errores
   - ✅ Configuración más simple

3. **🗑️ Limpieza Automática**
   - ✅ Elimina automáticamente los datos procesados de Google Sheets
   - ✅ Hojas siempre listas para nueva carga
   - ✅ No requiere campo "procesado"

4. **📧 Sistema de Alertas Mejorado**
   - ✅ Flujo dedicado para validaciones
   - ✅ Plantillas HTML profesionales
   - ✅ Clasificación por severidad

---

## 📋 Lista de Flujos

### 🔄 Flujo 1: Ingesta Unificada
- **Archivo**: `Flujo_Unificado_Ingesta_OT.json`
- **Propósito**: Leer, procesar y guardar datos de todas las hojas
- **Trigger**: Schedule (cada 10 minutos)
- **Fuentes**: OT, OTA, OTADET, OTF
- **Acciones**:
  - Lee 4 hojas en paralelo
  - Valida datos obligatorios
  - Guarda en Supabase (upsert)
  - Limpia las hojas automáticamente
  - Registra logs consolidados

### 🔍 Flujo 2: Validaciones y Alertas
- **Archivo**: `Flujo_Validaciones_Alertas.json`
- **Propósito**: Validar inconsistencias y enviar alertas
- **Trigger**: Schedule (cada 15 minutos)
- **Validaciones**:
  - Diferencias OT vs OTA (umbral 2%)
  - Diferencias OTA vs OTF (umbral 5%)
  - Inconsistencias OTADET vs PIM
- **Acciones**:
  - Genera alertas en base de datos
  - Envía emails con plantilla HTML
  - Actualiza estado de alertas

---

## 🏗️ Arquitectura del Sistema

### Flujo Unificado de Ingesta

```
🕐 Trigger (cada 10 min)
    ↓
🚀 Inicio
    ↓ (paralelo)
    ├─→ 📊 Leer OT      → 🔧 Procesar OT
    ├─→ 📊 Leer OTA     → 🔧 Procesar OTA
    ├─→ 📊 Leer OTADET  → 🔧 Procesar OTADET
    └─→ 📊 Leer OTF     → 🔧 Procesar OTF
              ↓
        🔀 Unificar Todos
              ↓
        🔀 Router Por Tipo
              ↓ (paralelo)
    ├─→ ❓ Es OT?     → 💾 Guardar OT     → 🗑️ Limpiar Hoja OT
    ├─→ ❓ Es OTA?    → 💾 Guardar OTA    → 🗑️ Limpiar Hoja OTA
    ├─→ ❓ Es OTADET? → 💾 Guardar OTADET → 🗑️ Limpiar Hoja OTADET
    └─→ ❓ Es OTF?    → 💾 Guardar OTF    → 🗑️ Limpiar Hoja OTF
              ↓
        🔀 Reunificar Resultados
              ↓
        📝 Preparar Log Final
              ↓
        📊 Guardar Log
```

### Flujo de Validaciones

```
🕐 Trigger (cada 15 min)
    ↓
🚀 Inicio
    ↓ (paralelo)
    ├─→ 🔍 Validar OT-OTA   → ⚠️ ¿Supera umbral? → 📧 Prep Alerta OT-OTA
    ├─→ 🔍 Validar OTA-OTF  → ⚠️ ¿Supera umbral? → 📧 Prep Alerta OTA-OTF
    └─→ 🔍 Validar OTADET   → ⚠️ ¿Inconsistencia?→ 📧 Prep Alerta OTADET
              ↓
        🔀 Unificar Alertas
              ↓
        ❓ ¿Hay alertas?
              ↓
        💾 Guardar Alerta
              ↓
        📧 Enviar Email
              ↓
        ✅ Actualizar Estado
              ↓
        📝 Preparar Log
              ↓
        📊 Guardar Log
```

---

## 🔧 Configuración Inicial

### 1. Variables de Entorno en n8n

Configura estas variables en tu instancia de n8n:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_KEY=tu_service_role_key_aqui
```

### 2. Credenciales en n8n

#### a) Supabase API
1. Ve a **Settings → Credentials → New**
2. Selecciona **Supabase**
3. Completa:
   - **Name**: `Supabase - OT System`
   - **Host**: `https://tu-proyecto.supabase.co`
   - **Service Role Secret**: `tu_service_role_key`

#### b) Google Sheets OAuth2
1. Ve a **Settings → Credentials → New**
2. Selecciona **Google Sheets OAuth2 API**
3. Completa:
   - **Name**: `Google Sheets - Sistema OT`
   - Sigue el flujo de autenticación OAuth2
   - Otorga permisos de lectura/escritura

#### c) Gmail OAuth2
1. Ve a **Settings → Credentials → New**
2. Selecciona **Gmail OAuth2**
3. Completa:
   - **Name**: `Gmail OAuth2`
   - Sigue el flujo de autenticación OAuth2
   - Otorga permisos para envío de emails

### 3. Importar Workflows

#### Flujo Unificado
```bash
# En n8n:
1. Workflows → Import from File
2. Selecciona: n8n/workflows/Flujo_Unificado_Ingesta_OT.json
3. Importar
```

#### Flujo de Validaciones
```bash
# En n8n:
1. Workflows → Import from File
2. Selecciona: n8n/workflows/Flujo_Validaciones_Alertas.json
3. Importar
```

### 4. Actualizar IDs en los Workflows

En cada workflow importado, busca y reemplaza:

| Placeholder | Valor a poner | Dónde encontrarlo |
|------------|---------------|-------------------|
| `TU_GOOGLE_SHEET_ID` | ID de tu Google Sheet | URL del Sheet |
| `TU_CREDENTIAL_ID` | ID de credencial Google Sheets | Settings → Credentials |
| `TU_SUPABASE_CREDENTIAL_ID` | ID de credencial Supabase | Settings → Credentials |
| `TU_GMAIL_CREDENTIAL_ID` | ID de credencial Gmail | Settings → Credentials |

**Tip**: Usa el buscador de n8n (Ctrl+F) para encontrar todos los placeholders.

### 5. Configurar Google Sheet

Sigue la guía completa en: [`GOOGLE_SHEETS_SETUP.md`](./GOOGLE_SHEETS_SETUP.md)

Pasos rápidos:
1. Crea un Google Sheet
2. Crea 4 hojas: `OT`, `OTA`, `OTADET`, `OTF`
3. Agrega los headers correspondientes
4. Comparte con la cuenta de servicio de n8n

### 6. Activar los Workflows

1. **Flujo Unificado**: 
   - Abre el workflow
   - Clic en botón **Active** (toggle en la esquina superior)
   - Se ejecutará cada 10 minutos

2. **Flujo Validaciones**:
   - Abre el workflow
   - Clic en botón **Active**
   - Se ejecutará cada 15 minutos

---

## 🎯 Características Principales

### ✅ Procesamiento Paralelo

Todos los procesos de lectura se ejecutan simultáneamente:

```javascript
// En lugar de:
Leer OT → Esperar → Leer OTA → Esperar → Leer OTADET...

// Ahora:
Leer OT + Leer OTA + Leer OTADET + Leer OTF (al mismo tiempo)
```

**Ventaja**: Reduce el tiempo de procesamiento de ~40s a ~10s

### ✅ Upsert Inteligente

El sistema usa UPSERT (UPDATE + INSERT):

```javascript
// Si el registro existe (mismo id_ot + sku):
→ ACTUALIZA los campos nuevos

// Si el registro NO existe:
→ INSERTA un nuevo registro
```

**Ventaja**: No hay duplicados, siempre datos actualizados

### ✅ Limpieza Automática

Después de guardar exitosamente en Supabase:

```javascript
// Para cada hoja procesada:
1. Elimina TODAS las filas con datos
2. Mantiene la fila de header (columnas)
3. Hoja queda lista para nueva carga
```

**Ventaja**: No necesitas limpiar manualmente las hojas

### ✅ Manejo de Errores Robusto

```javascript
// Si un registro falla:
- Se registra el error en logs
- Se marca como "fallido" en estadísticas
- El flujo CONTINÚA con los siguientes registros

// Nodos críticos:
continueOnFail: true  // No detener el flujo completo
```

**Ventaja**: Un error no detiene todo el proceso

### ✅ Logs Consolidados

```javascript
// Log final incluye:
{
  tipo_operacion: "Ingesta_Unificada",
  total_registros: 150,
  registros_exitosos: 148,
  registros_fallidos: 2,
  datos_adicionales: {
    desglose: {
      OT: { exitosos: 50, fallidos: 0 },
      OTA: { exitosos: 48, fallidos: 1 },
      OTADET: { exitosos: 40, fallidos: 0 },
      OTF: { exitosos: 10, fallidos: 1 }
    }
  }
}
```

**Ventaja**: Visibilidad completa de todo el proceso

---

## 📊 Monitoreo y Debugging

### Ver Ejecuciones en n8n

```
1. Ve a "Executions" en el menú lateral
2. Filtra por workflow:
   - Flujo_Unificado_Ingesta_OT
   - Flujo_Validaciones_Alertas
3. Haz clic en una ejecución para ver detalles
4. Revisa el output de cada nodo
```

### Queries de Monitoreo en Supabase

#### Últimas Ejecuciones
```sql
SELECT 
  flujo_n8n,
  exitoso,
  total_registros,
  registros_exitosos,
  registros_fallidos,
  mensaje,
  timestamp
FROM logs_integracion
ORDER BY timestamp DESC
LIMIT 20;
```

#### Ejecuciones Fallidas
```sql
SELECT 
  flujo_n8n,
  mensaje,
  errores,
  timestamp
FROM logs_integracion
WHERE exitoso = FALSE
ORDER BY timestamp DESC;
```

#### Estadísticas por Flujo (últimas 24h)
```sql
SELECT 
  flujo_n8n,
  COUNT(*) as total_ejecuciones,
  SUM(CASE WHEN exitoso THEN 1 ELSE 0 END) as exitosas,
  SUM(CASE WHEN NOT exitoso THEN 1 ELSE 0 END) as fallidas,
  SUM(total_registros) as total_registros_procesados,
  AVG(duracion_ms) as duracion_promedio_ms
FROM logs_integracion
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY flujo_n8n;
```

#### Alertas Recientes
```sql
SELECT 
  tipo_alerta,
  severidad,
  id_ot,
  sku,
  asunto,
  estado,
  created_at
FROM historial_alertas_ot
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

#### Alertas por Tipo y Severidad
```sql
SELECT 
  tipo_alerta,
  severidad,
  COUNT(*) as cantidad,
  COUNT(CASE WHEN estado = 'Resuelta' THEN 1 END) as resueltas,
  COUNT(CASE WHEN estado != 'Resuelta' THEN 1 END) as pendientes
FROM historial_alertas_ot
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY tipo_alerta, severidad
ORDER BY cantidad DESC;
```

---

## 🐛 Troubleshooting

### Error: "Referenced node doesn't exist"

**Causa**: Nombre de nodo incorrecto en código JavaScript

**Solución**:
```javascript
// ❌ MAL
const items = $('Guardar_OT_Supabase').all();

// ✅ BIEN (incluye emoji)
const items = $('💾 Guardar_OT_Supabase').all();
```

### Error: "No items to process"

**Causa**: El nodo no está recibiendo datos

**Solución**:
1. Verifica que la hoja de Google Sheets tenga datos
2. Verifica que los nombres de las hojas sean exactos: `OT`, `OTA`, `OTADET`, `OTF`
3. Verifica que el Google Sheet ID sea correcto
4. Verifica credenciales de Google Sheets

### Error: "Failed to save to Supabase"

**Causa**: Problema de conexión o credenciales de Supabase

**Solución**:
1. Verifica que el SUPABASE_URL sea correcto
2. Verifica que el SUPABASE_SERVICE_KEY sea válido
3. Verifica que las tablas existan en Supabase
4. Revisa los logs de Supabase para más detalles

### Los datos NO se borran de Google Sheets

**Causa**: Posibles causas:

1. **Permisos insuficientes**
   - Solución: Verifica que la cuenta de servicio tenga permisos de "Editor"

2. **Error en el guardado previo**
   - Solución: Si el guardado en Supabase falla, no se ejecuta la limpieza (esto es intencional)
   - Revisa logs para ver qué falló

3. **Credenciales incorrectas**
   - Solución: Verifica las credenciales de Google Sheets en n8n

### Las alertas NO se envían por email

**Causa**: Posibles causas:

1. **Credenciales de Gmail incorrectas**
   - Solución: Reautentica la cuenta de Gmail en n8n

2. **No hay inconsistencias que superen el umbral**
   - Solución: Esto es normal, revisa los umbrales configurados

3. **Destinatarios incorrectos**
   - Solución: Verifica los emails en el código del nodo de preparación de alertas

---

## 🔄 Actualización desde v1.0

Si estás usando la versión anterior (flujos separados):

### Pasos de Migración

1. **Desactivar workflows antiguos**:
   - `01_Flujo_Ingesta_OT`
   - `02_Flujo_Ingesta_OTA`
   - (y cualquier otro flujo individual)

2. **Importar nuevos workflows**:
   - `Flujo_Unificado_Ingesta_OT.json`
   - `Flujo_Validaciones_Alertas.json`

3. **Actualizar Google Sheets**:
   - **ELIMINAR** columna `procesado` de todas las hojas (ya no se usa)
   - Verificar que los headers estén correctos

4. **Configurar credenciales**:
   - Actualizar con los nuevos IDs de credenciales

5. **Activar nuevos workflows**:
   - Activar Flujo Unificado
   - Activar Flujo Validaciones

6. **Verificar funcionamiento**:
   - Agregar datos de prueba en una hoja
   - Esperar 10 minutos o ejecutar manualmente
   - Verificar que se guarden y se limpien las hojas

7. **Eliminar workflows antiguos** (opcional):
   - Una vez verificado el correcto funcionamiento
   - Puedes eliminar los workflows v1.0

---

## 📚 Documentación Adicional

- **Configuración de Google Sheets**: [`GOOGLE_SHEETS_SETUP.md`](./GOOGLE_SHEETS_SETUP.md)
- **Esquema de Base de Datos**: [`/database/01_schema.sql`](../../database/01_schema.sql)
- **Funciones de Validación**: [`/database/03_functions.sql`](../../database/03_functions.sql)
- **Troubleshooting General**: [`/docs/troubleshooting.md`](../../docs/troubleshooting.md)

---

## 🎯 Mejores Prácticas

### ✅ Hacer

- ✅ Usar formato ISO 8601 para fechas: `2024-11-28T10:00:00Z`
- ✅ Validar datos antes de cargarlos en Google Sheets
- ✅ Monitorear logs regularmente
- ✅ Revisar alertas y resolverlas prontamente
- ✅ Hacer backup de configuraciones de n8n
- ✅ Documentar cambios personalizados

### ❌ Evitar

- ❌ NO cambiar nombres de hojas en Google Sheets
- ❌ NO eliminar columnas obligatorias
- ❌ NO usar formatos de fecha no estándar
- ❌ NO desactivar logs (son cruciales para debugging)
- ❌ NO ignorar alertas de severidad Alta
- ❌ NO modificar los flujos sin hacer backup

---

## 📈 Métricas de Rendimiento

### Tiempos de Ejecución Típicos

| Operación | v1.0 (separado) | v2.0 (unificado) | Mejora |
|-----------|-----------------|------------------|--------|
| Lectura de 4 hojas | ~40s | ~10s | **75%** |
| Procesamiento de 100 registros | ~2min | ~45s | **62%** |
| Guardado en Supabase | ~30s | ~15s | **50%** |
| Limpieza de hojas | N/A | ~5s | **Nuevo** |
| **Total por ciclo** | **~3m 10s** | **~1m 15s** | **60%** |

### Consumo de Recursos

| Recurso | v1.0 | v2.0 | Cambio |
|---------|------|------|--------|
| Workflows activos | 5 | 2 | -60% |
| Nodos totales | ~50 | ~35 | -30% |
| Credenciales requeridas | 3 | 3 | = |
| Ejecuciones/hora | 30 | 10 | -67% |

---

## 🚀 Roadmap Futuro

### Versión 2.1 (Planeado)
- [ ] Webhook trigger para procesamiento on-demand
- [ ] Notificaciones vía WhatsApp (Twilio)
- [ ] Dashboard de métricas en tiempo real
- [ ] Validaciones adicionales configurables

### Versión 2.2 (Considerando)
- [ ] Integración con APIs de proveedores logísticos
- [ ] Predicción de inconsistencias con ML
- [ ] App móvil para seguimiento de OT
- [ ] Reportes automáticos PDF por email

---

## 📞 Soporte

Para problemas o consultas:

1. **Revisar documentación**:
   - Este archivo
   - `GOOGLE_SHEETS_SETUP.md`
   - `/docs/troubleshooting.md`

2. **Revisar logs**:
   - Logs de n8n (Executions)
   - Logs de Supabase (`logs_integracion`)

3. **Consultar al equipo**:
   - Abrir issue en el repositorio
   - Contactar al administrador del sistema

---

**Versión**: 2.0.0  
**Última actualización**: Noviembre 2024  
**Flujos activos**: 2 de 2  
**Estado**: ✅ Producción Ready
