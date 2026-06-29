const API_BASE_URL = 'http://localhost:8080';

// ---------------------- utils ----------------------
function getQueryParam(param) {
  return new URLSearchParams(window.location.search).get(param);
}

function safeText(v, fallback = 'No registrado') {
  if (v === null || v === undefined) return fallback;
  const s = String(v).trim();
  return s ? s : fallback;
}

function normalizeWorkOrders(data) {
  if (Array.isArray(data?.workOrders)) return data.workOrders;
  if (Array.isArray(data?.data?.workOrders)) return data.data.workOrders;
  if (Array.isArray(data?.data?.content)) return data.data.content;
  if (Array.isArray(data)) return data;
  return [];
}

function getStatusText(idStatus, statusName) {
  if (statusName) return statusName;
  switch (idStatus) {
    case 1: return 'Pendiente';
    case 2: return 'Aprobado';
    case 3: return 'Aprobado - En Progreso';
    case 4: return 'Completado';
    case 5: return 'Rechazado';
    case 6: return 'Atrasado';
    default: return 'Sin información';
  }
}

function getProgressByStatus(idStatus) {
  switch (idStatus) {
    case 1: return 10;
    case 2: return 35;
    case 3: return 60;
    case 4: return 100;
    case 5: return 0;
    case 6: return 45;
    default: return 25;
  }
}

function resolveImageUrl(workOrder) {
  const raw = workOrder?.workOrderImage || workOrder?.vehicleImage || '';
  const val = String(raw || '').trim();

  if (!val || val.toLowerCase() === 'null' || val.toLowerCase() === 'undefined') {
    return 'imgs/default-car.png';
  }

  // URL absoluta o dataURL
  if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:image/')) {
    return val;
  }

  // Base64 puro
  if (/^[A-Za-z0-9+/=\r\n]+$/.test(val) && val.length > 80) {
    return `data:image/jpeg;base64,${val.replace(/\s/g, '')}`;
  }

  // Ruta relativa
  return val;
}

// ---------------------- api ----------------------
async function getWorkOrdersByPlate(plateNumber) {
  const response = await fetch(
    `${API_BASE_URL}/api/workOrders/getWorkOrdersByPlate/${encodeURIComponent(plateNumber)}`,
    {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    }
  );

  if (!response.ok) {
    const txt = await response.text().catch(() => '');
    throw new Error(`Error ${response.status}: ${txt || response.statusText}`);
  }

  const data = await response.json();
  return normalizeWorkOrders(data);
}

async function getObservationsByWorkOrder(workOrderId) {
  const response = await fetch(
    `${API_BASE_URL}/api/observations/workOrder/${encodeURIComponent(workOrderId)}`,
    {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    }
  );

  if (!response.ok) return [];

  const data = await response.json();
  if (Array.isArray(data?.observations)) return data.observations;
  if (Array.isArray(data)) return data;
  return [];
}

// ---------------------- render ----------------------
function renderVehicleInfo(workOrder, plateFromQuery) {
  const recordNumberEl = document.getElementById('recordNumber');
  const vehicleImageEl = document.getElementById('vehicleImage');
  const infoModeloEl = document.getElementById('infoModelo');
  const adjustmentStatusEl = document.getElementById('adjustmentStatus');
  const infoPlacaEl = document.getElementById('infoPlaca');
  const assignedStudentEl = document.getElementById('assignedStudent');
  const assignedModuleEl = document.getElementById('assignedModule');
  const ownerNameEl = document.getElementById('ownerName');

  const studentFullName =
    `${safeText(workOrder.studentName, '')} ${safeText(workOrder.studentLastName, '')}`.trim() || 'No registrado';

  const ownerName = safeText(workOrder.ownerName, 'No registrado');
  const status = getStatusText(workOrder.idStatus, workOrder.statusName);
  const plate = safeText(plateFromQuery || workOrder.vehiclePlateNumber, 'N/A');
  const model =
    `${safeText(workOrder.vehicleBrand, '')} ${safeText(workOrder.vehicleModel, '')}`.trim() || 'Sin información';

  if (recordNumberEl) recordNumberEl.textContent = safeText(workOrder.workOrderId, 'N/A');

  if (vehicleImageEl) {
    const fallback = 'imgs/default-car.png';
    vehicleImageEl.src = resolveImageUrl(workOrder);

    vehicleImageEl.onerror = function () {
      // evita parpadeo/infinite loop
      if (this.dataset.fallbackApplied === '1') return;
      this.dataset.fallbackApplied = '1';
      this.src = fallback;
    };
  }

  if (infoModeloEl) infoModeloEl.textContent = model;
  if (adjustmentStatusEl) adjustmentStatusEl.textContent = `Estado del ajuste: ${status}`;
  if (infoPlacaEl) infoPlacaEl.textContent = plate;
  if (assignedStudentEl) assignedStudentEl.textContent = studentFullName;
  if (assignedModuleEl) assignedModuleEl.textContent = safeText(workOrder.moduleName, 'No asignado');
  if (ownerNameEl) ownerNameEl.textContent = ownerName;
}

function renderTasks(workOrder) {
  const grid = document.getElementById('repairTasksGrid');
  if (!grid) return;

  const progress = getProgressByStatus(workOrder.idStatus);
  const status = getStatusText(workOrder.idStatus, workOrder.statusName);
  const description = safeText(workOrder.description, 'Sin descripción registrada');

  grid.innerHTML = `
    <div class="tarjeta-tarea">
      <h3>Progreso de la reparación</h3>
      <div class="barra-progreso" style="width:100%;height:10px;background:#2a2a2a;border-radius:8px;overflow:hidden;margin:8px 0;">
        <div class="relleno-progreso" style="width:${progress}%;height:100%;background:#c00000;"></div>
      </div>
      <p><strong>${progress}%</strong> completado</p>
    </div>

    <div class="tarjeta-tarea">
      <h3>Estado actual</h3>
      <p>${status}</p>
    </div>

    <div class="tarjeta-tarea">
      <h3>Descripción del trabajo</h3>
      <p>${description}</p>
    </div>
  `;
}

function ensureObservationsSection() {
  let section = document.getElementById('observacionesSeccion');
  if (section) return;

  const main = document.querySelector('.contenido-principal-seguimiento');
  if (!main) return;

  section = document.createElement('div');
  section.className = 'seccion-actualizaciones';
  section.id = 'observacionesSeccion';
  section.innerHTML = `
    <h2>Observaciones</h2>
    <ul id="observacionesList"><li>Cargando observaciones...</li></ul>
  `;
  main.appendChild(section);
}

function renderObservations(observations) {
  ensureObservationsSection();
  const list = document.getElementById('observacionesList');
  if (!list) return;

  if (!Array.isArray(observations) || observations.length === 0) {
    list.innerHTML = '<li>No hay observaciones registradas.</li>';
    return;
  }

  list.innerHTML = observations
    .map(obs => {
      const text = safeText(obs.observacion, 'Observación registrada');
      const author = safeText(obs.studentName, 'Sin autor');
      return `<li><strong>${text}</strong><br><small>Por: ${author}</small></li>`;
    })
    .join('');
}

function renderUpdatesFallback(workOrders) {
  const updatesList = document.getElementById('updatesList');
  if (!updatesList) return;

  if (!Array.isArray(workOrders) || workOrders.length === 0) {
    updatesList.innerHTML = '<li>No hay actualizaciones recientes.</li>';
    return;
  }

  updatesList.innerHTML = workOrders
    .map(
      wo =>
        `<li>Orden #${safeText(wo.workOrderId, 'N/A')} • ${getStatusText(wo.idStatus, wo.statusName)} • ${safeText(wo.moduleName, 'Sin módulo')}</li>`
    )
    .join('');
}

// ---------------------- init ----------------------
async function loadTracking() {
  const plateFromQuery = (getQueryParam('placa') || '').trim().toUpperCase();

  const btnNuevaBusqueda = document.getElementById('btnNuevaBusqueda');
  if (btnNuevaBusqueda) {
    btnNuevaBusqueda.style.display = 'inline-flex';
    btnNuevaBusqueda.onclick = () => (window.location.href = 'auth-seguimiento.html');
  }

  let workOrders = [];
  let mainOrder = null;

  // 1) cache desde auth
  try {
    const payload = JSON.parse(localStorage.getItem('trackingPayload') || 'null');
    if (payload?.mainOrder) {
      mainOrder = payload.mainOrder;
      workOrders = Array.isArray(payload.workOrders) ? payload.workOrders : [payload.mainOrder];
    }
  } catch (_) {}

  // 2) cache raw
  if (!mainOrder) {
    try {
      const raw = JSON.parse(localStorage.getItem('workOrdersData') || '[]');
      if (Array.isArray(raw) && raw.length > 0) {
        workOrders = raw;
        mainOrder = raw[0];
      }
    } catch (_) {}
  }

  // 3) api por placa
  if (!mainOrder) {
    if (!plateFromQuery) throw new Error('No se encontró placa para consultar seguimiento.');
    workOrders = await getWorkOrdersByPlate(plateFromQuery);
    if (!workOrders.length) throw new Error(`No se encontraron órdenes para la placa "${plateFromQuery}".`);
    mainOrder = workOrders[0];
  }

  const observations = mainOrder?.workOrderId
    ? await getObservationsByWorkOrder(mainOrder.workOrderId)
    : [];

  renderVehicleInfo(mainOrder, plateFromQuery);
  renderTasks(mainOrder);
  renderObservations(observations);
  renderUpdatesFallback(workOrders);
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadTracking();
  } catch (error) {
    console.error('Error seguimiento:', error);
    const updatesList = document.getElementById('updatesList');
    if (updatesList) updatesList.innerHTML = `<li>${safeText(error.message, 'No se pudo cargar el seguimiento.')}</li>`;
  }
});