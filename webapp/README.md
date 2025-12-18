# 📦 Sistema OT - Aplicación Web

Aplicación web para gestionar Órdenes de Transferencia sin depender de n8n.

## 🚀 Inicio Rápido

### 1. Instalar dependencias

```bash
cd webapp
npm install
```

### 2. Configurar variables de entorno

Copia el archivo de ejemplo y configura tus credenciales:

```bash
cp env.example .env
```

Edita `.env` con tus credenciales de Supabase:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key-aqui
PORT=3000
```

### 3. Iniciar el servidor

```bash
# Modo producción
npm start

# Modo desarrollo (con hot reload)
npm run dev
```

### 4. Abrir en el navegador

```
http://localhost:3000
```

## 📋 Funcionalidades

### Carga de Archivos

- **OT (Solicitud)**: Carga órdenes de transferencia nuevas
- **OTA (Preparación)**: Registra preparación de órdenes
- **OTADET (Detalle EAN)**: Registra detalle por código de barras
- **OTF (Recepción)**: Registra recepción final

### Características

- ✅ Drag & Drop para archivos
- ✅ Soporte CSV y Excel (XLSX, XLS)
- ✅ Descarga de plantillas de ejemplo
- ✅ Validación de campos obligatorios
- ✅ Lista predefinida de clientes
- ✅ Selector de OT pendientes
- ✅ Feedback visual de resultados
- ✅ Estadísticas en tiempo real

## 📊 Estructura de Archivos

### OT (Solicitud)

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| `id_ot` | ✅ | ID único de la orden |
| `sku` | ✅ | Código del producto |
| `cantidad_solicitada` | ✅ | Cantidad a transferir |
| `mlc` | ❌ | Código MercadoLibre |
| `cliente` | ❌ | Cliente asociado |
| `fecha_solicitud` | ❌ | Fecha de solicitud |
| `fecha_transferencia_comprometida` | ❌ | Fecha comprometida |

### OTA (Preparación)

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| `id_ot` | ✅ | ID de la orden |
| `sku` | ✅ | Código del producto |
| `cantidad_preparada` | ✅ | Cantidad preparada |
| `fecha_preparacion` | ❌ | Fecha de preparación |

### OTADET (Detalle EAN)

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| `id_ot` | ✅ | ID de la orden |
| `sku` | ✅ | Código del producto |
| `ean` | ✅ | Código de barras |
| `cantidad_preparada_ean` | ✅ | Cantidad por EAN |

### OTF (Recepción)

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| `id_ot` | ✅ | ID de la orden |
| `sku` | ✅ | Código del producto |
| `cantidad_recepcionada` | ✅ | Cantidad recibida |
| `fecha_recepcion` | ❌ | Fecha de recepción |

## 🏢 Clientes Válidos

- Ballerina
- Beiersdorf
- Bodyshop
- Bridgestone
- California Energy Drink
- Davis
- Elite Professional
- Faber Castell
- Ferretería La Reina
- Icb
- Mercado Carozzi
- Seis Luces
- Sika
- Smart Earth Camelina
- Softys
- Virutex - ILKO
- Carozzi Fs

## 🔧 API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/clientes` | Lista de clientes válidos |
| `GET` | `/api/ot-pendientes?tipo=OTA` | OT pendientes por tipo |
| `GET` | `/api/stats` | Estadísticas generales |
| `GET` | `/api/template/:tipo` | Descargar plantilla |
| `POST` | `/api/upload/ot` | Cargar archivo OT |
| `POST` | `/api/upload/ota` | Cargar archivo OTA |
| `POST` | `/api/upload/otadet` | Cargar archivo OTADET |
| `POST` | `/api/upload/otf` | Cargar archivo OTF |

## 🛠️ Stack Tecnológico

- **Backend**: Node.js + Express
- **Base de datos**: Supabase (PostgreSQL)
- **Frontend**: HTML5 + CSS3 + JavaScript Vanilla
- **Procesamiento**: csv-parse, xlsx

## 📁 Estructura del Proyecto

```
webapp/
├── server.js           # Servidor Express
├── package.json        # Dependencias
├── env.example         # Ejemplo de variables de entorno
├── README.md           # Esta documentación
└── public/
    ├── index.html      # Página principal
    ├── styles.css      # Estilos
    └── app.js          # Lógica del frontend
```

## 🔒 Seguridad

- Validación de tipos de archivo
- Límite de tamaño de archivo (10MB)
- Sanitización de datos de entrada
- Validación contra lista de clientes permitidos

## 📝 Notas

- La aplicación requiere que las tablas y funciones de Supabase estén creadas previamente
- Los archivos se procesan en memoria (no se guardan en disco)
- Los resultados de carga muestran detalle de errores por fila

