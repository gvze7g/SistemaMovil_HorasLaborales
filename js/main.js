import { me } from './service/authService.js';

let allVehicles = [];
let userRole = null;
let selectedVehicleId = null;

// Obtiene información del usuario autenticado
async function getUserInfo() {
    try {
        const userInfo = await me();
        if (userInfo.authenticated && userInfo.instructor && userInfo.instructor.role) {
            userRole = userInfo.instructor.role;
            handleSidebarVisibility();
            updateSidebarTitle();
            return userInfo.instructor;
        }
        return null;
    } catch (error) {
        console.error('Error getting user info:', error);
        return null;
    }
}

// Convert status ID to readable text
function getStatusText(statusId) {
    switch(statusId) {
        case 1: return 'En espera de aprobación del animador';
        case 2: return 'En espera de aprobación del coordinador';
        case 3: return 'Vehículo aprobado';
        case 4: return 'Vehículo rechazado';
        default: return 'Estado desconocido';
    }
}

// Get status class for styling
function getStatusClass(statusId) {
    switch(statusId) {
        case 1:
        case 2: return 'estado-pendiente';
        case 3: return 'estado-completado';
        case 4: return 'estado-rechazado';
        default: return 'estado-pendiente';
    }
}

// Update vehicle status
async function updateVehicleStatus(vehicleId, newStatus) {
    try {
        const response = await fetch(`https://sgma-66ec41075156.herokuapp.com/api/vehicles/updateStatusVehicle/${vehicleId}?newStatus=${newStatus}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        
        if (data.success) {
            const message = newStatus === 4 ? 
                'El vehículo ha sido rechazado.' : 
                newStatus === 3 ? 
                    'El vehículo ha sido aprobado completamente.' : 
                    'El vehículo ha sido enviado al siguiente nivel de revisión.';
            
            if (typeof Swal !== 'undefined') {
                await Swal.fire({
                    icon: 'success',
                    title: 'Éxito',
                    text: message
                });
            } else {
                alert(message);
            }
            
            document.getElementById('modalVehiculo').classList.remove('activo');
            await fetchAllVehicles();
            return true;
        }
        throw new Error('Failed to update vehicle status');
    } catch (error) {
        console.error('Error updating vehicle status:', error);
        if (typeof Swal !== 'undefined') {
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo actualizar el estado del vehículo.'
            });
        } else {
            alert('Error al actualizar el estado del vehículo');
        }
        return false;
    }
}

// Show vehicle modal with appropriate actions
function showVehicleModal(vehicleId) {
    // ... existing modal display code ...

    // Update action buttons visibility based on role and vehicle status
    const vehicle = allVehicles.find(v => v.vehicleId === vehicleId);
    if (vehicle) {
        const btnAprobar = document.querySelector('.btn-modal.primario');
        const btnRechazar = document.querySelector('.btn-modal.secundario');
        
        if (btnAprobar && btnRechazar) {
            const canApprove = (userRole === 'Animador' && vehicle.idStatus === 1) ||
                             (userRole === 'Coordinador' && vehicle.idStatus === 2);
            
            btnAprobar.style.display = canApprove ? 'block' : 'none';
            btnRechazar.style.display = canApprove ? 'block' : 'none';
        }
    }
}

// Event listeners for action buttons
document.addEventListener('DOMContentLoaded', async function() {
    const btnAprobar = document.querySelector('.btn-modal.primario');
    const btnRechazar = document.querySelector('.btn-modal.secundario');
    
    if (btnAprobar) {
        btnAprobar.addEventListener('click', async function() {
            if (!selectedVehicleId) return;
            
            const vehicle = allVehicles.find(v => v.vehicleId === selectedVehicleId);
            if (!vehicle) return;
            
            const newStatus = userRole === 'Animador' ? 2 : 3;
            await updateVehicleStatus(selectedVehicleId, newStatus);
        });
    }
    
    if (btnRechazar) {
        btnRechazar.addEventListener('click', async function() {
            if (!selectedVehicleId) return;
            
            if (typeof Swal !== 'undefined') {
                const result = await Swal.fire({
                    title: '¿Estás seguro?',
                    text: 'Esta acción rechazará el vehículo.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Sí, rechazar',
                    cancelButtonText: 'Cancelar'
                });
                
                if (result.isConfirmed) {
                    await updateVehicleStatus(selectedVehicleId, 4);
                }
            } else {
                if (confirm('¿Estás seguro de que quieres rechazar este vehículo?')) {
                    await updateVehicleStatus(selectedVehicleId, 4);
                }
            }
        });
    }
    
    await getUserInfo();
    await fetchAllVehicles();
});

// ... rest of your existing code ...
