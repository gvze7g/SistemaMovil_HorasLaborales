import { me } from "../services/authServiceStudents.js";

const API_BASE = "https://sgma-66ec41075156.herokuapp.com/api";

let currentUser = null;

document.addEventListener("DOMContentLoaded", async () => {
    console.log('Iniciando registro de vehículo...');
    
    // Verificar autenticación
    try {
        const userInfo = await me();
        if (!userInfo.authenticated) {
            window.location.href = 'index.html';
            return;
        }
        currentUser = userInfo.student; // Cambiar de userInfo.user a userInfo.student
        console.log('Usuario autenticado:', currentUser);
    } catch (error) {
        console.error('Error al verificar autenticación:', error);
        window.location.href = 'index.html';
        return;
    }

    // Cargar tipos de vehículo
    await cargarTiposVehiculo();
    
    // Configurar previsualización de imagen
    configurarPrevisualización();
    
    // Configurar envío de formulario
    configurarFormulario();
});

async function cargarTiposVehiculo() {
    const selectTipo = document.getElementById('tipo');
    
    try {
        selectTipo.innerHTML = '<option value="">Cargando...</option>';
        
        const response = await fetch(`${API_BASE}/vehicleTypes/getAllVehiclesTypes`, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include'
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Datos completos recibidos:', data);
        
        // Verificar diferentes estructuras posibles de respuesta
        let tipos = [];
        if (data.data && Array.isArray(data.data)) {
            tipos = data.data;
        } else if (Array.isArray(data)) {
            tipos = data;
        } else if (data.result && Array.isArray(data.result)) {
            tipos = data.result;
        }
        
        console.log('Tipos extraídos:', tipos);
        
        selectTipo.innerHTML = '<option value="">Seleccionar tipo...</option>';
        
        if (tipos && tipos.length > 0) {
            tipos.forEach((tipo, index) => {
                console.log(`Tipo ${index}:`, tipo);
                const option = document.createElement('option');
                
                // Intentar diferentes nombres de campos posibles
                const id = tipo.vehicleTypeId || tipo.typeId || tipo.id;
                const name = tipo.vehicleTypeName || tipo.typeName || tipo.name || tipo.description;
                
                if (id && name) {
                    option.value = id;
                    option.textContent = name;
                    selectTipo.appendChild(option);
                    console.log(`Agregado: ${name} (ID: ${id})`);
                } else {
                    console.warn('Tipo con campos faltantes:', tipo);
                }
            });
            
            console.log('Tipos de vehículo cargados exitosamente:', tipos.length);
        } else {
            selectTipo.innerHTML = '<option value="">No hay tipos disponibles</option>';
            console.warn('No se encontraron tipos de vehículo');
        }
        
    } catch (error) {
        console.error('Error completo al cargar tipos:', error);
        selectTipo.innerHTML = '<option value="">Error al cargar</option>';
        
        await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los tipos de vehículo. Verifique su conexión.',
            customClass: {
                popup: 'swal-custom-popup',
                title: 'swal-custom-title',
                content: 'swal-custom-content',
                confirmButton: 'swal-custom-confirm-button'
            }
        });
    }
}

function configurarPrevisualización() {
    const fotoInput = document.getElementById('foto1');
    const vistaPrevia = document.getElementById('vista-previa-1');
    
    fotoInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                vistaPrevia.src = e.target.result;
                vistaPrevia.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            vistaPrevia.src = '#';
            vistaPrevia.style.display = 'none';
        }
    });
}

function configurarFormulario() {
    const botonEnvio = document.getElementById('boton-enviar-solicitud');
    
    botonEnvio.addEventListener('click', async function(e) {
        e.preventDefault();
        await procesarRegistro();
    });
}

async function procesarRegistro() {
    // Obtener datos del formulario
    const placa = document.getElementById('placa').value.trim().toUpperCase();
    const marca = document.getElementById('marca').value.trim();
    const modelo = document.getElementById('modelo').value.trim();
    const tipo = document.getElementById('tipo').value;
    const color = document.getElementById('color').value.trim();
    const tarjeta = document.getElementById('tarjetaCirculacion').value.trim();
    const mantenimientoExpo = document.getElementById('mantenimientoExpo').checked;
    const fotoInput = document.getElementById('foto1');
    const aceptarTerminos = document.getElementById('aceptarTerminos').checked;
    const nombreProp = document.getElementById('dueñoVehiculo').value.trim();
    const duiProp = document.getElementById('duiDueño').value.trim();
    const telProp = document.getElementById('telDueño').value.trim();

    // Validaciones detalladas basadas en el DTO
    const errores = [];

    // Validación de placa
    if (!placa) {
        errores.push('El número de placa es obligatorio');
    } else if (placa.length > 10) {
        errores.push('La placa no puede exceder 10 caracteres');
    } else if (!/^[A-Z]{1,3}[0-9]{3,4}$/.test(placa)) {
        errores.push('Formato de placa inválido (ej: ABC1234)');
    }

    // Validación de marca
    if (!marca) {
        errores.push('La marca es obligatoria');
    } else if (marca.length < 3) {
        errores.push('La marca debe tener al menos 3 caracteres');
    } else if (marca.length > 50) {
        errores.push('La marca no puede exceder 50 caracteres');
    }

    // Validación de modelo
    if (!modelo) {
        errores.push('El modelo es obligatorio');
    } else if (modelo.length < 3) {
        errores.push('El modelo debe tener al menos 3 caracteres');
    } else if (modelo.length > 50) {
        errores.push('El modelo no puede exceder 50 caracteres');
    }

    // Validación de tipo de vehículo
    if (!tipo) {
        errores.push('El tipo de vehículo es obligatorio');
    }

    // Validación de color
    if (!color) {
        errores.push('El color es obligatorio');
    } else if (color.length < 4) {
        errores.push('El color debe tener al menos 4 caracteres');
    } else if (color.length > 30) {
        errores.push('El color no puede exceder 30 caracteres');
    }

    // Validación de tarjeta de circulación
    if (!tarjeta) {
        errores.push('El número de tarjeta de circulación es obligatorio');
    } else if (tarjeta.length !== 20) {
        errores.push('El número de tarjeta debe tener exactamente 20 caracteres');
    }

    // Validación del propietario
    if (!nombreProp) {
        errores.push('El nombre del propietario es obligatorio');
    } else if (nombreProp.length < 5) {
        errores.push('El nombre del propietario debe tener al menos 5 caracteres');
    } else if (nombreProp.length > 100) {
        errores.push('El nombre del propietario no puede exceder 100 caracteres');
    }

    // Validación de DUI
    if (!duiProp) {
        errores.push('El DUI del propietario es obligatorio');
    } else if (duiProp.length !== 10) {
        errores.push('El DUI debe tener exactamente 10 caracteres');
    } else if (!/^[0-9]{8}-[0-9]$/.test(duiProp)) {
        errores.push('El formato del DUI es inválido (ej: 12345678-9)');
    }

    // Validación de teléfono
    if (!telProp) {
        errores.push('El teléfono del propietario es obligatorio');
    } else if (telProp.length < 7 || telProp.length > 10) {
        errores.push('El teléfono debe tener entre 7 y 10 caracteres');
    }

    // Validación de imagen
    if (!fotoInput.files[0]) {
        errores.push('La imagen del vehículo es obligatoria');
    }

    // Validación de términos
    if (!aceptarTerminos) {
        errores.push('Debe aceptar los términos y condiciones');
    }

    // Mostrar errores si existen
    if (errores.length > 0) {
        await Swal.fire({
            icon: 'error',
            title: 'Errores de Validación',
            html: errores.map(error => `• ${error}`).join('<br>'),
            customClass: {
                popup: 'swal-custom-popup',
                title: 'swal-custom-title',
                content: 'swal-custom-content',
                confirmButton: 'swal-custom-confirm-button'
            }
        });
        return;
    }

    // Mostrar loading
    Swal.fire({
        title: 'Registrando vehículo...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    try {
        // Subir imagen a Cloudinary
        const imageUrl = await subirImagen(fotoInput.files[0]);
        
        if (!imageUrl) {
            throw new Error('No se pudo obtener la URL de la imagen');
        }
        
        // Preparar datos del vehículo con la estructura correcta
        const vehicleData = {
            plateNumber: placa,
            brand: marca,
            model: modelo,
            typeId: parseInt(tipo), // Enviar como Long, no como objeto
            color: color,
            circulationCardNumber: tarjeta, // Nombre correcto del campo
            ownerName: nombreProp,
            ownerDui: duiProp,
            ownerPhone: telProp,
            vehicleImage: imageUrl,
            studentId: currentUser.id,
            maintenanceEXPO: mantenimientoExpo ? 1 : 0,
            idStatus: 1
        };

        console.log('Datos a enviar:', vehicleData);
        console.log('Student ID del usuario:', currentUser.id);

        // Registrar vehículo
        const response = await fetch(`${API_BASE}/vehicles/newVehicle`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(vehicleData)
        });

        if (!response.ok) {
            let errorMessage = 'Error al registrar el vehículo';
            
            // Manejar diferentes tipos de errores
            if (response.status === 403) {
                errorMessage = 'No tiene permisos para realizar esta acción. Verifique su sesión.';
            } else if (response.status === 400) {
                try {
                    const errorData = await response.json();
                    if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch (e) {
                    errorMessage = 'Los datos enviados no son válidos';
                }
            } else if (response.status === 401) {
                errorMessage = 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.';
                setTimeout(() => {
                    window.location.href = 'loginEstudiante.html';
                }, 2000);
            }
            
            throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log('Respuesta del servidor:', result);

        Swal.close();
        
        if (result.data || result.success !== false) {
            await Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: 'Vehículo registrado correctamente',
                customClass: {
                    popup: 'swal-custom-popup',
                    title: 'swal-custom-title',
                    content: 'swal-custom-content',
                    confirmButton: 'swal-custom-confirm-button'
                }
            });
            window.location.href = 'estudiante.html';
        } else {
            throw new Error('No se recibió confirmación del registro');
        }

    } catch (error) {
        console.error('Error en el registro:', error);
        Swal.close();
        await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Error al registrar el vehículo',
            customClass: {
                popup: 'swal-custom-popup',
                title: 'swal-custom-title',
                content: 'swal-custom-content',
                confirmButton: 'swal-custom-confirm-button'
            }
        });
    }
}

async function subirImagen(archivo) {
    try {
        const formData = new FormData();
        formData.append('image', archivo);
        formData.append('folder', 'vehicles');

        const response = await fetch(`${API_BASE}/images/upload-to-folder`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Error al subir imagen: HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.url) {
            throw new Error('No se recibió URL de la imagen del servidor');
        }

        return data.url;
    } catch (error) {
        console.error('Error al subir imagen:', error);
        await Swal.fire({
            icon: 'error',
            title: 'Error de Subida',
            text: 'No se pudo subir la imagen. Intenta de nuevo.',
            customClass: {
                popup: 'swal-custom-popup',
                title: 'swal-custom-title',
                content: 'swal-custom-content',
                confirmButton: 'swal-custom-confirm-button'
            }
        });
        return null;
    }
}

