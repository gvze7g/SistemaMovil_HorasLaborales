const API_BASE_URL = 'http://localhost:8080';

// ================= API =================
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
    throw new Error(`HTTP ${response.status} ${txt || response.statusText}`);
  }

  return response.json();
}

async function getObservationsByWorkOrder(workOrderId) {
  // Ajusta endpoint si el tuyo es diferente
  const possibleEndpoints = [
    `${API_BASE_URL}/api/workOrderObservations/getByWorkOrder/${encodeURIComponent(workOrderId)}`,
    `${API_BASE_URL}/api/workOrders/getObservationsByWorkOrder/${encodeURIComponent(workOrderId)}`
  ];

  for (const endpoint of possibleEndpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) continue;
      const data = await res.json();

      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.observations)) return data.observations;
      if (Array.isArray(data?.data)) return data.data;
      if (Array.isArray(data?.data?.content)) return data.data.content;
    } catch (_) {}
  }

  return [];
}

// ================= Helpers =================
function normalizeWorkOrders(data) {
  if (Array.isArray(data?.workOrders)) return data.workOrders;
  if (Array.isArray(data?.data?.workOrders)) return data.data.workOrders;
  if (Array.isArray(data?.data?.content)) return data.data.content;
  if (Array.isArray(data)) return data;
  return [];
}

function getProgressByStatus(idStatus) {
  switch (idStatus) {
    case 1: return 10;   // pendiente
    case 2: return 50;   // en progreso
    case 3: return 100;  // completada
    case 4: return 30;   // pausada
    case 5: return 0;    // rechazada
    default: return 25;
  }
}

function getStatusText(idStatus, statusName) {
  if (statusName) return statusName;
  switch (idStatus) {
    case 1: return 'Pendiente';
    case 2: return 'En progreso';
    case 3: return 'Completada';
    case 4: return 'Pausada';
    case 5: return 'Rechazada';
    default: return 'Sin información';
  }
}

async function buildTrackingPayload(workOrders, plateNumber) {
  if (!workOrders.length) return null;

  const main = workOrders[0];
  const observations = await getObservationsByWorkOrder(main.workOrderId);

  return {
    plateNumber,
    workOrders,
    mainOrder: {
      workOrderId: main.workOrderId,
      vehicleImage: main.workOrderImage || main.vehicleImage || 'imgs/default-car.png',
      vehicleBrand: main.vehicleBrand || '',
      vehicleModel: main.vehicleModel || '',
      vehicleYear: main.vehicleYear || '',
      vehiclePlateNumber: main.vehiclePlateNumber || main.plateNumber || plateNumber,
      studentName: main.studentName || '',
      studentLastName: main.studentLastName || '',
      moduleName: main.moduleName || '',
      description: main.description || '',
      idStatus: main.idStatus ?? null,
      statusName: getStatusText(main.idStatus, main.statusName),
      progress: getProgressByStatus(main.idStatus)
    },
    observations
  };
}

// ================= UI =================
document.addEventListener('DOMContentLoaded', () => {
  const plateInput = document.getElementById('placa');
  const searchButton = document.getElementById('verSeguimientoBtn');

  if (!plateInput || !searchButton) {
    console.error('No se encontró #placa o #verSeguimientoBtn en auth-seguimiento.html');
    return;
  }

  // Texto solo por placa (como pediste)
  plateInput.setAttribute('placeholder', 'P000-000');
  plateInput.setAttribute('aria-label', 'Número de placa');

  const description = document.querySelector('.descripcion-principal');
  if (description) {
    description.textContent = 'Ingresa tu número de placa.';
  }

  async function doSearch() {
    const plate = (plateInput.value || '').trim().toUpperCase();

    if (!plate) {
      Swal.fire('Dato requerido', 'Ingresa una placa válida.', 'warning');
      return;
    }

    const originalText = searchButton.textContent;
    try {
      searchButton.disabled = true;
      searchButton.textContent = 'Buscando...';

      const rawResponse = await getWorkOrdersByPlate(plate);
      const workOrders = normalizeWorkOrders(rawResponse);

      if (!workOrders.length) {
        Swal.fire('Sin resultados', `No se encontraron órdenes para la placa "${plate}".`, 'info');
        return;
      }

      const payload = await buildTrackingPayload(workOrders, plate);

      localStorage.setItem('trackingPayload', JSON.stringify(payload));
      localStorage.setItem('workOrdersData', JSON.stringify(workOrders)); // compatibilidad
      localStorage.setItem('trackingSearchMeta', JSON.stringify({ plate, searchedAt: new Date().toISOString() }));

      window.location.href = `seguimiento.html?placa=${encodeURIComponent(plate)}`;
    } catch (error) {
      console.error('Error en búsqueda de seguimiento:', error);
      Swal.fire('Error', error.message || 'No se pudo consultar el seguimiento.', 'error');
    } finally {
      searchButton.disabled = false;
      searchButton.textContent = originalText || 'Ver seguimiento';
    }
  }

  searchButton.addEventListener('click', doSearch);
  plateInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      doSearch();
    }
  });
});