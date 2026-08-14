import { me, logout } from "./services/authServiceParents.js";

const API_BASE_URL = "http://localhost:8080";

// ---------------------- utils ----------------------
function safeText(v, fallback = "No registrado") {
  if (v === null || v === undefined) return fallback;
  const s = String(v).trim();
  return s ? s : fallback;
}

function normalizeVehicles(data) {
  if (Array.isArray(data?.data?.vehiculos)) return data.data.vehiculos;
  if (Array.isArray(data?.vehiculos)) return data.vehiculos;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
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
    case 1: return "Pendiente";
    case 2: return "Aprobado";
    case 3: return "Aprobado - En Progreso";
    case 4: return "Completado";
    case 5: return "Rechazado";
    case 6: return "Atrasado";
    default: return "Sin información";
  }
}

function getProgress(idStatus, progressPercent) {
  if (typeof progressPercent === "number") return progressPercent;
  switch (idStatus) {
    case 1: return 25;
    case 2: return 50;
    case 3: return 75;
    case 4: return 100;
    case 5: return 0;
    case 6: return 50;
    default: return 0;
  }
}

// Las órdenes "activas" (aún dentro del taller) son las que no están
// completadas ni rechazadas.
function isActiveOrder(order) {
  return ![4, 5].includes(order.idStatus);
}

function pickCurrentOrder(orders) {
  if (!orders.length) return null;
  const active = orders.filter(isActiveOrder);
  const pool = active.length ? active : orders;
  return pool.reduce((latest, current) =>
    (current.workOrderId || 0) > (latest.workOrderId || 0) ? current : latest
  );
}

function resolveImageUrl(rawValue, fallback = "imgs/default-car.png") {
  const val = String(rawValue || "").trim();

  if (!val || val.toLowerCase() === "null" || val.toLowerCase() === "undefined" || val === "sin_imagen") {
    return fallback;
  }

  if (val.startsWith("http://") || val.startsWith("https://") || val.startsWith("data:image/")) {
    return val;
  }

  if (/^[A-Za-z0-9+/=\r\n]+$/.test(val) && val.length > 80) {
    return `data:image/jpeg;base64,${val.replace(/\s/g, "")}`;
  }

  return val;
}

// ---------------------- api ----------------------
async function getMyVehicles() {
  const response = await fetch(`${API_BASE_URL}/api/vehicles/myVehicles`, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status} al consultar tus vehículos`);
  }

  const data = await response.json();
  return normalizeVehicles(data);
}

async function getWorkOrdersByPlate(plateNumber) {
  const response = await fetch(
    `${API_BASE_URL}/api/workOrders/getWorkOrdersByPlate/${encodeURIComponent(plateNumber)}`,
    { method: "GET", credentials: "include", headers: { "Content-Type": "application/json" } }
  );

  if (!response.ok) return [];
  const data = await response.json();
  return normalizeWorkOrders(data);
}

async function getObservationsByWorkOrder(workOrderId) {
  const response = await fetch(
    `${API_BASE_URL}/api/observations/workOrder/${encodeURIComponent(workOrderId)}`,
    { method: "GET", credentials: "include", headers: { "Content-Type": "application/json" } }
  );

  if (!response.ok) return [];
  const data = await response.json();
  if (Array.isArray(data?.observations)) return data.observations;
  if (Array.isArray(data)) return data;
  return [];
}

// ---------------------- render ----------------------
function renderPhotoGallery(order, vehicle) {
  // Las fotos que se muestran son las de la orden de trabajo (tomadas al
  // crear la orden), no las del ingreso del vehículo al taller.
  const source = order || {};
  const fallback = vehicle?.vehicleImage || "imgs/default-car.png";

  const photos = [
    { label: "Frontal", value: source.workOrderImage },
    { label: "Izquierda", value: source.workOrderImageLeft },
    { label: "Derecha", value: source.workOrderImageRight },
    { label: "Trasera", value: source.workOrderImageBack },
  ];

  return `
    <div class="galeria-fotos-orden">
      ${photos
        .map(
          (p) => `
        <figure>
          <img src="${resolveImageUrl(p.value, fallback)}" alt="Foto ${p.label} de la orden"
               onerror="this.onerror=null;this.src='imgs/default-car.png';" loading="lazy" />
          <figcaption>${p.label}</figcaption>
        </figure>`
        )
        .join("")}
    </div>
  `;
}

function renderVehicleCard(vehicle, order, observations) {
  const plate = safeText(vehicle.plateNumber, "Sin placa");
  const model = `${safeText(vehicle.brand, "")} ${safeText(vehicle.model, "")}`.trim() || "Sin información";
  const color = safeText(vehicle.color, "No registrado");

  const hasOrder = !!order;
  const moduleName = hasOrder ? safeText(order.moduleName, "No asignado") : "Sin orden de trabajo activa";
  const description = hasOrder ? safeText(order.description, "Sin descripción registrada") : "Este vehículo no tiene una orden de trabajo activa en este momento.";
  const studentName = hasOrder
    ? `${safeText(order.studentName, "")} ${safeText(order.studentLastName, "")}`.trim() || "No registrado"
    : "No aplica";
  const instructorName = hasOrder ? safeText(order.instructorName, "No asignado") : "No aplica";
  const status = hasOrder ? getStatusText(order.idStatus, order.statusName) : "Sin actividad";
  const progress = hasOrder ? getProgress(order.idStatus, order.progressPercent) : 0;

  const observationsHtml =
    hasOrder && Array.isArray(observations) && observations.length
      ? observations
          .map((obs) => {
            const text = safeText(obs.observacion, "Observación registrada");
            const author = safeText(obs.studentName, "Sin autor");
            return `<li><strong>${text}</strong><br><small>Por: ${author}</small></li>`;
          })
          .join("")
      : `<li>${hasOrder ? "No hay observaciones registradas." : "No hay observaciones porque no hay una orden activa."}</li>`;

  return `
    <div class="tarjeta-info-vehiculo tarjeta-vehiculo-seguimiento">
      <div class="encabezado-tarjeta">
        <span class="numero-registro">Placa: ${plate}</span>
        ${hasOrder ? `<span class="numero-registro">Orden #${safeText(order.workOrderId, "N/A")}</span>` : ""}
      </div>

      ${renderPhotoGallery(order, vehicle)}

      <div class="info-vehiculo-texto">
        <h2>${model}</h2>
        <p class="estado-ajuste">Estado: ${status}</p>
        <p>Color: <span>${color}</span></p>
        <p>Módulo: <span>${moduleName}</span></p>
        <p>Estudiante Asignado: <span>${studentName}</span></p>
        <p>Profesor Asignado: <span>${instructorName}</span></p>
      </div>

      <div class="seccion-progreso">
        <div class="contenedor-barra-progreso">
          <div class="barra-progreso" style="width:${progress}%;"></div>
          <span id="progressPercentage">${progress}%</span>
        </div>
      </div>

      <div class="elemento-tarea">
        <i class="fas fa-clipboard-list"></i>
        <span>${description}</span>
      </div>

      <div class="seccion-actualizaciones" style="margin-top: 0;">
        <h2>Observaciones</h2>
        <ul>${observationsHtml}</ul>
      </div>
    </div>
  `;
}

async function loadVehiclesTracking() {
  const container = document.getElementById("listaVehiculos");
  const vehicles = await getMyVehicles();

  if (!vehicles.length) {
    container.innerHTML = `<p class="estado-vacio">Todavía no tienes vehículos registrados a tu cuenta. Cuando registren un vehículo con tu correo, aparecerá aquí.</p>`;
    return;
  }

  const cardsHtml = await Promise.all(
    vehicles.map(async (vehicle) => {
      const orders = await getWorkOrdersByPlate(vehicle.plateNumber);
      const currentOrder = pickCurrentOrder(orders);
      const observations = currentOrder?.workOrderId
        ? await getObservationsByWorkOrder(currentOrder.workOrderId)
        : [];
      return renderVehicleCard(vehicle, currentOrder, observations);
    })
  );

  container.innerHTML = cardsHtml.join("");
}

// ---------------------- init ----------------------
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const info = await me();
    if (!info.authenticated) {
      window.location.href = "auth-seguimiento.html";
      return;
    }
  } catch (_) {
    window.location.href = "auth-seguimiento.html";
    return;
  }

  const btnCerrarSesion = document.getElementById("btnCerrarSesion");
  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener("click", async (e) => {
      e.preventDefault();
      await logout();
      window.location.href = "auth-seguimiento.html";
    });
  }

  try {
    await loadVehiclesTracking();
  } catch (error) {
    console.error("Error al cargar el seguimiento:", error);
    const container = document.getElementById("listaVehiculos");
    if (container) {
      container.innerHTML = `<p class="estado-vacio">${safeText(error.message, "No se pudo cargar el seguimiento.")}</p>`;
    }
  }
});
