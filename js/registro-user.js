document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos
    const form = document.getElementById('registro-form');
    const correoInput = document.getElementById('correo');
    const correoError = document.getElementById('correo-error');
    const gradoTrigger = document.getElementById('grado-custom-trigger');
    const gradoOptions = document.getElementById('grado-custom-options');
    const gradoSelect = document.getElementById('grado');
    const selectedGradoText = document.getElementById('selected-grado-text');

    // 1. Cargar años desde la API y llenar el combobox
    fetch('https://sgma-66ec41075156.herokuapp.com/api/grades/getAllGrades')
        .then(res => res.json())
        .then(data => {
            // Suponiendo que data es un array de objetos con propiedad 'year'
            const years = [...new Set(data.map(e => e.year))].filter(Boolean);
            gradoOptions.innerHTML = '';
            gradoSelect.innerHTML = '<option value="" selected>Selecciona tu año</option>';
            years.forEach(year => {
                // Opciones personalizadas
                const div = document.createElement('div');
                div.className = 'opcion-personalizada';
                div.dataset.value = year;
                div.textContent = year;
                gradoOptions.appendChild(div);
                // Opciones del select oculto
                const opt = document.createElement('option');
                opt.value = year;
                opt.textContent = year;
                gradoSelect.appendChild(opt);
            });
        });

    // 2. Lógica del selector personalizado
    gradoTrigger.addEventListener('click', () => {
        gradoOptions.classList.toggle('open');
        gradoTrigger.classList.toggle('active');
    });

    gradoOptions.addEventListener('click', (e) => {
        if (e.target.classList.contains('opcion-personalizada')) {
            // Marcar seleccionada
            gradoOptions.querySelectorAll('.opcion-personalizada').forEach(opt => opt.classList.remove('selected'));
            e.target.classList.add('selected');
            selectedGradoText.textContent = e.target.textContent;
            gradoSelect.value = e.target.dataset.value;
            gradoOptions.classList.remove('open');
            gradoTrigger.classList.remove('active');
        }
    });

    document.addEventListener('click', (e) => {
        if (!gradoTrigger.contains(e.target) && !gradoOptions.contains(e.target)) {
            gradoOptions.classList.remove('open');
            gradoTrigger.classList.remove('active');
        }
    });

    // 3. Validación de correo institucional
    correoInput.addEventListener('input', () => {
        if (!correoInput.value.endsWith('@ricaldone.edu.sv')) {
            correoError.textContent = 'El correo debe ser institucional (@ricaldone.edu.sv)';
        } else {
            correoError.textContent = '';
        }
    });

    // 4. Envío del formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validaciones básicas
        if (!correoInput.value.endsWith('@ricaldone.edu.sv')) {
            correoError.textContent = 'El correo debe ser institucional (@ricaldone.edu.sv)';
            return;
        }
        if (!gradoSelect.value) {
            Swal.fire('Error', 'Selecciona tu año.', 'error');
            return;
        }

        // Construir el objeto estudiante
        const estudiante = {
            nombres: document.getElementById('nombres').value.trim(),
            apellidos: document.getElementById('apellidos').value.trim(),
            correo: correoInput.value.trim(),
            password: document.getElementById('password').value,
            year: gradoSelect.value
        };

        // Enviar a la API
        try {
            const res = await fetch('https://sgma-66ec41075156.herokuapp.com/api/students/addNewStudent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(estudiante)
            });
            const result = await res.json();
            if (res.ok) {
                Swal.fire('¡Registro exitoso!', 'El estudiante ha sido registrado.', 'success')
                    .then(() => window.location.href = 'login.html');
            } else {
                Swal.fire('Error', result.message || 'No se pudo registrar el estudiante.', 'error');
            }
        } catch (err) {
            Swal.fire('Error', 'No se pudo conectar con el servidor.', 'error');
        }
    });
});