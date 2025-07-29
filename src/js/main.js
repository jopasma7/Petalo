class FlowerShopApp {
    // Actualiza los badges del sidebar con los valores reales
    async updateSidebarBadges() {
        try {
            const [productos, clientes, eventos, pedidos] = await Promise.all([
                window.flowerShopAPI.getProductos(),
                window.flowerShopAPI.getClientes(),
                window.flowerShopAPI.getEventos(),
                window.flowerShopAPI.getPedidos()
            ]);
            const badgeProductos = document.getElementById('badge-productos');
            const badgeClientes = document.getElementById('badge-clientes');
            const badgeEventos = document.getElementById('badge-eventos');
            const badgePedidos = document.getElementById('badge-pedidos');
            if (badgeProductos) badgeProductos.textContent = productos.length;
            if (badgeClientes) badgeClientes.textContent = clientes.length;
            if (badgeEventos) badgeEventos.textContent = eventos.length;
            if (badgePedidos) {
                badgePedidos.textContent = pedidos.length;
                // Buscar pedidos pendientes
                const pendientes = pedidos.filter(p => p.estado && p.estado.toLowerCase() === 'pendiente');
                if (pendientes.length > 0) {
                    badgePedidos.classList.add('new');
                } else {
                    badgePedidos.classList.remove('new');
                }
            }
        } catch (error) {
            console.error('❌ Error actualizando badges del sidebar:', error);
        }
    }
    constructor() {
        this.currentSection = 'dashboard';
        this.init();
    }

    async init() {
        console.log('🌸 Iniciando aplicación de floristería...');
        this.setupNavigation();
        this.setupModals();
        this.setupEventListeners();
        await this.updateSidebarBadges();
        await this.loadInitialData();
        this.showSection('dashboard');
    }

    // ========== NAVEGACIÓN ==========
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
        const targetSection = document.getElementById(sectionId + '-section');
        if (targetSection) {
            targetSection.style.display = 'block';
            this.currentSection = sectionId;
            
            // Actualizar breadcrumbs
            this.updateBreadcrumbs(sectionId);
            
            // Cargar datos específicos de la sección
            this.loadSectionData(sectionId);
        }
        // Actualiza el sidebar activo
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.dataset.section === sectionId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        // Si la navegación viene desde el dashboard, también actualiza el color del dashboard si corresponde
        if (sectionId === 'dashboard') {
            document.querySelectorAll('.nav-link[data-section]').forEach(link => {
                if (link.dataset.section === 'dashboard') {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
        }
    }

    async loadSectionData(sectionId) {
        console.log(`📊 Cargando datos de: ${sectionId}`);
        try {
            switch (sectionId) {
                case 'dashboard':
                    await this.loadDashboardData();
                    break;
                case 'productos':
                    await this.loadProductosData();
                    break;
                case 'clientes':
                    await this.loadClientesData();
                    break;
                case 'eventos':
                    await this.loadEventosData();
                    break;
                case 'pedidos':
                    await this.loadPedidosData();
                    break;
                case 'inventario':
                    await this.loadInventarioData();
                    break;
                case 'reportes':
                    await this.loadReportesData();
                    break;
                case 'configuracion':
                    await this.loadConfiguracionData();
                    break;
            }
        } catch (error) {
            console.error(`❌ Error cargando datos de ${sectionId}:`, error);
            this.showNotification('Error cargando datos de la sección', 'error');
        }
    }

    // ========== DASHBOARD ==========
    async loadDashboardData() {
        try {
            console.log('📈 Cargando dashboard...');
            const stats = await window.flowerShopAPI.getEstadisticas();
            
            // Actualizar estadísticas principales
            this.updateElement('total-productos', stats.totalProductos || 0);
            this.updateElement('total-clientes', stats.totalClientes || 0);
            this.updateElement('pedidos-pendientes', stats.pedidosPendientes || 0);
            this.updateElement('eventos-activos', stats.eventosActivos || 0);
            
            // Actualizar ventas del mes
            this.updateElement('ventas-mes', window.flowerShopAPI.formatCurrency(stats.ventasMesActual || 0));
            
            // Actualizar productos con stock bajo
            this.updateStockBajo(stats.stockBajo || []);
            
            // Cargar próximos eventos
            const eventos = await window.flowerShopAPI.getEventos();
            this.updateProximosEventos(eventos);
            
        } catch (error) {
            console.error('❌ Error cargando dashboard:', error);
            this.showNotification('Error cargando el dashboard', 'error');
        }
    }

    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }

    updateStockBajo(productos) {
        const container = document.getElementById('stock-bajo-list');
        if (!container) return;

        if (productos.length > 0) {
            container.innerHTML = productos.map(producto => `
                <div class="stock-item warning">
                    <span class="producto-nombre">${producto.nombre}</span>
                    <span class="stock-info">${producto.stock_actual}/${producto.stock_minimo} unidades</span>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-success">✅ Todos los productos tienen stock suficiente</p>';
        }
    }

    updateProximosEventos(eventos) {
        const container = document.getElementById('proximos-eventos');
        if (!container) return;

        const proximosEventos = eventos
            .filter(evento => new Date(evento.fecha_inicio) >= new Date())
            .sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio))
            .slice(0, 3);

        if (proximosEventos.length > 0) {
            container.innerHTML = proximosEventos.map(evento => `
                <div class="evento-item">
                    <div class="evento-fecha">${window.flowerShopAPI.formatDate(evento.fecha_inicio)}</div>
                    <div class="evento-nombre">${evento.nombre}</div>
                    <div class="evento-tipo">${evento.tipo_evento}</div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p>📅 No hay eventos próximos programados</p>';
        }
    }

    // ========== PRODUCTOS ==========
    async loadProductosData() {
        try {
            console.log('🌺 Cargando productos...');
            const productos = await window.flowerShopAPI.getProductos();
            this.displayProductos(productos);
            await this.updateSidebarBadges();
        } catch (error) {
            console.error('❌ Error cargando productos:', error);
            this.showNotification('Error cargando productos', 'error');
        }
    }

    displayProductos(productos) {
        const tbody = document.querySelector('#productos-table tbody');
        if (!tbody) return;

        if (productos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay productos registrados</td></tr>';
            return;
        }

        tbody.innerHTML = productos.map(producto => `
            <tr data-id="${producto.id}">
                <td>${producto.codigo_producto || 'N/A'}</td>
                <td>
                    <div class="producto-info">
                        <span class="producto-nombre">${producto.nombre}</span>
                        <small class="producto-categoria">${producto.categoria_icono} ${producto.categoria_nombre}</small>
                    </div>
                </td>
                <td>${producto.categoria_nombre}</td>
                <td>
                    <span class="stock-badge ${producto.stock_actual <= producto.stock_minimo ? 'low-stock' : 'normal-stock'}">
                        ${producto.stock_actual} ${producto.unidad_medida}
                    </span>
                </td>
                <td>${window.flowerShopAPI.formatCurrency(producto.precio_venta)}</td>
                <td>
                    <span class="status-badge ${producto.activo ? 'active' : 'inactive'}">
                        ${producto.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="app.editarProducto(${producto.id})" title="Editar">
                            ✏️
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="app.verProducto(${producto.id})" title="Ver detalles">
                            👁️
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="app.eliminarProducto(${producto.id})" title="Eliminar">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // ========== CLIENTES ==========
    async loadClientesData() {
        try {
            console.log('👥 Cargando clientes...');
            const clientes = await window.flowerShopAPI.getClientes();
            this.displayClientes(clientes);
            await this.updateSidebarBadges();
        } catch (error) {
            console.error('❌ Error cargando clientes:', error);
            this.showNotification('Error cargando clientes', 'error');
        }
    }

    displayClientes(clientes) {
        const tbody = document.querySelector('#clientes-table tbody');
        if (!tbody) return;

        if (clientes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay clientes registrados</td></tr>';
            return;
        }

        tbody.innerHTML = clientes.map(cliente => `
            <tr data-id="${cliente.id}">
                <td>${cliente.nombre} ${cliente.apellidos || ''}</td>
                <td>${cliente.telefono || 'N/A'}</td>
                <td>${cliente.email || 'N/A'}</td>
                <td>
                    <span class="cliente-tipo ${cliente.tipo_cliente}">${cliente.tipo_cliente}</span>
                </td>
                <td>${window.flowerShopAPI.formatCurrency(cliente.total_compras || 0)}</td>
                <td>${cliente.ultima_compra ? window.flowerShopAPI.formatDate(cliente.ultima_compra) : 'N/A'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="app.editarCliente(${cliente.id})" title="Editar">
                            ✏️
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="app.verCliente(${cliente.id})" title="Ver historial">
                            👁️
                        </button>
                        <button class="btn btn-sm btn-success" onclick="app.nuevoPedidoCliente(${cliente.id})" title="Nuevo pedido">
                            📋
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // ========== EVENTOS ==========
    async loadEventosData() {
        try {
            console.log('🎉 Cargando eventos...');
            const eventos = await window.flowerShopAPI.getEventos();
            this.displayEventos(eventos);
            await this.updateSidebarBadges();
        } catch (error) {
            console.error('❌ Error cargando eventos:', error);
            this.showNotification('Error cargando eventos', 'error');
        }
    }

    displayEventos(eventos) {
        const container = document.getElementById('eventos-grid');
        if (!container) return;

        if (eventos.length === 0) {
            container.innerHTML = '<p class="text-center">No hay eventos registrados</p>';
            return;
        }

        container.innerHTML = eventos.map(evento => {
            const fechaInicio = new Date(evento.fecha_inicio);
            const fechaFin = new Date(evento.fecha_fin);
            const hoy = new Date();
            const esActivo = fechaInicio <= hoy && fechaFin >= hoy;
            const esProximo = fechaInicio > hoy;
            
            return `
                <div class="evento-card ${esActivo ? 'activo' : ''} ${esProximo ? 'proximo' : ''}" data-id="${evento.id}">
                    <div class="evento-header">
                        <h3>${evento.nombre}</h3>
                    </div>
                    <hr class="evento-header-hr" />
                    <div class="evento-details">
                        <p><strong>Tipo:</strong> ${evento.tipo_evento}</p>
                        <p><strong>Fechas:</strong> ${window.flowerShopAPI.formatDate(evento.fecha_inicio)} - ${window.flowerShopAPI.formatDate(evento.fecha_fin)}</p>
                        <p><strong>Demanda esperada:</strong> ${evento.demanda_esperada}</p>
                        ${evento.descuento_especial > 0 ? `<p><strong>Descuento:</strong> ${evento.descuento_especial}%</p>` : ''}
                        <p class="evento-descripcion">${evento.descripcion}</p>
                    </div>
                    <div class="evento-actions">
                        <button class="btn btn-sm btn-primary" onclick="app.editarEvento(${evento.id})">
                            ✏️ Editar
                        </button>
                        <button class="btn btn-sm btn-success" onclick="app.gestionarEventoStock(${evento.id})">
                            📦 Stock
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="app.eliminarEvento(${evento.id})">
                            🗑️ Eliminar
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
    // ========== PEDIDOS ==========
    async loadPedidosData() {
        try {
            console.log('📋 Cargando pedidos...');
            const pedidos = await window.flowerShopAPI.getPedidos();
            this.displayPedidos(pedidos);
            await this.updateSidebarBadges();
        } catch (error) {
            console.error('❌ Error cargando pedidos:', error);
            this.showNotification('Error cargando pedidos', 'error');
        }
    }

    displayPedidos(pedidos) {
        const tbody = document.querySelector('#pedidos-table tbody');
        if (!tbody) return;

        if (!pedidos || pedidos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay pedidos registrados</td></tr>';
            return;
        }

        tbody.innerHTML = pedidos.map(pedido => {
            const estadoBadge = `<span class="badge-estado badge-estado-${pedido.estado?.toLowerCase() || 'otro'}">${pedido.estado || 'N/A'}</span>`;
            return `
                <tr data-id="${pedido.id}">
                    <td>${pedido.numero || pedido.id}</td>
                    <td>${pedido.cliente_nombre || 'N/A'}</td>
                    <td>${pedido.fecha || 'N/A'}</td>
                    <td>${pedido.entrega || 'N/A'}</td>
                    <td>${estadoBadge}</td>
                    <td>${window.flowerShopAPI.formatCurrency ? window.flowerShopAPI.formatCurrency(pedido.total || 0) : (pedido.total || 0)}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-secondary" onclick="app.verPedido(${pedido.id})" title="Ver detalles">👁️</button>
                            ${pedido.estado && pedido.estado.toLowerCase() === 'pendiente' ? `<button class="btn btn-sm btn-success" onclick="app.aprobarPedido(${pedido.id})" title="Aprobar">✔️</button>` : ''}
                            ${pedido.estado && pedido.estado.toLowerCase() !== 'cancelado' && pedido.estado.toLowerCase() !== 'entregado' ? `<button class="btn btn-sm btn-danger" onclick="app.cancelarPedido(${pedido.id})" title="Cancelar">🗑️</button>` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Acciones básicas para pedidos
    async verPedido(id) {
        try {
            // Obtener el pedido y sus detalles
            const pedidos = await window.flowerShopAPI.getPedidos();
            const pedido = pedidos.find(p => p.id === id);
            if (!pedido) {
                this.showNotification('No se encontró el pedido', 'error');
                return;
            }
            // Obtener detalles de productos del pedido si existe la función
            let productosPedido = pedido.productos || [];
            if (!productosPedido.length && window.flowerShopAPI.getProductosPedido) {
                productosPedido = await window.flowerShopAPI.getProductosPedido(id);
            }
            // Renderizar modal de detalles
            this.renderPedidoDetallesModal(pedido, productosPedido);
            this.showModal('modal-pedido-detalles');
        } catch (error) {
            this.showNotification('Error mostrando detalles del pedido', 'error');
        }
    }

    renderPedidoDetallesModal(pedido, productos) {
        // Crear el modal si no existe
        let modal = document.getElementById('modal-pedido-detalles');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-pedido-detalles';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content" style="max-width:600px">
                    <span class="modal-close" style="float:right;cursor:pointer;font-size:1.5rem">&times;</span>
                    <h2>Detalles del Pedido #<span id="detalle-numero-pedido"></span></h2>
                    <div id="detalle-pedido-body"></div>
                </div>
            `;
            document.body.appendChild(modal);
            // Cerrar modal al hacer click en la X
            modal.querySelector('.modal-close').onclick = () => this.hideModal('modal-pedido-detalles');
            // Cerrar al hacer click fuera del contenido
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.hideModal('modal-pedido-detalles');
            });
        }
        // Rellenar datos
        document.getElementById('detalle-numero-pedido').textContent = pedido.numero || pedido.id;
        const body = document.getElementById('detalle-pedido-body');
        body.innerHTML = `
            <p><strong>Cliente:</strong> ${pedido.cliente_nombre || 'N/A'}</p>
            <p><strong>Fecha:</strong> ${pedido.fecha || 'N/A'}</p>
            <p><strong>Entrega:</strong> ${pedido.entrega || 'N/A'}</p>
            <p><strong>Estado:</strong> <span class="badge-estado badge-estado-${pedido.estado?.toLowerCase() || 'otro'}">${pedido.estado || 'N/A'}</span></p>
            <h4>Productos</h4>
            <div style="max-height:180px;overflow:auto">
                <table class="table table-sm">
                    <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr></thead>
                    <tbody>
                        ${productos && productos.length > 0 ? productos.map(prod => `
                            <tr>
                                <td>${prod.nombre || prod.producto_nombre || 'N/A'}</td>
                                <td>${prod.cantidad || 1}</td>
                                <td>${window.flowerShopAPI.formatCurrency ? window.flowerShopAPI.formatCurrency(prod.precio_unitario || prod.precio || 0) : (prod.precio_unitario || prod.precio || 0)}</td>
                                <td>${window.flowerShopAPI.formatCurrency ? window.flowerShopAPI.formatCurrency((prod.cantidad || 1) * (prod.precio_unitario || prod.precio || 0)) : ((prod.cantidad || 1) * (prod.precio_unitario || prod.precio || 0))}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="4">No hay productos</td></tr>'}
                    </tbody>
                </table>
            </div>
            <p style="text-align:right;font-size:1.2em"><strong>Total:</strong> ${window.flowerShopAPI.formatCurrency ? window.flowerShopAPI.formatCurrency(pedido.total || 0) : (pedido.total || 0)}</p>
            <p><strong>Notas:</strong> ${pedido.notas || '-'}</p>
        `;
    }

    async aprobarPedido(id) {
        try {
            if (!confirm('¿Aprobar este pedido?')) return;
            await window.flowerShopAPI.actualizarEstadoPedido(id, 'confirmado');
            this.showNotification('Pedido aprobado', 'success');
            await this.loadPedidosData();
        } catch (error) {
            this.showNotification('Error aprobando pedido', 'error');
        }
    }

    async cancelarPedido(id) {
        try {
            if (!confirm('¿Cancelar este pedido?')) return;
            await window.flowerShopAPI.actualizarEstadoPedido(id, 'cancelado');
            this.showNotification('Pedido cancelado', 'success');
            await this.loadPedidosData();
        } catch (error) {
            this.showNotification('Error cancelando pedido', 'error');
        }
    }

    async loadInventarioData() {
        console.log('📦 Cargando inventario...');
        // TODO: Implementar gestión de inventario
    }

    async loadReportesData() {
        console.log('📈 Cargando reportes...');
        // TODO: Implementar reportes
    }

    async loadConfiguracionData() {
        console.log('⚙️ Cargando configuración...');
        // TODO: Implementar configuración
    }

    // ========== ACCIONES CRUD ==========
    
    // Productos
    async nuevoProducto() {
        console.log('➕ Nuevo producto');
        try {
            // Limpiar formulario
            this.clearForm('form-producto');
            // Cargar categorías
            await this.loadCategoriasEnModal();
            // Mostrar modal
            this.showModal('modal-producto');
        } catch (error) {
            console.error('❌ Error abriendo modal de producto:', error);
            this.showNotification('Error abriendo formulario', 'error');
        }
    }

    async loadCategoriasEnModal() {
        try {
            const categorias = await window.flowerShopAPI.getCategorias();
            const select = document.getElementById('producto-categoria');
            if (select) {
                select.innerHTML = '<option value="">Seleccionar categoría</option>' +
                    categorias.map(cat => `<option value="${cat.id}">${cat.nombre}</option>`).join('');
            }
        } catch (error) {
            console.error('❌ Error cargando categorías:', error);
            this.showNotification('Error cargando categorías', 'error');
        }
    }

    clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
            // Limpiar cualquier data-id
            form.removeAttribute('data-edit-id');
        }
    }

    async editarProducto(id) {
        console.log('✏️ Editar producto:', id);
        try {
            await this.loadCategoriasEnModal();
            // Obtener todos los productos y buscar el que corresponde
            const productos = await window.flowerShopAPI.getProductos();
            const producto = productos.find(p => p.id === id);
            if (!producto) {
                this.showNotification('No se encontró el producto', 'error');
                return;
            }
            // Rellenar el formulario
            const form = document.getElementById('form-producto');
            if (!form) return;
            form.reset();
            form.setAttribute('data-edit-id', id);
            document.getElementById('producto-nombre').value = producto.nombre || '';
            document.getElementById('producto-codigo').value = producto.codigo_producto || '';
            document.getElementById('producto-categoria').value = producto.categoria_id || '';
            document.getElementById('producto-temporada').value = producto.temporada || 'todo_año';
            document.getElementById('producto-precio-compra').value = producto.precio_compra || '';
            document.getElementById('producto-precio-venta').value = producto.precio_venta || '';
            document.getElementById('producto-stock').value = producto.stock_actual || 0;
            document.getElementById('producto-stock-minimo').value = producto.stock_minimo || 5;
            document.getElementById('producto-descripcion').value = producto.descripcion || '';
            // Si tienes más campos, agrégalos aquí
            this.showModal('modal-producto');
        } catch (error) {
            console.error('❌ Error editando producto:', error);
            this.showNotification('Error abriendo editor', 'error');
        }
    }

    async verProducto(id) {
        console.log('👁️ Ver producto:', id);
        // TODO: Implementar vista de detalles del producto
        this.showNotification('Vista de detalles en desarrollo', 'info');
    }

    async eliminarProducto(id) {
        if (confirm('🗑️ ¿Estás seguro de que deseas eliminar este producto?\n\nEsta acción no se puede deshacer.')) {
            try {
                console.log('🗑️ Eliminar producto:', id);
                await window.flowerShopAPI.eliminarProducto(id);
                await this.loadProductosData();
                this.showNotification('Producto eliminado correctamente', 'success');
            } catch (error) {
                console.error('❌ Error eliminando producto:', error);
                this.showNotification('Error eliminando producto: ' + error.message, 'error');
            }
        }
    }

    // Clientes
    async nuevoCliente() {
        console.log('➕ Nuevo cliente');
        try {
            this.clearForm('form-cliente');
            this.showModal('modal-cliente');
        } catch (error) {
            console.error('❌ Error abriendo modal de cliente:', error);
            this.showNotification('Error abriendo formulario', 'error');
        }
    }

    async editarCliente(id) {
        console.log('✏️ Editar cliente:', id);
        try {
            // Obtener todos los clientes y buscar el que corresponde
            const clientes = await window.flowerShopAPI.getClientes();
            const cliente = clientes.find(c => c.id === id);
            if (!cliente) {
                this.showNotification('No se encontró el cliente', 'error');
                return;
            }
            // Rellenar el formulario compacto
            const form = document.getElementById('form-cliente');
            if (!form) return;
            form.reset();
            form.setAttribute('data-edit-id', id);
            document.getElementById('cliente-nombre-completo').value = cliente.nombre || '';
            document.getElementById('cliente-telefono').value = cliente.telefono || '';
            document.getElementById('cliente-direccion').value = cliente.direccion || '';
            document.getElementById('cliente-tipo').value = cliente.tipo_cliente || 'nuevo';
            document.getElementById('cliente-notas').value = cliente.notas || '';
            this.showModal('modal-cliente');
        } catch (error) {
            console.error('❌ Error editando cliente:', error);
            this.showNotification('Error abriendo editor', 'error');
        }
    }

    async verCliente(id) {
        console.log('👁️ Ver cliente:', id);
        this.showNotification('Vista de historial en desarrollo', 'info');
    }

    async nuevoPedidoCliente(id) {
        console.log('📋 Nuevo pedido para cliente:', id);
        this.showNotification('Funcionalidad de pedidos en desarrollo', 'info');
    }

    // Eventos
    async nuevoEvento() {
        console.log('➕ Nuevo evento');
        try {
            this.clearForm('form-evento');
            this.showModal('modal-evento');
        } catch (error) {
            console.error('❌ Error abriendo modal de evento:', error);
            this.showNotification('Error abriendo formulario', 'error');
        }
    }

    async editarEvento(id) {
        console.log('✏️ Editar evento:', id);
        try {
            // Obtener todos los eventos y buscar el que corresponde
            const eventos = await window.flowerShopAPI.getEventos();
            const evento = eventos.find(ev => ev.id === id);
            if (!evento) {
                this.showNotification('No se encontró el evento', 'error');
                return;
            }
            // Rellenar el formulario
            const form = document.getElementById('form-evento');
            if (!form) return;
            form.reset();
            form.setAttribute('data-edit-id', id);
            document.getElementById('evento-nombre').value = evento.nombre || '';
            document.getElementById('evento-fecha-inicio').value = evento.fecha_inicio || '';
            document.getElementById('evento-fecha-fin').value = evento.fecha_fin || '';
            document.getElementById('evento-tipo').value = evento.tipo_evento || '';
            document.getElementById('evento-demanda').value = evento.demanda_esperada || '';
            document.getElementById('evento-descuento').value = evento.descuento_especial || '';
            document.getElementById('evento-preparacion').value = evento.preparacion_dias || 7;
            document.getElementById('evento-descripcion').value = evento.descripcion || '';
            document.getElementById('evento-notas').value = evento.notas || '';
            this.showModal('modal-evento');
        } catch (error) {
            console.error('❌ Error editando evento:', error);
            this.showNotification('Error abriendo editor', 'error');
        }
    }
    // Eliminar evento
    async eliminarEvento(id) {
        if (confirm('🗑️ ¿Estás seguro de que deseas eliminar este evento?\n\nEsta acción no se puede deshacer.')) {
            try {
                await window.flowerShopAPI.eliminarEvento(id);
                this.showNotification('Evento eliminado correctamente', 'success');
                await this.loadEventosData();
            } catch (error) {
                this.showNotification('Error al eliminar el evento', 'error');
                console.error('❌ Error eliminando evento:', error);
            }
        }
    }

    async gestionarEventoStock(id) {
        console.log('📦 Gestionar stock del evento:', id);
        this.showNotification('Gestión de stock en desarrollo', 'info');
    }

    async nuevoPedido() {
        try {
            // Crear modal si no existe
            let modal = document.getElementById('modal-nuevo-pedido');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'modal-nuevo-pedido';
                modal.className = 'modal';
                modal.innerHTML = `
                    <div class="modal-content" style="max-width:650px">
                        <span class="modal-close" style="float:right;cursor:pointer;font-size:1.5rem">&times;</span>
                        <h2>Nuevo Pedido</h2>
                        <form id="form-nuevo-pedido">
                            <div class="form-group">
                                <label>Cliente</label>
                                <select id="pedido-cliente" name="cliente_id" required style="width:100%"></select>
                            </div>
                            <div class="form-group">
                                <label>Productos</label>
                                <div id="pedido-productos-list"></div>
                                <button type="button" id="btn-agregar-producto-pedido" class="btn btn-sm btn-primary" style="margin-top:5px">Agregar producto</button>
                            </div>
                            <div class="form-group">
                                <label>Fecha de entrega</label>
                                <input type="date" id="pedido-entrega" name="entrega" required />
                            </div>
                            <div class="form-group">
                                <label>Notas</label>
                                <textarea id="pedido-notas" name="notas" rows="2"></textarea>
                            </div>
                            <div style="text-align:right">
                                <button type="button" class="btn btn-secondary btn-cancelar">Cancelar</button>
                                <button type="submit" class="btn btn-success">Guardar Pedido</button>
                            </div>
                        </form>
                    </div>
                `;
                document.body.appendChild(modal);
                // Cerrar modal
                modal.querySelector('.modal-close').onclick = () => this.hideModal('modal-nuevo-pedido');
                modal.querySelector('.btn-cancelar').onclick = () => this.hideModal('modal-nuevo-pedido');
                modal.addEventListener('click', (e) => { if (e.target === modal) this.hideModal('modal-nuevo-pedido'); });
                // Evento submit
                modal.querySelector('#form-nuevo-pedido').onsubmit = (e) => this.handleNuevoPedidoSubmit(e);
                // Agregar producto
                modal.querySelector('#btn-agregar-producto-pedido').onclick = () => this.agregarProductoAlPedido();
            }
            // Cargar clientes y productos
            await this.cargarClientesEnPedido();
            await this.cargarProductosEnPedido();
            // Limpiar productos seleccionados
            document.getElementById('pedido-productos-list').innerHTML = '';
            // Mostrar modal
            this.showModal('modal-nuevo-pedido');
        } catch (error) {
            this.showNotification('Error abriendo formulario de pedido', 'error');
        }
    }

    async cargarClientesEnPedido() {
        const select = document.getElementById('pedido-cliente');
        if (!select) return;
        const clientes = await window.flowerShopAPI.getClientes();
        select.innerHTML = '<option value="">Seleccionar cliente</option>' +
            clientes.map(c => `<option value="${c.id}">${c.nombre} ${c.apellidos || ''}</option>`).join('');
    }

    async cargarProductosEnPedido() {
        // Guardar productos en memoria para selección rápida
        this._productosParaPedido = await window.flowerShopAPI.getProductos();
    }

    agregarProductoAlPedido() {
        const productos = this._productosParaPedido || [];
        const list = document.getElementById('pedido-productos-list');
        if (!list) return;
        // Crear fila de selección
        const idx = list.children.length;
        const row = document.createElement('div');
        row.className = 'pedido-producto-row';
        row.style.display = 'flex';
        row.style.gap = '8px';
        row.style.marginBottom = '4px';
        row.innerHTML = `
            <select class="pedido-producto-select" required style="flex:2">
                <option value="">Producto</option>
                ${productos.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('')}
            </select>
            <input type="number" class="pedido-producto-cantidad" min="1" value="1" required style="width:60px" />
            <button type="button" class="btn btn-danger btn-sm btn-quitar-producto">Quitar</button>
        `;
        // Quitar producto
        row.querySelector('.btn-quitar-producto').onclick = () => row.remove();
        list.appendChild(row);
    }

    async handleNuevoPedidoSubmit(e) {
        e.preventDefault();
        try {
            const form = e.target;
            const clienteId = form.querySelector('#pedido-cliente').value;
            const entrega = form.querySelector('#pedido-entrega').value;
            const notas = form.querySelector('#pedido-notas').value;
            // Productos
            const productos = Array.from(form.querySelectorAll('.pedido-producto-row')).map(row => {
                return {
                    producto_id: parseInt(row.querySelector('.pedido-producto-select').value),
                    cantidad: parseInt(row.querySelector('.pedido-producto-cantidad').value)
                };
            }).filter(p => p.producto_id && p.cantidad > 0);
            if (!clienteId || !entrega || productos.length === 0) {
                this.showNotification('Completa todos los campos obligatorios y agrega al menos un producto', 'warning');
                return;
            }
            // Guardar pedido
            const pedido = {
                cliente_id: parseInt(clienteId),
                productos,
                entrega,
                notas
            };
            await window.flowerShopAPI.crearPedido(pedido);
            this.showNotification('Pedido creado correctamente', 'success');
            this.hideModal('modal-nuevo-pedido');
            await this.loadPedidosData();
        } catch (error) {
            this.showNotification('Error guardando pedido', 'error');
        }
    }

    // ========== MODALES ==========
    setupModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            // Cerrar con cualquier botón .modal-close o .btn-cancelar dentro del modal
            const closeBtns = modal.querySelectorAll('.modal-close, .btn-cancelar');
            closeBtns.forEach(btn => {
                btn.addEventListener('click', () => this.hideModal(modal.id));
            });
            // Cerrar al hacer click fuera del contenido
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });
        
        // Escape key para cerrar modales
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal[style*="block"]');
                if (activeModal) {
                    this.hideModal(activeModal.id);
                }
            }
        });

        // Configurar formularios
        this.setupForms();
    }

    setupForms() {
        // Formulario de producto
        const formProducto = document.getElementById('form-producto');
        if (formProducto) {
            formProducto.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleProductoSubmit(e);
            });
        }

        // Formulario de cliente
        const formCliente = document.getElementById('form-cliente');
        if (formCliente) {
            formCliente.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleClienteSubmit(e);
            });
        }

        // Formulario de evento
        const formEvento = document.getElementById('form-evento');
        if (formEvento) {
            formEvento.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleEventoSubmit(e);
            });
        }
    }

    async handleProductoSubmit(e) {
        try {
            const form = e.target;
            const formData = new FormData(form);
            const producto = {
                codigo_producto: formData.get('codigo_producto'),
                nombre: formData.get('nombre'),
                descripcion: formData.get('descripcion'),
                categoria_id: parseInt(formData.get('categoria_id')),
                precio_compra: parseFloat(formData.get('precio_compra')) || 0,
                precio_venta: parseFloat(formData.get('precio_venta')),
                stock_actual: parseInt(formData.get('stock_actual')) || 0,
                stock_minimo: parseInt(formData.get('stock_minimo')) || 5,
                unidad_medida: formData.get('unidad_medida') || 'unidad',
                temporada: formData.get('temporada') || 'todo_año',
                perecedero: formData.get('perecedero') === 'on',
                dias_caducidad: parseInt(formData.get('dias_caducidad')) || null,
                proveedor: formData.get('proveedor') || ''
            };

            // Validación básica
            if (!producto.nombre || !producto.precio_venta || !producto.categoria_id) {
                this.showNotification('Por favor completa los campos obligatorios', 'warning');
                return;
            }

            // Si está en modo edición
            const editId = form.getAttribute('data-edit-id');
            if (editId) {
                await window.flowerShopAPI.actualizarProducto(Number(editId), producto);
                form.removeAttribute('data-edit-id');
                this.showNotification('Producto actualizado correctamente', 'success');
            } else {
                await window.flowerShopAPI.crearProducto(producto);
                this.showNotification('Producto guardado correctamente', 'success');
            }
            this.hideModal('modal-producto');
            await this.loadProductosData();
        } catch (error) {
            console.error('❌ Error guardando producto:', error);
            this.showNotification('Error guardando producto: ' + error.message, 'error');
        }
    }

    async handleClienteSubmit(e) {
        try {
            const formData = new FormData(e.target);
            const nombreCompleto = formData.get('nombre_completo')?.trim() || '';
            const cliente = {
                nombre: nombreCompleto,
                telefono: formData.get('telefono'),
                direccion: formData.get('direccion'),
                tipo_cliente: formData.get('tipo_cliente') || 'nuevo',
                notas: formData.get('notas')
            };

            console.log('📝 Guardando cliente:', cliente);

            if (!cliente.nombre) {
                this.showNotification('El nombre completo es obligatorio', 'warning');
                return;
            }

            // Llamar a la API
            await window.flowerShopAPI.crearCliente(cliente);
            
            this.hideModal('modal-cliente');
            this.showNotification('Cliente guardado correctamente', 'success');
            await this.loadClientesData();

        } catch (error) {
            console.error('❌ Error guardando cliente:', error);
            this.showNotification('Error guardando cliente: ' + error.message, 'error');
        }
    }

    async handleEventoSubmit(e) {
        try {
            const form = e.target;
            const formData = new FormData(form);
            const evento = {
                nombre: formData.get('nombre'),
                descripcion: formData.get('descripcion'),
                fecha_inicio: formData.get('fecha_inicio'),
                fecha_fin: formData.get('fecha_fin'),
                tipo_evento: formData.get('tipo_evento'),
                demanda_esperada: formData.get('demanda_esperada'),
                descuento_especial: parseFloat(formData.get('descuento_especial')) || 0,
                preparacion_dias: parseInt(formData.get('preparacion_dias')) || 7,
                notas: formData.get('notas')
            };

            console.log('📝 Guardando evento:', evento);

            if (!evento.nombre || !evento.fecha_inicio || !evento.fecha_fin) {
                this.showNotification('Por favor completa los campos obligatorios', 'warning');
                return;
            }

            const editId = form.getAttribute('data-edit-id');
            if (editId) {
                // Actualizar evento existente
                await window.flowerShopAPI.actualizarEvento(Number(editId), evento);
                form.removeAttribute('data-edit-id');
                this.showNotification('Evento actualizado correctamente', 'success');
            } else {
                // Crear nuevo evento
                await window.flowerShopAPI.crearEvento(evento);
                this.showNotification('Evento guardado correctamente', 'success');
            }
            this.hideModal('modal-evento');
            await this.loadEventosData();
        } catch (error) {
            console.error('❌ Error guardando evento:', error);
            this.showNotification('Error guardando evento: ' + error.message, 'error');
        }
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            console.log(`🔄 Modal abierto: ${modalId}`);
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            console.log(`🔄 Modal cerrado: ${modalId}`);
        }
    }

    // ========== EVENT LISTENERS ==========
    setupEventListeners() {
        // Botones principales
        document.getElementById('btn-nuevo-producto')?.addEventListener('click', () => this.nuevoProducto());
        document.getElementById('btn-nuevo-cliente')?.addEventListener('click', () => this.nuevoCliente());
        document.getElementById('btn-nuevo-evento')?.addEventListener('click', () => this.nuevoEvento());
        document.getElementById('btn-nuevo-pedido')?.addEventListener('click', () => this.nuevoPedido());
        document.getElementById('btn-nuevo-pedido-section')?.addEventListener('click', () => this.nuevoPedido());
        
        // Floating Action Button
        this.setupFAB();
        
        // Búsqueda y filtros
        document.getElementById('search-productos')?.addEventListener('input', (e) => {
            this.filtrarProductos(e.target.value);
        });
        
        document.getElementById('filter-categoria')?.addEventListener('change', (e) => {
            this.filtrarProductosPorCategoria(e.target.value);
        });
        
        // Búsqueda global
        document.querySelector('.global-search-input')?.addEventListener('input', (e) => {
            this.busquedaGlobal(e.target.value);
        });
        
        // Eventos del menú
        if (window.flowerShopAPI?.onMenuAction) {
            window.flowerShopAPI.onMenuAction((action) => {
                this.handleMenuAction(action);
            });
        }

        // Dashboard stat cards click
        document.querySelectorAll('.dashboard-link').forEach(card => {
            card.addEventListener('click', (e) => {
                const section = card.getAttribute('data-section');
                if (section) {
                    this.showSection(section);
                }
            });
        });

        // Topbar: Notificaciones, Configuración, Perfil
        document.querySelector('.nav-action-btn[title="Notificaciones"]')?.addEventListener('click', () => {
            this.showSection('notificaciones');
        });
        document.querySelector('.nav-action-btn[title="Configuración"]')?.addEventListener('click', () => {
            this.showSection('configuracion');
        });
        document.querySelector('.user-menu')?.addEventListener('click', () => {
            this.showSection('perfil');
        });
    }

    setupFAB() {
        const mainFab = document.getElementById('main-fab');
        const fabMenu = document.getElementById('fab-menu');
        
        if (mainFab && fabMenu) {
            let isOpen = false;
            
            mainFab.addEventListener('click', () => {
                isOpen = !isOpen;
                fabMenu.classList.toggle('active', isOpen);
                mainFab.style.transform = isOpen ? 'rotate(45deg)' : 'rotate(0deg)';
            });
            
            // Cerrar al hacer click fuera
            document.addEventListener('click', (e) => {
                if (!mainFab.contains(e.target) && !fabMenu.contains(e.target)) {
                    isOpen = false;
                    fabMenu.classList.remove('active');
                    mainFab.style.transform = 'rotate(0deg)';
                }
            });
            
            // Acciones del FAB
            fabMenu.addEventListener('click', (e) => {
                const action = e.target.closest('.fab-secondary')?.dataset.action;
                if (action) {
                    this.handleFabAction(action);
                    // Cerrar menú
                    isOpen = false;
                    fabMenu.classList.remove('active');
                    mainFab.style.transform = 'rotate(0deg)';
                }
            });
        }
    }

    handleFabAction(action) {
        switch (action) {
            case 'nuevo-producto':
                this.nuevoProducto();
                break;
            case 'nuevo-cliente':
                this.nuevoCliente();
                break;
            case 'nuevo-evento':
                this.nuevoEvento();
                break;
            case 'nuevo-pedido':
                this.nuevoPedido();
                break;
        }
    }

    busquedaGlobal(termino) {
        if (termino.length < 2) return;
        
        console.log('🔍 Búsqueda global:', termino);
        // TODO: Implementar búsqueda global en todas las secciones
        this.showNotification(`Buscando: "${termino}"`, 'info');
    }

    updateBreadcrumbs(section) {
        const breadcrumbs = document.querySelector('.breadcrumbs');
        if (breadcrumbs) {
            const sectionNames = {
                dashboard: 'Dashboard',
                productos: 'Productos',
                clientes: 'Clientes',
                eventos: 'Eventos',
                pedidos: 'Pedidos',
                inventario: 'Inventario',
                reportes: 'Reportes'
            };
            
            breadcrumbs.innerHTML = `
                <span class="breadcrumb-item active">${sectionNames[section] || section}</span>
            `;
        }
    }

    // ========== FILTROS ==========
    filtrarProductos(termino) {
        const filas = document.querySelectorAll('#productos-table tbody tr');
        filas.forEach(fila => {
            const texto = fila.textContent.toLowerCase();
            if (texto.includes(termino.toLowerCase())) {
                fila.style.display = '';
            } else {
                fila.style.display = 'none';
            }
        });
    }

    filtrarProductosPorCategoria(categoria) {
        const filas = document.querySelectorAll('#productos-table tbody tr');
        filas.forEach(fila => {
            if (!categoria || fila.textContent.includes(categoria)) {
                fila.style.display = '';
            } else {
                fila.style.display = 'none';
            }
        });
    }

    // ========== UTILIDADES ==========
    handleMenuAction(action) {
        switch (action) {
            case 'productos':
                this.showSection('productos');
                break;
            case 'clientes':
                this.showSection('clientes');
                break;
            case 'eventos':
                this.showSection('eventos');
                break;
            case 'pedidos':
                this.showSection('pedidos');
                break;
            case 'reportes-ventas':
            case 'reportes-inventario':
            case 'reportes-eventos':
                this.showSection('reportes');
                break;
            case 'ayuda':
                this.mostrarAyuda();
                break;
            case 'acerca-de':
                this.mostrarAcercaDe();
                break;
        }
    }

    mostrarAyuda() {
        alert('🌸 Floristería Manager\n\nManual de usuario próximamente disponible');
    }

    mostrarAcercaDe() {
        alert('🌸 Floristería Manager v1.0.0\nSistema de gestión integral para floristerías\n\n© 2025 - Desarrollado con ❤️');
    }

    showNotification(message, type = 'info') {
        console.log(`${type.toUpperCase()}: ${message}`);
        
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="notification-message">${message}</span>
            </div>
        `;
        
        // Estilos
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            color: 'white',
            backgroundColor: this.getNotificationColor(type),
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            zIndex: '2000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease-out',
            minWidth: '300px',
            maxWidth: '500px'
        });

        document.body.appendChild(notification);

        // Animación de entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Remover después de 4 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || 'ℹ️';
    }

    getNotificationColor(type) {
        const colors = {
            success: '#4caf50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196f3'
        };
        return colors[type] || '#2196f3';
    }

    async loadInitialData() {
        try {
            console.log('🚀 Cargando datos iniciales...');
            await this.loadDashboardData();
            console.log('✅ Datos iniciales cargados correctamente');
        } catch (error) {
            console.error('❌ Error cargando datos iniciales:', error);
            this.showNotification('Error cargando datos iniciales', 'error');
        }
    }
}

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌸 DOM cargado, inicializando aplicación...');
    window.app = new FlowerShopApp();
});

// Funciones globales para HTML onclick
window.editarProducto = (id) => window.app?.editarProducto(id);
window.verProducto = (id) => window.app?.verProducto(id);
window.eliminarProducto = (id) => window.app?.eliminarProducto(id);
window.editarCliente = (id) => window.app?.editarCliente(id);
window.verCliente = (id) => window.app?.verCliente(id);
window.nuevoPedidoCliente = (id) => window.app?.nuevoPedidoCliente(id);
window.editarEvento = (id) => window.app?.editarEvento(id);
window.gestionarEventoStock = (id) => window.app?.gestionarEventoStock(id);
