const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras al renderer process
contextBridge.exposeInMainWorld('flowerShopAPI', {
    // Métodos de consulta
    getProductos: () => ipcRenderer.invoke('get-productos'),
    getClientes: () => ipcRenderer.invoke('get-clientes'),
    getEventos: () => ipcRenderer.invoke('get-eventos'),
    getPedidos: () => ipcRenderer.invoke('get-pedidos'),
    getEstadisticas: () => ipcRenderer.invoke('get-estadisticas'),
    
    // Métodos de creación
    crearProducto: (producto) => ipcRenderer.invoke('crear-producto', producto),
    crearCliente: (cliente) => ipcRenderer.invoke('crear-cliente', cliente),
    crearEvento: (evento) => ipcRenderer.invoke('crear-evento', evento),
    crearPedido: (pedido) => ipcRenderer.invoke('crear-pedido', pedido),
    
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
        }).format(amount);
    },
    
    formatDate: (date) => {
        return new Intl.DateTimeFormat('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(new Date(date));
    },
    
    formatDateTime: (date) => {
        return new Intl.DateTimeFormat('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    }
});
