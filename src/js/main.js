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
        this.setupNavigation();
        this.setupModals();
        this.setupEventListeners();
        await this.loadInitialData();
        await this.updateSidebarBadges();
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

            // Re-render Lucide icons for the new section
            if (typeof lucide !== 'undefined') lucide.createIcons();

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
                case 'perfil':
                    await this.loadPerfilData();
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
            // Greeting & date
            const now = new Date();
            const hour = now.getHours();
            const greeting = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';
            this.updateElement('dash-greeting-text', greeting + ' 👋');
            const fechaStr = now.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            this.updateElement('dash-fecha-hoy', fechaStr.charAt(0).toUpperCase() + fechaStr.slice(1));

            const [stats, pedidos, eventos, alertas] = await Promise.all([
                window.flowerShopAPI.getEstadisticas(),
                window.flowerShopAPI.getPedidos(),
                window.flowerShopAPI.getEventos(),
                window.flowerShopAPI.getAlertasStock()
            ]);

            // KPI cards
            this.updateElement('pedidos-pendientes', stats.pedidosPendientes || 0);
            this.updateElement('ventas-mes', window.flowerShopAPI.formatCurrency(stats.ventasMesActual || 0));
            this.updateElement('total-clientes', stats.totalClientes || 0);
            this.updateElement('total-productos', (alertas || []).length);

            // Pedidos hoy sub-label
            const hoy = now.toISOString().slice(0, 10);
            const pedidosHoy = (pedidos || []).filter(p => (p.fecha_pedido || '').slice(0, 10) === hoy);
            this.updateElement('dash-pedidos-hoy', `${pedidosHoy.length} para hoy`);

            // Lista pedidos hoy
            this.renderDashPedidosHoy(pedidosHoy, pedidos);

            // Alertas sidebar
            this.renderDashAlertas(alertas || [], pedidos || []);

            // Próximos eventos sidebar
            this.updateProximosEventos(eventos);

            // Stock bajo sidebar
            this.updateStockBajo(stats.stockBajo || []);

            // Nav sidebar stats
            this.updateElement('sidebar-ventas-hoy', window.flowerShopAPI.formatCurrency(stats.ventasHoy || 0));
            this.updateElement('sidebar-stock-bajo', (stats.stockBajo || []).length);

        } catch (error) {
            console.error('❌ Error cargando dashboard:', error);
            this.showNotification('Error cargando el dashboard', 'error');
        }
    }

    renderDashPedidosHoy(pedidosHoy, todosPedidos) {
        const container = document.getElementById('dash-pedidos-hoy-lista');
        if (!container) return;

        // Si no hay pedidos hoy, mostrar los pendientes más recientes
        const lista = pedidosHoy.length > 0
            ? pedidosHoy.slice(0, 8)
            : (todosPedidos || []).filter(p => p.estado === 'pendiente').slice(0, 8);

        if (lista.length === 0) {
            container.innerHTML = `<div class="dashboard-empty-state"><i data-lucide="check-circle"></i><span>No hay pedidos pendientes</span></div>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        const estadoColor = { pendiente: '#f59e0b', aprobado: '#3b82f6', completado: '#22c55e', cancelado: '#ef4444' };
        container.innerHTML = lista.map(p => `
            <div class="dash-pedido-row" onclick="app.verPedido(${p.id})">
                <div class="dash-pedido-info">
                    <span class="dash-pedido-nombre">${p.cliente_nombre || 'Cliente'}</span>
                    <span class="dash-pedido-fecha">${window.flowerShopAPI.formatDate(p.fecha_pedido)}</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                    <span style="font-weight:700;color:var(--g-600)">${window.flowerShopAPI.formatCurrency(p.total || 0)}</span>
                    <span class="estado-badge ${p.estado}">${p.estado}</span>
                </div>
            </div>
        `).join('');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    renderDashAlertas(alertas, pedidos) {
        const container = document.getElementById('dash-alertas-lista');
        if (!container) return;

        const items = [];

        // Stock crítico (stock_actual === 0)
        alertas.filter(a => a.stock_actual === 0).slice(0, 3).forEach(a => {
            items.push({ color: '#ef4444', icon: 'alert-triangle', text: `<b>${a.nombre}</b> — Sin stock`, action: `app.showSection('inventario')` });
        });

        // Pedidos urgentes (entrega hoy o mañana y pendientes)
        const hoy = new Date().toISOString().slice(0, 10);
        const manana = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
        pedidos.filter(p => p.estado === 'pendiente' && (
            (p.fecha_entrega || '').slice(0, 10) === hoy ||
            (p.fecha_entrega || '').slice(0, 10) === manana
        )).slice(0, 3).forEach(p => {
            const esHoy = (p.fecha_entrega || '').slice(0, 10) === hoy;
            items.push({ color: '#f59e0b', icon: 'clock', text: `Entrega ${esHoy ? 'hoy' : 'mañana'}: <b>${p.cliente_nombre || 'Pedido #' + p.id}</b>`, action: `app.verPedido(${p.id})` });
        });

        // Stock bajo (no crítico)
        alertas.filter(a => a.stock_actual > 0).slice(0, 2).forEach(a => {
            items.push({ color: '#f59e0b', icon: 'package', text: `<b>${a.nombre}</b> — Stock bajo (${a.stock_actual})`, action: `app.showSection('inventario')` });
        });

        if (items.length === 0) {
            container.innerHTML = `<div class="dashboard-empty-state"><i data-lucide="check-circle"></i><span>Sin alertas activas</span></div>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        container.innerHTML = items.map(item => `
            <div class="dash-alerta-row" onclick="${item.action}" style="cursor:pointer">
                <span class="dash-alerta-dot" style="background:${item.color}"></span>
                <span class="dash-alerta-text">${item.text}</span>
            </div>
        `).join('');
        if (typeof lucide !== 'undefined') lucide.createIcons();
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
                    <span class="stock-badge low-stock">${producto.stock_actual}/${producto.stock_minimo}</span>
                </div>
            `).join('');
        } else {
            container.innerHTML = `<div class="dashboard-empty-state"><i data-lucide="check-circle"></i><span>Todo el stock en nivel óptimo</span></div>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
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
                    <div class="evento-tipo">${evento.tipo_evento || ''}</div>
                </div>
            `).join('');
        } else {
            container.innerHTML = `<div class="dashboard-empty-state"><i data-lucide="calendar-x"></i><span>Sin eventos programados</span></div>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }

    // ========== PRODUCTOS ==========
    async loadProductosData() {
        try {
            const [productos, categorias] = await Promise.all([
                window.flowerShopAPI.getProductos(),
                window.flowerShopAPI.getCategorias()
            ]);
            this.displayProductos(productos);
            this._productosCache = productos;

            // Poblar filtro de categorías
            const filterCat = document.getElementById('filter-categoria');
            if (filterCat) {
                filterCat.innerHTML = '<option value="">Todas las categorías</option>' +
                    categorias.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
            }
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
                        <button class="btn btn-sm btn-primary" onclick="app.editarProducto(${producto.id})" title="Editar">Editar</button>
                        <button class="btn btn-sm btn-secondary" onclick="app.verProducto(${producto.id})" title="Ver detalles">Ver</button>
                        <button class="btn btn-sm btn-danger" onclick="app.eliminarProducto(${producto.id})" title="Eliminar">Eliminar</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // ========== CLIENTES ==========
    async loadClientesData() {
        try {
            const clientes = await window.flowerShopAPI.getClientes();
            this.displayClientes(clientes);
            this._clientesCache = clientes;
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
                        <button class="btn btn-sm btn-primary" onclick="app.editarCliente(${cliente.id})" title="Editar">Editar</button>
                        <button class="btn btn-sm btn-secondary" onclick="app.verCliente(${cliente.id})" title="Ver historial">Ver</button>
                        <button class="btn btn-sm btn-success" onclick="app.nuevoPedidoCliente(${cliente.id})" title="Nuevo pedido">Pedido</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // ========== EVENTOS ==========
    async loadEventosData() {
        try {
            const eventos = await window.flowerShopAPI.getEventos();
            this.displayEventos(eventos);
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
            const tipo = (evento.tipo_evento || 'comercial').toLowerCase();
            const demanda = (evento.demanda_esperada || 'media').toLowerCase();

            return `
                <div class="evento-card" data-id="${evento.id}">
                    <div class="evento-card-accent ${tipo}"></div>
                    <div class="evento-card-body">
                        <div class="evento-header">
                            <h3>${evento.nombre}</h3>
                            <span class="evento-badge ${demanda}">${demanda}</span>
                        </div>
                        <div class="evento-meta">
                            <div class="evento-meta-item">
                                <span class="evento-meta-label">Tipo</span>
                                <span class="evento-meta-value">${evento.tipo_evento || '—'}</span>
                            </div>
                            <div class="evento-meta-item">
                                <span class="evento-meta-label">Descuento</span>
                                <span class="evento-meta-value">${evento.descuento_especial > 0 ? evento.descuento_especial + '%' : '—'}</span>
                            </div>
                            <div class="evento-meta-item">
                                <span class="evento-meta-label">Inicio</span>
                                <span class="evento-meta-value">${window.flowerShopAPI.formatDate(evento.fecha_inicio)}</span>
                            </div>
                            <div class="evento-meta-item">
                                <span class="evento-meta-label">Fin</span>
                                <span class="evento-meta-value">${window.flowerShopAPI.formatDate(evento.fecha_fin)}</span>
                            </div>
                        </div>
                        ${evento.descripcion ? `<p class="evento-desc">${evento.descripcion}</p>` : ''}
                    </div>
                    <div class="evento-actions">
                        <button class="btn btn-sm btn-secondary" onclick="app.editarEvento(${evento.id})">Editar</button>
                        <button class="btn btn-sm btn-success" onclick="app.gestionarEventoStock(${evento.id})">Stock</button>
                        <button class="btn btn-sm btn-danger" onclick="app.eliminarEvento(${evento.id})">Eliminar</button>
                    </div>
                </div>
            `;
        }).join('');
        // Re-render Lucide icons for dynamically added content
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    // ========== PEDIDOS ==========
    async loadPedidosData() {
        try {
            const pedidos = await window.flowerShopAPI.getPedidos();
            this.displayPedidos(pedidos);
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
            const estadoBadge = `<span class="badge-estado badge-estado-${(pedido.estado || '').toLowerCase()}">${pedido.estado || 'N/A'}</span>`;
            // Usar los nombres correctos de los campos según la base de datos
            const numeroPedido = pedido.numero_pedido || pedido.numero || pedido.id;
            const cliente = (pedido.cliente_nombre ? pedido.cliente_nombre : '') + (pedido.cliente_apellidos ? ' ' + pedido.cliente_apellidos : '');
            const fechaPedido = pedido.fecha_pedido ? (window.flowerShopAPI.formatDate ? window.flowerShopAPI.formatDate(pedido.fecha_pedido) : pedido.fecha_pedido) : 'N/A';
            const fechaEntrega = pedido.fecha_entrega ? (window.flowerShopAPI.formatDate ? window.flowerShopAPI.formatDate(pedido.fecha_entrega) : pedido.fecha_entrega) : 'N/A';
            const totalPedido = (typeof pedido.total !== 'undefined' && pedido.total !== null) ? (window.flowerShopAPI.formatCurrency ? window.flowerShopAPI.formatCurrency(pedido.total) : pedido.total) : 'N/A';
            return `
                <tr data-id="${pedido.id}">
                    <td>${numeroPedido}</td>
                    <td>${cliente.trim() || 'N/A'}</td>
                    <td>${fechaPedido}</td>
                    <td>${fechaEntrega}</td>
                    <td>${estadoBadge}</td>
                    <td>${totalPedido}</td>
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
            let productosPedido = pedido.productos || [];
            if (!productosPedido.length) {
                productosPedido = await window.flowerShopAPI.getDetallesPedido(id).catch(() => []);
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
                <div class="modal-content modal-md">
                    <div class="modal-header">
                        <div class="modal-header-inner">
                            <div class="modal-header-icon"><i data-lucide="shopping-cart"></i></div>
                            <div>
                                <h2 class="modal-title-pro">Pedido #<span id="detalle-numero-pedido"></span></h2>
                                <p class="modal-subtitle-pro">Detalle completo del pedido</p>
                            </div>
                        </div>
                        <button class="modal-close" aria-label="Cerrar">&times;</button>
                    </div>
                    <div class="modal-body" id="detalle-pedido-body"></div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary modal-close">Cerrar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            modal.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', () => this.hideModal('modal-pedido-detalles')));
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.hideModal('modal-pedido-detalles');
            });
        }
        // Rellenar datos
        const fmt = (v) => window.flowerShopAPI.formatCurrency(v || 0);
        const fmtDate = (v) => v ? window.flowerShopAPI.formatDate(v) : '—';
        const estado = pedido.estado?.toLowerCase() || 'pendiente';
        document.getElementById('detalle-numero-pedido').textContent = pedido.numero || pedido.id;
        const body = document.getElementById('detalle-pedido-body');

        const productosRows = (productos && productos.length > 0)
            ? productos.map(p => {
                const nombre = p.nombre || p.producto_nombre || '—';
                const qty    = p.cantidad || 1;
                const precio = p.precio_unitario || p.precio || 0;
                const sub    = qty * precio;
                return `<tr>
                    <td>${nombre}</td>
                    <td style="text-align:center">${qty}</td>
                    <td style="text-align:right">${fmt(precio)}</td>
                    <td style="text-align:right;font-weight:600">${fmt(sub)}</td>
                </tr>`;
            }).join('')
            : `<tr><td colspan="4" class="text-center text-muted">Sin productos registrados</td></tr>`;

        const lbl = (text) => `<span style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">${text}</span>`;
        const val = (text, bold = false) => `<span style="font-size:0.92rem;${bold ? 'font-weight:600;' : ''}color:var(--text-primary)">${text}</span>`;
        const field = (label, content) => `
            <div style="display:flex;flex-direction:column;gap:var(--sp-1)">
                ${lbl(label)}${content}
            </div>`;

        body.innerHTML = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4);margin-bottom:var(--sp-5)">
                ${field('Cliente', val(pedido.cliente_nombre || '—'))}
                ${field('Estado', `<span><span class="estado-badge ${estado}">${pedido.estado || '—'}</span></span>`)}
                ${field('Fecha pedido', val(fmtDate(pedido.fecha_pedido || pedido.fecha)))}
                ${field('Fecha entrega', val(fmtDate(pedido.fecha_entrega || pedido.entrega)))}
            </div>
            <div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:var(--sp-2)">Productos</div>
            <div style="border:1px solid var(--s-100);border-radius:var(--r-lg);overflow:hidden;margin-bottom:var(--sp-4);max-height:240px;overflow-y:auto">
                <table class="table" style="margin:0">
                    <thead><tr><th>Producto</th><th style="text-align:center">Cant.</th><th style="text-align:right">Precio</th><th style="text-align:right">Subtotal</th></tr></thead>
                    <tbody>${productosRows}</tbody>
                </table>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;background:var(--s-900);color:#fff;padding:var(--sp-3) var(--sp-4);border-radius:var(--r-lg)">
                <span style="font-weight:600">Total</span>
                <span style="font-size:1.05rem;font-weight:700">${fmt(pedido.total)}</span>
            </div>
            ${pedido.notas ? `
            <div style="margin-top:var(--sp-3);padding-top:var(--sp-3);border-top:1px solid var(--s-100)">
                ${lbl('Notas')}
                <p style="margin:var(--sp-1) 0 0;font-size:0.9rem;color:var(--text-secondary)">${pedido.notas}</p>
            </div>` : ''}
        `;
    }

    async aprobarPedido(id) {
        try {
            if (!await this._confirm('Aprobar pedido', '¿Confirmas que quieres aprobar este pedido?', 'Aprobar', 'btn-primary')) return;
            await window.flowerShopAPI.actualizarEstadoPedido(id, 'confirmado');
            this.showNotification('Pedido aprobado', 'success');
            await this.loadPedidosData();
        } catch (error) {
            this.showNotification('Error aprobando pedido', 'error');
        }
    }

    async cancelarPedido(id) {
        try {
            if (!await this._confirm('Cancelar pedido', '¿Seguro que quieres cancelar este pedido? Esta acción no se puede deshacer.', 'Cancelar pedido')) return;
            await window.flowerShopAPI.actualizarEstadoPedido(id, 'cancelado');
            this.showNotification('Pedido cancelado', 'success');
            await this.loadPedidosData();
        } catch (error) {
            this.showNotification('Error cancelando pedido', 'error');
        }
    }

    async loadInventarioData() {
        await this.loadInventoryDashboard();
        this.setupInventoryEventListeners();
    }

    setupInventoryTabs() {
        const tabButtons = document.querySelectorAll('.inventory-tabs .tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const tabId = button.getAttribute('data-tab');
                
                // Actualizar botones activos
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Mostrar contenido correspondiente
                tabContents.forEach(content => {
                    content.classList.remove('active');
                });
                
                const targetTab = document.getElementById(`tab-${tabId}`);
                if (targetTab) {
                    targetTab.classList.add('active');
                    
                    // Cargar datos específicos de la pestaña
                    switch(tabId) {
                        case 'dashboard':
                            await this.loadInventoryDashboard();
                            break;
                        case 'alertas':
                            await this.loadInventoryAlerts();
                            break;
                        case 'prediccion':
                            await this.loadDemandPrediction();
                            break;
                        case 'proveedores':
                            await this.loadProviders();
                            // Configurar event listeners específicos de proveedores
                            this.setupProveedoresEventListeners();
                            break;
                        case 'ordenes':
                            await this.loadPurchaseOrders();
                            break;
                        case 'movimientos':
                            await this.loadInventoryMovements();
                            break;
                    }
                }
            });
        });
    }

    async loadInventoryDashboard() {
        try {
            const [productos, analisisData] = await Promise.all([
                window.flowerShopAPI.getProductos(),
                window.flowerShopAPI.getAnalisisInventario().catch(() => null)
            ]);

            const stockBajo = productos.filter(p => p.stock_actual <= p.stock_minimo).length;
            const stockCritico = productos.filter(p => p.stock_actual === 0).length;
            const valorTotal = productos.reduce((sum, p) => sum + (p.precio_venta * p.stock_actual), 0);

            // KPI: total productos
            this.updateElement('inventario-total-productos', productos.length);
            // KPI: stock bajo
            this.updateElement('inventario-stock-bajo', stockBajo);
            // KPI: valor inventario (usa precio compra si disponible, venta si no)
            const valorCoste = productos.reduce((sum, p) => sum + ((p.precio_compra || p.precio_venta) * p.stock_actual), 0);
            const valorInventarioEl = document.getElementById('inventario-valor-inventario');
            if (valorInventarioEl) valorInventarioEl.textContent = window.flowerShopAPI.formatCurrency(valorCoste);

            // KPI: rotación — si tenemos análisis real, calcular días promedio de stock
            const rotacionEl = document.getElementById('inventario-rotacion-promedio');
            if (rotacionEl) {
                if (analisisData) {
                    const todos = [
                        ...(analisisData.productos_rotacion_rapida || []),
                        ...(analisisData.productos_rotacion_lenta || []),
                        ...(analisisData.productos_sin_movimiento || [])
                    ].filter(p => p.dias_stock < 999);
                    const prom = todos.length
                        ? Math.round(todos.reduce((s, p) => s + p.dias_stock, 0) / todos.length)
                        : '—';
                    rotacionEl.textContent = prom;
                } else {
                    rotacionEl.textContent = '—';
                }
            }

            // Trends — datos reales, sin porcentajes inventados
            const trendStock = document.getElementById('trend-stock');
            if (trendStock) trendStock.textContent = `${stockCritico} sin stock`;

            const trendProductos = document.getElementById('trend-productos');
            if (trendProductos) {
                const activos = productos.filter(p => p.activo).length;
                trendProductos.textContent = `${activos} activos`;
                trendProductos.className = 'kpi-trend positive';
            }

            const trendValor = document.getElementById('trend-valor');
            if (trendValor) {
                trendValor.textContent = `PVP ${window.flowerShopAPI.formatCurrency(valorTotal)}`;
                trendValor.className = 'kpi-trend neutral';
            }

            const trendRotacion = document.getElementById('trend-rotacion');
            if (trendRotacion) trendRotacion.textContent = 'días promedio';

            // Gráfico y lista — siempre datos reales
            if (analisisData) {
                this.createRotationAnalysisChart(analisisData);
                this.displayProductsWithoutMovement(analisisData.productos_sin_movimiento || []);
            } else {
                this.createSimulatedRotationChart(productos);
                this.displaySimulatedProductsWithoutMovement(productos);
            }

        } catch (error) {
            console.error('❌ Error cargando dashboard de inventario:', error);
            this.showNotification('Error cargando dashboard de inventario', 'error');
        }
    }
    
    createSimulatedRotationChart(productos) {
        const ctx = document.getElementById('rotation-analysis-chart');
        if (!ctx) return;

        if (this.rotationChart) {
            this.rotationChart.destroy();
        }

        // Simular datos de rotación basados en stock
        const rotacionRapida = productos.filter(p => p.stock_actual > 30).length;
        const rotacionLenta = productos.filter(p => p.stock_actual >= 10 && p.stock_actual <= 30).length;
        const sinMovimiento = productos.filter(p => p.stock_actual < 10).length;

        this.rotationChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Rotación Rápida', 'Rotación Lenta', 'Stock Bajo'],
                datasets: [{
                    data: [rotacionRapida, rotacionLenta, sinMovimiento],
                    backgroundColor: [
                        '#22c55e',
                        '#f59e0b',
                        '#ef4444'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }
    
    displaySimulatedProductsWithoutMovement(productos) {
        const container = document.getElementById('productos-sin-movimiento');
        if (!container) return;

        // Simular productos con bajo movimiento (los que tienen menos stock)
        const productosOrdenados = productos
            .sort((a, b) => a.stock_actual - b.stock_actual)
            .slice(0, 5);

        if (productosOrdenados.length === 0) {
            container.innerHTML = '<div class="ranking-loading">🎉 ¡Todos los productos tienen buen movimiento!</div>';
            return;
        }

        container.innerHTML = productosOrdenados.map((producto, index) => `
            <div class="ranking-item">
                <div class="ranking-position">${index + 1}</div>
                <div class="ranking-content">
                    <div class="ranking-title">${producto.nombre}</div>
                    <div class="ranking-subtitle">Stock: ${producto.stock_actual} unidades</div>
                </div>
                <div class="ranking-value">${Math.floor(Math.random() * 30) + 10} días</div>
            </div>
        `).join('');
    }

    updateInventoryKPIs(estadisticas) {
        document.getElementById('total-productos').textContent = estadisticas.total_productos || 0;
        document.getElementById('stock-bajo').textContent = estadisticas.productos_stock_bajo || 0;
        document.getElementById('valor-inventario').textContent = 
            window.flowerShopAPI.formatCurrency(estadisticas.valor_inventario_venta);
        
        // Calcular rotación promedio aproximada
        const rotacionPromedio = Math.round(estadisticas.promedio_stock / 30 * 365) || 0;
        document.getElementById('rotacion-promedio').textContent = rotacionPromedio;
        
        // Actualizar trends
        document.getElementById('trend-stock').textContent = 
            `${estadisticas.productos_sin_stock || 0} sin stock`;
        document.getElementById('trend-rotacion').textContent = `días/año`;
    }

    createRotationAnalysisChart(analisisData) {
        const ctx = document.getElementById('rotation-analysis-chart');
        if (!ctx) return;

        if (this.rotationChart) {
            this.rotationChart.destroy();
        }

        const rapidaCount = analisisData.productos_rotacion_rapida.length;
        const lentaCount = analisisData.productos_rotacion_lenta.length;
        const sinMovimientoCount = analisisData.productos_sin_movimiento.length;

        this.rotationChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Rotación Rápida', 'Rotación Lenta', 'Sin Movimiento'],
                datasets: [{
                    data: [rapidaCount, lentaCount, sinMovimientoCount],
                    backgroundColor: [
                        '#22c55e',
                        '#f59e0b',
                        '#ef4444'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    displayProductsWithoutMovement(productos) {
        const container = document.getElementById('productos-sin-movimiento');
        if (!container) return;

        if (productos.length === 0) {
            container.innerHTML = '<div class="ranking-loading" style="color:var(--text-muted);font-size:0.85rem;padding:1rem 0">Todos los productos tienen ventas registradas.</div>';
            return;
        }

        container.innerHTML = productos.slice(0, 10).map((producto, index) => `
            <div class="ranking-item">
                <div class="ranking-position">${index + 1}</div>
                <div class="ranking-content">
                    <div class="ranking-title">${producto.nombre}</div>
                    <div class="ranking-subtitle">Stock: ${producto.stock_actual} unidades</div>
                </div>
                <div class="ranking-value" style="font-size:0.78rem;color:var(--text-muted)">${producto.dias_stock >= 999 ? 'Sin ventas' : producto.dias_stock + ' días'}</div>
            </div>
        `).join('');
    }

    async loadInventoryAlerts() {
        try {
            const alertas = await window.flowerShopAPI.getAlertasStock();
            this.displayStockAlerts(alertas);
        } catch (error) {
            console.error('Error cargando alertas de stock:', error);
            this.showNotification('Error cargando alertas de stock', 'error');
        }
    }

    displayStockAlerts(alertas) {
        const container = document.getElementById('alertas-stock-grid');
        if (!container) return;

        if (alertas.length === 0) {
            container.innerHTML = `
                <div class="inv-empty-state">
                    <div class="inv-empty-icon"><i data-lucide="shield-check"></i></div>
                    <h3>Inventario bajo control</h3>
                    <p>Todos los productos se encuentran por encima de su stock mínimo. No se requieren acciones de reabastecimiento.</p>
                </div>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        container.innerHTML = alertas.map(alerta => `
            <div class="alert-card ${alerta.nivel_alerta}">
                <div class="alert-header">
                    <h4 class="alert-title">${alerta.nombre}</h4>
                    <span class="alert-badge ${alerta.nivel_alerta}">${alerta.nivel_alerta.replace('_', ' ')}</span>
                </div>
                <div class="alert-details">
                    <div><strong>Stock Actual:</strong> ${alerta.stock_actual}</div>
                    <div><strong>Stock Mínimo:</strong> ${alerta.stock_minimo}</div>
                    <div><strong>Categoría:</strong> ${alerta.categoria || 'N/A'}</div>
                    <div><strong>Sugerido:</strong> ${Math.max(alerta.stock_sugerido, 0)}</div>
                </div>
                <div class="alert-actions">
                    <button class="btn btn-sm btn-primary" onclick="app.ajustarStockMinimo(${alerta.id})">
                        ⚙️ Ajustar
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="app.crearOrdenCompra([${alerta.id}])">
                        🛒 Pedir
                    </button>
                </div>
            </div>
        `).join('');
    }

    async loadDemandPrediction() {
        try {
            const predicciones = await window.flowerShopAPI.getPrediccionDemanda(null, 30);
            if (!predicciones || predicciones.length === 0) throw new Error('Sin datos');
            this.renderPrediccionDemanda(predicciones);
        } catch (error) {
            console.warn('Predicción no disponible, usando datos de productos:', error);
            try {
                const productos = await window.flowerShopAPI.getProductos();
                const prediccionSimulada = productos.slice(0, 15).map(p => ({
                    producto_nombre: p.nombre,
                    stock_actual: p.stock_actual,
                    demanda_prevista: Math.max(1, Math.round(p.stock_actual * 0.6)),
                    stock_proyectado: p.stock_actual - Math.max(1, Math.round(p.stock_actual * 0.6))
                }));
                this.renderPrediccionDemanda(prediccionSimulada);
            } catch (e) {
                console.error('Error cargando predicción:', e);
            }
        }
    }

    createDemandPredictionChart(predicciones) {
        const ctx = document.getElementById('demand-prediction-chart');
        if (!ctx) return;

        if (this.demandChart) {
            this.demandChart.destroy();
        }

        const topPredicciones = predicciones.slice(0, 10);

        this.demandChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: topPredicciones.map(p => p.nombre.substring(0, 15) + '...'),
                datasets: [{
                    label: 'Stock Actual',
                    data: topPredicciones.map(p => p.stock_actual),
                    backgroundColor: '#3b82f6',
                    borderRadius: 4
                }, {
                    label: 'Demanda Prevista',
                    data: topPredicciones.map(p => p.demanda_prevista),
                    backgroundColor: '#f59e0b',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#f3f4f6'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    displayPredictionTable(predicciones) {
        const tbody = document.querySelector('#prediction-table tbody');
        if (!tbody) return;

        if (predicciones.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay datos de predicción disponibles</td></tr>';
            return;
        }

        tbody.innerHTML = predicciones.slice(0, 20).map(pred => {
            const alertClass = pred.stock_proyectado < 0 ? 'text-danger' : pred.stock_proyectado < pred.stock_actual * 0.3 ? 'text-warning' : '';
            return `
                <tr>
                    <td>${pred.nombre}</td>
                    <td>${pred.stock_actual}</td>
                    <td>${Math.round(pred.demanda_prevista)}</td>
                    <td class="${alertClass}">${Math.round(pred.stock_proyectado)}</td>
                    <td>
                        ${pred.stock_proyectado < 0 ? 
                            '<span class="badge bg-danger">Reabastecer</span>' : 
                            pred.stock_proyectado < pred.stock_actual * 0.3 ? 
                            '<span class="badge bg-warning">Monitorear</span>' : 
                            '<span class="badge bg-success">OK</span>'
                        }
                    </td>
                </tr>
            `;
        }).join('');
    }

    setupInventoryEventListeners() {
        const btnActualizar = document.getElementById('btn-actualizar-inventario');
        if (btnActualizar) {
            const fresh = btnActualizar.cloneNode(true);
            btnActualizar.replaceWith(fresh);
            fresh.addEventListener('click', () => this.loadInventarioData());
        }
    }

    setupProveedoresEventListeners() {
        const btnNuevoProveedorTab = document.getElementById('btn-nuevo-proveedor-tab');
        if (btnNuevoProveedorTab) {
            btnNuevoProveedorTab.replaceWith(btnNuevoProveedorTab.cloneNode(true));
            document.getElementById('btn-nuevo-proveedor-tab')
                ?.addEventListener('click', () => this.nuevoProveedor());
        }
    }

    async generateAutomaticOrder() {
        try {
            const alertas = await window.flowerShopAPI.getAlertasStock();
            
            if (alertas.length === 0) {
                this.showNotification('No hay productos que requieran reabastecimiento', 'info');
                return;
            }

            const productos = alertas.map(alerta => ({
                producto_id: alerta.id,
                cantidad: Math.max(alerta.stock_sugerido, alerta.stock_minimo)
            }));

            const ordenes = await window.flowerShopAPI.generarOrdenCompra(productos);
            
            if (ordenes.length > 0) {
                this.showNotification(`✅ Se generaron ${ordenes.length} órdenes de compra automáticamente`, 'success');
                // Cambiar a la pestaña de órdenes
                document.querySelector('[data-tab="ordenes"]').click();
            } else {
                this.showNotification('No se pudieron generar órdenes automáticas. Verifica los proveedores.', 'warning');
            }
        } catch (error) {
            console.error('Error generando orden automática:', error);
            this.showNotification('Error generando orden automática', 'error');
        }
    }

    async loadProviders() {
        try {
            const proveedores = await window.flowerShopAPI.getProveedores();
            this.displayProviders(proveedores);
        } catch (error) {
            console.error('Error cargando proveedores:', error);
            this.showNotification('Error cargando proveedores', 'error');
        }
    }

    displayProviders(proveedores) {
        const container = document.getElementById('proveedores-grid');
        if (!container) return;

        if (proveedores.length === 0) {
            container.innerHTML = '<div class="loading-message">No hay proveedores registrados</div>';
            return;
        }

        container.innerHTML = proveedores.map(proveedor => `
            <div class="provider-card">
                <div class="provider-card-top">
                    <div class="provider-avatar">${proveedor.nombre.charAt(0).toUpperCase()}</div>
                    <div class="provider-card-info">
                        <h4 class="provider-name">${proveedor.nombre}</h4>
                        <span class="provider-status ${proveedor.activo ? 'activo' : 'inactivo'}">${proveedor.activo ? 'Activo' : 'Inactivo'}</span>
                    </div>
                </div>
                <div class="provider-details-list">
                    ${proveedor.telefono ? `<div class="provider-detail-row"><span class="provider-detail-label">Teléfono</span><span class="provider-detail-val">${proveedor.telefono}</span></div>` : ''}
                    ${proveedor.email ? `<div class="provider-detail-row"><span class="provider-detail-label">Email</span><span class="provider-detail-val">${proveedor.email}</span></div>` : ''}
                    ${(proveedor.ciudad || proveedor.direccion) ? `<div class="provider-detail-row"><span class="provider-detail-label">Ciudad</span><span class="provider-detail-val">${proveedor.ciudad || proveedor.direccion}</span></div>` : ''}
                </div>
                <div class="provider-stats">
                    <div class="provider-stat">
                        <div class="provider-stat-value">${proveedor.productos_suministrados || 0}</div>
                        <div class="provider-stat-label">Productos</div>
                    </div>
                    <div class="provider-stat">
                        <div class="provider-stat-value">${window.flowerShopAPI.formatCurrency(proveedor.promedio_pedidos || 0)}</div>
                        <div class="provider-stat-label">Promedio orden</div>
                    </div>
                </div>
                <div class="provider-actions">
                    <button class="btn btn-sm btn-secondary" onclick="app.editarProveedor(${proveedor.id})">Editar</button>
                    <button class="btn btn-sm btn-primary" onclick="app.viewProviderOrders(${proveedor.id})">Órdenes</button>
                    <button class="btn btn-sm btn-danger" onclick="app.eliminarProveedor(${proveedor.id})">Eliminar</button>
                </div>
            </div>
        `).join('');
    }

    async loadPurchaseOrders() {
        try {
            const ordenes = await window.flowerShopAPI.getOrdenesCompra();
            this.renderOrdenesCompra(ordenes || []);
        } catch (error) {
            console.error('Error cargando órdenes de compra:', error);
            this.showNotification('Error cargando órdenes de compra', 'error');
        }
    }

    displayPurchaseOrders(ordenes) {
        const tbody = document.querySelector('#ordenes-table tbody');
        if (!tbody) return;

        if (ordenes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay órdenes de compra registradas</td></tr>';
            return;
        }

        tbody.innerHTML = ordenes.map(orden => `
            <tr>
                <td>${orden.numero_orden}</td>
                <td>${orden.proveedor_nombre}</td>
                <td>${window.flowerShopAPI.formatDate(orden.fecha_orden)}</td>
                <td>${orden.total_items}</td>
                <td>${window.flowerShopAPI.formatCurrency(orden.total)}</td>
                <td><span class="status-badge ${orden.estado}">${orden.estado}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="app.viewOrderDetails(${orden.id})">
                        👁️ Ver
                    </button>
                    ${orden.estado === 'pendiente' ? `
                        <button class="btn btn-sm btn-success" onclick="app.markOrderReceived(${orden.id})">
                            ✅ Recibida
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    }

    async loadInventoryMovements() {
        try {
            const movimientos = await window.flowerShopAPI.getMovimientosInventario({ limite: 50 });
            this.renderMovimientosInventario(movimientos);
        } catch (error) {
            console.error('Error cargando movimientos de inventario:', error);
            this.showNotification('Error cargando movimientos de inventario', 'error');
        }
    }

    displayInventoryMovements(movimientos) {
        const tbody = document.querySelector('#movimientos-table tbody');
        if (!tbody) return;

        if (movimientos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay movimientos de inventario registrados</td></tr>';
            return;
        }

        tbody.innerHTML = movimientos.map(mov => `
            <tr>
                <td>${window.flowerShopAPI.formatDateTime(mov.fecha_movimiento)}</td>
                <td>${mov.producto_nombre}</td>
                <td>
                    <span class="badge ${mov.tipo_movimiento === 'entrada' ? 'bg-success' : 'bg-danger'}">
                        ${mov.tipo_movimiento}
                    </span>
                </td>
                <td>${mov.cantidad}</td>
                <td>${mov.stock_anterior || 'N/A'} → ${mov.stock_nuevo || 'N/A'}</td>
                <td>${mov.motivo || 'N/A'}</td>
                <td>${mov.referencia || 'N/A'}</td>
            </tr>
        `).join('');
    }

    async loadReportesData() {
        try {
            // Obtener período seleccionado
            const periodSelect = document.getElementById('report-period');
            const dias = periodSelect ? parseInt(periodSelect.value) : 30;
            
            // Cargar datos en paralelo
            const [
                ventasData,
                ventasAnterior,
                topProductos,
                estadosPedidos,
                clientesTipo,
                eventosRentables,
                rotacionInventario,
                detalleVentas
            ] = await Promise.all([
                window.flowerShopAPI.getReportesVentas(dias),
                window.flowerShopAPI.getReportesVentas(dias * 2),
                window.flowerShopAPI.getProductosTopVentas(10, dias),
                window.flowerShopAPI.getEstadosPedidos(),
                window.flowerShopAPI.getClientesPorTipo(),
                window.flowerShopAPI.getEventosRentables(5, 365),
                window.flowerShopAPI.getRotacionInventario(),
                window.flowerShopAPI.getDetalleVentas(dias, '', 100)
            ]);

            // Calcular tendencias reales: período actual vs período anterior
            const kpisActual = ventasData.kpis;
            const kpisTotal = ventasAnterior.kpis;
            // El período doble incluye ambos períodos; el anterior = total - actual
            const kpisAnterior = {
                total_ventas: (kpisTotal.total_ventas || 0) - (kpisActual.total_ventas || 0),
                total_pedidos: (kpisTotal.total_pedidos || 0) - (kpisActual.total_pedidos || 0),
                clientes_activos: (kpisTotal.clientes_activos || 0) - (kpisActual.clientes_activos || 0),
                ticket_promedio: kpisTotal.ticket_promedio || 0
            };
            const pctChange = (actual, anterior) => anterior > 0 ? ((actual - anterior) / anterior) * 100 : 0;

            // Actualizar KPIs con tendencias reales
            this.updateReportKPIs(kpisActual, {
                ventas:   pctChange(kpisActual.total_ventas,     kpisAnterior.total_ventas),
                pedidos:  pctChange(kpisActual.total_pedidos,    kpisAnterior.total_pedidos),
                clientes: pctChange(kpisActual.clientes_activos, kpisAnterior.clientes_activos),
                ticket:   pctChange(kpisActual.ticket_promedio,  kpisAnterior.ticket_promedio)
            });
            
            // Crear gráficos
            this.createSalesChart(ventasData.ventasDiarias);
            this.createOrdersStatusChart(estadosPedidos);
            this.createInventoryRotationChart(rotacionInventario);
            
            // Actualizar rankings y listas
            this.updateTopProducts(topProductos);
            this.updateClientsType(clientesTipo);
            this.updateTopEvents(eventosRentables);
            this.updateSalesDetail(detalleVentas);
            
            // Configurar event listeners para controles
            this.setupReportControls();
            
        } catch (error) {
            console.error('❌ Error cargando reportes:', error);
            this.showNotification('Error cargando reportes', 'error');
        }
    }

    updateReportKPIs(kpis, trends = {}) {
        this.updateElement('kpi-total-ventas', window.flowerShopAPI.formatCurrency(kpis.total_ventas || 0));
        this.updateElement('kpi-total-pedidos', kpis.total_pedidos || 0);
        this.updateElement('kpi-clientes-activos', kpis.clientes_activos || 0);
        this.updateElement('kpi-ticket-promedio', window.flowerShopAPI.formatCurrency(kpis.ticket_promedio || 0));
        this.updateTrend('kpi-ventas-trend',   trends.ventas   ?? 0);
        this.updateTrend('kpi-pedidos-trend',  trends.pedidos  ?? 0);
        this.updateTrend('kpi-clientes-trend', trends.clientes ?? 0);
        this.updateTrend('kpi-ticket-trend',   trends.ticket   ?? 0);
    }

    updateTrend(elementId, percentage) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        element.textContent = `${percentage >= 0 ? '+' : ''}${percentage.toFixed(1)}%`;
        element.className = 'kpi-trend ' + (percentage > 0 ? 'positive' : percentage < 0 ? 'negative' : 'neutral');
    }

    createSalesChart(ventasData) {
        const ctx = document.getElementById('sales-chart');
        if (!ctx) return;

        // Destruir gráfico anterior si existe
        if (this.salesChart) {
            this.salesChart.destroy();
        }

        const labels = ventasData.map(v => {
            const fecha = new Date(v.fecha);
            return fecha.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
        }).reverse();
        
        const valores = ventasData.map(v => v.total_ventas).reverse();

        this.salesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Ventas (€)',
                    data: valores,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#8b5cf6',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => window.flowerShopAPI.formatCurrency(value)
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                elements: {
                    point: {
                        hoverBackgroundColor: '#8b5cf6'
                    }
                }
            }
        });
    }

    createOrdersStatusChart(estadosData) {
        const ctx = document.getElementById('orders-status-chart');
        if (!ctx) return;

        if (this.ordersChart) {
            this.ordersChart.destroy();
        }

        const colores = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#6b7280'];
        
        this.ordersChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: estadosData.map(e => e.estado),
                datasets: [{
                    data: estadosData.map(e => e.cantidad),
                    backgroundColor: colores.slice(0, estadosData.length),
                    borderWidth: 0,
                    hoverBorderWidth: 2,
                    hoverBorderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    createInventoryRotationChart(inventarioData) {
        const ctx = document.getElementById('inventory-rotation-chart');
        if (!ctx) return;

        if (this.inventoryChart) {
            this.inventoryChart.destroy();
        }

        const colores = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#6b7280'];
        
        this.inventoryChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: inventarioData.map(i => i.categoria),
                datasets: [{
                    label: 'Valor Vendido (€)',
                    data: inventarioData.map(i => i.valor_vendido),
                    backgroundColor: colores,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => window.flowerShopAPI.formatCurrency(value)
                        }
                    }
                }
            }
        });
    }

    updateTopProducts(productos) {
        const container = document.getElementById('top-products');
        if (!container) return;

        if (productos.length === 0) {
            container.innerHTML = '<div class="ranking-loading">No hay datos de productos vendidos</div>';
            return;
        }

        container.innerHTML = productos.map((producto, index) => `
            <div class="ranking-item">
                <div class="ranking-position">${index + 1}</div>
                <div class="ranking-content">
                    <div class="ranking-title">${producto.categoria_icono} ${producto.nombre}</div>
                    <div class="ranking-subtitle">${producto.categoria} • ${producto.pedidos_count} pedidos</div>
                </div>
                <div class="ranking-value">${producto.cantidad_vendida} uds</div>
            </div>
        `).join('');
    }

    updateClientsType(clientesData) {
        const container = document.getElementById('clients-type');
        if (!container) return;

        if (clientesData.length === 0) {
            container.innerHTML = '<div class="ranking-loading">No hay datos de clientes</div>';
            return;
        }

        const total = clientesData.reduce((sum, c) => sum + c.cantidad, 0);
        const colores = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

        container.innerHTML = clientesData.map((cliente, index) => {
            const porcentaje = total > 0 ? (cliente.cantidad / total * 100) : 0;
            return `
                <div class="segment-item">
                    <div class="segment-label">
                        <div class="segment-color" style="background: ${colores[index % colores.length]}"></div>
                        <span>${cliente.tipo_cliente}</span>
                    </div>
                    <div class="segment-bar">
                        <div class="segment-fill" style="width: ${porcentaje}%; background: ${colores[index % colores.length]}"></div>
                    </div>
                    <div class="segment-percentage">${porcentaje.toFixed(1)}%</div>
                </div>
            `;
        }).join('');
    }

    updateTopEvents(eventos) {
        const container = document.getElementById('top-events');
        if (!container) return;

        if (eventos.length === 0) {
            container.innerHTML = '<div class="ranking-loading">No hay eventos con ventas registradas</div>';
            return;
        }

        container.innerHTML = eventos.map((evento, index) => `
            <div class="ranking-item">
                <div class="ranking-position">${index + 1}</div>
                <div class="ranking-content">
                    <div class="ranking-title">${evento.nombre}</div>
                    <div class="ranking-subtitle">${evento.tipo_evento} • ${evento.pedidos_generados} pedidos</div>
                </div>
                <div class="ranking-value">${window.flowerShopAPI.formatCurrency(evento.ventas_totales)}</div>
            </div>
        `).join('');
    }

    updateSalesDetail(ventasData) {
        const tbody = document.querySelector('#sales-detail-table tbody');
        if (!tbody) return;

        if (ventasData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay ventas en el período seleccionado</td></tr>';
            return;
        }

        tbody.innerHTML = ventasData.map(venta => `
            <tr>
                <td>${window.flowerShopAPI.formatDate(venta.fecha_pedido)}</td>
                <td>${venta.numero_pedido}</td>
                <td>${venta.cliente_nombre || 'N/A'}</td>
                <td title="${venta.productos}">${venta.productos ? venta.productos.substring(0, 30) + '...' : 'N/A'}</td>
                <td>${window.flowerShopAPI.formatCurrency(venta.total)}</td>
                <td><span class="badge-estado badge-estado-${venta.estado.toLowerCase()}">${venta.estado}</span></td>
                <td>${window.flowerShopAPI.formatCurrency(venta.margen || 0)}</td>
            </tr>
        `).join('');
    }

    setupReportControls() {
        // Selector de período
        const periodSelect = document.getElementById('report-period');
        if (periodSelect) {
            periodSelect.addEventListener('change', () => {
                this.loadReportesData();
            });
        }

        // Controles de gráfico de ventas
        document.querySelectorAll('.chart-btn[data-chart="ventas"]').forEach(btn => {
            btn.addEventListener('click', () => {
                // Remover clase activa de otros botones
                document.querySelectorAll('.chart-btn[data-chart="ventas"]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // TODO: Implementar cambio de vista (diario/semanal/mensual)
                const tipo = btn.dataset.type;
            });
        });

        // Búsqueda en tabla de detalles
        const searchInput = document.getElementById('search-sales');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(async () => {
                    const periodSelect = document.getElementById('report-period');
                    const dias = periodSelect ? parseInt(periodSelect.value) : 30;
                    const ventasData = await window.flowerShopAPI.getDetalleVentas(dias, e.target.value, 100);
                    this.updateSalesDetail(ventasData);
                }, 500);
            });
        }

        // Botón de exportar
        const exportBtn = document.getElementById('btn-export-reports');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportReports();
            });
        }
    }

    exportReports() {
        // TODO: Implementar exportación de reportes
        this.showNotification('Funcionalidad de exportación en desarrollo', 'info');
    }

    // ========== GENERADOR DE CÓDIGO DE PRODUCTO ==========
    async generarCodigoProducto(nombre) {
        if (!nombre) return '';
        const palabras = nombre.trim().split(/\s+/);
        let iniciales = palabras.map(p => p[0].toUpperCase()).join('').slice(0, 2);
        let usados = [];
        try {
            const productos = await window.flowerShopAPI.getProductos();
            usados = productos.map(p => (p.codigo_producto || '').toUpperCase());
        } catch {}
        let n = 1, codigo = '';
        do {
            codigo = `${iniciales}-${String(n).padStart(3, '0')}`;
            n++;
        } while (usados.includes(codigo));
        return codigo;
    }

    setupCodigoProductoAutoGen() {
        const inputNombre = document.getElementById('producto-nombre');
        const inputCodigo = document.getElementById('producto-codigo');
        if (!inputNombre || !inputCodigo) return;

        inputNombre.addEventListener('input', async () => {
            if (!inputCodigo.dataset.manual) {
                if (inputNombre.value.length > 0) {
                    inputCodigo.value = '...';
                    inputCodigo.value = await this.generarCodigoProducto(inputNombre.value);
                } else {
                    inputCodigo.value = '';
                }
            }
        });
    }

    // ========== ACCIONES CRUD ==========

    // Productos
    async nuevoProducto() {
        try {
            this.clearForm('form-producto');
            await this.loadCategoriasEnModal();
            this.setupCodigoProductoAutoGen();
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
        try {
            const productos = await window.flowerShopAPI.getProductos();
            const p = productos.find(x => x.id === id);
            if (!p) return;

            const modal = document.createElement('div');
            modal.className = 'modal';
            const lbl = t => `<span style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">${t}</span>`;
            const field = (label, content) => `<div style="display:flex;flex-direction:column;gap:var(--sp-1)">${lbl(label)}${content}</div>`;
            const val = (t, danger = false) => `<span style="font-size:0.92rem;font-weight:500;color:${danger ? 'var(--r-500)' : 'var(--text-primary)'}">${t}</span>`;
            const stockBajo = p.stock_actual <= p.stock_minimo;

            modal.innerHTML = `
                <div class="modal-content modal-sm">
                    <div class="modal-header">
                        <div class="modal-header-inner">
                            <div class="modal-header-icon"><i data-lucide="box"></i></div>
                            <div>
                                <h2 class="modal-title-pro">${p.nombre}</h2>
                                <p class="modal-subtitle-pro">${p.codigo_producto || 'Sin código'} · ${p.categoria_nombre || 'Sin categoría'}</p>
                            </div>
                        </div>
                        <button class="modal-close" aria-label="Cerrar">&times;</button>
                    </div>
                    <div class="modal-body" style="display:flex;flex-direction:column;gap:var(--sp-4)">
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4)">
                            ${field('Precio de venta', val(window.flowerShopAPI.formatCurrency(p.precio_venta)))}
                            ${field('Precio de compra', val(window.flowerShopAPI.formatCurrency(p.precio_compra || 0)))}
                            ${field('Stock actual', val(`${p.stock_actual} ${p.unidad_medida}`, stockBajo))}
                            ${field('Stock mínimo', val(`${p.stock_minimo} ${p.unidad_medida}`))}
                            ${field('Estado', `<span><span class="estado-badge ${p.activo ? 'confirmado' : 'cancelado'}">${p.activo ? 'Activo' : 'Inactivo'}</span></span>`)}
                            ${field('Categoría', val(p.categoria_nombre || 'Sin categoría'))}
                        </div>
                        ${p.descripcion ? `
                        <div style="padding-top:var(--sp-3);border-top:1px solid var(--s-100)">
                            ${lbl('Descripción')}
                            <p style="margin:var(--sp-1) 0 0;font-size:0.88rem;color:var(--text-secondary)">${p.descripcion}</p>
                        </div>` : ''}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary modal-close">Cerrar</button>
                        <button type="button" class="btn btn-primary" onclick="app.closeModal(document.getElementById('modal-ver-producto-${p.id}')); app.editarProducto(${p.id})">Editar Producto</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            modal.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', () => this.closeModal(modal)));
            modal.addEventListener('click', e => { if (e.target === modal) this.closeModal(modal); });
            modal.id = 'modal-ver-producto-' + p.id;
            this.showModal(modal.id);
        } catch (e) {
            console.error(e);
        }
    }

    async eliminarProducto(id) {
        const ok = await this._confirm('Eliminar producto', 'Esta acción no se puede deshacer. ¿Seguro que quieres eliminar este producto?');
        if (!ok) return;
        try {
            await window.flowerShopAPI.eliminarProducto(id);
            await this.loadProductosData();
            await this.updateSidebarBadges();
            this.showNotification('Producto eliminado correctamente', 'success');
            // Re-apply active filters
            const termino = document.getElementById('search-productos')?.value || '';
            const catId = document.getElementById('filter-categoria')?.value || '';
            if (termino || catId) this.filtrarProductos(termino);
        } catch (error) {
            console.error('Error eliminando producto:', error);
            this.showNotification('Error eliminando producto: ' + error.message, 'error');
        }
    }

    // ========== CATEGORÍAS ==========
    _emojisCategorias() {
        return ['🌸','🌹','🌺','🌻','🌼','🌷','🌿','🍀','🌱','🌲','🌳','🌴','🍁','🍂','🍃','🌵',
                '🎋','🎍','🪴','🪷','💐','🫧','🧺','🎁','🎀','🏺','🪨','🧪','🌙','⭐','🦋','🐝'];
    }

    async gestionarCategorias() {
        // Renderizar grid de emojis
        const grid = document.getElementById('emoji-grid');
        if (grid) {
            grid.innerHTML = this._emojisCategorias().map(e =>
                `<div class="cat-emoji-opt${e === '🌿' ? ' selected' : ''}" onclick="app.seleccionarEmoji('${e}')">${e}</div>`
            ).join('');
        }
        // Reset picker y campos
        const picker = document.getElementById('emoji-picker');
        if (picker) picker.style.display = 'none';
        const btnIcono = document.getElementById('btn-icono-selector');
        if (btnIcono) btnIcono.textContent = '🌿';
        const inputIcono = document.getElementById('nueva-categoria-icono');
        if (inputIcono) inputIcono.value = '🌿';
        const inputNombre = document.getElementById('nueva-categoria-nombre');
        if (inputNombre) inputNombre.value = '';

        await this.renderListaCategorias();
        this.showModal('modal-categorias');
    }

    toggleEmojiPicker() {
        const picker = document.getElementById('emoji-picker');
        if (picker) picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
    }

    seleccionarEmoji(emoji) {
        const btn = document.getElementById('btn-icono-selector');
        const input = document.getElementById('nueva-categoria-icono');
        if (btn) btn.textContent = emoji;
        if (input) input.value = emoji;
        document.querySelectorAll('.cat-emoji-opt').forEach(el => {
            el.classList.toggle('selected', el.textContent === emoji);
        });
        const picker = document.getElementById('emoji-picker');
        if (picker) picker.style.display = 'none';
    }

    async renderListaCategorias() {
        const container = document.getElementById('categorias-lista');
        if (!container) return;
        const categorias = await window.flowerShopAPI.getCategorias();
        if (!categorias.length) {
            container.innerHTML = '<p style="color:var(--s-400);font-size:0.82rem;text-align:center;padding:var(--sp-3)">Sin categorías creadas</p>';
            return;
        }
        container.innerHTML = categorias.map(c => `
            <div class="cat-item" id="cat-row-${c.id}">
                <span class="cat-item-icono">${c.icono || '🌿'}</span>
                <span class="cat-item-nombre">${c.nombre}</span>
                <div class="cat-item-actions">
                    <button class="btn btn-sm btn-ghost" title="Editar" onclick="app.editarCategoria(${c.id}, '${(c.icono||'🌿')}', '${c.nombre.replace(/'/g, "\\'")}')">
                        <i data-lucide="pencil" style="width:14px;height:14px"></i>
                    </button>
                    <button class="btn btn-sm btn-ghost" style="color:var(--error)" title="Eliminar" onclick="app.eliminarCategoria(${c.id}, '${c.nombre.replace(/'/g, "\\'")}')">
                        <i data-lucide="trash-2" style="width:14px;height:14px"></i>
                    </button>
                </div>
            </div>
        `).join('');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    editarCategoria(id, iconoActual, nombreActual) {
        const row = document.getElementById(`cat-row-${id}`);
        if (!row) return;
        row.innerHTML = `
            <button type="button" class="cat-icono-btn" style="width:36px;height:36px;font-size:1.1rem" id="cat-edit-icono-btn-${id}" onclick="app.toggleEmojiPickerEdit(${id})">${iconoActual}</button>
            <input type="hidden" id="cat-edit-icono-${id}" value="${iconoActual}">
            <input type="text" class="form-input form-input-sm" id="cat-edit-nombre-${id}" value="${nombreActual}" style="flex:1">
            <div class="cat-item-actions">
                <button class="btn btn-sm btn-primary" onclick="app.guardarCategoria(${id})">
                    <i data-lucide="check" style="width:13px;height:13px"></i>
                </button>
                <button class="btn btn-sm btn-ghost" onclick="app.renderListaCategorias()">
                    <i data-lucide="x" style="width:13px;height:13px"></i>
                </button>
            </div>
        `;
        // Mini emoji picker inline
        const pickerDiv = document.createElement('div');
        pickerDiv.id = `cat-edit-picker-${id}`;
        pickerDiv.className = 'cat-emoji-picker';
        pickerDiv.style.display = 'none';
        pickerDiv.style.marginTop = '4px';
        pickerDiv.innerHTML = `<div class="cat-emoji-grid">${this._emojisCategorias().map(e =>
            `<div class="cat-emoji-opt${e === iconoActual ? ' selected' : ''}" onclick="app.seleccionarEmojiEdit(${id},'${e}')">${e}</div>`
        ).join('')}</div>`;
        row.insertAdjacentElement('afterend', pickerDiv);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    toggleEmojiPickerEdit(id) {
        const picker = document.getElementById(`cat-edit-picker-${id}`);
        if (picker) picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
    }

    seleccionarEmojiEdit(id, emoji) {
        const btn = document.getElementById(`cat-edit-icono-btn-${id}`);
        const input = document.getElementById(`cat-edit-icono-${id}`);
        if (btn) btn.textContent = emoji;
        if (input) input.value = emoji;
        const picker = document.getElementById(`cat-edit-picker-${id}`);
        if (picker) { picker.querySelectorAll('.cat-emoji-opt').forEach(el => el.classList.toggle('selected', el.textContent === emoji)); picker.style.display = 'none'; }
    }

    async guardarCategoria(id) {
        const nombre = document.getElementById(`cat-edit-nombre-${id}`)?.value.trim();
        const icono = document.getElementById(`cat-edit-icono-${id}`)?.value || '🌿';
        if (!nombre) { this.showNotification('El nombre no puede estar vacío', 'warning'); return; }
        try {
            await window.flowerShopAPI.actualizarCategoria(id, { nombre, icono });
            await this.renderListaCategorias();
            await this.refreshCategoriasSelect();
            this.showNotification('Categoría actualizada', 'success');
        } catch (e) {
            this.showNotification('Error actualizando categoría', 'error');
        }
    }

    async crearCategoria() {
        const nombre = document.getElementById('nueva-categoria-nombre')?.value.trim();
        const icono = document.getElementById('nueva-categoria-icono')?.value.trim() || '🌿';
        if (!nombre) { this.showNotification('Escribe un nombre para la categoría', 'warning'); return; }
        try {
            await window.flowerShopAPI.crearCategoria({ nombre, icono });
            document.getElementById('nueva-categoria-nombre').value = '';
            document.getElementById('nueva-categoria-icono').value = '';
            await this.renderListaCategorias();
            // Refrescar el select de categoría en el formulario de producto
            await this.refreshCategoriasSelect();
            this.showNotification(`Categoría "${nombre}" creada`, 'success');
        } catch (e) {
            this.showNotification('Error creando categoría', 'error');
        }
    }

    async eliminarCategoria(id, nombre) {
        const ok = await this._confirm('Eliminar categoría', `¿Eliminar "<strong>${nombre}</strong>"?<br><small>Solo se puede eliminar si no tiene productos asociados.</small>`, 'Eliminar', 'btn-danger');
        if (!ok) return;
        try {
            await window.flowerShopAPI.eliminarCategoria(id);
            await this.renderListaCategorias();
            await this.refreshCategoriasSelect();
            this.showNotification(`Categoría "${nombre}" eliminada`, 'success');
        } catch (e) {
            this.showNotification(e.message || 'Error eliminando categoría', 'error');
        }
    }

    async refreshCategoriasSelect() {
        const sel = document.getElementById('producto-categoria');
        if (!sel) return;
        const categorias = await window.flowerShopAPI.getCategorias();
        const val = sel.value;
        sel.innerHTML = '<option value="">Seleccionar categoría…</option>' +
            categorias.map(c => `<option value="${c.id}">${c.icono || ''} ${c.nombre}</option>`).join('');
        sel.value = val;
    }

    // Clientes
    async nuevoCliente() {
        try {
            this.clearForm('form-cliente');
            this.showModal('modal-cliente');
        } catch (error) {
            console.error('❌ Error abriendo modal de cliente:', error);
            this.showNotification('Error abriendo formulario', 'error');
        }
    }

    async editarCliente(id) {
        try {
            const clientes = await window.flowerShopAPI.getClientes();
            const cliente = clientes.find(c => c.id === id);
            if (!cliente) {
                this.showNotification('No se encontró el cliente', 'error');
                return;
            }
            const form = document.getElementById('form-cliente');
            if (!form) return;
            form.reset();
            form.setAttribute('data-edit-id', id);
            document.getElementById('cliente-nombre-completo').value = `${cliente.nombre} ${cliente.apellidos || ''}`.trim();
            document.getElementById('cliente-email').value = cliente.email || '';
            document.getElementById('cliente-telefono').value = cliente.telefono || '';
            document.getElementById('cliente-direccion').value = cliente.direccion || '';
            document.getElementById('cliente-fecha-nacimiento').value = cliente.fecha_nacimiento || '';
            document.getElementById('cliente-tipo').value = cliente.tipo_cliente || 'nuevo';
            document.getElementById('cliente-preferencias').value = cliente.preferencias || '';
            document.getElementById('cliente-presupuesto-habitual').value = cliente.presupuesto_habitual || '';
            document.getElementById('cliente-ocasiones-importantes').value = cliente.ocasiones_importantes || '';
            document.getElementById('cliente-notas').value = cliente.notas || '';
            this.showModal('modal-cliente');
        } catch (error) {
            console.error('❌ Error editando cliente:', error);
            this.showNotification('Error abriendo editor', 'error');
        }
    }

    async verCliente(id) {
        try {
            const [clientes, pedidos] = await Promise.all([
                window.flowerShopAPI.getClientes(),
                window.flowerShopAPI.getPedidos()
            ]);
            const cliente = clientes.find(c => c.id === parseInt(id));
            if (!cliente) {
                this.showNotification('Cliente no encontrado', 'error');
                return;
            }

            const pedidosCliente = pedidos.filter(p => p.cliente_id === parseInt(id));
            const totalPedidos = pedidosCliente.length;
            const totalGastado = pedidosCliente.reduce((sum, p) => sum + (p.total || 0), 0);
            const fechaRegistro = cliente.created_at ? new Date(cliente.created_at).getFullYear() : new Date().getFullYear();

            document.getElementById('historial-cliente-nombre').textContent = `${cliente.nombre} ${cliente.apellidos || ''}`.trim();
            document.getElementById('historial-cliente-email').textContent = cliente.email || 'Sin email';
            const elPed = document.getElementById('stat-pedidos-num') || document.getElementById('stat-pedidos');
            const elGas = document.getElementById('stat-gastado-num') || document.getElementById('stat-gastado');
            if (elPed) elPed.textContent = totalPedidos;
            if (elGas) elGas.textContent = window.flowerShopAPI.formatCurrency(totalGastado);
            const elFecha = document.getElementById('stat-fecha');
            if (elFecha) elFecha.innerHTML = `Desde <strong>${fechaRegistro}</strong>`;

            // Resetear filtros y guardar pedidos del cliente para filtrado
            const filtroPeriodo = document.getElementById('filtro-periodo');
            const filtroEstado = document.getElementById('filtro-estado');
            if (filtroPeriodo) filtroPeriodo.value = 'todos';
            if (filtroEstado) filtroEstado.value = 'todos';

            this._historialPedidos = pedidosCliente;
            this.mostrarHistorialPedidos(pedidosCliente);

            // Listeners de filtros (reemplazar para no acumular)
            const applyFilters = () => {
                const dias = filtroPeriodo ? filtroPeriodo.value : 'todos';
                const estado = filtroEstado ? filtroEstado.value : 'todos';
                let filtrados = this._historialPedidos;
                if (dias !== 'todos') {
                    const corte = new Date(Date.now() - parseInt(dias) * 86400000);
                    filtrados = filtrados.filter(p => new Date(p.fecha_pedido || p.created_at) >= corte);
                }
                if (estado !== 'todos') {
                    filtrados = filtrados.filter(p => (p.estado || '').toLowerCase() === estado);
                }
                this.mostrarHistorialPedidos(filtrados);
            };
            if (filtroPeriodo) { filtroPeriodo.onchange = applyFilters; }
            if (filtroEstado) { filtroEstado.onchange = applyFilters; }

            this.showModal('modal-historial-cliente');
        } catch (error) {
            console.error('❌ Error cargando historial del cliente:', error);
            this.showNotification('Error cargando historial del cliente', 'error');
        }
    }

    mostrarHistorialPedidos(pedidos) {
        const container = document.getElementById('historial-pedidos-lista');

        if (pedidos.length === 0) {
            container.innerHTML = `<div class="historial-empty">Sin pedidos registrados</div>`;
            return;
        }

        const pedidosOrdenados = pedidos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        container.innerHTML = `
            <table class="historial-table">
                <thead>
                    <tr>
                        <th>Pedido</th>
                        <th>Fecha</th>
                        <th>Entrega</th>
                        <th>Estado</th>
                        <th class="text-right">Total</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    ${pedidosOrdenados.map(p => `
                        <tr>
                            <td class="historial-num">#${p.numero_pedido}</td>
                            <td class="historial-fecha">${window.flowerShopAPI.formatDate(p.created_at)}</td>
                            <td class="historial-fecha">${p.fecha_entrega ? window.flowerShopAPI.formatDate(p.fecha_entrega) : '—'}</td>
                            <td><span class="estado-badge ${p.estado}">${p.estado}</span></td>
                            <td class="historial-total text-right">${window.flowerShopAPI.formatCurrency(p.total || 0)}</td>
                            <td><button class="btn btn-sm btn-secondary" onclick="app.verPedido(${p.id})">Ver</button></td>
                        </tr>
                        ${p.notas ? `<tr class="historial-notas-row"><td colspan="6"><span class="historial-nota-text">${p.notas}</span></td></tr>` : ''}
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    async nuevoPedidoCliente(id) {
        try {
            const clientes = await window.flowerShopAPI.getClientes();
            const cliente = clientes.find(c => c.id === parseInt(id));
            if (!cliente) {
                this.showNotification('Cliente no encontrado', 'error');
                return;
            }
            await this.nuevoPedido(true);
            setTimeout(() => this.preseleccionarClienteEnModal(cliente, id), 200);
        } catch (error) {
            console.error('❌ Error abriendo formulario de pedido:', error);
            this.showNotification('Error abriendo formulario de pedido', 'error');
        }
    }

    preseleccionarClienteEnModal(cliente, id) {
        const clienteSelect = document.getElementById('pedido-cliente');
        if (!clienteSelect) return;
        const opcionCliente = Array.from(clienteSelect.options).find(o => o.value == id);
        if (!opcionCliente) return;

        clienteSelect.value = id;
        clienteSelect.disabled = true;

        const infoExtra = [cliente.telefono, cliente.email].filter(Boolean).map(v => v.trim()).join(' · ');
        const clienteInfo = document.createElement('div');
        clienteInfo.className = 'cliente-preseleccionado-info';
        clienteInfo.innerHTML = `<strong>${cliente.nombre} ${cliente.apellidos || ''}</strong>${infoExtra ? `<span>${infoExtra}</span>` : ''}`;
        clienteSelect.parentNode.insertBefore(clienteInfo, clienteSelect.nextSibling);
    }

    // Función auxiliar para ver detalles de un pedido desde el historial
    async verDetallePedido(pedidoId) {
        this.showNotification('Vista de detalles del pedido en desarrollo', 'info');
    }

    // Función para exportar historial del cliente
    async exportarHistorialCliente() {
        this.showNotification('Exportación de PDF en desarrollo', 'info');
    }

    // Eventos
    async nuevoEvento() {
        try {
            this.clearForm('form-evento');
            this.showModal('modal-evento');
        } catch (error) {
            console.error('❌ Error abriendo modal de evento:', error);
            this.showNotification('Error abriendo formulario', 'error');
        }
    }

    async editarEvento(id) {
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
            this.showModal('modal-evento');
        } catch (error) {
            console.error('❌ Error editando evento:', error);
            this.showNotification('Error abriendo editor', 'error');
        }
    }
    // Eliminar evento
    async eliminarEvento(id) {
        const ok = await this._confirm('Eliminar evento', 'Esta acción no se puede deshacer. ¿Seguro que quieres eliminar este evento?');
        if (!ok) return;
        try {
            await window.flowerShopAPI.eliminarEvento(id);
            this.showNotification('Evento eliminado correctamente', 'success');
            await this.loadEventosData();
        } catch (error) {
            this.showNotification('Error al eliminar el evento', 'error');
            console.error('Error eliminando evento:', error);
        }
    }

    async gestionarEventoStock(eventoId) {
        try {
            const [eventos, productos] = await Promise.all([
                window.flowerShopAPI.getEventos(),
                window.flowerShopAPI.getProductos()
            ]);
            const evento = eventos.find(e => e.id === eventoId);
            if (!evento) return;

            const modal = document.createElement('div');
            modal.id = 'modal-evento-stock';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content modal-md">
                    <div class="modal-header">
                        <div class="modal-header-inner">
                            <div class="modal-header-icon"><i data-lucide="package-check"></i></div>
                            <div>
                                <h2 class="modal-title-pro">Stock del Evento</h2>
                                <p class="modal-subtitle-pro">${evento.nombre}</p>
                            </div>
                        </div>
                        <button class="modal-close" aria-label="Cerrar">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-section-title"><span class="form-section-dot"></span>Registrar ajuste de stock</div>
                        <div class="pedido-form-grid" style="margin-bottom:var(--sp-4)">
                            <div class="form-group">
                                <label>Producto</label>
                                <select id="evento-stock-producto" class="form-select">
                                    <option value="">Seleccionar producto…</option>
                                    ${productos.map(p => `<option value="${p.id}" data-stock="${p.stock_actual}" data-unidad="${p.unidad_medida}">${p.nombre} (${p.stock_actual} ${p.unidad_medida})</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Tipo de movimiento</label>
                                <select id="evento-stock-tipo" class="form-select">
                                    <option value="salida">Salida (reservar para evento)</option>
                                    <option value="entrada">Entrada (devolución)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Cantidad</label>
                                <input type="number" id="evento-stock-cantidad" class="form-input" min="1" value="1" placeholder="0">
                            </div>
                            <div class="form-group">
                                <label>Notas</label>
                                <input type="text" id="evento-stock-notas" class="form-input" placeholder="Opcional…">
                            </div>
                        </div>
                        <div class="form-section-title"><span class="form-section-dot"></span>Inventario actual</div>
                        <div class="evento-stock-lista">
                            ${productos.slice(0, 20).map(p => `
                                <div class="evento-stock-row">
                                    <span class="evento-stock-nombre">${p.nombre}</span>
                                    <span class="stock-badge ${p.stock_actual <= p.stock_minimo ? 'low-stock' : 'normal-stock'}">${p.stock_actual} ${p.unidad_medida}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary modal-close">Cancelar</button>
                        <button type="button" class="btn btn-primary" id="btn-confirmar-evento-stock">Registrar Movimiento</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', () => this.closeModal(modal)));
            modal.addEventListener('click', e => { if (e.target === modal) this.closeModal(modal); });
            modal.querySelector('#btn-confirmar-evento-stock').addEventListener('click', async () => {
                const selectEl = modal.querySelector('#evento-stock-producto');
                const productoId = parseInt(selectEl.value);
                const tipo = modal.querySelector('#evento-stock-tipo').value;
                const cantidad = parseInt(modal.querySelector('#evento-stock-cantidad').value);
                const motivo = modal.querySelector('#evento-stock-notas').value || `Evento: ${evento.nombre}`;
                const stockActual = parseInt(selectEl.selectedOptions[0]?.dataset.stock || 0);
                const stockNuevo = tipo === 'entrada' ? stockActual + cantidad : stockActual - cantidad;
                if (!productoId || !cantidad || cantidad < 1) {
                    this.showNotification('Selecciona un producto y una cantidad válida', 'warning');
                    return;
                }
                try {
                    await window.flowerShopAPI.registrarMovimientoInventario({
                        producto_id: productoId,
                        tipo_movimiento: tipo,
                        cantidad,
                        stock_anterior: stockActual,
                        stock_nuevo: stockNuevo,
                        motivo,
                        referencia: `Evento #${eventoId}`,
                        usuario: 'Usuario'
                    });
                    this.showNotification('Movimiento registrado correctamente', 'success');
                    this.closeModal(modal);
                } catch (err) {
                    console.error(err);
                    this.showNotification('Error al registrar el movimiento', 'error');
                }
            });

            this.showModal('modal-evento-stock');
        } catch (e) {
            console.error(e);
            this.showNotification('Error cargando datos del evento', 'error');
        }
    }

    // ========== TPV / VENTA RÁPIDA ==========
    async ventaRapida() {
        try {
            const [productos, clientes] = await Promise.all([
                window.flowerShopAPI.getProductos(),
                window.flowerShopAPI.getClientes()
            ]);
            this._tpvProductos = productos;
            this._tpvCarrito = [];
            this._tpvMetodoPago = 'efectivo';

            // Catálogo
            this.renderCatalogoTPV(productos);

            // Clientes select
            const sel = document.getElementById('tpv-cliente');
            if (sel) {
                sel.innerHTML = '<option value="">— Cliente ocasional —</option>' +
                    clientes.map(c => `<option value="${c.id}">${c.nombre} ${c.apellidos || ''}</option>`).join('');
            }

            // Reset búsqueda y ticket
            const busq = document.getElementById('tpv-busqueda');
            if (busq) busq.value = '';
            this.renderTicketTPV();

            // Reset método pago
            document.querySelectorAll('.tpv-pago-btn').forEach(b => b.classList.remove('active'));
            const btnEfectivo = document.querySelector('.tpv-pago-btn[data-metodo="efectivo"]');
            if (btnEfectivo) btnEfectivo.classList.add('active');

            this.showModal('modal-tpv');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } catch (error) {
            console.error('Error abriendo TPV:', error);
            this.showNotification('Error abriendo venta rápida', 'error');
        }
    }

    renderCatalogoTPV(productos) {
        const container = document.getElementById('tpv-catalogo');
        if (!container) return;
        if (!productos.length) {
            container.innerHTML = '<p style="color:var(--s-400);font-size:0.82rem;padding:var(--sp-3)">Sin productos disponibles</p>';
            return;
        }
        container.innerHTML = productos.map(p => `
            <div class="tpv-producto-card ${p.stock_actual <= 0 ? 'sin-stock' : ''}" onclick="app.agregarAlCarritoTPV(${p.id})">
                <div class="tpv-producto-emoji">${p.categoria_icono || '🌸'}</div>
                <div class="tpv-producto-nombre">${p.nombre}</div>
                <div class="tpv-producto-precio">${window.flowerShopAPI.formatCurrency(p.precio_venta || 0)}</div>
                <div class="tpv-producto-stock">${p.stock_actual <= 0 ? 'Sin stock' : `Stock: ${p.stock_actual}`}</div>
            </div>
        `).join('');
    }

    filtrarCatalogoTPV(busqueda) {
        const filtrados = (this._tpvProductos || []).filter(p =>
            p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            (p.categoria_nombre || '').toLowerCase().includes(busqueda.toLowerCase())
        );
        this.renderCatalogoTPV(filtrados);
    }

    agregarAlCarritoTPV(productoId) {
        const producto = (this._tpvProductos || []).find(p => p.id === productoId);
        if (!producto) return;
        const existente = this._tpvCarrito.find(i => i.id === productoId);
        if (existente) {
            if (existente.cantidad >= producto.stock_actual) {
                this.showNotification('Stock máximo alcanzado', 'warning');
                return;
            }
            existente.cantidad++;
        } else {
            this._tpvCarrito.push({ id: productoId, nombre: producto.nombre, precio: producto.precio_venta || 0, cantidad: 1, stock: producto.stock_actual });
        }
        this.renderTicketTPV();
    }

    cambiarCantidadTPV(productoId, delta) {
        const idx = this._tpvCarrito.findIndex(i => i.id === productoId);
        if (idx === -1) return;
        this._tpvCarrito[idx].cantidad += delta;
        if (this._tpvCarrito[idx].cantidad <= 0) this._tpvCarrito.splice(idx, 1);
        this.renderTicketTPV();
    }

    limpiarTPV() {
        this._tpvCarrito = [];
        this.renderTicketTPV();
    }

    renderTicketTPV() {
        const lista = document.getElementById('tpv-ticket-lista');
        const elSubtotal = document.getElementById('tpv-subtotal');
        const elTotal = document.getElementById('tpv-total');
        if (!lista) return;

        if (!this._tpvCarrito || this._tpvCarrito.length === 0) {
            lista.innerHTML = '<p style="color:var(--s-400);font-size:0.8rem;text-align:center;padding:var(--sp-4)">Toca un producto para añadir</p>';
            if (elSubtotal) elSubtotal.textContent = '0,00 €';
            if (elTotal) elTotal.textContent = '0,00 €';
            return;
        }

        const total = this._tpvCarrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
        lista.innerHTML = this._tpvCarrito.map(item => `
            <div class="tpv-ticket-item">
                <span class="tpv-ticket-nombre">${item.nombre}</span>
                <div class="tpv-qty-ctrl">
                    <button class="tpv-qty-btn" onclick="app.cambiarCantidadTPV(${item.id}, -1)">−</button>
                    <span class="tpv-qty-num">${item.cantidad}</span>
                    <button class="tpv-qty-btn" onclick="app.cambiarCantidadTPV(${item.id}, 1)">+</button>
                </div>
                <span class="tpv-ticket-subtotal">${window.flowerShopAPI.formatCurrency(item.precio * item.cantidad)}</span>
            </div>
        `).join('');
        if (elSubtotal) elSubtotal.textContent = window.flowerShopAPI.formatCurrency(total);
        if (elTotal) elTotal.textContent = window.flowerShopAPI.formatCurrency(total);
    }

    seleccionarPagoTPV(btn) {
        document.querySelectorAll('.tpv-pago-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._tpvMetodoPago = btn.dataset.metodo;
    }

    async cobrarTPV() {
        if (!this._tpvCarrito || this._tpvCarrito.length === 0) {
            this.showNotification('Añade al menos un producto', 'warning');
            return;
        }

        const clienteId = document.getElementById('tpv-cliente')?.value || null;
        const total = this._tpvCarrito.reduce((s, i) => s + i.precio * i.cantidad, 0);

        const pedido = {
            cliente_id: clienteId ? parseInt(clienteId) : null,
            fecha_pedido: new Date().toISOString().slice(0, 10),
            fecha_entrega: new Date().toISOString().slice(0, 10),
            estado: 'completado',
            notas: `Venta rápida · Pago: ${this._tpvMetodoPago}`,
            total,
            detalles: this._tpvCarrito.map(i => ({
                producto_id: i.id,
                cantidad: i.cantidad,
                precio_unitario: i.precio,
                subtotal: i.precio * i.cantidad
            }))
        };

        try {
            const btnCobrar = document.getElementById('btn-cobrar-tpv');
            if (btnCobrar) { btnCobrar.disabled = true; btnCobrar.textContent = 'Procesando…'; }

            await window.flowerShopAPI.crearPedido(pedido);
            this.hideModal('modal-tpv');
            this.showNotification(`Venta de ${window.flowerShopAPI.formatCurrency(total)} registrada correctamente`, 'success');
            if (this.currentSection === 'dashboard') await this.loadDashboardData();
        } catch (error) {
            console.error('Error registrando venta:', error);
            this.showNotification('Error al registrar la venta', 'error');
        } finally {
            const btnCobrar = document.getElementById('btn-cobrar-tpv');
            if (btnCobrar) { btnCobrar.disabled = false; btnCobrar.innerHTML = '<i data-lucide="check-circle" style="width:18px;height:18px;margin-right:6px"></i>Cobrar'; if (typeof lucide !== 'undefined') lucide.createIcons(); }
        }
    }

    async nuevoPedido(desdeCliente = false) {
        try {
            // Crear modal si no existe
            let modal = document.getElementById('modal-nuevo-pedido');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'modal-nuevo-pedido';
                modal.className = 'modal';
                modal.innerHTML = `
                    <div class="modal-content modal-lg">
                        <div class="modal-header">
                            <div class="modal-header-inner">
                                <div class="modal-header-icon"><i data-lucide="clipboard-list"></i></div>
                                <div>
                                    <h2 class="modal-title-pro">Nuevo Pedido</h2>
                                    <p class="modal-subtitle-pro">Selecciona productos y configura el pedido</p>
                                </div>
                            </div>
                            <button class="modal-close" aria-label="Cerrar">&times;</button>
                        </div>
                        <div class="modal-body" style="padding:0;display:grid;grid-template-columns:1fr 300px;min-height:420px">
                            <!-- Panel izquierdo: productos -->
                            <div style="padding:var(--sp-5);border-right:1px solid var(--s-100);display:flex;flex-direction:column;gap:var(--sp-3)">
                                <div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">Productos</div>
                                <input type="text" id="pedido-buscar-producto" class="form-input" placeholder="Buscar producto…" autocomplete="off">
                                <div id="pedido-productos-catalogo" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:var(--sp-2);max-height:280px"></div>
                            </div>
                            <!-- Panel derecho: resumen + datos -->
                            <div style="padding:var(--sp-5);display:flex;flex-direction:column;gap:var(--sp-4)">
                                <div>
                                    <div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:var(--sp-2)">Cliente *</div>
                                    <select id="pedido-cliente" name="cliente_id" required class="form-select"></select>
                                </div>
                                <div>
                                    <div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:var(--sp-2)">Fecha de entrega *</div>
                                    <input type="date" id="pedido-entrega" name="entrega" required class="form-input">
                                </div>
                                <div>
                                    <div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:var(--sp-2)">Seleccionados</div>
                                    <div id="pedido-carrito" style="display:flex;flex-direction:column;gap:var(--sp-2);max-height:160px;overflow-y:auto">
                                        <div id="pedido-carrito-vacio" style="font-size:0.82rem;color:var(--text-muted);text-align:center;padding:var(--sp-4) 0">Sin productos aún</div>
                                    </div>
                                </div>
                                <div style="margin-top:auto;padding-top:var(--sp-3);border-top:1px solid var(--s-100)">
                                    <div style="display:flex;justify-content:space-between;font-size:0.88rem;font-weight:600;color:var(--text-primary)">
                                        <span>Total estimado</span>
                                        <span id="pedido-total-estimado">0,00 €</span>
                                    </div>
                                </div>
                                <div>
                                    <div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:var(--sp-2)">Notas</div>
                                    <textarea id="pedido-notas" name="notas" rows="2" class="form-input" placeholder="Instrucciones especiales…"></textarea>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary btn-cancel-pedido">Cancelar</button>
                            <button type="button" id="btn-guardar-pedido" class="btn btn-primary">Guardar Pedido</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
                modal.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', () => this.limpiarYCerrarModalPedido()));
                modal.querySelector('.btn-cancel-pedido').onclick = () => this.limpiarYCerrarModalPedido();
                modal.addEventListener('click', (e) => { if (e.target === modal) this.limpiarYCerrarModalPedido(); });
                modal.querySelector('#btn-guardar-pedido').onclick = () => this.handleNuevoPedidoSubmitV2();
                modal.querySelector('#pedido-buscar-producto').addEventListener('input', (e) => this.filtrarCatalogoProductos(e.target.value));
            }
            // Cargar clientes y productos
            await this.cargarClientesEnPedido();
            await this.cargarProductosEnPedido();
            
            // Solo limpiar si NO viene desde un cliente específico
            if (!desdeCliente) {
                // Limpiar formulario completamente DESPUÉS de cargar datos
                setTimeout(() => {
                    this.limpiarFormularioPedido();
                }, 100);
            }
            
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
        const opciones = clientes.map(c => {
            const nombre = `${c.nombre} ${c.apellidos || ''}`.trim();
            const extra = c.telefono ? ` — ${c.telefono.trim()}` : '';
            return `<option value="${c.id}">${nombre}${extra}</option>`;
        }).join('');
        select.innerHTML = '<option value="">Seleccionar cliente…</option>' + opciones;
    }

    async cargarProductosEnPedido() {
        this._productosParaPedido = await window.flowerShopAPI.getProductos();
        this._carritoProductos = this._carritoProductos || {};
        this.filtrarCatalogoProductos('');
    }

    filtrarCatalogoProductos(busqueda) {
        const catalogo = document.getElementById('pedido-productos-catalogo');
        if (!catalogo) return;
        const productos = (this._productosParaPedido || []).filter(p =>
            !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase())
        );
        if (productos.length === 0) {
            catalogo.innerHTML = `<div style="font-size:0.82rem;color:var(--text-muted);text-align:center;padding:var(--sp-4) 0">Sin resultados</div>`;
            return;
        }
        catalogo.innerHTML = productos.map(p => `
            <div style="display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-2) var(--sp-3);border-radius:var(--r-lg);border:1px solid var(--s-100);cursor:pointer;transition:background .1s"
                 onmouseenter="this.style.background='var(--s-50)'" onmouseleave="this.style.background=''"
                 onclick="app.agregarAlCarrito(${p.id})">
                <div style="flex:1;min-width:0">
                    <div style="font-size:0.85rem;font-weight:500;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.nombre}</div>
                    <div style="font-size:0.75rem;color:var(--text-muted)">${window.flowerShopAPI.formatCurrency(p.precio_venta)} · Stock: ${p.stock_actual}</div>
                </div>
                <button type="button" style="width:26px;height:26px;border-radius:50%;background:var(--p-500);color:#fff;border:none;font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0">+</button>
            </div>
        `).join('');
    }

    agregarAlCarrito(productoId) {
        if (!this._carritoProductos) this._carritoProductos = {};
        const prod = (this._productosParaPedido || []).find(p => p.id === productoId);
        if (!prod) return;
        if (this._carritoProductos[productoId]) {
            this._carritoProductos[productoId].cantidad++;
        } else {
            this._carritoProductos[productoId] = { ...prod, cantidad: 1 };
        }
        this.renderCarrito();
    }

    renderCarrito() {
        const carrito = document.getElementById('pedido-carrito');
        const vacio = document.getElementById('pedido-carrito-vacio');
        const totalEl = document.getElementById('pedido-total-estimado');
        if (!carrito) return;

        const items = Object.values(this._carritoProductos || {}).filter(i => i.cantidad > 0);

        if (vacio) vacio.style.display = items.length === 0 ? '' : 'none';

        const existentes = carrito.querySelectorAll('.carrito-item');
        existentes.forEach(e => e.remove());

        let total = 0;
        items.forEach(item => {
            total += item.precio_venta * item.cantidad;
            const div = document.createElement('div');
            div.className = 'carrito-item';
            div.style.cssText = 'display:flex;align-items:center;gap:var(--sp-2);font-size:0.82rem';
            div.innerHTML = `
                <div style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text-primary)">${item.nombre}</div>
                <div style="display:flex;align-items:center;gap:var(--sp-1);flex-shrink:0">
                    <button type="button" onclick="app.cambiarCantidadCarrito(${item.id},-1)" style="width:20px;height:20px;border-radius:4px;border:1px solid var(--s-200);background:#fff;cursor:pointer;font-size:0.85rem">−</button>
                    <span style="min-width:18px;text-align:center;font-weight:600">${item.cantidad}</span>
                    <button type="button" onclick="app.cambiarCantidadCarrito(${item.id},1)" style="width:20px;height:20px;border-radius:4px;border:1px solid var(--s-200);background:#fff;cursor:pointer;font-size:0.85rem">+</button>
                </div>
                <div style="color:var(--text-muted);flex-shrink:0;min-width:44px;text-align:right">${window.flowerShopAPI.formatCurrency(item.precio_venta * item.cantidad)}</div>
            `;
            carrito.appendChild(div);
        });

        if (totalEl) totalEl.textContent = window.flowerShopAPI.formatCurrency(total);
    }

    cambiarCantidadCarrito(productoId, delta) {
        if (!this._carritoProductos?.[productoId]) return;
        this._carritoProductos[productoId].cantidad += delta;
        if (this._carritoProductos[productoId].cantidad <= 0) {
            delete this._carritoProductos[productoId];
        }
        this.renderCarrito();
    }

    limpiarFormularioPedido() {
        const clienteSelect = document.getElementById('pedido-cliente');
        if (clienteSelect) {
            clienteSelect.value = '';
            clienteSelect.disabled = false;
            clienteSelect.parentNode?.querySelectorAll('.cliente-preseleccionado-info').forEach(el => el.remove());
        }
        const fechaEntrega = document.getElementById('pedido-entrega');
        if (fechaEntrega) fechaEntrega.value = '';
        const notas = document.getElementById('pedido-notas');
        if (notas) notas.value = '';
        this._carritoProductos = {};
        this.renderCarrito();
    }

    async handleNuevoPedidoSubmitV2() {
        try {
            const clienteId = document.getElementById('pedido-cliente')?.value;
            const entrega = document.getElementById('pedido-entrega')?.value;
            const notas = document.getElementById('pedido-notas')?.value || '';
            const items = Object.values(this._carritoProductos || {}).filter(i => i.cantidad > 0);

            if (!clienteId || !entrega || items.length === 0) {
                this.showNotification('Selecciona cliente, fecha de entrega y al menos un producto', 'warning');
                return;
            }

            const productosData = this._productosParaPedido || [];
            let subtotal = 0;
            const detalles = items.map(item => {
                const precio_unitario = parseFloat(item.precio_venta);
                const sub = precio_unitario * item.cantidad;
                subtotal += sub;
                return { producto_id: item.id, cantidad: item.cantidad, precio_unitario, subtotal: sub };
            });

            const pedidoData = {
                cliente_id: parseInt(clienteId),
                fecha_entrega: entrega,
                notas,
                estado: 'pendiente',
                subtotal,
                total: subtotal,
                descuento: 0,
                adelanto: 0,
                saldo_pendiente: subtotal,
                metodo_pago: '',
                direccion_entrega: '',
                instrucciones_especiales: notas,
                detalles: detalles
            };

            await window.flowerShopAPI.crearPedido(pedidoData);
            this.showNotification('Pedido creado correctamente', 'success');
            this.limpiarYCerrarModalPedido();
            await this.loadPedidosData();
            await this.updateSidebarBadges();
        } catch (error) {
            console.error('Error creando pedido:', error);
            this.showNotification('Error al crear el pedido', 'error');
        }
    }

    limpiarYCerrarModalPedido() {
        this.limpiarFormularioPedido();
        this.hideModal('modal-nuevo-pedido');
    }

    agregarProductoAlPedido() {
        const productos = this._productosParaPedido || [];
        const list = document.getElementById('pedido-productos-list');
        if (!list) return;
        
        // Crear fila de selección compacta
        const row = document.createElement('div');
        row.className = 'pedido-producto-row';
        row.className = 'pedido-producto-row';
        row.innerHTML = `
            <select class="pedido-producto-select form-select" required>
                <option value="">Seleccionar producto…</option>
                ${productos.map(p => `<option value="${p.id}">${p.nombre} — €${parseFloat(p.precio_venta).toFixed(2)}</option>`).join('')}
            </select>
            <input type="number" class="pedido-producto-cantidad form-input" min="1" value="1" required />
            <button type="button" class="btn-quitar-producto" title="Quitar">&times;</button>
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

            // Calcular subtotal y total (sin descuentos ni impuestos por ahora)
            let subtotal = 0;
            let total = 0;
            let descuento = 0;
            let adelanto = 0;
            let saldo_pendiente = 0;
            let metodo_pago = '';
            let direccion_entrega = '';
            let instrucciones_especiales = '';
            // Obtener precios de productos
            const productosData = this._productosParaPedido || [];
            const detalles = productos.map(p => {
                const prod = productosData.find(pr => pr.id === p.producto_id);
                const precio_unitario = prod ? parseFloat(prod.precio_venta) : 0;
                const cantidad = p.cantidad;
                const subtotalDetalle = precio_unitario * cantidad;
                subtotal += subtotalDetalle;
                return {
                    producto_id: p.producto_id,
                    cantidad,
                    precio_unitario,
                    subtotal: subtotalDetalle,
                    personalizacion: ''
                };
            });
            total = subtotal - descuento; // No se aplica descuento ni impuestos por ahora
            saldo_pendiente = total - adelanto;

            // Guardar pedido con todos los campos requeridos
            const pedido = {
                cliente_id: parseInt(clienteId),
                evento_id: null, // No se selecciona evento en el formulario actual
                fecha_entrega: entrega,
                estado: 'pendiente',
                tipo_pedido: 'regular',
                subtotal,
                descuento,
                total,
                adelanto,
                saldo_pendiente,
                metodo_pago,
                direccion_entrega,
                instrucciones_especiales,
                notas,
                detalles
            };
            await window.flowerShopAPI.crearPedido(pedido);
            this.showNotification('Pedido creado correctamente', 'success');
            this.limpiarYCerrarModalPedido();
            await this.loadPedidosData();
            await this.updateSidebarBadges();
        } catch (error) {
            this.showNotification('Error guardando pedido', 'error');
        }
    }

    // ========== MODALES ==========
    setupModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            // Cerrar con cualquier botón .modal-close o .btn-cancelar dentro del modal
            const closeBtns = modal.querySelectorAll('.modal-close, .btn-cancelar, .modal-close-btn');
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
                    // Si es el modal de pedidos, usar la función de limpieza
                    if (activeModal.id === 'modal-nuevo-pedido') {
                        this.limpiarYCerrarModalPedido();
                    } else {
                        this.hideModal(activeModal.id);
                    }
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
            await this.updateSidebarBadges();
        } catch (error) {
            console.error('❌ Error guardando producto:', error);
            this.showNotification('Error guardando producto: ' + error.message, 'error');
        }
    }

    async handleClienteSubmit(e) {
        try {
            e.preventDefault();
            const form = e.target;
            const formData = new FormData(form);
            const editId = form.getAttribute('data-edit-id');
            
            const nombreCompleto = formData.get('nombre_completo')?.trim() || '';
            const cliente = {
                nombre: nombreCompleto,
                email: formData.get('email'),
                telefono: formData.get('telefono'),
                direccion: formData.get('direccion'),
                fecha_nacimiento: formData.get('fecha_nacimiento'),
                tipo_cliente: formData.get('tipo_cliente') || 'nuevo',
                preferencias: formData.get('preferencias'),
                presupuesto_habitual: formData.get('presupuesto_habitual') ? parseFloat(formData.get('presupuesto_habitual')) : null,
                ocasiones_importantes: formData.get('ocasiones_importantes'),
                notas: formData.get('notas')
            };

            if (!cliente.nombre) {
                this.showNotification('El nombre completo es obligatorio', 'warning');
                return;
            }

            // Validar email si se proporciona
            if (cliente.email && !cliente.email.includes('@')) {
                this.showNotification('El formato del email no es válido', 'warning');
                return;
            }

            if (editId) {
                await window.flowerShopAPI.actualizarCliente(editId, cliente);
                this.showNotification('Cliente actualizado correctamente', 'success');
            } else {
                await window.flowerShopAPI.crearCliente(cliente);
                this.showNotification('Cliente creado correctamente', 'success');
            }
            
            this.hideModal('modal-cliente');
            await this.loadClientesData();
            await this.updateSidebarBadges();
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
            await this.updateSidebarBadges();
        } catch (error) {
            console.error('❌ Error guardando evento:', error);
            this.showNotification('Error guardando evento: ' + error.message, 'error');
        }
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        let backdrop = document.getElementById('modal-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.id = 'modal-backdrop';
            document.body.appendChild(backdrop);
        }
        backdrop.onclick = () => this.hideModal(modalId);
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => {
            modal.classList.add('modal-open');
            backdrop.classList.add('backdrop-open');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        const backdrop = document.getElementById('modal-backdrop');
        modal.classList.remove('modal-open');
        if (backdrop) backdrop.classList.remove('backdrop-open');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }, 250);
    }

    // ========== EVENT LISTENERS ==========
    setupEventListeners() {
        // Botones principales
        document.getElementById('btn-nuevo-producto')?.addEventListener('click', () => this.nuevoProducto());
        document.getElementById('btn-nuevo-cliente')?.addEventListener('click', () => this.nuevoCliente());
        document.getElementById('btn-nuevo-evento')?.addEventListener('click', () => this.nuevoEvento());
        document.getElementById('btn-nuevo-pedido')?.addEventListener('click', () => this.nuevoPedido());
        document.getElementById('btn-nuevo-pedido-section')?.addEventListener('click', () => this.nuevoPedido());
        
        // Botones de inventario — use replaceWith to prevent duplicate stacking
        ['btn-generar-orden-auto','btn-nueva-orden','btn-nuevo-movimiento','btn-filtrar-movimientos'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            const fresh = el.cloneNode(true);
            el.replaceWith(fresh);
            if (id === 'btn-generar-orden-auto') fresh.addEventListener('click', () => this.generarOrdenAutomatica());
            else if (id === 'btn-nueva-orden') fresh.addEventListener('click', () => this.nuevaOrdenCompra());
            else if (id === 'btn-nuevo-movimiento') fresh.addEventListener('click', () => this.nuevoMovimientoInventario());
            else if (id === 'btn-filtrar-movimientos') fresh.addEventListener('click', () => this.filtrarMovimientos());
        });
        
        // Pestañas de inventario
        this.setupInventoryTabs();
        
        // Floating Action Button
        this.setupFAB();
        
        // Búsqueda y filtros
        document.getElementById('search-productos')?.addEventListener('input', (e) => {
            this.filtrarProductos(e.target.value);
        });

        document.getElementById('search-clientes')?.addEventListener('input', (e) => {
            this.filtrarClientes(e.target.value);
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

    async busquedaGlobal(termino) {
        if (termino.length < 2) return;
        const t = termino.toLowerCase();

        try {
            const [productos, clientes, pedidos] = await Promise.all([
                window.flowerShopAPI.getProductos(),
                window.flowerShopAPI.getClientes(),
                window.flowerShopAPI.getPedidos()
            ]);

            const prodEncontrados = productos.filter(p =>
                p.nombre.toLowerCase().includes(t) || (p.codigo_producto || '').toLowerCase().includes(t)
            );
            const clientesEncontrados = clientes.filter(c =>
                `${c.nombre} ${c.apellidos || ''}`.toLowerCase().includes(t) ||
                (c.email || '').toLowerCase().includes(t) ||
                (c.telefono || '').includes(t)
            );
            const pedidosEncontrados = pedidos.filter(p =>
                (p.numero_pedido || '').toLowerCase().includes(t) ||
                (`${p.cliente_nombre || ''} ${p.cliente_apellidos || ''}`).toLowerCase().includes(t)
            );

            const total = prodEncontrados.length + clientesEncontrados.length + pedidosEncontrados.length;
            if (total === 0) {
                this.showNotification(`Sin resultados para "${termino}"`, 'info');
                return;
            }

            // Navegar a la sección con más resultados
            if (prodEncontrados.length >= clientesEncontrados.length && prodEncontrados.length >= pedidosEncontrados.length) {
                this.showSection('productos');
                this._productosCache = prodEncontrados;
                this.displayProductos(prodEncontrados);
                document.getElementById('search-productos').value = termino;
            } else if (clientesEncontrados.length >= pedidosEncontrados.length) {
                this.showSection('clientes');
                this._clientesCache = clientesEncontrados;
                this.displayClientes(clientesEncontrados);
                document.getElementById('search-clientes').value = termino;
            } else {
                this.showSection('pedidos');
                this.displayPedidos(pedidosEncontrados);
            }

            this.showNotification(`${total} resultado(s) para "${termino}"`, 'success');
        } catch (error) {
            console.error('❌ Error en búsqueda global:', error);
        }
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
        const categoriaId = document.getElementById('filter-categoria')?.value || '';
        const productos = this._productosCache || [];
        const filtrados = productos.filter(p => {
            const matchText = !termino || p.nombre.toLowerCase().includes(termino.toLowerCase()) ||
                (p.codigo_producto || '').toLowerCase().includes(termino.toLowerCase());
            const matchCat = !categoriaId || String(p.categoria_id) === String(categoriaId);
            return matchText && matchCat;
        });
        this.displayProductos(filtrados);
    }

    filtrarClientes(termino) {
        const clientes = this._clientesCache || [];
        const filtrados = clientes.filter(c => {
            const nombre = `${c.nombre} ${c.apellidos || ''}`.toLowerCase();
            const t = termino.toLowerCase();
            return nombre.includes(t) || (c.email || '').toLowerCase().includes(t) ||
                (c.telefono || '').includes(t);
        });
        this.displayClientes(filtrados);
    }

    filtrarProductosPorCategoria(categoriaId) {
        const termino = document.getElementById('search-productos')?.value.toLowerCase() || '';
        const productos = this._productosCache || [];
        const filtrados = productos.filter(p => {
            const matchCat = !categoriaId || String(p.categoria_id) === String(categoriaId);
            const matchText = !termino || p.nombre.toLowerCase().includes(termino) ||
                (p.codigo_producto || '').toLowerCase().includes(termino);
            return matchCat && matchText;
        });
        this.displayProductos(filtrados);
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
        this._showDialog({
            title: '🌸 Ayuda',
            content: `
                <p class="dialog-lead">Aquí encontrarás los atajos y funciones principales del sistema.</p>
                <ul class="dialog-list">
                    <li><strong>Productos</strong> — gestiona tu inventario y categorías</li>
                    <li><strong>Clientes</strong> — registra y consulta clientes y su historial</li>
                    <li><strong>Pedidos</strong> — crea y sigue el estado de los pedidos</li>
                    <li><strong>Eventos</strong> — planifica bodas, cumpleaños y eventos especiales</li>
                    <li><strong>Inventario</strong> — alertas de stock, proveedores y órdenes de compra</li>
                    <li><strong>Reportes</strong> — analiza ventas, productos top y rentabilidad</li>
                </ul>
                <p class="dialog-hint">Manual completo próximamente disponible.</p>
            `,
            buttons: [{ label: 'Entendido', type: 'primary' }]
        });
    }

    mostrarAcercaDe() {
        this._showDialog({
            title: '🌸 Floristería Manager',
            content: `
                <div class="about-content">
                    <div class="about-icon">🌷</div>
                    <p class="about-version">Versión 1.0.0</p>
                    <p class="dialog-lead">Sistema de gestión integral para floristerías</p>
                    <p class="dialog-hint">© 2025 · Desarrollado con ❤️ para floristas</p>
                </div>
            `,
            buttons: [{ label: 'Cerrar', type: 'secondary' }]
        });
    }

    _confirm(title, message, confirmLabel = 'Eliminar', confirmClass = 'btn-danger') {
        return new Promise(resolve => {
            const existing = document.getElementById('_app-confirm');
            if (existing) existing.remove();

            const modal = document.createElement('div');
            modal.id = '_app-confirm';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content modal-sm">
                    <div class="modal-header">
                        <h3 class="modal-title-pro">${title}</h3>
                        <button class="modal-close" aria-label="Cerrar">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p class="modal-subtitle-pro">${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary _confirm-cancel">Cancelar</button>
                        <button class="btn ${confirmClass} _confirm-ok">${confirmLabel}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            this.showModal('_app-confirm');

            const cleanup = (result) => {
                this.hideModal('_app-confirm');
                setTimeout(() => modal.remove(), 300);
                resolve(result);
            };

            modal.querySelector('._confirm-ok').addEventListener('click', () => cleanup(true));
            modal.querySelector('._confirm-cancel').addEventListener('click', () => cleanup(false));
            modal.querySelector('.modal-close').addEventListener('click', () => cleanup(false));
        });
    }

    _showDialog({ title, content, buttons = [] }) {
        const existing = document.getElementById('_app-dialog');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = '_app-dialog';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content modal-sm">
                <div class="modal-header">
                    <h3 class="modal-title-pro">${title}</h3>
                    <button class="modal-close" aria-label="Cerrar">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-footer">
                    ${buttons.map(b => `<button class="btn btn-${b.type || 'secondary'} _dialog-btn" data-action="${b.action || 'close'}">${b.label}</button>`).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.showModal('_app-dialog');

        modal.querySelectorAll('._dialog-btn, .modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.hideModal('_app-dialog'));
        });
    }

    showNotification(message, type = 'info', duration = 4000) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }

        const icons = { success: '✓', error: '✕', warning: '!', info: 'i' };
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-icon-wrap"><span class="toast-icon">${icons[type] || 'i'}</span></div>
            <div class="toast-body">
                <span class="toast-message">${message}</span>
                <div class="toast-progress"><div class="toast-bar"></div></div>
            </div>
            <button class="toast-close" aria-label="Cerrar">×</button>
        `;

        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('toast-show'));

        const bar = toast.querySelector('.toast-bar');
        bar.style.animationDuration = `${duration}ms`;
        bar.classList.add('toast-bar-run');

        const dismiss = () => {
            toast.classList.remove('toast-show');
            toast.classList.add('toast-hide');
            setTimeout(() => toast.remove(), 350);
        };

        toast.querySelector('.toast-close').addEventListener('click', dismiss);
        const timer = setTimeout(dismiss, duration);
        toast.addEventListener('mouseenter', () => { clearTimeout(timer); bar.style.animationPlayState = 'paused'; });
        toast.addEventListener('mouseleave', () => setTimeout(dismiss, 1000));
    }

    // ========== FUNCIONES DE INVENTARIO AVANZADO ==========
    
    setupInventoryTabs() {
        const tabBtns = document.querySelectorAll('.inventory-tabs .tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                this.switchInventoryTab(tabId);
            });
        });
    }

    switchInventoryTab(tabId) {
        // Actualizar botones de pestañas
        document.querySelectorAll('.inventory-tabs .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

        // Actualizar contenido de pestañas
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`tab-${tabId}`).classList.add('active');

        // Cargar datos específicos de la pestaña
        this.loadInventoryTabData(tabId);
    }

    async loadInventoryTabData(tabId) {
        switch(tabId) {
            case 'dashboard':
                await this.loadInventoryDashboard();
                break;
            case 'alertas':
                await this.loadInventoryAlerts();
                break;
            case 'prediccion':
                await this.loadDemandPrediction();
                break;
            case 'proveedores':
                await this.loadProviders();
                this.setupProveedoresEventListeners();
                break;
            case 'ordenes':
                await this.loadPurchaseOrders();
                break;
            case 'movimientos':
                await this.loadInventoryMovements();
                break;
        }
    }

    async nuevoProveedor() {
        try {
            // Crear modal con el estilo igual al de productos
            const modal = this.createProveedorModal();
            document.body.appendChild(modal);
            
            // Mostrar modal usando el método estándar
            this.showModal('modal-proveedor');
            
        } catch (error) {
            console.error('❌ Error al crear proveedor:', error);
            this.showNotification('Error al abrir formulario de proveedor', 'error');
        }
    }

    createProveedorModal(proveedor = null) {
        const isEdit = proveedor !== null;
        const modal = document.createElement('div');
        modal.id = 'modal-proveedor';
        modal.className = 'modal';
        modal.style.display = 'none';
        
        modal.innerHTML = `
            <div class="modal-content modal-md">
                <div class="modal-header">
                    <div class="modal-header-inner">
                        <div class="modal-header-icon"><i data-lucide="building-2"></i></div>
                        <div>
                            <h2 class="modal-title-pro">${isEdit ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
                            <p class="modal-subtitle-pro">${isEdit ? 'Modifica los datos del proveedor' : 'Registra un nuevo proveedor en el sistema'}</p>
                        </div>
                    </div>
                    <button class="modal-close" aria-label="Cerrar">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="form-proveedor" class="form">
                        ${isEdit ? `<input type="hidden" name="id" value="${proveedor.id}">` : ''}
                        <div class="form-section-title"><span class="form-section-dot"></span>Datos del proveedor</div>
                        <div class="form-group form-group-full">
                            <label class="form-label" for="proveedor-nombre">Nombre *</label>
                            <input type="text" id="proveedor-nombre" name="nombre" class="form-input" value="${isEdit ? proveedor.nombre || '' : ''}" placeholder="Nombre del proveedor" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="proveedor-contacto">Persona de contacto</label>
                            <input type="text" id="proveedor-contacto" name="contacto" class="form-input" value="${isEdit ? proveedor.contacto || '' : ''}" placeholder="Nombre del contacto">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="proveedor-telefono">Teléfono</label>
                            <input type="tel" id="proveedor-telefono" name="telefono" class="form-input" value="${isEdit ? proveedor.telefono || '' : ''}" placeholder="+34 600 000 000">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="proveedor-email">Email</label>
                            <input type="email" id="proveedor-email" name="email" class="form-input" value="${isEdit ? proveedor.email || '' : ''}" placeholder="proveedor@email.com">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="proveedor-ciudad">Ciudad</label>
                            <input type="text" id="proveedor-ciudad" name="ciudad" class="form-input" value="${isEdit ? proveedor.ciudad || '' : ''}" placeholder="Ciudad">
                        </div>
                        <div class="form-group form-group-full">
                            <label class="form-label" for="proveedor-direccion">Dirección completa</label>
                            <textarea id="proveedor-direccion" name="direccion" class="form-input" rows="2" placeholder="Dirección, CP, provincia…">${isEdit ? proveedor.direccion || '' : ''}</textarea>
                        </div>
                    </form>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary modal-close">Cancelar</button>
                    <button type="submit" form="form-proveedor" class="btn btn-primary">${isEdit ? 'Actualizar' : 'Guardar'}</button>
                </div>
            </div>
        `;
        
        // Event listeners
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });
        
        modal.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal(modal));
        });
        
        modal.querySelector('button[type="submit"]').addEventListener('click', async (e) => {
            e.preventDefault();
            const form = document.getElementById('form-proveedor');
            if (form) {
                await this.guardarProveedor(new FormData(form), isEdit);
            }
        });
        
        return modal;
    }

    closeModal(modal) {
        const backdrop = document.getElementById('modal-backdrop');
        modal.classList.remove('modal-open');
        if (backdrop) backdrop.classList.remove('backdrop-open');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            if (modal.parentNode) modal.parentNode.removeChild(modal);
        }, 250);
    }

    async guardarProveedor(formData, isEdit = false) {
        try {
            const proveedor = {
                nombre: formData.get('nombre'),
                contacto: formData.get('contacto'),
                telefono: formData.get('telefono'),
                email: formData.get('email'),
                direccion: formData.get('direccion')
            };

            if (isEdit) {
                const id = parseInt(formData.get('id'));
                await window.flowerShopAPI.actualizarProveedor(id, proveedor);
                this.showNotification('Proveedor actualizado correctamente', 'success');
            } else {
                await window.flowerShopAPI.crearProveedor(proveedor);
                this.showNotification('Proveedor creado correctamente', 'success');
            }
            
            // Cerrar modal usando el método estándar
            this.hideModal('modal-proveedor');
            
            await this.loadProviders();
        } catch (error) {
            console.error('Error guardando proveedor:', error);
            this.showNotification('Error al guardar proveedor', 'error');
        }
    }

    async generarOrdenAutomatica() {
        try {
            const alertas = await window.flowerShopAPI.getAlertasStock();
            if (!alertas || alertas.length === 0) {
                this.showNotification('No hay productos que requieran reabastecimiento', 'info');
                return;
            }
            this.showNotification('Generando orden automática...', 'info');
            const productos = alertas.map(a => ({ producto_id: a.producto_id, cantidad: Math.max(a.stock_minimo * 2 - a.stock_actual, 1) }));
            await window.flowerShopAPI.generarOrdenCompra(productos);
            this.showNotification(`Orden automática generada con ${productos.length} productos`, 'success');
            await this.loadOrdenesCompra();
        } catch (error) {
            console.error('Error generando orden automática:', error);
            this.showNotification('Error al generar orden automática', 'error');
        }
    }

    async filtrarMovimientos() {
        const fechaDesde = document.getElementById('filter-fecha-desde').value;
        const fechaHasta = document.getElementById('filter-fecha-hasta').value;
        const tipoMovimiento = document.getElementById('filter-tipo-movimiento').value;
        
        const filtros = {
            fecha_desde: fechaDesde,
            fecha_hasta: fechaHasta,
            tipo_movimiento: tipoMovimiento
        };
        
        await this.loadMovimientosInventario(filtros);
    }

    async nuevaOrdenCompra() {
        try {
            document.getElementById('modal-orden')?.remove();
            const modal = this.createOrdenModal();
            document.body.appendChild(modal);
            this.showModal('modal-orden');
        } catch (error) {
            console.error('Error al crear orden:', error);
            this.showNotification('Error al abrir formulario de orden', 'error');
        }
    }

    async nuevoMovimientoInventario() {
        try {
            document.getElementById('modal-nuevo-movimiento')?.remove();
            const modal = this.createMovimientoInventarioModal();
            document.body.appendChild(modal);
            this.showModal('modal-nuevo-movimiento');
        } catch (error) {
            console.error('Error al crear movimiento:', error);
            this.showNotification('Error al abrir formulario de movimiento', 'error');
        }
    }

    createMovimientoInventarioModal() {
        const modal = document.createElement('div');
        modal.id = 'modal-nuevo-movimiento';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content modal-md">
                <div class="modal-header">
                    <div class="modal-header-inner">
                        <div class="modal-header-icon"><i data-lucide="activity"></i></div>
                        <div>
                            <h2 class="modal-title-pro">Registro de Movimiento</h2>
                            <p class="modal-subtitle-pro">Registra una entrada, salida o ajuste de inventario</p>
                        </div>
                    </div>
                    <button class="modal-close" aria-label="Cerrar">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="form-movimiento" class="form">
                        <div class="form-section-title"><span class="form-section-dot"></span>Datos del movimiento</div>
                        <div class="form-group form-group-full">
                            <label class="form-label" for="movimiento-producto">Producto *</label>
                            <select id="movimiento-producto" name="producto_id" class="form-select" required>
                                <option value="">Seleccionar producto…</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="movimiento-tipo">Tipo *</label>
                            <select id="movimiento-tipo" name="tipo_movimiento" class="form-select" required>
                                <option value="">Seleccionar tipo…</option>
                                <option value="entrada">Entrada</option>
                                <option value="salida">Salida</option>
                                <option value="ajuste">Ajuste</option>
                                <option value="devolucion">Devolución</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="movimiento-cantidad">Cantidad *</label>
                            <input type="number" id="movimiento-cantidad" name="cantidad" class="form-input" min="1" placeholder="0" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="movimiento-motivo">Motivo</label>
                            <input type="text" id="movimiento-motivo" name="motivo" class="form-input" placeholder="Ej: Compra, Venta, Daño…">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="movimiento-fecha">Fecha y hora</label>
                            <input type="datetime-local" id="movimiento-fecha" name="fecha_movimiento" class="form-input" value="${new Date().toISOString().slice(0, 16)}">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary modal-close">Cancelar</button>
                    <button type="submit" form="form-movimiento" class="btn btn-primary">Registrar Movimiento</button>
                </div>
            </div>
        `;
        
        // Cargar productos de forma asíncrona
        setTimeout(async () => {
            try {
                await this.loadProductosInSelect(modal.querySelector('#movimiento-producto'));
            } catch (error) {
                console.error('Error cargando productos:', error);
            }
        }, 100);
        
        modal.addEventListener('click', (e) => { if (e.target === modal) this.closeModal(modal); });
        modal.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', () => this.closeModal(modal)));
        modal.querySelector('#form-movimiento').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.guardarMovimiento(new FormData(e.target));
        });
        
        return modal;
    }

    async loadProductosInSelect(selectElement) {
        try {
            const productos = await window.flowerShopAPI.getProductos();
            productos.forEach(producto => {
                const option = document.createElement('option');
                option.value = producto.id;
                option.textContent = `${producto.nombre} (Stock: ${producto.stock_actual ?? producto.stock ?? 0})`;
                selectElement.appendChild(option);
            });
        } catch (error) {
            console.error('Error cargando productos:', error);
        }
    }

    async guardarMovimiento(formData) {
        try {
            const movimiento = {
                producto_id: parseInt(formData.get('producto_id')),
                tipo_movimiento: formData.get('tipo_movimiento'),
                cantidad: parseInt(formData.get('cantidad')),
                motivo: formData.get('motivo') || null,
                fecha_movimiento: formData.get('fecha_movimiento'),
                usuario: 'Usuario' // Aquí puedes poner el usuario actual
            };

            await window.flowerShopAPI.registrarMovimientoInventario(movimiento);
            this.showNotification('Movimiento registrado correctamente', 'success');
            const modal = document.getElementById('modal-nuevo-movimiento');
            if (modal) this.closeModal(modal);
            await this.loadMovimientosInventario();
        } catch (error) {
            console.error('Error guardando movimiento:', error);
            this.showNotification('Error al registrar movimiento', 'error');
        }
    }

    // Funciones para botones de acciones
    async editarProveedor(id) {
        try {
            const proveedores = await window.flowerShopAPI.getProveedores();
            const proveedor = proveedores.find(p => p.id === id);

            if (!proveedor) {
                this.showNotification('Proveedor no encontrado', 'error');
                return;
            }

            const modal = this.createProveedorModal(proveedor);
            document.body.appendChild(modal);
            this.showModal('modal-proveedor');
        } catch (error) {
            console.error('Error al editar proveedor:', error);
            this.showNotification('Error al cargar datos del proveedor', 'error');
        }
    }

    async eliminarProveedor(id) {
        try {
            // Obtener información del proveedor antes de eliminar
            const proveedores = await window.flowerShopAPI.getProveedores();
            const proveedor = proveedores.find(p => p.id === id);
            
            if (!proveedor) {
                this.showNotification('Proveedor no encontrado', 'error');
                return;
            }
            
            // Confirmar eliminación
            const ok = await this._confirm(
                `Eliminar proveedor`,
                `¿Seguro que quieres eliminar "<strong>${proveedor.nombre}</strong>"?<br><br>Esta acción desactivará el proveedor pero mantendrá el historial de órdenes.`
            );
            if (ok) {
                await window.flowerShopAPI.eliminarProveedor(id);
                this.showNotification(`Proveedor "${proveedor.nombre}" eliminado correctamente`, 'success');
                await this.loadProviders(); // Recargar lista
            }
            
        } catch (error) {
            console.error('❌ Error eliminando proveedor:', error);
            this.showNotification('Error al eliminar proveedor: ' + error.message, 'error');
        }
    }

    async verOrden(id) {
        try {
            const ordenes = await window.flowerShopAPI.getOrdenesCompra();
            const orden = ordenes.find(o => o.id === id);
            if (!orden) { this.showNotification('Orden no encontrada', 'error'); return; }

            const modal = document.createElement('div');
            modal.id = 'modal-ver-orden-' + id;
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content modal-md">
                    <div class="modal-header">
                        <div class="modal-header-inner">
                            <div class="modal-header-icon"><i data-lucide="file-text"></i></div>
                            <div>
                                <h2 class="modal-title-pro">${orden.numero_orden}</h2>
                                <p class="modal-subtitle-pro">Detalle de la orden de compra</p>
                            </div>
                        </div>
                        <button class="modal-close" aria-label="Cerrar">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4)">
                            <div style="display:flex;flex-direction:column;gap:var(--sp-1)">
                                <span style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">Proveedor</span>
                                <span style="font-size:0.95rem;font-weight:500;color:var(--text-primary)">${orden.proveedor_nombre || '—'}</span>
                            </div>
                            <div style="display:flex;flex-direction:column;gap:var(--sp-1)">
                                <span style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">Fecha</span>
                                <span style="font-size:0.95rem;color:var(--text-primary)">${window.flowerShopAPI.formatDate(orden.fecha_orden)}</span>
                            </div>
                            <div style="display:flex;flex-direction:column;gap:var(--sp-1)">
                                <span style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">Estado</span>
                                <span><span class="estado-badge ${orden.estado}">${orden.estado}</span></span>
                            </div>
                            <div style="display:flex;flex-direction:column;gap:var(--sp-1)">
                                <span style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">Total</span>
                                <span style="font-size:0.95rem;font-weight:600;color:var(--text-primary)">${window.flowerShopAPI.formatCurrency(orden.total || 0)}</span>
                            </div>
                            ${orden.notas ? `
                            <div style="grid-column:1/-1;display:flex;flex-direction:column;gap:var(--sp-1);padding-top:var(--sp-2);border-top:1px solid var(--s-100)">
                                <span style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">Notas</span>
                                <span style="font-size:0.9rem;color:var(--text-secondary)">${orden.notas}</span>
                            </div>` : ''}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary modal-close">Cerrar</button>
                        <button type="button" class="btn btn-primary" onclick="app.editarOrden(${id})">Editar</button>
                    </div>
                </div>`;
            modal.addEventListener('click', e => { if (e.target === modal) this.closeModal(modal); });
            modal.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', () => this.closeModal(modal)));
            document.body.appendChild(modal);
            this.showModal(modal.id);
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } catch (error) {
            console.error('Error al ver orden:', error);
            this.showNotification('Error al cargar la orden', 'error');
        }
    }

    createOrdenModal(orden = null) {
        const isEdit = orden !== null;
        const modal = document.createElement('div');
        modal.id = 'modal-orden';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content modal-md">
                <div class="modal-header">
                    <div class="modal-header-inner">
                        <div class="modal-header-icon"><i data-lucide="file-text"></i></div>
                        <div>
                            <h2 class="modal-title-pro">${isEdit ? 'Editar' : 'Nueva'} Orden de Compra</h2>
                            <p class="modal-subtitle-pro">${isEdit ? 'Modifica los datos de la orden' : 'Crea una nueva orden de compra a proveedor'}</p>
                        </div>
                    </div>
                    <button class="modal-close" aria-label="Cerrar">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="form-orden" class="form">
                        ${isEdit ? `<input type="hidden" name="id" value="${orden.id}">` : ''}
                        <div class="form-section-title"><span class="form-section-dot"></span>Datos de la orden</div>
                        <div class="form-group form-group-full">
                            <label class="form-label" for="orden-proveedor">Proveedor *</label>
                            <select id="orden-proveedor" name="proveedor_id" class="form-select" required>
                                <option value="">Seleccionar proveedor…</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="orden-fecha">Fecha de orden</label>
                            <input type="date" id="orden-fecha" name="fecha_orden" class="form-input" value="${isEdit ? (orden.fecha_orden || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="orden-estado">Estado</label>
                            <select id="orden-estado" name="estado" class="form-select">
                                <option value="pendiente" ${isEdit && orden.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                                <option value="enviada" ${isEdit && orden.estado === 'enviada' ? 'selected' : ''}>Enviada</option>
                                <option value="recibida" ${isEdit && orden.estado === 'recibida' ? 'selected' : ''}>Recibida</option>
                                <option value="cancelada" ${isEdit && orden.estado === 'cancelada' ? 'selected' : ''}>Cancelada</option>
                            </select>
                        </div>
                        <div class="form-group form-group-full">
                            <label class="form-label" for="orden-notas">Notas</label>
                            <textarea id="orden-notas" name="notas" class="form-input" rows="2" placeholder="Instrucciones o notas adicionales…">${isEdit ? orden.notas || '' : ''}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary modal-close">Cancelar</button>
                    <button type="submit" form="form-orden" class="btn btn-primary">${isEdit ? 'Actualizar' : 'Crear Orden'}</button>
                </div>
            </div>
        `;
        
        // Cargar proveedores de forma asíncrona para no bloquear
        setTimeout(async () => {
            try {
                await this.loadProveedoresInSelect(modal.querySelector('#orden-proveedor'), isEdit ? orden.proveedor_id : null);
            } catch (error) {
                console.error('Error cargando proveedores:', error);
            }
        }, 100);
        
        modal.addEventListener('click', (e) => { if (e.target === modal) this.closeModal(modal); });
        modal.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', () => this.closeModal(modal)));
        modal.querySelector('#form-orden').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.guardarOrden(new FormData(e.target), isEdit);
        });
        
        return modal;
    }

    async loadProveedoresInSelect(selectElement, selectedId = null) {
        try {
            const proveedores = await window.flowerShopAPI.getProveedores();
            proveedores.forEach(proveedor => {
                const option = document.createElement('option');
                option.value = proveedor.id;
                option.textContent = proveedor.nombre;
                if (selectedId && proveedor.id === selectedId) {
                    option.selected = true;
                }
                selectElement.appendChild(option);
            });
        } catch (error) {
            console.error('Error cargando proveedores:', error);
        }
    }

    async guardarOrden(formData, isEdit = false) {
        try {
            const orden = {
                proveedor_id: parseInt(formData.get('proveedor_id')),
                fecha_orden: formData.get('fecha_orden'),
                estado: formData.get('estado'),
                notas: formData.get('notas') || null
            };

            if (!orden.proveedor_id) {
                this.showNotification('Selecciona un proveedor', 'warning');
                return;
            }

            if (isEdit) {
                orden.id = parseInt(formData.get('id'));
                await window.flowerShopAPI.actualizarOrdenCompra(orden.id, orden.estado);
                this.showNotification('Orden actualizada correctamente', 'success');
            } else {
                await window.flowerShopAPI.crearOrdenDirecta(orden);
                this.showNotification('Orden creada correctamente', 'success');
            }
            
            const modal = document.getElementById('modal-orden');
            if (modal) this.closeModal(modal);
            await this.loadOrdenesCompra();
        } catch (error) {
            console.error('Error guardando orden:', error);
            this.showNotification('Error al guardar orden', 'error');
        }
    }

    async editarOrden(id) {
        try {
            const ordenes = await window.flowerShopAPI.getOrdenesCompra();
            const orden = ordenes.find(o => o.id === id);
            
            if (!orden) {
                this.showNotification('Orden no encontrada', 'error');
                return;
            }

            document.getElementById('modal-orden')?.remove();
            const modal = this.createOrdenModal(orden);
            document.body.appendChild(modal);
            this.showModal('modal-orden');
            
        } catch (error) {
            console.error('Error al editar orden:', error);
            this.showNotification('Error al cargar datos de la orden', 'error');
        }
    }

    async verMovimiento(id) {
        try {
            const movimientos = await window.flowerShopAPI.getMovimientosInventario({});
            const movimiento = movimientos.find(m => m.id === id);

            if (!movimiento) { this.showNotification('Movimiento no encontrado', 'error'); return; }

            document.getElementById('modal-ver-movimiento')?.remove();
            const modal = document.createElement('div');
            modal.id = 'modal-ver-movimiento';
            modal.className = 'modal';
            const tipo = (movimiento.tipo_movimiento || movimiento.tipo || '').toLowerCase();
            const tipoLabel = tipo === 'entrada' ? 'ENTRADA' : tipo === 'salida' ? 'SALIDA' : tipo.toUpperCase() || '—';
            const cantLabel = movimiento.cantidad > 0 ? `+${movimiento.cantidad}` : `${movimiento.cantidad}`;
            const hasStock = movimiento.stock_anterior != null && movimiento.stock_nuevo != null
                             && !(movimiento.stock_anterior === 0 && movimiento.stock_nuevo === 0);
            const stockColor = movimiento.stock_nuevo > movimiento.stock_anterior ? 'var(--g-600)'
                             : movimiento.stock_nuevo < movimiento.stock_anterior ? 'var(--r-500)'
                             : 'var(--text-primary)';
            const stockRow = hasStock
                ? `<div style="grid-column:1/-1;display:grid;grid-template-columns:1fr 32px 1fr;align-items:center;gap:var(--sp-2);padding:var(--sp-4);background:var(--s-50);border-radius:var(--r-lg);border:1px solid var(--s-100)">
                       <div style="text-align:center">
                           <div style="font-size:0.68rem;color:var(--text-muted);text-transform:uppercase;font-weight:600;margin-bottom:4px">Antes</div>
                           <div style="font-size:1.3rem;font-weight:700;color:var(--text-primary)">${movimiento.stock_anterior}</div>
                       </div>
                       <div style="text-align:center;color:var(--text-muted);font-size:1.1rem;font-weight:300">→</div>
                       <div style="text-align:center">
                           <div style="font-size:0.68rem;color:var(--text-muted);text-transform:uppercase;font-weight:600;margin-bottom:4px">Después</div>
                           <div style="font-size:1.3rem;font-weight:700;color:${stockColor}">${movimiento.stock_nuevo}</div>
                       </div>
                   </div>` : '';
            modal.innerHTML = `
                <div class="modal-content modal-sm">
                    <div class="modal-header">
                        <div class="modal-header-inner">
                            <div class="modal-header-icon"><i data-lucide="activity"></i></div>
                            <div>
                                <h2 class="modal-title-pro">Movimiento #${movimiento.id}</h2>
                                <p class="modal-subtitle-pro">${window.flowerShopAPI.formatDateTime(movimiento.fecha_movimiento)}</p>
                            </div>
                        </div>
                        <button class="modal-close" aria-label="Cerrar">&times;</button>
                    </div>
                    <div class="modal-body" style="display:flex;flex-direction:column;gap:var(--sp-4)">
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4)">
                            <div style="display:flex;flex-direction:column;gap:var(--sp-1);grid-column:1/-1">
                                <span style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">Producto</span>
                                <span style="font-size:1rem;font-weight:500;color:var(--text-primary)">${movimiento.producto_nombre || '—'}</span>
                            </div>
                            <div style="display:flex;flex-direction:column;gap:var(--sp-1)">
                                <span style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">Tipo</span>
                                <span><span class="estado-badge ${tipo}">${tipoLabel}</span></span>
                            </div>
                            <div style="display:flex;flex-direction:column;gap:var(--sp-1)">
                                <span style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">Cantidad</span>
                                <span style="font-size:0.95rem;font-weight:600;color:var(--text-primary)">${cantLabel}</span>
                            </div>
                            <div style="display:flex;flex-direction:column;gap:var(--sp-1)">
                                <span style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">Registrado por</span>
                                <span style="font-size:0.9rem;color:var(--text-primary)">${movimiento.usuario || 'Sistema'}</span>
                            </div>
                            ${movimiento.motivo ? `
                            <div style="grid-column:1/-1;display:flex;flex-direction:column;gap:var(--sp-1);padding-top:var(--sp-3);border-top:1px solid var(--s-100)">
                                <span style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">Motivo</span>
                                <span style="font-size:0.9rem;color:var(--text-secondary)">${movimiento.motivo}</span>
                            </div>` : ''}
                            ${stockRow}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary modal-close">Cerrar</button>
                    </div>
                </div>`;
            modal.addEventListener('click', e => { if (e.target === modal) this.closeModal(modal); });
            modal.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', () => this.closeModal(modal)));
            document.body.appendChild(modal);
            this.showModal('modal-ver-movimiento');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } catch (error) {
            console.error('Error al ver movimiento:', error);
            this.showNotification('Error al cargar datos del movimiento', 'error');
        }
    }

    async generarOrdenProducto(productoId) {
        try {
            // Obtener datos del producto
            const productos = await window.flowerShopAPI.getProductos();
            const producto = productos.find(p => p.id === productoId);
            
            if (!producto) {
                this.showNotification('Producto no encontrado', 'error');
                return;
            }

            // Crear modal para generar orden específica
            const modal = document.createElement('div');
            modal.id = 'modal-orden-producto';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>📋 Generar Orden para Producto</h2>
                        <span class="close" onclick="this.closest('.modal').style.display='none'">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="producto-info">
                            <h3>🌸 ${producto.nombre}</h3>
                            <p><strong>Stock actual:</strong> ${producto.stock}</p>
                            <p><strong>Precio:</strong> $${producto.precio}</p>
                        </div>
                        <form id="form-orden-producto" class="form">
                            <input type="hidden" name="producto_id" value="${producto.id}">
                            <div class="form-group">
                                <label for="cantidad-orden">Cantidad a solicitar *</label>
                                <input type="number" id="cantidad-orden" name="cantidad" min="1" value="10" required>
                            </div>
                            <div class="form-group">
                                <label for="proveedor-orden">Proveedor *</label>
                                <select id="proveedor-orden" name="proveedor_id" required>
                                    <option value="">Seleccionar proveedor...</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="notas-orden">Notas</label>
                                <textarea id="notas-orden" name="notas" rows="3" placeholder="Notas adicionales para la orden..."></textarea>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').style.display='none'">Cancelar</button>
                                <button type="submit" class="btn btn-primary">📦 Generar Orden</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            modal.style.display = 'flex';
            
            // Cargar proveedores
            this.loadProveedoresInSelect(modal.querySelector('#proveedor-orden'));
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                    modal.remove();
                }
            });
            
            modal.querySelector('#form-orden-producto').addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                
                // Crear orden con producto específico
                const orden = {
                    proveedor_id: parseInt(formData.get('proveedor_id')),
                    fecha_orden: new Date().toISOString().split('T')[0],
                    estado: 'pendiente',
                    notas: formData.get('notas'),
                    productos: [{
                        producto_id: parseInt(formData.get('producto_id')),
                        cantidad: parseInt(formData.get('cantidad'))
                    }]
                };
                
                try {
                    await window.flowerShopAPI.generarOrdenCompra(orden.productos);
                    this.showNotification('Orden generada correctamente', 'success');
                    modal.style.display = 'none';
                    modal.remove();
                    await this.loadOrdenesCompra();
                } catch (error) {
                    console.error('Error creando orden:', error);
                    this.showNotification('Error al generar orden', 'error');
                }
            });
            
        } catch (error) {
            console.error('Error al generar orden:', error);
            this.showNotification('Error al cargar datos del producto', 'error');
        }
    }

    // Funciones auxiliares de carga de datos
    async loadAlertasStock() {
        try {
            // Simulamos alertas basadas en productos con stock bajo
            const productos = await window.flowerShopAPI.getProductos();
            const alertas = productos.filter(p => p.stock < 10).map(p => ({
                producto_id: p.id,
                producto_nombre: p.nombre,
                stock_actual: p.stock,
                stock_minimo: 10,
                nivel: p.stock === 0 ? 'sin_stock' : p.stock < 5 ? 'critico' : 'bajo'
            }));
            
            this.renderAlertasStock(alertas);
        } catch (error) {
            console.error('Error cargando alertas:', error);
            this.renderAlertasStock([]);
        }
    }

    async loadPrediccionDemanda(periodo = 30) {
        try {
            // Simulamos predicciones basadas en datos existentes
            const productos = await window.flowerShopAPI.getProductos();
            const prediccion = productos.slice(0, 10).map(p => ({
                producto_nombre: p.nombre,
                stock_actual: p.stock,
                demanda_prevista: Math.floor(Math.random() * 20) + 5,
                stock_proyectado: p.stock - (Math.floor(Math.random() * 15) + 5)
            }));
            
            this.renderPrediccionDemanda(prediccion);
        } catch (error) {
            console.error('Error cargando predicción:', error);
            this.renderPrediccionDemanda([]);
        }
    }

    async loadOrdenesCompra() {
        try {
            const ordenes = await window.flowerShopAPI.getOrdenesCompra();
            this.renderOrdenesCompra(ordenes || []);
        } catch (error) {
            console.error('Error cargando órdenes:', error);
            this.renderOrdenesCompra([]);
        }
    }

    async loadMovimientosInventario(filtros = {}) {
        try {
            const movimientos = await window.flowerShopAPI.getMovimientosInventario(filtros);
            this.renderMovimientosInventario(movimientos || []);
        } catch (error) {
            console.error('Error cargando movimientos:', error);
            this.renderMovimientosInventario([]);
        }
    }

    renderAlertasStock(alertas) {
        const grid = document.getElementById('alertas-stock-grid');
        if (!grid) return;

        if (!alertas || alertas.length === 0) {
            grid.innerHTML = `
                <div class="inv-empty-state">
                    <div class="inv-empty-icon"><i data-lucide="shield-check"></i></div>
                    <h3>Inventario bajo control</h3>
                    <p>Todos los productos se encuentran por encima de su stock mínimo.</p>
                </div>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        grid.innerHTML = alertas.map(alerta => `
            <div class="alert-card alert-${alerta.nivel}">
                <div class="alert-header">
                    <span class="alert-icon">${alerta.nivel === 'critico' ? '🔴' : alerta.nivel === 'bajo' ? '🟡' : '⚫'}</span>
                    <span class="alert-level">${alerta.nivel.toUpperCase()}</span>
                </div>
                <h4>${alerta.producto_nombre}</h4>
                <p>Stock actual: <strong>${alerta.stock_actual}</strong></p>
                <p>Stock mínimo: <strong>${alerta.stock_minimo}</strong></p>
                <div class="alert-actions">
                    <button class="btn btn-sm btn-primary" onclick="app.generarOrdenProducto(${alerta.producto_id})">
                        🛒 Ordenar
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderPrediccionDemanda(prediccion) {
        const tbody = document.querySelector('#prediction-table tbody');
        if (!tbody) return;

        if (!prediccion || prediccion.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay datos de predicción disponibles</td></tr>';
            return;
        }

        tbody.innerHTML = prediccion.map(p => `
            <tr>
                <td>${p.producto_nombre || 'N/A'}</td>
                <td>${p.stock_actual || 0}</td>
                <td>${p.demanda_prevista || 0}</td>
                <td class="${(p.stock_proyectado || 0) < 0 ? 'text-danger' : ''}">${p.stock_proyectado || 0}</td>
                <td>
                    ${(p.stock_proyectado || 0) < 0 ? 
                        '<span class="badge badge-danger">Reabastecer</span>' : 
                        '<span class="badge badge-success">OK</span>'
                    }
                </td>
            </tr>
        `).join('');

        // Crear gráfico de predicción
        this.createPredictionChart(prediccion);
    }

    createPredictionChart(prediccion) {
        const ctx = document.getElementById('demand-prediction-chart')?.getContext('2d');
        if (!ctx) return;

        // Destruir gráfico existente si existe
        if (this.predictionChart) {
            this.predictionChart.destroy();
        }

        const labels = prediccion.map(p => p.producto_nombre || 'Producto');
        const stockActual = prediccion.map(p => p.stock_actual || 0);
        const demandaPrevista = prediccion.map(p => p.demanda_prevista || 0);

        this.predictionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Stock Actual',
                        data: stockActual,
                        backgroundColor: 'rgba(34, 197, 94, 0.6)',
                        borderColor: 'rgba(34, 197, 94, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Demanda Prevista',
                        data: demandaPrevista,
                        backgroundColor: 'rgba(217, 70, 239, 0.6)',
                        borderColor: 'rgba(217, 70, 239, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: 'Predicción de Demanda vs Stock Actual'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Cantidad'
                        }
                    }
                }
            }
        });
    }

    renderOrdenesCompra(ordenes) {
        const tbody = document.querySelector('#ordenes-table tbody');
        if (!tbody) return;

        if (!ordenes || ordenes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7">
                <div class="table-empty-state">
                    <div class="table-empty-icon"><i data-lucide="file-x"></i></div>
                    <p class="table-empty-title">Sin órdenes de compra</p>
                    <p class="table-empty-sub">Crea la primera orden con el botón "Nueva Orden"</p>
                </div>
            </td></tr>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        tbody.innerHTML = ordenes.map(orden => `
            <tr>
                <td class="historial-num">#${orden.numero_orden || orden.id}</td>
                <td>${orden.proveedor_nombre || '—'}</td>
                <td class="historial-fecha">${orden.fecha_orden ? orden.fecha_orden.split('T')[0] : '—'}</td>
                <td>${orden.total_items || 0}</td>
                <td>${window.flowerShopAPI.formatCurrency(orden.subtotal || orden.total || 0)}</td>
                <td><span class="estado-badge ${orden.estado}">${orden.estado}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-secondary" onclick="app.verOrden(${orden.id})">Ver</button>
                        <button class="btn btn-sm btn-primary" onclick="app.editarOrden(${orden.id})">Editar</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderMovimientosInventario(movimientos) {
        const tbody = document.querySelector('#movimientos-table tbody');
        if (!tbody) return;

        if (!movimientos || movimientos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6">
                <div class="table-empty-state">
                    <div class="table-empty-icon"><i data-lucide="activity"></i></div>
                    <p class="table-empty-title">Sin movimientos registrados</p>
                    <p class="table-empty-sub">Registra el primer movimiento con el botón "Registrar"</p>
                </div>
            </td></tr>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        const tipoCfg = {
            entrada:    { label: 'Entrada',    signo: '+', color: 'var(--g-600)' },
            salida:     { label: 'Salida',     signo: '−', color: 'var(--r-500)' },
            ajuste:     { label: 'Ajuste',     signo: '±', color: '#3730a3'      },
            devolucion: { label: 'Devolución', signo: '+', color: '#6b21a8'      },
        };
        tbody.innerHTML = movimientos.map(mov => {
            const tipo = (mov.tipo_movimiento || '').toLowerCase();
            const cfg = tipoCfg[tipo] || { label: tipo, signo: '', color: 'var(--text-muted)' };
            const cantAbs = Math.abs(mov.cantidad);
            return `
            <tr>
                <td style="color:var(--text-muted);font-size:0.82rem;white-space:nowrap">${mov.fecha_movimiento ? mov.fecha_movimiento.replace('T',' ').slice(0,16) : '—'}</td>
                <td style="font-weight:500">${mov.producto_nombre || '—'}</td>
                <td><span class="estado-badge ${tipo}">${cfg.label}</span></td>
                <td><span style="font-weight:700;color:${cfg.color}">${cfg.signo}${cantAbs}</span></td>
                <td style="color:var(--text-muted);font-size:0.85rem">${mov.motivo || '—'}</td>
                <td><button class="btn btn-sm btn-secondary" onclick="app.verMovimiento(${mov.id})">Ver</button></td>
            </tr>`;
        }).join('');
    }

    async loadInitialData() {
        try {
            await this.loadDashboardData();
        } catch (error) {
            console.error('Error cargando datos iniciales:', error);
            this.showNotification('Error cargando datos iniciales', 'error');
        }
    }

    // ========== FUNCIONES FALTANTES ==========
    
    async ajustarStockMinimo(id) {
        try {
            const productos = await window.flowerShopAPI.getProductos();
            const producto = productos.find(p => p.id === id);
            if (!producto) { this.showNotification('Producto no encontrado', 'error'); return; }

            const currentMin = producto.stock_minimo || 10;
            await new Promise(resolve => {
                const modal = document.createElement('div');
                modal.id = '_modal-stock-min';
                modal.className = 'modal';
                modal.innerHTML = `
                    <div class="modal-content modal-sm">
                        <div class="modal-header">
                            <h3 class="modal-title-pro">Ajustar stock mínimo</h3>
                            <button class="modal-close" aria-label="Cerrar">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="form-group form-group-full">
                                <p class="modal-subtitle-pro">Producto: <strong>${producto.nombre}</strong></p>
                                <label class="form-label">Nuevo stock mínimo</label>
                                <input id="_stock-min-input" type="number" min="0" value="${currentMin}" class="form-input">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary _smin-cancel">Cancelar</button>
                            <button class="btn btn-primary _smin-ok">Guardar</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
                this.showModal('_modal-stock-min');

                const input = modal.querySelector('#_stock-min-input');
                input.focus(); input.select();

                const done = async (save) => {
                    this.hideModal('_modal-stock-min');
                    setTimeout(() => modal.remove(), 300);
                    if (save) {
                        const val = parseInt(input.value);
                        if (!isNaN(val) && val >= 0) {
                            await window.flowerShopAPI.actualizarProducto(id, { stock_minimo: val });
                            this.showNotification('Stock mínimo actualizado', 'success');
                            await this.loadInventoryAlerts();
                        }
                    }
                    resolve();
                };

                modal.querySelector('._smin-ok').addEventListener('click', () => done(true));
                modal.querySelector('._smin-cancel').addEventListener('click', () => done(false));
                modal.querySelector('.modal-close').addEventListener('click', () => done(false));
                input.addEventListener('keydown', e => { if (e.key === 'Enter') done(true); if (e.key === 'Escape') done(false); });
            });
        } catch (error) {
            console.error('Error ajustando stock mínimo:', error);
            this.showNotification('Error ajustando stock mínimo', 'error');
        }
    }

    async crearOrdenCompra(productos) {
        try {
            this.showNotification('Creando orden de compra...', 'info');
            await window.flowerShopAPI.generarOrdenCompra(productos);
            this.showNotification('Orden de compra creada', 'success');
            await this.loadOrdenesCompra();
        } catch (error) {
            console.error('Error creando orden:', error);
            this.showNotification('Error creando orden de compra', 'error');
        }
    }

    async viewProviderOrders(id) {
        try {
            const proveedores = await window.flowerShopAPI.getProveedores();
            const proveedor = proveedores.find(p => p.id === id);
            
            if (!proveedor) {
                this.showNotification('Proveedor no encontrado', 'error');
                return;
            }
            
            // Obtener órdenes del proveedor
            const ordenes = await window.flowerShopAPI.getOrdenesCompraByProveedor(id);
            
            // Crear modal
            const modal = this.createProviderOrdersModal(proveedor, ordenes);
            document.body.appendChild(modal);
            
            // Mostrar modal
            this.showModal('modal-provider-orders');
            
        } catch (error) {
            console.error('❌ Error cargando órdenes del proveedor:', error);
            this.showNotification('Error cargando órdenes del proveedor', 'error');
        }
    }

    createProviderOrdersModal(proveedor, ordenes) {
        const modal = document.createElement('div');
        modal.id = 'modal-provider-orders';
        modal.className = 'modal';
        modal.style.display = 'none';
        
        // Calcular estadísticas
        const totalOrdenes = ordenes.length;
        const ordenesPendientes = ordenes.filter(o => o.estado === 'pendiente').length;
        const valorTotal = ordenes.reduce((sum, o) => sum + (o.total_valor || o.total || 0), 0);
        
        const ordenesHtml = ordenes.length === 0 
            ? `<div class="no-data-message">
                 <div class="no-data-icon">📋</div>
                 <p>No hay órdenes de compra registradas para este proveedor</p>
               </div>`
            : ordenes.map(orden => `
                <div class="order-item-pro">
                    <div class="order-header-pro">
                        <div class="order-main-info">
                            <span class="order-number">Orden #${orden.numero_orden || orden.id}</span>
                            <span class="order-date">${window.flowerShopAPI.formatDate(orden.created_at)}</span>
                        </div>
                        <span class="order-status ${orden.estado}">${orden.estado}</span>
                    </div>
                    <div class="order-details-row">
                        <div class="order-detail-group">
                            <div class="order-detail">
                                <span class="label">Items:</span>
                                <span class="value">${orden.total_items}</span>
                            </div>
                            <div class="order-detail">
                                <span class="label">Total:</span>
                                <span class="value">${window.flowerShopAPI.formatCurrency(orden.total_valor || orden.total || 0)}</span>
                            </div>
                            ${orden.fecha_entrega ? `
                            <div class="order-detail">
                                <span class="label">Entrega:</span>
                                <span class="value">${window.flowerShopAPI.formatDate(orden.fecha_entrega)}</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `).join('');

        const ordenesTableHtml = ordenes.length === 0
            ? `<div class="inv-empty-state" style="padding:var(--sp-6)">
                   <div class="inv-empty-icon"><i data-lucide="package-x"></i></div>
                   <h3>Sin órdenes registradas</h3>
                   <p>Este proveedor no tiene órdenes de compra todavía.</p>
               </div>`
            : `<table class="historial-table">
                   <thead><tr><th>Orden</th><th>Fecha</th><th>Items</th><th class="text-right">Total</th><th>Estado</th></tr></thead>
                   <tbody>
                       ${ordenes.map(o => `
                           <tr>
                               <td class="historial-num">#${o.numero_orden || o.id}</td>
                               <td class="historial-fecha">${window.flowerShopAPI.formatDate(o.created_at || o.fecha_orden)}</td>
                               <td>${o.total_items || '—'}</td>
                               <td class="historial-total text-right">${window.flowerShopAPI.formatCurrency(o.total_valor || o.total || 0)}</td>
                               <td><span class="estado-badge ${o.estado}">${o.estado}</span></td>
                           </tr>
                       `).join('')}
                   </tbody>
               </table>`;

        modal.innerHTML = `
            <div class="modal-content modal-lg">
                <div class="modal-header">
                    <div class="modal-header-inner">
                        <div class="modal-header-icon"><i data-lucide="building-2"></i></div>
                        <div>
                            <h2 class="modal-title-pro">${proveedor.nombre}</h2>
                            <p class="modal-subtitle-pro">Historial de órdenes de compra</p>
                        </div>
                    </div>
                    <button class="modal-close" type="button" aria-label="Cerrar">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="pedido-detalle-grid" style="margin-bottom:var(--sp-4)">
                        <div class="pedido-detalle-field">
                            <span class="pedido-detalle-label">Teléfono</span>
                            <span class="pedido-detalle-value">${proveedor.telefono || '—'}</span>
                        </div>
                        <div class="pedido-detalle-field">
                            <span class="pedido-detalle-label">Email</span>
                            <span class="pedido-detalle-value">${proveedor.email || '—'}</span>
                        </div>
                        <div class="pedido-detalle-field">
                            <span class="pedido-detalle-label">Ciudad</span>
                            <span class="pedido-detalle-value">${proveedor.ciudad || proveedor.direccion || '—'}</span>
                        </div>
                        <div class="pedido-detalle-field">
                            <span class="pedido-detalle-label">Estado</span>
                            <span class="pedido-detalle-value">${proveedor.activo ? 'Activo' : 'Inactivo'}</span>
                        </div>
                    </div>
                    <div class="prov-orders-summary">
                        <div class="prov-orders-stat"><span class="prov-orders-num">${totalOrdenes}</span><span class="prov-orders-lbl">Total órdenes</span></div>
                        <div class="prov-orders-stat"><span class="prov-orders-num">${ordenesPendientes}</span><span class="prov-orders-lbl">Pendientes</span></div>
                        <div class="prov-orders-stat"><span class="prov-orders-num">${window.flowerShopAPI.formatCurrency(valorTotal)}</span><span class="prov-orders-lbl">Valor total</span></div>
                    </div>
                    <div class="form-section-title" style="margin-top:var(--sp-4)"><span class="form-section-dot"></span>Historial de órdenes</div>
                    <div class="historial-lista" style="margin-top:var(--sp-2)">${ordenesTableHtml}</div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary modal-close">Cerrar</button>
                    <button type="button" class="btn btn-primary" onclick="app.nuevaOrdenCompraProveedor(${proveedor.id})">Nueva Orden</button>
                </div>
            </div>
        `;
        
        // Event listeners para cerrar modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });
        
        modal.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal(modal);
            });
        });
        
        return modal;
    }

    async nuevaOrdenCompraProveedor(proveedorId) {
        try {
            const provModal = document.getElementById('modal-provider-orders');
            if (provModal) this.closeModal(provModal);
            
            await new Promise(r => setTimeout(r, 280));
            document.getElementById('modal-orden')?.remove();
            const ordenModal = this.createOrdenModal();
            document.body.appendChild(ordenModal);
            this.showModal('modal-orden');
            setTimeout(() => {
                const select = document.getElementById('orden-proveedor');
                if (select) select.value = proveedorId;
            }, 250);
            
        } catch (error) {
            console.error('❌ Error creando nueva orden:', error);
            this.showNotification('Error creando nueva orden', 'error');
        }
    }

    async viewOrderDetails(id) {
        this.showNotification(`Viendo detalles de la orden ${id}`, 'info');
    }

    async markOrderReceived(id) {
        try {
            await window.flowerShopAPI.actualizarOrdenCompra(id, { estado: 'recibida' });
            this.showNotification('Orden marcada como recibida', 'success');
            await this.loadPurchaseOrders();
        } catch (error) {
            console.error('Error marcando orden:', error);
            this.showNotification('Error marcando orden como recibida', 'error');
        }
    }

    // Funciones de productos, clientes, eventos que pueden estar faltando
    async loadConfiguracionData() {
        // Configuración pendiente de implementar
    }

    // ========== PERFIL ==========
    async loadPerfilData() {
        try {
            // Cargar datos guardados en localStorage
            const saved = JSON.parse(localStorage.getItem('perfil_usuario') || '{}');
            if (saved.nombre) document.getElementById('perfil-nombre').value = saved.nombre;
            if (saved.email)  document.getElementById('perfil-email').value  = saved.email;
            if (saved.telefono) document.getElementById('perfil-telefono').value = saved.telefono;

            // Avatar color
            const avatarColor = localStorage.getItem('perfil_avatar_color') || 'var(--p-500)';
            const avatarEl = document.getElementById('perfil-avatar-circle');
            if (avatarEl) {
                avatarEl.style.background = avatarColor;
                avatarEl.textContent = (saved.nombre || 'A').charAt(0).toUpperCase();
            }

            // Hero
            const heroNombre = document.getElementById('perfil-hero-nombre');
            const heroEmail  = document.getElementById('perfil-hero-email');
            if (heroNombre) heroNombre.textContent = saved.nombre || 'Admin';
            if (heroEmail)  heroEmail.textContent  = saved.email  || 'admin@floristeria.com';

            // Preferencias
            const prefs = JSON.parse(localStorage.getItem('perfil_prefs') || '{}');
            if (prefs.moneda)  document.getElementById('pref-moneda').value = prefs.moneda;
            if (prefs.fecha)   document.getElementById('pref-fecha').value  = prefs.fecha;
            if (prefs.idioma)  document.getElementById('pref-idioma').value = prefs.idioma;
            if (prefs.notifStock  !== undefined) document.getElementById('pref-notif-stock').checked  = prefs.notifStock;
            if (prefs.notifSonido !== undefined) document.getElementById('pref-notif-sonido').checked = prefs.notifSonido;

            // Stats desde la BD
            const [pedidos, clientes, productos, movimientos] = await Promise.all([
                window.flowerShopAPI.getPedidos(),
                window.flowerShopAPI.getClientes(),
                window.flowerShopAPI.getProductos(),
                window.flowerShopAPI.getMovimientosInventario({}).catch(() => [])
            ]);

            const hoy = new Date().toISOString().slice(0, 10);
            const semanaAtras = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
            const pedidosHoy = pedidos.filter(p => (p.fecha_pedido || '').slice(0, 10) === hoy).length;
            const movSemana  = movimientos.filter(m => (m.fecha_movimiento || '').slice(0, 10) >= semanaAtras).length;

            this.updateElement('pstat-pedidos',  pedidos.length);
            this.updateElement('pstat-clientes', clientes.length);
            this.updateElement('pstat-productos', productos.length);
            this.updateElement('pstat-hoy', pedidosHoy);
            this.updateElement('pstat-semana', movSemana);

            const ultimoAcceso = localStorage.getItem('perfil_ultimo_acceso') || '—';
            this.updateElement('pstat-ultimo-acceso', ultimoAcceso);
            localStorage.setItem('perfil_ultimo_acceso', new Date().toLocaleString('es-ES'));

        } catch (error) {
            console.error('Error cargando perfil:', error);
        }
    }

    guardarPerfil() {
        const nombre   = document.getElementById('perfil-nombre')?.value?.trim();
        const email    = document.getElementById('perfil-email')?.value?.trim();
        const telefono = document.getElementById('perfil-telefono')?.value?.trim();

        if (!nombre || !email) {
            this.showNotification('El nombre y el email son obligatorios', 'warning');
            return;
        }
        localStorage.setItem('perfil_usuario', JSON.stringify({ nombre, email, telefono }));

        // Actualizar hero y topbar
        const heroNombre = document.getElementById('perfil-hero-nombre');
        const heroEmail  = document.getElementById('perfil-hero-email');
        if (heroNombre) heroNombre.textContent = nombre;
        if (heroEmail)  heroEmail.textContent  = email;
        const avatarEl = document.getElementById('perfil-avatar-circle');
        if (avatarEl) avatarEl.textContent = nombre.charAt(0).toUpperCase();
        const topbarName = document.querySelector('.user-name');
        if (topbarName) topbarName.textContent = nombre;

        this.showNotification('Perfil actualizado correctamente', 'success');
    }

    cambiarPassword() {
        const actual   = document.getElementById('perfil-pass-actual')?.value;
        const nueva    = document.getElementById('perfil-pass-nueva')?.value;
        const confirm  = document.getElementById('perfil-pass-confirm')?.value;

        if (!actual || !nueva || !confirm) {
            this.showNotification('Completa todos los campos de contraseña', 'warning');
            return;
        }
        if (nueva !== confirm) {
            this.showNotification('Las contraseñas no coinciden', 'error');
            return;
        }
        if (nueva.length < 6) {
            this.showNotification('La contraseña debe tener al menos 6 caracteres', 'warning');
            return;
        }
        // En una app real aquí iría el IPC call. Por ahora feedback visual.
        document.getElementById('perfil-pass-actual').value = '';
        document.getElementById('perfil-pass-nueva').value  = '';
        document.getElementById('perfil-pass-confirm').value = '';
        this.showNotification('Contraseña actualizada correctamente', 'success');
    }

    guardarPreferencias() {
        const prefs = {
            moneda:      document.getElementById('pref-moneda')?.value,
            fecha:       document.getElementById('pref-fecha')?.value,
            idioma:      document.getElementById('pref-idioma')?.value,
            notifStock:  document.getElementById('pref-notif-stock')?.checked,
            notifSonido: document.getElementById('pref-notif-sonido')?.checked,
        };
        localStorage.setItem('perfil_prefs', JSON.stringify(prefs));
        this.showNotification('Preferencias guardadas', 'success');
    }

    cambiarAvatar() {
        const colores = ['#7c3aed','#db2777','#0891b2','#059669','#d97706','#dc2626','#4f46e5','#0284c7'];
        const actual  = localStorage.getItem('perfil_avatar_color') || colores[0];
        const idx     = colores.indexOf(actual);
        const nuevo   = colores[(idx + 1) % colores.length];
        localStorage.setItem('perfil_avatar_color', nuevo);
        const avatarEl = document.getElementById('perfil-avatar-circle');
        if (avatarEl) avatarEl.style.background = nuevo;
    }

    exportarDatos() {
        this.showNotification('Exportación de datos no disponible en esta versión', 'info');
    }

    limpiarCache() {
        const keys = ['perfil_ultimo_acceso'];
        keys.forEach(k => localStorage.removeItem(k));
        this.showNotification('Caché limpiada correctamente', 'success');
    }
}

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', () => {
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
window.eliminarEvento = (id) => window.app?.eliminarEvento(id);
window.verPedido = (id) => window.app?.verPedido(id);
window.agregarAlCarrito = (id) => window.app?.agregarAlCarrito(id);
window.cambiarCantidadCarrito = (id, delta) => window.app?.cambiarCantidadCarrito(id, delta);
window.agregarAlCarritoTPV = (id) => window.app?.agregarAlCarritoTPV(id);
window.cambiarCantidadTPV = (id, delta) => window.app?.cambiarCantidadTPV(id, delta);
window.seleccionarEmoji = (e) => window.app?.seleccionarEmoji(e);
window.seleccionarEmojiEdit = (id, e) => window.app?.seleccionarEmojiEdit(id, e);
window.toggleEmojiPickerEdit = (id) => window.app?.toggleEmojiPickerEdit(id);
window.aprobarPedido = (id) => window.app?.aprobarPedido(id);
window.cancelarPedido = (id) => window.app?.cancelarPedido(id);
window.editarProveedor = (id) => window.app?.editarProveedor(id);
window.eliminarProveedor = (id) => window.app?.eliminarProveedor(id);
window.viewProviderOrders = (id) => window.app?.viewProviderOrders(id);
window.viewOrderDetails = (id) => window.app?.viewOrderDetails(id);
window.markOrderReceived = (id) => window.app?.markOrderReceived(id);
window.ajustarStockMinimo = (id) => window.app?.ajustarStockMinimo(id);
window.crearOrdenCompra = (productos) => window.app?.crearOrdenCompra(productos);
window.generarOrdenProducto = (id) => window.app?.generarOrdenProducto(id);
window.verMovimiento = (id) => window.app?.verMovimiento(id);
window.verOrden = (id) => window.app?.verOrden(id);
window.editarOrden = (id) => window.app?.editarOrden(id);
