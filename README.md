# 📦 Sistema de Gestión de Órdenes de Transferencia (OT)

## 🎯 Objetivo del Proyecto

Sistema automatizado para gestionar el ciclo completo de Órdenes de Transferencia entre Abastecimiento y Operaciones, con seguimiento de estados, validaciones automáticas y alertas por correo.

**Stack Tecnológico:**
- 📊 **Google Sheets**: Entrada de datos operativos
- 🔄 **n8n**: Orquestación y automatización de flujos
- 🗄️ **Supabase**: Base de datos PostgreSQL central
- 📧 **Gmail/SMTP**: Sistema de notificaciones

---

## 📋 Tabla de Contenidos

1. [Flujo Funcional](#flujo-funcional)
2. [Requisitos Previos](#requisitos-previos)
3. [Instalación](#instalación)
4. [Configuración](#configuración)
5. [Estructura del Proyecto](#estructura-del-proyecto)
6. [Estados de las OT](#estados-de-las-ot)
7. [Flujos n8n](#flujos-n8n)
8. [Sistema de Alertas](#sistema-de-alertas)
9. [Troubleshooting](#troubleshooting)

---

## 🔄 Flujo Funcional

### Etapas del Proceso

```
1. OT (Orden de Transferencia)
   ↓ Abastecimiento registra solicitud
   Estado: "Solicitado"

2. OTA (Orden de Transferencia Activa)
   ↓ Operaciones registra preparación
   Estado: "Preparado" → "Preparacion_Validada"
   ⚠️ Alerta si diferencia > 2%

3. OTADET (Detalle por EAN)
   ↓ Operaciones registra detalle
   ⚠️ Alerta si hay inconsistencias con PIM

4. OTF (Orden de Transferencia Full)
   ↓ Full registra recepción
   Estado: "Entregado_Sin_Novedad" o "Entregado_con_Novedad"
   ⚠️ Alerta si hay diferencias
```

---

## 📦 Requisitos Previos

### Cuentas y Servicios

- [ ] Cuenta de **Supabase** (Free tier es suficiente para empezar)
- [ ] Cuenta de **n8n** (Cloud $20/mes o self-hosted)
- [ ] Cuenta de **Google** (para Sheets y Gmail)
- [ ] **Node.js** 18+ (si usas n8n self-hosted)

### Conocimientos Recomendados

- SQL básico (para entender las tablas)
- JSON (para configurar n8n)
- Conceptos de API REST

---

## 🚀 Instalación

### Paso 1: Configurar Supabase

1. Crea un nuevo proyecto en [Supabase](https://supabase.com)
2. Copia tu **Project URL** y **API Key (service_role)**
3. Ejecuta los scripts SQL en el siguiente orden:

```bash
# En el SQL Editor de Supabase:
1. database/01_schema.sql          # Crear tablas
2. database/02_indexes.sql         # Crear índices
3. database/03_functions.sql       # Crear funciones
4. database/04_sample_data.sql     # (Opcional) Datos de prueba
```

### Paso 2: Configurar Google Sheets

1. Crea una copia de la plantilla: `plantillas/Plantilla_OT_Completa.xlsx`
2. Comparte el Sheet con permisos de edición para tu equipo
3. Copia el **ID del Google Sheet** (está en la URL)

### Paso 3: Configurar n8n

#### Opción A: n8n Cloud

1. Crea cuenta en [n8n.cloud](https://n8n.cloud)
2. Importa los workflows desde `n8n/workflows/`

#### Opción B: n8n Self-hosted

```bash
# Instalar n8n globalmente
npm install n8n -g

# Iniciar n8n
n8n start

# Acceder a http://localhost:5678
```

### Paso 4: Configurar Credenciales en n8n

1. **Supabase**
   - Tipo: HTTP Request
   - URL Base: `https://tu-proyecto.supabase.co/rest/v1`
   - Headers:
     - `apikey`: tu_service_role_key
     - `Authorization`: Bearer tu_service_role_key

2. **Google Sheets**
   - Tipo: Google Sheets OAuth2
   - Seguir flujo de autenticación

3. **Gmail**
   - Tipo: Gmail OAuth2
   - Scopes: `https://www.googleapis.com/auth/gmail.send`

### Paso 5: Importar Workflows

1. En n8n, ir a **Workflows** → **Import from File**
2. Importar en orden:
   - `01_Flujo_Ingesta_OT.json`
   - `02_Flujo_Ingesta_OTA.json`
   - `03_Flujo_Ingesta_OTADET.json`
   - `04_Flujo_Ingesta_OTF.json`
   - `05_Flujo_Cierre_Novedad.json`

3. Actualizar credenciales en cada workflow

### Paso 6: Configurar Triggers

Cada workflow puede ejecutarse:
- **On-demand**: Manual
- **Scheduled**: Cron (ej: cada 10 minutos)
- **Webhook**: Desde Google Sheets (Apps Script)

Recomendación inicial: **Scheduled cada 10 minutos**

---

## ⚙️ Configuración

### Variables de Entorno (n8n)

Si usas n8n self-hosted, crea archivo `.env`:

```env
# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_KEY=tu_service_role_key

# Google Sheets
GOOGLE_SHEET_ID=tu_sheet_id

# Notificaciones
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_app_password

# Destinatarios de Alertas
ALERT_EMAIL_ABASTECIMIENTO=abastecimiento@empresa.com
ALERT_EMAIL_OPERACIONES=operaciones@empresa.com
ALERT_EMAIL_FULL=full@empresa.com
```

### Configuración de Umbrales

Edita en `database/config.sql`:

```sql
-- Umbral de diferencia aceptable OT vs OTA
UPDATE configuracion SET valor = '0.02' WHERE clave = 'umbral_diferencia_preparacion';

-- Umbral de diferencia aceptable OTA vs OTF
UPDATE configuracion SET valor = '0.05' WHERE clave = 'umbral_diferencia_recepcion';
```

---

## 📁 Estructura del Proyecto

```
Flujo_Orden_Traslado/
├── README.md                          # Este archivo
├── CHANGELOG.md                       # Historial de cambios
├── .gitignore                         # Archivos a ignorar
│
├── database/                          # Scripts SQL
│   ├── 01_schema.sql                 # Definición de tablas
│   ├── 02_indexes.sql                # Índices para performance
│   ├── 03_functions.sql              # Funciones y stored procedures
│   ├── 04_sample_data.sql            # Datos de prueba
│   └── diagrams/                     # Diagramas ER
│       └── schema_diagram.png
│
├── n8n/                              # Workflows de n8n
│   ├── workflows/                    # JSON exportables
│   │   ├── 01_Flujo_Ingesta_OT.json
│   │   ├── 02_Flujo_Ingesta_OTA.json
│   │   ├── 03_Flujo_Ingesta_OTADET.json
│   │   ├── 04_Flujo_Ingesta_OTF.json
│   │   └── 05_Flujo_Cierre_Novedad.json
│   │
│   └── docs/                         # Documentación de flujos
│       ├── flujo_01_ot.md
│       ├── flujo_02_ota.md
│       ├── flujo_03_otadet.md
│       ├── flujo_04_otf.md
│       └── flujo_05_cierre.md
│
├── plantillas/                       # Plantillas de Google Sheets
│   ├── Plantilla_OT_Completa.xlsx
│   └── Plantilla_Gestion_Novedades.xlsx
│
├── notificaciones/                   # Plantillas de emails
│   ├── templates/
│   │   ├── alerta_ot_ota.html
│   │   ├── alerta_otadet_pim.html
│   │   └── alerta_ota_otf.html
│   └── ejemplos/
│       └── ejemplos_emails.md
│
├── docs/                             # Documentación adicional
│   ├── guia_usuario.md              # Guía para usuarios finales
│   ├── guia_tecnica.md              # Guía para desarrolladores
│   ├── mejores_practicas.md         # Tips y lecciones aprendidas
│   └── troubleshooting.md           # Solución de problemas comunes
│
└── scripts/                          # Scripts auxiliares
    ├── backup_supabase.sh           # Backup de BD
    └── test_conexion.js             # Test de conectividad
```

---

## 🔄 Estados de las OT

### Estados por OT + SKU

| Estado | Descripción | Transición desde |
|--------|-------------|------------------|
| `Solicitado` | OT registrada por Abastecimiento | - |
| `Preparado` | OTA registrada por Operaciones | Solicitado |
| `Preparacion_Validada` | OTA validada (diferencia ≤ 2%) | Preparado |
| `Entregado_Sin_Novedad` | OTF coincide con OTA | Preparacion_Validada |
| `Entregado_con_Novedad` | OTF difiere de OTA | Preparacion_Validada |
| `Entregado_con_Novedad_Resuelto` | Novedad analizada y cerrada | Entregado_con_Novedad |

### Diagrama de Estados

```
┌─────────────┐
│ Solicitado  │
└──────┬──────┘
       │ OTA registrada
       ▼
┌─────────────┐
│  Preparado  │
└──────┬──────┘
       │ Validación
       ▼
┌────────────────────────┐
│ Preparacion_Validada   │
└───────────┬────────────┘
            │ OTF registrada
            ▼
    ┌───────────────┐
    │  ¿Diferencias? │
    └───┬───────┬───┘
        │       │
    No  │       │ Sí
        ▼       ▼
┌─────────────────────┐  ┌─────────────────────────┐
│ Entregado_Sin_      │  │ Entregado_con_Novedad   │
│ Novedad             │  └────────────┬────────────┘
└─────────────────────┘               │ Resolución
                                      ▼
                        ┌──────────────────────────────┐
                        │ Entregado_con_Novedad_       │
                        │ Resuelto                     │
                        └──────────────────────────────┘
```

---

## 🔧 Flujos n8n

### Flujo 1: Ingesta OT (Solicitud)

**Trigger**: Scheduled (cada 10 min) o Webhook  
**Función**: Registrar nuevas OT desde Google Sheets

**Nodos principales:**
1. 🕐 Disparador (Cron o Webhook)
2. 📊 Leer Google Sheet (pestaña OT)
3. 🔍 Filtrar registros no procesados
4. 💾 Upsert en Supabase (transfer_orders)
5. ✅ Marcar como procesado en Sheet
6. 📝 Registrar log

### Flujo 2: Ingesta OTA (Preparación)

**Trigger**: Scheduled (cada 10 min)  
**Función**: Registrar OTA y validar contra OT

**Nodos principales:**
1. 🕐 Disparador
2. 📊 Leer Google Sheet (pestaña OTA)
3. 💾 Upsert en transfer_orders
4. 🔍 Validar diferencias OT vs OTA
5. ⚠️ Generar alerta si diferencia > 2%
6. 📧 Enviar email si hay alertas
7. 📝 Registrar log

### Flujo 3: Ingesta OTADET (Detalle EAN)

**Trigger**: Scheduled (cada 10 min)  
**Función**: Registrar detalle por EAN y validar contra PIM

**Nodos principales:**
1. 🕐 Disparador
2. 📊 Leer Google Sheet (pestaña OTADET)
3. 💾 Upsert en transfer_orders_detalle_ean
4. 🔍 Validar contra PIM (EAN faltantes/sobrantes)
5. ⚠️ Generar alerta si hay inconsistencias
6. 📧 Enviar email si hay alertas
7. 📝 Registrar log

### Flujo 4: Ingesta OTF (Recepción)

**Trigger**: Scheduled (cada 10 min)  
**Función**: Registrar OTF y validar contra OTA

**Nodos principales:**
1. 🕐 Disparador
2. 📊 Leer Google Sheet (pestaña OTF)
3. 💾 Upsert en transfer_orders
4. 🔍 Validar diferencias OTA vs OTF
5. ⚠️ Determinar estado final (con/sin novedad)
6. 📧 Enviar email si hay novedades
7. 📝 Registrar log

### Flujo 5: Cierre de Novedad

**Trigger**: Manual o Scheduled  
**Función**: Marcar novedades como resueltas

**Nodos principales:**
1. 🕐 Disparador
2. 📊 Leer Sheet de gestión de novedades
3. 💾 Actualizar estado a "Resuelto"
4. 📝 Registrar en historial
5. 📧 Notificar cierre (opcional)

---

## 📧 Sistema de Alertas

### Alerta 1: Diferencias OT vs OTA (> 2%)

**Destinatarios**: Abastecimiento + Operaciones  
**Asunto**: `🚨 [ALERTA OT] Diferencia en preparación vs solicitud – OT {{id_ot}}`

**Contenido**:
- ID_OT y SKU afectado
- Cantidad solicitada vs preparada
- % de diferencia
- Acción sugerida

### Alerta 2: Inconsistencias OTADET vs PIM

**Destinatarios**: Operaciones  
**Asunto**: `⚠️ [ALERTA OTADET] Descuadre EAN vs PIM – OT {{id_ot}}`

**Contenido**:
- ID_OT y SKU afectado
- EAN faltantes
- EAN sobrantes
- Diferencias de cantidad por EAN

### Alerta 3: Diferencias OTA vs OTF

**Destinatarios**: Operaciones + Full  
**Asunto**: `🚨 [ALERTA OTF] Descuadre recepción vs preparación – OT {{id_ot}}`

**Contenido**:
- ID_OT y SKU afectado
- Cantidad preparada vs recepcionada
- % de diferencia
- Sugerencia de revisión

---

## 🐛 Troubleshooting

### Problema: Workflows no se ejecutan

**Solución**:
1. Verificar que los triggers estén activos
2. Revisar logs en n8n (Executions)
3. Verificar credenciales de Google Sheets y Supabase

### Problema: No se envían emails

**Solución**:
1. Verificar OAuth2 de Gmail está autorizado
2. Revisar límites de Gmail (500/día)
3. Verificar destinatarios en configuración
4. Revisar logs de ejecución

### Problema: Datos no se guardan en Supabase

**Solución**:
1. Verificar API Key (service_role)
2. Revisar permisos de tablas (RLS policies)
3. Verificar formato de datos (mayúsculas/minúsculas)
4. Revisar constraints de BD

### Problema: Alertas duplicadas

**Solución**:
1. Verificar que se marcan registros como procesados
2. Revisar filtros en queries SQL
3. Verificar estados de OT

### Problema: Performance lenta

**Solución**:
1. Verificar índices en Supabase
2. Agregar filtros en queries (no traer todo)
3. Limitar resultados con LIMIT
4. Revisar plan de Supabase (Free tier tiene límites)

---

## 📊 Monitoreo y Logs

### Tabla de Logs en Supabase

Todos los flujos registran en `logs_integracion`:

```sql
SELECT 
  tipo_operacion,
  exitoso,
  total_registros,
  registros_exitosos,
  registros_fallidos,
  timestamp
FROM logs_integracion
ORDER BY timestamp DESC
LIMIT 50;
```

### Dashboard de Monitoreo

Queries útiles para monitoreo:

```sql
-- OT por estado
SELECT estado, COUNT(*) as total
FROM transfer_orders
GROUP BY estado;

-- Novedades pendientes
SELECT COUNT(*) as total_novedades
FROM transfer_orders
WHERE tiene_novedad = true 
  AND estado != 'Entregado_con_Novedad_Resuelto';

-- Logs de errores últimas 24h
SELECT *
FROM logs_integracion
WHERE exitoso = false
  AND timestamp > NOW() - INTERVAL '24 hours';
```

---

## 💰 Costos Estimados

### Proyecto Pequeño (< 500 OT/mes)
- n8n Cloud: $20/mes
- Supabase Free: $0
- Gmail: $0
- **Total: $20/mes**

### Proyecto Mediano (< 2000 OT/mes)
- n8n Cloud: $20/mes
- Supabase Pro: $25/mes
- Gmail: $0
- **Total: $45/mes**

### Proyecto Grande (> 5000 OT/mes)
- n8n Self-hosted: $10/mes (servidor)
- Supabase Pro: $25/mes
- SendGrid: $15/mes
- **Total: $50/mes**

---

## 🤝 Soporte y Contribuciones

### Documentación Adicional

- [Guía de Usuario](docs/guia_usuario.md) - Para usuarios finales
- [Guía Técnica](docs/guia_tecnica.md) - Para desarrolladores
- [Mejores Prácticas](docs/mejores_practicas.md) - Tips y lecciones aprendidas

### Contacto

Para soporte técnico, consultar:
1. [Troubleshooting](docs/troubleshooting.md)
2. Logs en Supabase
3. Ejecuciones en n8n

---

## 📝 Licencia

Este proyecto es de uso interno. Todos los derechos reservados.

---

**Versión**: 1.0.0  
**Última actualización**: Noviembre 2024  
**Mantenido por**: Equipo de Desarrollo

