const API_BASE_URL = 'https://sgma-66ec41075156.herokuapp.com/api';

import { me } from './services/authServiceStudents.js';

let user = null; // Variable global para el usuario

// Función para inicializar la aplicación
async function inicializarApp() {
    try {
        // Primero autenticar al usuario
        user = await me();
        console.log('Usuario autenticado:', user);
        
        if (!user || !user.student) {
            console.error('Usuario no autenticado o sin datos de estudiante');
            window.location.href = 'loginEstudiante.html';
            return;
        }

        // Una vez autenticado, cargar todos los datos
        await Promise.all([
            cargarDatosUsuario(),
            cargarTrabajosEnProgreso(),
            cargarTrabajosCompletados(),
            cargarVehiculosRegistrados()  // Agregar esta línea
        ]);

    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
        // En caso de error de autenticación, redirigir al login
        window.location.href = 'loginEstudiante.html';
    }
}

function cargarDatosUsuario() {
    if (!user || !user.student) {
        console.error('Usuario no disponible para cargar datos');
        return;
    }

    try {
        const nombreElement = document.getElementById('nombre-estudiante');
        const correoElement = document.getElementById('correo-estudiante');
        const codigoElement = document.getElementById('codigo-estudiante');
        const nivelElement = document.getElementById('nivel-estudiante');

        if (nombreElement) {
            nombreElement.textContent = `${user.student.firstName} ${user.student.lastName}`;
        }
        if (correoElement) {
            correoElement.textContent = user.student.email || 'No disponible';
        }
        if (codigoElement) {
            codigoElement.textContent = user.student.studentCode || 'No disponible';
        }
        if (nivelElement) {
            nivelElement.textContent = user.student.levelName || 'No disponible';
        }

        console.log('Datos de usuario cargados correctamente');
    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
    }
}

async function cargarTrabajosCompletados() {
    if (!user || !user.student) {
        console.error('Usuario no disponible para cargar trabajos completados');
        return;
    }

    try {
        console.log('Cargando trabajos completados...');
        
        const response = await fetch(`https://sgma-66ec41075156.herokuapp.com/api/workOrders/getWorkOrdersByStudentIdAndStatus4/${user.student.id}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Respuesta de trabajos completados:', data);

        // Usar la propiedad 'cantidad' del backend para actualizar el DOM
        const cantidadElement = document.getElementById('completeWorks');
        if (cantidadElement && data.cantidad !== undefined) {
            cantidadElement.textContent = data.cantidad;
            console.log('Cantidad de trabajos completados actualizada:', data.cantidad);
        } else {
            console.warn('No se encontró el elemento completeWorks o la propiedad cantidad en la respuesta');
        }

    } catch (error) {
        console.error('Error al cargar trabajos completados:', error);
        // En caso de error, mostrar 0 en lugar de dejar el valor anterior
        const cantidadElement = document.getElementById('completeWorks');
        if (cantidadElement) {
            cantidadElement.textContent = '0';
        }
    }
}

async function cargarTrabajosEnProgreso() {
    if (!user || !user.student) {
        console.error('Usuario no disponible para cargar trabajos en progreso');
        return;
    }

    try {
        console.log('Cargando trabajos en progreso...');
        
        const response = await fetch(`https://sgma-66ec41075156.herokuapp.com/api/workOrders/getWorkOrdersByStudentIdAndStatus3/${user.student.id}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Respuesta de trabajos en progreso:', data);

        // Usar la propiedad 'cantidad' del backend para actualizar el DOM
        const cantidadElement = document.getElementById('activeWorks');
        if (cantidadElement && data.cantidad !== undefined) {
            cantidadElement.textContent = data.cantidad;
            console.log('Cantidad de trabajos en progreso actualizada:', data.cantidad);
        } else {
            console.warn('No se encontró el elemento activeWorks o la propiedad cantidad en la respuesta');
        }


    } catch (error) {
        console.error('Error al cargar trabajos en progreso:', error);
        // En caso de error, mostrar 0 en lugar de dejar el valor anterior
        const cantidadElement = document.getElementById('activeWorks');
        if (cantidadElement) {
            cantidadElement.textContent = '0';
        }
    }
}

async function cargarVehiculosRegistrados() {
    if (!user || !user.student) {
        console.error('Usuario no disponible para cargar vehículos registrados');
        return;
    }

    try {
        console.log('Cargando vehículos registrados...');
        
        const response = await fetch(`https://sgma-66ec41075156.herokuapp.com/api/vehicles/getVehiclesByStudentId/${user.student.id}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Respuesta de vehículos registrados:', data);

        // Extraer vehículos según la estructura del API
        let vehicles = [];
        
        if (data.success && data.data && data.data.vehiculos) {
            vehicles = data.data.vehiculos;
        }

        // Usar la cantidad de vehículos para actualizar el DOM
        const cantidadElement = document.getElementById('allVehicles');
        if (cantidadElement) {
            cantidadElement.textContent = vehicles.length;
            console.log('Cantidad de vehículos registrados actualizada:', vehicles.length);
        } else {
            console.warn('No se encontró el elemento allVehicles');
        }

    } catch (error) {
        console.error('Error al cargar vehículos registrados:', error);
        // En caso de error, mostrar 0 en lugar de dejar el valor anterior
        const cantidadElement = document.getElementById('allVehicles');
        if (cantidadElement) {
            cantidadElement.textContent = '0';
        }
    }
}

// Cuando el DOM esté listo, inicializar la aplicación
document.addEventListener('DOMContentLoaded', inicializarApp);

