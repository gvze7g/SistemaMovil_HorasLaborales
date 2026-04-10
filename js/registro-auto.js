document.addEventListener("DOMContentLoaded", () => {
    // --- Configuración Global ---
    const API_BASE_URL = "https://sgma-66ec41075156.herokuapp.com"; //CAMBIAR
    
    // Referencias a elementos del DOM
    const botonEnviar = document.getElementById("boton-enviar-solicitud");
    const estudianteSelect = document.getElementById("estudianteAsignado");
    const tipoVehiculoSelect = document.getElementById("tipo");
    const polizaCheckbox = document.getElementById("casilla-poliza-opcional");
    const polizaInput = document.getElementById("poliza");
    const fotoInput = document.getElementById("foto1");
    
    // --- Funciones de Utilidad y Alertas (SweetAlert2) ---

    /**
     * Muestra una alerta de SweetAlert2.
     * @param {string} title Título de la alerta.
     * @param {string} text Cuerpo del mensaje.
     * @param {string} icon Icono ('success', 'error', 'warning', 'info', 'question').
     */
    const mostrarAlerta = (title, text, icon) => {
        return Swal.fire({
            title: title,
            html: text, // Usamos html para permitir <br>
            icon: icon,
            confirmButtonText: "Aceptar",
        });
    };

    /**
     * Valida un campo individual del formulario.
     * @param {string} id ID del campo en el HTML.
     * @param {string} value Valor del campo.
     * @param {object} rules Reglas de validación.
     * @returns {string|null} Mensaje de error o null si es válido.
     */
    const validarCampo = (id, value, rules) => {
        const fieldName = rules.name || id;

        if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
            return `El campo **${fieldName}** es obligatorio.`;
        }
        
        // Validación para select/combobox (cuando el value es una cadena vacía)
        if (rules.customValidator) {
            const error = rules.customValidator(value);
            if (error) return error;
        }

        if (value && typeof value === 'string') {
            if (rules.minLength && value.length < rules.minLength) {
                return `**${fieldName}** debe tener al menos ${rules.minLength} caracteres.`;
            }

            if (rules.maxLength && value.length > rules.maxLength) {
                return `**${fieldName}** no puede exceder ${rules.maxLength} caracteres.`;
            }

            if (rules.strictLength && value.length !== rules.strictLength) {
                return `**${fieldName}** debe tener exactamente ${rules.strictLength} caracteres.`;
            }

            if (rules.pattern && !rules.pattern.test(value)) {
                return rules.patternMessage || `El formato de **${fieldName}** es inválido.`;
            }
        }
        
        return null;
    };

    // --- Carga de Combobox ---

    /**
     * Carga el combobox de tipos de vehículo.
     */
    const cargarTiposVehiculo = async () => {
        try {
            // Endpoint basado en VehicleTypeController.java
            const url = `${API_BASE_URL}/api/vehicleTypes/getAllVehiclesTypes`; 
            const response = await fetch(url);
            
            if (!response.ok) {
                const apiResponse = await response.json();
                throw new Error(apiResponse.message || `Error ${response.status} al cargar tipos de vehículo.`);
            }

            const apiResponse = await response.json();
            // Asumiendo que el cuerpo de respuesta es un ApiResponse con 'data' siendo List<VehicleTypeDTO>
            const tipos = apiResponse.data; 

            tipoVehiculoSelect.innerHTML = '<option value="">Seleccione un tipo</option>';
            if (tipos && Array.isArray(tipos)) {
                tipos.forEach(tipo => {
                    const option = document.createElement("option");
                    // Asumiendo TypeId y TypeName en VehicleTypeDTO
                    option.value = tipo.typeId; 
                    option.textContent = tipo.typeName;
                    tipoVehiculoSelect.appendChild(option);
                });
            } else {
                mostrarAlerta("Advertencia", "No se encontraron tipos de vehículo para cargar.", "warning");
            }
        } catch (error) {
            console.error("Error al cargar tipos de vehículo:", error);
            mostrarAlerta("Error", "Fallo al obtener la lista de tipos de vehículo: " + error.message, "error");
            tipoVehiculoSelect.innerHTML = '<option value="">Error al cargar</option>';
        }
    };

    /**
     * Carga el combobox de estudiantes.
     */
    const cargarEstudiantes = async () => {
        try {
            // **NOTA:** El endpoint es asumido basado en el contexto de tu API.
            const url = `${API_BASE_URL}/api/students/getAllStudents`;
            const response = await fetch(url);
            
            if (!response.ok) {
                const apiResponse = await response.json();
                throw new Error(apiResponse.message || `Error ${response.status} al cargar estudiantes.`);
            }

            const apiResponse = await response.json();
            // Asumiendo que el cuerpo de respuesta es un ApiResponse con 'data' siendo List<StudentDTO>
            const estudiantes = apiResponse.data; 

            estudianteSelect.innerHTML = '<option value="">Seleccione un estudiante</option>';
            if (estudiantes && Array.isArray(estudiantes)) {
                estudiantes.forEach(estudiante => {
                    const option = document.createElement("option");
                    // Asumiendo studentId, firstName y lastName en StudentDTO
                    option.value = estudiante.studentId; 
                    option.textContent = `${estudiante.firstName} ${estudiante.lastName}`;
                    estudianteSelect.appendChild(option);
                });
            } else {
                mostrarAlerta("Advertencia", "No se encontraron estudiantes para asignar.", "warning");
            }

        } catch (error) {
            console.error("Error al cargar estudiantes:", error);
            mostrarAlerta("Error", "Fallo al obtener la lista de estudiantes: " + error.message, "error");
            estudianteSelect.innerHTML = '<option value="">Error al cargar</option>';
        }
    };

    // Inicializar la carga de los combobox
    cargarEstudiantes();
    cargarTiposVehiculo();

    // --- Reglas de Validación ---

    // Reglas basadas en las anotaciones de VehicleDTO.java
    const reglasValidacion = {
        placa: { 
            name: "Placa", 
            required: true, 
            maxLength: 10, 
            pattern: /^[A-Z]{1,3}[0-9]{3,4}$/, 
            patternMessage: "Formato de placa inválido (ej: ABC1234).",
            // Nota: El HTML dice P123-456, pero el DTO usa ABC1234
        },
        poliza: { 
            name: "N° de Póliza", 
            required: false, // Condicional
            minLength: 8, 
            maxLength: 15 
        },
        marca: { 
            name: "Marca", 
            required: true, 
            minLength: 3, 
            maxLength: 50 
        },
        modelo: { 
            name: "Modelo", 
            required: true, 
            minLength: 3, 
            maxLength: 50 
        },
        tipo: { 
            name: "Tipo de Vehículo", 
            required: true,
            customValidator: (value) => value ? null : "Debe seleccionar un tipo de vehículo."
        },
        color: { 
            name: "Color", 
            required: true, 
            minLength: 4, 
            maxLength: 30 
        },
        tarjetaCirculacion: { 
            name: "Tarjeta de Circulación", 
            required: true, 
            strictLength: 20, // Strictamente 20 caracteres según DTO.java
            patternMessage: "El número debe tener exactamente 20 caracteres. Revise el DTO."
            // Nota: El HTML muestra un ejemplo de 10 caracteres, pero el DTO exige 20.
        },
        dueñoVehiculo: { 
            name: "Nombre del Propietario", 
            required: true, 
            minLength: 5, 
            maxLength: 100 
        },
        duiDueño: { 
            name: "DUI del Propietario", 
            required: true, 
            strictLength: 10, 
            pattern: /^[0-9]{8}-[0-9]$/, 
            patternMessage: "El formato del DUI es inválido (ej: 12345678-9)." 
        },
        telDueño: { 
            name: "Teléfono del Propietario", 
            required: true, 
            minLength: 8, 
            maxLength: 10, 
            pattern: /^\d{4}-\d{4}$/, // Asumiendo formato 0000-0000
            patternMessage: "El formato del teléfono es inválido (ej: 0000-0000)."
        },
        foto1: {
            name: "Foto del Vehículo",
            required: true,
            customValidator: (file) => file ? null : "Debe subir al menos una foto (Foto 1).",
        },
        estudianteAsignado: {
            name: "Estudiante Asignado",
            required: true,
            customValidator: (value) => value ? null : "Debe seleccionar un estudiante."
        },
        aceptarTerminos: { 
            name: "Términos y Condiciones",
            required: true, 
            customValidator: (checked) => checked ? null : "Debe aceptar los términos y condiciones de servicio."
        }
    };


    // --- Validación y Mapeo del Formulario ---

    const validarFormularioYRecopilarDatos = () => {
        let errores = [];
        
        // --- Recolección de valores ---
        const placa = document.getElementById("placa").value.toUpperCase().trim();
        const poliza = polizaInput.value.trim();
        const tienePoliza = polizaCheckbox.checked;
        const marca = document.getElementById("marca").value.trim();
        const modelo = document.getElementById("modelo").value.trim();
        const tipoId = tipoVehiculoSelect.value;
        const color = document.getElementById("color").value.trim();
        const tarjetaCirculacion = document.getElementById("tarjetaCirculacion").value.trim();
        const mantenimientoExpo = document.getElementById("mantenimientoExpo").checked;
        const studentId = estudianteSelect.value;
        const fotoFile = fotoInput.files[0];
        const ownerName = document.getElementById("dueñoVehiculo").value.trim();
        const ownerDui = document.getElementById("duiDueño").value.trim();
        const ownerPhone = document.getElementById("telDueño").value.trim();
        const aceptarTerminos = document.getElementById("aceptarTerminos").checked;

        // --- Ejecución de Validaciones ---

        errores.push(validarCampo('placa', placa, reglasValidacion.placa));

        // Validación condicional de póliza
        if (tienePoliza) {
             errores.push(validarCampo('poliza', poliza, { ...reglasValidacion.poliza, required: true }));
        }

        errores.push(validarCampo('marca', marca, reglasValidacion.marca));
        errores.push(validarCampo('modelo', modelo, reglasValidacion.modelo));
        errores.push(validarCampo('tipo', tipoId, reglasValidacion.tipo));
        errores.push(validarCampo('color', color, reglasValidacion.color));
        errores.push(validarCampo('tarjetaCirculacion', tarjetaCirculacion, reglasValidacion.tarjetaCirculacion));
        errores.push(validarCampo('estudianteAsignado', studentId, reglasValidacion.estudianteAsignado));
        errores.push(validarCampo('dueñoVehiculo', ownerName, reglasValidacion.dueñoVehiculo));
        errores.push(validarCampo('duiDueño', ownerDui, reglasValidacion.duiDueño));
        errores.push(validarCampo('telDueño', ownerPhone, reglasValidacion.telDueño));
        errores.push(validarCampo('aceptarTerminos', aceptarTerminos, reglasValidacion.aceptarTerminos));

        // Validación básica de imagen (sin subida aún)
        if (!fotoFile) {
            errores.push('La imagen del vehículo es obligatoria.');
        }

        // Filtrar errores nulos y unir
        const erroresFinales = errores.filter(e => e !== null);

        if (erroresFinales.length > 0) {
            mostrarAlerta("Error de Validación", erroresFinales.join("<br>"), "error");
            return null;
        }

        // --- Mapeo a DTO (Listo para ser completado con URL de imagen) ---
        return {
            plateNumber: placa,
            hasPolicy: tienePoliza ? 1 : 0, // Mapeo a Long
            policyNumber: tienePoliza ? poliza : null, 
            brand: marca,
            model: modelo,
            typeId: parseInt(tipoId), // Mapeo a Long
            color: color,
            circulationCardNumber: tarjetaCirculacion,
            ownerName: ownerName,
            ownerDui: ownerDui,
            ownerPhone: ownerPhone,
            vehicleImage: null, // Se llenará con la URL de Cloudinary
            studentId: parseInt(studentId), // Mapeo a Long
            maintenanceEXPO: mantenimientoExpo ? 1 : 0, // Mapeo a Long
            idStatus: 1 // Estado inicial (ej: Activo)
        };
    };

    // --- Subida de Imagen a Cloudinary ---

    async function subirImagen(archivo) {
      // Subida de imagen a Cloudinary usando el endpoint backend
      const fd = new FormData();
      fd.append('image', archivo);
      fd.append('folder', 'vehicles');
      try {//CAMBIAR
        const res = await fetch('https://sgma-66ec41075156.herokuapp.com/api/images/upload-to-folder', {
          method: 'POST',
          credentials: 'include',
          body: fd
        });
        const obj = await res.json();
        if (obj.url) {
          return obj.url;
        } else {
          throw new Error('URL de imagen no encontrada en la respuesta de Cloudinary.');
        }
      } catch (error) {
        console.error('Error al subir imagen:', error);
        Swal.fire({
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

    // --- Registro Final del Vehículo ---

    /**
     * Envía el DTO al endpoint de la API.
     * @param {object} vehicleDTO Objeto con los datos del vehículo a registrar.
     */
    const registrarVehiculo = async (vehicleDTO) => {
        try {
            const url = `${API_BASE_URL}/api/vehicles/newVehicle`; // Endpoint de registro
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(vehicleDTO),
            });

            const apiResponse = await response.json();

            if (!response.ok) {
                // Errores HTTP (4xx, 5xx) o excepciones lanzadas por el Controller (ExceptionVehicleDontInsert)
                const errorMessage = apiResponse.message || "Error desconocido al registrar el vehículo.";
                mostrarAlerta("Error de Registro", errorMessage, "error");
                return false;
            }

            // Registro exitoso (200 OK)
            mostrarAlerta("¡Registro Exitoso! 🎉", "El vehículo ha sido registrado correctamente. Puede avanzar al siguiente paso.", "success")
                .then(() => {
                    // Opcional: limpiar el formulario y avanzar
                    document.querySelector('form').reset();
                    document.getElementById("vista-previa-1").style.display = 'none';
                    // Llamar a la función del breadcrumb (definida en el HTML)
                    if (typeof updateBreadcrumb === 'function') {
                        updateBreadcrumb(1); 
                    }
                });
            return true;

        } catch (error) {
            console.error("Error al enviar la solicitud:", error);
            mostrarAlerta("Error de Conexión", "No se pudo conectar con el servidor para registrar el vehículo.", "error");
            return false;
        }
    };


    // --- Event Listener Principal (Orquestador) ---

    botonEnviar.addEventListener("click", async () => {
        // 1. Validar campos
        const vehicleDTO = validarFormularioYRecopilarDatos();
        
        if (!vehicleDTO) {
            return; // Detener si hay errores de validación
        }

        // Mostrar alerta de carga
        Swal.fire({
            title: 'Subiendo y Registrando...',
            text: 'Por favor, espere mientras se procesa la solicitud.',
            icon: 'info',
            allowOutsideClick: false,
            showConfirmButton: false,
            willOpen: () => {
                Swal.showLoading();
            }
        });
        
        // 2. Manejo de imagen del vehículo (similar al patrón de instructor)
        let vehicleImage = '';
        if (fotoInput.files.length > 0) {
            const nuevaUrlFoto = await subirImagen(fotoInput.files[0]);
            if (nuevaUrlFoto) {
                vehicleImage = nuevaUrlFoto;
            } else {
                Swal.close();
                mostrarAlerta("Error de Imagen", "No se pudo subir la imagen del vehículo.", "error");
                return;
            }
        }
        
        if (!vehicleImage) {
            Swal.close();
            mostrarAlerta("Error de Imagen", "La imagen del vehículo es obligatoria.", "error");
            return;
        }

        // 3. Llenar DTO con URL y registrar
        vehicleDTO.vehicleImage = vehicleImage; // Asignar la URL de Cloudinary
        
        const registroExitoso = await registrarVehiculo(vehicleDTO);

        if (registroExitoso) {
            // SweetAlert ya fue mostrado por registrarVehiculo en caso de éxito
        } else {
            Swal.close(); // Asegurar el cierre si el registro falló después de la subida
        }
    });

    // --- Lógica Adicional (Enabling/Disabling inputs y Preview de Foto) ---

    // 1. Manejo de la des/habilitación de campos Poliza
    // **NOTA DE CORRECCIÓN:** Se anula la lógica incorrecta del HTML inline que deshabilitaba la placa. 
    // Solo la póliza debe ser opcional.
    function actualizarCamposPoliza() {
        polizaInput.disabled = !polizaCheckbox.checked;
        if (!polizaCheckbox.checked) {
            polizaInput.value = ""; // Limpiar si se deshabilita
        }
    }
    
    // Inicializar estado para el input de póliza
    actualizarCamposPoliza();

    polizaCheckbox.addEventListener("change", actualizarCamposPoliza);

    // 2. Vista previa de la foto
    const vistaPrevia = document.getElementById("vista-previa-1");

    fotoInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                vistaPrevia.src = e.target.result;
                vistaPrevia.style.display = 'block';
            }
            reader.readAsDataURL(this.files[0]);
        } else {
            vistaPrevia.style.display = 'none';
        }
    });
});