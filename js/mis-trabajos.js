import { me } from './services/authServiceStudents.js';

class MisTrabajosController {
    constructor() {
        this.user = null;
        this.workOrders = [];
        this.filteredOrders = [];
        this.container = null;
        // Propiedades de paginación
        this.currentPage = 1;
        this.ordersPerPage = 4;
        this.totalOrders = 0;
        // Propiedades de búsqueda
        this.searchTerm = '';
        this.searchInput = null;
    }

    async init() {
        try {
            await this.initializeAuth();
            this.initializeElements();
            this.bindEvents();
            await this.loadWorkOrders();
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
        this.container = document.getElementById('trabajos-container');
        this.searchInput = document.getElementById('search-orders');
    }

    bindEvents() {
        // Buscador de órdenes
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase().trim();
                this.currentPage = 1; // Resetear a primera página
                this.filterAndDisplayOrders();
            });
        }
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
            console.log('Respuesta de órdenes de trabajo:', data);

            let orders = [];
            if (data.workOrders && Array.isArray(data.workOrders)) {
                orders = data.workOrders;
            }

            this.workOrders = orders;
            this.filterAndDisplayOrders();

        } catch (error) {
            console.error('Error al cargar órdenes de trabajo:', error);
            this.showError('Error al cargar las órdenes de trabajo');
            this.filterAndDisplayOrders();
        }
    }

    filterAndDisplayOrders() {
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

        this.totalOrders = this.filteredOrders.length;

        if (this.filteredOrders.length === 0) {
            if (this.searchTerm === '') {
                this.container.innerHTML = `
                    <div class="empty-work-orders">
                        <i class="fas fa-clipboard-list"></i>
                        <h3>No tienes órdenes de trabajo</h3>
                        <p>Aún no has creado ninguna orden de trabajo. Cuando crees una, aparecerá aquí con toda la información detallada.</p>
                        <a href="ordenes-trabajo.html" class="create-order-button">
                            <i class="fas fa-plus"></i>
                            Crear Primera Orden
                        </a>
                    </div>
                `;
            } else {
                this.container.innerHTML = `
                    <div class="empty-work-orders">
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

        // Generar HTML de las órdenes
        const ordenesHTML = paginatedOrders.map(order => this.createWorkOrderCard(order)).join('');
        
        // Generar HTML de paginación
        const paginationHTML = this.createPaginationHTML(totalPages);
        
        // Mostrar órdenes y paginación
        this.container.innerHTML = ordenesHTML + paginationHTML;
        
        // Agregar event listeners para paginación
        this.bindPaginationEvents();
    }

    createWorkOrderCard(order) {
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

        let actionButton = '';
        if (order.idStatus !== 5) {
            // Usar onclick con función global simple
            actionButton = `
                <a href="#" class="action-button" onclick="handleOrderDetails(${order.workOrderId}); return false;">
                    <i class="fas fa-eye"></i>
                    Ver Detalles
                </a>
            `;
        }

        return `
            <div class="work-order-card">
                <div class="work-order-header">
                    <div class="order-title-row">
                        <div class="order-number">
                            <i class="fas fa-hashtag"></i>
                            Orden ${order.workOrderId}
                        </div>
                        <div class="order-status status-${statusClass}">
                            ${statusText}
                        </div>
                    </div>
                    <div class="vehicle-info">
                        <i class="fas fa-car"></i>
                        <span>${vehiclePlate}</span>
                    </div>
                </div>

                <div class="work-order-content">
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">
                                <i class="fas fa-book"></i>
                                Módulo
                            </div>
                            <div class="info-value">${moduleName}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">
                                <i class="fas fa-clock"></i>
                                Tiempo Estimado
                            </div>
                            <div class="info-value">${estimatedTime} ${estimatedTime !== 'No especificado' ? 'horas' : ''}</div>
                        </div>
                    </div>

                    ${description ? `
                        <div class="description-section">
                            <div class="description-header">
                                <i class="fas fa-clipboard-list"></i>
                                Descripción del Trabajo
                            </div>
                            <div class="description-text">${description}</div>
                        </div>
                    ` : ''}

                    <div class="order-image-section">
                        ${hasImage ? `
                            <div class="order-image-container">
                                <img src="${order.workOrderImage}" alt="Imagen de orden" class="order-image" />
                                <div class="image-overlay-badge">
                                    <i class="fas fa-image"></i>
                                    Evidencia
                                </div>
                            </div>
                        ` : `
                            <div class="no-image-placeholder">
                                <i class="fas fa-image"></i>
                                <span>Sin imagen adjunta</span>
                            </div>
                        `}
                    </div>
                </div>

                <div class="work-order-footer">
                    <div class="time-info">
                        <i class="fas fa-calendar-alt"></i>
                        <span>Creada recientemente</span>
                    </div>
                    ${actionButton}
                </div>
            </div>
        `;
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
        const prevBtn = document.getElementById('prev-page');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.filterAndDisplayOrders();
                }
            });
        }

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

    showError(message) {
        console.error(message);
        if (this.container) {
            this.container.innerHTML = `
                <div class="empty-work-orders">
                    <i class="fas fa-exclamation-triangle" style="color: #f44336;"></i>
                    <h3>Error al cargar</h3>
                    <p>${message}</p>
                    <button onclick="location.reload()" class="create-order-button">
                        <i class="fas fa-refresh"></i>
                        Reintentar
                    </button>
                </div>
            `;
        } else {
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

    showOrderDetails(orderId) {
        const order = this.workOrders.find(o => o.workOrderId === orderId);
        if (!order) return;

        if (order.idStatus === 1 || order.idStatus === 2) {
            this.showApprovalMessage(order);
        } else if (order.idStatus === 3) {
            this.showProgressModal(order);
        } else if (order.idStatus === 4) {
            this.showCompletedModal(order);
        } else if (order.idStatus === 6) {
            this.showDelayedModal(order);
        }
    }

    showApprovalMessage(order) {
        const statusText = order.idStatus === 1 ? 'animador' : 'coordinadora';
        
        Swal.fire({
            icon: 'info',
            title: 'Orden en Proceso de Aprobación',
            html: `
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-hourglass-half" style="font-size: 3em; color: #FFC107; margin-bottom: 15px;"></i>
                    <p>Tu orden de trabajo está en proceso de aprobación del <strong>${statusText}</strong>.</p>
                    <p>Espera a que el animador y el coordinador aprueben tu solicitud de orden de trabajo.</p>
                </div>
            `,
            customClass: {
                popup: 'swal-custom-popup',
                title: 'swal-custom-title',
                content: 'swal-custom-content',
                confirmButton: 'swal-custom-confirm-button'
            },
            confirmButtonText: 'Entendido'
        });
    }

    showProgressModal(order) {
        Swal.fire({
            title: `Orden de Trabajo #${order.workOrderId}`,
            html: `
                <div style="text-align: left; padding: 10px;">
                    <nav class="breadcrumb-pasos" aria-label="Progreso de registro">
                    <div class="paso completado" title="Registrar vehículo">
                        <i class="fa fa-car"></i>
                    </div>
                    <div class="paso completado" title="Entradas">
                        <i class="fa fa-list"></i>
                    </div>
                    <div class="paso activo" title="Orden de trabajo">
                        <i class="fa fa-file-alt"></i>
                    </div>
                    <div class="linea-progreso">
                        <div class="relleno2"></div>
                    </div>
                </nav>

                    <div style="background: rgba(66, 165, 245, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <h4 style="color: #42A5F5; margin: 0 0 10px 0;"><i class="fas fa-car"></i> Detalles del Vehículo</h4>
                        <p><strong>Placa:</strong> ${order.vehiclePlateNumber || 'Sin placa'}</p>
                        <p><strong>Marca:</strong> ${order.vehicleBrand || 'No especificada'}</p>
                        <p><strong>Modelo:</strong> ${order.vehicleModel || 'No especificado'}</p>
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px;">
                        <h4 style="color: #42A5F5; margin: 0 0 10px 0;"><i class="fas fa-clipboard-list"></i> Detalles de la Orden</h4>
                        <p><strong>Módulo:</strong> ${order.moduleName || 'Sin módulo'}</p>
                        <p><strong>Tiempo Estimado:</strong> ${order.estimatedTime || 'No especificado'} horas</p>
                        <p><strong>Estado:</strong> ${this.getStatusText(order.idStatus)}</p>
                        ${order.description ? `<p><strong>Descripción:</strong> ${order.description}</p>` : ''}
                    </div>
                </div>
            `,
            showCancelButton: true,
            showDenyButton: true,
            showCloseButton: true,
            confirmButtonText: 'Finalizar Orden',
            denyButtonText: 'Atrasar Orden',
            cancelButtonText: 'Nueva Observación',
            closeButtonAriaLabel: 'Cerrar',
            customClass: {
                popup: 'swal-custom-popup',
                title: 'swal-custom-title',
                content: 'swal-custom-content',
                confirmButton: 'swal-custom-confirm-button',
                cancelButton: 'swal-custom-observation-button',
                denyButton: 'swal-custom-cancel-button'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                this.completeOrder(order.workOrderId);
            } else if (result.isDenied) {
                this.delayOrder(order.workOrderId);
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                this.showCreateObservationModal(order.workOrderId);
            }
        });
    }

    showCompletedModal(order) {
        Swal.fire({
            icon: 'success',
            title: '¡Felicidades!',
            html: `
                <div style="text-align: center; padding: 20px;">
                    <p>Esta orden ya ha sido finalizada con éxito</p>
                </div>
            `,
            showCancelButton: true,
            showDenyButton: true,
            confirmButtonText: 'Ver Detalles de la Orden',
            denyButtonText: 'Nueva Observación',
            cancelButtonText: 'Cerrar',
            customClass: {
                popup: 'swal-custom-popup',
                title: 'swal-custom-title',
                content: 'swal-custom-content',
                confirmButton: 'swal-custom-confirm-button',
                denyButton: 'swal-custom-observation-button',
                cancelButton: 'swal-custom-cancel-button'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                this.showOrderDetailsOnly(order);
            } else if (result.isDenied) {
                this.showCreateObservationModal(order.workOrderId);
            }
        });
    }

    async showOrderDetailsOnly(order) {
        try {
            const observations = await this.getObservations(order.workOrderId);
            
            Swal.fire({
                title: `Orden de Trabajo #${order.workOrderId}`,
                html: `
                    <div style="text-align: left; padding: 10px;">
                        <div style="background: rgba(66, 165, 245, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                            <h4 style="color: #42A5F5; margin: 0 0 10px 0;"><i class="fas fa-car"></i> Detalles del Vehículo</h4>
                            <p><strong>Placa:</strong> ${order.vehiclePlateNumber || 'Sin placa'}</p>
                            <p><strong>Marca:</strong> ${order.vehicleBrand || 'No especificada'}</p>
                            <p><strong>Modelo:</strong> ${order.vehicleModel || 'No especificado'}</p>
                        </div>
                        <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                            <h4 style="color: #42A5F5; margin: 0 0 10px 0;"><i class="fas fa-clipboard-list"></i> Detalles de la Orden</h4>
                            <p><strong>Módulo:</strong> ${order.moduleName || 'Sin módulo'}</p>
                            <p><strong>Tiempo Estimado:</strong> ${order.estimatedTime || 'No especificado'} horas</p>
                            <p><strong>Estado:</strong> ${this.getStatusText(order.idStatus)}</p>
                            ${order.description ? `<p><strong>Descripción:</strong> ${order.description}</p>` : ''}
                        </div>
                        ${this.generateObservationsHTML(observations)}
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Nueva Observación',
                cancelButtonText: 'Cerrar',
                customClass: {
                    popup: 'swal-custom-popup swal-wide',
                    title: 'swal-custom-title',
                    content: 'swal-custom-content',
                    confirmButton: 'swal-custom-observation-button',
                    cancelButton: 'swal-custom-cancel-button'
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    this.showCreateObservationModal(order.workOrderId);
                }
            });
        } catch (error) {
            console.error('Error loading observations:', error);
            // Show modal without observations
            Swal.fire({
                title: `Orden de Trabajo #${order.workOrderId}`,
                html: `
                    <div style="text-align: left; padding: 10px;">
                        <div style="background: rgba(66, 165, 245, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                            <h4 style="color: #42A5F5; margin: 0 0 10px 0;"><i class="fas fa-car"></i> Detalles del Vehículo</h4>
                            <p><strong>Placa:</strong> ${order.vehiclePlateNumber || 'Sin placa'}</p>
                            <p><strong>Marca:</strong> ${order.vehicleBrand || 'No especificada'}</p>
                            <p><strong>Modelo:</strong> ${order.vehicleModel || 'No especificado'}</p>
                        </div>
                        <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px;">
                            <h4 style="color: #42A5F5; margin: 0 0 10px 0;"><i class="fas fa-clipboard-list"></i> Detalles de la Orden</h4>
                            <p><strong>Módulo:</strong> ${order.moduleName || 'Sin módulo'}</p>
                            <p><strong>Tiempo Estimado:</strong> ${order.estimatedTime || 'No especificado'} horas</p>
                            <p><strong>Estado:</strong> ${this.getStatusText(order.idStatus)}</p>
                            ${order.description ? `<p><strong>Descripción:</strong> ${order.description}</p>` : ''}
                        </div>
                    </div>
                `,
                confirmButtonText: 'Cerrar',
                customClass: {
                    popup: 'swal-custom-popup',
                    title: 'swal-custom-title',
                    content: 'swal-custom-content',
                    confirmButton: 'swal-custom-confirm-button'
                }
            });
        }
    }

    showDelayedModal(order) {
        Swal.fire({
            title: `Orden de Trabajo #${order.workOrderId}`,
            html: `
                <div style="text-align: left; padding: 10px;">
                    <div style="background: rgba(66, 165, 245, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <h4 style="color: #42A5F5; margin: 0 0 10px 0;"><i class="fas fa-car"></i> Detalles del Vehículo</h4>
                        <p><strong>Placa:</strong> ${order.vehiclePlateNumber || 'Sin placa'}</p>
                        <p><strong>Marca:</strong> ${order.vehicleBrand || 'No especificada'}</p>
                        <p><strong>Modelo:</strong> ${order.vehicleModel || 'No especificado'}</p>
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px;">
                        <h4 style="color: #42A5F5; margin: 0 0 10px 0;"><i class="fas fa-clipboard-list"></i> Detalles de la Orden</h4>
                        <p><strong>Módulo:</strong> ${order.moduleName || 'Sin módulo'}</p>
                        <p><strong>Tiempo Estimado:</strong> ${order.estimatedTime || 'No especificado'} horas</p>
                        <p><strong>Estado:</strong> ${this.getStatusText(order.idStatus)}</p>
                        ${order.description ? `<p><strong>Descripción:</strong> ${order.description}</p>` : ''}
                    </div>
                </div>
            `,
            showCancelButton: true,
            showDenyButton: true,
            confirmButtonText: 'Finalizar Orden',
            denyButtonText: 'Nueva Observación',
            cancelButtonText: 'Cerrar',
            customClass: {
                popup: 'swal-custom-popup',
                title: 'swal-custom-title',
                content: 'swal-custom-content',
                confirmButton: 'swal-custom-confirm-button',
                denyButton: 'swal-custom-observation-button',
                cancelButton: 'swal-custom-cancel-button'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                this.completeOrder(order.workOrderId);
            } else if (result.isDenied) {
                this.showCreateObservationModal(order.workOrderId);
            }
        });
    }

    showCreateObservationModal(workOrderId) {
        Swal.fire({
            title: 'Nueva Observación',
            html: `
                <div style="text-align: left; padding: 10px;">
                    <div style="margin-bottom: 15px;">
                        <label for="observation-description" style="display: block; margin-bottom: 5px; font-weight: bold; color: #42A5F5;">
                            <i class="fas fa-pen"></i> Descripción del trabajo realizado *
                        </label>
                        <textarea id="observation-description" 
                                  placeholder="Describe detalladamente el trabajo realizado, herramientas utilizadas, problemas encontrados, etc." 
                                  style="width: 100%; min-height: 100px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; resize: vertical; font-family: Arial, sans-serif;"
                                  required></textarea>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label for="observation-image" style="display: block; margin-bottom: 5px; font-weight: bold; color: #42A5F5;">
                            <i class="fas fa-camera"></i> Imagen (opcional)
                        </label>
                        <input type="file" id="observation-image" accept="image/*" 
                               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
                        <small style="color: #666; font-size: 12px;">
                            Sube una imagen del trabajo realizado, herramientas utilizadas, o reporta algún accidente si ocurrió.
                        </small>
                    </div>
                    
                    <div id="image-preview" style="margin-top: 10px; text-align: center; display: none;">
                        <img id="preview-img" style="max-width: 200px; max-height: 200px; border-radius: 5px; border: 1px solid #ddd;">
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Crear Observación',
            cancelButtonText: 'Cancelar',
            customClass: {
                popup: 'swal-custom-popup swal-wide',
                title: 'swal-custom-title',
                content: 'swal-custom-content',
                confirmButton: 'swal-custom-confirm-button',
                cancelButton: 'swal-custom-cancel-button'
            },
            didOpen: () => {
                const imageInput = document.getElementById('observation-image');
                const preview = document.getElementById('image-preview');
                const previewImg = document.getElementById('preview-img');
                
                imageInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            previewImg.src = e.target.result;
                            preview.style.display = 'block';
                        };
                        reader.readAsDataURL(file);
                    } else {
                        preview.style.display = 'none';
                    }
                });
            },
            preConfirm: () => {
                const description = document.getElementById('observation-description').value.trim();
                const imageFile = document.getElementById('observation-image').files[0];
                
                if (!description) {
                    Swal.showValidationMessage('La descripción es obligatoria');
                    return false;
                }
                
                return {
                    description: description,
                    imageFile: imageFile
                };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                await this.createObservation(workOrderId, result.value.description, result.value.imageFile);
            }
        });
    }

    async createObservation(workOrderId, description, imageFile) {
        try {
            Swal.fire({
                title: 'Creando observación...',
                text: 'Por favor espera mientras se guarda la observación',
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            let imageUrl = null;
            
            // Si hay imagen, subirla primero
            if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);

                const imageResponse = await fetch('https://sgma-66ec41075156.herokuapp.com/api/images/upload', {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                });

                if (imageResponse.ok) {
                    const imageData = await imageResponse.json();
                    imageUrl = imageData.imageUrl;
                }
            }

            // Crear la observación con los nombres de campo correctos para la base de datos
            const observationData = {
                workOrderId: workOrderId,
                studentId: this.user.student.id,
                observacion: description,  // Cambiar 'description' por 'observacion'
                imageUrl: imageUrl        // Cambiar 'observationImage' por 'imageUrl'
            };

            const response = await fetch('https://sgma-66ec41075156.herokuapp.com/api/observations/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(observationData),
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al crear la observación');
            }

            await Swal.fire({
                icon: 'success',
                title: '¡Observación creada!',
                text: 'La observación ha sido registrada exitosamente',
                customClass: {
                    popup: 'swal-custom-popup',
                    title: 'swal-custom-title',
                    content: 'swal-custom-content',
                    confirmButton: 'swal-custom-confirm-button'
                }
            });

        } catch (error) {
            console.error('Error creating observation:', error);
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al crear la observación: ' + error.message,
                customClass: {
                    popup: 'swal-custom-popup',
                    title: 'swal-custom-title',
                    content: 'swal-custom-content',
                    confirmButton: 'swal-custom-confirm-button'
                }
            });
        }
    }

    async getObservations(workOrderId) {
        try {
            const response = await fetch(`https://sgma-66ec41075156.herokuapp.com/api/observations/workOrder/${workOrderId}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.observations || [];
        } catch (error) {
            console.error('Error fetching observations:', error);
            return [];
        }
    }

    generateObservationsHTML(observations) {
        if (!observations || observations.length === 0) {
            return `
                <div style="background: rgba(255, 193, 7, 0.1); padding: 15px; border-radius: 8px; text-align: center;">
                    <h4 style="color: #FFC107; margin: 0 0 10px 0;"><i class="fas fa-sticky-note"></i> Observaciones</h4>
                    <p style="margin: 0; color: #666;">No hay observaciones registradas para esta orden</p>
                </div>
            `;
        }

        let observationsHTML = `
            <div style="background: rgba(255, 193, 7, 0.1); padding: 15px; border-radius: 8px;">
                <h4 style="color: #FFC107; margin: 0 0 15px 0;"><i class="fas fa-sticky-note"></i> Observaciones (${observations.length})</h4>
        `;

        observations.forEach((observation, index) => {
            // Ajustar para los nombres de campo correctos de la base de datos
            const hasImage = observation.imageUrl && 
                           observation.imageUrl !== 'sin_imagen' && 
                           observation.imageUrl !== null && 
                           observation.imageUrl.trim() !== '';

            observationsHTML += `
                <div style="background: rgba(255, 255, 255, 0.1); padding: 12px; border-radius: 6px; margin-bottom: ${index < observations.length - 1 ? '10px' : '0'};">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <strong style="color: #FFC107;">Observación #${index + 1}</strong>
                        <small style="color: #888;">
                            <i class="fas fa-calendar"></i>
                            ${observation.createdAt ? new Date(observation.createdAt).toLocaleDateString('es-ES') : 'Fecha no disponible'}
                        </small>
                    </div>
                    <p style="margin: 8px 0; line-height: 1.4;">${observation.observacion || observation.description || ''}</p>
                    ${hasImage ? `
                        <div style="margin-top: 10px; text-align: center;">
                            <img src="${observation.imageUrl}" 
                                 alt="Imagen de observación" 
                                 style="max-width: 150px; max-height: 150px; border-radius: 5px; border: 1px solid #ddd; cursor: pointer;"
                                 onclick="window.open('${observation.imageUrl}', '_blank')">
                            <br>
                            <small style="color: #888;">Click para ver en tamaño completo</small>
                        </div>
                    ` : ''}
                </div>
            `;
        });

        observationsHTML += `</div>`;
        return observationsHTML;
    }

}

// Variable global para el controlador
let controllerInstance = null;

// Función global simple para manejar detalles de orden
window.handleOrderDetails = function(orderId) {
    if (controllerInstance) {
        controllerInstance.showOrderDetails(orderId);
    } else {
        console.error('Controller not initialized');
    }
};

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    controllerInstance = new MisTrabajosController();
    await controllerInstance.init();
});
