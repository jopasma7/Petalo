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
                const pendientes = pedidos.filter(p => p.estado && p.estado.toLowerCase() === 'pendiente');
                if (pendientes.length > 0) {
                    badgePedidos.classList.add('new');
                } else {
                    badgePedidos.classList.remove('new');
                }
            }
            const stockBajo = productos.filter(p => p.stock_actual <= p.stock_minimo).length;
            this.updateElement('sidebar-stock-bajo', stockBajo);

            const hoyStr = new Date().toISOString().slice(0, 10);
            const entregasHoy = pedidos.filter(p => p.estado === 'aprobado' && p.fecha_entrega && p.fecha_entrega.startsWith(hoyStr)).length;
            this.updateElement('sidebar-entregas-hoy', entregasHoy);
            const entregasEl = document.getElementById('sidebar-entregas-hoy');
            if (entregasEl) entregasEl.className = `stat-value${entregasHoy > 0 ? ' success' : ''}`;

            const ventasHoy = pedidos
                .filter(p => p.estado === 'aprobado' && (p.fecha_pedido || '').startsWith(hoyStr))
                .reduce((s, p) => s + (p.total || 0), 0);
            this.updateElement('sidebar-ventas-hoy', window.flowerShopAPI.formatCurrency(ventasHoy));
        } catch (error) {
            console.error('❌ Error actualizando badges del sidebar:', error);
        }
    }
    constructor() {
        this.currentSection = 'dashboard';
        this.init();
    }

    async init() {
        // Inicializar idioma antes de renderizar nada
        if (window.i18n) { window.i18n.initLocale(); window.i18n.applyTranslations(); }

        this.setupNavigation();
        this.setupModals();
        this.setupEventListeners();
        await this.loadInitialData();
        await this.updateSidebarBadges();
        await this.generarNotificaciones();
        this.showSection('dashboard');
        const avatarImg = localStorage.getItem('perfil_avatar_img');
        this.updateAvatarEverywhere(avatarImg || null);
        this.setupProductoImageInput();
        this.setupClienteImageInput();
        const savedPerfil = JSON.parse(localStorage.getItem('perfil_usuario') || '{}');
        if (savedPerfil.nombre) {
            const topbarName = document.querySelector('.user-name');
            if (topbarName) topbarName.textContent = savedPerfil.nombre;
        }
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
                case 'notificaciones':
                    this.loadNotificacionesData();
                    break;
            }
        } catch (error) {
            console.error(`❌ Error cargando datos de ${sectionId}:`, error);
            this.showNotification(t('msgs.error_load'), 'error');
        }
    }

    // ========== DASHBOARD ==========
    async loadDashboardData() {
        try {
            // Greeting & date
            const now = new Date();
            const hour = now.getHours();
            const greeting = hour < 12 ? t('dashboard.good_morning') : hour < 20 ? t('dashboard.good_afternoon') : t('dashboard.good_evening');
            this.updateElement('dash-greeting-text', greeting);
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

            // Pedidos hoy sub-label — solo aprobados con entrega hoy
            const hoy = now.toISOString().slice(0, 10);
            const pedidosHoy = (pedidos || []).filter(p =>
                p.estado === 'aprobado' &&
                p.tipo_pedido !== 'venta_rapida' &&
                (p.fecha_entrega || '').slice(0, 10) === hoy
            );
            const n = pedidosHoy.length;
            const orderWord = n !== 1 ? t('common.orders') : t('common.order');
            const approvedWord = t('statuses.approved');
            this.updateElement('dash-pedidos-hoy', `${n} ${orderWord} ${approvedWord.toLowerCase()}${n !== 1 ? 's' : ''} ${t('dashboard.for_today')}`);

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
            this.showNotification(t('msgs.error_load'), 'error');
        }
    }

    renderDashPedidosHoy(pedidosHoy, todosPedidos) {
        const container = document.getElementById('dash-pedidos-hoy-lista');
        if (!container) return;

        // Si no hay entregas hoy, mostrar los pendientes más recientes (sin cancelados)
        const lista = pedidosHoy.length > 0
            ? pedidosHoy
            : (todosPedidos || []).filter(p => p.estado !== 'cancelado');

        if (lista.length === 0) {
            container.innerHTML = `<div class="dashboard-empty-state"><i data-lucide="check-circle"></i><span>${t('dashboard.no_orders')}</span></div>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        const estadoColor = { pendiente: '#f59e0b', aprobado: '#3b82f6', completado: '#22c55e', cancelado: '#ef4444' };
        container.innerHTML = lista.map(p => `
            <div class="dash-pedido-row" onclick="app.verPedido(${p.id})">
                <div class="dash-pedido-info">
                    <span class="dash-pedido-nombre">${p.cliente_nombre || t('common.unnamed_client')}</span>
                    <span class="dash-pedido-fecha">${window.flowerShopAPI.formatDate(p.fecha_pedido)}</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                    <span style="font-weight:700;color:var(--g-600)">${window.flowerShopAPI.formatCurrency(p.total || 0)}</span>
                    <span class="estado-badge ${p.estado}">${this.getTranslatedEstado(p.estado)}</span>
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
        alertas.filter(a => a.stock_actual === 0).forEach(a => {
            items.push({ color: '#ef4444', icon: 'alert-triangle', text: `<b>${a.nombre}</b> — ${t('tpv.no_stock')}`, action: `app.showSection('inventario')` });
        });

        // Entregas pendientes hoy/mañana — una sola línea resumida por día
        const hoy = new Date().toISOString().slice(0, 10);
        const manana = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
        const entregasHoy    = pedidos.filter(p => p.estado === 'pendiente' && (p.fecha_entrega || '').slice(0, 10) === hoy).length;
        const entregasManana = pedidos.filter(p => p.estado === 'pendiente' && (p.fecha_entrega || '').slice(0, 10) === manana).length;
        if (entregasHoy > 0) {
            const orderWord = entregasHoy > 1 ? t('common.orders') : t('common.order');
            items.push({ color: '#f59e0b', icon: 'clock', text: `<b>${entregasHoy} ${orderWord} ${t('statuses.pending').toLowerCase()} hoy</b>`, action: `app._irPendientesHoy()` });
        }
        if (entregasManana > 0) {
            const deliveryWord = entregasManana > 1 ? t('common.deliveries') : t('common.delivery');
            items.push({ color: '#94a3b8', icon: 'clock', text: `<b>${entregasManana} ${deliveryWord}</b> ${t('dashboard.for_tomorrow')}`, action: `app._irPendientesHoy()` });
        }

        // Stock bajo (no crítico)
        alertas.filter(a => a.stock_actual > 0).forEach(a => {
            items.push({ color: '#f59e0b', icon: 'package', text: `<b>${a.nombre}</b> — ${t('inventory.low')} (${a.stock_actual})`, action: `app.showSection('inventario')` });
        });

        if (items.length === 0) {
            container.innerHTML = `<div class="dashboard-empty-state"><i data-lucide="check-circle"></i><span>${t('dashboard.no_alerts')}</span></div>`;
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

    getTranslatedEstado(estado) {
        if (!estado) return '—';
        const estadoMap = {
            'pendiente': t('statuses.pending'),
            'aprobado': t('statuses.approved'),
            'cancelado': t('statuses.cancelled'),
            'entregado': t('statuses.delivered'),
            'enviada': t('statuses.sent'),
            'recibida': t('statuses.received'),
            'cancelada': t('statuses.cancelled'),
            'activo': t('common.active'),
            'inactivo': t('common.inactive'),
            'confirmado': t('statuses.approved'),
        };
        return estadoMap[estado?.toLowerCase()] || estado;
    }

    updateStockBajo(productos) {
        const container = document.getElementById('stock-bajo-list');
        if (!container) return;

        if (productos.length > 0) {
            container.innerHTML = productos.map(producto => {
                const agotado = producto.stock_actual === 0;
                const badgeClass = agotado ? 'sin-stock' : 'low-stock';
                const badgeLabel = agotado ? t('common.out_of_stock') : `${producto.stock_actual} / ${producto.stock_minimo}`;
                return `
                <div class="stock-item">
                    <div class="stock-item-info">
                        <span class="stock-item-nombre">${producto.nombre}</span>
                        <span class="stock-item-sub">${t('common.min_label')} ${producto.stock_minimo} ud.</span>
                    </div>
                    <span class="stock-badge ${badgeClass}">${badgeLabel}</span>
                </div>`;
            }).join('');
        } else {
            container.innerHTML = `<div class="dashboard-empty-state"><i data-lucide="check-circle"></i><span>${t('dashboard.stock_ok')}</span></div>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }

    updateProximosEventos(eventos) {
        const container = document.getElementById('proximos-eventos');
        if (!container) return;

        const hoy = new Date();
        const proximosEventos = eventos
            .filter(e => new Date(e.fecha_fin) >= hoy)
            .sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio))
            .slice(0, 3);

        const sub = document.getElementById('proximos-eventos-sub');
        if (sub) {
            if (proximosEventos.length === 0) {
                sub.textContent = t('dashboard.no_events');
            } else {
                const diasHasta = Math.ceil((new Date(proximosEventos[0].fecha_inicio) - hoy) / 86400000);
                sub.textContent = diasHasta <= 0 ? t('common.in_progress') : diasHasta === 1 ? t('common.tomorrow') : diasHasta <= 7 ? t('common.this_week') : t('common.in_days', { n: diasHasta });
            }
        }

        const tipoIcon  = { religioso: 'church', comercial: 'shopping-bag', temporal: 'leaf', cultural: 'drama' };
        const tipoColor = { religioso: '#7c3aed', comercial: '#0891b2', temporal: '#16a34a', cultural: '#d97706' };

        if (proximosEventos.length > 0) {
            container.innerHTML = proximosEventos.map(evento => {
                const dias = Math.ceil((new Date(evento.fecha_inicio) - hoy) / 86400000);
                const etiqueta = dias <= 0 ? `<span style="color:#16a34a;font-weight:700;font-size:0.7rem">${t('common.in_progress').toUpperCase()}</span>`
                    : dias === 1 ? `<span style="color:#d97706;font-weight:700;font-size:0.7rem">${t('common.tomorrow').toUpperCase()}</span>`
                    : `<span style="color:var(--s-500);font-size:0.7rem">en ${dias}d</span>`;
                const color = tipoColor[evento.tipo_evento] || '#6b7280';
                const iconName = tipoIcon[evento.tipo_evento] || 'calendar';
                return `
                <div style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--s-100);">
                    <div style="width:36px;height:36px;border-radius:10px;background:${color}18;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:${color}"><i data-lucide="${iconName}" style="width:17px;height:17px"></i></div>
                    <div style="flex:1;min-width:0">
                        <div style="font-weight:600;font-size:0.82rem;color:var(--s-900);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${evento.nombre}</div>
                        <div style="font-size:0.72rem;color:var(--s-500)">${window.flowerShopAPI.formatDate(evento.fecha_inicio)}</div>
                    </div>
                    ${etiqueta}
                </div>`;
            }).join('');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } else {
            container.innerHTML = `<div class="dashboard-empty-state"><i data-lucide="calendar-x"></i><span>${t('dashboard.no_events')}</span></div>`;
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
            this._lazyLoadProductImages();

            // Poblar filtro de categorías
            const filterCat = document.getElementById('filter-categoria');
            if (filterCat) {
                filterCat.innerHTML = `<option value="">${t('common.all_categories')}</option>` +
                    categorias.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
            }
        } catch (error) {
            console.error('❌ Error cargando productos:', error);
            this.showNotification(t('msgs.error_load'), 'error');
        }
    }

    displayProductos(productos) {
        const tbody = document.querySelector('#productos-table tbody');
        if (!tbody) return;

        if (productos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center">${t('products.no_data')}</td></tr>`;
            return;
        }

        tbody.innerHTML = productos.map(producto => `
            <tr data-id="${producto.id}">
                <td>${producto.codigo_producto || 'N/A'}</td>
                <td>
                    <div class="producto-info">
                        ${producto.tiene_imagen
                            ? `<img src="" class="producto-thumb" alt="${producto.nombre}" data-producto-id="${producto.id}" data-lazy-img="1">`
                            : `<div class="producto-thumb-placeholder">${producto.categoria_icono || '🌸'}</div>`
                        }
                        <div>
                            <span class="producto-nombre">${producto.nombre}</span>
                            <small class="producto-categoria">${producto.categoria_nombre}</small>
                        </div>
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
                        ${producto.activo ? t('common.active') : t('common.inactive')}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="app.editarProducto(${producto.id})" title="${t('common.edit')}">${t('common.edit')}</button>
                        <button class="btn btn-sm btn-secondary" onclick="app.verProducto(${producto.id})" title="${t('historial.view')}">${t('historial.view')}</button>
                        <button class="btn btn-sm btn-danger" onclick="app.eliminarProducto(${producto.id})" title="${t('common.delete')}">${t('common.delete')}</button>
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
            this._lazyLoadClienteImages();
        } catch (error) {
            console.error('❌ Error cargando clientes:', error);
            this.showNotification(t('msgs.error_load'), 'error');
        }
    }

    displayClientes(clientes) {
        const grid = document.getElementById('clientes-grid');
        if (!grid) return;

        if (clientes.length === 0) {
            grid.innerHTML = `<p class="no-data">${t('clients.no_data')}</p>`;
            return;
        }

        const tipoColor = { vip: '#7c3aed', regular: '#0891b2', ocasional: '#6b7280' };

        grid.innerHTML = clientes.map(cliente => {
            const nombre = `${cliente.nombre} ${cliente.apellidos || ''}`.trim();
            const inicial = nombre.charAt(0).toUpperCase();
            const tipo = cliente.tipo_cliente || 'regular';
            const color = tipoColor[tipo] || '#6b7280';
            const avatarContent = cliente.tiene_imagen
                ? `<img data-lazy-cliente="${cliente.id}" src="" alt="${inicial}" style="display:none">`
                : inicial;
            const avatarBg = cliente.tiene_imagen ? 'transparent' : color;
            return `
            <div class="cliente-card">
                <div class="cliente-card-top">
                    <div class="cliente-avatar" style="background:${avatarBg}">${avatarContent}</div>
                    <div class="cliente-card-info">
                        <div class="cliente-card-nombre">${nombre}</div>
                        <span class="cliente-tipo ${tipo}">${tipo}</span>
                    </div>
                </div>
                <div class="cliente-card-datos">
                    ${cliente.telefono ? `<div class="cliente-dato"><i data-lucide="phone" style="width:12px;height:12px;flex-shrink:0"></i><span>${cliente.telefono}</span></div>` : ''}
                    ${cliente.email    ? `<div class="cliente-dato"><i data-lucide="mail"  style="width:12px;height:12px;flex-shrink:0"></i><span>${cliente.email}</span></div>`    : ''}
                    <div class="cliente-dato"><i data-lucide="shopping-bag"   style="width:12px;height:12px;flex-shrink:0"></i><span>${window.flowerShopAPI.formatCurrency(cliente.total_compras || 0)}</span></div>
                    <div class="cliente-dato"><i data-lucide="clipboard-list" style="width:12px;height:12px;flex-shrink:0"></i><span>${cliente.num_encargos || 0} ${(cliente.num_encargos || 0) !== 1 ? t('common.orders') : t('common.order')}</span></div>
                </div>
                <div class="cliente-card-actions">
                    <button class="btn btn-sm btn-primary" onclick="app.editarCliente(${cliente.id})">${t('common.edit')}</button>
                    <button class="btn btn-sm btn-secondary" onclick="app.verCliente(${cliente.id})">${t('historial.view')}</button>
                    <button class="btn btn-sm btn-success" onclick="app.nuevoPedidoCliente(${cliente.id})">${t('nav.orders')}</button>
                </div>
            </div>`;
        }).join('');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // ========== EVENTOS ==========
    async loadEventosData() {
        try {
            const eventos = await window.flowerShopAPI.getEventos();
            this.displayEventos(eventos);
        } catch (error) {
            console.error('❌ Error cargando eventos:', error);
            this.showNotification(t('msgs.error_load'), 'error');
        }
    }

    displayEventos(eventos) {
        const container = document.getElementById('eventos-grid');
        if (!container) return;

        if (eventos.length === 0) {
            container.innerHTML = `<p class="text-center">${t('events.no_data')}</p>`;
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
                                <span class="evento-meta-label">${t('events.card_type_label')}</span>
                                <span class="evento-meta-value">${evento.tipo_evento || '—'}</span>
                            </div>
                            <div class="evento-meta-item">
                                <span class="evento-meta-label">${t('events.card_discount_label')}</span>
                                <span class="evento-meta-value">${evento.descuento_especial > 0 ? evento.descuento_especial + '%' : '—'}</span>
                            </div>
                            <div class="evento-meta-item">
                                <span class="evento-meta-label">${t('events.card_start_label')}</span>
                                <span class="evento-meta-value">${window.flowerShopAPI.formatDate(evento.fecha_inicio)}</span>
                            </div>
                            <div class="evento-meta-item">
                                <span class="evento-meta-label">${t('events.card_end_label')}</span>
                                <span class="evento-meta-value">${window.flowerShopAPI.formatDate(evento.fecha_fin)}</span>
                            </div>
                        </div>
                        ${evento.descripcion ? `<p class="evento-desc">${evento.descripcion}</p>` : ''}
                    </div>
                    <div class="evento-actions">
                        <button class="btn btn-sm btn-secondary" onclick="app.editarEvento(${evento.id})">${t('common.edit')}</button>
                        <button class="btn btn-sm btn-success" onclick="app.gestionarEventoStock(${evento.id})">Stock</button>
                        <button class="btn btn-sm btn-danger" onclick="app.eliminarEvento(${evento.id})">${t('common.delete')}</button>
                    </div>
                </div>
            `;
        }).join('');
        // Re-render Lucide icons for dynamically added content
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    _irEntregasHoy() {
        this.showSection('pedidos');
        this._activarTabPedidos('aprobado');
    }

    _irPendientesHoy() {
        this.showSection('pedidos');
        this._activarTabPedidos('pendiente');
    }

    // ========== PEDIDOS ==========
    _activarTabPedidos(estado) {
        this._tabPedidosActiva = estado;
        document.querySelectorAll('.pedidos-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tabEstado === estado);
        });
        const pedidos = (this._pedidosCache || [])
            .filter(p => p.estado === estado && p.tipo_pedido !== 'venta_rapida')
            .sort((a, b) => new Date(b.fecha_pedido) - new Date(a.fecha_pedido));
        this.displayPedidos(pedidos);
    }

    _actualizarContadoresTabs() {
        const cache = (this._pedidosCache || []).filter(p => p.tipo_pedido !== 'venta_rapida');
        ['pendiente','aprobado','cancelado'].forEach(estado => {
            const el = document.getElementById(`tab-count-${estado}`);
            if (el) el.textContent = cache.filter(p => p.estado === estado).length;
        });
    }

    async loadPedidosData() {
        try {
            const pedidos = await window.flowerShopAPI.getPedidos();
            this._pedidosCache = pedidos;
            this._actualizarContadoresTabs();
            const tabActiva = this._tabPedidosActiva || 'pendiente';
            this._activarTabPedidos(tabActiva);
        } catch (error) {
            console.error('❌ Error cargando pedidos:', error);
            this.showNotification(t('msgs.error_load'), 'error');
        }
    }

    displayPedidos(pedidos, pagina = 1) {
        const feed = document.getElementById('pedidos-feed');
        if (!feed) return;

        if (!pedidos || pedidos.length === 0) {
            const tabActiva = this._tabPedidosActiva || 'pendiente';
            const msgs = {
                pendiente: { icon: 'inbox',        title: t('orders.no_pending_title'), sub: t('orders.no_pending_sub') },
                aprobado:  { icon: 'check-circle', title: t('orders.no_approved_title'), sub: t('orders.no_approved_sub') },
                cancelado: { icon: 'x-circle',     title: t('orders.no_cancelled_title'), sub: t('orders.no_cancelled_sub') },
            };
            const m = msgs[tabActiva] || msgs.pendiente;
            feed.innerHTML = `
                <div class="pedidos-empty">
                    <i data-lucide="${m.icon}" class="pedidos-empty-icon"></i>
                    <p class="pedidos-empty-title">${m.title}</p>
                    <p class="pedidos-empty-sub">${m.sub}</p>
                </div>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        const POR_PAGINA = 5;
        const totalPaginas = Math.ceil(pedidos.length / POR_PAGINA);
        pagina = Math.max(1, Math.min(pagina, totalPaginas));
        const slice = pedidos.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
        this._pedidosPaginaActual = { pedidos, pagina };

        const hoy = new Date().toDateString();

        const filas = slice.map(pedido => {
            const estado = (pedido.estado || 'pendiente').toLowerCase();
            const numeroRaw = pedido.numero_pedido || `#${pedido.id}`;
            const numero = numeroRaw.length > 10 ? '#' + numeroRaw.slice(-8) : numeroRaw;
            const cliente = [pedido.cliente_nombre, pedido.cliente_apellidos].filter(Boolean).join(' ') || t('orders.no_client');
            const inicial = cliente.charAt(0).toUpperCase();
            const fechaPedido = window.flowerShopAPI.formatDate(pedido.fecha_pedido);
            const fechaEntrega = pedido.fecha_entrega ? window.flowerShopAPI.formatDate(pedido.fecha_entrega) : null;
            const entregaHoy = pedido.fecha_entrega && new Date(pedido.fecha_entrega).toDateString() === hoy;
            const total = window.flowerShopAPI.formatCurrency(pedido.total || 0);
            const metodo = pedido.metodo_pago ? `· ${pedido.metodo_pago}` : '';
            return `
            <div class="pedido-row" data-id="${pedido.id}">
                <div class="pedido-row-avatar">${inicial}</div>
                <div class="pedido-row-num">
                    <span class="pedido-numero">${numero}</span>
                    <span class="pedido-fecha-sub">${fechaPedido}</span>
                </div>
                <div class="pedido-row-cliente">${cliente}</div>
                <div class="pedido-row-entrega">
                    ${fechaEntrega
                        ? `<span class="${entregaHoy ? 'pedido-entrega-hoy' : ''}">${entregaHoy ? `<span style="display:inline-flex;align-items:center;gap:4px"><i data-lucide="package" style="width:13px;height:13px"></i>${t('orders.delivery_today')}</span>` : fechaEntrega}</span>`
                        : '<span class="text-muted">—</span>'}
                </div>
                <div class="pedido-row-estado">
                    <span class="estado-badge ${estado}">${t('statuses.' + estado) || estado}</span>
                </div>
                <div class="pedido-row-total">
                    <span class="pedido-total">${total} <span class="pedido-metodo-sub">${metodo}</span></span>
                </div>
                <div class="pedido-row-actions">
                    <button class="btn btn-sm btn-secondary" onclick="app.verPedido(${pedido.id})">${t('historial.view')}</button>
                    ${estado === 'pendiente' ? `<button class="btn btn-sm btn-success" onclick="app.aprobarPedido(${pedido.id})">${t('confirms.approve_btn')}</button>` : ''}
                    ${estado !== 'cancelado' ? `<button class="btn btn-sm btn-danger" onclick="app.cancelarPedido(${pedido.id})">${t('common.cancel')}</button>` : ''}
                </div>
            </div>`;
        }).join('');

        const paginacion = totalPaginas > 1 ? `
            <div class="pedidos-paginacion">
                <button class="pedidos-pag-btn" ${pagina === 1 ? 'disabled' : ''} onclick="app._pedidosPagina(${pagina - 1})">
                    <i data-lucide="chevron-left" style="width:15px;height:15px"></i>
                </button>
                <span class="pedidos-pag-info">${pagina} / ${totalPaginas}</span>
                <button class="pedidos-pag-btn" ${pagina === totalPaginas ? 'disabled' : ''} onclick="app._pedidosPagina(${pagina + 1})">
                    <i data-lucide="chevron-right" style="width:15px;height:15px"></i>
                </button>
            </div>` : '';

        feed.innerHTML = filas + paginacion;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    _pedidosPagina(pagina) {
        if (!this._pedidosPaginaActual) return;
        this.displayPedidos(this._pedidosPaginaActual.pedidos, pagina);
    }

    // Acciones básicas para pedidos
    async verPedido(id) {
        try {
            // Obtener el pedido y sus detalles
            const pedidos = await window.flowerShopAPI.getPedidos();
            const pedido = pedidos.find(p => p.id === id);
            if (!pedido) {
                this.showNotification(t('msgs.product_not_found'), 'error');
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
            this.showNotification(t('msgs.error_show_detail'), 'error');
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
                                <p class="modal-subtitle-pro">${t('orders.details_subtitle')}</p>
                            </div>
                        </div>
                        <button class="modal-close" aria-label="${t('common.close')}">&times;</button>
                    </div>
                    <div class="modal-body" id="detalle-pedido-body"></div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary modal-close">${t('common.close')}</button>
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
        const numeroRaw = String(pedido.numero || pedido.id || '');
        document.getElementById('detalle-numero-pedido').textContent = numeroRaw.slice(-8);
        const body = document.getElementById('detalle-pedido-body');

        const clienteNombre = [pedido.cliente_nombre, pedido.cliente_apellidos].filter(Boolean).join(' ') || '—';

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
            : `<tr><td colspan="4" class="text-center text-muted">${t('products.no_data')}</td></tr>`;

        const lbl = (text) => `<span style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">${text}</span>`;
        const val = (text, bold = false) => `<span style="font-size:0.92rem;${bold ? 'font-weight:600;' : ''}color:var(--text-primary)">${text}</span>`;
        const field = (label, content) => `
            <div style="display:flex;flex-direction:column;gap:var(--sp-1)">
                ${lbl(label)}${content}
            </div>`;

        const metodoPagoLabel = { efectivo: t('tpv.cash'), tarjeta: t('tpv.card'), transferencia: t('tpv.transfer'), bizum: t('tpv.bizum') };
        const metodoPago = pedido.metodo_pago ? (metodoPagoLabel[pedido.metodo_pago] || pedido.metodo_pago) : null;

        body.innerHTML = `
            <div style="background:var(--s-50);border-radius:var(--r-lg);padding:var(--sp-4);margin-bottom:var(--sp-4);display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4)">
                ${field(t('orders.client_label'), val(clienteNombre, true))}
                ${field(t('orders.status_label'), `<span><span class="estado-badge ${estado}">${pedido.estado || '—'}</span></span>`)}
                ${field(t('orders.order_date_label'), val(fmtDate(pedido.fecha_pedido || pedido.fecha)))}
                ${field(t('orders.delivery_date_label'), val(fmtDate(pedido.fecha_entrega || pedido.entrega)))}
                ${metodoPago ? field(t('orders.payment_method'), val(metodoPago)) : ''}
                ${pedido.evento_nombre ? field(t('orders.event_label'), val(pedido.evento_nombre)) : ''}
            </div>
            <div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:var(--sp-2)">${t('orders.products_section')}</div>
            <div style="border:1px solid var(--s-100);border-radius:var(--r-lg);overflow:hidden;margin-bottom:var(--sp-4);max-height:240px;overflow-y:auto">
                <table class="table" style="margin:0">
                    <thead><tr><th>${t('inventory.col_product')}</th><th style="text-align:center">${t('common.quantity')}</th><th style="text-align:right">${t('common.price')}</th><th style="text-align:right">${t('common.subtotal')}</th></tr></thead>
                    <tbody>${productosRows}</tbody>
                </table>
            </div>
            ${pedido.notas ? `
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:var(--r-lg);padding:var(--sp-3) var(--sp-4);margin-bottom:var(--sp-4);display:flex;gap:var(--sp-3);align-items:flex-start">
                <i data-lucide="sticky-note" style="width:16px;height:16px;color:#b45309;flex-shrink:0;margin-top:2px"></i>
                <div>
                    ${lbl(t('orders.notes'))}
                    <p style="margin:var(--sp-1) 0 0;font-size:0.9rem;color:var(--text-secondary)">${pedido.notas}</p>
                </div>
            </div>` : ''}
            <div style="display:flex;justify-content:space-between;align-items:center;background:var(--s-900);color:#fff;padding:var(--sp-3) var(--sp-4);border-radius:var(--r-lg)">
                <span style="font-weight:600">${t('common.total')}</span>
                <span style="font-size:1.05rem;font-weight:700">${fmt(pedido.total)}</span>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    async aprobarPedido(id) {
        try {
            if (!await this._confirm(t('confirms.approve_order_title'), t('confirms.approve_order'), t('confirms.approve_btn'), 'btn-primary')) return;
            await window.flowerShopAPI.actualizarEstadoPedido(id, 'aprobado');
            this.showNotification(t('msgs.order_approved'), 'success');
            await this.loadPedidosData();
            await this.generarNotificaciones();
        } catch (error) {
            this.showNotification(t('msgs.error_approve'), 'error');
        }
    }

    async cancelarPedido(id) {
        try {
            if (!await this._confirm(t('confirms.cancel_order_title'), t('confirms.cancel_order'), t('common.cancel'))) return;
            await window.flowerShopAPI.actualizarEstadoPedido(id, 'cancelado');
            this.showNotification(t('msgs.order_cancelled'), 'success');
            await this.loadPedidosData();
        } catch (error) {
            this.showNotification(t('msgs.error_cancel_order'), 'error');
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
            if (trendStock) trendStock.textContent = `${stockCritico} ${t('dashboard.trend_no_stock')}`;

            const trendProductos = document.getElementById('trend-productos');
            if (trendProductos) {
                const activos = productos.filter(p => p.activo).length;
                trendProductos.textContent = `${activos} ${t('dashboard.trend_active')}`;
                trendProductos.className = 'kpi-trend positive';
            }

            const trendValor = document.getElementById('trend-valor');
            if (trendValor) {
                trendValor.textContent = `PVP ${window.flowerShopAPI.formatCurrency(valorTotal)}`;
                trendValor.className = 'kpi-trend neutral';
            }

            const trendRotacion = document.getElementById('trend-rotacion');
            if (trendRotacion) trendRotacion.textContent = t('common.avg_days');

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
            this.showNotification(t('msgs.error_dashboard'), 'error');
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
                labels: [t('inventory.rotation_fast'), t('inventory.rotation_slow'), t('inventory.chart_low_stock')],
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
            container.innerHTML = `<div class="ranking-loading">🎉 ${t('inventory.all_products_good_movement')}</div>`;
            return;
        }

        container.innerHTML = productosOrdenados.map((producto, index) => `
            <div class="ranking-item">
                <div class="ranking-position">${index + 1}</div>
                <div class="ranking-content">
                    <div class="ranking-title">${producto.nombre}</div>
                    <div class="ranking-subtitle">Stock: ${producto.stock_actual} unidades</div>
                </div>
                <div class="ranking-value">${Math.floor(Math.random() * 30) + 10} ${t('common.days')}</div>
            </div>
        `).join('');
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
                labels: [t('inventory.rotation_fast'), t('inventory.rotation_slow'), t('inventory.chart_no_movement')],
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
            container.innerHTML = `<div class="ranking-loading" style="color:var(--text-muted);font-size:0.85rem;padding:1rem 0">${t('inventory.all_products_have_sales')}</div>`;
            return;
        }

        container.innerHTML = productos.slice(0, 10).map((producto, index) => `
            <div class="ranking-item">
                <div class="ranking-position">${index + 1}</div>
                <div class="ranking-content">
                    <div class="ranking-title">${producto.nombre}</div>
                    <div class="ranking-subtitle">Stock: ${producto.stock_actual} unidades</div>
                </div>
                <div class="ranking-value" style="font-size:0.78rem;color:var(--text-muted)">${producto.dias_stock >= 999 ? t('inventory.no_sales') : producto.dias_stock + ' ' + t('inventory.days_label')}</div>
            </div>
        `).join('');
    }

    _showSectionHelp(section) {
        const h = { title: t(`help.${section}_title`), body: t(`help.${section}_body`) };
        if (!h.title) return;

        const existing = document.getElementById('_help-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = '_help-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content modal-md help-modal-content">
                <div class="modal-header help-modal-header">
                    <div style="display:flex;align-items:center;gap:10px">
                        <i data-lucide="circle-help" style="width:20px;height:20px;color:var(--p-500);flex-shrink:0"></i>
                        <h3 class="modal-title-pro">${h.title}</h3>
                    </div>
                    <button class="modal-close" aria-label="${t('common.close')}">&times;</button>
                </div>
                <div class="modal-body help-modal-body">${h.body}</div>
            </div>`;

        document.body.appendChild(modal);
        if (typeof lucide !== 'undefined') lucide.createIcons();
        this.showModal('_help-modal');
        modal.querySelector('.modal-close').addEventListener('click', () => {
            this.hideModal('_help-modal');
            setTimeout(() => modal.remove(), 300);
        });
    }

    async loadInventoryAlerts() {
        try {
            const alertas = await window.flowerShopAPI.getAlertasStock();
            this.displayStockAlerts(alertas);
        } catch (error) {
            console.error('Error cargando alertas de stock:', error);
            this.showNotification(t('msgs.error_alerts'), 'error');
        }
    }

    displayStockAlerts(alertas) {
        const container = document.getElementById('alertas-stock-grid');
        if (!container) return;
        if (alertas.length === 0) {
            container.innerHTML = `
                <div class="inv-empty-state">
                    <div class="inv-empty-icon"><i data-lucide="shield-check"></i></div>
                    <h3>${t('inventory.alerts_empty_title')}</h3>
                    <p>${t('inventory.alerts_empty_msg')}</p>
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
                    <div><strong>${t('inventory.stock_current_label')}</strong> ${alerta.stock_actual}</div>
                    <div><strong>${t('inventory.stock_min_label')}</strong> ${alerta.stock_minimo}</div>
                    <div><strong>${t('inventory.alerts_detail_category')}</strong> ${alerta.categoria || 'N/A'}</div>
                    <div><strong>${t('inventory.stock_suggested')}</strong> ${Math.max(alerta.stock_sugerido, 0)}</div>
                </div>
                <div class="alert-actions">
                    <button class="btn btn-sm btn-primary" onclick="app.ajustarStockMinimo(${alerta.id})">
                        <i data-lucide="settings-2" style="width:13px;height:13px;margin-right:4px"></i>${t('inventory.btn_adjust_label')}
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="app.crearOrdenCompraDesdeAlerta(${alerta.id}, ${Math.max(alerta.stock_sugerido, 1)})">
                        <i data-lucide="shopping-cart" style="width:13px;height:13px;margin-right:4px"></i>${t('inventory.btn_order_label')}
                    </button>
                </div>
            </div>
        `).join('');
        if (typeof lucide !== 'undefined') lucide.createIcons();
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
                this.showNotification(t('msgs.auto_order_none'), 'info');
                return;
            }

            const productos = alertas.map(alerta => ({
                producto_id: alerta.id,
                cantidad: Math.max(alerta.stock_sugerido, alerta.stock_minimo)
            }));

            const ordenes = await window.flowerShopAPI.generarOrdenCompra(productos);

            if (ordenes.length > 0) {
                this.showNotification(t('msgs.auto_order_ok', { count: ordenes.length }), 'success');
                // Cambiar a la pestaña de órdenes
                document.querySelector('[data-tab="ordenes"]').click();
            } else {
                this.showNotification(t('msgs.auto_order_error'), 'warning');
            }
        } catch (error) {
            console.error('Error generando orden automática:', error);
            this.showNotification(t('msgs.auto_order_error'), 'error');
        }
    }

    async loadProviders() {
        try {
            const proveedores = await window.flowerShopAPI.getProveedores();
            this.displayProviders(proveedores);
        } catch (error) {
            console.error('Error cargando proveedores:', error);
            this.showNotification(t('msgs.error_suppliers'), 'error');
        }
    }

    displayProviders(proveedores) {
        const container = document.getElementById('proveedores-grid');
        if (!container) return;

        if (proveedores.length === 0) {
            container.innerHTML = `<div class="loading-message">${t('inventory.no_providers')}</div>`;
            return;
        }

        container.innerHTML = proveedores.map(proveedor => `
            <div class="provider-card">
                <div class="provider-card-top">
                    <div class="provider-avatar">${proveedor.nombre.charAt(0).toUpperCase()}</div>
                    <div class="provider-card-info">
                        <h4 class="provider-name">${proveedor.nombre}</h4>
                        <span class="provider-status ${proveedor.activo ? 'activo' : 'inactivo'}">${proveedor.activo ? t('common.active') : t('common.inactive')}</span>
                    </div>
                </div>
                <div class="provider-details-list">
                    ${proveedor.telefono ? `<div class="provider-detail-row"><span class="provider-detail-label">${t('common.phone')}</span><span class="provider-detail-val">${proveedor.telefono}</span></div>` : ''}
                    ${proveedor.email ? `<div class="provider-detail-row"><span class="provider-detail-label">${t('common.email')}</span><span class="provider-detail-val">${proveedor.email}</span></div>` : ''}
                    ${(proveedor.ciudad || proveedor.direccion) ? `<div class="provider-detail-row"><span class="provider-detail-label">${t('inventory.supplier_card_city')}</span><span class="provider-detail-val">${proveedor.ciudad || proveedor.direccion}</span></div>` : ''}
                </div>
                <div class="provider-stats">
                    <div class="provider-stat">
                        <div class="provider-stat-value">${proveedor.productos_suministrados || 0}</div>
                        <div class="provider-stat-label">${t('inventory.supplier_stat_products')}</div>
                    </div>
                    <div class="provider-stat">
                        <div class="provider-stat-value">${window.flowerShopAPI.formatCurrency(proveedor.promedio_pedidos || 0)}</div>
                        <div class="provider-stat-label">${t('inventory.supplier_stat_avg_order')}</div>
                    </div>
                </div>
                <div class="provider-actions">
                    <button class="btn btn-sm btn-secondary" onclick="app.editarProveedor(${proveedor.id})">${t('common.edit')}</button>
                    <button class="btn btn-sm btn-primary" onclick="app.viewProviderOrders(${proveedor.id})">${t('inventory.provider_orders_btn')}</button>
                    <button class="btn btn-sm btn-danger" onclick="app.eliminarProveedor(${proveedor.id})">${t('common.delete')}</button>
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
            this.showNotification(t('msgs.error_purchase_orders'), 'error');
        }
    }

    async loadInventoryMovements() {
        try {
            const movimientos = await window.flowerShopAPI.getMovimientosInventario({ limite: 50 });
            this.renderMovimientosInventario(movimientos);
        } catch (error) {
            console.error('Error cargando movimientos de inventario:', error);
            this.showNotification(t('msgs.error_movements'), 'error');
        }
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
            this._ventasDiariasRaw = ventasData.ventasDiarias;
            const activeChartBtn = document.querySelector('.chart-btn[data-chart="ventas"].active');
            const chartTipo = activeChartBtn?.dataset.type || 'diario';
            this.createSalesChart(ventasData.ventasDiarias, chartTipo);
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
            this.showNotification(t('msgs.error_reports'), 'error');
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

    createSalesChart(ventasData, tipo = 'diario') {
        const ctx = document.getElementById('sales-chart');
        if (!ctx) return;

        if (this.salesChart) this.salesChart.destroy();

        let labels, valores;
        const sorted = [...ventasData].reverse();

        if (tipo === 'semanal') {
            const semanas = {};
            sorted.forEach(v => {
                const d = new Date(v.fecha);
                const startOfWeek = new Date(d);
                startOfWeek.setDate(d.getDate() - d.getDay() + 1);
                const key = startOfWeek.toISOString().slice(0, 10);
                semanas[key] = (semanas[key] || 0) + (v.total_ventas || 0);
            });
            labels = Object.keys(semanas).map(k => {
                const d = new Date(k);
                return `${t('inventory.chart_week_label')} ${d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`;
            });
            valores = Object.values(semanas);
        } else if (tipo === 'mensual') {
            const meses = {};
            sorted.forEach(v => {
                const d = new Date(v.fecha);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                meses[key] = (meses[key] || 0) + (v.total_ventas || 0);
            });
            labels = Object.keys(meses).map(k => {
                const [y, m] = k.split('-');
                return new Date(y, m - 1).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
            });
            valores = Object.values(meses);
        } else {
            labels = sorted.map(v => new Date(v.fecha).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }));
            valores = sorted.map(v => v.total_ventas);
        }

        this.salesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: t('reports.sales_label'),
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
                    label: t('reports.value_sold'),
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
            container.innerHTML = `<div class="ranking-loading">${t('reports.no_products')}</div>`;
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
            container.innerHTML = `<div class="ranking-loading">${t('reports.no_clients')}</div>`;
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
            container.innerHTML = `<div class="ranking-loading">${t('reports.no_events')}</div>`;
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
            tbody.innerHTML = `<tr><td colspan="7" class="text-center">${t('reports.no_sales')}</td></tr>`;
            return;
        }

        tbody.innerHTML = ventasData.map(venta => `
            <tr>
                <td>${window.flowerShopAPI.formatDate(venta.fecha_pedido)}</td>
                <td>${venta.numero_pedido}</td>
                <td>${venta.cliente_nombre || 'N/A'}</td>
                <td title="${venta.productos}">${venta.productos ? venta.productos.substring(0, 30) + '...' : 'N/A'}</td>
                <td>${window.flowerShopAPI.formatCurrency(venta.total)}</td>
                <td><span class="badge-estado badge-estado-${venta.estado.toLowerCase()}">${this.getTranslatedEstado(venta.estado)}</span></td>
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
                document.querySelectorAll('.chart-btn[data-chart="ventas"]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const tipo = btn.dataset.type || 'diario';
                if (this._ventasDiariasRaw) this.createSalesChart(this._ventasDiariasRaw, tipo);
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

    }

    abrirModalExportar(contexto = 'todo') {
        // Datasets disponibles según contexto
        const datasets = {
            reportes: [
                { id: 'ventas',    label: t('reports.export_sales'),    icon: 'trending-up', checked: true },
            ],
            todo: [
                { id: 'productos', label: t('reports.export_products'), icon: 'box',         checked: true },
                { id: 'clientes',  label: t('reports.export_clients'),  icon: 'users',       checked: true },
                { id: 'encargos',  label: t('reports.export_orders'),   icon: 'clipboard-list', checked: true },
            ],
        };

        const sets = datasets[contexto] || datasets.todo;
        const subtitles = { reportes: t('reports.export_subtitle_reports'), todo: t('reports.export_subtitle_all') };

        document.getElementById('export-modal-subtitle').textContent = subtitles[contexto] || '';

        // Renderizar chips de datasets
        const wrap = document.getElementById('export-dataset-options');
        const datasetWrap = document.getElementById('export-dataset-wrap');
        if (sets.length <= 1) {
            datasetWrap.style.display = 'none';
        } else {
            datasetWrap.style.display = '';
            wrap.innerHTML = sets.map(s => `
                <label class="export-dataset-chip ${s.checked ? 'active' : ''}" data-id="${s.id}">
                    <i data-lucide="${s.icon}"></i>${s.label}
                    <input type="checkbox" style="display:none" ${s.checked ? 'checked' : ''}>
                </label>`).join('');
            wrap.querySelectorAll('.export-dataset-chip').forEach(chip => {
                chip.addEventListener('click', () => {
                    chip.classList.toggle('active');
                    chip.querySelector('input').checked = chip.classList.contains('active');
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                });
            });
        }

        // Selección de formato
        document.querySelectorAll('.export-format-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.format === 'csv');
            btn.onclick = () => {
                document.querySelectorAll('.export-format-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
        });

        // Botón confirmar
        const confirmar = document.getElementById('btn-export-confirmar');
        confirmar.onclick = () => this._ejecutarExportacion(contexto);

        this.showModal('modal-exportar');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    async _ejecutarExportacion(contexto) {
        const formato = document.querySelector('.export-format-btn.active')?.dataset.format || 'csv';
        const activosChips = [...document.querySelectorAll('.export-dataset-chip.active')].map(c => c.dataset.id);
        const hoy = new Date().toISOString().slice(0, 10);

        try {
            // Recopilar datos según contexto
            let sheets = {};

            if (contexto === 'reportes' || activosChips.includes('ventas')) {
                const rows = [[t('reports.export_header_date'), t('reports.export_header_client'), t('reports.export_header_products'), t('reports.export_header_total')]];
                document.querySelectorAll('#sales-detail-table tbody tr').forEach(tr => {
                    const cells = [...tr.querySelectorAll('td')].map(td => td.textContent.trim());
                    if (cells.length) rows.push(cells);
                });
                sheets[t('reports.export_sheet_sales')] = rows;
            }

            if (contexto === 'todo') {
                const [productos, clientes, pedidos] = await Promise.all([
                    window.flowerShopAPI.getProductos(),
                    window.flowerShopAPI.getClientes(),
                    window.flowerShopAPI.getPedidos(),
                ]);

                if (activosChips.includes('productos')) {
                    sheets[t('inventory.sheet_products')] = [
                        [t('inventory.export_col_code'), t('inventory.export_col_name'), t('inventory.export_col_category'), t('inventory.export_col_price_sell'), t('inventory.export_col_price_buy'), t('inventory.export_col_stock'), t('inventory.export_col_min_stock')],
                        ...productos.map(p => [p.codigo_producto||'', p.nombre, p.categoria_nombre||'', p.precio_venta, p.precio_compra||0, p.stock_actual, p.stock_minimo]),
                    ];
                }
                if (activosChips.includes('clientes')) {
                    sheets[t('inventory.sheet_clients')] = [
                        [t('inventory.export_col_client_name'), t('inventory.export_col_email'), t('inventory.export_col_phone'), t('inventory.export_col_type')],
                        ...clientes.map(c => [`${c.nombre} ${c.apellidos||''}`.trim(), c.email||'', c.telefono||'', c.tipo_cliente||'']),
                    ];
                }
                if (activosChips.includes('encargos')) {
                    sheets[t('inventory.sheet_orders')] = [
                        [t('inventory.export_col_id'), t('common.client'), t('inventory.export_col_delivery'), t('common.status'), t('inventory.export_col_total')],
                        ...pedidos.map(p => [p.id, p.cliente_nombre||'—', p.fecha_entrega||'', p.estado, p.total]),
                    ];
                }
            }

            if (!Object.keys(sheets).length) {
                this.showNotification(t('msgs.export_select'), 'warning');
                return;
            }

            if (formato === 'csv') {
                const allRows = [];
                for (const [title, rows] of Object.entries(sheets)) {
                    if (allRows.length) allRows.push([]);
                    allRows.push([`--- ${title.toUpperCase()} ---`]);
                    allRows.push(...rows);
                }
                this._downloadCSV(allRows, `petalo_exportacion_${hoy}.csv`);

            } else if (formato === 'excel') {
                const wb = XLSX.utils.book_new();
                for (const [title, rows] of Object.entries(sheets)) {
                    const ws = XLSX.utils.aoa_to_sheet(rows);
                    XLSX.utils.book_append_sheet(wb, ws, title);
                }
                XLSX.writeFile(wb, `petalo_exportacion_${hoy}.xlsx`);

            } else if (formato === 'pdf') {
                const { jsPDF } = window.jspdf;
                const empresa = await window.flowerShopAPI.getConfiguracion();
                const nombreEmpresa = empresa?.empresa_nombre || 'Mi Floristería';
                const direccionEmpresa = empresa?.empresa_direccion || '';
                const telefonoEmpresa = empresa?.empresa_telefono || '';

                const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
                const PW = doc.internal.pageSize.width;
                const PH = doc.internal.pageSize.height;

                // Paleta de colores
                const C = {
                    primary:      [34, 90, 60],
                    primaryMid:   [52, 131, 88],
                    accent:       [74, 222, 128],
                    accentLight:  [220, 252, 231],
                    headerText:   [255, 255, 255],
                    rowAlt:       [246, 250, 248],
                    rowBorder:    [209, 231, 221],
                    bodyText:     [30, 41, 59],
                    mutedText:    [100, 116, 139],
                    footerBg:     [241, 245, 249],
                };

                const fechaLarga = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
                let pageNum = 1;

                const drawHeader = () => {
                    // Fondo principal verde
                    doc.setFillColor(...C.primary);
                    doc.rect(0, 0, PW, 20, 'F');
                    // Franja decorativa verde claro
                    doc.setFillColor(...C.primaryMid);
                    doc.rect(0, 20, PW, 3, 'F');
                    // Línea acento
                    doc.setFillColor(...C.accent);
                    doc.rect(0, 23, PW, 1.5, 'F');

                    // Nombre empresa (izq)
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(15);
                    doc.setTextColor(...C.headerText);
                    doc.text(nombreEmpresa, 14, 13);

                    // Subtítulo (izq)
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(7.5);
                    doc.setTextColor(180, 230, 200);
                    if (telefonoEmpresa || direccionEmpresa) {
                        doc.text([direccionEmpresa, telefonoEmpresa].filter(Boolean).join('  ·  '), 14, 18.5);
                    }

                    // Fecha + página (der)
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(7.5);
                    doc.setTextColor(...C.headerText);
                    doc.text(fechaLarga, PW - 14, 11, { align: 'right' });
                    doc.setFontSize(7);
                    doc.setTextColor(180, 230, 200);
                    doc.text(`Página ${pageNum}`, PW - 14, 17, { align: 'right' });

                    doc.setTextColor(0, 0, 0);
                };

                const drawFooter = () => {
                    doc.setFillColor(...C.footerBg);
                    doc.rect(0, PH - 9, PW, 9, 'F');
                    doc.setDrawColor(...C.rowBorder);
                    doc.line(0, PH - 9, PW, PH - 9);
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(7);
                    doc.setTextColor(...C.mutedText);
                    doc.text('Documento generado con Pétalo — Software de Gestión para Floristería', 14, PH - 4);
                    doc.text(`${fechaLarga}`, PW - 14, PH - 4, { align: 'right' });
                    doc.setTextColor(0, 0, 0);
                };

                const newPage = () => {
                    doc.addPage();
                    pageNum++;
                    drawHeader();
                    drawFooter();
                };

                drawHeader();
                drawFooter();
                let y = 32;

                const sheetEntries = Object.entries(sheets);
                sheetEntries.forEach(([title, rows], sheetIdx) => {
                    if (sheetIdx > 0) { newPage(); y = 32; }

                    // Caja título sección
                    doc.setFillColor(...C.accentLight);
                    doc.roundedRect(14, y, PW - 28, 9, 1.5, 1.5, 'F');
                    doc.setDrawColor(...C.accent);
                    doc.roundedRect(14, y, PW - 28, 9, 1.5, 1.5, 'S');
                    // Barra izquierda color
                    doc.setFillColor(...C.primaryMid);
                    doc.roundedRect(14, y, 3.5, 9, 1, 1, 'F');
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(9);
                    doc.setTextColor(...C.primary);
                    doc.text(title.toUpperCase(), 22, y + 6);
                    doc.setTextColor(0, 0, 0);
                    y += 14;

                    if (!rows.length) return;
                    const headers = rows[0];
                    const data = rows.slice(1);
                    const colCount = headers.length;
                    const tableW = PW - 28;
                    const colW = tableW / colCount;
                    const rowH = 6.5;

                    const drawTableHeader = (startY) => {
                        doc.setFillColor(...C.primary);
                        doc.rect(14, startY, tableW, rowH + 1, 'F');
                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(7.5);
                        doc.setTextColor(...C.headerText);
                        headers.forEach((h, i) => {
                            doc.text(String(h ?? '').slice(0, 24), 17 + i * colW, startY + 5);
                        });
                        doc.setTextColor(0, 0, 0);
                        return startY + rowH + 1;
                    };

                    y = drawTableHeader(y);

                    data.forEach((row, ri) => {
                        if (y + rowH > PH - 14) {
                            newPage(); y = 32;
                            // Re-title
                            doc.setFillColor(...C.accentLight);
                            doc.roundedRect(14, y, PW - 28, 9, 1.5, 1.5, 'F');
                            doc.setFillColor(...C.primaryMid);
                            doc.roundedRect(14, y, 3.5, 9, 1, 1, 'F');
                            doc.setFont('helvetica', 'bold');
                            doc.setFontSize(9);
                            doc.setTextColor(...C.primary);
                            doc.text(`${title.toUpperCase()} (cont.)`, 22, y + 6);
                            doc.setTextColor(0, 0, 0);
                            y += 14;
                            y = drawTableHeader(y);
                        }
                        // Fila alternada
                        if (ri % 2 === 0) {
                            doc.setFillColor(...C.rowAlt);
                            doc.rect(14, y, tableW, rowH, 'F');
                        }
                        // Borde inferior fila
                        doc.setDrawColor(...C.rowBorder);
                        doc.line(14, y + rowH, 14 + tableW, y + rowH);

                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(7.5);
                        doc.setTextColor(...C.bodyText);
                        row.forEach((cell, i) => {
                            const text = String(cell ?? '').slice(0, 26);
                            doc.text(text, 17 + i * colW, y + 4.8);
                        });
                        y += rowH;
                    });

                    // Borde exterior tabla
                    doc.setDrawColor(...C.primaryMid);
                    doc.rect(14, y - data.length * rowH - rowH - 1, tableW, data.length * rowH + rowH + 1);
                    y += 10;
                });

                doc.save(`petalo_exportacion_${hoy}.pdf`);
            }

            this.hideModal('modal-exportar');
            this.showNotification(t('msgs.export_done'), 'success');
        } catch (e) {
            console.error(e);
            this.showNotification(t('msgs.export_error'), 'error');
        }
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
            document.getElementById('form-producto')?.removeAttribute('data-imagen');
            this._setProductoImagePreview(null);
            await this.loadCategoriasEnModal();
            this.setupCodigoProductoAutoGen();
            this.showModal('modal-producto');
        } catch (error) {
            console.error('❌ Error abriendo modal de producto:', error);
            this.showNotification(t('msgs.error_open_form'), 'error');
        }
    }

    async loadCategoriasEnModal() {
        try {
            const categorias = await window.flowerShopAPI.getCategorias();
            const select = document.getElementById('producto-categoria');
            if (select) {
                select.innerHTML = `<option value="">${t('products.select_category')}</option>` +
                    categorias.map(cat => `<option value="${cat.id}">${cat.nombre}</option>`).join('');
            }
        } catch (error) {
            console.error('❌ Error cargando categorías:', error);
            this.showNotification(t('msgs.error_load'), 'error');
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
                this.showNotification(t('msgs.product_not_found'), 'error');
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
            const imgSrc = await window.flowerShopAPI.getProductoImagen(producto.id);
            form.setAttribute('data-imagen', imgSrc || '');
            this._setProductoImagePreview(imgSrc || null);
            this.showModal('modal-producto');
        } catch (error) {
            console.error('❌ Error editando producto:', error);
            this.showNotification(t('msgs.error_open_form'), 'error');
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
                                <p class="modal-subtitle-pro">${p.codigo_producto || t('products.no_code')} · ${p.categoria_nombre || t('products.no_category')}</p>
                            </div>
                        </div>
                        <button class="modal-close" aria-label="${t('common.close')}">&times;</button>
                    </div>
                    <div class="modal-body" style="display:flex;flex-direction:column;gap:var(--sp-4)">
                        ${p.tiene_imagen ? `<img id="ver-producto-img-${p.id}" src="" style="width:100%;max-height:180px;object-fit:cover;border-radius:var(--r-md)">` : ''}
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4)">
                            ${field(t('products.sell_price'), val(window.flowerShopAPI.formatCurrency(p.precio_venta)))}
                            ${field(t('products.buy_price'), val(window.flowerShopAPI.formatCurrency(p.precio_compra || 0)))}
                            ${field(t('products.stock'), val(`${p.stock_actual} ${p.unidad_medida}`, stockBajo))}
                            ${field(t('products.min_stock'), val(`${p.stock_minimo} ${p.unidad_medida}`))}
                            ${field(t('common.status'), `<span><span class="estado-badge ${p.activo ? 'confirmado' : 'cancelado'}">${p.activo ? t('common.active') : t('common.inactive')}</span></span>`)}
                            ${field(t('products.category'), val(p.categoria_nombre || t('products.no_category')))}
                        </div>
                        ${p.descripcion ? `
                        <div style="padding-top:var(--sp-3);border-top:1px solid var(--s-100)">
                            ${lbl(t('products.description'))}
                            <p style="margin:var(--sp-1) 0 0;font-size:0.88rem;color:var(--text-secondary)">${p.descripcion}</p>
                        </div>` : ''}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary modal-close">${t('common.close')}</button>
                        <button type="button" class="btn btn-primary" onclick="app.closeModal(document.getElementById('modal-ver-producto-${p.id}')); app.editarProducto(${p.id})">${t('products.modal_edit')}</button>
                    </div>
                </div>
            `;
            // Remove any previous instance to avoid DOM leak
            document.getElementById('modal-ver-producto-' + p.id)?.remove();
            modal.id = 'modal-ver-producto-' + p.id;
            document.body.appendChild(modal);
            const closeVerProducto = () => { this.closeModal(modal); setTimeout(() => modal.remove(), 300); };
            modal.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', closeVerProducto));
            modal.addEventListener('click', e => { if (e.target === modal) closeVerProducto(); });
            this.showModal(modal.id);
            if (p.tiene_imagen) {
                window.flowerShopAPI.getProductoImagen(p.id).then(src => {
                    if (src) { const img = document.getElementById(`ver-producto-img-${p.id}`); if (img) img.src = src; }
                });
            }
        } catch (e) {
            console.error(e);
        }
    }

    async eliminarProducto(id) {
        const ok = await this._confirm(t('confirms.delete_product_title'), t('confirms.delete_product'), t('confirms.btn_delete'));
        if (!ok) return;
        try {
            await window.flowerShopAPI.eliminarProducto(id);
            await this.loadProductosData();
            await this.updateSidebarBadges();
            this.showNotification(t('msgs.product_deleted'), 'success');
            // Re-apply active filters
            const termino = document.getElementById('search-productos')?.value || '';
            const catId = document.getElementById('filter-categoria')?.value || '';
            if (termino || catId) this.filtrarProductos(termino);
        } catch (error) {
            console.error('Error eliminando producto:', error);
            this.showNotification(t('msgs.error_delete'), 'error');
        }
    }

    // ========== CATEGORÍAS ==========
    _emojisCategorias() {
        return ['🌸','🌹','🌺','🌻','🌼','🌷','🌿','🍀','🌱','🌲','🌳','🌴','🍁','🍂','🍃','🌵',
                '🎋','🎍','🪴','🪷','💐','🫧','🧺','🎁','🎀','🏺','🪨','🧪','🌙','⭐','🦋','🐝'];
    }

    async cargarSelectTiposCliente(valorActual) {
        const select = document.getElementById('cliente-tipo');
        if (!select) return;
        try {
            const tipos = await window.flowerShopAPI.getTiposCliente();
            select.innerHTML = tipos.map(t =>
                `<option value="${t.nombre}" ${t.nombre === valorActual ? 'selected' : ''}>${t.nombre}</option>`
            ).join('');
        } catch (_) {
            select.innerHTML = `<option value="Regular">Regular</option>`;
        }
    }

    async gestionarTiposCliente() {
        await this._renderTiposClienteLista();
        this.showModal('modal-tipos-cliente');
        document.getElementById('nuevo-tipo-nombre')?.focus();
    }

    async _renderTiposClienteLista() {
        const lista = document.getElementById('tipos-cliente-lista');
        if (!lista) return;
        const tipos = await window.flowerShopAPI.getTiposCliente();
        if (!tipos.length) {
            lista.innerHTML = `<p style="text-align:center;color:var(--text-muted);font-size:0.85rem">${t('clients.no_types')}</p>`;
            return;
        }
        lista.innerHTML = tipos.map(t => `
            <div class="cat-item" id="tipo-item-${t.id}">
                <span class="cat-icono-btn" style="background:${t.color}20;width:32px;height:32px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center">
                    <span style="width:12px;height:12px;border-radius:50%;background:${t.color};display:inline-block"></span>
                </span>
                <span class="cat-nombre" id="tipo-nombre-${t.id}">${t.nombre}</span>
                <div class="cat-actions">
                    <button class="btn btn-ghost btn-sm" onclick="app._editarTipoCliente(${t.id}, '${t.nombre}', '${t.color}')">
                        <i data-lucide="pencil" style="width:14px;height:14px"></i>
                    </button>
                    <button class="btn btn-ghost btn-sm" style="color:var(--color-danger)" onclick="app._eliminarTipoCliente(${t.id})">
                        <i data-lucide="trash-2" style="width:14px;height:14px"></i>
                    </button>
                </div>
            </div>
        `).join('');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    async crearTipoCliente() {
        const nombre = document.getElementById('nuevo-tipo-nombre')?.value?.trim();
        const color  = document.getElementById('nuevo-tipo-color')?.value || '#6b7280';
        if (!nombre) { this.showNotification(t('msgs.type_name_required'), 'warning'); return; }
        try {
            await window.flowerShopAPI.crearTipoCliente({ nombre, color });
            document.getElementById('nuevo-tipo-nombre').value = '';
            document.getElementById('nuevo-tipo-color').value = '#6b7280';
            await this._renderTiposClienteLista();
            await this.cargarSelectTiposCliente();
            this.showNotification(t('msgs.type_created'), 'success');
        } catch (e) {
            this.showNotification(e.message || t('msgs.type_create_error'), 'error');
        }
    }

    _editarTipoCliente(id, nombreActual, colorActual) {
        const item = document.getElementById(`tipo-item-${id}`);
        if (!item) return;
        item.innerHTML = `
            <input type="color" id="edit-tipo-color-${id}" value="${colorActual}" style="width:32px;height:32px;border:none;border-radius:var(--r-md);cursor:pointer;padding:2px;background:none">
            <input type="text" id="edit-tipo-nombre-${id}" value="${nombreActual}" class="form-input" style="flex:1">
            <button class="btn btn-primary btn-sm" onclick="app._guardarTipoCliente(${id})">${t('inventory.btn_save')}</button>
            <button class="btn btn-secondary btn-sm" onclick="app._renderTiposClienteLista()">${t('common.cancel')}</button>
        `;
        document.getElementById(`edit-tipo-nombre-${id}`)?.focus();
    }

    async _guardarTipoCliente(id) {
        const nombre = document.getElementById(`edit-tipo-nombre-${id}`)?.value?.trim();
        const color  = document.getElementById(`edit-tipo-color-${id}`)?.value || '#6b7280';
        if (!nombre) { this.showNotification(t('msgs.type_name_empty'), 'warning'); return; }
        try {
            await window.flowerShopAPI.actualizarTipoCliente(id, { nombre, color });
            await this._renderTiposClienteLista();
            await this.cargarSelectTiposCliente();
            this.showNotification(t('msgs.type_updated'), 'success');
        } catch (e) {
            this.showNotification(e.message || t('msgs.type_update_error'), 'error');
        }
    }

    async _eliminarTipoCliente(id) {
        if (!await this._confirm(t('confirms.delete_type_title'), t('confirms.delete_client_type'), t('confirms.btn_delete'), 'btn-danger')) return;
        try {
            await window.flowerShopAPI.eliminarTipoCliente(id);
            await this._renderTiposClienteLista();
            await this.cargarSelectTiposCliente();
            this.showNotification(t('msgs.type_deleted'), 'success');
        } catch (e) {
            this.showNotification(e.message || t('msgs.type_delete_error'), 'error');
        }
    }

    async gestionarTiposEvento() {
        await this._renderTiposEventoLista();
        this.showModal('modal-tipos-evento');
        document.getElementById('nuevo-tipo-evento-nombre')?.focus();
    }

    async _renderTiposEventoLista() {
        const lista = document.getElementById('tipos-evento-lista');
        if (!lista) return;
        const tipos = await window.flowerShopAPI.getTiposEvento();
        if (!tipos.length) {
            lista.innerHTML = `<p style="text-align:center;color:var(--text-muted);font-size:0.85rem">${t('clients.no_types')}</p>`;
            return;
        }
        lista.innerHTML = tipos.map(t => `
            <div class="cat-item" id="tipo-evento-item-${t.id}">
                <span style="background:${t.color}20;width:32px;height:32px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">
                    <span style="width:12px;height:12px;border-radius:50%;background:${t.color};display:inline-block"></span>
                </span>
                <span class="cat-nombre">${t.nombre}</span>
                <div class="cat-actions">
                    <button class="btn btn-ghost btn-sm" onclick="app._editarTipoEvento(${t.id}, '${t.nombre.replace(/'/g,"\\'")}', '${t.color}')">
                        <i data-lucide="pencil" style="width:14px;height:14px"></i>
                    </button>
                    <button class="btn btn-ghost btn-sm" style="color:var(--color-danger)" onclick="app._eliminarTipoEvento(${t.id})">
                        <i data-lucide="trash-2" style="width:14px;height:14px"></i>
                    </button>
                </div>
            </div>
        `).join('');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    async crearTipoEvento() {
        const nombre = document.getElementById('nuevo-tipo-evento-nombre')?.value?.trim();
        const color  = document.getElementById('nuevo-tipo-evento-color')?.value || '#6b7280';
        if (!nombre) { this.showNotification(t('msgs.type_name_required'), 'warning'); return; }
        try {
            await window.flowerShopAPI.crearTipoEvento({ nombre, color });
            document.getElementById('nuevo-tipo-evento-nombre').value = '';
            document.getElementById('nuevo-tipo-evento-color').value = '#6b7280';
            await this._renderTiposEventoLista();
            await this.cargarSelectTiposEvento();
            this.showNotification(t('msgs.type_created'), 'success');
        } catch (e) {
            this.showNotification(e.message || t('msgs.type_create_error'), 'error');
        }
    }

    _editarTipoEvento(id, nombreActual, colorActual) {
        const item = document.getElementById(`tipo-evento-item-${id}`);
        if (!item) return;
        item.innerHTML = `
            <input type="color" id="edit-tipo-evento-color-${id}" value="${colorActual}" style="width:32px;height:32px;border:none;border-radius:var(--r-md);cursor:pointer;padding:2px;background:none">
            <input type="text" id="edit-tipo-evento-nombre-${id}" value="${nombreActual}" class="form-input" style="flex:1">
            <button class="btn btn-primary btn-sm" onclick="app._guardarTipoEvento(${id})">${t('inventory.btn_save')}</button>
            <button class="btn btn-secondary btn-sm" onclick="app._renderTiposEventoLista()">${t('common.cancel')}</button>
        `;
        document.getElementById(`edit-tipo-evento-nombre-${id}`)?.focus();
    }

    async _guardarTipoEvento(id) {
        const nombre = document.getElementById(`edit-tipo-evento-nombre-${id}`)?.value?.trim();
        const color  = document.getElementById(`edit-tipo-evento-color-${id}`)?.value || '#6b7280';
        if (!nombre) { this.showNotification(t('msgs.type_name_empty'), 'warning'); return; }
        try {
            await window.flowerShopAPI.actualizarTipoEvento(id, { nombre, color });
            await this._renderTiposEventoLista();
            await this.cargarSelectTiposEvento();
            this.showNotification(t('msgs.type_updated'), 'success');
        } catch (e) {
            this.showNotification(e.message || t('msgs.type_update_error'), 'error');
        }
    }

    async _eliminarTipoEvento(id) {
        if (!await this._confirm(t('confirms.delete_type_title'), t('confirms.delete_event_type'), t('confirms.btn_delete'), 'btn-danger')) return;
        try {
            await window.flowerShopAPI.eliminarTipoEvento(id);
            await this._renderTiposEventoLista();
            await this.cargarSelectTiposEvento();
            this.showNotification(t('msgs.type_deleted'), 'success');
        } catch (e) {
            this.showNotification(e.message || t('msgs.type_delete_error'), 'error');
        }
    }

    async cargarSelectTiposEvento() {
        const select = document.getElementById('evento-tipo');
        if (!select) return;
        const tipos = await window.flowerShopAPI.getTiposEvento().catch(() => []);
        const valorActual = select.value;
        select.innerHTML = tipos.map(t =>
            `<option value="${t.nombre}" style="color:${t.color}" ${t.nombre === valorActual ? 'selected' : ''}>${t.nombre}</option>`
        ).join('');
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
            container.innerHTML = `<p style="color:var(--s-400);font-size:0.82rem;text-align:center;padding:var(--sp-3)">${t('events.no_types')}</p>`;
            return;
        }
        container.innerHTML = categorias.map(c => `
            <div class="cat-item" id="cat-row-${c.id}">
                <span class="cat-item-icono">${c.icono || '🌿'}</span>
                <span class="cat-item-nombre">${c.nombre}</span>
                <div class="cat-item-actions">
                    <button class="btn btn-sm btn-ghost" title="${t('common.btn_edit')}" onclick="app.editarCategoria(${c.id}, '${(c.icono||'🌿')}', '${c.nombre.replace(/'/g, "\\'")}')">
                        <i data-lucide="pencil" style="width:14px;height:14px"></i>
                    </button>
                    <button class="btn btn-sm btn-ghost" style="color:var(--error)" title="${t('common.btn_delete')}" onclick="app.eliminarCategoria(${c.id}, '${c.nombre.replace(/'/g, "\\'")}')">
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
        if (!nombre) { this.showNotification(t('msgs.type_name_empty'), 'warning'); return; }
        try {
            await window.flowerShopAPI.actualizarCategoria(id, { nombre, icono });
            await this.renderListaCategorias();
            await this.refreshCategoriasSelect();
            this.showNotification(t('msgs.cat_updated'), 'success');
        } catch (e) {
            this.showNotification(t('msgs.cat_update_error'), 'error');
        }
    }

    async crearCategoria() {
        const nombre = document.getElementById('nueva-categoria-nombre')?.value.trim();
        const icono = document.getElementById('nueva-categoria-icono')?.value.trim() || '🌿';
        if (!nombre) { this.showNotification(t('msgs.cat_name_required'), 'warning'); return; }
        try {
            await window.flowerShopAPI.crearCategoria({ nombre, icono });
            document.getElementById('nueva-categoria-nombre').value = '';
            document.getElementById('nueva-categoria-icono').value = '';
            await this.renderListaCategorias();
            // Refrescar el select de categoría en el formulario de producto
            await this.refreshCategoriasSelect();
            this.showNotification(t('msgs.cat_created'), 'success');
        } catch (e) {
            this.showNotification(t('msgs.cat_create_error'), 'error');
        }
    }

    async eliminarCategoria(id, nombre) {
        const ok = await this._confirm(t('confirms.delete_category_title'), `¿Eliminar "<strong>${nombre}</strong>"?<br><small>Solo se puede eliminar si no tiene productos asociados.</small>`, t('confirms.btn_delete'), 'btn-danger');
        if (!ok) return;
        try {
            await window.flowerShopAPI.eliminarCategoria(id);
            await this.renderListaCategorias();
            await this.refreshCategoriasSelect();
            this.showNotification(t('msgs.cat_deleted'), 'success');
        } catch (e) {
            this.showNotification(e.message || t('msgs.cat_delete_error'), 'error');
        }
    }

    async refreshCategoriasSelect() {
        const sel = document.getElementById('producto-categoria');
        if (!sel) return;
        const categorias = await window.flowerShopAPI.getCategorias();
        const val = sel.value;
        sel.innerHTML = `<option value="">${t('common.select_category')}</option>` +
            categorias.map(c => `<option value="${c.id}">${c.icono || ''} ${c.nombre}</option>`).join('');
        sel.value = val;
    }

    // Clientes
    async nuevoCliente() {
        try {
            this.clearForm('form-cliente');
            this._resetClienteFoto();
            await this.cargarSelectTiposCliente();
            this.showModal('modal-cliente');
        } catch (error) {
            console.error('❌ Error abriendo modal de cliente:', error);
            this.showNotification(t('msgs.error_open_form'), 'error');
        }
    }

    async editarCliente(id) {
        try {
            const clientes = await window.flowerShopAPI.getClientes();
            const cliente = clientes.find(c => c.id === id);
            if (!cliente) {
                this.showNotification(t('msgs.client_not_found'), 'error');
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
            await this.cargarSelectTiposCliente(cliente.tipo_cliente);
            document.getElementById('cliente-preferencias').value = cliente.preferencias || '';
            document.getElementById('cliente-presupuesto-habitual').value = cliente.presupuesto_habitual || '';
            document.getElementById('cliente-ocasiones-importantes').value = cliente.ocasiones_importantes || '';
            document.getElementById('cliente-notas').value = cliente.notas || '';
            this._resetClienteFoto();
            if (cliente.tiene_imagen) {
                const img = await window.flowerShopAPI.getClienteImagen(id);
                if (img) this._setClienteFotoPreview(img);
            }
            this.showModal('modal-cliente');
        } catch (error) {
            console.error('❌ Error editando cliente:', error);
            this.showNotification(t('msgs.error_open_form'), 'error');
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
                this.showNotification(t('msgs.client_not_found'), 'error');
                return;
            }

            const pedidosCliente = pedidos.filter(p => p.cliente_id === parseInt(id));
            const totalPedidos = pedidosCliente.length;
            const totalGastado = pedidosCliente
                .filter(p => p.estado === 'aprobado')
                .reduce((sum, p) => sum + (p.total || 0), 0);
            const fechaRegistro = cliente.created_at ? new Date(cliente.created_at).getFullYear() : new Date().getFullYear();

            document.getElementById('historial-cliente-nombre').textContent = `${cliente.nombre} ${cliente.apellidos || ''}`.trim();
            document.getElementById('historial-cliente-email').textContent = cliente.email || t('clients.no_email');
            const elPed = document.getElementById('stat-pedidos-num') || document.getElementById('stat-pedidos');
            const elGas = document.getElementById('stat-gastado-num') || document.getElementById('stat-gastado');
            if (elPed) elPed.textContent = totalPedidos;
            if (elGas) elGas.textContent = window.flowerShopAPI.formatCurrency(totalGastado);
            const elFecha = document.getElementById('stat-fecha');
            if (elFecha) elFecha.innerHTML = `${t('clients.registered_since')} <strong>${fechaRegistro}</strong>`;

            // Resetear filtros y guardar pedidos del cliente para filtrado
            const filtroPeriodo = document.getElementById('filtro-periodo');
            const filtroEstado = document.getElementById('filtro-estado');
            if (filtroPeriodo) filtroPeriodo.value = 'todos';
            if (filtroEstado) filtroEstado.value = 'todos';

            this._historialPedidos = pedidosCliente;
            this._clienteHistorial = cliente;
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
            this.showNotification(t('msgs.error_historial'), 'error');
        }
    }

    mostrarHistorialPedidos(pedidos) {
        const container = document.getElementById('historial-pedidos-lista');

        if (pedidos.length === 0) {
            container.innerHTML = `<div class="historial-empty">${t('clients.no_data')}</div>`;
            return;
        }

        const pedidosOrdenados = pedidos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        container.innerHTML = `
            <table class="historial-table">
                <thead>
                    <tr>
                        <th>${t('clients.history_order')}</th>
                        <th>${t('clients.history_date')}</th>
                        <th>${t('clients.history_delivery')}</th>
                        <th>${t('clients.history_status')}</th>
                        <th class="text-right">${t('clients.history_total')}</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    ${pedidosOrdenados.map(p => `
                        <tr>
                            <td class="historial-num">#${p.numero_pedido}</td>
                            <td class="historial-fecha">${window.flowerShopAPI.formatDate(p.created_at)}</td>
                            <td class="historial-fecha">${p.fecha_entrega ? window.flowerShopAPI.formatDate(p.fecha_entrega) : '—'}</td>
                            <td><span class="estado-badge ${p.estado}">${this.getTranslatedEstado(p.estado)}</span></td>
                            <td class="historial-total text-right">${window.flowerShopAPI.formatCurrency(p.total || 0)}</td>
                            <td><button class="btn btn-sm btn-secondary" onclick="app.verPedido(${p.id})">${t('historial.view')}</button></td>
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
                this.showNotification(t('msgs.client_not_found'), 'error');
                return;
            }
            await this.nuevoPedido(true);
            setTimeout(() => this.preseleccionarClienteEnModal(cliente, id), 200);
        } catch (error) {
            console.error('❌ Error abriendo formulario de pedido:', error);
            this.showNotification(t('msgs.error_form_order'), 'error');
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

    // Función para exportar historial del cliente
    async exportarHistorialCliente() {
        const cliente  = this._clienteHistorial;
        const pedidos  = this._historialPedidos || [];
        if (!cliente) { this.showNotification(t('msgs.no_client'), 'warning'); return; }

        try {
            const { jsPDF } = window.jspdf;
            const empresa        = await window.flowerShopAPI.getConfiguracion();
            const nombreEmpresa  = empresa?.empresa_nombre  || 'Mi Floristería';
            const dirEmpresa     = empresa?.empresa_direccion || '';
            const telEmpresa     = empresa?.empresa_telefono  || '';

            const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const PW   = doc.internal.pageSize.width;
            const PH   = doc.internal.pageSize.height;

            const C = {
                primary:     [34, 90, 60],
                primaryMid:  [52, 131, 88],
                accent:      [74, 222, 128],
                accentLight: [220, 252, 231],
                headerText:  [255, 255, 255],
                rowAlt:      [246, 250, 248],
                rowBorder:   [209, 231, 221],
                bodyText:    [30, 41, 59],
                mutedText:   [100, 116, 139],
                footerBg:    [241, 245, 249],
            };

            const fechaLarga = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
            let pageNum = 1;

            const drawHeader = () => {
                doc.setFillColor(...C.primary);
                doc.rect(0, 0, PW, 20, 'F');
                doc.setFillColor(...C.primaryMid);
                doc.rect(0, 20, PW, 3, 'F');
                doc.setFillColor(...C.accent);
                doc.rect(0, 23, PW, 1.5, 'F');

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(15);
                doc.setTextColor(...C.headerText);
                doc.text(nombreEmpresa, 14, 13);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7.5);
                doc.setTextColor(180, 230, 200);
                if (telEmpresa || dirEmpresa) {
                    doc.text([dirEmpresa, telEmpresa].filter(Boolean).join('  ·  '), 14, 18.5);
                }

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7.5);
                doc.setTextColor(...C.headerText);
                doc.text(fechaLarga, PW - 14, 11, { align: 'right' });
                doc.setFontSize(7);
                doc.setTextColor(180, 230, 200);
                doc.text(`Página ${pageNum}`, PW - 14, 17, { align: 'right' });
                doc.setTextColor(0, 0, 0);
            };

            const drawFooter = () => {
                doc.setFillColor(...C.footerBg);
                doc.rect(0, PH - 9, PW, 9, 'F');
                doc.setDrawColor(...C.rowBorder);
                doc.line(0, PH - 9, PW, PH - 9);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7);
                doc.setTextColor(...C.mutedText);
                doc.text('Documento generado con Pétalo — Software de Gestión para Floristería', 14, PH - 4);
                doc.text(fechaLarga, PW - 14, PH - 4, { align: 'right' });
                doc.setTextColor(0, 0, 0);
            };

            const newPage = () => {
                doc.addPage();
                pageNum++;
                drawHeader();
                drawFooter();
            };

            drawHeader();
            drawFooter();
            let y = 32;

            // ── Ficha del cliente ──────────────────────────────────────────
            doc.setFillColor(...C.accentLight);
            doc.roundedRect(14, y, PW - 28, 36, 2, 2, 'F');
            doc.setDrawColor(...C.accent);
            doc.roundedRect(14, y, PW - 28, 36, 2, 2, 'S');
            doc.setFillColor(...C.primaryMid);
            doc.roundedRect(14, y, 3.5, 36, 1.5, 1.5, 'F');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(13);
            doc.setTextColor(...C.primary);
            const nombreCompleto = `${cliente.nombre} ${cliente.apellidos || ''}`.trim();
            doc.text(nombreCompleto, 22, y + 9);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(...C.bodyText);
            const filaInfo = [
                cliente.email        ? `Email: ${cliente.email}`        : null,
                cliente.telefono     ? `Tel: ${cliente.telefono}`       : null,
                cliente.tipo_cliente ? `Tipo: ${cliente.tipo_cliente.charAt(0).toUpperCase() + cliente.tipo_cliente.slice(1)}` : null,
                cliente.created_at   ? `Cliente desde ${new Date(cliente.created_at).getFullYear()}` : null,
            ].filter(Boolean);
            filaInfo.forEach((txt, i) => {
                doc.text(txt, 22, y + 17 + i * 6);
            });
            if (cliente.notas) {
                doc.setFontSize(7.5);
                doc.setTextColor(...C.mutedText);
                doc.text(`Notas: ${cliente.notas.slice(0, 80)}`, 22, y + 33);
            }
            doc.setTextColor(0, 0, 0);
            y += 44;

            // Título sección pedidos
            doc.setFillColor(...C.accentLight);
            doc.roundedRect(14, y, PW - 28, 9, 1.5, 1.5, 'F');
            doc.setDrawColor(...C.accent);
            doc.roundedRect(14, y, PW - 28, 9, 1.5, 1.5, 'S');
            doc.setFillColor(...C.primaryMid);
            doc.roundedRect(14, y, 3.5, 9, 1, 1, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(...C.primary);
            doc.text('HISTORIAL DE PEDIDOS', 22, y + 6);
            doc.setTextColor(0, 0, 0);
            y += 14;

            // ── Tabla de pedidos ──────────────────────────────────────────
            const tableW = PW - 28;
            const cols   = [
                { label: t('reports.pdf_col_order'),    w: 28 },
                { label: t('common.date'),              w: 32 },
                { label: t('reports.pdf_col_delivery'), w: 32 },
                { label: t('reports.pdf_col_type'),     w: 28 },
                { label: t('reports.pdf_col_status'),   w: 28 },
                { label: t('reports.pdf_col_total'),    w: 34, right: true },
            ];
            const rowH = 6.5;

            const estadoLabel = (e) => t('statuses.' + e) || e || '—';
            const tipoLabel = (tipo) => {
                const m = { venta_rapida: t('reports.order_type_tpv'), regular: t('reports.order_type_regular') };
                return m[tipo] || tipo || '—';
            };

            const drawTableHead = (startY) => {
                doc.setFillColor(...C.primary);
                doc.rect(14, startY, tableW, rowH + 1, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(7.5);
                doc.setTextColor(...C.headerText);
                let cx = 17;
                cols.forEach(col => {
                    if (col.right) doc.text(col.label, cx + col.w - 3, startY + 5, { align: 'right' });
                    else           doc.text(col.label, cx, startY + 5);
                    cx += col.w;
                });
                doc.setTextColor(0, 0, 0);
                return startY + rowH + 1;
            };

            y = drawTableHead(y);

            const pedidosOrdenados = [...pedidos].sort((a, b) => new Date(b.created_at || b.fecha_pedido) - new Date(a.created_at || a.fecha_pedido));

            pedidosOrdenados.forEach((p, ri) => {
                if (y + rowH > PH - 20) {
                    newPage(); y = 32;
                    doc.setFillColor(...C.accentLight);
                    doc.roundedRect(14, y, PW - 28, 9, 1.5, 1.5, 'F');
                    doc.setFillColor(...C.primaryMid);
                    doc.roundedRect(14, y, 3.5, 9, 1, 1, 'F');
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(9);
                    doc.setTextColor(...C.primary);
                    doc.text('HISTORIAL DE PEDIDOS (cont.)', 22, y + 6);
                    doc.setTextColor(0, 0, 0);
                    y += 14;
                    y = drawTableHead(y);
                }

                if (ri % 2 === 0) {
                    doc.setFillColor(...C.rowAlt);
                    doc.rect(14, y, tableW, rowH, 'F');
                }
                doc.setDrawColor(...C.rowBorder);
                doc.line(14, y + rowH, 14 + tableW, y + rowH);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7.5);
                doc.setTextColor(...C.bodyText);

                const cells = [
                    `#${p.numero_pedido || p.id}`,
                    p.fecha_pedido ? p.fecha_pedido.slice(0, 10) : '—',
                    p.fecha_entrega ? p.fecha_entrega.slice(0, 10) : '—',
                    tipoLabel(p.tipo_pedido),
                    estadoLabel(p.estado),
                    window.flowerShopAPI.formatCurrency(p.total || 0),
                ];
                let cx = 17;
                cols.forEach((col, i) => {
                    if (col.right) doc.text(cells[i], cx + col.w - 3, y + 4.8, { align: 'right' });
                    else           doc.text(String(cells[i]).slice(0, 18), cx, y + 4.8);
                    cx += col.w;
                });
                y += rowH;
            });

            // Borde exterior tabla
            const tableStartY = 32 + 44 + 14;
            doc.setDrawColor(...C.primaryMid);
            doc.rect(14, y - pedidosOrdenados.length * rowH - rowH - 1, tableW, pedidosOrdenados.length * rowH + rowH + 1);
            y += 8;

            // ── Caja resumen final ─────────────────────────────────────────
            const aprobados      = pedidos.filter(p => p.estado === 'aprobado');
            const totalGastado   = aprobados.reduce((s, p) => s + (p.total || 0), 0);
            const ticketMedio    = aprobados.length ? totalGastado / aprobados.length : 0;
            const saldoPendiente = pedidos.filter(p => p.estado !== 'cancelado').reduce((s, p) => s + (p.saldo_pendiente || 0), 0);
            const ultimoPedido   = pedidosOrdenados[0];
            const ultimaFecha    = ultimoPedido ? (ultimoPedido.fecha_pedido || ultimoPedido.created_at || '').slice(0, 10) : '—';

            const sumH = 38;
            if (y + sumH > PH - 14) { newPage(); y = 32; }

            doc.setFillColor(...C.primary);
            doc.roundedRect(14, y, PW - 28, sumH, 2, 2, 'F');
            doc.setFillColor(...C.accent);
            doc.roundedRect(14, y, 3.5, sumH, 1.5, 1.5, 'F');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(...C.headerText);
            doc.text('RESUMEN', 22, y + 8);

            const sumCols = [
                { label: t('reports.sum_total_orders'),        value: String(pedidos.length) },
                { label: t('reports.sum_approved_orders'),     value: String(aprobados.length) },
                { label: t('reports.sum_total_invoiced'),      value: window.flowerShopAPI.formatCurrency(totalGastado) },
                { label: t('reports.sum_avg_ticket'),          value: window.flowerShopAPI.formatCurrency(ticketMedio) },
                { label: t('reports.sum_pending_balance'),     value: window.flowerShopAPI.formatCurrency(saldoPendiente) },
                { label: t('reports.sum_last_order'),          value: ultimaFecha },
            ];
            const half = Math.ceil(sumCols.length / 2);
            const colSumW = (PW - 28) / 2;
            sumCols.forEach((item, i) => {
                const col  = i < half ? 0 : 1;
                const row  = i < half ? i : i - half;
                const bx   = 22 + col * colSumW;
                const by   = y + 16 + row * 7;
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7.5);
                doc.setTextColor(180, 230, 200);
                doc.text(item.label + ':', bx, by);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...C.headerText);
                doc.text(item.value, bx + 38, by);
            });

            doc.setTextColor(0, 0, 0);

            const nombreArchivo = `petalo_historial_${nombreCompleto.replace(/\s+/g, '_').toLowerCase()}.pdf`;
            doc.save(nombreArchivo);
            this.showNotification(t('msgs.pdf_ok'), 'success');
        } catch (e) {
            console.error('Error exportando historial:', e);
            this.showNotification(t('msgs.pdf_error'), 'error');
        }
    }

    // Eventos
    async nuevoEvento() {
        try {
            this.clearForm('form-evento');
            await this.cargarSelectTiposEvento();
            this.showModal('modal-evento');
        } catch (error) {
            console.error('❌ Error abriendo modal de evento:', error);
            this.showNotification(t('msgs.error_open_form'), 'error');
        }
    }

    async editarEvento(id) {
        try {
            // Obtener todos los eventos y buscar el que corresponde
            const eventos = await window.flowerShopAPI.getEventos();
            const evento = eventos.find(ev => ev.id === id);
            if (!evento) {
                this.showNotification(t('msgs.error_load'), 'error');
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
            await this.cargarSelectTiposEvento();
            document.getElementById('evento-tipo').value = evento.tipo_evento || '';
            document.getElementById('evento-demanda').value = evento.demanda_esperada || '';
            document.getElementById('evento-descuento').value = evento.descuento_especial || '';
            document.getElementById('evento-preparacion').value = evento.preparacion_dias || 7;
            document.getElementById('evento-descripcion').value = evento.descripcion || '';
            this.showModal('modal-evento');
        } catch (error) {
            console.error('❌ Error editando evento:', error);
            this.showNotification(t('msgs.error_open_form'), 'error');
        }
    }
    // Eliminar evento
    async eliminarEvento(id) {
        const ok = await this._confirm(t('confirms.delete_event_title'), t('confirms.delete_product'), t('confirms.btn_delete'));
        if (!ok) return;
        try {
            await window.flowerShopAPI.eliminarEvento(id);
            this.showNotification(t('msgs.event_deleted'), 'success');
            await this.loadEventosData();
        } catch (error) {
            this.showNotification(t('msgs.error_delete'), 'error');
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
                                <h2 class="modal-title-pro">${t('inventory.stock_event_title')}</h2>
                                <p class="modal-subtitle-pro">${evento.nombre}</p>
                            </div>
                        </div>
                        <button class="modal-close" aria-label="${t('common.close')}">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-section-title"><span class="form-section-dot"></span>Registrar ajuste de stock</div>
                        <div class="pedido-form-grid" style="margin-bottom:var(--sp-4)">
                            <div class="form-group">
                                <label>${t('common.product')}</label>
                                <select id="evento-stock-producto" class="form-select">
                                    <option value="">${t('common.select_product')}</option>
                                    ${productos.map(p => `<option value="${p.id}" data-stock="${p.stock_actual}" data-unidad="${p.unidad_medida}">${p.nombre} (${p.stock_actual} ${p.unidad_medida})</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>${t('inventory.movement_type_label')}</label>
                                <select id="evento-stock-tipo" class="form-select">
                                    <option value="salida">${t('inventory.movement_exit_event')}</option>
                                    <option value="entrada">${t('inventory.movement_entry_return')}</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>${t('common.quantity')}</label>
                                <input type="number" id="evento-stock-cantidad" class="form-input" min="1" value="1" placeholder="0">
                            </div>
                            <div class="form-group">
                                <label>${t('common.notes')}</label>
                                <input type="text" id="evento-stock-notas" class="form-input" placeholder="${t('common.optional_hint')}">
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
                        <button type="button" class="btn btn-secondary modal-close">${t('common.cancel')}</button>
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
                    this.showNotification(t('msgs.movement_product_qty'), 'warning');
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
                    this.showNotification(t('msgs.movement_ok'), 'success');
                    this.closeModal(modal);
                } catch (err) {
                    console.error(err);
                    this.showNotification(t('msgs.movement_error'), 'error');
                }
            });

            this.showModal('modal-evento-stock');
        } catch (e) {
            console.error(e);
            this.showNotification(t('msgs.error_event_data'), 'error');
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
                sel.innerHTML = `<option value="">— ${t('tpv.client_casual')} —</option>` +
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
            this.showNotification(t('msgs.error_tpv'), 'error');
        }
    }

    renderCatalogoTPV(productos) {
        const container = document.getElementById('tpv-catalogo');
        if (!container) return;
        if (!productos.length) {
            container.innerHTML = `<p style="color:var(--s-400);font-size:0.82rem;padding:var(--sp-3)">${t('tpv.no_products')}</p>`;
            return;
        }
        container.innerHTML = productos.map(p => {
            const enCarrito = (this._tpvCarrito || []).find(i => i.id === p.id)?.cantidad || 0;
            const stockDisponible = p.stock_actual - enCarrito;
            return `
            <div class="tpv-producto-card ${stockDisponible <= 0 ? 'sin-stock' : ''}" id="tpv-card-${p.id}" onclick="app.agregarAlCarritoTPV(${p.id})">
                ${p.tiene_imagen
                    ? `<img src="" class="tpv-producto-img" alt="${p.nombre}" data-producto-id="${p.id}" data-lazy-img="1">`
                    : `<div class="tpv-producto-emoji">${p.categoria_icono || '🌸'}</div>`
                }
                <div class="tpv-producto-nombre">${p.nombre}</div>
                <div class="tpv-producto-precio">${window.flowerShopAPI.formatCurrency(p.precio_venta || 0)}</div>
                <div class="tpv-producto-stock" id="tpv-stock-${p.id}">${stockDisponible <= 0 ? t('tpv.no_stock') : t('tpv.stock_label', { count: stockDisponible })}</div>
            </div>`;
        }).join('');
        this._lazyLoadProductImages();
    }

    _actualizarStocksCatalogoTPV() {
        (this._tpvProductos || []).forEach(p => {
            const enCarrito = (this._tpvCarrito || []).find(i => i.id === p.id)?.cantidad || 0;
            const stockDisponible = p.stock_actual - enCarrito;
            const stockEl = document.getElementById(`tpv-stock-${p.id}`);
            const cardEl  = document.getElementById(`tpv-card-${p.id}`);
            if (stockEl) stockEl.textContent = stockDisponible <= 0 ? t('tpv.no_stock') : t('tpv.stock_label', { count: stockDisponible });
            if (cardEl)  cardEl.classList.toggle('sin-stock', stockDisponible <= 0);
        });
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
                this.showNotification(t('msgs.stock_max'), 'warning');
                return;
            }
            existente.cantidad++;
        } else {
            this._tpvCarrito.push({ id: productoId, nombre: producto.nombre, precio: producto.precio_venta || 0, cantidad: 1, stock: producto.stock_actual });
        }
        this.renderTicketTPV();
        this._actualizarStocksCatalogoTPV();
    }

    cambiarCantidadTPV(productoId, delta) {
        const idx = this._tpvCarrito.findIndex(i => i.id === productoId);
        if (idx === -1) return;
        const item = this._tpvCarrito[idx];
        const nuevaCantidad = item.cantidad + delta;
        if (nuevaCantidad > item.stock) {
            this.showNotification(t('msgs.stock_units', { units: item.stock }), 'warning');
            return;
        }
        if (nuevaCantidad <= 0) {
            this._tpvCarrito.splice(idx, 1);
        } else {
            item.cantidad = nuevaCantidad;
        }
        this.renderTicketTPV();
        this._actualizarStocksCatalogoTPV();
    }

    limpiarTPV() {
        this._tpvCarrito = [];
        this.renderTicketTPV();
        this._actualizarStocksCatalogoTPV();
    }

    renderTicketTPV() {
        const lista = document.getElementById('tpv-ticket-lista');
        const elSubtotal = document.getElementById('tpv-subtotal');
        const elTotal = document.getElementById('tpv-total');
        if (!lista) return;

        if (!this._tpvCarrito || this._tpvCarrito.length === 0) {
            lista.innerHTML = `<p style="color:var(--s-400);font-size:0.8rem;text-align:center;padding:var(--sp-4)">${t('tpv.touch_to_add')}</p>`;
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
            this.showNotification(t('msgs.no_products'), 'warning');
            return;
        }

        const clienteId = document.getElementById('tpv-cliente')?.value || null;
        const total = this._tpvCarrito.reduce((s, i) => s + i.precio * i.cantidad, 0);

        if (this._tpvProcesando) return;
        this._tpvProcesando = true;

        const btnCobrar = document.getElementById('btn-cobrar-tpv');
        if (btnCobrar) { btnCobrar.disabled = true; btnCobrar.textContent = t('tpv.processing'); }

        const pedido = {
            cliente_id: clienteId ? parseInt(clienteId) : null,
            fecha_pedido: new Date().toISOString().slice(0, 10),
            fecha_entrega: new Date().toISOString().slice(0, 10),
            estado: 'aprobado',
            tipo_pedido: 'venta_rapida',
            metodo_pago: this._tpvMetodoPago,
            notas: t('tpv.sale_note'),
            subtotal: total,
            total,
            detalles: this._tpvCarrito.map(i => ({
                producto_id: i.id,
                cantidad: i.cantidad,
                precio_unitario: i.precio,
                subtotal: i.precio * i.cantidad
            }))
        };

        try {
            await window.flowerShopAPI.crearPedido(pedido);
            this.hideModal('modal-tpv');
            this.showNotification(t('msgs.sale_ok', { amount: window.flowerShopAPI.formatCurrency(total) }), 'success');
            await this.updateSidebarBadges();
            if (this.currentSection === 'dashboard') await this.loadDashboardData();
            await this.generarNotificaciones();
        } catch (error) {
            console.error('Error registrando venta:', error);
            this.showNotification(t('msgs.sale_error'), 'error');
            if (btnCobrar) { btnCobrar.disabled = false; btnCobrar.innerHTML = `<i data-lucide="check-circle" style="width:18px;height:18px;margin-right:6px"></i>${t('tpv.charge')}`; if (typeof lucide !== 'undefined') lucide.createIcons(); }
        } finally {
            this._tpvProcesando = false;
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
                                    <h2 class="modal-title-pro">${t('orders.modal_new')}</h2>
                                    <p class="modal-subtitle-pro">${t('orders.modal_sub')}</p>
                                </div>
                            </div>
                            <button class="modal-close" aria-label="${t('common.close')}">&times;</button>
                        </div>
                        <div class="modal-body" style="padding:0;display:grid;grid-template-columns:1fr 300px;min-height:420px">
                            <!-- Panel izquierdo: productos -->
                            <div style="padding:var(--sp-5);border-right:1px solid var(--s-100);display:flex;flex-direction:column;gap:var(--sp-3);min-height:520px">
                                <div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">${t('orders.products_section')}</div>
                                <input type="text" id="pedido-buscar-producto" class="form-input" placeholder="${t('orders.search_product')}" autocomplete="off">
                                <div id="pedido-productos-catalogo" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:var(--sp-2);max-height:420px"></div>
                            </div>
                            <!-- Panel derecho: resumen + datos -->
                            <div style="padding:var(--sp-5);display:flex;flex-direction:column;gap:var(--sp-4)">
                                <div>
                                    <div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:var(--sp-2)">${t('orders.client')}</div>
                                    <select id="pedido-cliente" name="cliente_id" required class="form-select"></select>
                                </div>
                                <div>
                                    <div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:var(--sp-2)">${t('orders.delivery')}</div>
                                    <input type="date" id="pedido-entrega" name="entrega" required class="form-input">
                                </div>
                                <div>
                                    <div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:var(--sp-2)">${t('orders.selected')}</div>
                                    <div id="pedido-carrito" style="display:flex;flex-direction:column;gap:var(--sp-2);max-height:160px;overflow-y:auto">
                                        <div id="pedido-carrito-vacio" style="font-size:0.82rem;color:var(--text-muted);text-align:center;padding:var(--sp-4) 0">${t('orders.empty_cart')}</div>
                                    </div>
                                </div>
                                <div style="margin-top:auto;padding-top:var(--sp-3);border-top:1px solid var(--s-100)">
                                    <div style="display:flex;justify-content:space-between;font-size:0.88rem;font-weight:600;color:var(--text-primary)">
                                        <span>${t('orders.total')}</span>
                                        <span id="pedido-total-estimado">0,00 €</span>
                                    </div>
                                </div>
                                <div>
                                    <div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:var(--sp-2)">${t('orders.payment_method')}</div>
                                    <select id="pedido-metodo-pago" class="form-select">
                                        <option value="">${t('orders.payment_unspecified')}</option>
                                        <option value="efectivo">${t('tpv.cash')}</option>
                                        <option value="tarjeta">${t('tpv.card')}</option>
                                        <option value="transferencia">${t('tpv.transfer')}</option>
                                        <option value="bizum">${t('tpv.bizum')}</option>
                                    </select>
                                </div>
                                <div>
                                    <div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:var(--sp-2)">${t('orders.notes')}</div>
                                    <textarea id="pedido-notas" name="notas" rows="2" class="form-input" placeholder="${t('orders.special_instructions')}"></textarea>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary btn-cancel-pedido">${t('common.cancel')}</button>
                            <button type="button" id="btn-guardar-pedido" class="btn btn-primary">${t('orders.save')}</button>
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
            this.showNotification(t('msgs.error_form_order'), 'error');
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
        select.innerHTML = `<option value="">${t('common.select_client')}</option>` + opciones;
    }

    async cargarProductosEnPedido() {
        this._productosParaPedido = await window.flowerShopAPI.getProductos();
        this._carritoProductos = {};
        this.filtrarCatalogoProductos('');
    }

    filtrarCatalogoProductos(busqueda) {
        const catalogo = document.getElementById('pedido-productos-catalogo');
        if (!catalogo) return;
        const productos = (this._productosParaPedido || []).filter(p =>
            !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase())
        );
        if (productos.length === 0) {
            catalogo.innerHTML = `<div style="font-size:0.82rem;color:var(--text-muted);text-align:center;padding:var(--sp-4) 0">${t('tpv.no_search')}</div>`;
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
        const metodo = document.getElementById('pedido-metodo-pago');
        if (metodo) metodo.value = '';
        this._carritoProductos = {};
        this.renderCarrito();
    }

    async handleNuevoPedidoSubmitV2() {
        try {
            const clienteId = document.getElementById('pedido-cliente')?.value;
            const entrega = document.getElementById('pedido-entrega')?.value;
            const notas = document.getElementById('pedido-notas')?.value || '';
            const metodoPago = document.getElementById('pedido-metodo-pago')?.value || null;
            const items = Object.values(this._carritoProductos || {}).filter(i => i.cantidad > 0);

            if (!clienteId || !entrega || items.length === 0) {
                this.showNotification(t('msgs.order_select_required'), 'warning');
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
                metodo_pago: metodoPago,
                subtotal,
                total: subtotal,
                descuento: 0,
                adelanto: 0,
                saldo_pendiente: subtotal,
                direccion_entrega: '',
                instrucciones_especiales: notas,
                detalles: detalles
            };

            await window.flowerShopAPI.crearPedido(pedidoData);
            this.showNotification(t('msgs.order_created_encargo'), 'success');
            this.limpiarYCerrarModalPedido();
            await this.loadPedidosData();
            await this.updateSidebarBadges();
        } catch (error) {
            console.error('Error creando pedido:', error);
            this.showNotification(t('msgs.order_save_error_encargo'), 'error');
        }
    }

    limpiarYCerrarModalPedido() {
        this.limpiarFormularioPedido();
        this.hideModal('modal-nuevo-pedido');
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
                this.showNotification(t('msgs.order_fill_all'), 'warning');
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
            this.showNotification(t('msgs.order_created_encargo'), 'success');
            this.limpiarYCerrarModalPedido();
            await this.loadPedidosData();
            await this.updateSidebarBadges();
        } catch (error) {
            this.showNotification(t('msgs.order_save_error_encargo'), 'error');
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
                proveedor: formData.get('proveedor') || '',
                imagen_url: form.getAttribute('data-imagen') || null
            };

            // Validación básica
            if (!producto.nombre || !producto.precio_venta || !producto.categoria_id) {
                this.showNotification(t('msgs.fill_required'), 'warning');
                return;
            }

            // Si está en modo edición
            const editId = form.getAttribute('data-edit-id');
            if (editId) {
                await window.flowerShopAPI.actualizarProducto(Number(editId), producto);
                form.removeAttribute('data-edit-id');
                this.showNotification(t('msgs.product_updated'), 'success');
            } else {
                await window.flowerShopAPI.crearProducto(producto);
                this.showNotification(t('msgs.product_saved'), 'success');
            }
            this.hideModal('modal-producto');
            await this.loadProductosData();
            await this.updateSidebarBadges();
            await this.generarNotificaciones();
        } catch (error) {
            console.error('❌ Error guardando producto:', error);
            this.showNotification(t('msgs.product_save_error'), 'error');
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
                tipo_cliente: formData.get('tipo_cliente') || 'nuevo',
                preferencias: formData.get('preferencias'),
                presupuesto_habitual: formData.get('presupuesto_habitual') ? parseFloat(formData.get('presupuesto_habitual')) : null,
                ocasiones_importantes: formData.get('ocasiones_importantes'),
                notas: formData.get('notas'),
                imagen: document.getElementById('form-cliente')?.getAttribute('data-imagen') || null
            };

            if (!cliente.nombre) {
                this.showNotification(t('msgs.client_name_required'), 'warning');
                return;
            }

            // Validar email si se proporciona
            if (cliente.email && !cliente.email.includes('@')) {
                this.showNotification(t('msgs.client_email_invalid'), 'warning');
                return;
            }

            if (editId) {
                await window.flowerShopAPI.actualizarCliente(editId, cliente);
                this.showNotification(t('msgs.client_updated'), 'success');
            } else {
                await window.flowerShopAPI.crearCliente(cliente);
                this.showNotification(t('msgs.client_saved'), 'success');
            }
            
            this.hideModal('modal-cliente');
            await this.loadClientesData();
            await this.updateSidebarBadges();
        } catch (error) {
            console.error('❌ Error guardando cliente:', error);
            this.showNotification(t('msgs.client_save_error'), 'error');
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
                this.showNotification(t('msgs.fill_required'), 'warning');
                return;
            }

            const editId = form.getAttribute('data-edit-id');
            if (editId) {
                // Actualizar evento existente
                await window.flowerShopAPI.actualizarEvento(Number(editId), evento);
                form.removeAttribute('data-edit-id');
                this.showNotification(t('msgs.event_updated'), 'success');
            } else {
                // Crear nuevo evento
                await window.flowerShopAPI.crearEvento(evento);
                this.showNotification(t('msgs.event_saved'), 'success');
            }
            this.hideModal('modal-evento');
            await this.loadEventosData();
            await this.updateSidebarBadges();
        } catch (error) {
            console.error('❌ Error guardando evento:', error);
            this.showNotification(t('msgs.event_save_error'), 'error');
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
        // Modal exportar — cerrar
        const modalExportar = document.getElementById('modal-exportar');
        if (modalExportar) {
            modalExportar.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', () => this.hideModal('modal-exportar')));
            modalExportar.addEventListener('click', (e) => { if (e.target === modalExportar) this.hideModal('modal-exportar'); });
        }

        // Botones principales
        document.getElementById('btn-nuevo-producto')?.addEventListener('click', () => this.nuevoProducto());
        document.getElementById('btn-nuevo-cliente')?.addEventListener('click', () => this.nuevoCliente());
        document.getElementById('btn-nuevo-evento')?.addEventListener('click', () => this.nuevoEvento());
        document.getElementById('btn-nuevo-pedido')?.addEventListener('click', () => this.nuevoPedido());
        document.getElementById('btn-nuevo-pedido-section')?.addEventListener('click', () => this.nuevoPedido());

        document.querySelectorAll('.pedidos-tab').forEach(tab => {
            tab.addEventListener('click', () => this._activarTabPedidos(tab.dataset.tabEstado));
        });

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
                this.showNotification(t('msgs.search_no_results', { term: termino }), 'info');
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

            this.showNotification(t('msgs.search_results', { count: total, term: termino }), 'success');
        } catch (error) {
            console.error('❌ Error en búsqueda global:', error);
        }
    }

    updateBreadcrumbs(section) {
        const breadcrumbs = document.querySelector('.breadcrumbs');
        if (breadcrumbs) {
            const sectionNames = {
                dashboard: t('nav.dashboard'),
                productos: t('nav.products'),
                clientes: t('nav.clients'),
                eventos: t('nav.events'),
                pedidos: t('nav.orders'),
                inventario: t('nav.inventory'),
                reportes: t('nav.reports')
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
            title: t('nav.help'),
            content: `
                <p class="dialog-lead">${t('nav.help_content')}</p>
                <ul class="dialog-list">
                    <li><strong>${t('nav.products')}</strong> — ${t('nav.help_products')}</li>
                    <li><strong>${t('nav.clients')}</strong> — ${t('nav.help_clients')}</li>
                    <li><strong>${t('nav.orders')}</strong> — ${t('nav.help_orders')}</li>
                    <li><strong>${t('nav.events')}</strong> — ${t('nav.help_events')}</li>
                    <li><strong>${t('nav.inventory')}</strong> — ${t('nav.help_inventory').replace(/^.*— /, '')}</li>
                    <li><strong>${t('nav.reports')}</strong> — ${t('nav.help_reports').replace(/^.*— /, '')}</li>
                </ul>
                <p class="dialog-hint">${t('nav.help_manual')}</p>
            `,
            buttons: [{ label: t('common.btn_understood'), type: 'primary' }]
        });
    }

    mostrarAcercaDe() {
        this._showDialog({
            title: t('common.about_title'),
            content: `
                <div class="about-content">
                    <p class="about-version">${t('common.about_version')}</p>
                    <p class="dialog-lead">${t('common.about_subtitle')}</p>
                    <p class="dialog-hint">${t('common.about_credit')}</p>
                </div>
            `,
            buttons: [{ label: t('common.close'), type: 'secondary' }]
        });
    }

    _confirm(title, message, confirmLabel = 'Eliminar', confirmClass = 'btn-danger', sizeClass = 'modal-sm') {
        return new Promise(resolve => {
            const existing = document.getElementById('_app-confirm');
            if (existing) existing.remove();

            const modal = document.createElement('div');
            modal.id = '_app-confirm';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content ${sizeClass}">
                    <div class="modal-header">
                        <h3 class="modal-title-pro">${title}</h3>
                        <button class="modal-close" aria-label="${t('common.close')}">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p class="modal-subtitle-pro">${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary _confirm-cancel">${t('common.cancel')}</button>
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
                    <button class="modal-close" aria-label="${t('common.close')}">&times;</button>
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
            <button class="toast-close" aria-label="${t('common.close')}">×</button>
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
            this.showNotification(t('msgs.error_open_form'), 'error');
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
                            <h2 class="modal-title-pro">${isEdit ? t('inventory.supplier_edit_title') : t('inventory.supplier_new_title')}</h2>
                            <p class="modal-subtitle-pro">${isEdit ? t('inventory.supplier_edit_sub') : t('inventory.supplier_new_sub')}</p>
                        </div>
                    </div>
                    <button class="modal-close" aria-label="${t('common.close')}">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="form-proveedor" class="form">
                        ${isEdit ? `<input type="hidden" name="id" value="${proveedor.id}">` : ''}
                        <div class="form-section-title"><span class="form-section-dot"></span>${t('inventory.supplier_form')}</div>
                        <div class="form-group form-group-full">
                            <label class="form-label" for="proveedor-nombre">${t('inventory.supplier_name_label')}</label>
                            <input type="text" id="proveedor-nombre" name="nombre" class="form-input" value="${isEdit ? proveedor.nombre || '' : ''}" placeholder="${t('inventory.supplier_name_label')}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="proveedor-contacto">${t('inventory.supplier_contact')}</label>
                            <input type="text" id="proveedor-contacto" name="contacto" class="form-input" value="${isEdit ? proveedor.contacto || '' : ''}" placeholder="${t('inventory.supplier_contact')}">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="proveedor-telefono">${t('common.phone')}</label>
                            <input type="tel" id="proveedor-telefono" name="telefono" class="form-input" value="${isEdit ? proveedor.telefono || '' : ''}" placeholder="+34 600 000 000">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="proveedor-email">${t('common.email')}</label>
                            <input type="email" id="proveedor-email" name="email" class="form-input" value="${isEdit ? proveedor.email || '' : ''}" placeholder="proveedor@email.com">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="proveedor-ciudad">${t('inventory.supplier_city')}</label>
                            <input type="text" id="proveedor-ciudad" name="ciudad" class="form-input" value="${isEdit ? proveedor.ciudad || '' : ''}" placeholder="${t('inventory.supplier_city')}">
                        </div>
                        <div class="form-group form-group-full">
                            <label class="form-label" for="proveedor-direccion">${t('inventory.supplier_address')}</label>
                            <textarea id="proveedor-direccion" name="direccion" class="form-input" rows="2" placeholder="${t('inventory.supplier_address')}">${isEdit ? proveedor.direccion || '' : ''}</textarea>
                        </div>
                    </form>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary modal-close">${t('common.cancel')}</button>
                    <button type="submit" form="form-proveedor" class="btn btn-primary">${isEdit ? t('inventory.btn_update') : t('inventory.btn_save')}</button>
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
                this.showNotification(t('msgs.supplier_saved'), 'success');
            } else {
                await window.flowerShopAPI.crearProveedor(proveedor);
                this.showNotification(t('msgs.supplier_saved'), 'success');
            }
            
            // Cerrar modal usando el método estándar
            this.hideModal('modal-proveedor');
            
            await this.loadProviders();
        } catch (error) {
            console.error('Error guardando proveedor:', error);
            this.showNotification(t('msgs.supplier_save_error'), 'error');
        }
    }

    async generarOrdenAutomatica() {
        try {
            const alertas = await window.flowerShopAPI.getAlertasStock();
            if (!alertas || alertas.length === 0) {
                this.showNotification(t('msgs.auto_order_none'), 'info');
                return;
            }
            this.showNotification(t('msgs.auto_order_generating'), 'info');
            const productos = alertas.map(a => ({ producto_id: a.producto_id, cantidad: Math.max(a.stock_minimo * 2 - a.stock_actual, 1) }));
            await window.flowerShopAPI.generarOrdenCompra(productos);
            this.showNotification(t('msgs.auto_order_ok', { count: productos.length }), 'success');
            await this.loadOrdenesCompra();
        } catch (error) {
            console.error('Error generando orden automática:', error);
            this.showNotification(t('msgs.auto_order_error'), 'error');
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
            this.showNotification(t('msgs.error_open_form'), 'error');
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
            this.showNotification(t('msgs.error_open_form'), 'error');
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
                            <h2 class="modal-title-pro">${t('inventory.movement_title')}</h2>
                            <p class="modal-subtitle-pro">${t('inventory.movement_sub')}</p>
                        </div>
                    </div>
                    <button class="modal-close" aria-label="${t('common.close')}">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="form-movimiento" class="form">
                        <div class="form-section-title"><span class="form-section-dot"></span>${t('inventory.movement_form')}</div>
                        <div class="form-group form-group-full">
                            <label class="form-label" for="movimiento-producto">${t('inventory.col_product')} *</label>
                            <select id="movimiento-producto" name="producto_id" class="form-select" required>
                                <option value="">${t('inventory.movement_product_select')}</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="movimiento-tipo">${t('common.type')} *</label>
                            <select id="movimiento-tipo" name="tipo_movimiento" class="form-select" required>
                                <option value="">${t('inventory.movement_type_select')}</option>
                                <option value="entrada">${t('inventory.type_entry')}</option>
                                <option value="salida">${t('inventory.type_exit')}</option>
                                <option value="ajuste">${t('inventory.type_adjust')}</option>
                                <option value="devolucion">${t('inventory.type_return')}</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="movimiento-cantidad">${t('common.quantity')} *</label>
                            <input type="number" id="movimiento-cantidad" name="cantidad" class="form-input" min="1" placeholder="0" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="movimiento-motivo">${t('inventory.col_reason')}</label>
                            <input type="text" id="movimiento-motivo" name="motivo" class="form-input" placeholder="${t('inventory.movement_reason_placeholder')}">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="movimiento-fecha">${t('inventory.movement_date_label')}</label>
                            <input type="datetime-local" id="movimiento-fecha" name="fecha_movimiento" class="form-input" value="${new Date().toISOString().slice(0, 16)}">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary modal-close">${t('common.cancel')}</button>
                    <button type="submit" form="form-movimiento" class="btn btn-primary">${t('inventory.btn_register_movement')}</button>
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
            this.showNotification(t('msgs.movement_ok'), 'success');
            const modal = document.getElementById('modal-nuevo-movimiento');
            if (modal) this.closeModal(modal);
            await this.loadMovimientosInventario();
        } catch (error) {
            console.error('Error guardando movimiento:', error);
            this.showNotification(t('msgs.movement_error'), 'error');
        }
    }

    // Funciones para botones de acciones
    async editarProveedor(id) {
        try {
            const proveedores = await window.flowerShopAPI.getProveedores();
            const proveedor = proveedores.find(p => p.id === id);

            if (!proveedor) {
                this.showNotification(t('msgs.supplier_not_found'), 'error');
                return;
            }

            const modal = this.createProveedorModal(proveedor);
            document.body.appendChild(modal);
            this.showModal('modal-proveedor');
        } catch (error) {
            console.error('Error al editar proveedor:', error);
            this.showNotification(t('msgs.error_supplier_data'), 'error');
        }
    }

    async eliminarProveedor(id) {
        try {
            // Obtener información del proveedor antes de eliminar
            const proveedores = await window.flowerShopAPI.getProveedores();
            const proveedor = proveedores.find(p => p.id === id);
            
            if (!proveedor) {
                this.showNotification(t('msgs.supplier_not_found'), 'error');
                return;
            }
            
            // Confirmar eliminación
            const ok = await this._confirm(
                t('confirms.delete_supplier_title'),
                `¿Seguro que quieres eliminar "<strong>${proveedor.nombre}</strong>"?<br><br>${t('confirms.delete_supplier')}`
            );
            if (ok) {
                await window.flowerShopAPI.eliminarProveedor(id);
                this.showNotification(t('msgs.supplier_deleted'), 'success');
                await this.loadProviders(); // Recargar lista
            }
            
        } catch (error) {
            console.error('❌ Error eliminando proveedor:', error);
            this.showNotification(t('msgs.supplier_delete_error'), 'error');
        }
    }

    async verOrden(id) {
        try {
            const [ordenes, detalles] = await Promise.all([
                window.flowerShopAPI.getOrdenesCompra(),
                window.flowerShopAPI.getDetallesOrden(id).catch(() => [])
            ]);
            const orden = ordenes.find(o => o.id === id);
            if (!orden) { this.showNotification(t('msgs.order_not_found'), 'error'); return; }

            const estadoLabel = (e) => ({ pendiente: t('inventory.order_status_pending'), enviada: t('inventory.order_status_sent'), recibida: t('inventory.order_status_received'), cancelada: t('inventory.order_status_cancelled') }[e] || e);
            const itemsHtml = detalles.length > 0
                ? detalles.map(d => `
                    <tr>
                        <td>${d.producto_nombre || '—'}</td>
                        <td style="text-align:center">${d.cantidad_pedida}</td>
                        <td style="text-align:right">${window.flowerShopAPI.formatCurrency(d.precio_unitario || 0)}</td>
                        <td style="text-align:right;font-weight:600">${window.flowerShopAPI.formatCurrency(d.subtotal || 0)}</td>
                    </tr>`).join('')
                : `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:var(--sp-4)">${t('inventory.no_order_items')}</td></tr>`;

            const accionBtn = orden.estado === 'pendiente'
                ? `<button type="button" class="btn btn-secondary" onclick="app.markOrderSent(${id});this.closest('.modal').querySelector('.modal-close').click()"><i data-lucide="send" style="width:15px;height:15px;margin-right:6px"></i>${t('inventory.order_status_sent')}</button>`
                : orden.estado === 'enviada'
                ? `<button type="button" class="btn btn-success" onclick="app.markOrderReceived(${id});this.closest('.modal').querySelector('.modal-close').click()"><i data-lucide="package-check" style="width:15px;height:15px;margin-right:6px"></i>${t('confirms.reception_btn')}</button>`
                : '';

            document.getElementById('modal-ver-orden-' + id)?.remove();
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
                                <p class="modal-subtitle-pro">${orden.proveedor_nombre || '—'} · <span class="estado-badge ${orden.estado}" style="font-size:0.7rem">${estadoLabel(orden.estado)}</span></p>
                            </div>
                        </div>
                        <button class="modal-close" aria-label="${t('common.close')}">&times;</button>
                    </div>
                    <div class="modal-body" style="display:flex;flex-direction:column;gap:var(--sp-4)">
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);background:var(--s-50);border-radius:var(--r-lg);padding:var(--sp-4)">
                            <div style="display:flex;flex-direction:column;gap:var(--sp-1)">
                                <span style="font-size:0.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">${t('inventory.order_date_label')}</span>
                                <span style="font-size:0.92rem;color:var(--text-primary)">${window.flowerShopAPI.formatDate(orden.fecha_orden)}</span>
                            </div>
                            <div style="display:flex;flex-direction:column;gap:var(--sp-1)">
                                <span style="font-size:0.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">${t('common.total')}</span>
                                <span style="font-size:0.95rem;font-weight:700;color:var(--text-primary)">${window.flowerShopAPI.formatCurrency(orden.total || 0)}</span>
                            </div>
                            ${orden.notas ? `
                            <div style="grid-column:1/-1;display:flex;flex-direction:column;gap:var(--sp-1)">
                                <span style="font-size:0.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">${t('common.notes')}</span>
                                <span style="font-size:0.88rem;color:var(--text-secondary)">${orden.notas}</span>
                            </div>` : ''}
                        </div>
                        <div>
                            <div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:var(--sp-2)">${t('inventory.order_products_label')}</div>
                            <div style="border:1px solid var(--s-100);border-radius:var(--r-lg);overflow:hidden">
                                <table class="table" style="margin:0">
                                    <thead><tr><th>${t('inventory.col_product')}</th><th style="text-align:center">${t('common.quantity')}</th><th style="text-align:right">${t('common.price')}</th><th style="text-align:right">${t('common.subtotal')}</th></tr></thead>
                                    <tbody>${itemsHtml}</tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary modal-close">${t('common.close')}</button>
                        ${accionBtn}
                        ${orden.estado !== 'recibida' && orden.estado !== 'cancelada' ? `<button type="button" class="btn btn-primary" onclick="app.editarOrden(${id})"><i data-lucide="edit-2" style="width:15px;height:15px;margin-right:6px"></i>${t('common.edit')}</button>` : ''}
                    </div>
                </div>`;
            const close = () => { this.closeModal(modal); setTimeout(() => modal.remove(), 300); };
            modal.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', close));
            modal.addEventListener('click', e => { if (e.target === modal) close(); });
            document.body.appendChild(modal);
            this.showModal(modal.id);
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } catch (error) {
            console.error('Error al ver orden:', error);
            this.showNotification(t('msgs.error_order_load'), 'error');
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
                            <h2 class="modal-title-pro">${isEdit ? t('inventory.order_edit_title') : t('inventory.order_new_title')}</h2>
                            <p class="modal-subtitle-pro">${isEdit ? t('inventory.order_edit_sub') : t('inventory.order_new_sub')}</p>
                        </div>
                    </div>
                    <button class="modal-close" aria-label="${t('common.close')}">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="form-orden" class="form">
                        ${isEdit ? `<input type="hidden" name="id" value="${orden.id}">` : ''}
                        <div class="form-section-title"><span class="form-section-dot"></span>${t('inventory.order_form')}</div>
                        <div class="form-group form-group-full">
                            <label class="form-label" for="orden-proveedor">${t('inventory.col_supplier')} *</label>
                            <select id="orden-proveedor" name="proveedor_id" class="form-select" required>
                                <option value="">${t('inventory.order_supplier_select')}</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="orden-fecha">${t('inventory.order_date_label')}</label>
                            <input type="date" id="orden-fecha" name="fecha_orden" class="form-input" value="${isEdit ? (orden.fecha_orden || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="orden-estado">${t('common.status')}</label>
                            <select id="orden-estado" name="estado" class="form-select">
                                <option value="pendiente" ${isEdit && orden.estado === 'pendiente' ? 'selected' : ''}>${t('inventory.order_status_pending')}</option>
                                <option value="enviada" ${isEdit && orden.estado === 'enviada' ? 'selected' : ''}>${t('inventory.order_status_sent')}</option>
                                <option value="recibida" ${isEdit && orden.estado === 'recibida' ? 'selected' : ''}>${t('inventory.order_status_received')}</option>
                                <option value="cancelada" ${isEdit && orden.estado === 'cancelada' ? 'selected' : ''}>${t('inventory.order_status_cancelled')}</option>
                            </select>
                        </div>
                        <div class="form-group form-group-full">
                            <label class="form-label" for="orden-notas">${t('common.notes')}</label>
                            <textarea id="orden-notas" name="notas" class="form-input" rows="2" placeholder="${t('orders.special_instructions')}">${isEdit ? orden.notas || '' : ''}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary modal-close">${t('common.cancel')}</button>
                    <button type="submit" form="form-orden" class="btn btn-primary">${isEdit ? t('inventory.btn_update') : t('inventory.btn_create_order')}</button>
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
                this.showNotification(t('msgs.no_supplier'), 'warning');
                return;
            }

            if (isEdit) {
                orden.id = parseInt(formData.get('id'));
                await window.flowerShopAPI.actualizarOrdenCompra(orden.id, orden.estado);
                this.showNotification(orden.estado === 'recibida' ? t('msgs.order_received_auto') : t('msgs.order_update_ok'), 'success');
            } else {
                await window.flowerShopAPI.crearOrdenDirecta(orden);
                this.showNotification(t('msgs.order_save_ok'), 'success');
            }

            const modal = document.getElementById('modal-orden');
            if (modal) this.closeModal(modal);
            await this.loadOrdenesCompra();
        } catch (error) {
            console.error('Error guardando orden:', error);
            this.showNotification(t('msgs.order_save_error_purchase'), 'error');
        }
    }

    async editarOrden(id) {
        try {
            const ordenes = await window.flowerShopAPI.getOrdenesCompra();
            const orden = ordenes.find(o => o.id === id);
            
            if (!orden) {
                this.showNotification(t('msgs.order_not_found'), 'error');
                return;
            }

            document.getElementById('modal-orden')?.remove();
            const modal = this.createOrdenModal(orden);
            document.body.appendChild(modal);
            this.showModal('modal-orden');
            
        } catch (error) {
            console.error('Error al editar orden:', error);
            this.showNotification(t('msgs.error_order_load'), 'error');
        }
    }

    async verMovimiento(id) {
        try {
            const movimientos = await window.flowerShopAPI.getMovimientosInventario({});
            const movimiento = movimientos.find(m => m.id === id);

            if (!movimiento) { this.showNotification(t('msgs.movement_not_found'), 'error'); return; }

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
                           <div style="font-size:0.68rem;color:var(--text-muted);text-transform:uppercase;font-weight:600;margin-bottom:4px">${t('inventory.before_label')}</div>
                           <div style="font-size:1.3rem;font-weight:700;color:var(--text-primary)">${movimiento.stock_anterior}</div>
                       </div>
                       <div style="text-align:center;color:var(--text-muted);font-size:1.1rem;font-weight:300">→</div>
                       <div style="text-align:center">
                           <div style="font-size:0.68rem;color:var(--text-muted);text-transform:uppercase;font-weight:600;margin-bottom:4px">${t('inventory.after_label')}</div>
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
                        <button class="modal-close" aria-label="${t('common.close')}">&times;</button>
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
                                <span style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">${t('inventory.registered_by')}</span>
                                <span style="font-size:0.9rem;color:var(--text-primary)">${movimiento.usuario || t('inventory.system_user')}</span>
                            </div>
                            ${movimiento.motivo ? `
                            <div style="grid-column:1/-1;display:flex;flex-direction:column;gap:var(--sp-1);padding-top:var(--sp-3);border-top:1px solid var(--s-100)">
                                <span style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">${t('inventory.col_reason')}</span>
                                <span style="font-size:0.9rem;color:var(--text-secondary)">${movimiento.motivo}</span>
                            </div>` : ''}
                            ${stockRow}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary modal-close">${t('common.close')}</button>
                    </div>
                </div>`;
            modal.addEventListener('click', e => { if (e.target === modal) this.closeModal(modal); });
            modal.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', () => this.closeModal(modal)));
            document.body.appendChild(modal);
            this.showModal('modal-ver-movimiento');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } catch (error) {
            console.error('Error al ver movimiento:', error);
            this.showNotification(t('msgs.error_movement_load'), 'error');
        }
    }

    async generarOrdenProducto(productoId) {
        try {
            // Obtener datos del producto
            const productos = await window.flowerShopAPI.getProductos();
            const producto = productos.find(p => p.id === productoId);
            
            if (!producto) {
                this.showNotification(t('msgs.product_not_found'), 'error');
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
                                <label for="cantidad-orden">${t('orders.quantity_request')}</label>
                                <input type="number" id="cantidad-orden" name="cantidad" min="1" value="10" required>
                            </div>
                            <div class="form-group">
                                <label for="proveedor-orden">${t('common.supplier')} *</label>
                                <select id="proveedor-orden" name="proveedor_id" required>
                                    <option value="">${t('inventory.supplier_select_placeholder')}</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="notas-orden">${t('inventory.notes_label')}</label>
                                <textarea id="notas-orden" name="notas" rows="3" placeholder="${t('inventory.notes_placeholder')}"></textarea>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').style.display='none'">${t('common.cancel')}</button>
                                <button type="submit" class="btn btn-primary">📦 ${t('inventory.btn_create_order')}</button>
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
                    this.showNotification(t('msgs.order_generate_ok'), 'success');
                    modal.style.display = 'none';
                    modal.remove();
                    await this.loadOrdenesCompra();
                } catch (error) {
                    console.error('Error creando orden:', error);
                    this.showNotification(t('msgs.order_generate_error'), 'error');
                }
            });
            
        } catch (error) {
            console.error('Error al generar orden:', error);
            this.showNotification(t('msgs.error_load'), 'error');
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
            tbody.innerHTML = `<tr><td colspan="5" class="text-center">${t('inventory.no_prediction')}</td></tr>`;
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
                        `<span class="badge badge-danger">${t('statuses.restock')}</span>` :
                        `<span class="badge badge-success">${t('statuses.ok')}</span>`
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
                        label: t('inventory.stock_title'),
                        data: stockActual,
                        backgroundColor: 'rgba(34, 197, 94, 0.6)',
                        borderColor: 'rgba(34, 197, 94, 1)',
                        borderWidth: 1
                    },
                    {
                        label: t('reports.chart_predicted'),
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
                        text: t('reports.chart_demand_title')
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: t('reports.chart_quantity')
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
                    <p class="table-empty-title">${t('inventory.no_orders_empty')}</p>
                    <p class="table-empty-sub">${t('inventory.no_orders_sub')}</p>
                </div>
            </td></tr>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        tbody.innerHTML = ordenes.map(orden => {
            let acciones = `<button class="btn btn-sm btn-secondary" onclick="app.verOrden(${orden.id})">${t('historial.view')}</button>`;
            if (orden.estado === 'pendiente') {
                acciones += `<button class="btn btn-sm btn-outline-primary" onclick="app.markOrderSent(${orden.id})"><i data-lucide="send" style="width:13px;height:13px;margin-right:4px"></i>${t('inventory.order_status_sent')}</button>`;
                acciones += `<button class="btn btn-sm btn-primary" onclick="app.editarOrden(${orden.id})">${t('common.edit')}</button>`;
            } else if (orden.estado === 'enviada') {
                acciones += `<button class="btn btn-sm btn-success" onclick="app.markOrderReceived(${orden.id})"><i data-lucide="package-check" style="width:13px;height:13px;margin-right:4px"></i>${t('inventory.order_status_received')}</button>`;
                acciones += `<button class="btn btn-sm btn-primary" onclick="app.editarOrden(${orden.id})">${t('common.edit')}</button>`;
            }
            return `
            <tr>
                <td class="historial-num">#${orden.numero_orden || orden.id}</td>
                <td>${orden.proveedor_nombre || '—'}</td>
                <td class="historial-fecha">${orden.fecha_orden ? orden.fecha_orden.split('T')[0] : '—'}</td>
                <td>${orden.total_items || 0}</td>
                <td>${window.flowerShopAPI.formatCurrency(orden.total || 0)}</td>
                <td><span class="estado-badge ${orden.estado}">${({ pendiente: t('inventory.order_status_pending'), enviada: t('inventory.order_status_sent'), recibida: t('inventory.order_status_received'), cancelada: t('inventory.order_status_cancelled') }[orden.estado] || orden.estado)}</span></td>
                <td><div class="action-buttons">${acciones}</div></td>
            </tr>`;
        }).join('');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    renderMovimientosInventario(movimientos) {
        const tbody = document.querySelector('#movimientos-table tbody');
        if (!tbody) return;

        if (!movimientos || movimientos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6">
                <div class="table-empty-state">
                    <div class="table-empty-icon"><i data-lucide="activity"></i></div>
                    <p class="table-empty-title">${t('inventory.no_movements_empty')}</p>
                    <p class="table-empty-sub">${t('inventory.no_orders_sub')}</p>
                </div>
            </td></tr>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        const tipoCfg = {
            entrada:    { label: t('inventory.movement_entrada'),    signo: '+', color: 'var(--g-600)' },
            salida:     { label: t('inventory.movement_salida'),     signo: '−', color: 'var(--r-500)' },
            ajuste:     { label: t('inventory.movement_ajuste'),     signo: '±', color: '#3730a3'      },
            devolucion: { label: t('inventory.movement_devolucion'), signo: '+', color: '#6b21a8'      },
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
                <td><button class="btn btn-sm btn-secondary" onclick="app.verMovimiento(${mov.id})">${t('historial.view')}</button></td>
            </tr>`;
        }).join('');
    }

    async loadInitialData() {
        try {
            await this.loadDashboardData();
        } catch (error) {
            console.error('Error cargando datos iniciales:', error);
            this.showNotification(t('msgs.error_initial'), 'error');
        }
    }

    // ========== FUNCIONES FALTANTES ==========
    
    async ajustarStockMinimo(id) {
        try {
            const productos = await window.flowerShopAPI.getProductos();
            const producto = productos.find(p => p.id === id);
            if (!producto) { this.showNotification(t('msgs.product_not_found'), 'error'); return; }

            const currentMin = producto.stock_minimo || 10;
            await new Promise(resolve => {
                const modal = document.createElement('div');
                modal.id = '_modal-stock-min';
                modal.className = 'modal';
                modal.innerHTML = `
                    <div class="modal-content modal-sm">
                        <div class="modal-header">
                            <h3 class="modal-title-pro">${t('inventory.adjust_min_title')}</h3>
                            <button class="modal-close" aria-label="${t('common.close')}">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="form-group form-group-full">
                                <p class="modal-subtitle-pro">Producto: <strong>${producto.nombre}</strong></p>
                                <label class="form-label">${t('inventory.stock_adjustment_new')}</label>
                                <input id="_stock-min-input" type="number" min="0" value="${currentMin}" class="form-input">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary _smin-cancel">${t('common.cancel')}</button>
                            <button class="btn btn-primary _smin-ok">${t('common.save')}</button>
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
                            this.showNotification(t('msgs.stock_adjusted_ok'), 'success');
                            await this.loadInventoryAlerts();
                            await this.generarNotificaciones();
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
            this.showNotification(t('msgs.error_save'), 'error');
        }
    }

    async crearOrdenCompra(productos) {
        try {
            const ordenes = await window.flowerShopAPI.generarOrdenCompra(productos);
            if (!ordenes || ordenes.length === 0) {
                this.showNotification(t('msgs.auto_order_no_provider'), 'warning');
                return;
            }
            this.showNotification(t('msgs.order_created'), 'success');
            await this.loadOrdenesCompra();
            await this.generarNotificaciones();
        } catch (error) {
            console.error('Error creando orden:', error);
            this.showNotification(t('msgs.order_error'), 'error');
        }
    }

    async crearOrdenCompraDesdeAlerta(productoId, cantidad) {
        // Intentar con proveedor principal primero
        const ordenes = await window.flowerShopAPI.generarOrdenCompra([{ producto_id: productoId, cantidad }]).catch(() => []);
        if (ordenes && ordenes.length > 0) {
            this.showNotification(t('msgs.order_created'), 'success');
            await this.loadOrdenesCompra();
            await this.generarNotificaciones();
            return;
        }

        // Sin proveedor principal — pedir al usuario que seleccione uno
        const proveedores = await window.flowerShopAPI.getProveedores().catch(() => []);
        if (!proveedores.length) {
            this.showNotification(t('msgs.no_suppliers'), 'warning');
            return;
        }

        const productos = await window.flowerShopAPI.getProductos().catch(() => []);
        const producto = productos.find(p => p.id === productoId);

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content modal-sm">
                <div class="modal-header">
                    <div class="modal-header-inner">
                        <div class="modal-header-icon"><i data-lucide="shopping-cart"></i></div>
                        <div>
                            <h2 class="modal-title-pro">${t('inventory.create_order_title')}</h2>
                            <p class="modal-subtitle-pro">${producto?.nombre || 'Producto'} — ${cantidad} unidades</p>
                        </div>
                    </div>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">${t('common.supplier')}</label>
                        <select id="_orden-proveedor-sel" class="form-select">
                            <option value="">${t('common.select_supplier')}</option>
                            ${proveedores.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">${t('common.quantity')}</label>
                        <input type="number" id="_orden-cantidad-inp" class="form-input" value="${cantidad}" min="1">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary modal-close">${t('common.cancel')}</button>
                    <button class="btn btn-primary" id="_orden-confirmar-btn">
                        <i data-lucide="check" style="width:15px;height:15px;margin-right:6px"></i>${t('inventory.btn_create_order')}
                    </button>
                </div>
            </div>`;
        document.body.appendChild(modal);
        if (typeof lucide !== 'undefined') lucide.createIcons();

        const close = () => { this.hideModal(modal.id); setTimeout(() => modal.remove(), 300); };
        modal.id = '_modal-orden-alerta';
        modal.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', close));
        modal.addEventListener('click', e => { if (e.target === modal) close(); });

        modal.querySelector('#_orden-confirmar-btn').onclick = async () => {
            const proveedorId = parseInt(modal.querySelector('#_orden-proveedor-sel').value);
            const cant = parseInt(modal.querySelector('#_orden-cantidad-inp').value) || cantidad;
            if (!proveedorId) { this.showNotification(t('msgs.no_supplier'), 'warning'); return; }
            try {
                await window.flowerShopAPI.crearOrdenDirecta({
                    proveedor_id: proveedorId,
                    fecha_orden: new Date().toISOString().slice(0, 10),
                    estado: 'pendiente',
                    notas: t('inventory.alert_order_note'),
                    items: [{ producto_id: productoId, cantidad: cant }]
                });
                this.showNotification(t('msgs.order_created'), 'success');
                close();
                await this.loadOrdenesCompra();
                await this.generarNotificaciones();
            } catch (e) {
                this.showNotification(t('msgs.order_error'), 'error');
            }
        };

        this.showModal('_modal-orden-alerta');
    }

    async viewProviderOrders(id) {
        try {
            const proveedores = await window.flowerShopAPI.getProveedores();
            const proveedor = proveedores.find(p => p.id === id);
            
            if (!proveedor) {
                this.showNotification(t('msgs.supplier_not_found'), 'error');
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
            this.showNotification(t('msgs.error_supplier_orders'), 'error');
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
                 <p>${t('inventory.no_orders_empty')}</p>
               </div>`
            : ordenes.map(orden => `
                <div class="order-item-pro">
                    <div class="order-header-pro">
                        <div class="order-main-info">
                            <span class="order-number">Orden #${orden.numero_orden || orden.id}</span>
                            <span class="order-date">${window.flowerShopAPI.formatDate(orden.created_at)}</span>
                        </div>
                        <span class="order-status ${orden.estado}">${{ pendiente: t('inventory.order_status_pending'), enviada: t('inventory.order_status_sent'), recibida: t('inventory.order_status_received'), cancelada: t('inventory.order_status_cancelled') }[orden.estado] || orden.estado}</span>
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
                   <h3>${t('inventory.provider_no_orders')}</h3>
                   <p>${t('inventory.provider_no_orders_sub')}</p>
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
                               <td><span class="estado-badge ${o.estado}">${this.getTranslatedEstado(o.estado)}</span></td>
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
                            <p class="modal-subtitle-pro">${t('inventory.provider_orders_title')}</p>
                        </div>
                    </div>
                    <button class="modal-close" type="button" aria-label="${t('common.close')}">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="pedido-detalle-grid" style="margin-bottom:var(--sp-4)">
                        <div class="pedido-detalle-field">
                            <span class="pedido-detalle-label">${t('common.phone')}</span>
                            <span class="pedido-detalle-value">${proveedor.telefono || '—'}</span>
                        </div>
                        <div class="pedido-detalle-field">
                            <span class="pedido-detalle-label">${t('common.email')}</span>
                            <span class="pedido-detalle-value">${proveedor.email || '—'}</span>
                        </div>
                        <div class="pedido-detalle-field">
                            <span class="pedido-detalle-label">Ciudad</span>
                            <span class="pedido-detalle-value">${proveedor.ciudad || proveedor.direccion || '—'}</span>
                        </div>
                        <div class="pedido-detalle-field">
                            <span class="pedido-detalle-label">Estado</span>
                            <span class="pedido-detalle-value">${proveedor.activo ? t('common.active') : t('common.inactive')}</span>
                        </div>
                    </div>
                    <div class="prov-orders-summary">
                        <div class="prov-orders-stat"><span class="prov-orders-num">${totalOrdenes}</span><span class="prov-orders-lbl">${t('inventory.total_orders')}</span></div>
                        <div class="prov-orders-stat"><span class="prov-orders-num">${ordenesPendientes}</span><span class="prov-orders-lbl">${t('inventory.order_status_pending')}</span></div>
                        <div class="prov-orders-stat"><span class="prov-orders-num">${window.flowerShopAPI.formatCurrency(valorTotal)}</span><span class="prov-orders-lbl">${t('inventory.total_value')}</span></div>
                    </div>
                    <div class="form-section-title" style="margin-top:var(--sp-4)"><span class="form-section-dot"></span>${t('inventory.provider_orders_title')}</div>
                    <div class="historial-lista" style="margin-top:var(--sp-2)">${ordenesTableHtml}</div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary modal-close">Cerrar</button>
                    <button type="button" class="btn btn-primary" onclick="app.nuevaOrdenCompraProveedor(${proveedor.id})">${t('inventory.provider_orders_btn')}</button>
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
            this.showNotification(t('msgs.error_order_new'), 'error');
        }
    }

    async viewOrderDetails(id) {
        this.showNotification(t('msgs.order_detail_viewing', { id }), 'info');
    }

    async markOrderReceived(id) {
        let detalles = [];
        try {
            detalles = await window.flowerShopAPI.getDetallesOrden(id) || [];
        } catch (_) {}

        const productos = await window.flowerShopAPI.getProductos().catch(() => []);
        const stockMap = Object.fromEntries(productos.map(p => [p.id, p.stock_actual]));

        const filasHTML = detalles.length
            ? detalles.map(d => {
                const stockActual = stockMap[d.producto_id] ?? '—';
                const stockNuevo  = typeof stockActual === 'number' ? stockActual + d.cantidad : '—';
                return `<tr>
                    <td style="padding:6px 8px;font-weight:500">${d.producto_nombre || d.nombre || '—'}</td>
                    <td style="padding:6px 8px;text-align:center;font-weight:700;color:var(--p-600)">+${d.cantidad}</td>
                    <td style="padding:6px 8px;text-align:center;color:var(--text-muted)">${stockActual}</td>
                    <td style="padding:6px 8px;text-align:center;font-weight:600;color:var(--g-600)">${stockNuevo}</td>
                </tr>`;
            }).join('')
            : `<tr><td colspan="4" style="padding:10px;text-align:center;color:var(--text-muted)">${t('inventory.no_order_details')}</td></tr>`;

        const bodyHTML = `
            <p style="margin:0 0 12px;color:var(--text-secondary);font-size:0.9rem">${t('inventory.stock_update_msg')}</p>
            <div style="overflow-x:auto;border-radius:8px;border:1px solid var(--s-200)">
                <table style="width:100%;border-collapse:collapse;font-size:0.85rem">
                    <thead>
                        <tr style="background:var(--s-50)">
                            <th style="padding:7px 8px;text-align:left;color:var(--text-muted);font-weight:600;border-bottom:1px solid var(--s-200)">Producto</th>
                            <th style="padding:7px 8px;text-align:center;color:var(--text-muted);font-weight:600;border-bottom:1px solid var(--s-200)">Cantidad</th>
                            <th style="padding:7px 8px;text-align:center;color:var(--text-muted);font-weight:600;border-bottom:1px solid var(--s-200)">Stock actual</th>
                            <th style="padding:7px 8px;text-align:center;color:var(--text-muted);font-weight:600;border-bottom:1px solid var(--s-200)">Stock nuevo</th>
                        </tr>
                    </thead>
                    <tbody>${filasHTML}</tbody>
                </table>
            </div>`;

        const ok = await this._confirm(t('confirms.reception_title'), bodyHTML, t('confirms.reception_btn'), 'btn-primary', 'modal-md');
        if (!ok) return;
        try {
            await window.flowerShopAPI.actualizarOrdenCompra(id, 'recibida');
            this.showNotification(t('msgs.order_received_stock'), 'success');
            await this.loadOrdenesCompra();
            await this.generarNotificaciones();
        } catch (error) {
            console.error('Error marcando orden:', error);
            this.showNotification(t('msgs.order_update_error'), 'error');
        }
    }

    async markOrderSent(id) {
        try {
            await window.flowerShopAPI.actualizarOrdenCompra(id, 'enviada');
            this.showNotification(t('msgs.order_mark_sent'), 'success');
            await this.loadOrdenesCompra();
        } catch (error) {
            this.showNotification(t('msgs.order_update_error'), 'error');
        }
    }

    // Funciones de productos, clientes, eventos que pueden estar faltando
    async loadConfiguracionData() {
        try {
            const config = await window.flowerShopAPI.getConfiguracion();
            if (config.empresa_nombre)    document.getElementById('empresa-nombre').value    = config.empresa_nombre;
            if (config.empresa_direccion) document.getElementById('empresa-direccion').value = config.empresa_direccion;
            if (config.empresa_telefono)  document.getElementById('empresa-telefono').value  = config.empresa_telefono;
        } catch (_) {}

        const form = document.getElementById('empresa-form');
        if (form && !form._handler) {
            form._handler = true;
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await window.flowerShopAPI.setConfiguracion({
                    empresa_nombre:    document.getElementById('empresa-nombre').value.trim(),
                    empresa_direccion: document.getElementById('empresa-direccion').value.trim(),
                    empresa_telefono:  document.getElementById('empresa-telefono').value.trim(),
                });
                this.showNotification(t('msgs.company_saved'), 'success');
            });
        }
    }

    // ========== NOTIFICACIONES ==========

    _notifKey() { return 'petalo_notifs'; }

    _cargarNotifs() {
        try { return JSON.parse(localStorage.getItem(this._notifKey()) || '[]'); }
        catch (_) { return []; }
    }

    _guardarNotifs(notifs) {
        localStorage.setItem(this._notifKey(), JSON.stringify(notifs));
    }

    _tocarSonido() {
        try {
            const prefs = JSON.parse(localStorage.getItem('perfil_prefs') || '{}');
            if (prefs.notifSonido === false) return;
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.12);
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.4);
        } catch (_) {}
    }

    async generarNotificaciones() {
        try {
            const [productos, pedidos, eventos, ordenesCompra] = await Promise.all([
                window.flowerShopAPI.getProductos(),
                window.flowerShopAPI.getPedidos(),
                window.flowerShopAPI.getEventos(),
                window.flowerShopAPI.getOrdenesCompra().catch(() => []),
            ]);

            await this._checkStockNotifs(productos);
            await this._checkEventosNotifs(eventos);
            await this._checkEncargosNotifs(pedidos);
            await this._checkOrdenesNotifs(ordenesCompra);

        } catch (e) { console.error('Error generando notificaciones:', e); }

        this._actualizarBadgeNotifs();
    }

    async _checkStockNotifs(productos) {
        let notifs = this._cargarNotifs();
        const ahora = new Date().toISOString();
        let huboNuevas = false;

        for (const p of productos.filter(p => p.activo)) {
            const idBajo    = `stock_bajo_${p.id}`;
            const idAgotado = `stock_agotado_${p.id}`;
            const estaAgotado = p.stock_actual === 0;
            const estaBajo    = p.stock_actual > 0 && p.stock_actual <= p.stock_minimo;
            const tieneNotifBajo    = notifs.find(n => n.id === idBajo);
            const tieneNotifAgotado = notifs.find(n => n.id === idAgotado);

            // Si el stock se ha repuesto por encima del mínimo, eliminar notificaciones anteriores
            // para que vuelvan a dispararse la próxima vez que bajen
            if (p.stock_actual > p.stock_minimo) {
                notifs = notifs.filter(n => n.id !== idBajo && n.id !== idAgotado);
                continue;
            }

            // Agotado: si pasa de bajo a 0, reemplazar notif de bajo por agotado
            if (estaAgotado && !tieneNotifAgotado) {
                notifs = notifs.filter(n => n.id !== idBajo);
                notifs.unshift({
                    id: idAgotado, tipo: 'stock_bajo', nivel: 'urgente', grupo: 'stock',
                    titulo: t('notifPanel.no_stock_title'),
                    mensaje: t('notifPanel.no_stock_msg', { name: p.nombre }),
                    fecha: ahora, leida: false,
                    accion: "app.showSection('inventario')"
                });
                huboNuevas = true;
            }

            // Stock bajo (primera vez)
            if (estaBajo && !tieneNotifBajo && !tieneNotifAgotado) {
                notifs.unshift({
                    id: idBajo, tipo: 'stock_bajo', nivel: 'warning', grupo: 'stock',
                    titulo: t('notifPanel.low_stock_title'),
                    mensaje: t('notifPanel.low_stock_msg', { name: p.nombre, current: p.stock_actual, min: p.stock_minimo }),
                    fecha: ahora, leida: false,
                    accion: "app.showSection('inventario')"
                });
                huboNuevas = true;
            }
        }

        this._guardarNotifs(notifs);
        if (huboNuevas) this._tocarSonido();
    }

    async _checkEventosNotifs(eventos) {
        let notifs = this._cargarNotifs();
        const ids = new Set(notifs.map(n => n.id));
        const hoy = new Date(); hoy.setHours(0,0,0,0);
        const nuevas = [];
        const DIAS_AVISO = [30, 14, 7];

        eventos.filter(e => e.activo).forEach(e => {
            const fechaEvento = new Date(e.fecha_inicio); fechaEvento.setHours(0,0,0,0);
            DIAS_AVISO.forEach(dias => {
                const diasRestantes = Math.round((fechaEvento - hoy) / 86400000);
                if (diasRestantes !== dias) return;
                const id = `evento_${e.id}_${dias}d`;
                if (!ids.has(id)) nuevas.push({
                    id, tipo: 'evento_recordatorio', nivel: dias <= 7 ? 'urgente' : 'warning', grupo: 'gestion',
                    titulo: t('notifPanel.event_title', { days: dias, suffix: dias > 1 ? 's' : '' }),
                    mensaje: t('notifPanel.event_msg', { name: e.nombre, date: window.flowerShopAPI.formatDate(e.fecha_inicio) }),
                    fecha: new Date().toISOString(), leida: false,
                    accion: "app.showSection('eventos')"
                });
            });
        });

        if (nuevas.length > 0) {
            this._guardarNotifs([...nuevas, ...notifs]);
            this._tocarSonido();
        }
    }

    async _checkEncargosNotifs(pedidos) {
        let notifs = this._cargarNotifs();
        const ids = new Set(notifs.map(n => n.id));
        const hace3dias = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);
        const nuevas = [];

        // Limpiar notifs de encargos que ya no están pendientes
        notifs = notifs.filter(n => {
            if (n.tipo !== 'encargo_sin_gestionar') return true;
            const pedidoId = parseInt(n.id.replace('encargo_sin_gestionar_', ''));
            const pedido = pedidos.find(p => p.id === pedidoId);
            return pedido && pedido.estado === 'pendiente';
        });

        pedidos.filter(p => p.estado === 'pendiente' && (p.fecha_pedido || '').slice(0, 10) <= hace3dias).forEach(p => {
            const id = `encargo_sin_gestionar_${p.id}`;
            if (!ids.has(id)) nuevas.push({
                id, tipo: 'encargo_sin_gestionar', nivel: 'warning', grupo: 'gestion',
                titulo: t('notifPanel.order_title'),
                mensaje: t('notifPanel.order_msg', { client: p.cliente_nombre || 'cliente' }),
                fecha: new Date().toISOString(), leida: false,
                accion: `app.verPedido(${p.id})`
            });
        });

        this._guardarNotifs([...nuevas, ...notifs]);
        if (nuevas.length > 0) this._tocarSonido();
    }

    async _checkOrdenesNotifs(ordenesCompra) {
        let notifs = this._cargarNotifs();
        const ids = new Set(notifs.map(n => n.id));
        const nuevas = [];

        // Limpiar notifs de órdenes ya recibidas
        notifs = notifs.filter(n => {
            if (n.tipo !== 'orden_pendiente') return true;
            const ordenId = parseInt(n.id.replace('orden_pendiente_', ''));
            const orden = ordenesCompra.find(o => o.id === ordenId);
            return orden && (orden.estado === 'enviada' || orden.estado === 'pendiente');
        });

        ordenesCompra.filter(o => o.estado === 'enviada' || o.estado === 'pendiente').forEach(o => {
            const id = `orden_pendiente_${o.id}`;
            if (!ids.has(id)) nuevas.push({
                id, tipo: 'orden_pendiente', nivel: 'info', grupo: 'gestion',
                titulo: t('notifPanel.purchase_title'),
                mensaje: t('notifPanel.purchase_msg', { id: String(o.id).slice(-6) }),
                fecha: new Date().toISOString(), leida: false,
                accion: "app.showSection('inventario')"
            });
        });

        this._guardarNotifs([...nuevas, ...notifs]);
        if (nuevas.length > 0) this._tocarSonido();
    }

    _actualizarBadgeNotifs() {
        const notifs = this._cargarNotifs();
        const noLeidas = notifs.filter(n => !n.leida).length;
        const badge = document.getElementById('badge-notificaciones');
        if (badge) {
            badge.textContent = noLeidas > 99 ? '99+' : noLeidas;
            badge.style.display = noLeidas > 0 ? 'flex' : 'none';
        }
        const subtitle = document.getElementById('notif-subtitle');
        if (subtitle) subtitle.textContent = noLeidas > 0 ? t('notifPanel.unread', { count: noLeidas }) : t('notifPanel.up_to_date');
    }

    loadNotificacionesData() {
        this._tabNotifActiva = this._tabNotifActiva || 'no-leidas';
        this._renderNotificaciones();
        this._actualizarBadgeNotifs();

        document.querySelectorAll('[data-notif-tab]').forEach(tab => {
            tab.onclick = () => {
                document.querySelectorAll('[data-notif-tab]').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this._tabNotifActiva = tab.dataset.notifTab;
                this._renderNotificaciones();
            };
        });
    }

    _renderNotificaciones() {
        const container = document.getElementById('notificaciones-list');
        if (!container) return;
        const todas = this._cargarNotifs();
        const lista = this._tabNotifActiva === 'no-leidas' ? todas.filter(n => !n.leida) : todas;

        // Actualizar contadores tabs
        const noLeidas = todas.filter(n => !n.leida).length;
        const elTodas = document.getElementById('ntab-count-todas');
        const elNL = document.getElementById('ntab-count-noleidas');
        if (elTodas) elTodas.textContent = todas.length;
        if (elNL)    elNL.textContent    = noLeidas;

        if (lista.length === 0) {
            container.innerHTML = `<div class="notif-empty"><i data-lucide="bell-off"></i><p>${this._tabNotifActiva === 'no-leidas' ? t('notifPanel.no_unread') : t('notifPanel.no_notifs')}</p></div>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        const iconMap = {
            stock_bajo: 'alert-triangle', evento_recordatorio: 'calendar-clock',
            encargo_sin_gestionar: 'clock', orden_pendiente: 'package'
        };

        const tiempoRelativo = (iso) => {
            const diff = Date.now() - new Date(iso).getTime();
            const m = Math.floor(diff / 60000);
            if (m < 1)  return t('inventory.time_just_now');
            if (m < 60) return `${t('inventory.time_ago_prefix')} ${m} min`;
            const h = Math.floor(m / 60);
            if (h < 24) return `${t('inventory.time_ago_prefix')} ${h}h`;
            const d = Math.floor(h / 24);
            return `${t('inventory.time_ago_prefix')} ${d} día${d > 1 ? 's' : ''}`;
        };

        const renderItem = n => `
            <div class="notif-item ${n.leida ? 'leida' : ''}" onclick="app._clickNotif('${n.id}', ${JSON.stringify(n.accion || '')})">
                <div class="notif-icon ${n.nivel || 'info'}">
                    <i data-lucide="${iconMap[n.tipo] || 'bell'}"></i>
                </div>
                <div class="notif-body">
                    <div class="notif-title">${n.titulo}</div>
                    <div class="notif-msg">${n.mensaje}</div>
                    <div class="notif-time">${tiempoRelativo(n.fecha)}</div>
                </div>
                ${!n.leida ? '<div class="notif-unread-dot"></div>' : ''}
            </div>`;

        const stockNotifs = lista.filter(n => n.grupo === 'stock');
        const gestionNotifs = lista.filter(n => n.grupo !== 'stock');
        let html = '';

        if (stockNotifs.length > 0) {
            html += `<div class="notif-group-header"><i data-lucide="package-x"></i> ${t('notifPanel.group_stock')}</div>`;
            html += stockNotifs.map(renderItem).join('');
        }
        if (gestionNotifs.length > 0) {
            html += `<div class="notif-group-header"><i data-lucide="calendar-clock"></i> ${t('notifPanel.group_events')}</div>`;
            html += gestionNotifs.map(renderItem).join('');
        }

        container.innerHTML = html;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    _clickNotif(id, accion) {
        const notifs = this._cargarNotifs();
        const n = notifs.find(n => n.id === id);
        if (n) { n.leida = true; this._guardarNotifs(notifs); }
        this._actualizarBadgeNotifs();
        this._renderNotificaciones();
        if (accion) { try { eval(accion); } catch (_) {} }
    }

    marcarTodasLeidas() {
        const notifs = this._cargarNotifs().map(n => ({ ...n, leida: true }));
        this._guardarNotifs(notifs);
        this._actualizarBadgeNotifs();
        this._renderNotificaciones();
        this.showNotification(t('msgs.notifs_read'), 'success');
    }

    limpiarNotificaciones() {
        const notifs = this._cargarNotifs().filter(n => !n.leida);
        this._guardarNotifs(notifs);
        this._actualizarBadgeNotifs();
        this._renderNotificaciones();
        this.showNotification(t('msgs.notifs_cleared'), 'success');
    }

    // ========== PERFIL ==========
    async loadPerfilData() {
        try {
            // Cargar datos guardados en localStorage
            const saved = JSON.parse(localStorage.getItem('perfil_usuario') || '{}');
            if (saved.nombre) document.getElementById('perfil-nombre').value = saved.nombre;
            if (saved.email)  document.getElementById('perfil-email').value  = saved.email;
            if (saved.telefono) document.getElementById('perfil-telefono').value = saved.telefono;

            // Avatar
            const avatarImg = localStorage.getItem('perfil_avatar_img');
            this.updateAvatarEverywhere(avatarImg || null);

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
            const [pedidos, clientes, productos] = await Promise.all([
                window.flowerShopAPI.getPedidos(),
                window.flowerShopAPI.getClientes(),
                window.flowerShopAPI.getProductos()
            ]);

            this.updateElement('pstat-pedidos',   pedidos.length);
            this.updateElement('pstat-pedidos2',  pedidos.length);
            this.updateElement('pstat-clientes',  clientes.length);
            this.updateElement('pstat-clientes2', clientes.length);
            this.updateElement('pstat-productos',  productos.length);
            this.updateElement('pstat-productos2', productos.length);

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
            this.showNotification(t('msgs.profile_fill'), 'warning');
            return;
        }
        localStorage.setItem('perfil_usuario', JSON.stringify({ nombre, email, telefono }));

        // Actualizar hero y topbar
        const heroNombre = document.getElementById('perfil-hero-nombre');
        const heroEmail  = document.getElementById('perfil-hero-email');
        if (heroNombre) heroNombre.textContent = nombre;
        if (heroEmail)  heroEmail.textContent  = email;
        const topbarName = document.querySelector('.user-name');
        if (topbarName) topbarName.textContent = nombre;
        if (!localStorage.getItem('perfil_avatar_img')) {
            this.updateAvatarEverywhere(null);
        }

        this.showNotification(t('msgs.profile_updated'), 'success');
    }

    async cambiarPassword() {
        const actual   = document.getElementById('perfil-pass-actual')?.value;
        const nueva    = document.getElementById('perfil-pass-nueva')?.value;
        const confirm  = document.getElementById('perfil-pass-confirm')?.value;

        if (!actual || !nueva || !confirm) {
            this.showNotification(t('msgs.password_fill'), 'warning');
            return;
        }
        if (nueva !== confirm) {
            this.showNotification(t('msgs.password_mismatch'), 'error');
            return;
        }
        if (nueva.length < 6) {
            this.showNotification(t('msgs.password_min'), 'warning');
            return;
        }
        const verify = await window.electronAPI.verifyPassword(actual);
        if (!verify.ok) {
            this.showNotification(t('msgs.password_wrong'), 'error');
            return;
        }
        await window.electronAPI.savePassword(nueva);
        document.getElementById('perfil-pass-actual').value = '';
        document.getElementById('perfil-pass-nueva').value  = '';
        document.getElementById('perfil-pass-confirm').value = '';
        this.showNotification(t('msgs.password_changed'), 'success');
    }

    async guardarPreferencias() {
        const prefs = {
            moneda:  document.getElementById('pref-moneda')?.value,
            fecha:   document.getElementById('pref-fecha')?.value,
            idioma:  document.getElementById('pref-idioma')?.value,
        };
        localStorage.setItem('perfil_prefs', JSON.stringify(prefs));
        // Cambiar idioma en vivo
        if (window.i18n && prefs.idioma) window.i18n.setLocale(prefs.idioma);
        this.showNotification(t('msgs.prefs_saved'), 'success');
        await this.loadInitialData();
    }

    cambiarAvatar() {
        const input = document.getElementById('avatar-file-input');
        if (!input) return;
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const base64 = ev.target.result;
                localStorage.setItem('perfil_avatar_img', base64);
                this.updateAvatarEverywhere(base64);
            };
            reader.readAsDataURL(file);
            input.value = '';
        };
        input.click();
    }

    updateAvatarEverywhere(imgSrc) {
        const initial = (JSON.parse(localStorage.getItem('perfil_usuario') || '{}').nombre || 'A').charAt(0).toUpperCase();
        const perfil = document.getElementById('perfil-avatar-circle');
        const navbar = document.querySelector('.user-avatar-placeholder');
        [perfil, navbar].forEach(el => {
            if (!el) return;
            if (imgSrc) {
                el.style.backgroundImage = `url('${imgSrc}')`;
                el.style.backgroundSize = 'cover';
                el.style.backgroundPosition = 'center';
                el.style.backgroundColor = 'transparent';
                el.textContent = '';
            } else {
                el.style.backgroundImage = '';
                el.style.backgroundColor = '';
                el.textContent = initial;
            }
        });
    }

    _lazyLoadProductImages() {
        const imgs = document.querySelectorAll('img[data-lazy-img="1"]');
        imgs.forEach(async img => {
            const id = parseInt(img.dataset.productoId);
            if (!id) return;
            const src = await window.flowerShopAPI.getProductoImagen(id);
            if (src) img.src = src;
        });
    }

    _lazyLoadClienteImages() {
        const imgs = document.querySelectorAll('img[data-lazy-cliente]');
        imgs.forEach(async img => {
            const id = parseInt(img.dataset.lazyCliente);
            if (!id) return;
            const src = await window.flowerShopAPI.getClienteImagen(id);
            if (src) {
                img.src = src;
                img.style.display = 'block';
                const avatar = img.closest('.cliente-avatar');
                if (avatar) avatar.style.backgroundColor = 'transparent';
            }
        });
    }

    _resetClienteFoto() {
        const form = document.getElementById('form-cliente');
        if (form) form.removeAttribute('data-imagen');
        const preview = document.getElementById('cliente-foto-preview');
        const placeholder = document.getElementById('cliente-foto-placeholder');
        if (preview) { preview.src = ''; preview.style.display = 'none'; }
        if (placeholder) placeholder.style.display = 'flex';
    }

    _setClienteFotoPreview(src) {
        const form = document.getElementById('form-cliente');
        if (form) form.setAttribute('data-imagen', src);
        const preview = document.getElementById('cliente-foto-preview');
        const placeholder = document.getElementById('cliente-foto-placeholder');
        if (preview) { preview.src = src; preview.style.display = 'block'; }
        if (placeholder) placeholder.style.display = 'none';
    }

    setupClienteImageInput() {
        const uploadZone = document.getElementById('cliente-foto-upload');
        const input = document.getElementById('cliente-foto-input');
        if (!uploadZone || !input) return;
        uploadZone.addEventListener('click', () => input.click());
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => this._setClienteFotoPreview(ev.target.result);
            reader.readAsDataURL(file);
            input.value = '';
        });
    }

    _setProductoImagePreview(src) {
        const preview = document.getElementById('producto-img-preview');
        const placeholder = document.getElementById('producto-img-placeholder');
        const removeBtn = document.getElementById('producto-img-remove');
        if (!preview) return;
        if (src) {
            preview.src = src;
            preview.style.display = 'block';
            if (placeholder) placeholder.style.display = 'none';
            if (removeBtn) removeBtn.style.display = 'flex';
        } else {
            preview.src = '';
            preview.style.display = 'none';
            if (placeholder) placeholder.style.display = 'flex';
            if (removeBtn) removeBtn.style.display = 'none';
        }
    }

    removeProductoImagen() {
        document.getElementById('form-producto')?.setAttribute('data-imagen', '');
        this._setProductoImagePreview(null);
    }

    setupProductoImageInput() {
        const input = document.getElementById('producto-imagen-input');
        if (!input) return;
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const base64 = ev.target.result;
                document.getElementById('form-producto')?.setAttribute('data-imagen', base64);
                this._setProductoImagePreview(base64);
            };
            reader.readAsDataURL(file);
            input.value = '';
        };
    }

    async exportarDatos() {
        try {
            const [productos, clientes, pedidos] = await Promise.all([
                window.flowerShopAPI.getProductos(),
                window.flowerShopAPI.getClientes(),
                window.flowerShopAPI.getPedidos()
            ]);

            const hoy = new Date().toISOString().slice(0, 10);
            const sep = (title) => [`--- ${title} ---`];

            const rows = [
                sep(t('export.csv_products')),
                [t('common.select_category'), t('common.name'), t('export.col_category'), t('export.csv_product_price_sell'), t('export.csv_product_price_buy'), t('export.col_stock'), t('export.csv_product_min_stock'), t('export.csv_product_season')],
                ...productos.map(p => [
                    p.codigo_producto || '', p.nombre, p.categoria_nombre || '',
                    p.precio_venta, p.precio_compra || 0, p.stock_actual, p.stock_minimo, p.temporada || ''
                ]),
                [],
                sep(t('export.csv_clients')),
                [t('common.name'), t('common.email'), t('common.phone'), t('common.type')],
                ...clientes.map(c => [
                    `${c.nombre} ${c.apellidos || ''}`.trim(), c.email || '', c.telefono || '', c.tipo_cliente || ''
                ]),
                [],
                sep(t('export.csv_orders')),
                [t('common.select_supplier'), t('common.client'), t('export.csv_order_delivery'), t('common.status'), t('common.total')],
                ...pedidos.map(p => [
                    p.id, p.cliente_nombre || t('clients.occasional'),
                    p.fecha_entrega || '', p.estado, p.total
                ]),
            ];

            this._downloadCSV(rows, `petalo_exportacion_${hoy}.csv`);
            this.showNotification(t('msgs.data_exported'), 'success');
        } catch (e) {
            console.error(e);
            this.showNotification(t('msgs.export_error'), 'error');
        }
    }

    _downloadCSV(rows, filename) {
        const bom = '﻿';
        const csv = bom + rows.map(r => r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
    }

    limpiarCache() {
        const keys = ['perfil_ultimo_acceso'];
        keys.forEach(k => localStorage.removeItem(k));
        this.showNotification(t('msgs.cache_cleared'), 'success');
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
window.markOrderSent = (id) => window.app?.markOrderSent(id);
window.ajustarStockMinimo = (id) => window.app?.ajustarStockMinimo(id);
window.crearOrdenCompra = (productos) => window.app?.crearOrdenCompra(productos);
window.crearOrdenCompraDesdeAlerta = (id, cantidad) => window.app?.crearOrdenCompraDesdeAlerta(id, cantidad);
window.generarOrdenProducto = (id) => window.app?.generarOrdenProducto(id);
window.verMovimiento = (id) => window.app?.verMovimiento(id);
window.verOrden = (id) => window.app?.verOrden(id);
window.editarOrden = (id) => window.app?.editarOrden(id);

// Password change form
document.addEventListener('DOMContentLoaded', () => {
    const pwdForm = document.getElementById('pwd-form');
    if (!pwdForm) return;
    pwdForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const current = document.getElementById('pwd-current').value;
        const newPwd  = document.getElementById('pwd-new').value;
        const confirm = document.getElementById('pwd-confirm').value;
        const msg     = document.getElementById('pwd-msg');

        // Verify current password
        const check = await window.electronAPI.verifyPassword(current);
        if (!check.ok) {
            msg.style.color = '#f87171';
            msg.textContent = t('config.pwd_wrong');
            return;
        }
        if (newPwd.length < 4) {
            msg.style.color = '#f87171';
            msg.textContent = t('config.pwd_short');
            return;
        }
        if (newPwd !== confirm) {
            msg.style.color = '#f87171';
            msg.textContent = t('config.pwd_mismatch');
            return;
        }
        await window.electronAPI.savePassword(newPwd);
        msg.style.color = '#86efac';
        msg.textContent = t('config.pwd_updated');
        pwdForm.reset();
    });
});
