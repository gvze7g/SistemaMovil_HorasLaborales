
import { getOrdersById2, getOrdersById3 } from '../services/workOrdersService.js';
import { getVehiclesByStudentId } from '../services/vehiclesService.js';

function showLoginRequired() {
  const grid = document.getElementById("body");
  if (grid) {
    grid.innerHTML = `
      <div class="alert alert-warning">
        Debes <a href="login.html" class="alert-link">iniciar sesión</a> para ver los productos.
      </div>
    `;
  }
}

async function renderVehiculos() {
  const totalVehiculosElement = document.getElementById("totalVehiculos");
  if (!totalVehiculosElement) return; // Evita errores si la vista no tiene el elemento

  if (!auth.ok) {  // si no hay sesión, muestra 0
    showLoginRequired();
    totalVehiculosElement.textContent = "0";
    return;
  }

  totalVehiculosElement.textContent = "..."; // Indicador de carga
  try {
    // Obtiene los vehículos del estudiante usando su ID
    const vehiculos = await getVehiclesByStudentId(auth.user?.studentId || auth.user?.id);
    
    // Muestra la cantidad de vehículos
    const cantidad = Array.isArray(vehiculos) ? vehiculos.length : 0;
    totalVehiculosElement.textContent = cantidad.toString();
  }
  catch {
    totalVehiculosElement.textContent = "0";
  }
}

async function renderTrabajosActivos() {
  const trabajosActivosElement = document.getElementById("trabajosActivos");
  if (!trabajosActivosElement) return;

  if (!auth.ok) {
    trabajosActivosElement.textContent = "0";
    return;
  }

  trabajosActivosElement.textContent = "...";
  try {
    const trabajos = await getOrdersById2(auth.user?.studentId || auth.user?.id);
    const cantidad = Array.isArray(trabajos) ? trabajos.length : 0;
    trabajosActivosElement.textContent = cantidad.toString();
  }
  catch {
    trabajosActivosElement.textContent = "0";
  }
}

async function renderTrabajosCompletados() {
  const trabajosCompletadosElement = document.getElementById("trabajosCompletados");
  if (!trabajosCompletadosElement) return;

  if (!auth.ok) {
    trabajosCompletadosElement.textContent = "0";
    return;
  }

  trabajosCompletadosElement.textContent = "...";
  try {
    const trabajos = await getOrdersById3(auth.user?.studentId || auth.user?.id);
    const cantidad = Array.isArray(trabajos) ? trabajos.length : 0;
    trabajosCompletadosElement.textContent = cantidad.toString();
  }
  catch {
    trabajosCompletadosElement.textContent = "0";
  }
}

// Función principal que ejecuta todas las cargas
document.addEventListener("DOMContentLoaded", async () => {
  await renderUsuario();
  const ok = await requireAuth({ redirect: true });
  if (!ok) return;

  // Cargar todas las estadísticas
  await renderVehiculos();
  await renderTrabajosActivos();
  await renderTrabajosCompletados();
});