// Controlador para Órdenes de Trabajo
import {me} from '../services/authServiceStudents.js';

class OrdenesTrabajoController {
    constructor() {
        this.user = null;
        this.vehicles = [];
        this.workOrders = [];
        this.filteredOrders = [];
        this.modules = [];
        this.modal = null;
        this.form = null;
        // Propiedades de paginación para órdenes
        this.currentPage = 1;
        this.ordersPerPage = 4;
        this.totalOrders = 0;
        // Propiedades de búsqueda
        this.searchTerm = '';
        this.searchInput = null;
        // Propiedades de paginación para vehículos
        this.currentVehiclePage = 1;
        this.vehiclesPerPage = 3;
        this.totalVehicles = 0;
        this.filteredVehicles = [];
    }

    async init() {
        try {
            await this.initializeAuth();
            this.initializeElements();
            this.bindEvents();
            await this.loadUserVehicles();
            await this.loadModules();
            await this.loadWorkOrders(); // Cargar órdenes de trabajo del estudiante
        } catch (error) {
            console.error('Error inicializando la aplicación:', error);
            this.showError('Error al cargar la aplicación');
        }
    }

    async initializeAuth() {
        try {
            this.user = await me();
            if (!this.user || !this.user.student) {
                throw new Error('Usuario no autenticado');
            }
        } catch (error) {
            console.error('Error de autenticación:', error);
            window.location.href = 'loginEstudiante.html';
            throw error;
        }
    }

    initializeElements() {
        this.modal = document.getElementById('modal-nueva-orden');
        this.form = document.getElementById('form-nueva-orden');
        this.vehiculoSelect = document.getElementById('vehiculo-select');
        this.moduloSelect = document.getElementById('modulo-select');
        this.listaVehiculos = document.getElementById('lista-vehiculos');
        this.listaOrdenes = document.getElementById('lista-ordenes');
        
        // Previsualización de imagen
        this.imagenInput = document.getElementById('imagen-trabajo');
        this.vistaPrevia = document.getElementById('vista-previa-imagen');
        
        // Buscador
        this.searchInput = document.getElementById('search-orders');
    }

    bindEvents() {
        // Botón nueva orden
        document.getElementById('btn-nueva-orden').addEventListener('click', () => {
            this.openModal();
        });

        // Cerrar modal
        document.getElementById('btn-cerrar-modal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('btn-cancelar-orden').addEventListener('click', () => {
            this.closeModal();
        });

        // Click fuera del modal
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });

        // Submit del formulario
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCreateWorkOrder();
        });

        // Botón específico de crear orden
        document.getElementById('btn-crear-orden').addEventListener('click', (e) => {
            e.preventDefault();
            this.handleCreateWorkOrder();
        });

        // Previsualización de imagen
        this.imagenInput.addEventListener('change', (e) => {
            this.handleImagePreview(e);
        });

        // Buscador de órdenes
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase().trim();
                this.currentPage = 1; // Resetear a primera página
                this.filterAndDisplayOrders();
            });
        }
    }

    async loadUserVehicles() {
        try {
            const response = await fetch(`https://sgma-66ec41075156.herokuapp.com/api/vehicles/getVehiclesByStudentId/${this.user.student.id}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Respuesta completa:', data);

            // Extraer vehículos según la estructura real del API
            let vehicles = [];
            
            if (data.success && data.data && data.data.vehiculos) {
                vehicles = data.data.vehiculos;
            }

            console.log('Vehículos extraídos:', vehicles);
            
            this.vehicles = vehicles;
            this.filteredVehicles = [...vehicles];
            this.displayVehicles();
            this.populateVehicleSelect(vehicles);

        } catch (error) {
            console.error('Error al cargar vehículos:', error);
            this.showError('Error al cargar los vehículos');
            this.displayVehicles();
        }
    }

    displayVehicles() {
        this.totalVehicles = this.filteredVehicles.length;

        if (this.filteredVehicles.length === 0) {
            this.listaVehiculos.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-car"></i>
                    <h3>No tienes vehículos registrados</h3>
                    <p>Para crear una orden de trabajo, primero debes registrar un vehículo.</p>
                    <a href="registro-auto.html" class="botones primario" style="margin-top: 15px; display: inline-block; text-decoration: none;">
                        <i class="fas fa-plus"></i>
                        Registrar Vehículo
                    </a>
                </div>
            `;
            return;
        }

        // Calcular paginación para vehículos
        const totalPages = Math.ceil(this.totalVehicles / this.vehiclesPerPage);
        const startIndex = (this.currentVehiclePage - 1) * this.vehiclesPerPage;
        const endIndex = startIndex + this.vehiclesPerPage;
        const paginatedVehicles = this.filteredVehicles.slice(startIndex, endIndex);

        // Generar HTML de los vehículos
        const vehiculosHTML = paginatedVehicles.map(vehicle => {
            console.log('Procesando vehículo:', vehicle);
            
            const placa = vehicle.plateNumber || 'Sin placa';
            const marca = vehicle.brand || 'Sin marca';
            const modelo = vehicle.model || 'Sin modelo';
            const tipo = vehicle.typeName || 'N/A';
            const color = vehicle.color || 'N/A';
            const tarjeta = vehicle.circulationCardNumber || 'N/A';
            const expo = vehicle.maintenanceEXPO === 1;
            
            // Obtener estado del vehículo
            const statusText = this.getVehicleStatusText(vehicle.idStatus);
            const statusClass = this.getVehicleStatusClass(vehicle.idStatus);
            
            return `
                <div class="vehiculo-card" data-id="${vehicle.vehicleId}">
                    ${vehicle.vehicleImage ? `
                        <div class="vehiculo-imagen">
                            <img src="${vehicle.vehicleImage}" alt="${placa}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                            <div class="vehiculo-icon-fallback" style="display: none;">
                                <i class="fas fa-car"></i>
                            </div>
                        </div>
                    ` : `
                        <div class="vehiculo-imagen">
                            <div class="vehiculo-icon-fallback">
                                <i class="fas fa-car"></i>
                            </div>
                        </div>
                    `}
                    <div class="vehiculo-info">
                        <div class="vehiculo-principal">
                            <div class="vehiculo-datos">
                                <h3>${placa}</h3>
                                <p>${marca} ${modelo}</p>
                            </div>
                        </div>
                        <div class="vehiculo-estado ${statusClass}">
                            ${statusText}
                        </div>
                    </div>
                    <div class="vehiculo-detalles">
                        <div><strong>Tipo:</strong> ${tipo}</div>
                        <div><strong>Color:</strong> ${color}</div>
                        <div><strong>Tarjeta:</strong> ${tarjeta}</div>
                        <div><strong>Expo:</strong> ${expo ? 'Sí' : 'No'}</div>
                    </div>
                </div>
            `;
        }).join('');

        // Generar HTML de paginación para vehículos
        const vehiclePaginationHTML = this.createVehiclePaginationHTML(totalPages);
        
        // Mostrar vehículos y paginación
        this.listaVehiculos.innerHTML = vehiculosHTML + vehiclePaginationHTML;
        
        // Agregar event listeners para paginación de vehículos
        this.bindVehiclePaginationEvents();
    }

    createVehiclePaginationHTML(totalPages) {
        if (totalPages <= 1) return '';

        const startItem = (this.currentVehiclePage - 1) * this.vehiclesPerPage + 1;
        const endItem = Math.min(this.currentVehiclePage * this.vehiclesPerPage, this.totalVehicles);

        let paginationHTML = `
            <div class="vehicle-pagination-container">
                <button class="pagination-button" id="prev-vehicle-page" ${this.currentVehiclePage === 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i>
                    Anterior
                </button>
                
                <div class="pagination-numbers">
        `;

        // Generar números de página
        const startPage = Math.max(1, this.currentVehiclePage - 2);
        const endPage = Math.min(totalPages, this.currentVehiclePage + 2);

        if (startPage > 1) {
            paginationHTML += `<span class="page-number" data-vehicle-page="1">1</span>`;
            if (startPage > 2) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `<span class="page-number ${i === this.currentVehiclePage ? 'active' : ''}" data-vehicle-page="${i}">${i}</span>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
            paginationHTML += `<span class="page-number" data-vehicle-page="${totalPages}">${totalPages}</span>`;
        }

        paginationHTML += `
                </div>
                
                <button class="pagination-button" id="next-vehicle-page" ${this.currentVehiclePage === totalPages ? 'disabled' : ''}>
                    Siguiente
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            
            <div class="pagination-info">
                Mostrando ${startItem}-${endItem} de ${this.totalVehicles} vehículos
            </div>
        `;

        return paginationHTML;
    }

    bindVehiclePaginationEvents() {
        // Botón anterior para vehículos
        const prevVehicleBtn = document.getElementById('prev-vehicle-page');
        if (prevVehicleBtn) {
            prevVehicleBtn.addEventListener('click', () => {
                if (this.currentVehiclePage > 1) {
                    this.currentVehiclePage--;
                    this.displayVehicles();
                }
            });
        }

        // Botón siguiente para vehículos
        const nextVehicleBtn = document.getElementById('next-vehicle-page');
        if (nextVehicleBtn) {
            nextVehicleBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(this.totalVehicles / this.vehiclesPerPage);
                if (this.currentVehiclePage < totalPages) {
                    this.currentVehiclePage++;
                    this.displayVehicles();
                }
            });
        }

        // Números de página para vehículos
        const vehiclePageNumbers = document.querySelectorAll('[data-vehicle-page]');
        vehiclePageNumbers.forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.vehiclePage);
                if (page !== this.currentVehiclePage) {
                    this.currentVehiclePage = page;
                    this.displayVehicles();
                }
            });
        });
    }

    async loadModules() {
        try {
            const response = await fetch('https://sgma-66ec41075156.herokuapp.com/api/modules/getAllModules', {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Respuesta de módulos:', data);

            // Extraer módulos según la estructura del API
            let modules = [];
            
            if (data.success && data.data && data.data.content) {
                modules = data.data.content;
            }

            console.log('Módulos extraídos:', modules);
            this.modules = modules;
            this.populateModuleSelect(modules);

        } catch (error) {
            console.error('Error al cargar módulos:', error);
            this.showError('Error al cargar los módulos');
            this.populateModuleSelect([]);
        }
    }

    populateModuleSelect(modules) {
        if (!Array.isArray(modules)) {
            modules = [];
        }

        console.log('Poblando select con módulos:', modules);

        this.moduloSelect.innerHTML = '<option value="">Seleccione un módulo...</option>';
        
        if (modules.length === 0) {
            this.moduloSelect.innerHTML += '<option value="" disabled>No hay módulos disponibles</option>';
            return;
        }
        
        modules.forEach(module => {
            console.log('Agregando módulo al select:', module);
            const option = document.createElement('option');
            option.value = module.moduleId;
            
            const codigo = module.moduleCode || '';
            const nombre = module.moduleName || 'Sin nombre';
            const nivel = module.levelName || '';
            
            option.textContent = `${codigo} - ${nombre} (${nivel})`.trim();
            this.moduloSelect.appendChild(option);
        });
    }

    populateVehicleSelect(vehicles) {
        if (!Array.isArray(vehicles)) {
            vehicles = [];
        }

        console.log('Poblando select con vehículos (todos):', vehicles);

        // Filtrar solo vehículos aprobados (idStatus = 1)
        const approvedVehicles = vehicles.filter(vehicle => vehicle.idStatus === 3);
        console.log('Vehículos aprobados (idStatus = 3):', approvedVehicles);

        this.vehiculoSelect.innerHTML = '<option value="">Seleccione un vehículo...</option>';
        
        if (approvedVehicles.length === 0) {
            this.vehiculoSelect.innerHTML += '<option value="" disabled>No hay vehículos aprobados disponibles</option>';
            console.log('No hay vehículos aprobados para mostrar en el select');
            return;
        }
        
        approvedVehicles.forEach(vehicle => {
            console.log('Agregando vehículo aprobado al select:', vehicle);
            const option = document.createElement('option');
            option.value = vehicle.vehicleId;
            
            const placa = vehicle.plateNumber || 'Sin placa';
            const marca = vehicle.brand || '';
            const modelo = vehicle.model || '';
            
            option.textContent = `${placa} - ${marca} ${modelo}`.trim();
            this.vehiculoSelect.appendChild(option);
        });
    }

    async loadWorkOrders() {
        try {
            console.log('Cargando órdenes de trabajo del estudiante:', this.user.student.id);
            
            const response = await fetch(`https://sgma-66ec41075156.herokuapp.com/api/workOrders/getWorkOrdersByStudentId/${this.user.student.id}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Respuesta completa de órdenes de trabajo:', data);

            // Extraer órdenes según la estructura del API
            let orders = [];
            if (data.workOrders && Array.isArray(data.workOrders)) {
                orders = data.workOrders;
            }

            console.log('Órdenes extraídas del API:', orders);
            console.log('Cantidad total de órdenes:', orders.length);
            
            // Mostrar todas las órdenes y sus estados para debug
            orders.forEach(order => {
                console.log(`Orden ${order.workOrderId}: Estado ${order.idStatus} (${this.getStatusText(order.idStatus)})`);
            });
            
            this.displayWorkOrders(orders);

        } catch (error) {
            console.error('Error al cargar órdenes de trabajo:', error);
            this.showError('Error al cargar las órdenes de trabajo');
            // Mostrar mensaje de error en lugar de array vacío
            if (this.listaOrdenes) {
                this.listaOrdenes.innerHTML = `
                    <div class="empty-orders-modern">
                        <i class="fas fa-exclamation-triangle" style="color: #f44336;"></i>
                        <h3>Error al cargar órdenes</h3>
                        <p>No se pudieron cargar las órdenes de trabajo. Por favor, intenta recargar la página.</p>
                        <button onclick="location.reload()" class="clear-search-button">
                            <i class="fas fa-refresh"></i>
                            Recargar
                        </button>
                    </div>
                `;
            }
        }
    }

    displayWorkOrders(orders) {
        console.log('displayWorkOrders llamado con:', orders);
        console.log('Cantidad de órdenes recibidas:', orders.length);
        
        // Filtrar solo órdenes en proceso de aprobación (1,2) o aprobadas en progreso (3)
        const filteredByStatus = orders.filter(order => [1, 2, 3].includes(order.idStatus));
        console.log('Órdenes filtradas por estado (1,2,3):', filteredByStatus);
        console.log('Cantidad de órdenes filtradas:', filteredByStatus.length);
        
        this.workOrders = filteredByStatus;
        this.filterAndDisplayOrders();
    }

    filterAndDisplayOrders() {
        console.log('filterAndDisplayOrders llamado');
        console.log('workOrders:', this.workOrders);
        console.log('searchTerm:', this.searchTerm);
        
        // Verificar que el elemento listaOrdenes existe
        if (!this.listaOrdenes) {
            console.error('Elemento lista-ordenes no encontrado');
            return;
        }

        // Filtrar órdenes según el término de búsqueda
        if (this.searchTerm === '') {
            this.filteredOrders = [...this.workOrders];
        } else {
            this.filteredOrders = this.workOrders.filter(order => {
                const vehiclePlate = (order.vehiclePlateNumber || '').toLowerCase();
                const moduleName = (order.moduleName || '').toLowerCase();
                const orderNumber = order.workOrderId.toString();
                const description = (order.description || '').toLowerCase();
                
                return vehiclePlate.includes(this.searchTerm) ||
                       moduleName.includes(this.searchTerm) ||
                       orderNumber.includes(this.searchTerm) ||
                       description.includes(this.searchTerm);
            });
        }

        console.log('Órdenes después del filtro de búsqueda:', this.filteredOrders);
        this.totalOrders = this.filteredOrders.length;

        if (this.filteredOrders.length === 0) {
            console.log('No hay órdenes para mostrar');
            if (this.searchTerm === '') {
                this.listaOrdenes.innerHTML = `
                    <div class="empty-orders-modern">
                        <i class="fas fa-clipboard-list"></i>
                        <h3>No tienes órdenes de trabajo activas</h3>
                        <p>Las órdenes de trabajo aparecerán aquí cuando estén en proceso de aprobación o aprobadas para trabajar.</p>
                    </div>
                `;
            } else {
                this.listaOrdenes.innerHTML = `
                    <div class="empty-orders-modern">
                        <i class="fas fa-search"></i>
                        <h3>No se encontraron resultados</h3>
                        <p>No hay órdenes que coincidan con "${this.searchTerm}"</p>
                        <button onclick="document.getElementById('search-orders').value=''; document.getElementById('search-orders').dispatchEvent(new Event('input'))" class="clear-search-button">
                            <i class="fas fa-times"></i>
                            Limpiar búsqueda
                        </button>
                    </div>
                `;
            }
            return;
        }

        // Calcular paginación
        const totalPages = Math.ceil(this.totalOrders / this.ordersPerPage);
        const startIndex = (this.currentPage - 1) * this.ordersPerPage;
        const endIndex = startIndex + this.ordersPerPage;
        const paginatedOrders = this.filteredOrders.slice(startIndex, endIndex);

        console.log('Órdenes paginadas a mostrar:', paginatedOrders);

        // Generar HTML de las órdenes
        const ordenesHTML = paginatedOrders.map(order => this.createModernWorkOrderCard(order)).join('');
        
        // Generar HTML de paginación
        const paginationHTML = this.createPaginationHTML(totalPages);
        
        console.log('HTML generado para órdenes:', ordenesHTML);
        
        // Mostrar órdenes y paginación
        this.listaOrdenes.innerHTML = ordenesHTML + paginationHTML;
        
        // Agregar event listeners para paginación
        this.bindPaginationEvents();
    }

    createPaginationHTML(totalPages) {
        if (totalPages <= 1) return '';

        const startItem = (this.currentPage - 1) * this.ordersPerPage + 1;
        const endItem = Math.min(this.currentPage * this.ordersPerPage, this.totalOrders);

        let paginationHTML = `
            <div class="pagination-container">
                <button class="pagination-button" id="prev-page" ${this.currentPage === 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i>
                    Anterior
                </button>
                
                <div class="pagination-numbers">
        `;

        // Generar números de página
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        if (startPage > 1) {
            paginationHTML += `<span class="page-number" data-page="1">1</span>`;
            if (startPage > 2) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `<span class="page-number ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</span>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
            paginationHTML += `<span class="page-number" data-page="${totalPages}">${totalPages}</span>`;
        }

        paginationHTML += `
                </div>
                
                <button class="pagination-button" id="next-page" ${this.currentPage === totalPages ? 'disabled' : ''}>
                    Siguiente
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            
            <div class="pagination-info">
                ${this.searchTerm ? `Mostrando ${startItem}-${endItem} de ${this.totalOrders} resultados para "${this.searchTerm}"` : `Mostrando ${startItem}-${endItem} de ${this.totalOrders} órdenes`}
            </div>
        `;

        return paginationHTML;
    }

    bindPaginationEvents() {
        // Botón anterior
        const prevBtn = document.getElementById('prev-page');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.filterAndDisplayOrders();
                }
            });
        }

        // Botón siguiente
        const nextBtn = document.getElementById('next-page');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(this.totalOrders / this.ordersPerPage);
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.filterAndDisplayOrders();
                }
            });
        }

        // Números de página
        const pageNumbers = document.querySelectorAll('.page-number');
        pageNumbers.forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                if (page !== this.currentPage) {
                    this.currentPage = page;
                    this.filterAndDisplayOrders();
                }
            });
        });
    }

    createModernWorkOrderCard(order) {
        const statusText = this.getStatusText(order.idStatus);
        const statusClass = this.getStatusClass(order.idStatus);
        
        const vehiclePlate = order.vehiclePlateNumber || 'Sin placa';
        const moduleName = order.moduleName || 'Sin módulo';
        const estimatedTime = order.estimatedTime || 'No especificado';
        const description = order.description || '';
        const hasImage = order.workOrderImage && 
                         order.workOrderImage !== 'sin_imagen' && 
                         order.workOrderImage !== null && 
                         order.workOrderImage.trim() !== '';

        return `
            <div class="work-order-card">
                <div class="work-order-header">
                    <div class="order-title-row">
                        <div class="order-number">
                            <i class="fas fa-hashtag"></i>
                            Orden ${order.workOrderId}
                        </div>
                        <div class="order-status-modern status-${statusClass}-modern">
                            ${statusText}
                        </div>
                    </div>
                    <div class="vehicle-info-modern">
                        <i class="fas fa-car"></i>
                        <span>${vehiclePlate}</span>
                    </div>
                </div>

                <div class="work-order-content">
                    <div class="info-grid-modern">
                        <div class="info-item-modern">
                            <div class="info-label-modern">
                                <i class="fas fa-book"></i>
                                Módulo
                            </div>
                            <div class="info-value-modern">${moduleName}</div>
                        </div>
                        <div class="info-item-modern">
                            <div class="info-label-modern">
                                <i class="fas fa-clock"></i>
                                Tiempo Estimado
                            </div>
                            <div class="info-value-modern">${estimatedTime} ${estimatedTime !== 'No especificado' ? 'horas' : ''}</div>
                        </div>
                    </div>

                    ${description ? `
                        <div class="description-section-modern">
                            <div class="description-header-modern">
                                <i class="fas fa-clipboard-list"></i>
                                Descripción del Trabajo
                            </div>
                            <div class="description-text-modern">${description}</div>
                        </div>
                    ` : ''}

                    <div class="order-image-section-modern">
                        ${hasImage ? `
                            <div class="order-image-container-modern">
                                <img src="${order.workOrderImage}" alt="Imagen de orden" class="order-image-modern" />
                                <div class="image-overlay-badge-modern">
                                    <i class="fas fa-image"></i>
                                    Evidencia
                                </div>
                            </div>
                        ` : `
                            <div class="no-image-placeholder-modern">
                                <i class="fas fa-image"></i>
                                <span>Sin imagen adjunta</span>
                            </div>
                        `}
                    </div>
                </div>

                <div class="work-order-footer">
                    <div class="time-info-modern">
                        <i class="fas fa-calendar-alt"></i>
                        <span>Creada recientemente</span>
                    </div>
                </div>
            </div>
        `;
    }

    getStatusText(idStatus) {
        switch(idStatus) {
            case 1: return 'En Aprobación del Animador';
            case 2: return 'En Aprobación del Coordinador';
            case 3: return 'Aprobado - En Progreso';
            case 4: return 'Completado';
            case 5: return 'Rechazado';
            case 6: return 'Atrasado';
            default: return 'Desconocido';
        }
    }

    getStatusClass(idStatus) {
        switch(idStatus) {
            case 1: return 'en-aprobacion-animador';
            case 2: return 'en-aprobacion-coordinador';
            case 3: return 'aprobado-progreso';
            case 4: return 'completado';
            case 5: return 'rechazado';
            case 6: return 'atrasado';
            default: return 'pendiente';
        }
    }

    getVehicleStatusText(idStatus) {
        switch(idStatus) {
            case 1: return 'Pendiente de Aprobación';
            case 2: return 'En Revisión';
            case 3: return 'Aprobado';
            case 4: return 'Rechazado';
            case 5: return 'En Mantenimiento';
            case 6: return 'Fuera de Servicio';
            default: return 'Estado Desconocido';
        }
    }

    getVehicleStatusClass(idStatus) {
        switch(idStatus) {
            case 1: return 'estado-pendiente';
            case 2: return 'estado-revision';
            case 3: return 'estado-aprobado';
            case 4: return 'estado-rechazado';
            case 5: return 'estado-mantenimiento';
            case 6: return 'estado-fuera-servicio';
            default: return 'estado-desconocido';
        }
    }

    openModal() {
        // Filtrar vehículos aprobados para la validación del modal
        const approvedVehicles = this.vehicles.filter(vehicle => vehicle.idStatus === 3);
        
        if (this.vehicles.length === 0) {
            this.showError('Debes tener al menos un vehículo registrado para crear una orden de trabajo');
            return;
        }
        
        if (approvedVehicles.length === 0) {
            this.showError('No tienes vehículos aprobados disponibles. Los vehículos deben ser aprobados por los animadores y coordinadores antes de poder crear órdenes de trabajo.');
            return;
        }
        
        this.modal.style.display = 'block';
        // Bloquear scroll del body y ocultar bottom-nav
        document.body.classList.add('modal-open');
    }

    closeModal() {
        this.modal.style.display = 'none';
        // Restaurar scroll del body y mostrar bottom-nav
        document.body.classList.remove('modal-open');
        this.form.reset();
        this.vistaPrevia.style.display = 'none';
    }

    handleImagePreview(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.vistaPrevia.src = e.target.result;
                this.vistaPrevia.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            this.vistaPrevia.style.display = 'none';
        }
    }

    /**
     * Sube una imagen a Cloudinary usando el endpoint backend
     * @param {File} archivo - Archivo de imagen a subir
     * @returns {Promise<string|null>} - URL de la imagen subida o null si falla
     */
    async subirImagen(archivo) {
        console.log('Iniciando subida de imagen:', archivo.name, archivo.size, 'bytes');
        
        const fd = new FormData();
        fd.append('image', archivo);
        fd.append('folder', 'workOrders');
        
        try {
            console.log('Enviando imagen a Cloudinary...');
            const res = await fetch('https://sgma-66ec41075156.herokuapp.com/api/images/upload-to-folder', {
                method: 'POST',
                credentials: 'include',
                body: fd
            });
            
            console.log('Respuesta de Cloudinary status:', res.status);
            
            if (!res.ok) {
                throw new Error(`Error HTTP ${res.status} en subida de imagen`);
            }
            
            const obj = await res.json();
            console.log('Respuesta de Cloudinary:', obj);
            
            if (obj.url) {
                console.log('URL de imagen obtenida:', obj.url);
                return obj.url;
            } else {
                throw new Error('URL de imagen no encontrada en la respuesta de Cloudinary.');
            }
        } catch (error) {
            console.error('Error detallado al subir imagen:', error);
            throw error; // Re-lanzar el error para manejarlo en handleCreateWorkOrder
        }
    }

    async handleCreateWorkOrder() {
        try {
            console.log('Iniciando creación de orden de trabajo...');
            
            // Obtener referencias directas a los elementos para debug
            const vehiculoSelectEl = document.getElementById('vehiculo-select');
            const moduloSelectEl = document.getElementById('modulo-select');
            const descripcionEl = document.getElementById('descripcion-trabajo');
            const tiempoEstimadoEl = document.getElementById('tiempo-estimado');
            const imagenFileEl = document.getElementById('imagen-trabajo');

            // Debug: Verificar que los elementos existen
            console.log('Elementos del formulario encontrados:', {
                vehiculoSelect: !!vehiculoSelectEl,
                moduloSelect: !!moduloSelectEl,
                descripcionElement: !!descripcionEl,
                tiempoEstimadoElement: !!tiempoEstimadoEl,
                imagenElement: !!imagenFileEl
            });

            // Extraer valores con verificación de existencia
            const vehicleId = vehiculoSelectEl ? vehiculoSelectEl.value : '';
            const moduleId = moduloSelectEl ? moduloSelectEl.value : '';
            const descripcion = descripcionEl ? descripcionEl.value.trim() : '';
            const tiempoEstimado = tiempoEstimadoEl ? tiempoEstimadoEl.value.trim() : '';
            const imagenFile = imagenFileEl ? imagenFileEl.files[0] : null;

            console.log('Valores RAW extraídos del formulario:', {
                vehicleId: vehicleId,
                moduleId: moduleId,
                descripcion: `"${descripcion}"`,
                tiempoEstimado: `"${tiempoEstimado}"`,
                tieneImagen: !!imagenFile,
                descripcionLength: descripcion.length,
                tiempoEstimadoLength: tiempoEstimado.length
            });

            // Validaciones
            console.log('Iniciando validaciones...');
            
            if (!vehicleId) {
                console.log('Error: No se seleccionó vehículo');
                this.showError('Debe seleccionar un vehículo');
                return;
            }
            console.log('✓ Vehículo validado:', vehicleId);

            if (!moduleId) {
                console.log('Error: No se seleccionó módulo');
                this.showError('Debe seleccionar un módulo');
                return;
            }
            console.log('✓ Módulo validado:', moduleId);

            // Validar tiempo estimado (requerido por el DTO)
            if (!tiempoEstimado || parseFloat(tiempoEstimado) <= 0) {
                console.log('Error: Tiempo estimado inválido', { 
                    tiempoEstimado: `"${tiempoEstimado}"`, 
                    parsed: parseFloat(tiempoEstimado),
                    isEmpty: tiempoEstimado === '',
                    isNull: tiempoEstimado === null,
                    isUndefined: tiempoEstimado === undefined
                });
                this.showError('Debe especificar un tiempo estimado válido');
                return;
            }
            console.log('✓ Tiempo estimado validado:', `"${tiempoEstimado}"`, 'parsed:', parseFloat(tiempoEstimado));

            console.log('✓ Todas las validaciones pasaron correctamente');

            // Mostrar alerta de carga
            Swal.fire({
                title: 'Creando orden de trabajo...',
                text: 'Por favor, espere mientras se procesa la solicitud.',
                icon: 'info',
                allowOutsideClick: false,
                showConfirmButton: false,
                customClass: {
                    popup: 'swal-custom-popup',
                    title: 'swal-custom-title',
                    content: 'swal-custom-content'
                },
                willOpen: () => {
                    Swal.showLoading();
                }
            });

            console.log('SweetAlert mostrado, procesando imagen...');

            // Subir imagen si existe
            let workOrderImage = null;
            if (imagenFile) {
                console.log('Subiendo imagen...');
                try {
                    workOrderImage = await this.subirImagen(imagenFile);
                    if (!workOrderImage) {
                        console.log('Falló la subida de imagen - sin URL');
                        Swal.close();
                        return;
                    }
                    console.log('Imagen subida exitosamente:', workOrderImage);
                } catch (error) {
                    console.error('Error en subida de imagen:', error);
                    Swal.close();
                    this.showError('Error al subir la imagen: ' + error.message);
                    return;
                }
            } else {
                console.log('No hay imagen para subir');
            }

            console.log('Preparando DTO de orden de trabajo...');

            // Validar que el vehículo seleccionado existe en la lista cargada Y está aprobado
            console.log('Validando vehículo en lista local...');
            console.log('ID de vehículo seleccionado:', vehicleId, typeof vehicleId);
            console.log('Lista de vehículos disponibles:', this.vehicles.map(v => ({
                id: v.vehicleId,
                tipo: typeof v.vehicleId,
                placa: v.plateNumber,
                estado: v.idStatus
            })));
            
            const selectedVehicle = this.vehicles.find(v => v.vehicleId === parseInt(vehicleId));
            if (!selectedVehicle) {
                console.error('Vehículo no encontrado en lista local');
                console.error('Vehículo buscado:', parseInt(vehicleId));
                console.error('IDs disponibles:', this.vehicles.map(v => v.vehicleId));
                Swal.close();
                this.showError(`El vehículo con ID ${vehicleId} no se encuentra en su lista de vehículos. Por favor, actualice la página e intente nuevamente.`);
                return;
            }

            // Validar que el vehículo esté aprobado (idStatus = 1)
            if (selectedVehicle.idStatus !== 3) {
                console.error('Vehículo no está aprobado:', selectedVehicle);
                Swal.close();
                this.showError('El vehículo seleccionado no está aprobado. Solo se pueden crear órdenes de trabajo con vehículos aprobados por los animadores y coordinadores.');
                return;
            }

            console.log('Vehículo validado y aprobado:', selectedVehicle);

            // Crear el objeto de la orden de trabajo según el DTO esperado
            const workOrderData = {
                vehicleId: parseInt(vehicleId),
                moduleId: parseInt(moduleId),
                estimatedTime: parseFloat(tiempoEstimado),
                description: descripcion || "", 
                workOrderImage: workOrderImage || "sin_imagen",
                idStatus: 1
            };

            console.log('DTO revertido con estimatedTime como número:', workOrderData);

            console.log('Iniciando petición HTTP...');
            console.log('Enviando orden de trabajo:', workOrderData);

            const response = await fetch('https://sgma-66ec41075156.herokuapp.com/api/workOrders/newWorkOrder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(workOrderData)
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', [...response.headers.entries()]);
            
            const responseText = await response.text();
            console.log('Response text:', responseText);
            
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Error parsing JSON response:', parseError);
                result = { message: responseText };
            }
            
            console.log('Response data:', result);
            
            Swal.close();

            if (response.ok) {
                // Verificar diferentes formatos de respuesta exitosa
                if (result.Estado === 'Completado' || result.status === 'success' || result.success === true) {
                    this.showSuccess('Orden de trabajo creada exitosamente');
                    this.closeModal();
                    // Resetear paginación y búsqueda, luego recargar
                    this.currentPage = 1;
                    this.searchTerm = '';
                    if (this.searchInput) {
                        this.searchInput.value = '';
                    }
                    await this.loadWorkOrders();
                } else {
                    throw new Error(result.message || result.Descripción || 'Respuesta inesperada del servidor');
                }
            } else {
                // Error del servidor - mostrar detalles específicos
                let errorMessage = `Error HTTP ${response.status}`;
                
                if (response.status === 400) {
                    // Error de validación
                    errorMessage = 'Error de validación: ';
                    if (result.detail && result.detail.includes('tiempo estimado')) {
                        errorMessage += 'El tiempo estimado es obligatorio y debe ser un valor válido.';
                    } else if (result.detail && result.detail.includes('imagen')) {
                        errorMessage += 'La imagen de la orden de trabajo es obligatoria.';
                    } else if (result.Descripción) {
                        errorMessage += result.Descripción;
                    } else {
                        errorMessage += result.message || 'Verifique que todos los campos requeridos estén completos.';
                    }
                } else if (response.status === 500) {
                    errorMessage = 'Error del servidor: ';
                    if (result.message && result.message.includes('vehiculo no encontrado')) {
                        errorMessage += `El vehículo con ID ${vehicleId} no fue encontrado en la base de datos. Verifique que el vehículo esté registrado correctamente.`;
                    } else {
                        errorMessage += result.message || result.Descripción || result.detail || 'Error interno del servidor';
                    }
                } else {
                    errorMessage = result.message || result.Descripción || result.detail || errorMessage;
                }
                
                throw new Error(errorMessage);
            }

        } catch (error) {
            Swal.close();
            console.error('Error al crear orden de trabajo:', error);
            
            let errorMessage = 'Error al crear la orden de trabajo';
            if (error.message) {
                errorMessage = error.message;
            }
            
            this.showError(errorMessage);
        }
    }

    showSuccess(message) {
        Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: message,
            customClass: {
                popup: 'swal-custom-popup',
                title: 'swal-custom-title',
                content: 'swal-custom-content',
                confirmButton: 'swal-custom-confirm-button'
            },
            confirmButtonText: 'Aceptar'
        });
    }

    showError(message) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message,
            customClass: {
                popup: 'swal-custom-popup',
                title: 'swal-custom-title',
                content: 'swal-custom-content',
                confirmButton: 'swal-custom-confirm-button'
            },
            confirmButtonText: 'Aceptar'
        });
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    const controller = new OrdenesTrabajoController();
    await controller.init();
});