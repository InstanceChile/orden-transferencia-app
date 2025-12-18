# 📧 Sistema de Notificaciones por Email

## Descripción General

Este directorio contiene las plantillas HTML para las notificaciones por correo electrónico del sistema de gestión de Órdenes de Transferencia.

---

## 📋 Plantillas Disponibles

### 1. Alerta OT vs OTA (`alerta_ot_ota.html`)

**Propósito**: Notificar diferencias entre cantidad solicitada y cantidad preparada

**Trigger**: Cuando la diferencia supera el 2%

**Variables a reemplazar**:
- `{{ID_OT}}`: ID de la orden de transferencia
- `{{SKU}}`: Código SKU del producto
- `{{MLC}}`: Código MercadoLibre
- `{{CANTIDAD_SOLICITADA}}`: Cantidad solicitada en OT
- `{{CANTIDAD_PREPARADA}}`: Cantidad preparada en OTA
- `{{DIFERENCIA_ABSOLUTA}}`: Diferencia en unidades
- `{{DIFERENCIA_PORCENTUAL}}`: Diferencia en porcentaje
- `{{TIPO_DIFERENCIA}}`: "Faltan X unidades" o "Sobran X unidades"
- `{{FECHA_DETECCION}}`: Fecha y hora de detección

**Destinatarios**:
- Abastecimiento
- Operaciones

---

### 2. Alerta OTADET vs PIM (`alerta_otadet_pim.html`)

**Propósito**: Notificar inconsistencias entre códigos EAN registrados y catálogo PIM

**Trigger**: Cuando hay EAN faltantes, sobrantes o diferencias de cantidad

**Variables a reemplazar**:
- `{{ID_OT}}`: ID de la orden de transferencia
- `{{SKU}}`: Código SKU del producto
- `{{EAN_FALTANTES}}`: Lista HTML de EAN faltantes (ej: `<li>7891234567890</li>`)
- `{{EAN_SOBRANTES}}`: Lista HTML de EAN sobrantes
- `{{DIFERENCIAS_CANTIDAD}}`: Filas de tabla HTML con diferencias
- `{{TOTAL_FALTANTES}}`: Número total de EAN faltantes
- `{{TOTAL_SOBRANTES}}`: Número total de EAN sobrantes
- `{{TOTAL_DIFERENCIAS}}`: Número total de diferencias de cantidad
- `{{FECHA_DETECCION}}`: Fecha y hora de detección

**Ejemplo de `{{DIFERENCIAS_CANTIDAD}}`**:
```html
<tr>
    <td style="padding: 10px; border: 1px solid #dee2e6;">7891234567890</td>
    <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">100</td>
    <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">95</td>
    <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center; color: #dc3545;">-5</td>
</tr>
```

**Destinatarios**:
- Operaciones

---

### 3. Alerta OTA vs OTF (`alerta_ota_otf.html`)

**Propósito**: Notificar diferencias entre cantidad preparada y cantidad recepcionada

**Trigger**: Cuando la diferencia supera el 5%

**Variables a reemplazar**:
- `{{ID_OT}}`: ID de la orden de transferencia
- `{{SKU}}`: Código SKU del producto
- `{{MLC}}`: Código MercadoLibre
- `{{CANTIDAD_PREPARADA}}`: Cantidad preparada en OTA
- `{{CANTIDAD_RECEPCIONADA}}`: Cantidad recepcionada en OTF
- `{{DIFERENCIA_ABSOLUTA}}`: Diferencia en unidades
- `{{DIFERENCIA_PORCENTUAL}}`: Diferencia en porcentaje
- `{{COLOR_TIPO}}`: Color de fondo según tipo (ej: `#f8d7da` para faltante)
- `{{BORDER_COLOR_TIPO}}`: Color de borde
- `{{TEXT_COLOR_TIPO}}`: Color de texto
- `{{ICONO_TIPO}}`: Emoji según tipo (📉 o 📈)
- `{{TITULO_TIPO}}`: "Unidades Faltantes" o "Unidades Sobrantes"
- `{{DESCRIPCION_TIPO}}`: Descripción del tipo de diferencia
- `{{CAUSAS_POSIBLES}}`: Lista HTML de causas posibles
- `{{FECHA_SOLICITUD}}`: Fecha de solicitud OT
- `{{FECHA_PREPARACION}}`: Fecha de preparación OTA
- `{{FECHA_RECEPCION}}`: Fecha de recepción OTF
- `{{FECHA_DETECCION}}`: Fecha y hora de detección
- `{{SEVERIDAD}}`: "Alta", "Media" o "Baja"
- `{{COLOR_SEVERIDAD}}`: Color según severidad

**Ejemplo de `{{CAUSAS_POSIBLES}}`**:
```html
<li>Productos dañados durante el transporte</li>
<li>Error en el conteo durante la recepción</li>
<li>Pérdida o robo en tránsito</li>
```

**Destinatarios**:
- Operaciones
- Full

---

## 🎨 Diseño y Estilo

### Paleta de Colores

#### Alerta OT vs OTA (Amarillo/Naranja)
- Header: `#ffc107` a `#ff9800`
- Banner: `#fff3cd` con borde `#ffc107`
- Texto: `#856404`

#### Alerta OTADET vs PIM (Naranja)
- Header: `#ff9800` a `#f57c00`
- EAN Faltantes: `#f8d7da` con borde `#f5c6cb`
- EAN Sobrantes: `#fff3cd` con borde `#ffc107`

#### Alerta OTA vs OTF (Rojo)
- Header: `#dc3545` a `#c82333`
- Banner: `#f8d7da` con borde `#dc3545`
- Texto: `#721c24`

### Estructura Común

Todas las plantillas siguen esta estructura:

```
1. Header con gradiente y título
2. Banner de advertencia
3. Detalles de la orden (tabla)
4. Comparación/Análisis (tabla o lista)
5. Impacto/Causas (caja informativa)
6. Acciones requeridas (caja verde)
7. Información adicional (caja gris)
8. Footer oscuro
```

### Responsive Design

Las plantillas están optimizadas para:
- ✅ Desktop (Outlook, Gmail web, etc.)
- ✅ Mobile (Gmail app, iOS Mail, etc.)
- ✅ Dark mode compatible

---

## 🔧 Uso en n8n

### Método 1: Gmail Node (Recomendado)

```javascript
// En nodo Code, preparar datos
const emailData = {
  destinatarios: ['abastecimiento@empresa.com', 'operaciones@empresa.com'],
  asunto: `🚨 [ALERTA OT] Diferencia en preparación – OT ${datos.id_ot}`,
  html: plantillaHTML
    .replace('{{ID_OT}}', datos.id_ot)
    .replace('{{SKU}}', datos.sku)
    .replace('{{CANTIDAD_SOLICITADA}}', datos.cantidad_solicitada)
    // ... más reemplazos
};

return [{ json: emailData }];
```

```
// En nodo Gmail
Send To: {{ $json.destinatarios.join(',') }}
Subject: {{ $json.asunto }}
Email Type: HTML
Message: {{ $json.html }}
```

### Método 2: HTTP Request (SMTP)

```javascript
// Configurar nodo HTTP Request
Method: POST
URL: https://api.sendgrid.com/v3/mail/send
Authentication: API Key
Headers:
  Content-Type: application/json
Body:
{
  "personalizations": [{
    "to": [{"email": "destinatario@empresa.com"}]
  }],
  "from": {"email": "sistema-ot@empresa.com"},
  "subject": "{{ASUNTO}}",
  "content": [{
    "type": "text/html",
    "value": "{{HTML_COMPLETO}}"
  }]
}
```

---

## 📝 Ejemplo Completo de Uso

### Flujo en n8n para Alerta OT vs OTA

```javascript
// Nodo Code: Preparar Email
const items = $input.all();
const resultados = [];

// Leer plantilla HTML (guardar como variable en n8n o leer de archivo)
const plantillaHTML = `... contenido de alerta_ot_ota.html ...`;

for (const item of items) {
  const datos = item.json;
  
  // Calcular tipo de diferencia
  const diferencia = datos.cantidad_preparada - datos.cantidad_solicitada;
  const tipoDiferencia = diferencia < 0 
    ? `Faltan ${Math.abs(diferencia)} unidades en la preparación`
    : `Sobran ${diferencia} unidades en la preparación`;
  
  // Reemplazar variables
  let htmlFinal = plantillaHTML
    .replace(/{{ID_OT}}/g, datos.id_ot)
    .replace(/{{SKU}}/g, datos.sku)
    .replace(/{{MLC}}/g, datos.mlc || 'N/A')
    .replace(/{{CANTIDAD_SOLICITADA}}/g, datos.cantidad_solicitada)
    .replace(/{{CANTIDAD_PREPARADA}}/g, datos.cantidad_preparada)
    .replace(/{{DIFERENCIA_ABSOLUTA}}/g, Math.abs(diferencia))
    .replace(/{{DIFERENCIA_PORCENTUAL}}/g, datos.diferencia_porcentual.toFixed(2))
    .replace(/{{TIPO_DIFERENCIA}}/g, tipoDiferencia)
    .replace(/{{FECHA_DETECCION}}/g, new Date().toLocaleString('es-ES'));
  
  resultados.push({
    json: {
      destinatarios: ['abastecimiento@empresa.com', 'operaciones@empresa.com'],
      asunto: `🚨 [ALERTA OT] Diferencia en preparación – OT ${datos.id_ot}`,
      html: htmlFinal
    }
  });
}

return resultados;
```

---

## 🧪 Testing de Plantillas

### Herramientas Recomendadas

1. **Litmus** (https://litmus.com) - Testing profesional
2. **Email on Acid** (https://www.emailonacid.com) - Testing multi-cliente
3. **Mailtrap** (https://mailtrap.io) - Testing en desarrollo

### Test Manual

1. Copiar HTML de la plantilla
2. Reemplazar variables con datos de prueba
3. Enviar email de prueba
4. Verificar en:
   - Gmail (web y app)
   - Outlook (web y desktop)
   - Apple Mail
   - Mobile (iOS y Android)

### Datos de Prueba

```javascript
const datosPrueba = {
  ID_OT: 'TEST-001',
  SKU: 'SKU001',
  MLC: 'MLC999001',
  CANTIDAD_SOLICITADA: 100,
  CANTIDAD_PREPARADA: 90,
  DIFERENCIA_ABSOLUTA: 10,
  DIFERENCIA_PORCENTUAL: 10.00,
  TIPO_DIFERENCIA: 'Faltan 10 unidades en la preparación',
  FECHA_DETECCION: '22/11/2024 14:30:00'
};
```

---

## ⚠️ Mejores Prácticas

### ✅ DO (Hacer)

- Usar tablas para layout (mejor compatibilidad)
- Inline CSS (algunos clientes eliminan `<style>`)
- Colores en hexadecimal (#ffffff)
- Ancho máximo 600px
- Texto alternativo para imágenes (si las hay)
- Probar en múltiples clientes

### ❌ DON'T (No Hacer)

- JavaScript (no funciona en emails)
- Formularios complejos
- Videos embebidos
- Fuentes web externas (usar web-safe fonts)
- CSS avanzado (flexbox, grid)
- Imágenes de fondo (limitado)

---

## 📊 Rate Limiting

### Gmail

- **Límite**: 500 emails/día (cuenta gratuita)
- **Recomendación**: Esperar 1-2 segundos entre envíos
- **Implementación en n8n**: Usar `Split In Batches` + `Wait`

```
Split In Batches (batch: 1)
  ↓
Gmail Node
  ↓
Wait (2 seconds)
  ↓
(loop back to Split In Batches)
```

### SendGrid

- **Límite**: 100 emails/día (plan gratuito)
- **Recomendación**: Agrupar notificaciones cuando sea posible

---

## 🔒 Seguridad y Privacidad

### Datos Sensibles

- ❌ NO incluir contraseñas
- ❌ NO incluir tokens de acceso
- ❌ NO incluir información financiera sensible
- ✅ Incluir solo datos operativos necesarios

### GDPR / Privacidad

- Incluir opción de "darse de baja" (si aplica)
- No compartir emails con terceros
- Almacenar logs de envío de forma segura

---

## 📞 Soporte

Para problemas con las plantillas:

1. Verificar que todas las variables estén reemplazadas
2. Probar en cliente de email diferente
3. Revisar logs de n8n para errores de envío
4. Consultar documentación de Gmail/SendGrid

---

**Versión**: 1.0.0  
**Última actualización**: Noviembre 2024  
**Plantillas disponibles**: 3/3

