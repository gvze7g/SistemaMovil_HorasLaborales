// Mobile vehicle dashboard functionality
class VehiculosMobile {
    constructor() {
        this.vehiculos = [];
        this.filteredVehiculos = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadVehiculos();
        this.setupModal();
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('buscarRegistro');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterVehiculos(e.target.value);
            });
        }

        // Filter functionality
        const filterSelect = document.getElementById('filtroEstado');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.filterByStatus(e.target.value);
            });
        }

        // Modal close
        const closeModal = document.querySelector('.btn-close-modal');
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                this.closeModal();
            });
        }

        // Print functionality
        const printBtn = document.getElementById('btn-imprimir-reporte');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
            });
        }

        // Modal overlay click to close
        const modalOverlay = document.getElementById('modalVehiculo');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    this.closeModal();
                }
            });
        }
    }

    async loadVehiculos() {
        try {
            // Simulate API call - replace with actual API endpoint
            const response = await fetch('/api/vehiculos');
            this.vehiculos = await response.json();
            this.filteredVehiculos = [...this.vehiculos];
            this.renderVehiculos();
            this.updatePendingCount();
        } catch (error) {
            console.error('Error loading vehicles:', error);
            // Use mock data for demo
            this.loadMockData();
        }
    }

    loadMockData() {
        // Mock data for demonstration
        this.vehiculos = [
            {
                id: 1,
                placa: 'ABC123',
                marca: 'Toyota',
                modelo: 'Corolla',
                tipo: 'Sedán',
                estado: 1,
                estudiante: 'Juan Pérez',
                propietario: 'María Pérez',
                telefono: '+506 8888-8888',
                imagen: 'imgs/vehiculo1.jpg',
                fecha: '2024-01-15'
            },
            // Add more mock data as needed
        ];
        this.filteredVehiculos = [...this.vehiculos];
        this.renderVehiculos();
        this.updatePendingCount();
    }

    renderVehiculos() {
        this.renderMobileList();
        this.renderDesktopTable();
        this.renderPagination();
    }

    renderMobileList() {
        const mobileList = document.querySelector('.vehicle-list');
        if (!mobileList) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageVehiculos = this.filteredVehiculos.slice(startIndex, endIndex);

        mobileList.innerHTML = pageVehiculos.map(vehiculo => `
            <div class="vehicle-item" onclick="vehiculosMobile.showVehicleDetails(${vehiculo.id})">
                <div class="vehicle-header">
                    <div class="vehicle-plate">${vehiculo.placa}</div>
                    <div class="vehicle-status ${this.getStatusClass(vehiculo.estado)}">
                        ${this.getStatusText(vehiculo.estado)}
                    </div>
                </div>
                <div class="vehicle-details">
                    <div class="vehicle-detail">
                        <strong>Marca:</strong> ${vehiculo.marca}
                    </div>
                    <div class="vehicle-detail">
                        <strong>Modelo:</strong> ${vehiculo.modelo}
                    </div>
                    <div class="vehicle-detail">
                        <strong>Tipo:</strong> ${vehiculo.tipo}
                    </div>
                    <div class="vehicle-detail">
                        <strong>Estudiante:</strong> ${vehiculo.estudiante}
                    </div>
                </div>
                <div class="vehicle-actions">
                    <button class="action-btn btn-view" onclick="event.stopPropagation(); vehiculosMobile.showVehicleDetails(${vehiculo.id})">
                        <i class="fas fa-eye"></i>
                        Ver Detalles
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderDesktopTable() {
        const tableBody = document.querySelector('.vehicle-table tbody');
        if (!tableBody) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageVehiculos = this.filteredVehiculos.slice(startIndex, endIndex);

        tableBody.innerHTML = pageVehiculos.map(vehiculo => `
            <tr>
                <td><input type="checkbox" class="checkbox-row" value="${vehiculo.id}"></td>
                <td>${vehiculo.placa}</td>
                <td>${vehiculo.marca}</td>
                <td>${vehiculo.modelo}</td>
                <td>${vehiculo.tipo}</td>
                <td>
                    <span class="vehicle-status ${this.getStatusClass(vehiculo.estado)}">
                        ${this.getStatusText(vehiculo.estado)}
                    </span>
                </td>
                <td>${vehiculo.estudiante}</td>
                <td>${vehiculo.propietario}</td>
                <td>${vehiculo.telefono}</td>
                <td>
                    <img src="${vehiculo.imagen}" alt="Vehículo" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
                </td>
                <td>
                    <button class="action-btn btn-view" onclick="vehiculosMobile.showVehicleDetails(${vehiculo.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    getStatusClass(estado) {
        const statusClasses = {
            1: 'status-pending',
            2: 'status-in-process',
            3: 'status-approved',
            4: 'status-rejected'
        };
        return statusClasses[estado] || 'status-pending';
    }

    getStatusText(estado) {
        const statusTexts = {
            1: 'Pendiente',
            2: 'En Proceso',
            3: 'Aprobado',
            4: 'Rechazado'
        };
        return statusTexts[estado] || 'Desconocido';
    }

    filterVehiculos(searchTerm) {
        if (!searchTerm) {
            this.filteredVehiculos = [...this.vehiculos];
        } else {
            this.filteredVehiculos = this.vehiculos.filter(vehiculo =>
                vehiculo.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
                vehiculo.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
                vehiculo.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                vehiculo.estudiante.toLowerCase().includes(searchTerm.toLowerCase()) ||
                vehiculo.propietario.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        this.currentPage = 1;
        this.renderVehiculos();
    }

    filterByStatus(status) {
        if (status === 'all') {
            this.filteredVehiculos = [...this.vehiculos];
        } else {
            const statusArray = status.split(',').map(s => parseInt(s));
            this.filteredVehiculos = this.vehiculos.filter(vehiculo =>
                statusArray.includes(vehiculo.estado)
            );
        }
        this.currentPage = 1;
        this.renderVehiculos();
    }

    showVehicleDetails(vehiculoId) {
        const vehiculo = this.vehiculos.find(v => v.id === vehiculoId);
        if (!vehiculo) return;

        const modal = document.getElementById('modalVehiculo');
        const tabContent = document.getElementById('tab-vehiculo');

        if (tabContent) {
            tabContent.innerHTML = `
                <div class="vehicle-details-modal">
                    <div class="detail-row">
                        <strong>Placa:</strong> ${vehiculo.placa}
                    </div>
                    <div class="detail-row">
                        <strong>Marca:</strong> ${vehiculo.marca}
                    </div>
                    <div class="detail-row">
                        <strong>Modelo:</strong> ${vehiculo.modelo}
                    </div>
                    <div class="detail-row">
                        <strong>Tipo:</strong> ${vehiculo.tipo}
                    </div>
                    <div class="detail-row">
                        <strong>Estado:</strong> 
                        <span class="vehicle-status ${this.getStatusClass(vehiculo.estado)}">
                            ${this.getStatusText(vehiculo.estado)}
                        </span>
                    </div>
                    <div class="detail-row">
                        <strong>Estudiante:</strong> ${vehiculo.estudiante}
                    </div>
                    <div class="detail-row">
                        <strong>Propietario:</strong> ${vehiculo.propietario}
                    </div>
                    <div class="detail-row">
                        <strong>Teléfono:</strong> ${vehiculo.telefono}
                    </div>
                    <div class="detail-row">
                        <strong>Fecha de Registro:</strong> ${vehiculo.fecha}
                    </div>
                    <div class="vehicle-image-container">
                        <img src="${vehiculo.imagen}" alt="Vehículo ${vehiculo.placa}" class="vehicle-modal-image">
                    </div>
                </div>
            `;
        }

        if (modal) {
            modal.classList.add('active');
        }
    }

    closeModal() {
        const modal = document.getElementById('modalVehiculo');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    updatePendingCount() {
        const pendingCount = this.vehiculos.filter(v => v.estado === 1 || v.estado === 2).length;
        const badge = document.querySelector('.badge-contador');
        if (badge) {
            badge.textContent = pendingCount;
        }
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredVehiculos.length / this.itemsPerPage);
        const paginationInfo = document.querySelector('.pagination-info');
        const paginationControls = document.querySelector('.pagination-controls');

        if (paginationInfo) {
            const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
            const endItem = Math.min(this.currentPage * this.itemsPerPage, this.filteredVehiculos.length);
            paginationInfo.textContent = `Mostrando ${startItem}-${endItem} de ${this.filteredVehiculos.length} registros`;
        }

        if (paginationControls) {
            paginationControls.innerHTML = `
                <button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} onclick="vehiculosMobile.changePage(${this.currentPage - 1})">
                    <i class="fas fa-chevron-left"></i>
                </button>
                ${this.generatePageButtons(totalPages)}
                <button class="pagination-btn" ${this.currentPage === totalPages ? 'disabled' : ''} onclick="vehiculosMobile.changePage(${this.currentPage + 1})">
                    <i class="fas fa-chevron-right"></i>
                </button>
            `;
        }
    }

    generatePageButtons(totalPages) {
        let buttons = '';
        const maxButtons = 3;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);

        if (endPage - startPage < maxButtons - 1) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            buttons += `
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" onclick="vehiculosMobile.changePage(${i})">
                    ${i}
                </button>
            `;
        }

        return buttons;
    }

    changePage(page) {
        const totalPages = Math.ceil(this.filteredVehiculos.length / this.itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderVehiculos();
        }
    }

    setupModal() {
        // Tab functionality
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetTab = e.target.dataset.tab;
                
                // Remove active from all tabs and contents
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                // Add active to clicked tab and corresponding content
                e.target.classList.add('active');
                const content = document.getElementById(`tab-${targetTab}`);
                if (content) {
                    content.classList.add('active');
                }
            });
        });
    }
}

// Global functions for HTML onclick events
function togglePanel() {
    const panel = document.querySelector('.panel-content');
    const toggle = document.querySelector('.toggle-panel i');
    
    if (panel && toggle) {
        panel.classList.toggle('collapsed');
        toggle.style.transform = panel.classList.contains('collapsed') ? 'rotate(180deg)' : 'rotate(0deg)';
    }
}

// Initialize the application
let vehiculosMobile;
document.addEventListener('DOMContentLoaded', () => {
    vehiculosMobile = new VehiculosMobile();
});

export default VehiculosMobile;
