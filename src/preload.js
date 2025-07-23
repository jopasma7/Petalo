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
