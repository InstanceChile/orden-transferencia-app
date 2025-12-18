# 🚂 Guía de Despliegue en Railway

Esta guía te llevará paso a paso para desplegar la aplicación web de Órdenes de Transferencia en Railway.

## 📋 Requisitos Previos

- ✅ Cuenta de GitHub (gratuita)
- ✅ Cuenta de Railway (gratuita - plan Hobby)
- ✅ Tu proyecto ya tiene Supabase configurado

---

## 🎯 Paso 1: Preparar el Proyecto en GitHub

### 1.1 Crear Repositorio en GitHub

1. Ve a [github.com](https://github.com) e inicia sesión
2. Haz clic en **"New repository"** (botón verde)
3. Configura:
   - **Repository name**: `orden-transferencia-app` (o el nombre que prefieras)
   - **Visibility**: Puedes elegir `Private` (privado)
   - **NO** marques "Add a README file"
4. Haz clic en **"Create repository"**

### 1.2 Subir tu Código

Abre PowerShell en la carpeta del proyecto y ejecuta estos comandos:

```powershell
# Navegar a la carpeta webapp
cd webapp

# Inicializar Git (si no lo has hecho)
git init

# Agregar todos los archivos
git add .

# Crear el primer commit
git commit -m "Initial commit - Sistema OT"

# Conectar con tu repositorio de GitHub
git remote add origin https://github.com/TU_USUARIO/orden-transferencia-app.git

# Subir el código
git branch -M main
git push -u origin main
```

> ⚠️ **IMPORTANTE**: Reemplaza `TU_USUARIO` con tu nombre de usuario de GitHub.

### 1.3 Verificar que .env NO se suba

Asegúrate de que existe un archivo `.gitignore` en la carpeta `webapp/` con:

```
node_modules/
.env
*.log
```

Si no existe, créalo antes de hacer el push.

---

## 🚂 Paso 2: Crear Cuenta en Railway

1. Ve a [railway.app](https://railway.app)
2. Haz clic en **"Start a New Project"**
3. Selecciona **"Sign in with GitHub"**
4. Autoriza Railway para acceder a tu cuenta de GitHub
5. Confirma tu email si te lo pide

---

## 🔧 Paso 3: Crear Proyecto en Railway

### 3.1 Conectar Repositorio

1. En el dashboard de Railway, haz clic en **"New Project"**
2. Selecciona **"Deploy from GitHub repo"**
3. Si es la primera vez, haz clic en **"Configure GitHub App"**
4. Selecciona tu repositorio `orden-transferencia-app`
5. Haz clic en **"Deploy"**

### 3.2 Configurar Variables de Entorno

Railway detectará que es una app Node.js. Ahora debes configurar las variables de entorno:

1. Haz clic en tu proyecto desplegado
2. Ve a la pestaña **"Variables"**
3. Haz clic en **"+ New Variable"** y agrega:

| Variable | Valor |
|----------|-------|
| `SUPABASE_URL` | `https://mjvljlaljgzascfpogtr.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qdmxqbGFsamd6YXNjZnBvZ3RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MDA0ODksImV4cCI6MjA3NjI3NjQ4OX0._iRB7sPiE66xI2nsPCOmZg7e6tvxTKzHKOez8qr8kyY` |
| `PORT` | `3000` |

> 💡 **Nota**: Railway automáticamente asigna el puerto, pero es bueno definirlo.

### 3.3 Configurar Comando de Inicio

Railway normalmente detecta el comando `npm start` automáticamente. Si no:

1. Ve a **"Settings"**
2. En **"Build Command"** escribe: `npm install`
3. En **"Start Command"** escribe: `npm start`

---

## 🌐 Paso 4: Obtener tu URL Pública

### 4.1 Generar Dominio

1. En tu proyecto, ve a la pestaña **"Settings"**
2. Busca la sección **"Networking"** o **"Domains"**
3. Haz clic en **"Generate Domain"**
4. Railway te dará una URL como: `orden-transferencia-app-production.up.railway.app`

### 4.2 Configurar Dominio Personalizado (Opcional)

Si quieres usar `ot.cleveradmin.cl`:

1. En **"Domains"**, haz clic en **"+ Custom Domain"**
2. Escribe: `ot.cleveradmin.cl`
3. Railway te mostrará un registro **CNAME** que debes agregar

Luego, en tu proveedor de DNS (donde tienes `cleveradmin.cl`):

1. Crea un registro **CNAME**:
   - **Nombre/Host**: `ot`
   - **Valor/Target**: El valor que Railway te dio (ej: `orden-transferencia-app-production.up.railway.app`)
   - **TTL**: 300 o Auto

2. Espera 5-10 minutos para propagación DNS
3. Railway detectará el dominio y generará certificado SSL automáticamente

---

## ✅ Paso 5: Verificar el Despliegue

### 5.1 Probar la Aplicación

1. Abre tu URL de Railway en el navegador
2. Deberías ver la interfaz de carga de archivos
3. Haz clic en la pestaña "OT (Solicitud)"
4. Descarga una plantilla de prueba
5. Súbela para verificar que la conexión a Supabase funciona

### 5.2 Verificar Logs

Si algo no funciona:

1. En Railway, ve a tu proyecto
2. Haz clic en **"Deployments"**
3. Selecciona el deployment actual
4. Haz clic en **"View Logs"**
5. Busca errores en rojo

---

## 🔄 Paso 6: Actualizar la Aplicación

Cada vez que hagas cambios en tu código local:

```powershell
# En la carpeta webapp
git add .
git commit -m "Descripción del cambio"
git push
```

Railway detectará el push y desplegará automáticamente la nueva versión.

---

## 💰 Costos de Railway

### Plan Gratuito (Hobby)
- **$5 de crédito gratis al mes**
- Suficiente para ~500 horas de ejecución
- Una app pequeña como esta usa ~$2-3/mes
- Ideal para proyectos pequeños/medianos

### Plan Pro ($20/mes)
- Recursos ilimitados
- Mejor para producción intensiva

---

## 🛠️ Troubleshooting

### Error: "No start command found"

**Solución**: Asegúrate de que `package.json` tiene:
```json
"scripts": {
  "start": "node server.js"
}
```

### Error: "Cannot connect to Supabase"

**Verificar**:
1. Las variables de entorno están correctamente configuradas
2. La URL de Supabase no tiene espacios extra
3. La key de Supabase está completa

### Error: "Port already in use"

**Solución**: En Railway, elimina la variable PORT o asegúrate de que tu código usa:
```javascript
const PORT = process.env.PORT || 3000;
```

### La app no carga estilos

**Verificar**: Que la estructura de carpetas sea:
```
webapp/
├── server.js
├── package.json
└── public/
    ├── index.html
    ├── styles.css
    └── app.js
```

---

## 📊 Monitoreo

Railway ofrece:
- **Logs en tiempo real**
- **Métricas de uso** (CPU, memoria)
- **Alertas de despliegue**
- **Historial de deployments**

---

## 🔗 Enlaces Útiles

- [Railway Dashboard](https://railway.app/dashboard)
- [Railway Docs](https://docs.railway.app)
- [Supabase Dashboard](https://supabase.com/dashboard)

---

## 📝 Resumen de URLs

| Tipo | URL |
|------|-----|
| **Railway (automática)** | `https://tu-app-production.up.railway.app` |
| **Dominio personalizado** | `https://ot.cleveradmin.cl` |
| **Panel Railway** | `https://railway.app/dashboard` |
| **API Test** | `https://tu-url/api/test-connection` |

---

**¡Listo!** Tu aplicación ahora está desplegada en la nube con:
- ✅ HTTPS automático
- ✅ Despliegue automático con cada push
- ✅ Conexión a Supabase
- ✅ Disponible 24/7


