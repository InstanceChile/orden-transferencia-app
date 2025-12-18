// ============================================================================
// PLATAFORMA DE ABASTECIMIENTO - APLICACIÓN FRONTEND
// ============================================================================

const API_BASE = '';

// Estado de la aplicación
let currentModule = 'oc'; // 'oc' o 'ot'
let CLIENTES = [];
let PROVEEDORES = [];

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
        }
      } else if (moduleId === 'module-oc') {
        if (tabId === 'oc-recepcion') {
          loadOCPendientes();
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
    'ot': 'OT (Solicitud)',
    'ota': 'OTA (Preparación)',
    'otadet': 'OTADET (Detalle EAN)',
    'otf': 'OTF (Recepción)'
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
      renderProveedoresList();
    }
  } catch (error) {
    console.error('Error cargando proveedores:', error);
  }
}

function renderClientesTags() {
  const container = document.getElementById('clientesTags');
  if (!container) return;
  
  container.innerHTML = CLIENTES.map(cliente => 
    `<span class="cliente-tag">${cliente}</span>`
  ).join('');
}

function renderProveedoresList() {
  const container = document.getElementById('lista-proveedores-oc');
  if (!container) return;
  
  container.innerHTML = PROVEEDORES.map(proveedor => 
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

// Cargar stats iniciales según módulo activo
if (currentModule === 'oc') {
  loadOCStats();
} else {
  loadStats();
}
