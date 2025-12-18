// ============================================================================
// PROCESAMIENTO UNIFICADO DE TODAS LAS HOJAS - VERSION DEBUG
// ============================================================================

// Obtener datos de todas las entradas
const todasLasEntradas = $input.all();

console.log('=== INICIO PROCESAMIENTO UNIFICADO ===');
console.log('Total entradas recibidas:', todasLasEntradas.length);

// Separar por fuente (cada entrada viene de un nodo diferente)
const lecturaOT = [];
const lecturaOTA = [];
const lecturaOTADET = [];
const lecturaOTF = [];

// Los datos vienen en el orden: [0]=OT, [1]=OTA, [2]=OTADET, [3]=OTF
if (todasLasEntradas.length > 0) {
  const inputOT = $input.all(0);
  lecturaOT.push(...inputOT);
  console.log('📊 Entrada 0 (OT):', inputOT.length, 'items');
}

if (todasLasEntradas.length > 1) {
  const inputOTA = $input.all(1);
  lecturaOTA.push(...inputOTA);
  console.log('📊 Entrada 1 (OTA):', inputOTA.length, 'items');
}

if (todasLasEntradas.length > 2) {
  const inputOTADET = $input.all(2);
  lecturaOTADET.push(...inputOTADET);
  console.log('📊 Entrada 2 (OTADET):', inputOTADET.length, 'items');
}

if (todasLasEntradas.length > 3) {
  const inputOTF = $input.all(3);
  lecturaOTF.push(...inputOTF);
  console.log('📊 Entrada 3 (OTF):', inputOTF.length, 'items');
}

console.log('=== RESUMEN LECTURAS ===');
console.log('Items OT:', lecturaOT.length);
console.log('Items OTA:', lecturaOTA.length);
console.log('Items OTADET:', lecturaOTADET.length);
console.log('Items OTF:', lecturaOTF.length);

const resultados = [];

// ============================================================================
// PROCESAR OT (SOLICITUD)
// ============================================================================
console.log('=== PROCESANDO OT ===');
for (let i = 0; i < lecturaOT.length; i++) {
  try {
    const datos = lecturaOT[i].json;
    
    // DEBUG: Mostrar qué datos recibe
    console.log(`Item ${i + 1}:`, JSON.stringify(datos));
    
    // Validar campos obligatorios (más flexible)
    const id_ot = datos.id_ot || datos.ID_OT || datos['id_ot'];
    const sku = datos.sku || datos.SKU || datos['sku'];
    
    if (!id_ot) {
      console.log(`⚠️ Item ${i + 1}: Sin id_ot. Campos disponibles:`, Object.keys(datos));
      continue;
    }
    
    if (!sku) {
      console.log(`⚠️ Item ${i + 1}: Sin sku. Campos disponibles:`, Object.keys(datos));
      continue;
    }
    
    const registro = {
      id_ot: String(id_ot).trim(),
      sku: String(sku).trim(),
      mlc: datos.mlc || datos.MLC || null,
      fecha_solicitud: datos.fecha_solicitud || datos.FECHA_SOLICITUD || new Date().toISOString(),
      fecha_transferencia_comprometida: datos.fecha_transferencia_comprometida || datos.FECHA_TRANSFERENCIA_COMPROMETIDA || null,
      cantidad_solicitada: parseFloat(datos.cantidad_solicitada || datos.CANTIDAD_SOLICITADA || 0),
      estado: 'Solicitado',
      tipo: 'OT',
      hoja_origen: 'OT',
      fila_sheet: i + 2
    };
    
    console.log('✅ OT preparado:', registro.id_ot, '-', registro.sku, '- Cantidad:', registro.cantidad_solicitada);
    resultados.push({ json: registro });
    
  } catch (error) {
    console.error(`❌ Error procesando item ${i + 1} de OT:`, error.message);
    console.error('Datos del item:', lecturaOT[i].json);
  }
}

// ============================================================================
// PROCESAR OTA (PREPARACIÓN)
// ============================================================================
console.log('=== PROCESANDO OTA ===');
for (let i = 0; i < lecturaOTA.length; i++) {
  try {
    const datos = lecturaOTA[i].json;
    
    const id_ot = datos.id_ot || datos.ID_OT;
    const sku = datos.sku || datos.SKU;
    
    if (!id_ot || !sku) {
      console.log(`⚠️ OTA item ${i + 1}: Sin id_ot o sku. Campos:`, Object.keys(datos));
      continue;
    }
    
    const registro = {
      id_ot: String(id_ot).trim(),
      sku: String(sku).trim(),
      fecha_preparacion: datos.fecha_preparacion || datos.FECHA_PREPARACION || new Date().toISOString(),
      cantidad_preparada: parseFloat(datos.cantidad_preparada || datos.CANTIDAD_PREPARADA || 0),
      estado: 'Preparado',
      tipo: 'OTA',
      hoja_origen: 'OTA',
      fila_sheet: i + 2
    };
    
    console.log('✅ OTA preparado:', registro.id_ot, '-', registro.sku);
    resultados.push({ json: registro });
    
  } catch (error) {
    console.error(`❌ Error procesando item ${i + 1} de OTA:`, error.message);
  }
}

// ============================================================================
// PROCESAR OTADET (DETALLE EAN)
// ============================================================================
console.log('=== PROCESANDO OTADET ===');
for (let i = 0; i < lecturaOTADET.length; i++) {
  try {
    const datos = lecturaOTADET[i].json;
    
    const id_ot = datos.id_ot || datos.ID_OT;
    const sku = datos.sku || datos.SKU;
    const ean = datos.ean || datos.EAN;
    
    if (!id_ot || !sku || !ean) {
      console.log(`⚠️ OTADET item ${i + 1}: Falta id_ot, sku o ean. Campos:`, Object.keys(datos));
      continue;
    }
    
    const registro = {
      id_ot: String(id_ot).trim(),
      sku: String(sku).trim(),
      ean: String(ean).trim(),
      cantidad_preparada_ean: parseFloat(datos.cantidad_preparada_ean || datos.CANTIDAD_PREPARADA_EAN || 0),
      tipo: 'OTADET',
      hoja_origen: 'OTADET',
      fila_sheet: i + 2
    };
    
    console.log('✅ OTADET preparado:', registro.id_ot, '-', registro.sku, '-', registro.ean);
    resultados.push({ json: registro });
    
  } catch (error) {
    console.error(`❌ Error procesando item ${i + 1} de OTADET:`, error.message);
  }
}

// ============================================================================
// PROCESAR OTF (RECEPCIÓN)
// ============================================================================
console.log('=== PROCESANDO OTF ===');
for (let i = 0; i < lecturaOTF.length; i++) {
  try {
    const datos = lecturaOTF[i].json;
    
    const id_ot = datos.id_ot || datos.ID_OT;
    const sku = datos.sku || datos.SKU;
    
    if (!id_ot || !sku) {
      console.log(`⚠️ OTF item ${i + 1}: Sin id_ot o sku. Campos:`, Object.keys(datos));
      continue;
    }
    
    const registro = {
      id_ot: String(id_ot).trim(),
      sku: String(sku).trim(),
      fecha_recepcion: datos.fecha_recepcion || datos.FECHA_RECEPCION || new Date().toISOString(),
      cantidad_recepcionada: parseFloat(datos.cantidad_recepcionada || datos.CANTIDAD_RECEPCIONADA || 0),
      tipo: 'OTF',
      hoja_origen: 'OTF',
      fila_sheet: i + 2
    };
    
    console.log('✅ OTF preparado:', registro.id_ot, '-', registro.sku);
    resultados.push({ json: registro });
    
  } catch (error) {
    console.error(`❌ Error procesando item ${i + 1} de OTF:`, error.message);
  }
}

// ============================================================================
// RESULTADO FINAL
// ============================================================================
console.log('=== RESUMEN PROCESAMIENTO ===');
console.log('Total registros válidos:', resultados.length);

if (resultados.length === 0) {
  console.log('⚠️ No hay datos válidos para procesar');
  console.log('Verifica que las columnas en Google Sheets sean exactamente: id_ot, sku, cantidad_solicitada, etc.');
  return [{
    json: {
      tiene_datos: false,
      mensaje: 'No hay datos válidos en ninguna hoja. Verifica nombres de columnas.',
      timestamp: new Date().toISOString(),
      estadisticas: {
        OT: lecturaOT.length,
        OTA: lecturaOTA.length,
        OTADET: lecturaOTADET.length,
        OTF: lecturaOTF.length
      },
      debug_info: {
        total_items_leidos: lecturaOT.length + lecturaOTA.length + lecturaOTADET.length + lecturaOTF.length,
        ejemplo_campos_OT: lecturaOT.length > 0 ? Object.keys(lecturaOT[0].json) : []
      }
    }
  }];
}

console.log('=== FIN PROCESAMIENTO ===');
return resultados;

