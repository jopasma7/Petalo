const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const FlowerShopDatabase = require('./src/database/database');

// Variables globales
let mainWindow;
let dbManager;

// Función para crear la ventana principal
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        icon: path.join(__dirname, 'assets', 'icon.png'), // Opcional: agregar icono
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'src', 'preload.js')
        },
        show: false
    });
    
    // Cargar la página principal
    mainWindow.loadFile(path.join(__dirname, 'src', 'views', 'index.html'));

    // Mostrar ventana cuando esté lista
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
    });

    // Evento cuando se cierra la ventana
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Habilitar DevTools en desarrollo
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }
}

// Crear menú de la aplicación
function createMenu() {
    const template = [
        {
            label: 'Archivo',
            submenu: [
                {
                    label: 'Nuevo Pedido',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'nuevo-pedido');
                    }
                },
                {
                    label: 'Nuevo Cliente',
                    accelerator: 'CmdOrCtrl+Shift+N',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'nuevo-cliente');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Exportar Datos',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'exportar');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Salir',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Gestión',
            submenu: [
                {
                    label: 'Productos',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'productos');
                    }
                },
                {
                    label: 'Clientes',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'clientes');
                    }
                },
                {
                    label: 'Eventos',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'eventos');
                    }
                },
                {
                    label: 'Pedidos',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'pedidos');
                    }
                }
            ]
        },
        {
            label: 'Reportes',
            submenu: [
                {
                    label: 'Ventas',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'reportes-ventas');
                    }
                },
                {
                    label: 'Inventario',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'reportes-inventario');
                    }
                },
                {
                    label: 'Eventos',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'reportes-eventos');
                    }
                }
            ]
        },
        {
            label: 'Ayuda',
            submenu: [
                {
                    label: 'Manual de Usuario',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'ayuda');
                    }
                },
                {
                    label: 'Acerca de',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'acerca-de');
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// Manejadores IPC para comunicación con el renderer
ipcMain.handle('get-productos', async () => {
    try {
        return await dbManager.getProductos();
    } catch (error) {
        console.error('Error obteniendo productos:', error);
        throw error;
    }
});

ipcMain.handle('get-clientes', async () => {
    try {
        return await dbManager.getClientes();
    } catch (error) {
        console.error('Error obteniendo clientes:', error);
        throw error;
    }
});

ipcMain.handle('get-eventos', async () => {
    try {
        return await dbManager.getEventos();
    } catch (error) {
        console.error('Error obteniendo eventos:', error);
        throw error;
    }
});

ipcMain.handle('get-pedidos', async () => {
    try {
        return await dbManager.getPedidos();
    } catch (error) {
        console.error('Error obteniendo pedidos:', error);
        throw error;
    }
});

ipcMain.handle('get-estadisticas', async () => {
    try {
        return await dbManager.getEstadisticasGenerales();
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        throw error;
    }
});

ipcMain.handle('crear-producto', async (event, producto) => {
    try {
        const result = await dbManager.runQuery(
            `INSERT INTO productos (nombre, categoria_id, descripcion, precio_compra, precio_venta, 
             stock_actual, stock_minimo, unidad_medida, temporada, perecedero, dias_caducidad, 
             proveedor, codigo_producto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [producto.nombre, producto.categoria_id, producto.descripcion, producto.precio_compra,
             producto.precio_venta, producto.stock_actual, producto.stock_minimo, producto.unidad_medida,
             producto.temporada, producto.perecedero, producto.dias_caducidad, producto.proveedor,
             producto.codigo_producto]
        );
        return result;
    } catch (error) {
        console.error('Error creando producto:', error);
        throw error;
    }
});

ipcMain.handle('crear-cliente', async (event, cliente) => {
    try {
        const result = await dbManager.runQuery(
            `INSERT INTO clientes (nombre, apellidos, telefono, email, direccion, fecha_nacimiento, 
             tipo_cliente, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [cliente.nombre, cliente.apellidos, cliente.telefono, cliente.email, cliente.direccion,
             cliente.fecha_nacimiento, cliente.tipo_cliente, cliente.notas]
        );
        return result;
    } catch (error) {
        console.error('Error creando cliente:', error);
        throw error;
    }
});

ipcMain.handle('crear-evento', async (event, evento) => {
    try {
        const result = await dbManager.runQuery(
            `INSERT INTO eventos (nombre, descripcion, fecha_inicio, fecha_fin, tipo_evento, 
             demanda_esperada, descuento_especial, preparacion_dias, notas) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [evento.nombre, evento.descripcion, evento.fecha_inicio, evento.fecha_fin,
             evento.tipo_evento, evento.demanda_esperada, evento.descuento_especial,
             evento.preparacion_dias, evento.notas]
        );
        return result;
    } catch (error) {
        console.error('Error creando evento:', error);
        throw error;
    }
});

ipcMain.handle('crear-pedido', async (event, pedido) => {
    try {
        // Generar número de pedido único
        const numeroPedido = `FL${Date.now()}`;
        
        const result = await dbManager.runQuery(
            `INSERT INTO pedidos (numero_pedido, cliente_id, evento_id, fecha_entrega, estado, 
             tipo_pedido, subtotal, descuento, total, adelanto, saldo_pendiente, metodo_pago, 
             direccion_entrega, instrucciones_especiales, notas) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [numeroPedido, pedido.cliente_id, pedido.evento_id, pedido.fecha_entrega, pedido.estado,
             pedido.tipo_pedido, pedido.subtotal, pedido.descuento, pedido.total, pedido.adelanto,
             pedido.saldo_pendiente, pedido.metodo_pago, pedido.direccion_entrega,
             pedido.instrucciones_especiales, pedido.notas]
        );
        
        // Insertar detalles del pedido
        if (pedido.detalles && pedido.detalles.length > 0) {
            for (const detalle of pedido.detalles) {
                await dbManager.runQuery(
                    `INSERT INTO pedido_detalles (pedido_id, producto_id, cantidad, precio_unitario, 
                     subtotal, personalizacion) VALUES (?, ?, ?, ?, ?, ?)`,
                    [result.id, detalle.producto_id, detalle.cantidad, detalle.precio_unitario,
                     detalle.subtotal, detalle.personalizacion]
                );
            }
        }
        
        return { ...result, numero_pedido: numeroPedido };
    } catch (error) {
        console.error('Error creando pedido:', error);
        throw error;
    }
});

// Eventos de la aplicación
app.whenReady().then(async () => {
    // Inicializar base de datos
    dbManager = new FlowerShopDatabase();
    try {
        await dbManager.connect();
        await dbManager.insertSampleData();
    } catch (error) {
        console.error('Error inicializando base de datos:', error);
    }

    createMainWindow();
    createMenu();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    if (dbManager) {
        dbManager.close();
    }
});
