// Funciones para manejo de órdenes de trabajo (temporalmente aquí)
const API_BASE_URL = 'https://sgma-66ec41075156.herokuapp.com';

/**
 * Obtiene las órdenes de trabajo por número de placa
 */
async function getWorkOrdersByPlate(plateNumber) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/workOrders/getWorkOrdersByPlate/${encodeURIComponent(plateNumber)}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }

        const result = await response.json();
        return result;
        
    } catch (error) {
        console.error('Error al obtener órdenes de trabajo:', error);
        throw error;
    }
}

/**
 * Procesa los datos de órdenes de trabajo para el seguimiento
 */
async function processWorkOrdersForTracking(workOrders, placa) {
    if (!workOrders || workOrders.length === 0) {
        return null;
    }

    // Debug: mostrar estructura de datos recibida
    console.log('🔍 Datos recibidos de la API:', workOrders);
    console.log('📋 Primera orden de trabajo:', workOrders[0]);
    console.log('🏷️ Campos importantes:', {
        workOrderId: workOrders[0].workOrderId,
        vehicleBrand: workOrders[0].vehicleBrand,
        vehicleModel: workOrders[0].vehicleModel,
        statusName: workOrders[0].statusName,
        idStatus: workOrders[0].idStatus,
        moduleName: workOrders[0].moduleName,
        description: workOrders[0].description
    });

    const mainOrder = workOrders[0];

    // Obtener observaciones de la orden de trabajo
    const observations = await getObservationsByWorkOrder(mainOrder.workOrderId);
    console.log('📝 Observaciones obtenidas:', observations);
    
    // Calcular progreso basado en el estado (idStatus)
    let progressPercentage = 0;
    let status = "Sin información";
    
    // Mapear estados basados en idStatus de la respuesta real
    switch (mainOrder.idStatus) {
        case 1: // Pendiente
            progressPercentage = 10;
            status = mainOrder.statusName || "Pendiente";
            break;
        case 2: // En progreso
            progressPercentage = 50;
            status = mainOrder.statusName || "En progreso";
            break;
        case 3: // Completada
            progressPercentage = 100;
            status = mainOrder.statusName || "Completada";
            break;
        case 4: // Pausada
            progressPercentage = 30;
            status = mainOrder.statusName || "Pausada";
            break;
        case 5: // Rechazado
            progressPercentage = 0;
            status = mainOrder.statusName || "Rechazado";
            break;
        default:
            progressPercentage = 25;
            status = mainOrder.statusName || "Sin información";
    }

    // Crear descripción completa del vehículo
    const vehicleFullName = `${mainOrder.vehicleBrand || ''} ${mainOrder.vehicleModel || ''}`.trim();
    const vehicleWithYear = mainOrder.vehicleYear ? 
        `${vehicleFullName} (${mainOrder.vehicleYear})` : vehicleFullName;

    // Mapear tareas basadas en el módulo y descripción
    const tasks = workOrders.map(order => ({
        icon: getIconForModuleType(order.moduleName || order.description),
        text: order.description || order.moduleName || "Reparación general"
    }));

    // Generar actualizaciones - primero la orden de trabajo inicial
    const updates = [];
    
    // Agregar el registro inicial de la orden de trabajo
    const orderDate = new Date().toLocaleDateString('es-ES');
    updates.push(`${orderDate}: Orden de trabajo registrada - ${mainOrder.description || 'Sin descripción'} - Estado: ${mainOrder.statusName || 'Sin estado'}`);
    
    // Agregar las observaciones
    if (observations && observations.length > 0) {
        observations.forEach(observation => {
            const obsDate = observation.createdDate ? 
                new Date(observation.createdDate).toLocaleDateString('es-ES') : 
                new Date().toLocaleDateString('es-ES');
            
            updates.push(`${obsDate}: 📝 ${observation.observation || observation.description || 'Observación registrada'}`);
        });
    }
    
    // Agregar información adicional si está disponible
    if (mainOrder.estimatedTime) {
        updates.push(`⏰ Tiempo estimado: ${mainOrder.estimatedTime} horas`);
    }
    if (mainOrder.moduleCode) {
        updates.push(`🔧 Código del módulo: ${mainOrder.moduleCode}`);
    }

    return {
        recordNumber: mainOrder.workOrderId || mainOrder.id || "N/A",
        modelo: vehicleWithYear || "Vehículo no especificado",
        status: status,
        placa: mainOrder.vehiclePlateNumber || placa,
        assignedStudent: "Por asignar", // La API no devuelve estudiante asignado aún
        assignedModule: `${mainOrder.moduleName || 'Módulo no especificado'} (${mainOrder.moduleCode || 'Sin código'})`,
        contactName: "Administrador del taller",
        progressPercentage: progressPercentage,
        remainingTime: calculateRemainingTimeFromEstimate(mainOrder.estimatedTime),
        totalTime: mainOrder.estimatedTime ? `${mainOrder.estimatedTime}h estimadas` : "N/A",
        vehicleImage: getVehicleImageByBrand(mainOrder.vehicleBrand),
        workOrderImage: mainOrder.workOrderImage || null,
        tasks: tasks,
        updates: updates,
        // Información adicional para mostrar
        additionalInfo: {
            vehicleId: mainOrder.vehicleId,
            moduleId: mainOrder.moduleId,
            vehicleBrand: mainOrder.vehicleBrand,
            vehicleModel: mainOrder.vehicleModel,
            vehicleYear: mainOrder.vehicleYear,
            moduleCode: mainOrder.moduleCode,
            estimatedTime: mainOrder.estimatedTime,
            description: mainOrder.description
        }
    };
}

// Funciones auxiliares
function getIconForModuleType(moduleDescription) {
    const desc = (moduleDescription || "").toLowerCase();
    
    if (desc.includes('freno') || desc.includes('pastilla') || desc.includes('disco')) {
        return "fas fa-car-side";
    }
    if (desc.includes('electr') || desc.includes('luz') || desc.includes('bateria') || desc.includes('alternador')) {
        return "fas fa-lightbulb";
    }
    if (desc.includes('motor') || desc.includes('piston') || desc.includes('cilindro')) {
        return "fas fa-gears";
    }
    if (desc.includes('aceite') || desc.includes('lubricant') || desc.includes('filtro')) {
        return "fas fa-oil-can";
    }
    if (desc.includes('suspension') || desc.includes('amortiguador') || desc.includes('resorte')) {
        return "fas fa-car";
    }
    if (desc.includes('transmision') || desc.includes('embrague') || desc.includes('diferencial')) {
        return "fas fa-cogs";
    }
    if (desc.includes('puerta') || desc.includes('ventana') || desc.includes('carroceria')) {
        return "fas fa-window-restore";
    }
    return "fas fa-wrench";
}

function getVehicleImageByBrand(brand) {
    if (!brand) return "imgs/audi.jpg";
    
    const brandLower = brand.toLowerCase();
    
    if (brandLower.includes('lexus') || brandLower.includes('toyota')) return "imgs/toyota.webp";
    if (brandLower.includes('volvo')) return "imgs/volvo.jpg";
    if (brandLower.includes('audi')) return "imgs/audi.jpg";
    if (brandLower.includes('mercedes')) return "imgs/mercedes.jpg";
    if (brandLower.includes('jeep')) return "imgs/jeep.webp";
    if (brandLower.includes('hilux')) return "imgs/hilux.jpg";
    if (brandLower.includes('camaro') || brandLower.includes('chevrolet')) return "imgs/camaro.jpeg";
    if (brandLower.includes('ram') || brandLower.includes('dodge')) return "imgs/ram.jpeg";
    if (brandLower.includes('tacoma')) return "imgs/tacoma.jpeg";
    
    return "imgs/audi.jpg"; // Imagen por defecto
}

function calculateRemainingTimeFromEstimate(estimatedHours) {
    if (!estimatedHours || estimatedHours === "0") {
        return "No especificado";
    }
    
    const hours = parseInt(estimatedHours);
    if (isNaN(hours)) {
        return estimatedHours; // Retornar tal como viene si no es un número
    }
    
    if (hours <= 0) {
        return "Trabajo completado";
    }
    
    if (hours < 24) {
        return `${hours}h restantes`;
    } else {
        const days = Math.ceil(hours / 8); // Asumiendo 8 horas laborales por día
        return `${days} día(s) laborales`;
    }
}

// Función para obtener observaciones de una orden de trabajo
async function getObservationsByWorkOrder(workOrderId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/observations/workOrder/${workOrderId}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }

        const result = await response.json();
        return result.observations || [];
        
    } catch (error) {
        console.error('Error al obtener observaciones:', error);
        return [];
    }
}

document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const placa = urlParams.get("placa");

  const recordNumberSpan = document.getElementById("recordNumber");
  const infoModeloSpan = document.getElementById("infoModelo");
  const adjustmentStatusP = document.getElementById("adjustmentStatus"); // Changed from .adjustment-status
  const infoPlacaSpan = document.getElementById("infoPlaca");
  const assignedStudentSpan = document.getElementById("assignedStudent");
  const assignedModuleSpan = document.getElementById("assignedModule");
  const contactNameSpan = document.getElementById("contactName");
  const vehicleImage = document.getElementById("vehicleImage");
  const repairTasksGrid = document.getElementById("repairTasksGrid");
  const updatesList = document.getElementById("updatesList");

  // Function to populate data
  const populateVehicleData = (data) => {
    console.log('Mostrando datos procesados:', data);
    
    recordNumberSpan.textContent = data.recordNumber || "N/A";
    infoModeloSpan.textContent = data.modelo || "Vehículo Desconocido";
    adjustmentStatusP.textContent = data.status || "Sin Información";
    infoPlacaSpan.textContent = data.placa || "Placa no especificada";
    assignedStudentSpan.textContent = data.assignedStudent || "N/A";
    assignedModuleSpan.textContent = data.assignedModule || "N/A";
    contactNameSpan.textContent = data.contactName || "N/A";

    if (data.vehicleImage) {
      vehicleImage.src = data.vehicleImage;
    } else {
      vehicleImage.src = "imgs/audi.jpg";
    }

    // Populate repair tasks dynamically
    if (data.tasks && data.tasks.length > 0) {
      repairTasksGrid.innerHTML = "";
      data.tasks.forEach(task => {
        const taskItem = document.createElement("div");
        taskItem.className = "task-item";
        taskItem.innerHTML = `<i class="${task.icon}"></i><span>${task.text}</span>`;
        repairTasksGrid.appendChild(taskItem);
      });
    } else if (placa) {
        repairTasksGrid.innerHTML = `<div class="task-item"><i class="fas fa-info-circle"></i><span>No se encontraron tareas de reparación.</span></div>`;
    }

    // Populate updates dynamically - ahora incluye observaciones
    if (data.updates && data.updates.length > 0) {
      updatesList.innerHTML = "";
      data.updates.forEach(update => {
        const li = document.createElement("li");
        li.innerHTML = update; // Usar innerHTML para mostrar emojis
        updatesList.appendChild(li);
      });
    } else if (placa) {
        updatesList.innerHTML = `<li class="no-results">No se encontraron actualizaciones para este vehículo.</li>`;
    }
  };

  // Función para obtener datos del vehículo desde la API
  const getVehicleDataFromAPI = () => {
    const storedData = localStorage.getItem('workOrdersData');
    if (storedData) {
      try {
        const processedData = JSON.parse(storedData);
        localStorage.removeItem('workOrdersData'); // Limpiar después de usar
        return processedData;
      } catch (error) {
        console.error('Error al procesar datos de la API:', error);
      }
    }
    return null;
  };

  // Función para buscar datos directamente desde la API si no están en localStorage
  const fetchVehicleDataDirectly = async (placa) => {
    try {
      // Mostrar estado de carga
      populateVehicleData({
        recordNumber: "Cargando...",
        modelo: "Buscando vehículo...",
        status: "Consultando base de datos...",
        placa: placa,
        assignedStudent: "Cargando...",
        assignedModule: "Cargando...",
        contactName: "Cargando...",
        progressPercentage: 0,
        remainingTime: "Cargando...",
        totalTime: "Cargando...",
        updates: ["Buscando información del vehículo..."],
        tasks: [],
      });

      const result = await getWorkOrdersByPlate(placa);
      
      if (result.workOrders && result.workOrders.length > 0) {
        const processedData = await processWorkOrdersForTracking(result.workOrders, placa);
        return processedData;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error al buscar datos del vehículo:', error);
      return null;
    }
  };



  if (placa) {
    // Intentar obtener datos del localStorage primero
    const vehicleData = getVehicleDataFromAPI();
    
    if (vehicleData) {
      // Datos encontrados en localStorage
      populateVehicleData(vehicleData);
    } else {
      // Si no hay datos en localStorage, buscar directamente en la API
      fetchVehicleDataDirectly(placa).then(apiData => {
        if (apiData) {
          populateVehicleData(apiData);
        } else {
          // Si no se encontraron datos en la API
          populateVehicleData({
            recordNumber: "N/A",
            modelo: "Vehículo no encontrado",
            status: "No se encontraron órdenes de trabajo para esta placa",
            placa: placa,
            assignedStudent: "N/A",
            assignedModule: "N/A",
            contactName: "N/A",
            progressPercentage: 0,
            remainingTime: "N/A",
            totalTime: "N/A",
            updates: [`No se encontraron órdenes de trabajo para la placa: ${placa}`],
            tasks: [{
              icon: "fas fa-info-circle",
              text: "No hay tareas de reparación registradas"
            }],
          });
        }
      }).catch(error => {
        console.error('Error al buscar datos:', error);
        populateVehicleData({
          recordNumber: "Error",
          modelo: "Error de conexión",
          status: "No se pudo conectar con el servidor",
          placa: placa,
          assignedStudent: "N/A",
          assignedModule: "N/A",
          contactName: "Soporte técnico",
          progressPercentage: 0,
          remainingTime: "N/A",
          totalTime: "N/A",
          updates: ["Error al consultar la base de datos. Intente nuevamente más tarde."],
          tasks: [{
            icon: "fas fa-exclamation-triangle",
            text: "Error de conexión con el servidor"
          }],
        });
      });
    }
  } else {
    // Si no se proporciona placa en la URL
    populateVehicleData({
      recordNumber: "N/A",
      modelo: "Por favor, ingresa una placa",
      status: "Esperando búsqueda...",
      placa: "N/A",
      assignedStudent: "N/A",
      assignedModule: "N/A",
      contactName: "N/A",
      progressPercentage: 0,
      remainingTime: "N/A",
      totalTime: "N/A",
      updates: ["Ingresa una placa para ver el seguimiento del vehículo."],
      tasks: [],
    });
  }

  // Example for contact button - in a real app, this might open a chat or call
  const contactButton = document.querySelector(".contact-button");
  if (contactButton) {
    contactButton.addEventListener("click", function(e) {
      e.preventDefault();
      alert("Contactar a " + contactNameSpan.textContent);
      // In a real app, you might use:
      // window.location.href = `tel:${phoneNumber}`;
      // window.location.href = `mailto:${emailAddress}`;
    });
  }

  // Botón de nueva búsqueda
  const btnNuevaBusqueda = document.getElementById("btnNuevaBusqueda");
  if (btnNuevaBusqueda) {
    btnNuevaBusqueda.addEventListener("click", function() {
      window.location.href = "auth-seguimiento.html";
    });
    
    // Mostrar el botón si hay una placa en la URL
    if (placa) {
      btnNuevaBusqueda.style.display = "inline-flex";
    }
  }

});