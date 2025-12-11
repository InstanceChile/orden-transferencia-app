// ============================================================================
// SERVIDOR PRINCIPAL - Sistema de Gestión de Órdenes de Transferencia
// ============================================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const { parse } = require('csv-parse/sync');
const XLSX = require('xlsx');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de Multer para subida de archivos
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowedTypes.includes(file.mimetype) || 
        file.originalname.endsWith('.csv') || 
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos CSV o Excel'));
    }
  }
});

// Lista de clientes predefinidos
const CLIENTES = [
  'Ballerina',
  'Beiersdorf',
  'Bodyshop',
  'Bridgestone',
  'California Energy Drink',
  'Davis',
  'Elite Professional',
  'Faber Castell',
  'Ferretería La Reina',
  'Icb',
  'Mercado Carozzi',
  'Seis Luces',
  'Sika',
  'Smart Earth Camelina',
  'Softys',
  'Virutex - ILKO',
  'Carozzi Fs'
];

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Convierte fechas en varios formatos a ISO 8601
 * Soporta: DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD, DD-MM-YY, etc.
 */
function parseDate(dateStr) {
  if (!dateStr || dateStr === '' || dateStr === null || dateStr === undefined) {
    return null;
  }
  
  // Si ya es una fecha válida ISO, retornarla
  if (dateStr instanceof Date) {
    return dateStr.toISOString();
  }
  
  // Convertir a string si es número (Excel a veces pasa números)
  let str = String(dateStr).trim();
  
  // Si está vacío después de trim
  if (!str) {
    return null;
  }
  
  // Si ya está en formato ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss)
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const date = new Date(str);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  
  // Formato DD-MM-YYYY o DD/MM/YYYY
  const ddmmyyyy = str.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    const date = new Date(year, month - 1, day);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  
  // Formato DD-MM-YY o DD/MM/YY
  const ddmmyy = str.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2})$/);
  if (ddmmyy) {
    const [, day, month, year] = ddmmyy;
    const fullYear = parseInt(year) > 50 ? 1900 + parseInt(year) : 2000 + parseInt(year);
    const date = new Date(fullYear, month - 1, day);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  
  // Intentar parseo genérico como último recurso
  const genericDate = new Date(str);
  if (!isNaN(genericDate.getTime())) {
    return genericDate.toISOString();
  }
  
  // Si nada funciona, retornar null
  console.warn(`No se pudo parsear la fecha: "${str}"`);
  return null;
}

/**
 * Limpia un valor de texto, retornando null si está vacío
 */
function cleanText(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const str = String(value).trim();
  return str === '' ? null : str;
}

function parseFile(buffer, filename) {
  const extension = filename.toLowerCase().split('.').pop();
  
  if (extension === 'csv') {
    const content = buffer.toString('utf-8');
    return parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true
    });
  } else if (extension === 'xlsx' || extension === 'xls') {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'yyyy-mm-dd' });
  }
  
  throw new Error('Formato de archivo no soportado');
}

// ============================================================================
// ENDPOINTS API
// ============================================================================

// Test de conexión a Supabase
app.get('/api/test-connection', async (req, res) => {
  try {
    console.log('🔍 Probando conexión a Supabase...');
    console.log('URL:', process.env.SUPABASE_URL);
    console.log('Key (primeros 20 chars):', process.env.SUPABASE_ANON_KEY?.substring(0, 20) + '...');
    
    const { data, error } = await supabase
      .from('transfer_orders')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Error de conexión:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message,
        details: error,
        config: {
          url: process.env.SUPABASE_URL,
          keyPresent: !!process.env.SUPABASE_ANON_KEY
        }
      });
    }
    
    console.log('✅ Conexión exitosa');
    res.json({ 
      success: true, 
      message: 'Conexión a Supabase exitosa',
      config: {
        url: process.env.SUPABASE_URL,
        keyPresent: !!process.env.SUPABASE_ANON_KEY
      }
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      config: {
        url: process.env.SUPABASE_URL,
        keyPresent: !!process.env.SUPABASE_ANON_KEY
      }
    });
  }
});

// Obtener lista de clientes
app.get('/api/clientes', (req, res) => {
  res.json({ success: true, clientes: CLIENTES });
});

// Obtener OT pendientes (para OTA, OTADET, OTF)
app.get('/api/ot-pendientes', async (req, res) => {
  try {
    const { tipo } = req.query; // 'OTA', 'OTADET', 'OTF'
    
    let estados = [];
    if (tipo === 'OTA') {
      estados = ['Solicitado'];
    } else if (tipo === 'OTADET') {
      estados = ['Preparado', 'Preparacion_Validada'];
    } else if (tipo === 'OTF') {
      estados = ['Preparado', 'Preparacion_Validada'];
    }
    
    const { data, error } = await supabase
      .from('transfer_orders')
      .select('id_ot, cliente')
      .in('estado', estados)
      .order('id_ot');
    
    if (error) throw error;
    
    // Agrupar por id_ot + cliente (únicos)
    const uniqueOTs = [...new Map(data.map(item => 
      [`${item.id_ot}|${item.cliente || 'Sin cliente'}`, item]
    )).values()];
    
    const formatted = uniqueOTs.map(item => ({
      value: item.id_ot,
      label: `${item.id_ot} - ${item.cliente || 'Sin cliente'}`,
      cliente: item.cliente
    }));
    
    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Error obteniendo OT pendientes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// CARGA DE OT (Solicitud)
// ============================================================================
app.post('/api/upload/ot', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se proporcionó archivo' });
    }

    const records = parseFile(req.file.buffer, req.file.originalname);
    
    if (records.length === 0) {
      return res.status(400).json({ success: false, error: 'El archivo está vacío' });
    }

    const results = { exitosos: 0, fallidos: 0, errores: [] };

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2; // +2 porque fila 1 es header

      try {
        // Validar campos obligatorios
        if (!row.id_ot || !row.sku) {
          results.fallidos++;
          results.errores.push(`Fila ${rowNum}: Faltan campos obligatorios (id_ot, sku)`);
          continue;
        }

        if (!row.cantidad_solicitada || isNaN(parseFloat(row.cantidad_solicitada))) {
          results.fallidos++;
          results.errores.push(`Fila ${rowNum}: cantidad_solicitada inválida`);
          continue;
        }

        // Validar cliente (si se proporciona)
        const clienteValue = cleanText(row.cliente);
        if (clienteValue && !CLIENTES.includes(clienteValue)) {
          results.fallidos++;
          results.errores.push(`Fila ${rowNum}: Cliente "${clienteValue}" no válido`);
          continue;
        }

        // Preparar datos para insertar/actualizar
        const recordData = {
          id_ot: String(row.id_ot).trim(),
          sku: String(row.sku).trim(),
          mlc: cleanText(row.mlc),
          cliente: clienteValue,
          fecha_solicitud: parseDate(row.fecha_solicitud) || new Date().toISOString(),
          fecha_transferencia_comprometida: parseDate(row.fecha_transferencia_comprometida),
          cantidad_solicitada: parseFloat(row.cantidad_solicitada),
          estado: 'Solicitado',
          updated_at: new Date().toISOString()
        };

        // Usar upsert directamente a la tabla
        const { data, error } = await supabase
          .from('transfer_orders')
          .upsert(recordData, { 
            onConflict: 'id_ot,sku',
            ignoreDuplicates: false 
          });

        if (error) {
          console.error(`Error en fila ${rowNum}:`, error);
          throw new Error(error.message || 'Error al guardar en base de datos');
        }
        
        results.exitosos++;

      } catch (error) {
        results.fallidos++;
        results.errores.push(`Fila ${rowNum}: ${error.message}`);
        console.error(`Error procesando fila ${rowNum}:`, error);
      }
    }

    res.json({
      success: results.fallidos === 0,
      message: `Procesados ${records.length} registros: ${results.exitosos} exitosos, ${results.fallidos} fallidos`,
      results
    });

  } catch (error) {
    console.error('Error procesando OT:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// CARGA DE OTA (Preparación)
// ============================================================================
app.post('/api/upload/ota', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se proporcionó archivo' });
    }

    const records = parseFile(req.file.buffer, req.file.originalname);
    
    if (records.length === 0) {
      return res.status(400).json({ success: false, error: 'El archivo está vacío' });
    }

    const results = { exitosos: 0, fallidos: 0, errores: [] };

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2;

      try {
        if (!row.id_ot || !row.sku) {
          results.fallidos++;
          results.errores.push(`Fila ${rowNum}: Faltan campos obligatorios (id_ot, sku)`);
          continue;
        }

        if (!row.cantidad_preparada || isNaN(parseFloat(row.cantidad_preparada))) {
          results.fallidos++;
          results.errores.push(`Fila ${rowNum}: cantidad_preparada inválida`);
          continue;
        }

        // Actualizar registro existente con datos de preparación
        const { data, error } = await supabase
          .from('transfer_orders')
          .update({
            fecha_preparacion: parseDate(row.fecha_preparacion) || new Date().toISOString(),
            cantidad_preparada: parseFloat(row.cantidad_preparada),
            estado: 'Preparado',
            updated_at: new Date().toISOString()
          })
          .eq('id_ot', String(row.id_ot).trim())
          .eq('sku', String(row.sku).trim());

        if (error) {
          console.error(`Error en fila ${rowNum}:`, error);
          throw new Error(error.message || 'Error al actualizar en base de datos');
        }
        
        results.exitosos++;

      } catch (error) {
        results.fallidos++;
        results.errores.push(`Fila ${rowNum}: ${error.message}`);
        console.error(`Error procesando fila ${rowNum}:`, error);
      }
    }

    res.json({
      success: results.fallidos === 0,
      message: `Procesados ${records.length} registros: ${results.exitosos} exitosos, ${results.fallidos} fallidos`,
      results
    });

  } catch (error) {
    console.error('Error procesando OTA:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// CARGA DE OTADET (Detalle EAN)
// ============================================================================
app.post('/api/upload/otadet', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se proporcionó archivo' });
    }

    const records = parseFile(req.file.buffer, req.file.originalname);
    
    if (records.length === 0) {
      return res.status(400).json({ success: false, error: 'El archivo está vacío' });
    }

    const results = { exitosos: 0, fallidos: 0, errores: [] };

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2;

      try {
        if (!row.id_ot || !row.sku || !row.ean) {
          results.fallidos++;
          results.errores.push(`Fila ${rowNum}: Faltan campos obligatorios (id_ot, sku, ean)`);
          continue;
        }

        if (!row.cantidad_preparada_ean || isNaN(parseFloat(row.cantidad_preparada_ean))) {
          results.fallidos++;
          results.errores.push(`Fila ${rowNum}: cantidad_preparada_ean inválida`);
          continue;
        }

        // Insertar en tabla de detalle EAN
        const { error } = await supabase
          .from('transfer_orders_detalle_ean')
          .upsert({
            id_ot: String(row.id_ot).trim(),
            sku: String(row.sku).trim(),
            ean: String(row.ean).trim(),
            cantidad_preparada_ean: parseFloat(row.cantidad_preparada_ean),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id_ot,sku,ean'
          });

        if (error) throw error;
        results.exitosos++;

      } catch (error) {
        results.fallidos++;
        results.errores.push(`Fila ${rowNum}: ${error.message}`);
      }
    }

    res.json({
      success: results.fallidos === 0,
      message: `Procesados ${records.length} registros: ${results.exitosos} exitosos, ${results.fallidos} fallidos`,
      results
    });

  } catch (error) {
    console.error('Error procesando OTADET:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// CARGA DE OTF (Recepción)
// ============================================================================
app.post('/api/upload/otf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se proporcionó archivo' });
    }

    const records = parseFile(req.file.buffer, req.file.originalname);
    
    if (records.length === 0) {
      return res.status(400).json({ success: false, error: 'El archivo está vacío' });
    }

    const results = { exitosos: 0, fallidos: 0, errores: [] };

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2;

      try {
        if (!row.id_ot || !row.sku) {
          results.fallidos++;
          results.errores.push(`Fila ${rowNum}: Faltan campos obligatorios (id_ot, sku)`);
          continue;
        }

        if (!row.cantidad_recepcionada || isNaN(parseFloat(row.cantidad_recepcionada))) {
          results.fallidos++;
          results.errores.push(`Fila ${rowNum}: cantidad_recepcionada inválida`);
          continue;
        }

        const idOt = String(row.id_ot).trim();
        const sku = String(row.sku).trim();

        // Determinar estado según diferencia con cantidad_preparada
        const { data: otData, error: fetchError } = await supabase
          .from('transfer_orders')
          .select('cantidad_preparada')
          .eq('id_ot', idOt)
          .eq('sku', sku)
          .single();

        let estado = 'Entregado_Sin_Novedad';
        if (otData && otData.cantidad_preparada) {
          const diferencia = Math.abs(otData.cantidad_preparada - parseFloat(row.cantidad_recepcionada));
          const porcentaje = diferencia / otData.cantidad_preparada;
          if (porcentaje > 0.05) { // Umbral 5%
            estado = 'Entregado_con_Novedad';
          }
        }

        // Actualizar registro con datos de recepción
        const { data, error } = await supabase
          .from('transfer_orders')
          .update({
            fecha_recepcion: parseDate(row.fecha_recepcion) || new Date().toISOString(),
            cantidad_recepcionada: parseFloat(row.cantidad_recepcionada),
            estado: estado,
            updated_at: new Date().toISOString()
          })
          .eq('id_ot', idOt)
          .eq('sku', sku);

        if (error) {
          console.error(`Error en fila ${rowNum}:`, error);
          throw new Error(error.message || 'Error al actualizar en base de datos');
        }
        
        results.exitosos++;

      } catch (error) {
        results.fallidos++;
        results.errores.push(`Fila ${rowNum}: ${error.message}`);
        console.error(`Error procesando fila ${rowNum}:`, error);
      }
    }

    res.json({
      success: results.fallidos === 0,
      message: `Procesados ${records.length} registros: ${results.exitosos} exitosos, ${results.fallidos} fallidos`,
      results
    });

  } catch (error) {
    console.error('Error procesando OTF:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// DESCARGAR PLANTILLAS
// ============================================================================
app.get('/api/template/:tipo', (req, res) => {
  const { tipo } = req.params;
  
  let headers = [];
  let sampleData = [];
  let filename = '';

  switch (tipo.toUpperCase()) {
    case 'OT':
      headers = ['id_ot', 'sku', 'mlc', 'cliente', 'fecha_solicitud', 'fecha_transferencia_comprometida', 'cantidad_solicitada'];
      sampleData = [
        ['OT-2024-001', 'SKU12345', 'MLA123456789', 'Ballerina', '2024-12-09T10:00:00Z', '2024-12-11T10:00:00Z', '100'],
        ['OT-2024-001', 'SKU67890', '', 'Beiersdorf', '2024-12-09T10:00:00Z', '2024-12-11T10:00:00Z', '50']
      ];
      filename = 'plantilla_OT.xlsx';
      break;
    case 'OTA':
      headers = ['id_ot', 'sku', 'fecha_preparacion', 'cantidad_preparada'];
      sampleData = [
        ['OT-2024-001', 'SKU12345', '2024-12-10T14:00:00Z', '98'],
        ['OT-2024-001', 'SKU67890', '2024-12-10T14:30:00Z', '50']
      ];
      filename = 'plantilla_OTA.xlsx';
      break;
    case 'OTADET':
      headers = ['id_ot', 'sku', 'ean', 'cantidad_preparada_ean'];
      sampleData = [
        ['OT-2024-001', 'SKU12345', '7890123456789', '48'],
        ['OT-2024-001', 'SKU12345', '7890123456790', '50']
      ];
      filename = 'plantilla_OTADET.xlsx';
      break;
    case 'OTF':
      headers = ['id_ot', 'sku', 'fecha_recepcion', 'cantidad_recepcionada'];
      sampleData = [
        ['OT-2024-001', 'SKU12345', '2024-12-11T09:00:00Z', '98'],
        ['OT-2024-001', 'SKU67890', '2024-12-11T09:15:00Z', '48']
      ];
      filename = 'plantilla_OTF.xlsx';
      break;
    default:
      return res.status(400).json({ success: false, error: 'Tipo de plantilla no válido' });
  }

  // Crear workbook
  const wb = XLSX.utils.book_new();
  const wsData = [headers, ...sampleData];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Ajustar ancho de columnas
  ws['!cols'] = headers.map(() => ({ wch: 25 }));
  
  XLSX.utils.book_append_sheet(wb, ws, tipo.toUpperCase());
  
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

// ============================================================================
// ESTADÍSTICAS
// ============================================================================
app.get('/api/stats', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('transfer_orders')
      .select('estado, cliente');
    
    if (error) throw error;

    const stats = {
      total: data.length,
      porEstado: {},
      porCliente: {}
    };

    data.forEach(item => {
      // Contar por estado
      stats.porEstado[item.estado] = (stats.porEstado[item.estado] || 0) + 1;
      // Contar por cliente
      const cliente = item.cliente || 'Sin cliente';
      stats.porCliente[cliente] = (stats.porCliente[cliente] || 0) + 1;
    });

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Servir el frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
  console.log('📦 Sistema de Gestión de Órdenes de Transferencia');
});

