class FlowerShopApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.init();
    }

    async init() {
        this.setupNavigation();
        this.setupModals();
        this.setupEventListeners();
        await this.loadInitialData();
        this.showSection('dashboard');
    }

    // Navegación entre secciones
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('data-section');
                this.showSection(sectionId);
                
                // Actualizar estados activos
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
    }

    showSection(sectionId) {
        // Ocultar todas las secciones
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => section.style.display = 'none');
        
        // Mostrar la sección seleccionada
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
            this.currentSection = sectionId;
            
            // Cargar datos específicos de la sección
            this.loadSectionData(sectionId);
        }
    }

    async loadSectionData(sectionId) {
        try {
            switch (sectionId) {
                case 'dashboard':
                    await this.loadDashboardData();
                    break;
                case 'productos':
                    await this.loadProductos();
                    break;
                case 'clientes':
                    await this.loadClientes();
                    break;
                case 'eventos':
                    await this.loadEventos();
                    break;
                case 'pedidos':
                    await this.loadPedidos();
                    break;
                case 'inventario':
                    await this.loadInventario();
                    break;
                case 'reportes':
                    await this.loadReportes();
                    break;
            }
        } catch (error) {
            console.error(`Error cargando datos de ${sectionId}:`, error);
            this.showNotification('Error cargando datos', 'error');
        }
    }

    // Dashboard
    async loadDashboardData() {
        try {
            const [stats, lowStock, recentSales, upcomingEvents] = await Promise.all([
                window.flowerShopAPI.getStats(),
                window.flowerShopAPI.getLowStockProducts(),
                window.flowerShopAPI.getRecentSales(),
                window.flowerShopAPI.getUpcomingEvents()
            ]);

            this.updateDashboardStats(stats);
            this.updateLowStockList(lowStock);
            this.updateRecentSales(recentSales);
            this.updateUpcomingEvents(upcomingEvents);
        } catch (error) {
            console.error('Error cargando dashboard:', error);
        }
    }

    updateDashboardStats(stats) {
        document.getElementById('totalProductos').textContent = stats.totalProductos || 0;
        document.getElementById('totalClientes').textContent = stats.totalClientes || 0;
        document.getElementById('pedidosHoy').textContent = stats.pedidosHoy || 0;
        document.getElementById('eventosActivos').textContent = stats.eventosActivos || 0;
        
        // Ventas del mes
        const salesAmount = document.querySelector('.sales-amount');
        if (salesAmount) {
            salesAmount.textContent = window.flowerShopAPI.formatCurrency(stats.ventasMes || 0);
        }
    }

    updateLowStockList(products) {
        const container = document.querySelector('.stock-list');
        if (!container) return;

        container.innerHTML = products.map(product => `
            <div class="stock-item">
                <span>${product.nombre}</span>
                <span class="stock-quantity ${product.stock_actual <= product.stock_minimo ? 'low' : ''}">${product.stock_actual}</span>
            </div>
        `).join('');
    }

    updateRecentSales(sales) {
        // Implementar actualización de ventas recientes
        console.log('Ventas recientes:', sales);
    }

    updateUpcomingEvents(events) {
        // Implementar actualización de eventos próximos
        console.log('Eventos próximos:', events);
    }

    // Productos
    async loadProductos() {
        try {
            const [productos, categorias] = await Promise.all([
                window.flowerShopAPI.getProductos(),
                window.flowerShopAPI.getCategorias()
            ]);

            this.displayProductos(productos);
            this.loadCategoriasFilter(categorias);
        } catch (error) {
            console.error('Error cargando productos:', error);
        }
    }

    displayProductos(productos) {
        const tbody = document.querySelector('#productosTable tbody');
        if (!tbody) return;

        tbody.innerHTML = productos.map(producto => `
            <tr>
                <td>${producto.codigo}</td>
                <td>${producto.nombre}</td>
                <td>${producto.categoria_nombre}</td>
                <td>${window.flowerShopAPI.formatCurrency(producto.precio)}</td>
                <td>${producto.stock_actual}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="app.editProducto(${producto.id})">Editar</button>
                    <button class="btn btn-sm btn-secondary" onclick="app.deleteProducto(${producto.id})">Eliminar</button>
                </td>
            </tr>
        `).join('');
    }

    loadCategoriasFilter(categorias) {
        const select = document.getElementById('categoriaFilter');
        if (!select) return;

        select.innerHTML = '<option value="">Todas las categorías</option>' +
            categorias.map(cat => `<option value="${cat.id}">${cat.nombre}</option>`).join('');
    }

    // Clientes
    async loadClientes() {
        try {
            const clientes = await window.flowerShopAPI.getClientes();
            this.displayClientes(clientes);
        } catch (error) {
            console.error('Error cargando clientes:', error);
        }
    }

    displayClientes(clientes) {
        const tbody = document.querySelector('#clientesTable tbody');
        if (!tbody) return;

        tbody.innerHTML = clientes.map(cliente => `
            <tr>
                <td>${cliente.nombre}</td>
                <td>${cliente.telefono || '-'}</td>
                <td>${cliente.email || '-'}</td>
                <td>${cliente.total_pedidos}</td>
                <td>${window.flowerShopAPI.formatCurrency(cliente.total_gastado || 0)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="app.editCliente(${cliente.id})">Editar</button>
                    <button class="btn btn-sm btn-secondary" onclick="app.deleteCliente(${cliente.id})">Eliminar</button>
                </td>
            </tr>
        `).join('');
    }

    // Eventos
    async loadEventos() {
        try {
            const eventos = await window.flowerShopAPI.getEventos();
            this.displayEventos(eventos);
        } catch (error) {
            console.error('Error cargando eventos:', error);
        }
    }

    displayEventos(eventos) {
        const container = document.querySelector('.eventos-grid');
        if (!container) return;

        container.innerHTML = eventos.map(evento => `
            <div class="evento-card">
                <div class="evento-header">
                    <div class="evento-title">${evento.nombre}</div>
                    <div class="evento-dates">
                        ${window.flowerShopAPI.formatDate(evento.fecha_inicio)} - 
                        ${window.flowerShopAPI.formatDate(evento.fecha_fin)}
                    </div>
                </div>
                <div class="evento-body">
                    <div class="evento-info">
                        <span class="evento-badge ${evento.demanda.toLowerCase()}">${evento.demanda}</span>
                        <span>${evento.productos_especiales?.length || 0} productos especiales</span>
                    </div>
                    <p>${evento.descripcion}</p>
                    <div class="evento-actions">
                        <button class="btn btn-primary" onclick="app.editEvento(${evento.id})">Editar</button>
                        <button class="btn btn-secondary" onclick="app.manageEventoProducts(${evento.id})">Productos</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Pedidos
    async loadPedidos() {
        try {
            const pedidos = await window.flowerShopAPI.getPedidos();
            this.displayPedidos(pedidos);
        } catch (error) {
            console.error('Error cargando pedidos:', error);
        }
    }

    displayPedidos(pedidos) {
        const tbody = document.querySelector('#pedidosTable tbody');
        if (!tbody) return;

        tbody.innerHTML = pedidos.map(pedido => `
            <tr>
                <td>#${pedido.id.toString().padStart(4, '0')}</td>
                <td>${pedido.cliente_nombre}</td>
                <td>${window.flowerShopAPI.formatDate(pedido.fecha)}</td>
                <td>${window.flowerShopAPI.formatCurrency(pedido.total)}</td>
                <td><span class="estado-badge ${pedido.estado}">${pedido.estado}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="app.viewPedido(${pedido.id})">Ver</button>
                    <button class="btn btn-sm btn-secondary" onclick="app.updatePedidoStatus(${pedido.id})">Estado</button>
                </td>
            </tr>
        `).join('');
    }

    // Inventario
    async loadInventario() {
        try {
            const [movimientos, resumen] = await Promise.all([
                window.flowerShopAPI.getInventarioMovimientos(),
                window.flowerShopAPI.getInventarioResumen()
            ]);

            this.displayInventarioMovimientos(movimientos);
            this.displayInventarioResumen(resumen);
        } catch (error) {
            console.error('Error cargando inventario:', error);
        }
    }

    displayInventarioMovimientos(movimientos) {
        const tbody = document.querySelector('#inventarioTable tbody');
        if (!tbody) return;

        tbody.innerHTML = movimientos.map(mov => `
            <tr>
                <td>${window.flowerShopAPI.formatDate(mov.fecha)}</td>
                <td>${mov.producto_nombre}</td>
                <td>${mov.tipo}</td>
                <td class="${mov.cantidad > 0 ? 'text-success' : 'text-danger'}">
                    ${mov.cantidad > 0 ? '+' : ''}${mov.cantidad}
                </td>
                <td>${mov.motivo || '-'}</td>
            </tr>
        `).join('');
    }

    displayInventarioResumen(resumen) {
        // Implementar resumen de inventario
        console.log('Resumen inventario:', resumen);
    }

    // Modales
    setupModals() {
        // Cerrar modales al hacer click en el overlay
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
        });

        // Cerrar modales con botón close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close')) {
                const modal = e.target.closest('.modal');
                if (modal) this.closeModal(modal);
            }
        });

        // Cerrar modales con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal[style*="block"]');
                if (openModal) this.closeModal(openModal);
            }
        });
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modal) {
        if (typeof modal === 'string') {
            modal = document.getElementById(modal);
        }
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            // Limpiar formularios
            const forms = modal.querySelectorAll('form');
            forms.forEach(form => form.reset());
        }
    }

    // Event Listeners
    setupEventListeners() {
        // Filtros de productos
        const categoriaFilter = document.getElementById('categoriaFilter');
        const stockFilter = document.getElementById('stockFilter');
        
        if (categoriaFilter) {
            categoriaFilter.addEventListener('change', () => this.filterProductos());
        }
        
        if (stockFilter) {
            stockFilter.addEventListener('change', () => this.filterProductos());
        }

        // Filtros de pedidos
        const estadoFilter = document.getElementById('estadoFilter');
        const fechaFilter = document.getElementById('fechaFilter');
        
        if (estadoFilter) {
            estadoFilter.addEventListener('change', () => this.filterPedidos());
        }
        
        if (fechaFilter) {
            fechaFilter.addEventListener('change', () => this.filterPedidos());
        }

        // Botones de agregar
        const addButtons = {
            'addProducto': () => this.showAddProductoModal(),
            'addCliente': () => this.showAddClienteModal(),
            'addEvento': () => this.showAddEventoModal(),
            'addPedido': () => this.showAddPedidoModal()
        };

        Object.entries(addButtons).forEach(([id, handler]) => {
            const button = document.getElementById(id);
            if (button) button.addEventListener('click', handler);
        });

        // Formularios
        this.setupForms();
    }

    setupForms() {
        // Formulario de producto
        const productoForm = document.getElementById('productoForm');
        if (productoForm) {
            productoForm.addEventListener('submit', (e) => this.handleProductoSubmit(e));
        }

        // Formulario de cliente
        const clienteForm = document.getElementById('clienteForm');
        if (clienteForm) {
            clienteForm.addEventListener('submit', (e) => this.handleClienteSubmit(e));
        }

        // Formulario de evento
        const eventoForm = document.getElementById('eventoForm');
        if (eventoForm) {
            eventoForm.addEventListener('submit', (e) => this.handleEventoSubmit(e));
        }

        // Formulario de pedido
        const pedidoForm = document.getElementById('pedidoForm');
        if (pedidoForm) {
            pedidoForm.addEventListener('submit', (e) => this.handlePedidoSubmit(e));
        }
    }

    // Handlers CRUD - Productos
    showAddProductoModal() {
        this.clearProductoForm();
        this.loadCategoriasInForm();
        this.showModal('productoModal');
    }

    async loadCategoriasInForm() {
        try {
            const categorias = await window.flowerShopAPI.getCategorias();
            const select = document.getElementById('productoCategoria');
            if (select) {
                select.innerHTML = '<option value="">Seleccionar categoría</option>' +
                    categorias.map(cat => `<option value="${cat.id}">${cat.nombre}</option>`).join('');
            }
        } catch (error) {
            console.error('Error cargando categorías:', error);
        }
    }

    clearProductoForm() {
        const form = document.getElementById('productoForm');
        if (form) {
            form.reset();
            form.setAttribute('data-id', '');
        }
    }

    async handleProductoSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        const id = e.target.getAttribute('data-id');

        try {
            if (id) {
                await window.flowerShopAPI.updateProducto(id, data);
                this.showNotification('Producto actualizado correctamente');
            } else {
                await window.flowerShopAPI.createProducto(data);
                this.showNotification('Producto creado correctamente');
            }
            
            this.closeModal('productoModal');
            await this.loadProductos();
        } catch (error) {
            console.error('Error guardando producto:', error);
            this.showNotification('Error guardando producto', 'error');
        }
    }

    async editProducto(id) {
        try {
            const producto = await window.flowerShopAPI.getProducto(id);
            this.fillProductoForm(producto);
            await this.loadCategoriasInForm();
            this.showModal('productoModal');
        } catch (error) {
            console.error('Error cargando producto:', error);
            this.showNotification('Error cargando producto', 'error');
        }
    }

    fillProductoForm(producto) {
        const form = document.getElementById('productoForm');
        if (!form) return;

        form.setAttribute('data-id', producto.id);
        form.querySelector('[name="codigo"]').value = producto.codigo;
        form.querySelector('[name="nombre"]').value = producto.nombre;
        form.querySelector('[name="descripcion"]').value = producto.descripcion || '';
        form.querySelector('[name="precio"]').value = producto.precio;
        form.querySelector('[name="stock_actual"]').value = producto.stock_actual;
        form.querySelector('[name="stock_minimo"]').value = producto.stock_minimo;
        
        // Categoría se carga después del loadCategoriasInForm
        setTimeout(() => {
            const select = form.querySelector('[name="categoria_id"]');
            if (select) select.value = producto.categoria_id;
        }, 100);
    }

    async deleteProducto(id) {
        if (!confirm('¿Estás seguro de eliminar este producto?')) return;

        try {
            await window.flowerShopAPI.deleteProducto(id);
            this.showNotification('Producto eliminado correctamente');
            await this.loadProductos();
        } catch (error) {
            console.error('Error eliminando producto:', error);
            this.showNotification('Error eliminando producto', 'error');
        }
    }

    // Handlers CRUD - Clientes
    showAddClienteModal() {
        this.clearClienteForm();
        this.showModal('clienteModal');
    }

    clearClienteForm() {
        const form = document.getElementById('clienteForm');
        if (form) {
            form.reset();
            form.setAttribute('data-id', '');
        }
    }

    async handleClienteSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        const id = e.target.getAttribute('data-id');

        try {
            if (id) {
                await window.flowerShopAPI.updateCliente(id, data);
                this.showNotification('Cliente actualizado correctamente');
            } else {
                await window.flowerShopAPI.createCliente(data);
                this.showNotification('Cliente creado correctamente');
            }
            
            this.closeModal('clienteModal');
            await this.loadClientes();
        } catch (error) {
            console.error('Error guardando cliente:', error);
            this.showNotification('Error guardando cliente', 'error');
        }
    }

    // Filtros
    async filterProductos() {
        const categoria = document.getElementById('categoriaFilter')?.value;
        const stock = document.getElementById('stockFilter')?.value;
        
        try {
            const productos = await window.flowerShopAPI.getProductos({ categoria, stock });
            this.displayProductos(productos);
        } catch (error) {
            console.error('Error filtrando productos:', error);
        }
    }

    async filterPedidos() {
        const estado = document.getElementById('estadoFilter')?.value;
        const fecha = document.getElementById('fechaFilter')?.value;
        
        try {
            const pedidos = await window.flowerShopAPI.getPedidos({ estado, fecha });
            this.displayPedidos(pedidos);
        } catch (error) {
            console.error('Error filtrando pedidos:', error);
        }
    }

    // Notificaciones
    showNotification(message, type = 'success') {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Estilos inline para la notificación
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            color: 'white',
            backgroundColor: type === 'success' ? '#4caf50' : '#f44336',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            zIndex: '2000',
            animation: 'slideInRight 0.3s ease-out'
        });

        document.body.appendChild(notification);

        // Remover después de 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Datos iniciales
    async loadInitialData() {
        try {
            // Cargar datos básicos necesarios para la aplicación
            await this.loadDashboardData();
        } catch (error) {
            console.error('Error cargando datos iniciales:', error);
        }
    }
}

// CSS para animaciones de notificaciones
const notificationStyles = `
@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOutRight {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}
`;

// Agregar estilos al documento
const styleElement = document.createElement('style');
styleElement.textContent = notificationStyles;
document.head.appendChild(styleElement);

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FlowerShopApp();
});

// Funciones auxiliares globales para los onclick en HTML
window.editProducto = (id) => window.app.editProducto(id);
window.deleteProducto = (id) => window.app.deleteProducto(id);
window.editCliente = (id) => window.app.editCliente(id);
window.deleteCliente = (id) => window.app.deleteCliente(id);
window.editEvento = (id) => window.app.editEvento(id);
window.manageEventoProducts = (id) => window.app.manageEventoProducts(id);
window.viewPedido = (id) => window.app.viewPedido(id);
window.updatePedidoStatus = (id) => window.app.updatePedidoStatus(id);
