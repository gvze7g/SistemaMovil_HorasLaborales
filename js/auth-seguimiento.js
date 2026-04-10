// Funciones para manejo de órdenes de trabajo (temporalmente aquí) ----CAMBIAR----
const API_BASE_URL = 'https://sgma-66ec41075156.herokuapp.com';

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

function processWorkOrdersForTracking(workOrders, placa) {
    if (!workOrders || workOrders.length === 0) {
        return null;
    }

    console.log('🔍 Datos recibidos de la API:', workOrders);
    console.log('📋 Primera orden de trabajo:', workOrders[0]);

    const mainOrder = workOrders[0];
    
    // Calcular progreso basado en el estado (idStatus)
    let progressPercentage = 0;
    let status = "Sin información";
    
    switch (mainOrder.idStatus) {
        case 1: progressPercentage = 10; status = mainOrder.statusName || "Pendiente"; break;
        case 2: progressPercentage = 50; status = mainOrder.statusName || "En progreso"; break;
        case 3: progressPercentage = 100; status = mainOrder.statusName || "Completada"; break;
        case 4: progressPercentage = 30; status = mainOrder.statusName || "Pausada"; break;
        case 5: progressPercentage = 0; status = mainOrder.statusName || "Rechazado"; break;
        default: progressPercentage = 25; status = mainOrder.statusName || "Sin información";
    }

    const vehicleFullName = `${mainOrder.vehicleBrand || ''} ${mainOrder.vehicleModel || ''}`.trim();
    const vehicleWithYear = mainOrder.vehicleYear ? `${vehicleFullName} (${mainOrder.vehicleYear})` : vehicleFullName;

    return {
        recordNumber: mainOrder.workOrderId || "N/A",
        modelo: vehicleWithYear || "Vehículo no especificado",
        status: status,
        placa: mainOrder.vehiclePlateNumber || placa,
        assignedStudent: "Por asignar",
        assignedModule: `${mainOrder.moduleName || 'Módulo no especificado'} (${mainOrder.moduleCode || 'Sin código'})`,
        contactName: "Administrador del taller",
        progressPercentage: progressPercentage,
        remainingTime: mainOrder.estimatedTime ? `${mainOrder.estimatedTime}h restantes` : "No especificado",
        totalTime: mainOrder.estimatedTime ? `${mainOrder.estimatedTime}h estimadas` : "N/A",
        vehicleImage: "imgs/audi.jpg", // Imagen por defecto
        workOrderImage: mainOrder.workOrderImage || null,
        tasks: [{ icon: "fas fa-wrench", text: mainOrder.description || "Reparación general" }],
        updates: [`Orden creada: ${mainOrder.description || 'Sin descripción'} - Estado: ${mainOrder.statusName || 'Sin estado'}`],
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

document.addEventListener('DOMContentLoaded', function() {
    const verSeguimientoBtn = document.getElementById('verSeguimientoBtn');
    const placaInput = document.getElementById('placa');

    if (verSeguimientoBtn && placaInput) {
        verSeguimientoBtn.addEventListener('click', function() {
            const placa = placaInput.value.trim();

            if (placa) {
                if (placa.length < 5) { 
                    Swal.fire({
                        title: 'Entrada Inválida',
                        text: 'El número de placa, tarjeta de circulación o DUI debe tener al menos 5 caracteres.',
                        icon: 'warning',
                        customClass: {
                            popup: 'swal-custom-popup',
                            title: 'swal-custom-title',
                            content: 'swal-custom-content',
                            confirmButton: 'swal-custom-confirm-button'
                        },
                        buttonsStyling: false
                    });
                    return; 
                }
                
                // Mostrar loading mientras se busca
                verSeguimientoBtn.disabled = true;
                verSeguimientoBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
                
                // Buscar órdenes de trabajo por placa
                buscarOrdenesTrabajoByPlaca(placa);
            } else {
                Swal.fire({
                    title: 'Campo Vacío',
                    text: 'Por favor, ingresa tu número de placa, tarjeta de circulación o DUI.',
                    icon: 'error',
                    customClass: {
                        popup: 'swal-custom-popup',
                        title: 'swal-custom-title',
                        content: 'swal-custom-content',
                        confirmButton: 'swal-custom-confirm-button'
                    },
                    buttonsStyling: false
                });
            }
        });
    } else {
        console.error("Error: No se encontró el botón o el campo de entrada en el DOM.");
    }

    // Botón de prueba temporal
    const pruebaBtn = document.getElementById('pruebaBtn');
    if (pruebaBtn) {
        pruebaBtn.addEventListener('click', function() {
            console.log('🧪 Iniciando prueba con placa ABC7777');
            placaInput.value = 'ABC7777';
            buscarOrdenesTrabajoByPlaca('ABC7777');
        });
    }

    // Función de prueba con datos mock
    async function pruebaConDatosMock() {
        console.log('🧪 Probando con datos mock...');
        
        // Datos mock que simulan la respuesta de la API --CAMBIAR---
        const mockWorkOrders = [{
            "workOrderId": 23,
            "vehicleId": 36,
            "moduleId": 15,
            "estimatedTime": "2",
            "workOrderImage": "https://res.cloudinary.com/dl1npfhow/image/upload/v1760793650/workOrders/img_1d02420b-e18e-40e5-acc2-1125e928c8a8.jpg.jpg",
            "idStatus": 5,
            "vehiclePlateNumber": "ABC7777",
            "moduleName": "Reparación de los sistemas de frenos",
            "vehicleBrand": "Lexus",
            "vehicleModel": "LXLX",
            "vehicleYear": null,
            "statusName": "Rechazado",
            "moduleCode": "BTVMA 2.3",
            "description": "Se hará un cambio de pastillas de freno debido a que ya están desgastadas debido a mucha fricción"
        }];

        const mockObservations = [
            {
                "observationId": 1,
                "observation": "Se revisó el sistema de frenos y se confirmó el desgaste de las pastillas",
                "createdDate": "2025-01-15T10:30:00"
            },
            {
                "observationId": 2,
                "observation": "Se solicitaron las pastillas de repuesto al proveedor",
                "createdDate": "2025-01-16T14:20:00"
            },
            {
                "observationId": 3,
                "observation": "Trabajo rechazado por falta de autorización del propietario",
                "createdDate": "2025-01-17T09:15:00"
            }
        ];

        try {
            // Simular el procesamiento
            const processedData = processWorkOrdersForTracking(mockWorkOrders, "ABC7777");
            
            // Agregar observaciones mock al procesedData
            if (processedData && processedData.updates) {
                processedData.updates = [
                    `${new Date().toLocaleDateString('es-ES')}: Orden de trabajo registrada - ${mockWorkOrders[0].description} - Estado: ${mockWorkOrders[0].statusName}`,
                    `15/1/2025: 📝 Se revisó el sistema de frenos y se confirmó el desgaste de las pastillas`,
                    `16/1/2025: 📝 Se solicitaron las pastillas de repuesto al proveedor`, 
                    `17/1/2025: 📝 Trabajo rechazado por falta de autorización del propietario`,
                    `⏰ Tiempo estimado: ${mockWorkOrders[0].estimatedTime} horas`,
                    `🔧 Código del módulo: ${mockWorkOrders[0].moduleCode}`
                ];
            }
            
            localStorage.setItem('workOrdersData', JSON.stringify(processedData));
            console.log('✅ Datos mock procesados:', processedData);
            
            // Redirigir a seguimiento
            window.location.href = `seguimiento.html?placa=ABC7777`;
            
        } catch (error) {
            console.error('❌ Error en prueba mock:', error);
        }
    }

    // Agregar botón de prueba mock
    if (pruebaBtn) {
        const mockBtn = document.createElement('button');
        mockBtn.type = 'button';
        mockBtn.className = 'boton-accion';
        mockBtn.style.backgroundColor = '#17a2b8';
        mockBtn.style.marginTop = '10px';
        mockBtn.innerHTML = '🧪 Prueba Mock (Offline)';
        mockBtn.addEventListener('click', pruebaConDatosMock);
        pruebaBtn.parentNode.insertBefore(mockBtn, pruebaBtn.nextSibling);
    }

    // Función para buscar órdenes de trabajo por placa
    async function buscarOrdenesTrabajoByPlaca(placa) {
        const verSeguimientoBtn = document.getElementById('verSeguimientoBtn');
        
        try {
            const result = await getWorkOrdersByPlate(placa);
            
            if (result.workOrders && result.workOrders.length > 0) {
                // Procesar los datos y guardar en localStorage (función simplificada en este archivo)
                const processedData = processWorkOrdersForTracking(result.workOrders, placa);
                localStorage.setItem('workOrdersData', JSON.stringify(processedData));
                
                // Redirigir a seguimiento
                window.location.href = `seguimiento.html?placa=${encodeURIComponent(placa)}`;
            } else {
                // No se encontraron órdenes de trabajo para esta placa
                Swal.fire({
                    title: 'No se encontraron resultados',
                    text: `No se encontraron órdenes de trabajo para la placa "${placa}".`,
                    icon: 'info',
                    customClass: {
                        popup: 'swal-custom-popup',
                        title: 'swal-custom-title',
                        content: 'swal-custom-content',
                        confirmButton: 'swal-custom-confirm-button'
                    },
                    buttonsStyling: false
                });
            }

        } catch (error) {
            console.error('Error al buscar órdenes de trabajo:', error);
            
            let errorMessage = 'No se pudo conectar con el servidor. Por favor, intenta nuevamente.';
            
            // Personalizar mensaje según el tipo de error
            if (error.message.includes('404')) {
                errorMessage = `No se encontraron órdenes de trabajo para la placa "${placa}".`;
            } else if (error.message.includes('403')) {
                errorMessage = 'No tienes permisos para acceder a esta información.';
            } else if (error.message.includes('500')) {
                errorMessage = 'Error interno del servidor. Por favor, intenta más tarde.';
            }
            
            Swal.fire({
                title: 'Error de Conexión',
                text: errorMessage,
                icon: 'error',
                customClass: {
                    popup: 'swal-custom-popup',
                    title: 'swal-custom-title',
                    content: 'swal-custom-content',
                    confirmButton: 'swal-custom-confirm-button'
                },
                buttonsStyling: false
            });
        } finally {
            // Restaurar el botón
            if (verSeguimientoBtn) {
                verSeguimientoBtn.disabled = false;
                verSeguimientoBtn.innerHTML = 'Ver Seguimiento';
            }
        }
    }
});