const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const FlowerShopDatabase = require('./src/database/database');

// Variables globales
let mainWindow;
let dbManager;

// Función para crear la ventana principal
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1800,
        height: 900,
        minWidth: 1200,
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

    // Habilitar DevTools siempre
    mainWindow.webContents.openDevTools();
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

ipcMain.handle('get-categorias', async () => {
    try {
        return await dbManager.allQuery('SELECT * FROM categorias ORDER BY nombre');
    } catch (error) {
        console.error('Error obteniendo categorías:', error);
        throw error;
    }
});

// Métodos de actualización
ipcMain.handle('actualizar-producto', async (event, id, producto) => {
    try {
        const result = await dbManager.runQuery(
            `UPDATE productos SET nombre=?, categoria_id=?, descripcion=?, precio_compra=?, 
             precio_venta=?, stock_actual=?, stock_minimo=?, unidad_medida=?, temporada=?, 
             perecedero=?, dias_caducidad=?, proveedor=?, codigo_producto=?, updated_at=CURRENT_TIMESTAMP 
             WHERE id=?`,
            [producto.nombre, producto.categoria_id, producto.descripcion, producto.precio_compra,
             producto.precio_venta, producto.stock_actual, producto.stock_minimo, producto.unidad_medida,
             producto.temporada, producto.perecedero, producto.dias_caducidad, producto.proveedor,
             producto.codigo_producto, id]
        );
        return result;
    } catch (error) {
        console.error('Error actualizando producto:', error);
        throw error;
    }
});

ipcMain.handle('actualizar-cliente', async (event, id, cliente) => {
    try {
        // Dividir el nombre completo en nombre y apellidos
        const nombreCompleto = cliente.nombre || '';
        const partes = nombreCompleto.trim().split(' ');
        const nombre = partes[0] || '';
        const apellidos = partes.slice(1).join(' ') || '';
        
        const result = await dbManager.runQuery(
            `UPDATE clientes SET nombre=?, apellidos=?, telefono=?, email=?, direccion=?, 
             fecha_nacimiento=?, tipo_cliente=?, notas=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
            [nombre, apellidos, cliente.telefono, cliente.email, cliente.direccion,
             cliente.fecha_nacimiento, cliente.tipo_cliente, cliente.notas, id]
        );
        return result;
    } catch (error) {
        console.error('Error actualizando cliente:', error);
        throw error;
    }
});

ipcMain.handle('actualizar-evento', async (event, id, evento) => {
    try {
        const result = await dbManager.runQuery(
            `UPDATE eventos SET nombre=?, descripcion=?, fecha_inicio=?, fecha_fin=?, tipo_evento=?, 
             demanda_esperada=?, descuento_especial=?, preparacion_dias=?, notas=?, updated_at=CURRENT_TIMESTAMP 
             WHERE id=?`,
            [evento.nombre, evento.descripcion, evento.fecha_inicio, evento.fecha_fin,
             evento.tipo_evento, evento.demanda_esperada, evento.descuento_especial,
             evento.preparacion_dias, evento.notas, id]
        );
        return result;
    } catch (error) {
        console.error('Error actualizando evento:', error);
        throw error;
    }
});

// Métodos de eliminación
ipcMain.handle('eliminar-producto', async (event, id) => {
    try {
        const result = await dbManager.runQuery(
            'UPDATE productos SET activo = FALSE WHERE id = ?',
            [id]
        );
        return result;
    } catch (error) {
        console.error('Error eliminando producto:', error);
        throw error;
    }
});

ipcMain.handle('eliminar-cliente', async (event, id) => {
    try {
        const result = await dbManager.runQuery(
            'UPDATE clientes SET activo = FALSE WHERE id = ?',
            [id]
        );
        return result;
    } catch (error) {
        console.error('Error eliminando cliente:', error);
        throw error;
    }
});

ipcMain.handle('eliminar-evento', async (event, id) => {
    try {
        const result = await dbManager.runQuery(
            'UPDATE eventos SET activo = FALSE WHERE id = ?',
            [id]
        );
        return result;
    } catch (error) {
        console.error('Error eliminando evento:', error);
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
        // Dividir el nombre completo en nombre y apellidos
        const nombreCompleto = cliente.nombre || '';
        const partes = nombreCompleto.trim().split(' ');
        const nombre = partes[0] || '';
        const apellidos = partes.slice(1).join(' ') || '';
        
        const result = await dbManager.runQuery(
            `INSERT INTO clientes (nombre, apellidos, telefono, email, direccion, fecha_nacimiento, 
             tipo_cliente, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [nombre, apellidos, cliente.telefono, cliente.email, cliente.direccion,
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

// ========== HANDLERS IPC PARA REPORTES ==========
ipcMain.handle('get-reportes-ventas', async (event, dias = 30) => {
    try {
        return await dbManager.getVentasReporte(dias);
    } catch (error) {
        console.error('Error obteniendo reportes de ventas:', error);
        throw error;
    }
});

ipcMain.handle('get-productos-top-ventas', async (event, limite = 10, dias = 30) => {
    try {
        return await dbManager.getProductosTopVentas(limite, dias);
    } catch (error) {
        console.error('Error obteniendo productos top ventas:', error);
        throw error;
    }
});

ipcMain.handle('get-estados-pedidos', async () => {
    try {
        return await dbManager.getEstadosPedidos();
    } catch (error) {
        console.error('Error obteniendo estados de pedidos:', error);
        throw error;
    }
});

ipcMain.handle('get-clientes-por-tipo', async () => {
    try {
        return await dbManager.getClientesPorTipo();
    } catch (error) {
        console.error('Error obteniendo clientes por tipo:', error);
        throw error;
    }
});

ipcMain.handle('get-eventos-rentables', async (event, limite = 5, dias = 365) => {
    try {
        return await dbManager.getEventosRentables(limite, dias);
    } catch (error) {
        console.error('Error obteniendo eventos rentables:', error);
        throw error;
    }
});

ipcMain.handle('get-rotacion-inventario', async () => {
    try {
        return await dbManager.getRotacionInventario();
    } catch (error) {
        console.error('Error obteniendo rotación de inventario:', error);
        throw error;
    }
});

ipcMain.handle('get-detalle-ventas', async (event, dias = 30, busqueda = '', limite = 100) => {
    try {
        return await dbManager.getDetalleVentas(dias, busqueda, limite);
    } catch (error) {
        console.error('Error obteniendo detalle de ventas:', error);
        throw error;
    }
});

// ============= HANDLERS IPC INVENTARIO AVANZADO =============

// Alertas de stock
ipcMain.handle('get-alertas-stock', async () => {
    try {
        return await dbManager.getAlertasStock();
    } catch (error) {
        console.error('Error obteniendo alertas de stock:', error);
        throw error;
    }
});

// Predicción de demanda
ipcMain.handle('get-prediccion-demanda', async (event, productoId = null, dias = 30) => {
    try {
        return await dbManager.getPrediccionDemanda(productoId, dias);
    } catch (error) {
        console.error('Error obteniendo predicción de demanda:', error);
        throw error;
    }
});

// Gestión de proveedores
ipcMain.handle('get-proveedores', async () => {
    try {
        return await dbManager.getProveedores();
    } catch (error) {
        console.error('Error obteniendo proveedores:', error);
        throw error;
    }
});

ipcMain.handle('crear-proveedor', async (event, proveedor) => {
    try {
        return await dbManager.crearProveedor(proveedor);
    } catch (error) {
        console.error('Error creando proveedor:', error);
        throw error;
    }
});

ipcMain.handle('actualizar-proveedor', async (event, id, proveedor) => {
    try {
        return await dbManager.actualizarProveedor(id, proveedor);
    } catch (error) {
        console.error('Error actualizando proveedor:', error);
        throw error;
    }
});

ipcMain.handle('eliminar-proveedor', async (event, id) => {
    try {
        return await dbManager.eliminarProveedor(id);
    } catch (error) {
        console.error('Error eliminando proveedor:', error);
        throw error;
    }
});

// Productos próximos a vencer
ipcMain.handle('get-productos-vencimiento', async (event, dias = 30) => {
    try {
        return await dbManager.getProductosVencimiento(dias);
    } catch (error) {
        console.error('Error obteniendo productos próximos a vencer:', error);
        throw error;
    }
});

// Órdenes de compra
ipcMain.handle('generar-orden-compra', async (event, productos) => {
    try {
        return await dbManager.generarOrdenCompra(productos);
    } catch (error) {
        console.error('Error generando orden de compra:', error);
        throw error;
    }
});

ipcMain.handle('get-ordenes-compra', async () => {
    try {
        return await dbManager.getOrdenesCompra();
    } catch (error) {
        console.error('Error obteniendo órdenes de compra:', error);
        throw error;
    }
});

ipcMain.handle('get-ordenes-compra-by-proveedor', async (event, proveedorId) => {
    try {
        return await dbManager.getOrdenesCompraByProveedor(proveedorId);
    } catch (error) {
        console.error('Error obteniendo órdenes del proveedor:', error);
        throw error;
    }
});

ipcMain.handle('actualizar-orden-compra', async (event, id, estado, fechaEntrega = null) => {
    try {
        return await dbManager.actualizarOrdenCompra(id, estado, fechaEntrega);
    } catch (error) {
        console.error('Error actualizando orden de compra:', error);
        throw error;
    }
});

// Análisis de inventario
ipcMain.handle('get-analisis-inventario', async () => {
    try {
        return await dbManager.getAnalisisInventario();
    } catch (error) {
        console.error('Error obteniendo análisis de inventario:', error);
        throw error;
    }
});

// Actualizar stock mínimo
ipcMain.handle('actualizar-stock-minimo', async (event, productoId, stockMinimo) => {
    try {
        return await dbManager.actualizarStockMinimo(productoId, stockMinimo);
    } catch (error) {
        console.error('Error actualizando stock mínimo:', error);
        throw error;
    }
});

// Movimientos de inventario
ipcMain.handle('registrar-movimiento-inventario', async (event, movimiento) => {
    try {
        return await dbManager.registrarMovimientoInventario(movimiento);
    } catch (error) {
        console.error('Error registrando movimiento de inventario:', error);
        throw error;
    }
});

ipcMain.handle('get-movimientos-inventario', async (event, filtros = {}) => {
    try {
        return await dbManager.getMovimientosInventario(filtros);
    } catch (error) {
        console.error('Error obteniendo movimientos de inventario:', error);
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
