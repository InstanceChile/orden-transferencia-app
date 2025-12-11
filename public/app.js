// ============================================================================
// SISTEMA OT - APLICACIÓN FRONTEND
// ============================================================================

const API_BASE = '';

// Lista de clientes (se carga desde el servidor)
let CLIENTES = [];

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initDropzones();
  loadClientes();
  loadStats();
  loadOTPendientes();
});

// ============================================================================
// TABS
// ============================================================================

function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      
      // Desactivar todos
      tabBtns.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      
      // Activar seleccionado
      btn.classList.add('active');
      document.getElementById(`panel-${tabId}`).classList.add('active');
      
      // Recargar OT pendientes según el tab
      if (['ota', 'otadet', 'otf'].includes(tabId)) {
        loadOTPendientes(tabId.toUpperCase());
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
  
  try {
    const response = await fetch(`${API_BASE}/api/upload/${type}`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    showResults(result, type);
    
    // Recargar estadísticas y OT pendientes
    loadStats();
    loadOTPendientes();
    
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
    document.getElementById(`file-${type}`).value = '';
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
    ot: 'OT (Solicitud)',
    ota: 'OTA (Preparación)',
    otadet: 'OTADET (Detalle EAN)',
    otf: 'OTF (Recepción)'
  };
  
  title.textContent = `Resultado de Carga - ${typeNames[type]}`;
  
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
// CARGAR CLIENTES
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

function renderClientesTags() {
  const container = document.getElementById('clientesTags');
  if (!container) return;
  
  container.innerHTML = CLIENTES.map(cliente => 
    `<span class="cliente-tag">${cliente}</span>`
  ).join('');
}

// ============================================================================
// CARGAR ESTADÍSTICAS
// ============================================================================

async function loadStats() {
  try {
    const response = await fetch(`${API_BASE}/api/stats`);
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('statTotal').textContent = data.stats.total;
    }
  } catch (error) {
    console.error('Error cargando stats:', error);
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
// UTILIDADES
// ============================================================================

// Escape key para cerrar modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
});

