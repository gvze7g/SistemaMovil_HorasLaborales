import { me } from "../services/authServiceStudents.js";

//cambiar!!
const API_BASE = "http://localhost:8080/api";

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

    // Cargar marcas y encadenar el combobox de modelos
    await cargarMarcas();
    configurarComboMarcaModelo();

    // Configurar previsualización de imagen
    configurarPrevisualización();
    
    // Configurar envío de formulario
    configurarFormulario();
    
    // Configurar formateo de inputs
    configurarFormatosInputs();
});

function configurarFormatosInputs() {
    const duiInput = document.getElementById('duiDueño');
    const telInput = document.getElementById('telDueño');

    const placaInput = document.getElementById('placa');

    if (placaInput) {
        placaInput.addEventListener('input', function(e) {
            // Remove any spaces and special characters, keep only letters and numbers
            let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            // Limit to 8 chars
            if (value.length > 8) {
                value = value.substring(0, 8);
            }
            e.target.value = value;
        });
    }

    if (duiInput) {
        duiInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
            if (value.length > 8) {
                value = value.substring(0, 8) + '-' + value.substring(8, 9);
            }
            e.target.value = value;
        });
    }

    if (telInput) {
        // Establecer prefijo inicial si está vacío
        telInput.addEventListener('focus', function(e) {
            if (e.target.value === '') {
                e.target.value = '+503 ';
            }
        });

        telInput.addEventListener('input', function(e) {
            let value = e.target.value;
            // Si el usuario intenta borrar el prefijo, lo restauramos
            if (!value.startsWith('+503 ')) {
                // Extraer solo los números de lo que quede
                let numbers = value.replace(/\D/g, '').replace(/^503/, '');
                value = '+503 ' + numbers;
            }
            
            // Extraer números después del prefijo
            let rest = value.substring(5).replace(/\D/g, '');
            if (rest.length > 4) {
                rest = rest.substring(0, 4) + '-' + rest.substring(4, 8);
            }
            
            e.target.value = '+503 ' + rest;
        });

        telInput.addEventListener('keydown', function(e) {
            // Evitar que el usuario borre el prefijo
            if ((e.key === 'Backspace' || e.key === 'Delete') && e.target.selectionStart <= 5 && e.target.selectionEnd <= 5) {
                e.preventDefault();
            }
        });
    }
}

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

async function cargarMarcas() {
    const selectMarca = document.getElementById('marca');

    try {
        selectMarca.innerHTML = '<option value="">Cargando...</option>';

        const response = await fetch(`${API_BASE}/brands/getAllBrands`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        const marcas = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);

        selectMarca.innerHTML = '<option value="">Seleccionar marca...</option>';

        marcas.forEach((marca) => {
            const option = document.createElement('option');
            option.value = marca.brandId;
            option.textContent = marca.brandName;
            selectMarca.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar marcas:', error);
        selectMarca.innerHTML = '<option value="">Error al cargar</option>';
    }
}

async function cargarModelosPorMarca(brandId) {
    const selectModelo = document.getElementById('modelo');

    if (!brandId) {
        selectModelo.innerHTML = '<option value="">Selecciona primero una marca...</option>';
        selectModelo.disabled = true;
        return;
    }

    try {
        selectModelo.disabled = true;
        selectModelo.innerHTML = '<option value="">Cargando...</option>';

        const response = await fetch(`${API_BASE}/vehicleModels/getModelsByBrand/${brandId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        const modelos = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);

        selectModelo.innerHTML = '<option value="">Seleccionar modelo...</option>';

        if (modelos.length === 0) {
            selectModelo.innerHTML += '<option value="" disabled>Sin modelos para esta marca</option>';
        } else {
            modelos.forEach((modelo) => {
                const option = document.createElement('option');
                option.value = modelo.modelId;
                option.textContent = modelo.modelName;
                selectModelo.appendChild(option);
            });
            selectModelo.disabled = false;
        }
    } catch (error) {
        console.error('Error al cargar modelos:', error);
        selectModelo.innerHTML = '<option value="">Error al cargar</option>';
    }
}

function configurarComboMarcaModelo() {
    const selectMarca = document.getElementById('marca');
    selectMarca.addEventListener('change', () => {
        cargarModelosPorMarca(selectMarca.value);
    });
}

function configurarPrevisualización() {
    ['1', '2', '3', '4'].forEach((n) => {
        const fotoInput = document.getElementById(`foto${n}`);
        const vistaPrevia = document.getElementById(`vista-previa-${n}`);
        if (!fotoInput || !vistaPrevia) return;

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
    const marcaSelect = document.getElementById('marca');
    const modeloSelect = document.getElementById('modelo');
    const brandId = marcaSelect.value;
    const vehicleModelId = modeloSelect.value;
    // La marca/modelo en texto se derivan de la opción elegida en los combobox
    // (se siguen mandando como texto porque el DTO todavía los requiere por compatibilidad)
    const marca = brandId ? marcaSelect.options[marcaSelect.selectedIndex].textContent.trim() : '';
    const modelo = vehicleModelId ? modeloSelect.options[modeloSelect.selectedIndex].textContent.trim() : '';
    const tipo = document.getElementById('tipo').value;
    const color = document.getElementById('color').value.trim();
    const tarjeta = document.getElementById('tarjetaCirculacion').value.trim();
    const mantenimientoExpo = document.getElementById('mantenimientoExpo').checked;
    const fotoInput1 = document.getElementById('foto1');
    const fotoInput2 = document.getElementById('foto2');
    const fotoInput3 = document.getElementById('foto3');
    const fotoInput4 = document.getElementById('foto4');
    const aceptarTerminos = document.getElementById('aceptarTerminos').checked;
    const nombreProp = document.getElementById('dueñoVehiculo').value.trim();
    const duiProp = document.getElementById('duiDueño').value.trim();
    const telPropFull = document.getElementById('telDueño').value.trim();
    const correoProp = document.getElementById('correoDueño').value.trim();
    // Remover el +503 para la base de datos (límite de 10 caracteres)
    const telProp = telPropFull.replace('+503 ', '');

    // Validaciones detalladas basadas en el DTO
    const errores = [];

    // Validación de placa
    if (!placa) {
        errores.push('La placa es obligatoria');
    } else if (!/^[A-Z]{1,2}[A-Z0-9]{3,6}$/.test(placa)) {
        errores.push('La placa debe tener 1 o 2 letras seguidas de 3 a 6 números/letras (Ej: P123456, P452AAA)');
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
    } else if (!/^\d{8}-\d$/.test(duiProp)) {
        errores.push('El formato del DUI es inválido (ej: 12345678-9)');
    }

    // Validación de teléfono
    if (!telPropFull || telPropFull === '+503 ') {
        errores.push('El teléfono del propietario es obligatorio');
    } else if (telPropFull.length !== 14) { // +503 XXXX-XXXX
        errores.push('El teléfono debe tener el formato +503 XXXX-XXXX');
    }

    // Validación de correo del propietario
    if (!correoProp) {
        errores.push('El correo del propietario es obligatorio');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoProp)) {
        errores.push('El correo del propietario no tiene un formato válido');
    }

    // Validación de las 4 imágenes del vehículo
    if (!fotoInput1.files[0]) {
        errores.push('La foto frontal del vehículo es obligatoria');
    }
    if (!fotoInput2.files[0]) {
        errores.push('La foto lateral izquierda del vehículo es obligatoria');
    }
    if (!fotoInput3.files[0]) {
        errores.push('La foto lateral derecha del vehículo es obligatoria');
    }
    if (!fotoInput4.files[0]) {
        errores.push('La foto trasera del vehículo es obligatoria');
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
        // Subir las 4 fotos a Cloudinary
        const [imageUrlFront, imageUrlLeft, imageUrlRight, imageUrlBack] = await Promise.all([
            subirImagen(fotoInput1.files[0]),
            subirImagen(fotoInput2.files[0]),
            subirImagen(fotoInput3.files[0]),
            subirImagen(fotoInput4.files[0]),
        ]);

        if (!imageUrlFront || !imageUrlLeft || !imageUrlRight || !imageUrlBack) {
            throw new Error('No se pudo obtener la URL de una o más imágenes');
        }

        // Preparar datos del vehículo con la estructura correcta
        const vehicleData = {
            plateNumber: placa,
            brand: marca,
            model: modelo,
            vehicleModelId: parseInt(vehicleModelId),
            typeId: parseInt(tipo), // Enviar como Long, no como objeto
            color: color,
            circulationCardNumber: tarjeta, // Nombre correcto del campo
            ownerName: nombreProp,
            ownerDui: duiProp,
            ownerPhone: telProp,
            ownerEmail: correoProp,
            vehicleImage: imageUrlFront,
            vehicleImageLeft: imageUrlLeft,
            vehicleImageRight: imageUrlRight,
            vehicleImageBack: imageUrlBack,
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
            } else if (response.status === 400 || response.status === 500) {
                try {
                    const errorData = await response.json();
                    if (errorData.message) {
                        errorMessage = errorData.message;
                    } else if (errorData.error) {
                        errorMessage = errorData.error;
                    }
                } catch (e) {
                    errorMessage = 'Los datos enviados no son válidos o ocurrió un error interno en el servidor';
                }
            } else if (response.status === 401) {
                errorMessage = 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.';
                setTimeout(() => {
                    window.location.href = 'index.html';
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

