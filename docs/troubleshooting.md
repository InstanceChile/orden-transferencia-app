# 🔧 Troubleshooting - Solución de Problemas

## Guía de Solución de Problemas Comunes

Esta guía te ayudará a resolver los problemas más frecuentes del sistema.

---

## 📊 Problemas con Google Sheets

### Problema 1: La columna "procesado" no se marca

**Síntomas**:
- Registré datos hace más de 15 minutos
- La columna `procesado` sigue en blanco (☐)

**Causas posibles**:
1. Datos incompletos (falta `id_ot` o `sku`)
2. Workflow de n8n detenido
3. Credenciales de Google Sheets expiradas

**Soluciones**:

```
✅ Paso 1: Verificar datos
- Revisar que id_ot y sku no estén vacíos
- Revisar que las cantidades sean números válidos
- Revisar que las fechas tengan formato correcto

✅ Paso 2: Verificar workflow n8n
- Ir a n8n → Workflows → Verificar que esté "Active"
- Si está inactivo, activarlo

✅ Paso 3: Revisar logs
- Ir a n8n → Executions
- Buscar errores en las últimas ejecuciones
```

---

### Problema 2: Error "Permission denied" al editar Sheet

**Síntomas**:
- No puedo editar celdas en Google Sheets
- Mensaje: "No tienes permiso para editar"

**Soluciones**:

```
✅ Solicitar permisos de Editor
1. Contactar al administrador del Sheet
2. Solicitar permisos de "Editor" (no solo "Viewer")

✅ Verificar que estás en la cuenta correcta
1. Verificar email en esquina superior derecha
2. Cambiar de cuenta si es necesario
```

---

### Problema 3: Datos no aparecen en Supabase

**Síntomas**:
- Registré datos en Google Sheets
- La columna `procesado` está marcada (☑)
- Pero los datos no aparecen en Supabase

**Soluciones**:

```
✅ Verificar conexión a Supabase
1. Ir a n8n → Credentials → Supabase
2. Test Connection
3. Si falla, actualizar API Key

✅ Revisar logs de n8n
1. Ir a Executions
2. Buscar el workflow correspondiente
3. Revisar nodo "Upsert Supabase"
4. Ver mensaje de error

✅ Verificar en Supabase
1. Ir a Supabase → Table Editor
2. Buscar por id_ot en transfer_orders
3. Si no existe, revisar logs_integracion
```

---

## 📧 Problemas con Notificaciones

### Problema 4: No recibo alertas por email

**Síntomas**:
- Hay diferencias que deberían generar alertas
- No recibo emails

**Soluciones**:

```
✅ Verificar carpeta de spam
1. Revisar carpeta de spam/correo no deseado
2. Marcar como "No es spam" si está ahí

✅ Verificar destinatarios configurados
1. Ir a Supabase → configuracion table
2. Verificar emails en:
   - email_abastecimiento
   - email_operaciones
   - email_full

✅ Verificar workflow de alertas
1. Ir a n8n → Workflow de OTA/OTF
2. Revisar nodo de Gmail
3. Verificar credenciales OAuth2

✅ Verificar límites de Gmail
1. Gmail tiene límite de 500 emails/día
2. Revisar en Executions si hay error "Quota exceeded"
```

---

### Problema 5: Emails llegan sin formato

**Síntomas**:
- Recibo el email pero sin colores ni formato
- Aparece como texto plano

**Soluciones**:

```
✅ Verificar cliente de email
1. Algunos clientes bloquean HTML
2. Probar abrir en Gmail web
3. Verificar configuración de "Mostrar imágenes"

✅ Verificar configuración en n8n
1. Ir al nodo Gmail
2. Verificar que Email Type = "HTML"
3. No debe ser "Text"
```

---

## 🔄 Problemas con Flujos n8n

### Problema 6: Workflow no se ejecuta automáticamente

**Síntomas**:
- El workflow está activo
- Pero no se ejecuta cada 10 minutos

**Soluciones**:

```
✅ Verificar trigger
1. Abrir workflow
2. Verificar nodo "Disparador"
3. Debe ser "Schedule Trigger"
4. Interval: 10 minutes

✅ Verificar estado del workflow
1. En lista de workflows, debe aparecer toggle verde
2. Si está gris, activarlo

✅ Ejecutar manualmente para probar
1. Abrir workflow
2. Click en "Execute Workflow"
3. Revisar si funciona manualmente
```

---

### Problema 7: Error "Referenced node doesn't exist"

**Síntomas**:
- Workflow falla con error
- Mensaje: "Referenced node 'Nombre_Nodo' doesn't exist"

**Soluciones**:

```
✅ Verificar nombres de nodos
1. Abrir nodo Code que genera el error
2. Buscar referencias como $('Nombre_Nodo')
3. Verificar que el nombre sea exacto (incluyendo emojis)

✅ Usar $input en lugar de referencias
1. Cambiar $('Nombre_Nodo').all()
2. Por $input.all()
```

---

### Problema 8: Nodo no procesa todos los items

**Síntomas**:
- Tengo 10 registros en Google Sheets
- Solo se procesa el primero

**Soluciones**:

```
✅ Verificar "Execute Once"
1. Click en nodo problemático
2. Ir a Settings
3. Verificar que "Execute Once" esté OFF (desactivado)

✅ Verificar que el nodo anterior retorna array
1. Revisar nodo anterior
2. Debe retornar múltiples items, no solo uno
```

---

## 🗄️ Problemas con Supabase

### Problema 9: Error "Constraint violation"

**Síntomas**:
- Error al insertar datos
- Mensaje: "violates check constraint"

**Soluciones**:

```
✅ Verificar valores de estado
1. El campo "estado" solo acepta valores específicos:
   - Solicitado
   - Preparado
   - Preparacion_Validada
   - Entregado_Sin_Novedad
   - Entregado_con_Novedad
   - Entregado_con_Novedad_Resuelto

✅ Verificar cantidades
1. Todas las cantidades deben ser >= 0
2. No pueden ser negativas

✅ Verificar unicidad
1. No puede haber dos registros con mismo id_ot + sku
2. Si existe, se debe hacer UPDATE, no INSERT
```

---

### Problema 10: Datos duplicados en Supabase

**Síntomas**:
- Mismo id_ot + sku aparece múltiples veces
- Debería ser único

**Soluciones**:

```
✅ Usar función upsert_transfer_order
1. En n8n, usar RPC call a upsert_transfer_order
2. No usar INSERT directo
3. La función maneja automáticamente INSERT o UPDATE

✅ Limpiar duplicados
1. Ejecutar en Supabase SQL Editor:

DELETE FROM transfer_orders
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY id_ot, sku 
      ORDER BY created_at DESC
    ) as rn
    FROM transfer_orders
  ) t
  WHERE t.rn > 1
);
```

---

## 🔐 Problemas de Autenticación

### Problema 11: Credenciales de Google expiradas

**Síntomas**:
- Error: "Invalid credentials"
- Workflow falla al leer Google Sheets

**Soluciones**:

```
✅ Re-autenticar OAuth2
1. Ir a n8n → Credentials
2. Buscar "Google Sheets OAuth2"
3. Click en "Reconnect"
4. Seguir flujo de autenticación
5. Guardar

✅ Verificar permisos
1. Al re-autenticar, verificar que se soliciten permisos de:
   - Ver y editar hojas de cálculo
```

---

### Problema 12: API Key de Supabase inválida

**Síntomas**:
- Error: "Invalid API key"
- No se pueden leer/escribir datos en Supabase

**Soluciones**:

```
✅ Verificar API Key
1. Ir a Supabase → Settings → API
2. Copiar "service_role" key (NO la "anon" key)
3. Ir a n8n → Credentials → Supabase
4. Actualizar API Key
5. Test Connection

✅ Verificar URL de Supabase
1. Debe ser: https://tu-proyecto.supabase.co
2. Sin /rest/v1 al final
```

---

## 📊 Problemas de Performance

### Problema 13: Workflow muy lento

**Síntomas**:
- Workflow tarda más de 5 minutos
- Timeout errors

**Soluciones**:

```
✅ Limitar registros procesados
1. En nodo Google Sheets, agregar filtro
2. Solo procesar registros con procesado = FALSE
3. Agregar LIMIT en queries a Supabase

✅ Verificar índices en Supabase
1. Ejecutar: database/02_indexes.sql
2. Verificar que existan índices en:
   - estado
   - id_ot
   - fecha_ultimo_cambio_estado

✅ Procesar en lotes
1. Usar "Split In Batches"
2. Batch size: 100 registros
```

---

## 🧪 Cómo Reportar un Problema

Si no encuentras solución aquí, reporta el problema con esta información:

### Información a Incluir

```
1. Descripción del problema
   - ¿Qué estabas intentando hacer?
   - ¿Qué esperabas que pasara?
   - ¿Qué pasó en realidad?

2. Pasos para reproducir
   - Paso 1: ...
   - Paso 2: ...
   - Paso 3: ...

3. Datos de ejemplo
   - id_ot: ...
   - sku: ...
   - Valores ingresados: ...

4. Capturas de pantalla
   - Error en n8n
   - Datos en Google Sheets
   - Error en Supabase (si aplica)

5. Logs
   - Execution ID en n8n
   - Timestamp del error
   - Mensaje de error completo
```

### Dónde Reportar

- **Email**: it@empresa.com
- **Asunto**: [Sistema OT] Descripción breve del problema

---

## 📚 Recursos Adicionales

- [Guía de Usuario](guia_usuario.md) - Para usuarios finales
- [Guía Técnica](guia_tecnica.md) - Para desarrolladores
- [README Principal](../README.md) - Documentación general

---

## 🔍 Logs y Monitoreo

### Ver Logs en n8n

```
1. Ir a n8n
2. Click en "Executions" (menú lateral)
3. Filtrar por:
   - Workflow específico
   - Failed/Success
   - Fecha
4. Click en ejecución para ver detalles
5. Revisar cada nodo para ver input/output
```

### Ver Logs en Supabase

```sql
-- Últimos 50 logs
SELECT * FROM logs_integracion 
ORDER BY timestamp DESC 
LIMIT 50;

-- Logs con errores
SELECT * FROM logs_integracion 
WHERE exitoso = FALSE 
ORDER BY timestamp DESC;

-- Logs de un flujo específico
SELECT * FROM logs_integracion 
WHERE flujo_n8n = 'Flujo_01_Ingesta_OT' 
ORDER BY timestamp DESC 
LIMIT 20;

-- Logs de las últimas 24 horas
SELECT * FROM logs_integracion 
WHERE timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;
```

---

**Versión**: 1.0.0  
**Última actualización**: Noviembre 2024  
**Mantenido por**: Equipo de IT

