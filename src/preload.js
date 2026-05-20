const { contextBridge, ipcRenderer } = require('electron');

// License API — usada por activation.html
contextBridge.exposeInMainWorld('electronAPI', {
    licenseActivate:     (key) => ipcRenderer.invoke('license-activate', key),
    licenseCheck:        ()    => ipcRenderer.invoke('license-check'),
    licenseInfo:         ()    => ipcRenderer.invoke('license-info'),
    activationSuccess:   ()    => ipcRenderer.invoke('activation-success'),
    openExternal:        (url) => ipcRenderer.invoke('open-external', url),
    onActivationReason:  (cb)  => ipcRenderer.on('activation-reason', (_e, r) => cb(r)),
    onActivationIcon:    (cb)  => ipcRenderer.on('activation-icon', (_e, p) => cb(p)),
    loginAttempt:        (pwd) => ipcRenderer.invoke('login-attempt', pwd),
    verifyPassword:      (pwd) => ipcRenderer.invoke('verify-password', pwd),
    savePassword:        (pwd) => ipcRenderer.invoke('save-password', pwd),
});

// Exponer APIs seguras al renderer process
contextBridge.exposeInMainWorld('flowerShopAPI', {
    // Configuración
    getConfiguracion: () => ipcRenderer.invoke('get-configuracion'),
    setConfiguracion: (datos) => ipcRenderer.invoke('set-configuracion', datos),

    // Tipos de cliente
    getTiposCliente: () => ipcRenderer.invoke('get-tipos-cliente'),
    crearTipoCliente: (tipo) => ipcRenderer.invoke('crear-tipo-cliente', tipo),
    actualizarTipoCliente: (id, tipo) => ipcRenderer.invoke('actualizar-tipo-cliente', id, tipo),
    eliminarTipoCliente: (id) => ipcRenderer.invoke('eliminar-tipo-cliente', id),
    getTiposEvento: () => ipcRenderer.invoke('get-tipos-evento'),
    crearTipoEvento: (tipo) => ipcRenderer.invoke('crear-tipo-evento', tipo),
    actualizarTipoEvento: (id, tipo) => ipcRenderer.invoke('actualizar-tipo-evento', id, tipo),
    eliminarTipoEvento: (id) => ipcRenderer.invoke('eliminar-tipo-evento', id),

    // Métodos de consulta
    getProductos: () => ipcRenderer.invoke('get-productos'),
    getClientes: () => ipcRenderer.invoke('get-clientes'),
    getEventos: () => ipcRenderer.invoke('get-eventos'),
    getPedidos: () => ipcRenderer.invoke('get-pedidos'),
    getDetallesPedido: (pedidoId) => ipcRenderer.invoke('get-detalles-pedido', pedidoId),
    getEstadisticas: () => ipcRenderer.invoke('get-estadisticas'),
    getCategorias: () => ipcRenderer.invoke('get-categorias'),
    crearCategoria: (categoria) => ipcRenderer.invoke('crear-categoria', categoria),
    actualizarCategoria: (id, categoria) => ipcRenderer.invoke('actualizar-categoria', id, categoria),
    eliminarCategoria: (id) => ipcRenderer.invoke('eliminar-categoria', id),
    
    // Métodos de creación
    getProductoImagen: (id) => ipcRenderer.invoke('get-producto-imagen', id),
    getClienteImagen:  (id) => ipcRenderer.invoke('get-cliente-imagen', id),
    crearProducto: (producto) => ipcRenderer.invoke('crear-producto', producto),
    crearCliente: (cliente) => ipcRenderer.invoke('crear-cliente', cliente),
    crearEvento: (evento) => ipcRenderer.invoke('crear-evento', evento),
    crearPedido: (pedido) => ipcRenderer.invoke('crear-pedido', pedido),
    
    // Métodos de actualización
    actualizarProducto: (id, producto) => ipcRenderer.invoke('actualizar-producto', id, producto),
    actualizarCliente: (id, cliente) => ipcRenderer.invoke('actualizar-cliente', id, cliente),
    actualizarEvento: (id, evento) => ipcRenderer.invoke('actualizar-evento', id, evento),
    
    // Métodos de estado de pedidos
    actualizarEstadoPedido: (id, estado) => ipcRenderer.invoke('actualizar-estado-pedido', id, estado),

    // Métodos de eliminación
    eliminarProducto: (id) => ipcRenderer.invoke('eliminar-producto', id),
    eliminarCliente: (id) => ipcRenderer.invoke('eliminar-cliente', id),
    eliminarEvento: (id) => ipcRenderer.invoke('eliminar-evento', id),
    
    // Métodos de reportes
    getReportesVentas: (dias) => ipcRenderer.invoke('get-reportes-ventas', dias),
    getProductosTopVentas: (limite, dias) => ipcRenderer.invoke('get-productos-top-ventas', limite, dias),
    getEstadosPedidos: () => ipcRenderer.invoke('get-estados-pedidos'),
    getClientesPorTipo: () => ipcRenderer.invoke('get-clientes-por-tipo'),
    getEventosRentables: (limite, dias) => ipcRenderer.invoke('get-eventos-rentables', limite, dias),
    getRotacionInventario: () => ipcRenderer.invoke('get-rotacion-inventario'),
    getDetalleVentas: (dias, busqueda, limite) => ipcRenderer.invoke('get-detalle-ventas', dias, busqueda, limite),
    
    // Métodos de inventario avanzado
    getAlertasStock: () => ipcRenderer.invoke('get-alertas-stock'),
    getPrediccionDemanda: (productoId, dias) => ipcRenderer.invoke('get-prediccion-demanda', productoId, dias),
    getProveedores: () => ipcRenderer.invoke('get-proveedores'),
    crearProveedor: (proveedor) => ipcRenderer.invoke('crear-proveedor', proveedor),
    actualizarProveedor: (id, proveedor) => ipcRenderer.invoke('actualizar-proveedor', id, proveedor),
    eliminarProveedor: (id) => ipcRenderer.invoke('eliminar-proveedor', id),
    getProductosVencimiento: (dias) => ipcRenderer.invoke('get-productos-vencimiento', dias),
    generarOrdenCompra: (productos) => ipcRenderer.invoke('generar-orden-compra', productos),
    crearOrdenDirecta: (orden) => ipcRenderer.invoke('crear-orden-directa', orden),
    getOrdenesCompra: () => ipcRenderer.invoke('get-ordenes-compra'),
    getOrdenesCompraByProveedor: (proveedorId) => ipcRenderer.invoke('get-ordenes-compra-by-proveedor', proveedorId),
    actualizarOrdenCompra: (id, estado) => ipcRenderer.invoke('actualizar-orden-compra', id, estado),
    getDetallesOrden: (ordenId) => ipcRenderer.invoke('get-detalles-orden', ordenId),
    getAnalisisInventario: () => ipcRenderer.invoke('get-analisis-inventario'),
    actualizarStockMinimo: (productoId, stockMinimo) => ipcRenderer.invoke('actualizar-stock-minimo', productoId, stockMinimo),
    registrarMovimientoInventario: (movimiento) => ipcRenderer.invoke('registrar-movimiento-inventario', movimiento),
    getMovimientosInventario: (filtros) => ipcRenderer.invoke('get-movimientos-inventario', filtros),
    
    // Eventos del menú
    onMenuAction: (callback) => {
        ipcRenderer.on('menu-action', (event, action) => {
            callback(action);
        });
    },
    
    // Utilidades
    formatCurrency: (amount) => {
        const prefs = JSON.parse(localStorage.getItem('perfil_prefs') || '{}');
        const currency = prefs.moneda || 'EUR';
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: currency
        }).format(amount || 0);
    },
    
    formatDate: (date) => {
        if (!date) return 'N/A';
        return new Intl.DateTimeFormat('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(new Date(date));
    },
    
    formatDateTime: (date) => {
        if (!date) return 'N/A';
        return new Intl.DateTimeFormat('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    }
});
