const API_BASE = "https://sgma-66ec41075156.herokuapp.com/api";

// API Service functions
async function getEstudiantes() {
    const res = await fetch(`${API_BASE}/students/getAllStudents`, {
        credentials: "include",
    });
    return res.json();
}

async function getInstructores() {
    const res = await fetch(`${API_BASE}/instructors/getAllInstructors`, {
        credentials: "include",
    });
    return res.json();
}

async function getVehiculos() {
    const res = await fetch(`${API_BASE}/vehicles/getAllVehicles`, {
        credentials: "include",
    });
    return res.json();
}

async function getGrados() {
    const res = await fetch(`${API_BASE}/grades/getAllGrades`, {
        credentials: "include",
    });
    return res.json();
}

async function getLevels() {
    const res = await fetch(`${API_BASE}/levels/getAllLevels`, {
        credentials: "include",
    });
    return res.json();
}

document.addEventListener('DOMContentLoaded', async function () {
    let estudiantes = [];
    let instructores = [];
    let vehiculos = [];
    let grados = [];
    let levels = [];

    // Show loading state
    const loadingElements = document.querySelectorAll('.loading-stat');
    loadingElements.forEach(el => el.style.display = 'block');

    // Fetch data from API
    try {
        const dataEst = await getEstudiantes();
        if (dataEst && dataEst.data && Array.isArray(dataEst.data.content)) {
            estudiantes = dataEst.data.content;
        } else if (dataEst && Array.isArray(dataEst.data)) {
            estudiantes = dataEst.data;
        }
    } catch (e) {
        console.error("Error obteniendo estudiantes:", e);
    }

    try {
        const dataInst = await getInstructores();
        if (dataInst && dataInst.data && Array.isArray(dataInst.data.content)) {
            instructores = dataInst.data.content;
        } else if (dataInst && Array.isArray(dataInst.data)) {
            instructores = dataInst.data;
        }
    } catch (e) {
        console.error("Error obteniendo instructores:", e);
    }

    try {
        const dataVeh = await getVehiculos();
        if (dataVeh && dataVeh.data && Array.isArray(dataVeh.data.content)) {
            vehiculos = dataVeh.data.content;
        } else if (dataVeh && Array.isArray(dataVeh.data)) {
            vehiculos = dataVeh.data;
        }
    } catch (e) {
        console.error("Error obteniendo vehículos:", e);
    }

    try {
        const dataGrados = await getGrados();
        if (dataGrados && Array.isArray(dataGrados.data)) {
            grados = dataGrados.data;
        }
    } catch (e) {
        console.error("Error obteniendo grados:", e);
    }

    try {
        const dataLevels = await getLevels();
        if (dataLevels && Array.isArray(dataLevels.data)) {
            levels = dataLevels.data;
        }
    } catch (e) {
        console.error("Error obteniendo levels:", e);
    }

    // Validate data arrays
    if (!Array.isArray(estudiantes)) estudiantes = [];
    if (!Array.isArray(vehiculos)) vehiculos = [];
    if (!Array.isArray(instructores)) instructores = [];
    if (!Array.isArray(grados)) grados = [];
    if (!Array.isArray(levels)) levels = [];

    // Calculate statistics
    const LEVELS = [1, 2, 3];
    let labelsLevels = ['1er Año', '2do Año', '3er Año'];
    let alumnosPorLevel = [0, 0, 0];

    if (levels.length > 0) {
        labelsLevels = levels.map(level => level.levelName);
    }

    alumnosPorLevel = LEVELS.map(level => {
        const gradosDelLevel = grados.filter(grado => grado.levelId === level);
        const gradeIds = gradosDelLevel.map(grado => grado.gradeId);
        return estudiantes.filter(est => gradeIds.includes(Number(est.gradeId))).length;
    });

    // Vehicle types
    const tiposVehiculos = [...new Set(vehiculos.map(v => v.typeName).filter(Boolean))];
    const vehiculosPorTipo = tiposVehiculos.map(tipo =>
        vehiculos.filter(v => v.typeName === tipo).length
    );

    // Instructors by level
    const instructoresPorLevel = LEVELS.map(level =>
        instructores.filter(inst => Number(inst.levelId) === level).length
    );

    // Instructors by role
    const rolesInstructores = [...new Set(instructores.map(i => i.roleName).filter(Boolean))];
    const instructoresPorRol = rolesInstructores.map(rol =>
        instructores.filter(i => i.roleName === rol).length
    );

    // Update statistics cards
    const totalEstudiantes = estudiantes.length;
    const totalVehiculos = vehiculos.length;
    const totalInstructores = instructores.length;

    // Simulate previous month data for percentage calculation
    const estudiantesMesAnterior = Math.floor(totalEstudiantes * 0.92);
    const vehiculosMesAnterior = Math.floor(totalVehiculos * 0.89);
    const instructoresMesAnterior = Math.floor(totalInstructores * 0.95);

    const cambioEstudiantes = totalEstudiantes > 0 ? 
        Math.round(((totalEstudiantes - estudiantesMesAnterior) / estudiantesMesAnterior) * 100) : 0;
    const cambioVehiculos = totalVehiculos > 0 ? 
        Math.round(((totalVehiculos - vehiculosMesAnterior) / vehiculosMesAnterior) * 100) : 0;
    const cambioInstructores = totalInstructores > 0 ? 
        Math.round(((totalInstructores - instructoresMesAnterior) / instructoresMesAnterior) * 100) : 0;

    // Update DOM elements
    updateStatCard('estudiantes', totalEstudiantes, cambioEstudiantes);
    updateStatCard('vehiculos', totalVehiculos, cambioVehiculos);
    updateStatCard('instructores', totalInstructores, cambioInstructores);

    // Hide loading state
    loadingElements.forEach(el => el.style.display = 'none');

    // Render all charts
    renderStudentChart(alumnosPorLevel, labelsLevels);
    renderVehicleChart(vehiculosPorTipo, tiposVehiculos);
    renderInstructorLevelChart(instructoresPorLevel, labelsLevels);
    renderInstructorRoleChart(instructoresPorRol, rolesInstructores);
});

function updateStatCard(type, value, change) {
    const valueEl = document.getElementById(`${type}-count`);
    const changeEl = document.getElementById(`${type}-change`);
    
    if (valueEl) valueEl.textContent = value;
    if (changeEl) {
        const signo = change > 0 ? '+' : '';
        changeEl.textContent = `${signo}${change}%`;
        changeEl.className = 'stat-change';
        if (change > 0) changeEl.classList.add('positive');
        else if (change < 0) changeEl.classList.add('negative');
        else changeEl.classList.add('neutral');
    }
}

function renderStudentChart(data, labels) {
    const chartContainer = document.querySelector("#chart-alumnos");
    if (!chartContainer) return;

    // Calculate percentages for radial chart
    const maxValue = Math.max(...data);
    const percentages = data.map(value => maxValue > 0 ? Math.round((value / maxValue) * 100) : 0);

    const options = {
        series: percentages,
        chart: {
            height: 350, // Increased height
            type: 'radialBar',
            toolbar: { show: false }
        },
        plotOptions: {
            radialBar: {
                offsetY: 0,
                startAngle: -135,
                endAngle: 225,
                hollow: {
                    margin: 5,
                    size: '35%', // Reduced hollow size for more space
                    background: '#fff',
                },
                track: {
                    background: '#f2f2f2',
                    strokeWidth: '97%',
                    margin: 3, // Reduced margin
                },
                dataLabels: {
                    show: true,
                    name: {
                        offsetY: -10,
                        show: true,
                        color: '#888',
                        fontSize: '12px'
                    },
                    value: {
                        formatter: function(val, opts) {
                            return data[opts.seriesIndex] + ' estudiantes';
                        },
                        offsetY: 5,
                        color: '#111',
                        fontSize: '16px',
                        show: true,
                    }
                }
            }
        },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'dark',
                type: 'horizontal',
                shadeIntensity: 0.5,
                gradientToColors: ['#00E396', '#FEB019', '#775DD0'],
                inverseColors: true,
                opacityFrom: 1,
                opacityTo: 1,
                stops: [0, 100]
            }
        },
        stroke: { lineCap: 'round' },
        labels: labels,
        legend: {
            show: true,
            position: 'bottom',
            fontSize: '11px',
            itemMargin: { horizontal: 3, vertical: 3 },
            offsetY: 10
        },
        responsive: [{
            breakpoint: 480,
            options: {
                chart: { height: 320 },
                plotOptions: {
                    radialBar: {
                        hollow: { size: '30%' },
                        dataLabels: {
                            value: { fontSize: '14px' },
                            name: { fontSize: '10px' }
                        }
                    }
                },
                legend: { fontSize: '10px' }
            }
        }, {
            breakpoint: 360,
            options: {
                chart: { height: 300 },
                plotOptions: {
                    radialBar: {
                        dataLabels: {
                            value: { fontSize: '12px' },
                            name: { fontSize: '9px' }
                        }
                    }
                }
            }
        }]
    };

    const chart = new ApexCharts(chartContainer, options);
    chart.render();
}

function renderVehicleChart(data, labels) {
    const chartContainer = document.querySelector("#chart-autos-registrados");
    if (!chartContainer || data.length === 0) return;

    // Calculate dynamic height based on number of categories
    const baseHeight = 250;
    const heightPerCategory = 40;
    const dynamicHeight = Math.max(baseHeight, baseHeight + (labels.length * heightPerCategory));

    const options = {
        series: [{
            name: 'Vehículos',
            data: data
        }],
        chart: {
            height: dynamicHeight,
            type: 'bar',
            toolbar: { show: false }
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                horizontal: false,
                columnWidth: '70%',
                dataLabels: {
                    position: 'top',
                }
            }
        },
        dataLabels: { 
            enabled: true,
            style: {
                fontSize: '12px',
                fontWeight: 'bold',
                colors: ['#333']
            },
            offsetY: -20
        },
        xaxis: {
            categories: labels,
            labels: { 
                style: { 
                    colors: ['#555'], 
                    fontSize: '11px' 
                },
                rotate: labels.length > 3 ? -45 : 0,
                maxHeight: 80
            },
            axisBorder: {
                show: true
            },
            axisTicks: {
                show: true
            }
        },
        yaxis: {
            title: {
                text: 'Cantidad',
                style: { color: '#555', fontSize: '12px', fontWeight: 600 }
            },
            labels: {
                style: { fontSize: '11px' }
            }
        },
        colors: ['#FEB019'],
        grid: { 
            borderColor: '#e0e0e0', 
            strokeDashArray: 4,
            xaxis: {
                lines: {
                    show: false
                }
            }
        },
        tooltip: {
            y: { formatter: function (valor) { return valor + " vehículos"; } }
        },
        responsive: [{
            breakpoint: 480,
            options: {
                chart: { height: Math.max(280, 280 + (labels.length * 25)) },
                xaxis: {
                    labels: { 
                        style: { fontSize: '10px' },
                        rotate: -45
                    }
                },
                plotOptions: {
                    bar: {
                        columnWidth: '80%'
                    }
                }
            }
        }, {
            breakpoint: 360,
            options: {
                chart: { height: Math.max(260, 260 + (labels.length * 20)) },
                dataLabels: {
                    style: { fontSize: '10px' }
                }
            }
        }]
    };

    const chart = new ApexCharts(chartContainer, options);
    chart.render();
}

function renderInstructorLevelChart(data, labels) {
    const chartContainer = document.querySelector("#chart-instructores-level");
    if (!chartContainer) return;

    const options = {
        series: [{
            name: 'Instructores',
            data: data || [0, 0, 0]
        }],
        chart: {
            height: 350,
            type: 'bar',
            toolbar: { show: false }
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                horizontal: false,
                columnWidth: '70%',
                dataLabels: {
                    position: 'top',
                }
            }
        },
        dataLabels: { 
            enabled: true,
            style: {
                fontSize: '12px',
                fontWeight: 'bold',
                colors: ['#333']
            },
            offsetY: -20
        },
        xaxis: {
            categories: labels,
            labels: { 
                style: { 
                    colors: ['#555'], 
                    fontSize: '11px' 
                }
            }
        },
        yaxis: {
            title: {
                text: 'Cantidad',
                style: { color: '#555', fontSize: '12px', fontWeight: 600 }
            },
            labels: {
                style: { fontSize: '11px' }
            }
        },
        colors: ['#775DD0'],
        grid: { 
            borderColor: '#e0e0e0', 
            strokeDashArray: 4,
            xaxis: {
                lines: {
                    show: false
                }
            }
        },
        tooltip: {
            y: { formatter: function (valor) { return valor + " instructores"; } }
        },
        responsive: [{
            breakpoint: 480,
            options: {
                chart: { height: 320 },
                xaxis: {
                    labels: { style: { fontSize: '10px' } }
                },
                plotOptions: {
                    bar: {
                        columnWidth: '80%'
                    }
                }
            }
        }, {
            breakpoint: 360,
            options: {
                chart: { height: 300 },
                dataLabels: {
                    style: { fontSize: '10px' }
                }
            }
        }]
    };

    const chart = new ApexCharts(chartContainer, options);
    chart.render();
}

function renderInstructorRoleChart(data, labels) {
    const chartContainer = document.querySelector("#chart-instructores-rol");
    if (!chartContainer || data.length === 0) return;

    // Calculate dynamic height based on number of roles
    const baseHeight = 250;
    const heightPerRole = 50;
    const dynamicHeight = Math.max(baseHeight, baseHeight + (labels.length * heightPerRole));

    const options = {
        series: [{
            name: 'Instructores',
            data: data
        }],
        chart: {
            height: dynamicHeight,
            type: 'bar',
            toolbar: { show: false }
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                horizontal: false,
                columnWidth: '70%',
                dataLabels: {
                    position: 'top',
                }
            }
        },
        dataLabels: { 
            enabled: true,
            style: {
                fontSize: '12px',
                fontWeight: 'bold',
                colors: ['#333']
            },
            offsetY: -20
        },
        xaxis: {
            categories: labels,
            labels: { 
                style: { 
                    colors: ['#555'], 
                    fontSize: '11px' 
                },
                rotate: labels.length > 2 ? -45 : 0,
                maxHeight: 100
            },
            axisBorder: {
                show: true
            },
            axisTicks: {
                show: true
            }
        },
        yaxis: {
            title: {
                text: 'Cantidad',
                style: { color: '#555', fontSize: '12px', fontWeight: 600 }
            },
            labels: {
                style: { fontSize: '11px' }
            }
        },
        colors: ['#FF4560'],
        grid: { 
            borderColor: '#e0e0e0', 
            strokeDashArray: 4,
            xaxis: {
                lines: {
                    show: false
                }
            }
        },
        tooltip: {
            y: { formatter: function (valor) { return valor + " instructores"; } }
        },
        responsive: [{
            breakpoint: 480,
            options: {
                chart: { height: Math.max(300, 300 + (labels.length * 30)) },
                xaxis: {
                    labels: { 
                        style: { fontSize: '10px' },
                        rotate: -45
                    }
                },
                plotOptions: {
                    bar: {
                        columnWidth: '80%'
                    }
                }
            }
        }, {
            breakpoint: 360,
            options: {
                chart: { height: Math.max(280, 280 + (labels.length * 25)) },
                dataLabels: {
                    style: { fontSize: '10px' }
                }
            }
        }]
    };

    const chart = new ApexCharts(chartContainer, options);
    chart.render();
}

// Print functionality for individual charts
function printChart(containerId, chartTitle) {
    const chartContainer = document.getElementById(containerId);
    if (!chartContainer) return;

    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    // Get current date
    const currentDate = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Clone the chart container and remove the print button
    const clonedContainer = chartContainer.cloneNode(true);
    const printButton = clonedContainer.querySelector('.print-btn');
    if (printButton) {
        printButton.remove();
    }
    
    // Clean up the title to remove extra spaces
    const titleElement = clonedContainer.querySelector('h2');
    if (titleElement) {
        titleElement.textContent = chartTitle;
        titleElement.style.textAlign = 'center';
        titleElement.style.display = 'block';
    }

    // Create the print content
    const printContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reporte - ${chartTitle}</title>
            <style>
                body {
                    font-family: 'Arial', sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: white;
                    color: #333;
                }
                .print-header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #333;
                    padding-bottom: 20px;
                }
                .print-header h1 {
                    margin: 0;
                    font-size: 24px;
                    color: #2c3e50;
                }
                .print-header h2 {
                    margin: 10px 0 0 0;
                    font-size: 18px;
                    color: #7f8c8d;
                    font-weight: normal;
                }
                .print-date {
                    margin: 15px 0 0 0;
                    font-size: 14px;
                    color: #95a5a6;
                }
                .chart-content {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 400px;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    background: #f9f9f9;
                }
                .chart-content h2 {
                    color: #2c3e50 !important;
                    font-size: 1.4em !important;
                    margin-bottom: 15px !important;
                    text-align: center !important;
                    display: block !important;
                }
                .print-footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    font-size: 12px;
                    color: #7f8c8d;
                }
                .print-btn {
                    display: none !important;
                }
                @media print {
                    body { margin: 0; }
                    .chart-content { 
                        border: none; 
                        background: white;
                        min-height: auto;
                    }
                    .print-btn {
                        display: none !important;
                    }
                }
                /* Ensure ApexCharts styles are preserved */
                .apexcharts-canvas {
                    background: white !important;
                }
                .apexcharts-svg {
                    background: white !important;
                }
            </style>
        </head>
        <body>
            <div class="print-header">
                <h1>Sistema de Gestión de Mantenimiento Automotriz</h1>
                <h2>Reporte: ${chartTitle}</h2>
                <p class="print-date">Generado el: ${currentDate}</p>
            </div>
            <div class="chart-content">
                ${clonedContainer.innerHTML}
            </div>
            <div class="print-footer">
                <p>© ${new Date().getFullYear()} SGMA - Sistema de Gestión de Mantenimiento Automotriz</p>
                <p>Este reporte fue generado automáticamente desde la aplicación móvil</p>
            </div>
            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                        window.onafterprint = function() {
                            window.close();
                        };
                    }, 1000);
                };
            </script>
        </body>
        </html>
    `;

    // Write content to the new window
    printWindow.document.write(printContent);
    printWindow.document.close();
}

// Add global print all function
function printAllReports() {
    // Create a new window for printing all reports
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    const currentDate = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const statsSection = document.querySelector('.stats-section');
    const chartContainers = document.querySelectorAll('.chart-container');
    
    let chartsContent = '';
    chartContainers.forEach((container, index) => {
        // Clone container and remove print button
        const clonedContainer = container.cloneNode(true);
        const printButton = clonedContainer.querySelector('.print-btn');
        if (printButton) {
            printButton.remove();
        }
        
        const titleElement = clonedContainer.querySelector('h2');
        const title = titleElement ? titleElement.textContent.trim() : `Gráfico ${index + 1}`;
        
        if (titleElement) {
            titleElement.style.textAlign = 'center';
            titleElement.style.display = 'block';
            titleElement.style.marginBottom = '20px';
        }
        
        chartsContent += `
            <div class="chart-page" ${index > 0 ? 'style="page-break-before: always;"' : ''}>
                <div style="display: flex; justify-content: center; margin-bottom: 40px;">
                    ${clonedContainer.innerHTML}
                </div>
            </div>
        `;
    });

    const printContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reporte Completo - SGMA</title>
            <style>
                body {
                    font-family: 'Arial', sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: white;
                    color: #333;
                }
                .print-header {
                    text-align: center;
                    margin-bottom: 40px;
                    border-bottom: 2px solid #333;
                    padding-bottom: 20px;
                }
                .print-header h1 {
                    margin: 0;
                    font-size: 28px;
                    color: #2c3e50;
                }
                .print-date {
                    margin: 15px 0 0 0;
                    font-size: 14px;
                    color: #95a5a6;
                }
                .stats-overview {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                    margin-bottom: 40px;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 8px;
                }
                .stat-item {
                    text-align: center;
                    padding: 15px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .stat-number {
                    font-size: 24px;
                    font-weight: bold;
                    color: #2c3e50;
                }
                .stat-label {
                    font-size: 12px;
                    color: #7f8c8d;
                    text-transform: uppercase;
                }
                .chart-page {
                    margin-bottom: 40px;
                }
                .chart-page h2 {
                    color: #2c3e50 !important;
                    font-size: 1.4em !important;
                    margin-bottom: 15px !important;
                    text-align: center !important;
                    display: block !important;
                }
                .print-btn {
                    display: none !important;
                }
                @page {
                    margin: 2cm;
                    size: A4;
                }
                @media print {
                    body { margin: 0; }
                    .chart-page { page-break-inside: avoid; }
                    .print-btn { display: none !important; }
                }
                /* Ensure ApexCharts styles are preserved */
                .apexcharts-canvas {
                    background: white !important;
                }
                .apexcharts-svg {
                    background: white !important;
                }
            </style>
        </head>
        <body>
            <div class="print-header">
                <h1>Reporte Completo de Estadísticas</h1>
                <p>Sistema de Gestión de Mecánica Automotriz</p>
                <p class="print-date">Generado el: ${currentDate}</p>
            </div>
            <div class="stats-overview">
                ${statsSection ? statsSection.innerHTML.replace(/class="stat-card"/g, 'class="stat-item"') : ''}
            </div>
            ${chartsContent}
            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #7f8c8d;">
                <p>© ${new Date().getFullYear()} SGMA - Sistema de Gestión de Mecánica Automotriz</p>
            </div>
            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                        window.onafterprint = function() {
                            window.close();
                        };
                    }, 1500);
                };
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
}