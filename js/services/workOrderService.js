// Servicio para manejar las operaciones de órdenes de trabajo
const API_BASE_URL = 'https://sgma-66ec41075156.herokuapp.com';

/**
 * Obtiene las órdenes de trabajo por número de placa
 * @param {string} plateNumber - Número de placa del vehículo
 * @returns {Promise<Object>} - Respuesta de la API con las órdenes de trabajo
 */
export async function getWorkOrdersByPlate(plateNumber) {
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
 * @param {Array} workOrders - Array de órdenes de trabajo
 * @param {string} placa - Número de placa
 * @returns {Object} - Datos procesados para mostrar en el seguimiento
 */
export function processWorkOrdersForTracking(workOrders, placa) {
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

    // Generar actualizaciones más detalladas
    const updates = workOrders.map((order, index) => {
        const orderDate = new Date().toLocaleDateString('es-ES');
        return `${orderDate}: ${order.description || 'Orden de trabajo creada'} - Estado: ${order.statusName || 'Sin estado'}`;
    });

    // Agregar información adicional a las actualizaciones
    if (mainOrder.estimatedTime) {
        updates.push(`Tiempo estimado: ${mainOrder.estimatedTime} horas`);
    }
    if (mainOrder.moduleCode) {
        updates.push(`Código del módulo: ${mainOrder.moduleCode}`);
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

// Función auxiliar para obtener modelo del vehículo
function getVehicleModel(order) {
    // Intentar diferentes estructuras de datos que podrían venir de la API
    return order.vehicleId?.model || 
           order.vehicle?.model || 
           order.vehicleModel || 
           order.model || 
           "Vehículo no especificado";
}

// Función auxiliar para obtener información de contacto
function getContactName(order) {
    return order.contactName || 
           order.contact?.name || 
           order.customerName || 
           order.owner?.name || 
           "Administrador";
}

// Función auxiliar para obtener nombre del estudiante
function getStudentName(order) {
    if (order.studentId?.firstName && order.studentId?.lastName) {
        return `${order.studentId.firstName} ${order.studentId.lastName}`;
    }
    if (order.student?.firstName && order.student?.lastName) {
        return `${order.student.firstName} ${order.student.lastName}`;
    }
    if (order.studentId?.firstName || order.student?.firstName) {
        return order.studentId?.firstName || order.student?.firstName;
    }
    return "No asignado";
}

// Función auxiliar para obtener nombre del módulo
function getModuleName(order) {
    return order.moduleId?.name || order.module?.name || "No asignado";
}

// Función auxiliar para obtener iconos según el tipo de reparación
function getIconForRepairType(repairType) {
    const type = (repairType || "").toLowerCase();
    if (type.includes('electr') || type.includes('luz')) return "fas fa-lightbulb";
    if (type.includes('motor')) return "fas fa-gears";
    if (type.includes('aceite')) return "fas fa-oil-can";
    if (type.includes('puerta') || type.includes('ventana')) return "fas fa-window-restore";
    if (type.includes('parabrisas')) return "fas fa-wind";
    if (type.includes('airbag')) return "fas fa-car-crash";
    if (type.includes('espejo')) return "fas fa-eye";
    if (type.includes('freno')) return "fas fa-car-side";
    if (type.includes('suspension')) return "fas fa-car";
    if (type.includes('transmision')) return "fas fa-cogs";
    return "fas fa-wrench"; // Icono por defecto
}

// Función auxiliar para calcular tiempo restante
function calculateRemainingTime(order) {
    if (order.estimatedCompletionDate) {
        const now = new Date();
        const completion = new Date(order.estimatedCompletionDate);
        const diff = completion - now;
        
        if (diff > 0) {
            const hours = Math.ceil(diff / (1000 * 60 * 60));
            if (hours < 24) {
                return `${hours}h restantes`;
            } else {
                const days = Math.ceil(hours / 24);
                return `${days} día(s) restante(s)`;
            }
        } else {
            return "Tiempo vencido";
        }
    }
    return order.estimatedCompletionTime || "Calculando...";
}

// Función auxiliar para calcular tiempo total
function calculateTotalTime(order) {
    if (order.startDate && order.endDate) {
        const start = new Date(order.startDate);
        const end = new Date(order.endDate);
        const diffHours = Math.abs(end - start) / 36e5;
        return `${Math.round(diffHours)}h totales`;
    }
    return order.estimatedDuration || "N/A";
}

// Función auxiliar para obtener imagen del vehículo
function getVehicleImage(model) {
    if (!model) return "imgs/default_vehicle.jpg";
    
    const modelLower = model.toLowerCase();
    if (modelLower.includes('volvo')) return "imgs/volvo.jpg";
    if (modelLower.includes('audi')) return "imgs/audi.jpg";
    if (modelLower.includes('mercedes')) return "imgs/mercedes.jpg";
    if (modelLower.includes('toyota')) return "imgs/toyota.webp";
    if (modelLower.includes('jeep')) return "imgs/jeep.webp";
    if (modelLower.includes('hilux')) return "imgs/hilux.jpg";
    if (modelLower.includes('camaro')) return "imgs/camaro.jpeg";
    if (modelLower.includes('ram')) return "imgs/ram.jpeg";
    if (modelLower.includes('tacoma')) return "imgs/tacoma.jpeg";
    
    return "imgs/audi.jpg"; // Imagen por defecto
}

// Función auxiliar para obtener iconos según el tipo de módulo/reparación
function getIconForModuleType(moduleDescription) {
    const desc = (moduleDescription || "").toLowerCase();
    
    // Frenos
    if (desc.includes('freno') || desc.includes('pastilla') || desc.includes('disco')) {
        return "fas fa-car-side";
    }
    
    // Sistemas eléctricos
    if (desc.includes('electr') || desc.includes('luz') || desc.includes('bateria') || desc.includes('alternador')) {
        return "fas fa-lightbulb";
    }
    
    // Motor y mecánica
    if (desc.includes('motor') || desc.includes('piston') || desc.includes('cilindro')) {
        return "fas fa-gears";
    }
    
    // Aceite y lubricantes
    if (desc.includes('aceite') || desc.includes('lubricant') || desc.includes('filtro')) {
        return "fas fa-oil-can";
    }
    
    // Suspensión
    if (desc.includes('suspension') || desc.includes('amortiguador') || desc.includes('resorte')) {
        return "fas fa-car";
    }
    
    // Transmisión
    if (desc.includes('transmision') || desc.includes('embrague') || desc.includes('diferencial')) {
        return "fas fa-cogs";
    }
    
    // Carrocería
    if (desc.includes('puerta') || desc.includes('ventana') || desc.includes('carroceria')) {
        return "fas fa-window-restore";
    }
    
    // Por defecto
    return "fas fa-wrench";
}

// Función auxiliar para obtener imagen del vehículo por marca
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

// Función auxiliar para calcular tiempo restante basado en estimación
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
        return `${days} día(s) laborales restantes`;
    }
}

/**
 * Función de prueba para verificar la conectividad de la API
 * @param {string} plateNumber - Número de placa para probar
 * @returns {Promise<boolean>} - True si la API responde correctamente
 */
export async function testApiConnection(plateNumber = "TEST123") {
    try {
        console.log('Probando conexión con la API...');
        const result = await getWorkOrdersByPlate(plateNumber);
        console.log('Respuesta de la API:', result);
        return true;
    } catch (error) {
        console.error('Error en la conexión de API:', error);
        return false;
    }
}
