// Función para obtener datos del perfil
export async function me() {
    try {
        const response = await fetch('http://localhost:8080/api/instructorsAuth/meInstructor', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
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
        const response = await fetch(`http://localhost:8080/api/instructors/update/${instructorId}/password`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
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