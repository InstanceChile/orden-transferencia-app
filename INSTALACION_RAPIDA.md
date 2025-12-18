# ⚡ Instalación Rápida - Sistema de Gestión de OT

## 🎯 Objetivo

Esta guía te permitirá tener el sistema funcionando en **menos de 30 minutos**.

---

## ✅ Checklist Previo

Antes de comenzar, asegúrate de tener:

- [ ] Cuenta de Supabase (crear en https://supabase.com)
- [ ] Cuenta de n8n Cloud (crear en https://n8n.cloud) o n8n self-hosted
- [ ] Cuenta de Google (para Sheets y Gmail)
- [ ] Acceso a este repositorio

---

## 🚀 Paso 1: Configurar Supabase (10 minutos)

### 1.1 Crear Proyecto

```bash
1. Ir a https://supabase.com
2. Click en "New Project"
3. Nombre: "Sistema-OT"
4. Contraseña de BD: [guardar en lugar seguro]
5. Región: Seleccionar la más cercana
6. Click en "Create new project"
7. Esperar 2-3 minutos a que se cree
```

### 1.2 Obtener Credenciales

```bash
1. Ir a Settings → API
2. Copiar:
   - Project URL: https://tu-proyecto.supabase.co
   - service_role key (NO la anon key)
3. Guardar en un archivo temporal
```

### 1.3 Ejecutar Scripts SQL

```bash
1. Ir a SQL Editor en Supabase
2. Click en "New query"
3. Copiar contenido de: database/01_schema.sql
4. Click en "Run"
5. Repetir para:
   - database/02_indexes.sql
   - database/03_functions.sql
   - database/04_sample_data.sql (opcional, solo para testing)
```

**Verificación**:
```sql
-- Ejecutar en SQL Editor:
SELECT COUNT(*) FROM transfer_orders;
-- Debe retornar 0 (o más si ejecutaste sample_data)
```

✅ **Supabase configurado**

---

## 🔧 Paso 2: Configurar n8n (10 minutos)

### 2.1 Crear Cuenta n8n Cloud

```bash
1. Ir a https://n8n.cloud
2. Registrarse con email
3. Confirmar email
4. Acceder al dashboard
```

### 2.2 Configurar Credenciales

#### Credencial 1: Supabase

```bash
1. En n8n, ir a Credentials → New
2. Buscar "HTTP Request"
3. Nombre: "Supabase - Sistema OT"
4. Authentication: Header Auth
5. Agregar dos headers:
   
   Header 1:
   - Name: apikey
   - Value: [tu_service_role_key]
   
   Header 2:
   - Name: Authorization
   - Value: Bearer [tu_service_role_key]

6. Save
```

#### Credencial 2: Google Sheets

```bash
1. En n8n, ir a Credentials → New
2. Buscar "Google Sheets OAuth2"
3. Nombre: "Google Sheets - Sistema OT"
4. Click en "Connect my account"
5. Seguir flujo de autenticación de Google
6. Aceptar permisos
7. Save
```

#### Credencial 3: Gmail

```bash
1. En n8n, ir a Credentials → New
2. Buscar "Gmail OAuth2"
3. Nombre: "Gmail - Sistema OT"
4. Click en "Connect my account"
5. Seguir flujo de autenticación
6. Aceptar permisos (enviar emails)
7. Save
```

### 2.3 Configurar Variables de Entorno

```bash
1. En n8n, ir a Settings → Variables
2. Agregar:
   - SUPABASE_URL: https://tu-proyecto.supabase.co
   - SUPABASE_SERVICE_KEY: [tu_service_role_key]
```

✅ **n8n configurado**

---

## 📊 Paso 3: Configurar Google Sheets (5 minutos)

### 3.1 Crear Google Sheet

```bash
1. Ir a https://sheets.google.com
2. Crear nuevo documento
3. Nombre: "Sistema OT - [Tu Empresa]"
```

### 3.2 Crear Pestañas

```bash
Renombrar pestañas (exactamente como se indica):
1. Pestaña 1 → "OT"
2. Pestaña 2 → "OTA"
3. Pestaña 3 → "OTADET"
4. Pestaña 4 → "OTF"
```

### 3.3 Agregar Encabezados

**Pestaña OT** (fila 1):
```
id_ot | fecha_solicitud | fecha_transferencia_comprometida | sku | mlc | cantidad_solicitada | procesado
```

**Pestaña OTA** (fila 1):
```
id_ot | fecha_preparacion | sku | cantidad_preparada | procesado
```

**Pestaña OTADET** (fila 1):
```
id_ot | sku | ean | cantidad_preparada_ean | procesado
```

**Pestaña OTF** (fila 1):
```
id_ot | fecha_recepcion | sku | cantidad_recepcionada | procesado
```

### 3.4 Obtener ID del Sheet

```bash
1. Copiar URL del Google Sheet
2. Extraer el ID (parte entre /d/ y /edit):
   
   URL: https://docs.google.com/spreadsheets/d/ABC123XYZ/edit
   ID: ABC123XYZ

3. Guardar este ID
```

✅ **Google Sheets configurado**

---

## 🔄 Paso 4: Importar Workflows n8n (5 minutos)

### 4.1 Importar Flujo 01

```bash
1. En n8n, ir a Workflows
2. Click en "Import from File"
3. Seleccionar: n8n/workflows/01_Flujo_Ingesta_OT.json
4. Click en "Import"
```

### 4.2 Actualizar Configuración

```bash
1. Abrir el workflow importado
2. Click en nodo "📊 Leer_Sheet_OT"
3. En "Document ID", reemplazar:
   TU_GOOGLE_SHEET_ID → [tu_sheet_id]
4. En "Credential", seleccionar: "Google Sheets - Sistema OT"
5. Guardar

6. Click en nodo "💾 Upsert_Supabase"
7. En "Credential", seleccionar: "Supabase - Sistema OT"
8. Guardar

9. Click en nodo "✅ Marcar_Procesado"
10. Repetir configuración de Sheet ID y Credential
11. Guardar
```

### 4.3 Activar Workflow

```bash
1. En la parte superior, activar el toggle (debe quedar verde)
2. El workflow se ejecutará cada 10 minutos
```

### 4.4 Repetir para Flujo 02

```bash
1. Importar: n8n/workflows/02_Flujo_Ingesta_OTA.json
2. Actualizar Sheet ID en todos los nodos de Google Sheets
3. Actualizar credenciales en todos los nodos
4. Actualizar credencial de Gmail en nodo de email
5. Activar workflow
```

✅ **Workflows importados y activos**

---

## 🧪 Paso 5: Probar el Sistema (5 minutos)

### 5.1 Agregar Datos de Prueba en Google Sheets

**En pestaña OT**, agregar:
```
id_ot       | fecha_solicitud | fecha_transferencia_comprometida | sku    | mlc       | cantidad_solicitada | procesado
TEST-001    | 2024-11-22     | 2024-11-27                       | SKU001 | MLC999001 | 100                 | 
```

### 5.2 Ejecutar Workflow Manualmente

```bash
1. En n8n, abrir "01 - 📥 Ingesta OT"
2. Click en "Execute Workflow"
3. Esperar a que termine (debe ser exitoso)
4. Verificar que la columna "procesado" en Google Sheets se marcó
```

### 5.3 Verificar en Supabase

```sql
-- En Supabase SQL Editor:
SELECT * FROM transfer_orders WHERE id_ot = 'TEST-001';

-- Debe retornar 1 registro con estado 'Solicitado'
```

### 5.4 Probar Flujo Completo

**Agregar en pestaña OTA**:
```
id_ot       | fecha_preparacion | sku    | cantidad_preparada | procesado
TEST-001    | 2024-11-23       | SKU001 | 90                 | 
```

**Ejecutar Flujo 02**:
```bash
1. En n8n, abrir "02 - 📥 Ingesta OTA"
2. Click en "Execute Workflow"
3. Debe generar una alerta (diferencia 10%)
4. Verificar email recibido
```

✅ **Sistema funcionando correctamente**

---

## 📧 Paso 6: Configurar Destinatarios de Alertas

### 6.1 Actualizar Emails en Supabase

```sql
-- En Supabase SQL Editor:
UPDATE configuracion 
SET valor = 'tu-email-abastecimiento@empresa.com' 
WHERE clave = 'email_abastecimiento';

UPDATE configuracion 
SET valor = 'tu-email-operaciones@empresa.com' 
WHERE clave = 'email_operaciones';

UPDATE configuracion 
SET valor = 'tu-email-full@empresa.com' 
WHERE clave = 'email_full';
```

### 6.2 Actualizar ID del Sheet

```sql
UPDATE configuracion 
SET valor = 'TU_SHEET_ID' 
WHERE clave = 'google_sheet_id';
```

✅ **Configuración completada**

---

## 🎉 ¡Listo!

Tu sistema está funcionando. Ahora puedes:

1. ✅ Registrar OT en Google Sheets
2. ✅ Registrar OTA y recibir alertas automáticas
3. ✅ Ver datos en Supabase en tiempo real
4. ✅ Revisar logs de ejecución en n8n

---

## 📋 Checklist Final

- [ ] Supabase configurado con todas las tablas
- [ ] n8n con credenciales configuradas
- [ ] Google Sheets con 4 pestañas y encabezados
- [ ] Flujo 01 importado y activo
- [ ] Flujo 02 importado y activo
- [ ] Prueba exitosa con datos de TEST
- [ ] Emails de alerta configurados
- [ ] Sistema funcionando automáticamente cada 10 min

---

## 🆘 Problemas Comunes

### "No se marca la columna procesado"

```bash
Solución:
1. Verificar que el workflow esté activo (toggle verde)
2. Verificar credenciales de Google Sheets
3. Ejecutar manualmente para ver errores
4. Revisar logs en n8n → Executions
```

### "No recibo emails de alerta"

```bash
Solución:
1. Verificar carpeta de spam
2. Verificar credencial de Gmail en n8n
3. Verificar que el flujo 02 esté activo
4. Revisar logs de ejecución
```

### "Error al conectar con Supabase"

```bash
Solución:
1. Verificar que usas service_role key (NO anon key)
2. Verificar URL de Supabase (sin /rest/v1 al final)
3. Test Connection en credencial
```

---

## 📞 Soporte

Si tienes problemas:

1. Revisar [Troubleshooting](docs/troubleshooting.md)
2. Revisar logs en n8n → Executions
3. Revisar logs en Supabase:
   ```sql
   SELECT * FROM logs_integracion 
   ORDER BY timestamp DESC 
   LIMIT 10;
   ```

---

## 📚 Próximos Pasos

Una vez que el sistema esté funcionando:

1. [ ] Leer [Guía de Usuario](docs/guia_usuario.md)
2. [ ] Capacitar a los equipos
3. [ ] Importar Flujos 03, 04 y 05 (cuando estén disponibles)
4. [ ] Configurar datos reales de productos en `pim_productos`

---

**Tiempo total estimado**: 30 minutos  
**Dificultad**: Media  
**Requisitos**: Acceso a internet y cuentas en los servicios mencionados

¡Éxito con tu implementación! 🚀

