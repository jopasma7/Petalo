const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const FlowerShopDatabase = require('./src/database/database');
const licenseManager = require('./src/license');

// Variables globales
let mainWindow;
let activationWindow;
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

    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.webContents.on('before-input-event', (_e, input) => {
        if (input.key === 'F12') {
            mainWindow.webContents.isDevToolsOpened()
                ? mainWindow.webContents.closeDevTools()
                : mainWindow.webContents.openDevTools();
        }
    });
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

    Menu.setApplicationMenu(null);
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

ipcMain.handle('get-producto-imagen', async (_e, id) => {
    try {
        return dbManager.getProductoImagen(id);
    } catch (error) {
        console.error('Error obteniendo imagen producto:', error);
        return null;
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

ipcMain.handle('get-detalles-pedido', async (event, pedidoId) => {
    try {
        return await dbManager.getDetallesPedido(pedidoId);
    } catch (error) {
        console.error('Error obteniendo detalles del pedido:', error);
        throw error;
    }
});

ipcMain.handle('get-configuracion', async () => {
    try { return dbManager.getConfiguracion(); }
    catch (error) { console.error('Error obteniendo configuración:', error); throw error; }
});

ipcMain.handle('set-configuracion', async (_e, datos) => {
    try { dbManager.setConfiguracion(datos); return { ok: true }; }
    catch (error) { console.error('Error guardando configuración:', error); throw error; }
});

ipcMain.handle('get-estadisticas', async () => {
    try {
        return await dbManager.getEstadisticasGenerales();
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        throw error;
    }
});

ipcMain.handle('get-tipos-cliente', async () => {
    try { return dbManager.allQuery('SELECT * FROM tipos_cliente ORDER BY nombre'); }
    catch (e) { throw e; }
});
ipcMain.handle('crear-tipo-cliente', async (_e, tipo) => {
    try { return dbManager.runQuery('INSERT INTO tipos_cliente (nombre, color) VALUES (?, ?)', [tipo.nombre, tipo.color || '#6b7280']); }
    catch (e) { throw e; }
});
ipcMain.handle('actualizar-tipo-cliente', async (_e, id, tipo) => {
    try { return dbManager.runQuery('UPDATE tipos_cliente SET nombre = ?, color = ? WHERE id = ?', [tipo.nombre, tipo.color || '#6b7280', id]); }
    catch (e) { throw e; }
});
ipcMain.handle('eliminar-tipo-cliente', async (_e, id) => {
    try {
        const enUso = dbManager.getQuery('SELECT COUNT(*) as n FROM clientes WHERE tipo_cliente = (SELECT nombre FROM tipos_cliente WHERE id = ?)', [id]);
        if (enUso.n > 0) throw new Error('Este tipo tiene clientes asociados');
        return dbManager.runQuery('DELETE FROM tipos_cliente WHERE id = ?', [id]);
    } catch (e) { throw e; }
});

ipcMain.handle('get-tipos-evento', async () => {
    try { return dbManager.allQuery('SELECT * FROM tipos_evento ORDER BY nombre'); }
    catch (e) { throw e; }
});
ipcMain.handle('crear-tipo-evento', async (_e, tipo) => {
    try { return dbManager.runQuery('INSERT INTO tipos_evento (nombre, color) VALUES (?, ?)', [tipo.nombre, tipo.color || '#6b7280']); }
    catch (e) { throw e; }
});
ipcMain.handle('actualizar-tipo-evento', async (_e, id, tipo) => {
    try { return dbManager.runQuery('UPDATE tipos_evento SET nombre = ?, color = ? WHERE id = ?', [tipo.nombre, tipo.color || '#6b7280', id]); }
    catch (e) { throw e; }
});
ipcMain.handle('eliminar-tipo-evento', async (_e, id) => {
    try {
        return dbManager.runQuery('DELETE FROM tipos_evento WHERE id = ?', [id]);
    } catch (e) { throw e; }
});

ipcMain.handle('get-categorias', async () => {
    try {
        return await dbManager.allQuery('SELECT * FROM categorias ORDER BY nombre');
    } catch (error) {
        console.error('Error obteniendo categorías:', error);
        throw error;
    }
});

ipcMain.handle('crear-categoria', async (event, categoria) => {
    try {
        return await dbManager.runQuery(
            'INSERT INTO categorias (nombre, descripcion, icono) VALUES (?, ?, ?)',
            [categoria.nombre, categoria.descripcion || '', categoria.icono || '🌿']
        );
    } catch (error) {
        console.error('Error creando categoría:', error);
        throw error;
    }
});

ipcMain.handle('actualizar-categoria', async (event, id, categoria) => {
    try {
        return await dbManager.runQuery(
            'UPDATE categorias SET nombre = ?, icono = ? WHERE id = ?',
            [categoria.nombre, categoria.icono, id]
        );
    } catch (error) {
        console.error('Error actualizando categoría:', error);
        throw error;
    }
});

ipcMain.handle('eliminar-categoria', async (event, id) => {
    try {
        const enUso = await dbManager.getQuery('SELECT COUNT(*) as n FROM productos WHERE categoria_id = ?', [id]);
        if (enUso.n > 0) throw new Error('La categoría tiene productos asociados');
        return await dbManager.runQuery('DELETE FROM categorias WHERE id = ?', [id]);
    } catch (error) {
        console.error('Error eliminando categoría:', error);
        throw error;
    }
});

// Métodos de actualización
ipcMain.handle('actualizar-producto', async (event, id, producto) => {
    try {
        const result = await dbManager.runQuery(
            `UPDATE productos SET nombre=?, categoria_id=?, descripcion=?, precio_compra=?,
             precio_venta=?, stock_actual=?, stock_minimo=?, unidad_medida=?, temporada=?,
             perecedero=?, dias_caducidad=?, proveedor=?, codigo_producto=?, imagen_url=?,
             updated_at=CURRENT_TIMESTAMP WHERE id=?`,
            [producto.nombre, producto.categoria_id, producto.descripcion, producto.precio_compra,
             producto.precio_venta, producto.stock_actual, producto.stock_minimo, producto.unidad_medida,
             producto.temporada, producto.perecedero ? 1 : 0, producto.dias_caducidad ?? null, producto.proveedor,
             producto.codigo_producto, producto.imagen_url ?? null, id]
        );
        return result;
    } catch (error) {
        console.error('Error actualizando producto:', error);
        throw error;
    }
});

ipcMain.handle('get-cliente-imagen', async (event, id) => {
    try {
        return dbManager.getClienteImagen(id);
    } catch (error) {
        console.error('Error obteniendo imagen cliente:', error);
        return null;
    }
});

ipcMain.handle('actualizar-cliente', async (event, id, cliente) => {
    try {
        const nombreCompleto = cliente.nombre || '';
        const partes = nombreCompleto.trim().split(' ');
        const nombre = partes[0] || '';
        const apellidos = partes.slice(1).join(' ') || '';

        const result = await dbManager.runQuery(
            `UPDATE clientes SET nombre=?, apellidos=?, telefono=?, email=?, direccion=?,
             fecha_nacimiento=?, tipo_cliente=?, notas=?, imagen=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
            [nombre, apellidos, cliente.telefono, cliente.email, cliente.direccion,
             cliente.fecha_nacimiento, cliente.tipo_cliente, cliente.notas,
             cliente.imagen ?? null, id]
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
             proveedor, codigo_producto, imagen_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [producto.nombre, producto.categoria_id, producto.descripcion, producto.precio_compra,
             producto.precio_venta, producto.stock_actual, producto.stock_minimo, producto.unidad_medida,
             producto.temporada, producto.perecedero ? 1 : 0, producto.dias_caducidad ?? null, producto.proveedor,
             producto.codigo_producto, producto.imagen_url || null]
        );
        return result;
    } catch (error) {
        console.error('Error creando producto:', error);
        throw error;
    }
});

ipcMain.handle('crear-cliente', async (event, cliente) => {
    try {
        const nombreCompleto = cliente.nombre || '';
        const partes = nombreCompleto.trim().split(' ');
        const nombre = partes[0] || '';
        const apellidos = partes.slice(1).join(' ') || '';

        const result = await dbManager.runQuery(
            `INSERT INTO clientes (nombre, apellidos, telefono, email, direccion, fecha_nacimiento,
             tipo_cliente, notas, imagen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [nombre, apellidos, cliente.telefono, cliente.email, cliente.direccion,
             cliente.fecha_nacimiento, cliente.tipo_cliente, cliente.notas,
             cliente.imagen ?? null]
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

ipcMain.handle('actualizar-estado-pedido', async (event, id, estado) => {
    try {
        // Obtener estado anterior antes de actualizar
        const pedidoActual = dbManager.getQuery(
            `SELECT estado FROM pedidos WHERE id=?`, [id]
        );
        const result = await dbManager.runQuery(
            `UPDATE pedidos SET estado=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
            [estado, id]
        );
        // Decrementar stock al aprobar (solo si venía de pendiente)
        if (estado === 'aprobado' && pedidoActual && pedidoActual.estado === 'pendiente') {
            const detalles = dbManager.allQuery(
                `SELECT producto_id, cantidad FROM pedido_detalles WHERE pedido_id=?`, [id]
            );
            for (const d of detalles) {
                const prod = dbManager.getQuery('SELECT stock_actual FROM productos WHERE id = ?', [d.producto_id]);
                const stockAnterior = prod ? prod.stock_actual : 0;
                const stockNuevo = Math.max(0, stockAnterior - d.cantidad);
                await dbManager.runQuery(
                    `UPDATE productos SET stock_actual = MAX(0, stock_actual - ?) WHERE id = ?`,
                    [d.cantidad, d.producto_id]
                );
                dbManager._insertMovimiento(d.producto_id, 'salida', d.cantidad, stockAnterior, stockNuevo,
                    'Encargo aprobado', `Pedido #${id}`);
            }
        }
        return result;
    } catch (error) {
        console.error('Error actualizando estado del pedido:', error);
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
        
        // Insertar detalles y descontar stock si el pedido está aprobado
        if (pedido.detalles && pedido.detalles.length > 0) {
            for (const detalle of pedido.detalles) {
                await dbManager.runQuery(
                    `INSERT INTO pedido_detalles (pedido_id, producto_id, cantidad, precio_unitario,
                     subtotal, personalizacion) VALUES (?, ?, ?, ?, ?, ?)`,
                    [result.id, detalle.producto_id, detalle.cantidad, detalle.precio_unitario,
                     detalle.subtotal, detalle.personalizacion]
                );
                if (pedido.estado === 'aprobado') {
                    const prod = dbManager.getQuery('SELECT stock_actual FROM productos WHERE id = ?', [detalle.producto_id]);
                    const stockAnterior = prod ? prod.stock_actual : 0;
                    const stockNuevo = Math.max(0, stockAnterior - detalle.cantidad);
                    await dbManager.runQuery(
                        `UPDATE productos SET stock_actual = MAX(0, stock_actual - ?) WHERE id = ?`,
                        [detalle.cantidad, detalle.producto_id]
                    );
                    dbManager._insertMovimiento(detalle.producto_id, 'salida', detalle.cantidad, stockAnterior, stockNuevo,
                        pedido.tipo_pedido === 'venta_rapida' ? 'Venta TPV' : 'Encargo creado aprobado', `Pedido #${result.id}`);
                }
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

ipcMain.handle('crear-orden-directa', async (event, orden) => {
    try {
        return await dbManager.crearOrdenDirecta(orden);
    } catch (error) {
        console.error('Error creando orden directa:', error);
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

ipcMain.handle('get-detalles-orden', async (event, ordenId) => {
    try { return dbManager.getDetallesOrden(ordenId); }
    catch (error) { console.error('Error obteniendo detalles de orden:', error); throw error; }
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

// ── Login window ──────────────────────────────────────────────────────────────
let loginWindow;

function createLoginWindow() {
    loginWindow = new BrowserWindow({
        width: 900, height: 580,
        resizable: false, center: true,
        icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: { nodeIntegration: false, contextIsolation: true, preload: path.join(__dirname, 'src', 'preload.js') },
        show: false, frame: true,
        title: 'Pétalo'
    });
    loginWindow.loadFile(path.join(__dirname, 'src', 'views', 'login.html'));
    loginWindow.once('ready-to-show', () => loginWindow.show());
    loginWindow.setMenuBarVisibility(false);
}

function getStoredPassword() {
    const fs = require('fs');
    const pwdPath = path.join(app.getPath('userData'), 'pwd.dat');
    try { return require('fs').readFileSync(pwdPath, 'utf8').trim(); } catch { return '1234'; }
}

ipcMain.handle('login-attempt', async (_e, pwd) => {
    if (pwd === getStoredPassword()) {
        if (loginWindow) { loginWindow.close(); loginWindow = null; }
        await launchApp();
        return { ok: true };
    }
    return { ok: false };
});

ipcMain.handle('verify-password', (_e, pwd) => {
    return { ok: pwd === getStoredPassword() };
});

ipcMain.handle('save-password', async (_e, pwd) => {
    const fs = require('fs');
    const pwdPath = path.join(app.getPath('userData'), 'pwd.dat');
    fs.writeFileSync(pwdPath, pwd, 'utf8');
    return { ok: true };
});

// ── Activation window ─────────────────────────────────────────────────────────
function createActivationWindow(reason) {
    activationWindow = new BrowserWindow({
        width: 480,
        height: 520,
        resizable: false,
        center: true,
        icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'src', 'preload.js')
        },
        show: false,
        titleBarStyle: 'hiddenInset',
        frame: true
    });
    activationWindow.loadFile(path.join(__dirname, 'src', 'views', 'activation.html'));
    activationWindow.once('ready-to-show', () => {
        activationWindow.show();
        if (reason) activationWindow.webContents.send('activation-reason', reason);
        activationWindow.webContents.send('activation-icon',
            path.join(__dirname, 'assets', 'icon.png'));
    });
}

// ── License IPC handlers ──────────────────────────────────────────────────────
ipcMain.handle('license-activate', async (_e, key) => {
    const result = await licenseManager.activate(key);
    return result;
});

ipcMain.handle('license-check', async () => {
    return await licenseManager.check();
});

ipcMain.handle('license-info', () => {
    return licenseManager.getCachedLicense();
});

ipcMain.handle('activation-success', async () => {
    if (activationWindow) { activationWindow.close(); activationWindow = null; }
    createLoginWindow();
});

ipcMain.handle('open-external', (_e, url) => {
    shell.openExternal(url);
});

// ── App launch ────────────────────────────────────────────────────────────────
async function launchApp() {
    dbManager = new FlowerShopDatabase();
    try {
        await dbManager.connect();
        await dbManager.insertSampleData();
    } catch (error) {
        console.error('Error inicializando base de datos:', error);
    }
    createMainWindow();
    createMenu();
}

// Eventos de la aplicación
app.whenReady().then(async () => {
    const licenseStatus = await licenseManager.check();

    if (!licenseStatus.valid) {
        createActivationWindow(licenseStatus.reason);
    } else {
        createLoginWindow();
    }

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
