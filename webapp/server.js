// ============================================================================
// SERVIDOR PRINCIPAL - Plataforma de Abastecimiento
// Módulos: Orden de Compra (OC) y Orden de Transferencia (OT)
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

// Validar variables de entorno
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ ERROR: Variables de entorno faltantes');
  console.error('SUPABASE_URL:', SUPABASE_URL ? '✅ Configurada' : '❌ Faltante');
  console.error('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ Faltante');
  console.error('');
  console.error('Por favor configura las variables de entorno:');
  console.error('  SUPABASE_URL=https://tu-proyecto.supabase.co');
  console.error('  SUPABASE_ANON_KEY=tu-anon-key');
  process.exit(1);
}

console.log('✅ Variables de entorno cargadas correctamente');
console.log('SUPABASE_URL:', SUPABASE_URL);

// Configuración de Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

// Lista de clientes predefinidos (para OT)
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

// Lista de proveedores predefinidos (para OC)
const PROVEEDORES = [
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
 */
function parseDate(dateStr) {
  if (!dateStr || dateStr === '' || dateStr === null || dateStr === undefined) {
    return null;
  }
  
  if (dateStr instanceof Date) {
    return dateStr.toISOString();
  }
  
  let str = String(dateStr).trim();
  
  if (!str) {
    return null;
  }
  
  // Si ya está en formato ISO
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
  
  // Parseo genérico
  const genericDate = new Date(str);
  if (!isNaN(genericDate.getTime())) {
    return genericDate.toISOString();
  }
  
  console.warn(`No se pudo parsear la fecha: "${str}"`);
  return null;
}

/**
 * Limpia un valor de texto
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
// ENDPOINTS API - GENERALES
// ============================================================================

// Test de conexión a Supabase
app.get('/api/test-connection', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('transfer_orders')
      .select('count')
      .limit(1);
    
    if (error) {
      return res.status(500).json({ 
        success: false, 
        error: error.message
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Conexión a Supabase exitosa'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

// Obtener lista de clientes (para OT)
app.get('/api/clientes', (req, res) => {
  res.json({ success: true, clientes: CLIENTES });
});

// Obtener lista de proveedores (para OC)
app.get('/api/proveedores', (req, res) => {
  res.json({ success: true, proveedores: PROVEEDORES });
});

// ============================================================================
// ENDPOINTS API - ORDEN DE COMPRA (OC)
// Usa tabla existente: "Orden_Compra" con campos PascalCase
// ============================================================================

// Estadísticas de OC
app.get('/api/stats/oc', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Orden_Compra')
      .select('Estado, Proveedor');
    
    if (error) throw error;

    const stats = {
      total: data.length,
      porEstado: {},
      porProveedor: {}
    };

    data.forEach(item => {
      const estado = item.Estado || 'Sin estado';
      stats.porEstado[estado] = (stats.porEstado[estado] || 0) + 1;
      const proveedor = item.Proveedor || 'Sin proveedor';
      stats.porProveedor[proveedor] = (stats.porProveedor[proveedor] || 0) + 1;
    });

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error obteniendo estadísticas OC:', error);
    res.json({ success: true, stats: { total: 0, porEstado: {}, porProveedor: {} } });
  }
});

// Obtener OC pendientes de recepción
app.get('/api/oc-pendientes', async (req, res) => {
  try {
    // Obtener todas las OC en estado Creado (pendientes de recepción)
    const { data, error } = await supabase
      .from('Orden_Compra')
      .select('Oc, Proveedor')
      .eq('Estado', 'Creado')
      .order('Oc');
    
    if (error) throw error;
    
    // Agrupar por Oc (únicos) - cada OC puede tener múltiples líneas de producto
    const uniqueOCs = [...new Map(data.map(item => 
      [item.Oc, item]
    )).values()];
    
    // Formato: Proveedor - Número OC
    const formatted = uniqueOCs.map(item => ({
      value: item.Oc,
      label: `${item.Proveedor || 'Sin proveedor'} - ${item.Oc}`,
      proveedor: item.Proveedor
    }));
    
    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Error obteniendo OC pendientes:', error);
    res.json({ success: true, data: [] });
  }
});

// ============================================================================
// CARGA DE OC (Orden de Compra)
// Usa tabla existente: "Orden_Compra" con campos PascalCase
// CORRECCIÓN: Valida que la OC no exista previamente para evitar duplicados
// ============================================================================
app.post('/api/upload/oc', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se proporcionó archivo' });
    }

    const records = parseFile(req.file.buffer, req.file.originalname);
    
    if (records.length === 0) {
      return res.status(400).json({ success: false, error: 'El archivo está vacío' });
    }

    // Extraer todos los números de OC únicos del archivo
    const ocsEnArchivo = [...new Set(records
      .filter(r => r.id_oc || r.Oc || r.oc || r.OC)
      .map(r => cleanText(r.id_oc || r.Oc || r.oc || r.OC))
    )];

    // Verificar si alguna OC ya existe en la base de datos
    if (ocsEnArchivo.length > 0) {
      const { data: existentes, error: checkError } = await supabase
        .from('Orden_Compra')
        .select('Oc')
        .in('Oc', ocsEnArchivo);

      if (checkError) {
        return res.status(500).json({ success: false, error: `Error verificando duplicados: ${checkError.message}` });
      }

      if (existentes && existentes.length > 0) {
        const ocsExistentes = [...new Set(existentes.map(e => e.Oc))];
        return res.status(400).json({ 
          success: false, 
          error: `Las siguientes OC ya existen en el sistema y no se pueden duplicar: ${ocsExistentes.join(', ')}. Si desea registrar la recepción, use la sección "Recepción".`,
          duplicados: ocsExistentes
        });
      }
    }

    const results = { exitosos: 0, fallidos: 0, errores: [] };

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2;

      try {
        // Validar campos obligatorios - soporta múltiples nombres de columna
        const idOc = cleanText(row.id_oc || row.Oc || row.oc || row.OC);
        const codProd = cleanText(row.cod_prod || row.Cod_Prod || row.codigo || row['Codigo De Venta(EAN)'] || row.PRODUCTO);
        const sku = cleanText(row.sku || row.SKU);
        const cantidadOc = parseFloat(row.cantidad_oc || row.Cantidad_Prod_Oc || row['(CANTIDAD EAN COMPRA)'] || 0);

        if (!idOc || !codProd) {
          results.fallidos++;
          results.errores.push(`Fila ${rowNum}: Faltan campos obligatorios (id_oc/Oc, cod_prod/Cod_Prod)`);
          continue;
        }

        if (isNaN(cantidadOc) || cantidadOc <= 0) {
          results.fallidos++;
          results.errores.push(`Fila ${rowNum}: cantidad_oc inválida`);
          continue;
        }

        // Validar proveedor
        const proveedorValue = cleanText(row.proveedor || row.Proveedor || row['Nombre Proveedor']);
        if (proveedorValue && !PROVEEDORES.includes(proveedorValue)) {
          results.fallidos++;
          results.errores.push(`Fila ${rowNum}: Proveedor "${proveedorValue}" no válido`);
          continue;
        }

        // Generar ID único para el detalle (igual que en el proyecto anterior)
        const idDetOc = cleanText(row.Id_Det_OC || row.id_det_oc) || `${idOc}-${codProd}`;

        // Preparar datos para insertar - usando nombres de columna de la tabla existente
        const recordData = {
          Id: idDetOc,
          Oc: idOc,
          Cod_Prod: codProd,
          SKU: sku,
          Producto: cleanText(row.producto || row.Producto),
          Proveedor: proveedorValue,
          Bodega: cleanText(row.bodega || row.Bodega),
          Precio_Prod_Oc: parseFloat(row.precio_unitario || row.Precio_Prod_Oc || row['PRECIO UNITARIO'] || 0) || null,
          Precio_Caja: parseFloat(row.precio_caja || row.Precio_Caja || row['Precio Compra CAJA'] || 0) || null,
          Cantidad_Prod_Oc: cantidadOc,
          Cantidad_Caja: parseFloat(row.cantidad_caja || row.Cantidad_Caja || row['(CANTIDAD DUN COMPRA)'] || 0) || null,
          UXC: parseFloat(row.uxc || row.UXC || 0) || null,
          Total: parseFloat(row.total || row.Total || 0) || null,
          Fecha_Creacion: cleanText(row.fecha_creacion || row.Fecha_Creacion || row['Fecha Creacion']) || new Date().toISOString().split('T')[0],
          Fecha_Recepcion: cleanText(row.fecha_recepcion_esperada || row.Fecha_Recepcion || row['Fecha Recepcion']),
          Estado: 'Creado',
          Hoja_Origen: 'WebApp',
          Fecha_Procesamiento: new Date().toISOString()
        };

        // Usar insert en lugar de upsert para evitar sobrescribir
        const { error } = await supabase
          .from('Orden_Compra')
          .insert(recordData);

        if (error) {
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
    console.error('Error procesando OC:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// CARGA DE OCR (Recepción de Orden de Compra)
// Usa tabla existente: "Orden_Compra" con campos PascalCase
// ============================================================================
app.post('/api/upload/ocr', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se proporcionó archivo' });
    }

    const records = parseFile(req.file.buffer, req.file.originalname);
    
    if (records.length === 0) {
      return res.status(400).json({ success: false, error: 'El archivo está vacío' });
    }

    const results = { exitosos: 0, fallidos: 0, errores: [] };

    // Agrupar por OC para calcular estado después
    const ocsActualizadas = new Set();

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2;

      try {
        // Soporta múltiples nombres de columna (del proyecto anterior y nuevos)
        const idOc = cleanText(row.id_oc || row.Or_Compra || row.Oc || row.oc || row.OC);
        const codProd = cleanText(row.cod_prod || row.PRODUCTO || row.Cod_Prod || row.codigo);
        const cantidadRecepcionada = parseFloat(row.cantidad_recepcionada || row.ENTRADA || row.Cant_Prod_Recepcion || 0);

        if (!idOc || !codProd) {
          results.fallidos++;
          results.errores.push(`Fila ${rowNum}: Faltan campos obligatorios (id_oc/Oc/Or_Compra, cod_prod/PRODUCTO)`);
          continue;
        }

        if (isNaN(cantidadRecepcionada)) {
          results.fallidos++;
          results.errores.push(`Fila ${rowNum}: cantidad_recepcionada/ENTRADA inválida`);
          continue;
        }

        // Actualizar registro existente con datos de recepción
        const { error } = await supabase
          .from('Orden_Compra')
          .update({
            Cant_Prod_Recepcion: cantidadRecepcionada,
            Precio_Prod_Recepcion: parseFloat(row.precio_recepcion || row.PRECIO || row.Precio_Prod_Recepcion || 0) || null,
            Fecha_Actualizacion_Recepcion: new Date().toISOString()
          })
          .eq('Oc', idOc)
          .eq('Cod_Prod', codProd);

        if (error) {
          throw new Error(error.message || 'Error al actualizar en base de datos');
        }
        
        ocsActualizadas.add(idOc);
        results.exitosos++;

      } catch (error) {
        results.fallidos++;
        results.errores.push(`Fila ${rowNum}: ${error.message}`);
        console.error(`Error procesando fila ${rowNum}:`, error);
      }
    }

    // Actualizar estado de cada OC
    for (const idOc of ocsActualizadas) {
      await actualizarEstadoOC(idOc);
    }

    res.json({
      success: results.fallidos === 0,
      message: `Procesados ${records.length} registros: ${results.exitosos} exitosos, ${results.fallidos} fallidos`,
      results
    });

  } catch (error) {
    console.error('Error procesando OCR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Actualiza el estado de una OC basado en las recepciones
 * Usa los nombres de columna de la tabla existente "Orden_Compra"
 */
async function actualizarEstadoOC(idOc) {
  try {
    // Obtener todos los productos de la OC
    const { data: productos, error: fetchError } = await supabase
      .from('Orden_Compra')
      .select('Cantidad_Prod_Oc, Cant_Prod_Recepcion')
      .eq('Oc', idOc);

    if (fetchError || !productos || productos.length === 0) return;

    let totalProductos = productos.length;
    let productosCompletos = 0;
    let productosParciales = 0;

    productos.forEach(p => {
      const cantOc = parseFloat(p.Cantidad_Prod_Oc) || 0;
      const cantRec = parseFloat(p.Cant_Prod_Recepcion) || 0;

      if (cantRec >= cantOc && cantOc > 0) {
        productosCompletos++;
      } else if (cantRec > 0) {
        productosParciales++;
      }
    });

    // Determinar estado (usando los mismos estados del proyecto anterior)
    let estado = 'Creado';
    let porcentajeRecepcion = 0;

    if (productosCompletos === totalProductos) {
      estado = 'Completamente Recepcionado';
      porcentajeRecepcion = 100;
    } else if (productosCompletos > 0 || productosParciales > 0) {
      estado = 'Parcialmente Recepcionado';
      porcentajeRecepcion = ((productosCompletos + productosParciales) / totalProductos * 100).toFixed(2);
    }

    // Actualizar todos los productos de la OC con el nuevo estado
    await supabase
      .from('Orden_Compra')
      .update({
        Estado: estado,
        Porcentaje_Recepcion: porcentajeRecepcion,
        Fecha_Actualizacion_Estado: new Date().toISOString()
      })
      .eq('Oc', idOc);

  } catch (error) {
    console.error(`Error actualizando estado de OC ${idOc}:`, error);
  }
}

// ============================================================================
// ENDPOINTS API - ORDEN DE TRANSFERENCIA (OT)
// ============================================================================

// Obtener OT pendientes
app.get('/api/ot-pendientes', async (req, res) => {
  try {
    const { tipo } = req.query;
    
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

// Estadísticas de OT
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
      stats.porEstado[item.estado] = (stats.porEstado[item.estado] || 0) + 1;
      const cliente = item.cliente || 'Sin cliente';
      stats.porCliente[cliente] = (stats.porCliente[cliente] || 0) + 1;
    });

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// CARGA DE OT (Solicitud)
// CORRECCIÓN: Valida que el id_ot no exista previamente para evitar duplicados
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

    // Extraer todos los id_ot únicos del archivo
    const idsOtEnArchivo = [...new Set(records
      .filter(r => r.id_ot)
      .map(r => String(r.id_ot).trim())
    )];

    // Verificar si alguno ya existe en la base de datos
    if (idsOtEnArchivo.length > 0) {
      const { data: existentes, error: checkError } = await supabase
        .from('transfer_orders')
        .select('id_ot')
        .in('id_ot', idsOtEnArchivo);

      if (checkError) {
        return res.status(500).json({ success: false, error: `Error verificando duplicados: ${checkError.message}` });
      }

      if (existentes && existentes.length > 0) {
        const idsExistentes = [...new Set(existentes.map(e => e.id_ot))];
        return res.status(400).json({ 
          success: false, 
          error: `Las siguientes OT ya existen en el sistema y no se pueden duplicar: ${idsExistentes.join(', ')}. Si desea actualizar una OT existente, use las secciones correspondientes (OTA, OTADET, OTF).`,
          duplicados: idsExistentes
        });
      }
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

        if (!row.cantidad_solicitada || isNaN(parseFloat(row.cantidad_solicitada))) {
          results.fallidos++;
          results.errores.push(`Fila ${rowNum}: cantidad_solicitada inválida`);
          continue;
        }

        const clienteValue = cleanText(row.cliente);
        if (clienteValue && !CLIENTES.includes(clienteValue)) {
          results.fallidos++;
          results.errores.push(`Fila ${rowNum}: Cliente "${clienteValue}" no válido`);
          continue;
        }

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

        // Usar insert en lugar de upsert para evitar sobrescribir
        const { error } = await supabase
          .from('transfer_orders')
          .insert(recordData);

        if (error) {
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
// CORRECCIÓN: Actualiza TODAS las líneas de la OT - las no incluidas quedan en 0
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

    const results = { exitosos: 0, fallidos: 0, errores: [], noIncluidos: 0 };

    // Agrupar registros por id_ot para procesar OT completas
    const registrosPorOT = {};
    const skusPorOT = {};
    
    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2;

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

      const idOt = String(row.id_ot).trim();
      const sku = String(row.sku).trim();
      
      if (!registrosPorOT[idOt]) {
        registrosPorOT[idOt] = [];
        skusPorOT[idOt] = new Set();
      }
      
      registrosPorOT[idOt].push({
        sku: sku,
        cantidad_preparada: parseFloat(row.cantidad_preparada),
        fecha_preparacion: parseDate(row.fecha_preparacion) || new Date().toISOString(),
        rowNum: rowNum
      });
      skusPorOT[idOt].add(sku);
    }

    // Procesar cada OT completa
    for (const idOt of Object.keys(registrosPorOT)) {
      try {
        // Obtener TODOS los SKUs de esta OT en estado Solicitado
        const { data: productosOT, error: fetchError } = await supabase
          .from('transfer_orders')
          .select('sku')
          .eq('id_ot', idOt)
          .eq('estado', 'Solicitado');

        if (fetchError) {
          throw new Error(`Error obteniendo productos de OT ${idOt}: ${fetchError.message}`);
        }

        if (!productosOT || productosOT.length === 0) {
          results.errores.push(`OT ${idOt}: No se encontraron productos pendientes de preparación`);
          continue;
        }

        const fechaActualizacion = new Date().toISOString();
        const skusIncluidos = skusPorOT[idOt];

        // 1. Actualizar productos INCLUIDOS en el archivo
        for (const registro of registrosPorOT[idOt]) {
          const { error } = await supabase
            .from('transfer_orders')
            .update({
              fecha_preparacion: registro.fecha_preparacion,
              cantidad_preparada: registro.cantidad_preparada,
              estado: 'Preparado',
              updated_at: fechaActualizacion
            })
            .eq('id_ot', idOt)
            .eq('sku', registro.sku);

          if (error) {
            results.fallidos++;
            results.errores.push(`Fila ${registro.rowNum}: ${error.message}`);
          } else {
            results.exitosos++;
          }
        }

        // 2. Actualizar productos NO INCLUIDOS a cantidad_preparada = 0
        const skusNoIncluidos = productosOT
          .map(p => p.sku)
          .filter(sku => !skusIncluidos.has(sku));

        if (skusNoIncluidos.length > 0) {
          const { error: updateError } = await supabase
            .from('transfer_orders')
            .update({
              fecha_preparacion: fechaActualizacion,
              cantidad_preparada: 0,
              estado: 'Preparado',
              updated_at: fechaActualizacion
            })
            .eq('id_ot', idOt)
            .in('sku', skusNoIncluidos);

          if (updateError) {
            results.errores.push(`OT ${idOt}: Error actualizando SKUs no incluidos: ${updateError.message}`);
          } else {
            results.noIncluidos += skusNoIncluidos.length;
          }
        }

      } catch (error) {
        results.errores.push(`OT ${idOt}: ${error.message}`);
        console.error(`Error procesando OT ${idOt}:`, error);
      }
    }

    const mensaje = results.noIncluidos > 0 
      ? `Procesados ${records.length} registros: ${results.exitosos} exitosos, ${results.fallidos} fallidos. ${results.noIncluidos} productos no incluidos marcados con cantidad 0.`
      : `Procesados ${records.length} registros: ${results.exitosos} exitosos, ${results.fallidos} fallidos`;

    res.json({
      success: results.fallidos === 0,
      message: mensaje,
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
        const { data: otData } = await supabase
          .from('transfer_orders')
          .select('cantidad_preparada')
          .eq('id_ot', idOt)
          .eq('sku', sku)
          .single();

        let estado = 'Entregado_Sin_Novedad';
        if (otData && otData.cantidad_preparada) {
          const diferencia = Math.abs(otData.cantidad_preparada - parseFloat(row.cantidad_recepcionada));
          const porcentaje = diferencia / otData.cantidad_preparada;
          if (porcentaje > 0.05) {
            estado = 'Entregado_con_Novedad';
          }
        }

        const { error } = await supabase
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
    // Plantillas OC - Usando nombres compatibles con tabla existente "Orden_Compra"
    case 'OC_COMPRA':
      headers = ['Id_Det_OC', 'Oc', 'Cod_Prod', 'SKU', 'Producto', 'Proveedor', 'Bodega', 'Precio_Prod_Oc', 'Cantidad_Prod_Oc', 'Precio_Caja', 'Cantidad_Caja', 'UXC', 'Total', 'Fecha_Creacion', 'Fecha_Recepcion'];
      sampleData = [
        ['OC001-7890123456789', 'OC001', '7890123456789', 'SKU12345', 'Producto Ejemplo 1', 'Proveedor ABC', 'Bodega Central', '1500', '100', '15000', '10', '10', '150000', '2024-12-18', '2024-12-25'],
        ['OC001-7890123456790', 'OC001', '7890123456790', 'SKU67890', 'Producto Ejemplo 2', 'Proveedor ABC', 'Bodega Central', '2500', '50', '25000', '5', '10', '125000', '2024-12-18', '2024-12-25']
      ];
      filename = 'plantilla_OC_Compra.xlsx';
      break;
    case 'OC_RECEPCION':
      headers = ['Oc', 'PRODUCTO', 'ENTRADA', 'PRECIO'];
      sampleData = [
        ['OC001', '7890123456789', '98', '1500'],
        ['OC001', '7890123456790', '50', '2500']
      ];
      filename = 'plantilla_OC_Recepcion.xlsx';
      break;
    // Plantillas OT
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

// Servir el frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
  console.log('📦 Plataforma de Abastecimiento');
  console.log('   - Módulo: Orden de Compra (OC)');
  console.log('   - Módulo: Orden de Transferencia (OT)');
});
