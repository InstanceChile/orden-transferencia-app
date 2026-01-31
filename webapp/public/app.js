// ============================================================================
// PLATAFORMA DE ABASTECIMIENTO - APLICACIÓN FRONTEND
// ============================================================================

const API_BASE = '';

// Estado de la aplicación
let currentModule = 'oc'; // 'oc' o 'ot'
let CLIENTES = [];
let PROVEEDORES = [];
let CLIENTES_CON_BODEGA = [];
let PROVEEDORES_CON_BODEGA = [];
let ocSeleccionadaParaAjuste = null; // OC seleccionada para ajustar fecha
let otSeleccionadaParaAjuste = null; // OT seleccionada para ajustar fecha

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  initModuleNavigation();
  initTabs();
  initDropzones();
  loadClientes();
  loadProveedores();
  loadStats();
  loadOTPendientes();
  loadOCPendientes();
  testConnection();
});

// ============================================================================
// NAVEGACIÓN DE MÓDULOS (Sidebar)
// ============================================================================

function initModuleNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const modules = document.querySelectorAll('.module-content');
  const headerTitle = document.getElementById('headerTitle');
  
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const moduleId = item.dataset.module;
      currentModule = moduleId;
      
      // Desactivar todos los nav items
      navItems.forEach(n => n.classList.remove('active'));
      // Activar el seleccionado
      item.classList.add('active');
      
      // Ocultar todos los módulos
      modules.forEach(m => m.classList.remove('active'));
      // Mostrar el módulo seleccionado
      document.getElementById(`module-${moduleId}`).classList.add('active');
      
      // Actualizar header
      updateHeader(moduleId);
      
      // Cargar datos del módulo
      if (moduleId === 'oc') {
        loadOCStats();
        loadOCPendientes();
      } else {
        loadStats();
        loadOTPendientes();
      }
    });
  });
}

function updateHeader(moduleId) {
  const headerTitle = document.getElementById('headerTitle');
  
  if (moduleId === 'oc') {
    headerTitle.innerHTML = `
      <h1>🛒 Orden de Compra</h1>
      <span class="header-subtitle">Gestión de órdenes de compra y recepciones</span>
    `;
  } else {
    headerTitle.innerHTML = `
      <h1>📦 Orden de Transferencia</h1>
      <span class="header-subtitle">Gestión de órdenes de transferencia</span>
    `;
  }
}

// ============================================================================
// TABS (dentro de cada módulo)
// ============================================================================

function initTabs() {
  // Tabs del módulo OC
  initTabsForModule('module-oc');
  // Tabs del módulo OT
  initTabsForModule('module-ot');
}

function initTabsForModule(moduleId) {
  const moduleEl = document.getElementById(moduleId);
  if (!moduleEl) return;
  
  const tabBtns = moduleEl.querySelectorAll('.tab-btn');
  const panels = moduleEl.querySelectorAll('.tab-panel');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      
      // Desactivar todos dentro del módulo
      tabBtns.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      
      // Activar seleccionado
      btn.classList.add('active');
      document.getElementById(`panel-${tabId}`).classList.add('active');
      
      // Recargar datos según el tab
      if (moduleId === 'module-ot') {
        if (['ota', 'otadet', 'otf'].includes(tabId)) {
          loadOTPendientes(tabId.toUpperCase());
        } else if (tabId === 'ot-ajuste-fecha') {
          loadOTParaAjuste();
        } else if (tabId === 'ot-transferencias') {
          loadOTTransferencias();
        }
      } else if (moduleId === 'module-oc') {
        if (tabId === 'oc-recepcion') {
          loadOCPendientes();
        } else if (tabId === 'oc-ajuste-fecha') {
          loadOCParaAjuste();
        } else if (tabId === 'oc-recepciones') {
          loadOCRecepciones();
        }
      }
    });
  });
}

// ============================================================================
// DROPZONES - DRAG & DROP
// ============================================================================

function initDropzones() {
  const dropzones = document.querySelectorAll('.upload-zone');
  
  dropzones.forEach(zone => {
    const type = zone.dataset.type;
    const fileInput = document.getElementById(`file-${type}`);
    
    if (!fileInput) return;
    
    // Click para seleccionar archivo
    zone.addEventListener('click', () => fileInput.click());
    
    // Drag events
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('dragover');
    });
    
    zone.addEventListener('dragleave', () => {
      zone.classList.remove('dragover');
    });
    
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileUpload(files[0], type);
      }
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFileUpload(e.target.files[0], type);
      }
    });
  });
}

// ============================================================================
// CARGA DE ARCHIVOS
// ============================================================================

async function handleFileUpload(file, type) {
  showLoading(true);
  
  const formData = new FormData();
  formData.append('file', file);
  
  // Mapear tipo a endpoint
  const endpointMap = {
    'oc-carga': 'oc',
    'oc-recepcion': 'ocr',
    'ot': 'ot',
    'ota': 'ota',
    'otadet': 'otadet',
    'otf': 'otf'
  };
  
  const endpoint = endpointMap[type] || type;
  
  try {
    const response = await fetch(`${API_BASE}/api/upload/${endpoint}`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    showResults(result, type);
    
    // Recargar estadísticas y pendientes según el módulo
    if (type.startsWith('oc')) {
      loadOCStats();
      loadOCPendientes();
    } else {
      loadStats();
      loadOTPendientes();
    }
    
  } catch (error) {
    console.error('Error:', error);
    showResults({
      success: false,
      error: 'Error de conexión con el servidor',
      results: { exitosos: 0, fallidos: 0, errores: [error.message] }
    }, type);
  } finally {
    showLoading(false);
    // Limpiar input
    const fileInput = document.getElementById(`file-${type}`);
    if (fileInput) fileInput.value = '';
  }
}

// ============================================================================
// MOSTRAR RESULTADOS
// ============================================================================

function showResults(result, type) {
  const modal = document.getElementById('resultsModal');
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');
  
  const typeNames = {
    'oc-carga': 'Orden de Compra',
    'oc-recepcion': 'Recepción OC',
    'oc-ajuste-fecha': 'Ajuste Fecha OC',
    'ot': 'OT (Solicitud)',
    'ota': 'OTA (Preparación)',
    'otadet': 'OTADET (Detalle EAN)',
    'otf': 'OTF (Recepción)',
    'ot-ajuste-fecha': 'Ajuste Fecha OT'
  };
  
  title.textContent = `Resultado de Carga - ${typeNames[type] || type}`;
  
  const total = (result.results?.exitosos || 0) + (result.results?.fallidos || 0);
  const exitosos = result.results?.exitosos || 0;
  const fallidos = result.results?.fallidos || 0;
  
  let html = '';
  
  // Status box
  if (result.success) {
    html += `
      <div class="result-success">
        <h4>✅ Carga Exitosa</h4>
        <p>${result.message}</p>
      </div>
    `;
  } else {
    html += `
      <div class="result-error">
        <h4>⚠️ Carga con Errores</h4>
        <p>${result.message || result.error}</p>
      </div>
    `;
  }
  
  // Stats
  html += `
    <div class="result-stats">
      <div class="stat-box total">
        <div class="value">${total}</div>
        <div class="label">Total</div>
      </div>
      <div class="stat-box success">
        <div class="value">${exitosos}</div>
        <div class="label">Exitosos</div>
      </div>
      <div class="stat-box error">
        <div class="value">${fallidos}</div>
        <div class="label">Fallidos</div>
      </div>
    </div>
  `;
  
  // Errores detallados
  if (result.results?.errores && result.results.errores.length > 0) {
    html += `
      <div class="error-list">
        <h4 style="margin-bottom: 0.5rem; color: var(--accent-danger);">Detalle de errores:</h4>
        <ul>
          ${result.results.errores.map(err => `<li>${err}</li>`).join('')}
        </ul>
      </div>
    `;
  }
  
  body.innerHTML = html;
  modal.classList.add('active');
}

function closeModal() {
  document.getElementById('resultsModal').classList.remove('active');
}

// Cerrar modal con backdrop
document.querySelector('.modal-backdrop')?.addEventListener('click', closeModal);

// ============================================================================
// CARGAR CLIENTES (para OT)
// ============================================================================

async function loadClientes() {
  try {
    const response = await fetch(`${API_BASE}/api/clientes`);
    const data = await response.json();
    
    if (data.success) {
      CLIENTES = data.clientes;
      CLIENTES_CON_BODEGA = data.clientesConBodega || [];
      renderClientesTags();
    }
  } catch (error) {
    console.error('Error cargando clientes:', error);
  }
}

async function loadProveedores() {
  try {
    const response = await fetch(`${API_BASE}/api/proveedores`);
    const data = await response.json();
    
    if (data.success) {
      PROVEEDORES = data.proveedores;
      PROVEEDORES_CON_BODEGA = data.proveedoresConBodega || [];
      renderProveedoresList();
    }
  } catch (error) {
    console.error('Error cargando proveedores:', error);
  }
}

function renderClientesTags() {
  const container = document.getElementById('clientesTags');
  if (!container) return;
  
  // Agrupar por bodega
  const renca = CLIENTES_CON_BODEGA.filter(c => c.bodega === 'Renca');
  const segmail = CLIENTES_CON_BODEGA.filter(c => c.bodega === 'Segmail');
  
  let html = '';
  if (renca.length > 0) {
    html += '<div class="bodega-group"><strong>📦 Bodega Renca:</strong><div class="tags-container">';
    html += renca.map(c => `<span class="cliente-tag renca">${c.nombre}</span>`).join('');
    html += '</div></div>';
  }
  if (segmail.length > 0) {
    html += '<div class="bodega-group"><strong>📦 Bodega Segmail:</strong><div class="tags-container">';
    html += segmail.map(c => `<span class="cliente-tag segmail">${c.nombre}</span>`).join('');
    html += '</div></div>';
  }
  
  container.innerHTML = html || CLIENTES.map(cliente => 
    `<span class="cliente-tag">${cliente}</span>`
  ).join('');
}

function renderProveedoresList() {
  const container = document.getElementById('lista-proveedores-oc');
  if (!container) return;
  
  // Agrupar por bodega
  const renca = PROVEEDORES_CON_BODEGA.filter(p => p.bodega === 'Renca');
  const segmail = PROVEEDORES_CON_BODEGA.filter(p => p.bodega === 'Segmail');
  
  let html = '';
  if (renca.length > 0) {
    html += '<li><strong>📦 Bodega Renca:</strong><ul>';
    html += renca.map(p => `<li><code>${p.nombre}</code></li>`).join('');
    html += '</ul></li>';
  }
  if (segmail.length > 0) {
    html += '<li><strong>📦 Bodega Segmail:</strong><ul>';
    html += segmail.map(p => `<li><code>${p.nombre}</code></li>`).join('');
    html += '</ul></li>';
  }
  
  container.innerHTML = html || PROVEEDORES.map(proveedor => 
    `<li><code>${proveedor}</code></li>`
  ).join('');
}

// ============================================================================
// CARGAR ESTADÍSTICAS OT
// ============================================================================

async function loadStats() {
  try {
    const response = await fetch(`${API_BASE}/api/stats`);
    const data = await response.json();
    
    if (data.success && currentModule === 'ot') {
      document.getElementById('statTotal').textContent = data.stats.total;
    }
  } catch (error) {
    console.error('Error cargando stats OT:', error);
  }
}

// ============================================================================
// CARGAR ESTADÍSTICAS OC
// ============================================================================

async function loadOCStats() {
  try {
    const response = await fetch(`${API_BASE}/api/stats/oc`);
    const data = await response.json();
    
    if (data.success && currentModule === 'oc') {
      document.getElementById('statTotal').textContent = data.stats.total;
    }
  } catch (error) {
    console.error('Error cargando stats OC:', error);
    // Si falla, mostrar 0
    if (currentModule === 'oc') {
      document.getElementById('statTotal').textContent = '0';
    }
  }
}

// ============================================================================
// CARGAR OT PENDIENTES
// ============================================================================

async function loadOTPendientes(tipo = null) {
  const types = tipo ? [tipo] : ['OTA', 'OTADET', 'OTF'];
  
  for (const t of types) {
    try {
      const response = await fetch(`${API_BASE}/api/ot-pendientes?tipo=${t}`);
      const data = await response.json();
      
      if (data.success) {
        const select = document.getElementById(`select-ot-${t.toLowerCase()}`);
        if (select) {
          // Mantener la primera opción
          const firstOption = select.options[0];
          select.innerHTML = '';
          select.appendChild(firstOption);
          
          // Agregar opciones
          data.data.forEach(ot => {
            const option = document.createElement('option');
            option.value = ot.value;
            option.textContent = ot.label;
            select.appendChild(option);
          });
        }
      }
    } catch (error) {
      console.error(`Error cargando OT pendientes para ${t}:`, error);
    }
  }
}

// ============================================================================
// CARGAR OC PENDIENTES
// ============================================================================

async function loadOCPendientes() {
  try {
    const response = await fetch(`${API_BASE}/api/oc-pendientes`);
    const data = await response.json();
    
    if (data.success) {
      const select = document.getElementById('select-oc-recepcion');
      if (select) {
        // Mantener la primera opción
        const firstOption = select.options[0];
        select.innerHTML = '';
        select.appendChild(firstOption);
        
        // Agregar opciones
        data.data.forEach(oc => {
          const option = document.createElement('option');
          option.value = oc.value;
          option.textContent = oc.label;
          select.appendChild(option);
        });
      }
    }
  } catch (error) {
    console.error('Error cargando OC pendientes:', error);
  }
}

// ============================================================================
// DESCARGAR PLANTILLAS
// ============================================================================

function downloadTemplate(tipo) {
  window.location.href = `${API_BASE}/api/template/${tipo}`;
}

// ============================================================================
// AJUSTE DE FECHA DE RECEPCIÓN OC
// ============================================================================

async function loadOCParaAjuste() {
  try {
    const response = await fetch(`${API_BASE}/api/oc-resumen-pendientes`);
    const data = await response.json();
    
    const tbody = document.getElementById('tbody-oc-ajuste');
    const emptyState = document.getElementById('tabla-oc-empty');
    const tablaScroll = document.querySelector('.tabla-scroll');
    
    if (!tbody) return;
    
    if (data.success && data.data && data.data.length > 0) {
      tbody.innerHTML = data.data.map(oc => `
        <tr data-oc="${oc.oc}" data-proveedor="${oc.proveedor}" data-fecha="${oc.fecha_recepcion || ''}">
          <td>${oc.proveedor || 'Sin proveedor'}</td>
          <td><strong>${oc.oc}</strong></td>
          <td class="cantidad">${formatNumber(oc.cantidad_total)}</td>
          <td class="monto">$${formatNumber(oc.monto_total)}</td>
          <td class="fecha">${formatFecha(oc.fecha_recepcion)}</td>
          <td>
            <button class="btn-seleccionar" onclick="seleccionarOCParaAjuste('${oc.oc}', '${oc.proveedor || 'Sin proveedor'}', '${oc.fecha_recepcion || ''}')">
              Seleccionar
            </button>
          </td>
        </tr>
      `).join('');
      
      if (tablaScroll) tablaScroll.style.display = 'block';
      if (emptyState) emptyState.classList.remove('visible');
    } else {
      tbody.innerHTML = '';
      if (tablaScroll) tablaScroll.style.display = 'none';
      if (emptyState) emptyState.classList.add('visible');
    }
    
    // Limpiar selección previa
    limpiarSeleccionOC();
    
  } catch (error) {
    console.error('Error cargando OC para ajuste:', error);
  }
}

function seleccionarOCParaAjuste(oc, proveedor, fechaActual) {
  ocSeleccionadaParaAjuste = { oc, proveedor, fechaActual };
  
  // Marcar fila seleccionada en tabla
  const filas = document.querySelectorAll('#tbody-oc-ajuste tr');
  filas.forEach(fila => {
    if (fila.dataset.oc === oc) {
      fila.classList.add('selected');
    } else {
      fila.classList.remove('selected');
    }
  });
  
  // Actualizar panel de selección
  const infoContainer = document.getElementById('oc-seleccionada-info');
  if (infoContainer) {
    infoContainer.innerHTML = `
      <div class="oc-info-selected">
        <span class="oc-numero">OC ${oc}</span>
        <span class="oc-proveedor">${proveedor}</span>
        <span class="oc-fecha-actual">Fecha actual: <span>${formatFecha(fechaActual)}</span></span>
      </div>
    `;
  }
  
  // Habilitar input de fecha y botón
  const inputFecha = document.getElementById('nueva-fecha-recepcion');
  const btnActualizar = document.getElementById('btn-actualizar-fecha');
  
  if (inputFecha) {
    inputFecha.disabled = false;
    // Si hay fecha actual, convertirla a formato input date
    if (fechaActual) {
      const fecha = new Date(fechaActual);
      if (!isNaN(fecha.getTime())) {
        inputFecha.value = fecha.toISOString().split('T')[0];
      } else {
        inputFecha.value = '';
      }
    } else {
      inputFecha.value = '';
    }
  }
  
  if (btnActualizar) {
    btnActualizar.disabled = false;
  }
}

function limpiarSeleccionOC() {
  ocSeleccionadaParaAjuste = null;
  
  // Quitar selección de filas
  const filas = document.querySelectorAll('#tbody-oc-ajuste tr');
  filas.forEach(fila => fila.classList.remove('selected'));
  
  // Limpiar panel de selección
  const infoContainer = document.getElementById('oc-seleccionada-info');
  if (infoContainer) {
    infoContainer.innerHTML = '<p>Selecciona una OC de la tabla</p>';
  }
  
  // Deshabilitar input y botón
  const inputFecha = document.getElementById('nueva-fecha-recepcion');
  const btnActualizar = document.getElementById('btn-actualizar-fecha');
  
  if (inputFecha) {
    inputFecha.disabled = true;
    inputFecha.value = '';
  }
  
  if (btnActualizar) {
    btnActualizar.disabled = true;
  }
}

async function actualizarFechaRecepcion() {
  if (!ocSeleccionadaParaAjuste) {
    alert('Por favor selecciona una OC primero');
    return;
  }
  
  const inputFecha = document.getElementById('nueva-fecha-recepcion');
  const nuevaFecha = inputFecha?.value;
  
  if (!nuevaFecha) {
    alert('Por favor selecciona una fecha');
    return;
  }
  
  showLoading(true);
  
  try {
    const response = await fetch(`${API_BASE}/api/oc/actualizar-fecha`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        oc: ocSeleccionadaParaAjuste.oc,
        fecha_recepcion: nuevaFecha
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      showResults({
        success: true,
        message: `Fecha de recepción actualizada exitosamente para OC ${ocSeleccionadaParaAjuste.oc}`,
        results: {
          exitosos: result.registrosActualizados || 1,
          fallidos: 0,
          errores: []
        }
      }, 'oc-ajuste-fecha');
      
      // Recargar tabla
      loadOCParaAjuste();
    } else {
      showResults({
        success: false,
        message: result.error || 'Error al actualizar la fecha',
        results: {
          exitosos: 0,
          fallidos: 1,
          errores: [result.error]
        }
      }, 'oc-ajuste-fecha');
    }
    
  } catch (error) {
    console.error('Error actualizando fecha:', error);
    showResults({
      success: false,
      message: 'Error de conexión con el servidor',
      results: {
        exitosos: 0,
        fallidos: 1,
        errores: [error.message]
      }
    }, 'oc-ajuste-fecha');
  } finally {
    showLoading(false);
  }
}

// Formatear números
function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat('es-CL').format(num);
}

// Formatear fecha
function formatFecha(fechaStr) {
  if (!fechaStr) return 'Sin fecha';
  
  try {
    const fecha = new Date(fechaStr);
    if (isNaN(fecha.getTime())) return fechaStr;
    
    return fecha.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return fechaStr;
  }
}

// ============================================================================
// AJUSTE DE FECHA COMPROMETIDA OT
// ============================================================================

async function loadOTParaAjuste() {
  try {
    const response = await fetch(`${API_BASE}/api/ot-resumen-pendientes`);
    const data = await response.json();
    
    const tbody = document.getElementById('tbody-ot-ajuste');
    const emptyState = document.getElementById('tabla-ot-empty');
    const tablaScroll = tbody?.closest('.tabla-scroll');
    
    if (!tbody) return;
    
    if (data.success && data.data && data.data.length > 0) {
      tbody.innerHTML = data.data.map(ot => `
        <tr data-ot="${ot.id_ot}" data-cliente="${ot.cliente}" data-estado="${ot.estado}" data-fecha="${ot.fecha_transferencia_comprometida || ''}">
          <td>${ot.cliente || 'Sin cliente'}</td>
          <td><strong>${ot.id_ot}</strong></td>
          <td><span class="estado-badge estado-${ot.estado.toLowerCase().replace('_', '-')}">${ot.estado}</span></td>
          <td class="cantidad">${formatNumber(ot.cantidad_total)}</td>
          <td class="fecha">${formatFecha(ot.fecha_transferencia_comprometida)}</td>
          <td>
            <button class="btn-seleccionar" onclick="seleccionarOTParaAjuste('${ot.id_ot}', '${ot.cliente || 'Sin cliente'}', '${ot.estado}', '${ot.fecha_transferencia_comprometida || ''}')">
              Seleccionar
            </button>
          </td>
        </tr>
      `).join('');
      
      if (tablaScroll) tablaScroll.style.display = 'block';
      if (emptyState) emptyState.classList.remove('visible');
    } else {
      tbody.innerHTML = '';
      if (tablaScroll) tablaScroll.style.display = 'none';
      if (emptyState) emptyState.classList.add('visible');
    }
    
    // Limpiar selección previa
    limpiarSeleccionOT();
    
  } catch (error) {
    console.error('Error cargando OT para ajuste:', error);
  }
}

function seleccionarOTParaAjuste(idOt, cliente, estado, fechaActual) {
  otSeleccionadaParaAjuste = { idOt, cliente, estado, fechaActual };
  
  // Marcar fila seleccionada en tabla
  const filas = document.querySelectorAll('#tbody-ot-ajuste tr');
  filas.forEach(fila => {
    if (fila.dataset.ot === idOt) {
      fila.classList.add('selected');
    } else {
      fila.classList.remove('selected');
    }
  });
  
  // Actualizar panel de selección
  const infoContainer = document.getElementById('ot-seleccionada-info');
  if (infoContainer) {
    infoContainer.innerHTML = `
      <div class="oc-info-selected">
        <span class="oc-numero">${idOt}</span>
        <span class="oc-proveedor">${cliente} - ${estado}</span>
        <span class="oc-fecha-actual">Fecha actual: <span>${formatFecha(fechaActual)}</span></span>
      </div>
    `;
  }
  
  // Habilitar input de fecha y botón
  const inputFecha = document.getElementById('nueva-fecha-ot');
  const btnActualizar = document.getElementById('btn-actualizar-fecha-ot');
  
  if (inputFecha) {
    inputFecha.disabled = false;
    // Si hay fecha actual, convertirla a formato input date
    if (fechaActual) {
      const fecha = new Date(fechaActual);
      if (!isNaN(fecha.getTime())) {
        inputFecha.value = fecha.toISOString().split('T')[0];
      } else {
        inputFecha.value = '';
      }
    } else {
      inputFecha.value = '';
    }
  }
  
  if (btnActualizar) {
    btnActualizar.disabled = false;
  }
}

function limpiarSeleccionOT() {
  otSeleccionadaParaAjuste = null;
  
  // Quitar selección de filas
  const filas = document.querySelectorAll('#tbody-ot-ajuste tr');
  filas.forEach(fila => fila.classList.remove('selected'));
  
  // Limpiar panel de selección
  const infoContainer = document.getElementById('ot-seleccionada-info');
  if (infoContainer) {
    infoContainer.innerHTML = '<p>Selecciona una OT de la tabla</p>';
  }
  
  // Deshabilitar input y botón
  const inputFecha = document.getElementById('nueva-fecha-ot');
  const btnActualizar = document.getElementById('btn-actualizar-fecha-ot');
  
  if (inputFecha) {
    inputFecha.disabled = true;
    inputFecha.value = '';
  }
  
  if (btnActualizar) {
    btnActualizar.disabled = true;
  }
}

async function actualizarFechaOT() {
  if (!otSeleccionadaParaAjuste) {
    alert('Por favor selecciona una OT primero');
    return;
  }
  
  const inputFecha = document.getElementById('nueva-fecha-ot');
  const nuevaFecha = inputFecha?.value;
  
  if (!nuevaFecha) {
    alert('Por favor selecciona una fecha');
    return;
  }
  
  showLoading(true);
  
  try {
    const response = await fetch(`${API_BASE}/api/ot/actualizar-fecha`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id_ot: otSeleccionadaParaAjuste.idOt,
        fecha_transferencia_comprometida: nuevaFecha
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      showResults({
        success: true,
        message: `Fecha comprometida actualizada exitosamente para OT ${otSeleccionadaParaAjuste.idOt}`,
        results: {
          exitosos: result.registrosActualizados || 1,
          fallidos: 0,
          errores: []
        }
      }, 'ot-ajuste-fecha');
      
      // Recargar tabla
      loadOTParaAjuste();
    } else {
      showResults({
        success: false,
        message: result.error || 'Error al actualizar la fecha',
        results: {
          exitosos: 0,
          fallidos: 1,
          errores: [result.error]
        }
      }, 'ot-ajuste-fecha');
    }
    
  } catch (error) {
    console.error('Error actualizando fecha OT:', error);
    showResults({
      success: false,
      message: 'Error de conexión con el servidor',
      results: {
        exitosos: 0,
        fallidos: 1,
        errores: [error.message]
      }
    }, 'ot-ajuste-fecha');
  } finally {
    showLoading(false);
  }
}

// ============================================================================
// LOADING
// ============================================================================

function showLoading(show) {
  const overlay = document.getElementById('loadingOverlay');
  if (show) {
    overlay.classList.add('active');
  } else {
    overlay.classList.remove('active');
  }
}

// ============================================================================
// TEST DE CONEXIÓN
// ============================================================================

async function testConnection() {
  const statusDot = document.querySelector('.status-dot');
  const statusText = document.querySelector('.status-text');
  
  try {
    const response = await fetch(`${API_BASE}/api/test-connection`);
    const data = await response.json();
    
    if (data.success) {
      statusDot?.classList.remove('error');
      if (statusText) statusText.textContent = 'Conectado';
    } else {
      statusDot?.classList.add('error');
      if (statusText) statusText.textContent = 'Error conexión';
    }
  } catch (error) {
    statusDot?.classList.add('error');
    if (statusText) statusText.textContent = 'Sin conexión';
  }
}

// ============================================================================
// UTILIDADES
// ============================================================================

// Escape key para cerrar modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
});

// ============================================================================
// RECEPCIONES OC - Últimos 30 días
// ============================================================================

async function loadOCRecepciones() {
  try {
    const response = await fetch(`${API_BASE}/api/oc-recepciones`);
    const data = await response.json();
    
    const tbody = document.getElementById('tbody-oc-recepciones');
    const emptyState = document.getElementById('tabla-recepciones-empty');
    const tablaScroll = document.querySelector('.tabla-recepciones-scroll');
    
    if (!tbody) return;
    
    if (data.success && data.data && data.data.length > 0) {
      // Renderizar filas con onclick para abrir detalle
      tbody.innerHTML = data.data.map(item => {
        // Determinar clase de alerta
        let alertaClass = '';
        if (item.alertas && item.alertas !== '-') {
          alertaClass = 'tiene-alertas';
        }
        
        // Determinar clase de fill rate
        let fillRateClass = '';
        if (item.fill_rate >= 100) {
          fillRateClass = 'fill-rate-completo';
        } else if (item.fill_rate >= 80) {
          fillRateClass = 'fill-rate-alto';
        } else if (item.fill_rate >= 50) {
          fillRateClass = 'fill-rate-medio';
        } else {
          fillRateClass = 'fill-rate-bajo';
        }
        
        // Determinar clase de fill rate acumulado
        let fillRateAcumClass = '';
        const fillRateAcum = item.fill_rate_acumulado || 0;
        if (fillRateAcum >= 100) {
          fillRateAcumClass = 'fill-rate-completo';
        } else if (fillRateAcum >= 80) {
          fillRateAcumClass = 'fill-rate-alto';
        } else if (fillRateAcum >= 50) {
          fillRateAcumClass = 'fill-rate-medio';
        } else {
          fillRateAcumClass = 'fill-rate-bajo';
        }
        
        return `
          <tr class="${alertaClass} clickable-row" onclick="abrirDetalleRecepcion('${item.oc}', '${item.proveedor}')" title="Clic para ver detalle y editar">
            <td class="fecha">${formatFecha(item.fecha_actualizacion)}</td>
            <td>${item.proveedor}</td>
            <td><strong>${item.oc}</strong></td>
            <td class="text-right monto">$${formatNumber(item.valorizado_ingreso)}</td>
            <td class="text-right ${fillRateClass}">${item.fill_rate.toFixed(2)}%</td>
            <td class="text-right ${fillRateAcumClass}">${fillRateAcum.toFixed(2)}%</td>
            <td class="alertas-cell">${formatAlertas(item.alertas)}</td>
          </tr>
        `;
      }).join('');
      
      if (tablaScroll) tablaScroll.style.display = 'block';
      if (emptyState) emptyState.classList.remove('visible');
      
      // Calcular y mostrar resumen
      calcularResumenRecepciones(data.data);
      
    } else {
      tbody.innerHTML = '';
      if (tablaScroll) tablaScroll.style.display = 'none';
      if (emptyState) emptyState.classList.add('visible');
      
      // Limpiar resumen
      document.getElementById('resumen-total-recepciones').textContent = '0';
      document.getElementById('resumen-valorizado-total').textContent = '$0';
      document.getElementById('resumen-fill-rate').textContent = '0%';
      document.getElementById('resumen-con-alertas').textContent = '0';
    }
    
  } catch (error) {
    console.error('Error cargando recepciones OC:', error);
  }
}

function calcularResumenRecepciones(datos) {
  const totalRecepciones = datos.length;
  const valorizadoTotal = datos.reduce((sum, item) => sum + item.valorizado_ingreso, 0);
  const fillRatePromedio = datos.length > 0 
    ? datos.reduce((sum, item) => sum + item.fill_rate, 0) / datos.length 
    : 0;
  const conAlertas = datos.filter(item => item.alertas && item.alertas !== '-').length;
  
  document.getElementById('resumen-total-recepciones').textContent = formatNumber(totalRecepciones);
  document.getElementById('resumen-valorizado-total').textContent = `$${formatNumber(valorizadoTotal)}`;
  document.getElementById('resumen-fill-rate').textContent = `${fillRatePromedio.toFixed(2)}%`;
  document.getElementById('resumen-con-alertas').textContent = formatNumber(conAlertas);
}

function formatAlertas(alertas) {
  if (!alertas || alertas === '-') {
    return '<span class="sin-alertas">✓</span>';
  }
  
  // Separar las alertas y formatearlas con badges
  const partes = alertas.split(', ');
  return partes.map(alerta => {
    if (alerta.includes('Precio')) {
      return `<span class="alerta-badge alerta-precio">${alerta}</span>`;
    } else if (alerta.includes('Sobre Recepción')) {
      return `<span class="alerta-badge alerta-sobre-recepcion">${alerta}</span>`;
    }
    return `<span class="alerta-badge">${alerta}</span>`;
  }).join(' ');
}

// ============================================================================
// DETALLE DE RECEPCIÓN OC - Modal con edición
// ============================================================================

let detalleOCActual = null; // Datos actuales del detalle
let cambiosPendientes = {}; // Cambios realizados por el usuario

async function abrirDetalleRecepcion(oc, proveedor) {
  showLoading(true);
  
  try {
    const response = await fetch(`${API_BASE}/api/oc-detalle/${encodeURIComponent(oc)}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Error al obtener detalle');
    }
    
    // Guardar datos completos para exportar Excel
    detalleOCActual = {
      oc: oc,
      proveedor: proveedor,
      productos: data.productos,
      totales: data.totales
    };
    cambiosPendientes = {};
    
    // Actualizar título del modal
    document.getElementById('detalleModalTitle').textContent = `Detalle OC ${oc}`;
    document.getElementById('detalleModalSubtitle').textContent = proveedor;
    
    // Actualizar totales
    actualizarTotalesDetalle(data.totales);
    
    // Renderizar tabla de productos
    renderizarTablaDetalle(data.productos);
    
    // Mostrar modal
    document.getElementById('detalleRecepcionModal').classList.add('active');
    
  } catch (error) {
    console.error('Error abriendo detalle:', error);
    alert('Error al cargar el detalle de la OC: ' + error.message);
  } finally {
    showLoading(false);
  }
}

function actualizarTotalesDetalle(totales) {
  document.getElementById('totalOcCompra').textContent = `$${formatNumber(totales.total_oc)}`;
  document.getElementById('totalRecepcion').textContent = `$${formatNumber(totales.total_recepcion)}`;
  document.getElementById('totalProductos').textContent = `${totales.productos_recepcionados} / ${totales.productos_total}`;
  document.getElementById('totalConAlertas').textContent = totales.productos_con_alertas;
}

function renderizarTablaDetalle(productos) {
  const tbody = document.getElementById('tbodyDetalleRecepcion');
  
  // Ordenar productos: primero los que tienen alertas, luego sin alertas
  const productosOrdenados = [...productos].sort((a, b) => {
    const alertasA = a.alertas ? a.alertas.length : 0;
    const alertasB = b.alertas ? b.alertas.length : 0;
    
    // Primero los que tienen más alertas
    if (alertasB !== alertasA) {
      return alertasB - alertasA;
    }
    
    // Si tienen la misma cantidad de alertas, ordenar por código
    return (a.cod_prod || '').localeCompare(b.cod_prod || '');
  });
  
  tbody.innerHTML = productosOrdenados.map(p => {
    // Formatear alertas
    let alertasHtml = '';
    if (p.alertas && p.alertas.length > 0) {
      alertasHtml = p.alertas.map(a => {
        let clase = 'alerta-badge';
        if (a.tipo === 'precio') clase += ' alerta-precio';
        else if (a.tipo === 'sobre_recepcion') clase += ' alerta-sobre-recepcion';
        else if (a.tipo === 'sin_recepcion') clase += ' alerta-sin-recepcion';
        return `<span class="${clase}" title="${a.mensaje}">${getTipoAlertaIcono(a.tipo)}</span>`;
      }).join(' ');
    } else {
      alertasHtml = '<span class="sin-alertas">✓</span>';
    }
    
    // Determinar si tiene alertas
    const rowClass = p.alertas && p.alertas.length > 0 ? 'tiene-alertas' : '';
    
    return `
      <tr class="${rowClass}" data-id="${p.id}" data-cod="${p.cod_prod}">
        <td class="cod-prod"><code>${p.cod_prod}</code></td>
        <td class="producto-nombre" title="${p.producto || ''}">${truncarTexto(p.producto, 30)}</td>
        <td class="text-right">${formatNumber(p.precio_prod_oc)}</td>
        <td class="text-right">${formatNumber(p.cantidad_prod_oc)}</td>
        <td class="text-right monto">$${formatNumber(p.total_oc)}</td>
        <td class="text-right editable" onclick="hacerEditable(this, '${p.id}', 'precio_prod_recepcion', ${p.precio_prod_recepcion})">
          <span class="editable-value">${formatNumber(p.precio_prod_recepcion)}</span>
        </td>
        <td class="text-right editable" onclick="hacerEditable(this, '${p.id}', 'cant_prod_recepcion', ${p.cant_prod_recepcion})">
          <span class="editable-value">${formatNumber(p.cant_prod_recepcion)}</span>
        </td>
        <td class="text-right monto total-recep">${formatNumber(p.total_recepcion)}</td>
        <td class="alertas-cell">${alertasHtml}</td>
      </tr>
    `;
  }).join('');
}

function getTipoAlertaIcono(tipo) {
  switch(tipo) {
    case 'precio': return '💰';
    case 'sobre_recepcion': return '⚠️';
    case 'sin_recepcion': return '❌';
    default: return '⚠️';
  }
}

function truncarTexto(texto, maxLength) {
  if (!texto) return '-';
  if (texto.length <= maxLength) return texto;
  return texto.substring(0, maxLength) + '...';
}

function hacerEditable(celda, id, campo, valorActual) {
  // Si ya hay un input, no hacer nada
  if (celda.querySelector('input')) return;
  
  const valorMostrado = celda.querySelector('.editable-value');
  const valorNumerico = parseFloat(String(valorActual).replace(/\./g, '').replace(',', '.')) || 0;
  
  // Crear input
  const input = document.createElement('input');
  input.type = 'number';
  input.className = 'editable-input';
  input.value = valorNumerico;
  input.step = campo === 'precio_prod_recepcion' ? '0.01' : '1';
  input.min = '0';
  
  // Guardar valor original para cancelar
  input.dataset.originalValue = valorNumerico;
  input.dataset.id = id;
  input.dataset.campo = campo;
  
  // Ocultar span y mostrar input
  valorMostrado.style.display = 'none';
  celda.appendChild(input);
  input.focus();
  input.select();
  
  // Eventos
  input.addEventListener('blur', () => guardarValorEditado(celda, input));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      input.blur();
    } else if (e.key === 'Escape') {
      cancelarEdicion(celda, input);
    }
  });
}

function guardarValorEditado(celda, input) {
  const id = input.dataset.id;
  const campo = input.dataset.campo;
  const valorOriginal = parseFloat(input.dataset.originalValue);
  const valorNuevo = parseFloat(input.value) || 0;
  
  // Restaurar span
  const valorMostrado = celda.querySelector('.editable-value');
  valorMostrado.textContent = formatNumber(valorNuevo);
  valorMostrado.style.display = '';
  
  // Remover input
  input.remove();
  
  // Marcar como modificado si cambió
  if (valorNuevo !== valorOriginal) {
    celda.classList.add('modificado');
    
    // Guardar cambio pendiente
    if (!cambiosPendientes[id]) {
      cambiosPendientes[id] = { id };
    }
    cambiosPendientes[id][campo] = valorNuevo;
    
    // Recalcular total de recepción de esa fila
    recalcularTotalFila(celda.closest('tr'));
  }
}

function cancelarEdicion(celda, input) {
  const valorOriginal = parseFloat(input.dataset.originalValue);
  const valorMostrado = celda.querySelector('.editable-value');
  valorMostrado.textContent = formatNumber(valorOriginal);
  valorMostrado.style.display = '';
  input.remove();
}

function recalcularTotalFila(fila) {
  const celdas = fila.querySelectorAll('.editable .editable-value');
  const precioRecep = parseFloat(String(celdas[0].textContent).replace(/\./g, '').replace(',', '.')) || 0;
  const cantRecep = parseFloat(String(celdas[1].textContent).replace(/\./g, '').replace(',', '.')) || 0;
  const totalRecep = precioRecep * cantRecep;
  
  const celdaTotal = fila.querySelector('.total-recep');
  if (celdaTotal) {
    celdaTotal.textContent = formatNumber(totalRecep);
  }
  
  // Recalcular totales generales
  recalcularTotalesGenerales();
}

function recalcularTotalesGenerales() {
  const filas = document.querySelectorAll('#tbodyDetalleRecepcion tr');
  let totalRecepcion = 0;
  let productosRecepcionados = 0;
  
  filas.forEach(fila => {
    const celdas = fila.querySelectorAll('.editable .editable-value');
    const precioRecep = parseFloat(String(celdas[0].textContent).replace(/\./g, '').replace(',', '.')) || 0;
    const cantRecep = parseFloat(String(celdas[1].textContent).replace(/\./g, '').replace(',', '.')) || 0;
    
    totalRecepcion += precioRecep * cantRecep;
    if (cantRecep > 0) productosRecepcionados++;
  });
  
  document.getElementById('totalRecepcion').textContent = `$${formatNumber(totalRecepcion)}`;
  document.getElementById('totalProductos').textContent = `${productosRecepcionados} / ${filas.length}`;
}

async function guardarCambiosRecepcion() {
  const productosModificados = Object.values(cambiosPendientes);
  
  if (productosModificados.length === 0) {
    alert('No hay cambios pendientes para guardar');
    return;
  }
  
  if (!confirm(`¿Cerrar recepción de OC ${detalleOCActual.oc}?\n\nSe actualizarán ${productosModificados.length} producto(s) con los valores ingresados.\nLos demás productos quedarán con cantidad 0 (no recepcionados).`)) {
    return;
  }
  
  showLoading(true);
  
  try {
    const response = await fetch(`${API_BASE}/api/oc/actualizar-recepciones-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        productos: productosModificados,
        oc: detalleOCActual.oc  // Enviar el número de OC para cerrar todos los productos
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert(`✅ ${result.message}`);
      
      // Cerrar modal y recargar datos
      closeDetalleModal();
      loadOCRecepciones();
      
    } else {
      let errorMsg = result.message || 'Error al guardar cambios';
      if (result.results?.errores && result.results.errores.length > 0) {
        errorMsg += '\n\nErrores:\n' + result.results.errores.join('\n');
      }
      alert('⚠️ ' + errorMsg);
    }
    
  } catch (error) {
    console.error('Error guardando cambios:', error);
    alert('Error de conexión: ' + error.message);
  } finally {
    showLoading(false);
  }
}

function closeDetalleModal() {
  document.getElementById('detalleRecepcionModal').classList.remove('active');
  detalleOCActual = null;
  cambiosPendientes = {};
}

// Descargar Excel de detalle recepción OC
function descargarExcelRecepcion() {
  if (!detalleOCActual || !detalleOCActual.productos) {
    alert('No hay datos para descargar');
    return;
  }

  const productos = detalleOCActual.productos;
  const oc = detalleOCActual.oc;
  const proveedor = detalleOCActual.proveedor || '';

  // Crear datos para Excel
  const datosExcel = productos.map(p => {
    // Usar valores modificados si existen
    const precioRecepcion = cambiosPendientes[p.id]?.precio_prod_recepcion ?? p.precio_prod_recepcion;
    const cantRecepcion = cambiosPendientes[p.id]?.cant_prod_recepcion ?? p.cant_prod_recepcion;
    const totalRecepcion = precioRecepcion * cantRecepcion;
    
    // Determinar alertas
    let alertas = [];
    if (p.alertas && p.alertas.length > 0) {
      alertas = p.alertas.map(a => a.tipo).join(', ');
    }

    return {
      'Código': p.cod_prod || '',
      'Producto': p.producto || '',
      'Precio OC': p.precio_prod_oc || 0,
      'Cant. OC': p.cantidad_prod_oc || 0,
      'Total OC': p.total_oc || 0,
      'Precio Recepción': precioRecepcion || 0,
      'Cant. Recepción': cantRecepcion || 0,
      'Total Recepción': Math.round(totalRecepcion) || 0,
      'Alertas': alertas
    };
  });

  // Crear worksheet
  const ws = XLSX.utils.json_to_sheet(datosExcel);

  // Ajustar anchos de columna
  ws['!cols'] = [
    { wch: 15 },  // Código
    { wch: 40 },  // Producto
    { wch: 12 },  // Precio OC
    { wch: 10 },  // Cant. OC
    { wch: 12 },  // Total OC
    { wch: 15 },  // Precio Recepción
    { wch: 15 },  // Cant. Recepción
    { wch: 15 },  // Total Recepción
    { wch: 20 }   // Alertas
  ];

  // Crear workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Detalle Recepción');

  // Descargar archivo
  const fecha = new Date().toISOString().split('T')[0];
  const proveedorLimpio = proveedor.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
  const nombreArchivo = `Recepcion_OC_${oc}_${proveedorLimpio}_${fecha}.xlsx`;
  XLSX.writeFile(wb, nombreArchivo);
}

// ============================================================================
// OT TRANSFERENCIAS - Historial de transferencias
// ============================================================================

async function loadOTTransferencias() {
  try {
    const response = await fetch(`${API_BASE}/api/ot-transferencias`);
    const data = await response.json();
    
    const tbody = document.getElementById('tbody-ot-transferencias');
    const emptyState = document.getElementById('tabla-ot-transferencias-empty');
    const tablaScroll = document.querySelector('#panel-ot-transferencias .tabla-recepciones-scroll');
    
    if (!tbody) return;
    
    if (data.success && data.data && data.data.length > 0) {
      // Renderizar filas con onclick para abrir detalle
      tbody.innerHTML = data.data.map(item => {
        // Determinar clase de fill rate
        let fillRateClass = '';
        if (item.fill_rate >= 100) {
          fillRateClass = 'fill-rate-completo';
        } else if (item.fill_rate >= 80) {
          fillRateClass = 'fill-rate-alto';
        } else if (item.fill_rate >= 50) {
          fillRateClass = 'fill-rate-medio';
        } else {
          fillRateClass = 'fill-rate-bajo';
        }
        
        return `
          <tr class="clickable-row" onclick="abrirDetalleTransferencia('${item.id_ot}', '${item.cliente}')" title="Clic para ver detalle y editar">
            <td class="fecha">${formatFecha(item.fecha_actualizacion)}</td>
            <td>${item.cliente}</td>
            <td><strong>${item.id_ot}</strong></td>
            <td class="text-right">${formatNumber(item.total_unidades)}</td>
            <td class="text-right ${fillRateClass}">${item.fill_rate.toFixed(2)}%</td>
          </tr>
        `;
      }).join('');
      
      if (tablaScroll) tablaScroll.style.display = 'block';
      if (emptyState) emptyState.classList.remove('visible');
      
      // Calcular y mostrar resumen
      calcularResumenTransferencias(data.data);
      
    } else {
      tbody.innerHTML = '';
      if (tablaScroll) tablaScroll.style.display = 'none';
      if (emptyState) emptyState.classList.add('visible');
      
      // Limpiar resumen
      document.getElementById('ot-total-transferencias').textContent = '0';
      document.getElementById('ot-total-unidades').textContent = '0';
      document.getElementById('ot-fill-rate-promedio').textContent = '0%';
    }
    
  } catch (error) {
    console.error('Error cargando transferencias OT:', error);
  }
}

function calcularResumenTransferencias(data) {
  const totalTransferencias = data.length;
  const totalUnidades = data.reduce((sum, item) => sum + item.total_unidades, 0);
  const fillRatePromedio = data.length > 0 
    ? data.reduce((sum, item) => sum + item.fill_rate, 0) / data.length 
    : 0;
  
  document.getElementById('ot-total-transferencias').textContent = totalTransferencias;
  document.getElementById('ot-total-unidades').textContent = formatNumber(totalUnidades);
  document.getElementById('ot-fill-rate-promedio').textContent = `${fillRatePromedio.toFixed(2)}%`;
}

// ============================================================================
// DETALLE DE TRANSFERENCIA OT - Modal y edición
// ============================================================================

let detalleOTActual = null;
let cambiosPendientesOT = {};

async function abrirDetalleTransferencia(idOt, cliente) {
  showLoading(true);
  
  try {
    const response = await fetch(`${API_BASE}/api/ot-detalle/${encodeURIComponent(idOt)}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Error al obtener detalle');
    }
    
    // Guardar datos completos de OT actual para exportar Excel
    detalleOTActual = {
      id_ot: idOt,
      cliente: cliente || data.cliente,
      productos: data.productos,
      totales: data.totales
    };
    cambiosPendientesOT = {};
    
    // Actualizar header del modal
    document.getElementById('detalleOTModalTitle').textContent = `Detalle de Transferencia: ${idOt}`;
    document.getElementById('detalleOTModalSubtitle').textContent = `Cliente: ${detalleOTActual.cliente}`;
    
    // Actualizar totales
    actualizarTotalesDetalleOT(data.totales);
    
    // Renderizar tabla de productos
    renderizarTablaDetalleOT(data.productos);
    
    // Mostrar modal
    document.getElementById('detalleTransferenciaModal').classList.add('active');
    
  } catch (error) {
    console.error('Error abriendo detalle OT:', error);
    alert('Error al cargar el detalle de la OT: ' + error.message);
  } finally {
    showLoading(false);
  }
}

function actualizarTotalesDetalleOT(totales) {
  document.getElementById('totalOTPreparacion').textContent = formatNumber(totales.total_preparacion);
  document.getElementById('totalOTRecepcion').textContent = formatNumber(totales.total_recepcion);
  document.getElementById('totalOTValorizado').textContent = `$${formatNumber(Math.round(totales.total_valorizado))}`;
  document.getElementById('totalOTProductos').textContent = `${totales.productos_recepcionados} / ${totales.productos_total}`;
  document.getElementById('totalOTConAlertas').textContent = totales.productos_con_alertas;
}

function renderizarTablaDetalleOT(productos) {
  const tbody = document.getElementById('tbodyDetalleTransferencia');
  
  // Ordenar productos: 
  // 1. Alertas con diferencia positiva (exceso) primero
  // 2. Alertas con diferencia negativa (faltante)
  // 3. Sin alertas (coinciden) al final
  const productosOrdenados = [...productos].sort((a, b) => {
    // Calcular diferencias
    const difA = a.alerta ? a.alerta.diferencia : 0;
    const difB = b.alerta ? b.alerta.diferencia : 0;
    
    // Prioridad: exceso (positivo) > faltante (negativo) > sin alerta (0)
    const prioridadA = difA > 0 ? 1 : (difA < 0 ? 2 : 3);
    const prioridadB = difB > 0 ? 1 : (difB < 0 ? 2 : 3);
    
    if (prioridadA !== prioridadB) {
      return prioridadA - prioridadB;
    }
    
    // Dentro de la misma prioridad, ordenar por magnitud de diferencia (mayor primero)
    return Math.abs(difB) - Math.abs(difA);
  });
  
  tbody.innerHTML = productosOrdenados.map(p => {
    // Formatear alerta
    let alertaHtml = '';
    if (p.alerta) {
      let clase = 'alerta-badge';
      if (p.alerta.tipo === 'exceso') {
        clase += ' alerta-sobre-recepcion';
      } else {
        clase += ' alerta-sin-recepcion';
      }
      alertaHtml = `<span class="${clase}" title="${p.alerta.mensaje}">${p.alerta.tipo === 'exceso' ? '⬆️' : '⬇️'} ${Math.abs(p.alerta.diferencia)}</span>`;
    } else {
      alertaHtml = '<span class="sin-alertas">✓</span>';
    }
    
    // Determinar si tiene alertas
    const rowClass = p.alerta ? 'tiene-alertas' : '';
    
    // Truncar nombre si es muy largo
    const nombreCorto = p.nombre && p.nombre.length > 25 ? p.nombre.substring(0, 25) + '...' : (p.nombre || '-');
    
    return `
      <tr class="${rowClass}" data-id="${p.id}" data-sku="${p.sku}" data-precio="${p.precio_base}">
        <td class="tipo">${p.tipo || '-'}</td>
        <td class="sku"><code>${p.sku}</code></td>
        <td class="nombre" title="${p.nombre || ''}">${nombreCorto}</td>
        <td class="text-right monto valorizado">$${formatNumber(Math.round(p.valorizado))}</td>
        <td class="text-right">${formatNumber(p.cantidad_preparada)}</td>
        <td class="text-right editable" onclick="hacerEditableOT(this, '${p.id}', 'cantidad_recepcionada', ${p.cantidad_recepcionada})">
          <span class="editable-value">${formatNumber(p.cantidad_recepcionada)}</span>
        </td>
        <td class="alertas-cell">${alertaHtml}</td>
      </tr>
    `;
  }).join('');
}

function hacerEditableOT(celda, id, campo, valorActual) {
  // Si ya está en modo edición, no hacer nada
  if (celda.querySelector('input')) return;
  
  const valorSpan = celda.querySelector('.editable-value');
  const valorOriginal = valorActual;
  
  // Crear input
  const input = document.createElement('input');
  input.type = 'number';
  input.className = 'editable-input';
  input.value = valorOriginal;
  input.step = '1';
  input.min = '0';
  
  // Ocultar span y mostrar input
  valorSpan.style.display = 'none';
  celda.appendChild(input);
  input.focus();
  input.select();
  
  // Eventos
  input.addEventListener('blur', () => guardarValorEditadoOT(celda, input, id, campo, valorOriginal));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      guardarValorEditadoOT(celda, input, id, campo, valorOriginal);
    } else if (e.key === 'Escape') {
      input.value = valorOriginal;
      guardarValorEditadoOT(celda, input, id, campo, valorOriginal);
    }
  });
}

function guardarValorEditadoOT(celda, input, id, campo, valorOriginal) {
  const nuevoValor = parseFloat(input.value) || 0;
  const valorSpan = celda.querySelector('.editable-value');
  
  // Actualizar span
  valorSpan.textContent = formatNumber(nuevoValor);
  valorSpan.style.display = '';
  
  // Remover input
  input.remove();
  
  // Si cambió el valor, guardarlo en pendientes
  if (nuevoValor !== valorOriginal) {
    celda.classList.add('modificado');
    
    // Obtener datos de la fila
    const fila = celda.closest('tr');
    const sku = fila.dataset.sku;
    
    if (!cambiosPendientesOT[id]) {
      cambiosPendientesOT[id] = { id, sku };
    }
    cambiosPendientesOT[id][campo] = nuevoValor;
    
    // Recalcular alertas en la fila
    recalcularAlertaFilaOT(fila, nuevoValor);
  }
}

function recalcularAlertaFilaOT(fila, cantRecepcionada) {
  const celdas = fila.querySelectorAll('td');
  const cantPreparada = parseFloat(celdas[4].textContent.replace(/,/g, '')) || 0;
  const alertaCell = celdas[6];
  const valorizadoCell = celdas[3];
  
  // Obtener precio base del data attribute
  const precioBase = parseFloat(fila.dataset.precio) || 0;
  
  // Actualizar valorizado
  const nuevoValorizado = cantRecepcionada * precioBase;
  valorizadoCell.textContent = `$${formatNumber(Math.round(nuevoValorizado))}`;
  
  // Calcular nueva alerta
  if (cantPreparada !== cantRecepcionada) {
    const diferencia = cantRecepcionada - cantPreparada;
    const tipo = diferencia > 0 ? 'exceso' : 'faltante';
    const clase = tipo === 'exceso' ? 'alerta-sobre-recepcion' : 'alerta-sin-recepcion';
    const icono = tipo === 'exceso' ? '⬆️' : '⬇️';
    alertaCell.innerHTML = `<span class="alerta-badge ${clase}" title="Preparado: ${cantPreparada} ≠ Recepcionado: ${cantRecepcionada}">${icono} ${Math.abs(diferencia)}</span>`;
    fila.classList.add('tiene-alertas');
  } else {
    alertaCell.innerHTML = '<span class="sin-alertas">✓</span>';
    fila.classList.remove('tiene-alertas');
  }
  
  // Recalcular total valorizado
  recalcularTotalValorizadoOT();
}

function recalcularTotalValorizadoOT() {
  const filas = document.querySelectorAll('#tbodyDetalleTransferencia tr');
  let totalValorizado = 0;
  let totalRecepcion = 0;
  
  filas.forEach(fila => {
    const celdas = fila.querySelectorAll('td');
    const valorizado = parseFloat(celdas[3].textContent.replace(/[$,]/g, '')) || 0;
    const cantRecepcionada = parseFloat(celdas[5].querySelector('.editable-value')?.textContent.replace(/,/g, '') || celdas[5].textContent.replace(/,/g, '')) || 0;
    totalValorizado += valorizado;
    totalRecepcion += cantRecepcionada;
  });
  
  document.getElementById('totalOTValorizado').textContent = `$${formatNumber(Math.round(totalValorizado))}`;
  document.getElementById('totalOTRecepcion').textContent = formatNumber(totalRecepcion);
}

async function guardarCambiosTransferencia() {
  const productosModificados = Object.values(cambiosPendientesOT);
  
  if (productosModificados.length === 0) {
    alert('No hay cambios pendientes para guardar');
    return;
  }
  
  if (!confirm(`¿Guardar cambios en ${productosModificados.length} producto(s)?`)) {
    return;
  }
  
  showLoading(true);
  
  try {
    const response = await fetch(`${API_BASE}/api/ot/actualizar-recepciones-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        productos: productosModificados,
        id_ot: detalleOTActual.id_ot
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert(`✅ ${result.message}`);
      
      // Cerrar modal y recargar datos
      closeDetalleOTModal();
      loadOTTransferencias();
      
    } else {
      let errorMsg = result.message || 'Error al guardar cambios';
      if (result.results?.errores && result.results.errores.length > 0) {
        errorMsg += '\n\nErrores:\n' + result.results.errores.join('\n');
      }
      alert('⚠️ ' + errorMsg);
    }
    
  } catch (error) {
    console.error('Error guardando cambios OT:', error);
    alert('Error de conexión: ' + error.message);
  } finally {
    showLoading(false);
  }
}

function closeDetalleOTModal() {
  document.getElementById('detalleTransferenciaModal').classList.remove('active');
  detalleOTActual = null;
  cambiosPendientesOT = {};
}

// Descargar Excel de detalle transferencia
function descargarExcelTransferencia() {
  if (!detalleOTActual || !detalleOTActual.productos) {
    alert('No hay datos para descargar');
    return;
  }

  const productos = detalleOTActual.productos;
  const idOt = detalleOTActual.id_ot;
  const cliente = detalleOTActual.cliente || '';

  // Crear datos para Excel
  const datosExcel = productos.map(p => {
    // Usar cantidad modificada si existe
    const cantRecepcionada = cambiosPendientesOT[p.id] !== undefined 
      ? cambiosPendientesOT[p.id].cantidad_recepcionada 
      : (p.cantidad_recepcionada || 0);
    
    const valorizado = cantRecepcionada * (p.precio_base || 0);
    
    let alerta = '';
    const diff = cantRecepcionada - (p.cantidad_preparada || 0);
    if (diff > 0) alerta = 'Exceso';
    else if (diff < 0) alerta = 'Faltante';

    return {
      'Tipo': p.tipo || '',
      'SKU': p.sku || '',
      'Nombre': p.nombre || '',
      'Precio Base': p.precio_base || 0,
      'Valorizado': Math.round(valorizado),
      'Cant. Preparada': p.cantidad_preparada || 0,
      'Cant. Recepcionada': cantRecepcionada,
      'Diferencia': diff,
      'Alerta': alerta
    };
  });

  // Crear worksheet
  const ws = XLSX.utils.json_to_sheet(datosExcel);

  // Ajustar anchos de columna
  ws['!cols'] = [
    { wch: 10 },  // Tipo
    { wch: 18 },  // SKU
    { wch: 40 },  // Nombre
    { wch: 12 },  // Precio Base
    { wch: 12 },  // Valorizado
    { wch: 15 },  // Cant. Preparada
    { wch: 18 },  // Cant. Recepcionada
    { wch: 12 },  // Diferencia
    { wch: 10 }   // Alerta
  ];

  // Crear workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Detalle Transferencia');

  // Descargar archivo
  const fecha = new Date().toISOString().split('T')[0];
  const nombreArchivo = `Transferencia_${idOt}_${cliente}_${fecha}.xlsx`;
  XLSX.writeFile(wb, nombreArchivo);
}

// Cargar stats iniciales según módulo activo
if (currentModule === 'oc') {
  loadOCStats();
} else {
  loadStats();
}
