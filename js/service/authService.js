// Helper para obtener el valor de una cookie por nombre
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Función para obtener datos del perfil
export async function me() {
    try {
        const response = await fetch('/api/me', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getCookie('authToken')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error en me():', error);
        throw error;
    }
}

// Función para cambiar contraseña
export async function changePassword(instructorId, currentPassword, newPassword) {
    try {
        const response = await fetch('/api/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getCookie('authToken')}`
            },
            body: JSON.stringify({
                instructorId,
                currentPassword,
                newPassword
            })
        });
        
        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error en changePassword():', error);
        throw error;
    }
}
