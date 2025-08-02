const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras al renderer process
contextBridge.exposeInMainWorld('flowerShopAPI', {
    // Métodos de consulta
    getProductos: () => ipcRenderer.invoke('get-productos'),
    getClientes: () => ipcRenderer.invoke('get-clientes'),
    getEventos: () => ipcRenderer.invoke('get-eventos'),
    getPedidos: () => ipcRenderer.invoke('get-pedidos'),
    getEstadisticas: () => ipcRenderer.invoke('get-estadisticas'),
    getCategorias: () => ipcRenderer.invoke('get-categorias'),
    
    // Métodos de creación
    crearProducto: (producto) => ipcRenderer.invoke('crear-producto', producto),
    crearCliente: (cliente) => ipcRenderer.invoke('crear-cliente', cliente),
    crearEvento: (evento) => ipcRenderer.invoke('crear-evento', evento),
    crearPedido: (pedido) => ipcRenderer.invoke('crear-pedido', pedido),
    
    // Métodos de actualización
    actualizarProducto: (id, producto) => ipcRenderer.invoke('actualizar-producto', id, producto),
    actualizarCliente: (id, cliente) => ipcRenderer.invoke('actualizar-cliente', id, cliente),
    actualizarEvento: (id, evento) => ipcRenderer.invoke('actualizar-evento', id, evento),
    
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
    getOrdenesCompra: () => ipcRenderer.invoke('get-ordenes-compra'),
    getOrdenesCompraByProveedor: (proveedorId) => ipcRenderer.invoke('get-ordenes-compra-by-proveedor', proveedorId),
    actualizarOrdenCompra: (id, estado) => ipcRenderer.invoke('actualizar-orden-compra', id, estado),
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
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
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
