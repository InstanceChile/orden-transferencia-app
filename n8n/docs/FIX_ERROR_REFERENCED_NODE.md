# 🔧 Fix: Error "Referenced node is unexecuted"

## 🐛 Error Encontrado

```
TypeError: Cannot assign to read only property 'name' of object 
'Error: Referenced node is unexecuted'
```

Este error aparecía en el nodo `🔧 Procesar_Todas_Las_Hojas`.

---

## 🔍 Causa del Problema

### Problema 1: Conexiones con Mismo Índice

En n8n, cuando múltiples nodos se conectan a un mismo nodo, cada conexión debe usar un **índice diferente**.

**Antes (INCORRECTO)**:
```json
"📊 Leer_OT": {
  "main": [[{"node": "🔧 Procesar_Todas_Las_Hojas", "index": 0}]]
},
"📊 Leer_OTA": {
  "main": [[{"node": "🔧 Procesar_Todas_Las_Hojas", "index": 0}]]  // ❌ Mismo índice
},
"📊 Leer_OTADET": {
  "main": [[{"node": "🔧 Procesar_Todas_Las_Hojas", "index": 0}]]  // ❌ Mismo índice
},
"📊 Leer_OTF": {
  "main": [[{"node": "🔧 Procesar_Todas_Las_Hojas", "index": 0}]]  // ❌ Mismo índice
}
```

**Resultado**: Solo el último nodo en ejecutarse envía datos, los demás se sobrescriben.

### Problema 2: Uso Incorrecto de $()

El código usaba:

```javascript
const lecturaOT = $('📊 Leer_OT').all();
```

Esta sintaxis **requiere** que el nodo `📊 Leer_OT` ya se haya ejecutado **antes** en el flujo. Como los nodos se ejecutan en paralelo, esto genera el error "Referenced node is unexecuted".

---

## ✅ Solución Implementada

### Fix 1: Índices Diferentes en Conexiones

**Ahora (CORRECTO)**:
```json
"📊 Leer_OT": {
  "main": [[{"node": "🔧 Procesar_Todas_Las_Hojas", "index": 0}]]  // ✅ Índice 0
},
"📊 Leer_OTA": {
  "main": [[{"node": "🔧 Procesar_Todas_Las_Hojas", "index": 1}]]  // ✅ Índice 1
},
"📊 Leer_OTADET": {
  "main": [[{"node": "🔧 Procesar_Todas_Las_Hojas", "index": 2}]]  // ✅ Índice 2
},
"📊 Leer_OTF": {
  "main": [[{"node": "🔧 Procesar_Todas_Las_Hojas", "index": 3}]]  // ✅ Índice 3
}
```

**Resultado**: Cada nodo envía sus datos a una entrada diferente del nodo de procesamiento.

### Fix 2: Usar $input en Lugar de $()

**Antes (INCORRECTO)**:
```javascript
// ❌ Intenta acceder a nodo por nombre (requiere ejecución previa)
const lecturaOT = $('📊 Leer_OT').all();
const lecturaOTA = $('📊 Leer_OTA').all();
const lecturaOTADET = $('📊 Leer_OTADET').all();
const lecturaOTF = $('📊 Leer_OTF').all();
```

**Ahora (CORRECTO)**:
```javascript
// ✅ Lee de las entradas por índice
const todasLasEntradas = $input.all();

const lecturaOT = [];
const lecturaOTA = [];
const lecturaOTADET = [];
const lecturaOTF = [];

// Entrada 0: OT
if (todasLasEntradas.length > 0) {
  const inputOT = $input.all(0);
  lecturaOT.push(...inputOT);
}

// Entrada 1: OTA
if (todasLasEntradas.length > 1) {
  const inputOTA = $input.all(1);
  lecturaOTA.push(...inputOTA);
}

// Entrada 2: OTADET
if (todasLasEntradas.length > 2) {
  const inputOTADET = $input.all(2);
  lecturaOTADET.push(...inputOTADET);
}

// Entrada 3: OTF
if (todasLasEntradas.length > 3) {
  const inputOTF = $input.all(3);
  lecturaOTF.push(...inputOTF);
}
```

---

## 📊 Diagrama de Flujo

### Antes (Con Error)

```
🚀 Inicio
  ↓ (paralelo)
  ├─→ 📊 Leer_OT ──────┐
  ├─→ 📊 Leer_OTA ─────┤
  ├─→ 📊 Leer_OTADET ──┼─→ 🔧 Procesar (index: 0 para todos) ❌
  └─→ 📊 Leer_OTF ─────┘
  
Problema: Todos intentan escribir en el mismo índice
```

### Ahora (Corregido)

```
🚀 Inicio
  ↓ (paralelo)
  ├─→ 📊 Leer_OT ─────→ [index: 0] ┐
  ├─→ 📊 Leer_OTA ────→ [index: 1] ├─→ 🔧 Procesar ✅
  ├─→ 📊 Leer_OTADET ─→ [index: 2] │
  └─→ 📊 Leer_OTF ────→ [index: 3] ┘
  
Solución: Cada uno escribe en un índice diferente
```

---

## 🎯 Cómo Funciona $input.all(index)

En n8n, cuando un nodo recibe múltiples entradas:

```javascript
// Sin parámetro: devuelve TODAS las entradas mezcladas
const todos = $input.all();  // [item1_OT, item2_OT, item1_OTA, item2_OTA, ...]

// Con índice: devuelve solo los items de esa entrada específica
const soloOT = $input.all(0);      // [item1_OT, item2_OT, item3_OT]
const soloOTA = $input.all(1);     // [item1_OTA, item2_OTA]
const soloOTADET = $input.all(2);  // [item1_OTADET, item2_OTADET]
const soloOTF = $input.all(3);     // [item1_OTF]
```

**Ventajas**:
- ✅ No depende de nombres de nodos
- ✅ No requiere ejecución previa
- ✅ Funciona con ejecución paralela
- ✅ Más robusto y predecible

---

## 🧪 Casos de Prueba

### Caso 1: Solo OT con Datos

```
Entrada 0 (OT): 5 items ✅
Entrada 1 (OTA): 0 items
Entrada 2 (OTADET): 0 items
Entrada 3 (OTF): 0 items

Resultado:
- $input.all(0) → 5 items de OT ✅
- $input.all(1) → 0 items (array vacío) ✅
- $input.all(2) → 0 items (array vacío) ✅
- $input.all(3) → 0 items (array vacío) ✅

Total procesado: 5 registros de OT
```

### Caso 2: OT y OTA con Datos

```
Entrada 0 (OT): 10 items ✅
Entrada 1 (OTA): 8 items ✅
Entrada 2 (OTADET): 0 items
Entrada 3 (OTF): 0 items

Resultado:
- $input.all(0) → 10 items de OT ✅
- $input.all(1) → 8 items de OTA ✅
- $input.all(2) → 0 items ✅
- $input.all(3) → 0 items ✅

Total procesado: 18 registros (10 OT + 8 OTA)
```

### Caso 3: Todas las Hojas con Datos

```
Entrada 0 (OT): 10 items ✅
Entrada 1 (OTA): 8 items ✅
Entrada 2 (OTADET): 20 items ✅
Entrada 3 (OTF): 5 items ✅

Resultado:
- $input.all(0) → 10 items de OT ✅
- $input.all(1) → 8 items de OTA ✅
- $input.all(2) → 20 items de OTADET ✅
- $input.all(3) → 5 items de OTF ✅

Total procesado: 43 registros
```

---

## 🚀 Cómo Actualizar

### Paso 1: Descargar Flujo Actualizado

El archivo `Flujo_Unificado_Ingesta_OT.json` ya está corregido en versión 2.0.2.

### Paso 2: Reimportar en n8n

1. En n8n, desactiva el workflow actual
2. Exporta una copia de respaldo (por si acaso)
3. Elimina el workflow actual
4. Importa el nuevo archivo JSON (v2.0.2)
5. Reconfigura credenciales si es necesario

### Paso 3: Verificar Conexiones

Abre el workflow en n8n y verifica visualmente que:

1. Los 4 nodos de lectura se conectan al nodo de procesamiento
2. Las conexiones tienen **números diferentes** (0, 1, 2, 3)
3. No hay advertencias (⚠️) en los nodos

### Paso 4: Probar

1. Agrega datos en una o más hojas de Google Sheets
2. Ejecuta el workflow manualmente
3. Verifica que no haya errores
4. Confirma que los datos se guardaron en Supabase
5. Confirma que las hojas se limpiaron

---

## 📝 Lecciones Aprendidas

### ❌ NO Hacer

```javascript
// ❌ NO usar $() para nodos que se ejecutan en paralelo
const datos = $('Otro_Nodo').all();

// ❌ NO conectar múltiples nodos al mismo índice
"node1": {"main": [[{"node": "destino", "index": 0}]]},
"node2": {"main": [[{"node": "destino", "index": 0}]]},  // ❌
```

### ✅ SÍ Hacer

```javascript
// ✅ SÍ usar $input para leer entradas del nodo actual
const entrada0 = $input.all(0);
const entrada1 = $input.all(1);

// ✅ SÍ usar índices diferentes para cada conexión
"node1": {"main": [[{"node": "destino", "index": 0}]]},  // ✅
"node2": {"main": [[{"node": "destino", "index": 1}]]},  // ✅
```

---

## 🔗 Referencias

- [Documentación n8n: $input](https://docs.n8n.io/code-examples/expressions/luxon/)
- [Documentación n8n: Multiple Inputs](https://docs.n8n.io/workflows/connections/)
- [CHANGELOG.md](../../CHANGELOG.md) - Ver versión 2.0.2

---

**Versión**: 2.0.2  
**Fecha**: 28 de Noviembre, 2024  
**Estado**: ✅ Corregido y Probado

