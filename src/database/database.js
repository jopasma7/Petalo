const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class FlowerShopDatabase {
    constructor() {
        this.dbPath = path.join(__dirname, '..', '..', 'data', 'floristeria.db');
        this.db = null;
        
        // Crear directorio data si no existe
        const dataDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error conectando a la base de datos:', err);
                    reject(err);
                } else {
                    console.log('Conectado a la base de datos SQLite');
                    this.initializeTables().then(resolve).catch(reject);
                }
            });
        });
    }

    async initializeTables() {
        const tables = [
            // Tabla de categorías de productos
            `CREATE TABLE IF NOT EXISTS categorias (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL UNIQUE,
                descripcion TEXT,
                icono TEXT DEFAULT '🌸',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Tabla de productos (flores, plantas, jardineras, accesorios)
            `CREATE TABLE IF NOT EXISTS productos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                categoria_id INTEGER,
                descripcion TEXT,
                precio_compra DECIMAL(10,2),
                precio_venta DECIMAL(10,2),
                stock_actual INTEGER DEFAULT 0,
                stock_minimo INTEGER DEFAULT 5,
                unidad_medida TEXT DEFAULT 'unidad',
                temporada TEXT, -- 'primavera', 'verano', 'otoño', 'invierno', 'todo_año'
                perecedero BOOLEAN DEFAULT FALSE,
                dias_caducidad INTEGER,
                proveedor TEXT,
                codigo_producto TEXT UNIQUE,
                imagen_url TEXT,
                activo BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (categoria_id) REFERENCES categorias (id)
            )`,

            // Tabla de clientes
            `CREATE TABLE IF NOT EXISTS clientes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                apellidos TEXT,
                telefono TEXT,
                email TEXT,
                direccion TEXT,
                fecha_nacimiento DATE,
                tipo_cliente TEXT DEFAULT 'regular', -- 'regular', 'frecuente', 'vip'
                descuento_porcentaje DECIMAL(5,2) DEFAULT 0,
                total_compras DECIMAL(10,2) DEFAULT 0,
                ultima_compra DATE,
                notas TEXT,
                activo BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Tabla de eventos especiales
            `CREATE TABLE IF NOT EXISTS eventos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                descripcion TEXT,
                fecha_inicio DATE NOT NULL,
                fecha_fin DATE NOT NULL,
                tipo_evento TEXT, -- 'temporal', 'religioso', 'comercial', 'personalizado'
                demanda_esperada TEXT, -- 'baja', 'media', 'alta', 'extrema'
                productos_destacados TEXT, -- JSON array de producto IDs
                descuento_especial DECIMAL(5,2) DEFAULT 0,
                preparacion_dias INTEGER DEFAULT 7,
                notas TEXT,
                activo BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Tabla de pedidos
            `CREATE TABLE IF NOT EXISTS pedidos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                numero_pedido TEXT UNIQUE NOT NULL,
                cliente_id INTEGER,  
                evento_id INTEGER,
                fecha_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_entrega DATE,
                estado TEXT DEFAULT 'pendiente', -- 'pendiente', 'confirmado', 'preparando', 'listo', 'entregado', 'cancelado'
                tipo_pedido TEXT DEFAULT 'regular', -- 'regular', 'evento', 'urgente', 'personalizado'
                subtotal DECIMAL(10,2) DEFAULT 0,
                descuento DECIMAL(10,2) DEFAULT 0,
                impuestos DECIMAL(10,2) DEFAULT 0,  
                total DECIMAL(10,2) DEFAULT 0,
                adelanto DECIMAL(10,2) DEFAULT 0,
                saldo_pendiente DECIMAL(10,2) DEFAULT 0,
                metodo_pago TEXT, -- 'efectivo', 'tarjeta', 'transferencia', 'mixto'
                direccion_entrega TEXT,
                instrucciones_especiales TEXT,
                notas TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (cliente_id) REFERENCES clientes (id),
                FOREIGN KEY (evento_id) REFERENCES eventos (id)
            )`,

            // Tabla de detalles de pedidos
            `CREATE TABLE IF NOT EXISTS pedido_detalles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pedido_id INTEGER NOT NULL,
                producto_id INTEGER NOT NULL,
                cantidad INTEGER NOT NULL,
                precio_unitario DECIMAL(10,2) NOT NULL,
                subtotal DECIMAL(10,2) NOT NULL,
                personalizacion TEXT, -- Detalles especiales del producto
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (pedido_id) REFERENCES pedidos (id) ON DELETE CASCADE,
                FOREIGN KEY (producto_id) REFERENCES productos (id)
            )`,

            // Tabla de movimientos de inventario
            `CREATE TABLE IF NOT EXISTS inventario_movimientos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                producto_id INTEGER NOT NULL,
                tipo_movimiento TEXT NOT NULL, -- 'entrada', 'salida', 'ajuste', 'merma'
                cantidad INTEGER NOT NULL,
                stock_anterior INTEGER,
                stock_nuevo INTEGER,
                motivo TEXT,
                referencia TEXT, -- Número de pedido, factura, etc.
                fecha_movimiento DATETIME DEFAULT CURRENT_TIMESTAMP,
                usuario TEXT,
                FOREIGN KEY (producto_id) REFERENCES productos (id)
            )`,

            // Tabla de reservas para eventos
            `CREATE TABLE IF NOT EXISTS reservas_eventos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                evento_id INTEGER NOT NULL,
                cliente_id INTEGER NOT NULL,
                producto_id INTEGER NOT NULL,
                cantidad_reservada INTEGER NOT NULL,
                fecha_reserva DATETIME DEFAULT CURRENT_TIMESTAMP,
                estado TEXT DEFAULT 'reservado', -- 'reservado', 'confirmado', 'cancelado'
                notas TEXT,
                FOREIGN KEY (evento_id) REFERENCES eventos (id),
                FOREIGN KEY (cliente_id) REFERENCES clientes (id),
                FOREIGN KEY (producto_id) REFERENCES productos (id)
            )`,

            // Tabla de configuración del sistema
            `CREATE TABLE IF NOT EXISTS configuracion (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                clave TEXT UNIQUE NOT NULL,
                valor TEXT NOT NULL,
                descripcion TEXT,
                tipo TEXT DEFAULT 'text', -- 'text', 'number', 'boolean', 'json'
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Tabla de proveedores
            `CREATE TABLE IF NOT EXISTS proveedores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                contacto TEXT,
                telefono TEXT,
                email TEXT,
                direccion TEXT,
                ciudad TEXT,
                codigo_postal TEXT,
                pais TEXT DEFAULT 'España',
                condiciones_pago TEXT, -- '30 días', '60 días', 'contado'
                descuento_proveedor DECIMAL(5,2) DEFAULT 0,
                activo BOOLEAN DEFAULT 1,
                notas TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Tabla de productos por proveedor
            `CREATE TABLE IF NOT EXISTS productos_proveedores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                producto_id INTEGER NOT NULL,
                proveedor_id INTEGER NOT NULL,
                codigo_proveedor TEXT,
                precio_compra DECIMAL(10,2),
                precio_minimo_pedido DECIMAL(10,2),
                cantidad_minima INTEGER DEFAULT 1,
                tiempo_entrega_dias INTEGER DEFAULT 7,
                es_proveedor_principal BOOLEAN DEFAULT 0,
                activo BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (producto_id) REFERENCES productos (id),
                FOREIGN KEY (proveedor_id) REFERENCES proveedores (id)
            )`,

            // Tabla de órdenes de compra
            `CREATE TABLE IF NOT EXISTS ordenes_compra (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                numero_orden TEXT UNIQUE NOT NULL,
                proveedor_id INTEGER NOT NULL,
                fecha_orden DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_entrega_esperada DATE,
                fecha_entrega_real DATE,
                estado TEXT DEFAULT 'pendiente', -- 'pendiente', 'enviada', 'recibida', 'cancelada'
                subtotal DECIMAL(10,2) DEFAULT 0,
                impuestos DECIMAL(10,2) DEFAULT 0,
                descuento DECIMAL(10,2) DEFAULT 0,
                total DECIMAL(10,2) DEFAULT 0,
                metodo_pago TEXT,
                referencia_proveedor TEXT,
                notas TEXT,
                created_by TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (proveedor_id) REFERENCES proveedores (id)
            )`,

            // Tabla de detalles de órdenes de compra
            `CREATE TABLE IF NOT EXISTS orden_compra_detalles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                orden_id INTEGER NOT NULL,
                producto_id INTEGER NOT NULL,
                cantidad_pedida INTEGER NOT NULL,
                cantidad_recibida INTEGER DEFAULT 0,
                precio_unitario DECIMAL(10,2) NOT NULL,
                subtotal DECIMAL(10,2) NOT NULL,
                descuento_linea DECIMAL(10,2) DEFAULT 0,
                notas TEXT,
                FOREIGN KEY (orden_id) REFERENCES ordenes_compra (id),
                FOREIGN KEY (producto_id) REFERENCES productos (id)
            )`,

            // Tabla de predicciones de demanda
            `CREATE TABLE IF NOT EXISTS predicciones_demanda (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                producto_id INTEGER NOT NULL,
                periodo TEXT NOT NULL, -- 'semanal', 'mensual', 'trimestral'
                fecha_inicio DATE NOT NULL,
                fecha_fin DATE NOT NULL,
                demanda_prevista INTEGER NOT NULL,
                demanda_real INTEGER DEFAULT 0,
                confianza DECIMAL(5,2) DEFAULT 0, -- Porcentaje de confianza 0-100
                metodo_calculo TEXT, -- 'promedio_movil', 'tendencia_lineal', 'estacional'
                parametros_calculo TEXT, -- JSON con parámetros usados
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (producto_id) REFERENCES productos (id)
            )`,

            // Tabla de alertas de inventario
            `CREATE TABLE IF NOT EXISTS alertas_inventario (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                producto_id INTEGER NOT NULL,
                tipo_alerta TEXT NOT NULL, -- 'stock_bajo', 'stock_alto', 'vencimiento', 'sin_movimiento'
                descripcion TEXT NOT NULL,
                nivel_prioridad TEXT DEFAULT 'media', -- 'baja', 'media', 'alta', 'critica'
                fecha_generada DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_vencimiento DATETIME,
                estado TEXT DEFAULT 'activa', -- 'activa', 'resuelta', 'descartada'
                accion_recomendada TEXT,
                usuario_asignado TEXT,
                fecha_resolucion DATETIME,
                notas_resolucion TEXT,
                FOREIGN KEY (producto_id) REFERENCES productos (id)
            )`
        ];

        for (const tableSQL of tables) {
            await this.runQuery(tableSQL);
        }
        
        console.log('Tablas inicializadas correctamente');
    }

    async insertSampleData() {
        // Verificar si ya hay datos
        const count = await this.getQuery("SELECT COUNT(*) as count FROM productos");
        if (count.count > 0) {
            console.log('La base de datos ya contiene datos de ejemplo');
            return;
        }

        try {
            // Categorías
            const categorias = [
                ['Flores Naturales', 'Flores frescas cortadas', '🌹'],
                ['Plantas de Interior', 'Plantas para decoración interior', '🪴'],  
                ['Plantas de Exterior', 'Plantas para jardín y balcón', '🌿'],
                ['Jardineras', 'Contenedores para plantas y flores', '🏺'],
                ['Accesorios', 'Macetas, tierra, fertilizantes', '🛠️'],
                ['Arreglos Especiales', 'Bouquets y composiciones', '💐']
            ];

            for (const [nombre, descripcion, icono] of categorias) {
                await this.runQuery(
                    `INSERT INTO categorias (nombre, descripcion, icono) VALUES (?, ?, ?)`,
                    [nombre, descripcion, icono]
                );
            }

            // Productos de ejemplo
            const productos = [
                // Flores Naturales
                ['Rosas Rojas', 1, 'Rosas rojas frescas, perfectas para ocasiones especiales', 2.50, 4.00, 100, 20, 'unidad', 'todo_año', true, 7, 'Flores del Campo', 'FL001'],
                ['Rosas Blancas', 1, 'Rosas blancas elegantes', 2.50, 4.00, 80, 15, 'unidad', 'todo_año', true, 7, 'Flores del Campo', 'FL002'],
                ['Claveles', 1, 'Claveles variados de colores', 1.50, 2.50, 150, 30, 'unidad', 'todo_año', true, 10, 'Flores del Campo', 'FL003'],
                ['Girasoles', 1, 'Girasoles grandes y brillantes', 3.00, 5.00, 60, 10, 'unidad', 'verano', true, 5, 'Flores del Campo', 'FL004'],
                ['Lirios', 1, 'Lirios blancos aromáticos', 4.00, 6.50, 40, 8, 'unidad', 'primavera', true, 8, 'Flores del Campo', 'FL005'],
                
                // Plantas de Interior
                ['Pothos', 2, 'Planta colgante de fácil cuidado', 8.00, 15.00, 25, 5, 'unidad', 'todo_año', false, null, 'Vivero Verde', 'PI001'],
                ['Sansevieria', 2, 'Planta resistente, ideal para principiantes', 12.00, 22.00, 20, 3, 'unidad', 'todo_año', false, null, 'Vivero Verde', 'PI002'],
                ['Ficus', 2, 'Árbol decorativo para interiores', 25.00, 45.00, 15, 2, 'unidad', 'todo_año', false, null, 'Vivero Verde', 'PI003'],
                
                // Plantas de Exterior
                ['Geranios', 3, 'Plantas florales para balcones', 6.00, 12.00, 50, 10, 'unidad', 'primavera', false, null, 'Jardín Botánico', 'PE001'],
                ['Petunias', 3, 'Flores coloridas para jardín', 4.00, 8.00, 60, 12, 'unidad', 'primavera', false, null, 'Jardín Botánico', 'PE002'],
                ['Lavanda', 3, 'Planta aromática', 8.00, 16.00, 30, 5, 'unidad', 'todo_año', false, null, 'Jardín Botánico', 'PE003'],
                
                // Jardineras especiales para Semana Santa
                ['Jardinera Pequeña', 4, 'Jardinera de cerámica pequeña (20cm)', 5.00, 12.00, 100, 20, 'unidad', 'todo_año', false, null, 'Cerámica Española', 'JA001'],
                ['Jardinera Mediana', 4, 'Jardinera de cerámica mediana (30cm)', 8.00, 18.00, 80, 15, 'unidad', 'todo_año', false, null, 'Cerámica Española', 'JA002'],
                ['Jardinera Grande', 4, 'Jardinera de cerámica grande (40cm)', 12.00, 25.00, 50, 10, 'unidad', 'todo_año', false, null, 'Cerámica Española', 'JA003'],
                ['Jardinera Especial Semana Santa', 4, 'Jardinera decorada especial para Semana Santa', 15.00, 30.00, 200, 50, 'unidad', 'primavera', false, null, 'Artesanía Local', 'JA004'],
                
                // Accesorios
                ['Tierra Universal', 5, 'Sustrato universal para plantas', 3.00, 6.00, 100, 20, 'saco', 'todo_año', false, null, 'AgriSupply', 'AC001'],
                ['Fertilizante Líquido', 5, 'Fertilizante para plantas en flor', 4.50, 9.00, 50, 10, 'botella', 'todo_año', false, null, 'AgriSupply', 'AC002'],
                ['Maceta Barro 15cm', 5, 'Maceta de barro cocido', 2.00, 4.50, 80, 15, 'unidad', 'todo_año', false, null, 'Cerámica Local', 'AC003']
            ];

            for (const producto of productos) {
                await this.runQuery(
                    `INSERT INTO productos (nombre, categoria_id, descripcion, precio_compra, precio_venta, 
                     stock_actual, stock_minimo, unidad_medida, temporada, perecedero, dias_caducidad, 
                     proveedor, codigo_producto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    producto
                );
            }

            // Eventos de ejemplo
            const eventos = [
                ['Semana Santa 2025', 'Evento religioso con alta demanda de jardineras decoradas', '2025-04-13', '2025-04-20', 'religioso', 'extrema', '[14, 15, 16]', 10, 15, 'Preparar stock extra de jardineras especiales'],
                ['Día de las Madres', 'Celebración con alta demanda de flores y arreglos', '2025-05-11', '2025-05-11', 'comercial', 'alta', '[1, 2, 5]', 15, 10, 'Promoción especial en rosas y arreglos'],
                ['San Valentín', 'Día de los enamorados', '2025-02-14', '2025-02-14', 'comercial', 'alta', '[1, 2]', 20, 7, 'Stock extra de rosas rojas'],
                ['Primavera 2025', 'Temporada de siembra y jardinería', '2025-03-20', '2025-06-20', 'temporal', 'media', '[9, 10, 11]', 5, 20, 'Promoción en plantas de exterior']
            ];

            for (const evento of eventos) {
                await this.runQuery(
                    `INSERT INTO eventos (nombre, descripcion, fecha_inicio, fecha_fin, tipo_evento, 
                     demanda_esperada, productos_destacados, descuento_especial, preparacion_dias, notas) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    evento
                );
            }

            // Clientes de ejemplo
            const clientes = [
                ['María', 'González López', '123456789', 'maria@email.com', 'Calle Principal 123', '1980-05-15', 'frecuente', 5.00, 150.00, '2024-12-15'],
                ['Juan', 'Pérez Martín', '987654321', 'juan@email.com', 'Avenida Central 456', '1975-08-22', 'vip', 10.00, 300.00, '2024-12-20'],
                ['Ana', 'Rodríguez Silva', '456789123', 'ana@email.com', 'Plaza Mayor 789', '1990-03-10', 'regular', 0.00, 75.00, '2024-11-30'],
                ['Carlos', 'López García', '789123456', 'carlos@email.com', 'Calle Flores 321', '1985-12-05', 'frecuente', 5.00, 200.00, '2024-12-18']
            ];

            for (const cliente of clientes) {
                await this.runQuery(
                    `INSERT INTO clientes (nombre, apellidos, telefono, email, direccion, fecha_nacimiento, 
                     tipo_cliente, descuento_porcentaje, total_compras, ultima_compra) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    cliente
                );
            }

            // Configuración inicial
            const configuracion = [
                ['moneda', 'EUR', 'Moneda utilizada en la floristería'],
                ['iva_porcentaje', '21', 'Porcentaje de IVA aplicado'],
                ['empresa_nombre', 'Floristería El Jardín', 'Nombre de la empresa'],
                ['empresa_direccion', 'Calle de las Flores, 123', 'Dirección de la empresa'],
                ['empresa_telefono', '123-456-789', 'Teléfono de la empresa'],
                ['dias_alerta_caducidad', '3', 'Días de anticipación para alertas de caducidad'],
                ['backup_automatico', 'true', 'Activar backup automático de la base de datos']
            ];

            for (const [clave, valor, descripcion] of configuracion) {
                await this.runQuery(
                    `INSERT INTO configuracion (clave, valor, descripcion) VALUES (?, ?, ?)`,
                    [clave, valor, descripcion]
                );
            }

            // Insertar pedidos de ejemplo para reportes
            await this.insertSampleOrders();

            // Insertar proveedores de ejemplo
            await this.insertSampleProviders();

            // Insertar relaciones productos-proveedores
            await this.insertSampleProductProviders();

            // Insertar movimientos de inventario de ejemplo
            await this.insertSampleMovements();

            console.log('Datos de ejemplo insertados correctamente');
        } catch (error) {
            console.error('Error insertando datos de ejemplo:', error);
        }
    }

    async insertSampleOrders() {
        // Verificar si ya hay pedidos
        const pedidosCount = await this.getQuery("SELECT COUNT(*) as count FROM pedidos");
        if (pedidosCount.count > 0) {
            console.log('Ya existen pedidos en la base de datos');
            return;
        }

        // Obtener IDs existentes
        const clientes = await this.allQuery("SELECT id FROM clientes ORDER BY id LIMIT 3");
        const productos = await this.allQuery("SELECT id, precio_venta FROM productos ORDER BY id LIMIT 10");
        
        if (clientes.length === 0 || productos.length === 0) {
            console.log('No hay clientes o productos para crear pedidos de ejemplo');
            return;
        }

        // Pedidos de ejemplo de los últimos 30 días
        const pedidosEjemplo = [
            {
                numero_pedido: 'FL1675089600001',
                cliente_id: clientes[0].id,
                evento_id: null,
                fecha_pedido: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // Hace 5 días
                fecha_entrega: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                estado: 'entregado',
                tipo_pedido: 'regular',
                subtotal: 45.00,
                descuento: 0,
                total: 45.00,
                adelanto: 0,
                saldo_pendiente: 45.00,
                metodo_pago: 'efectivo',
                notas: 'Pedido de ejemplo 1',
                productos: [
                    { producto_id: productos[0].id, cantidad: 3, precio_unitario: productos[0].precio_venta },
                    { producto_id: productos[1].id, cantidad: 2, precio_unitario: productos[1].precio_venta }
                ]
            },
            {
                numero_pedido: 'FL1675089600002',
                cliente_id: clientes[1].id,
                evento_id: null,
                fecha_pedido: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // Hace 8 días
                fecha_entrega: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                estado: 'entregado',
                tipo_pedido: 'regular',
                subtotal: 78.50,
                descuento: 5.00,
                total: 73.50,
                adelanto: 20.00,
                saldo_pendiente: 53.50,
                metodo_pago: 'tarjeta',
                notas: 'Pedido de ejemplo 2',
                productos: [
                    { producto_id: productos[2].id, cantidad: 1, precio_unitario: productos[2].precio_venta },
                    { producto_id: productos[3].id, cantidad: 4, precio_unitario: productos[3].precio_venta }
                ]
            },
            {
                numero_pedido: 'FL1675089600003',
                cliente_id: clientes[2].id,
                evento_id: null,
                fecha_pedido: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // Hace 12 días
                fecha_entrega: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                estado: 'confirmado',
                tipo_pedido: 'urgente',
                subtotal: 92.00,
                descuento: 0,
                total: 92.00,
                adelanto: 30.00,
                saldo_pendiente: 62.00,
                metodo_pago: 'transferencia',
                notas: 'Pedido urgente de ejemplo',
                productos: [
                    { producto_id: productos[4].id, cantidad: 2, precio_unitario: productos[4].precio_venta },
                    { producto_id: productos[5].id, cantidad: 1, precio_unitario: productos[5].precio_venta }
                ]
            },
            {
                numero_pedido: 'FL1675089600004',
                cliente_id: clientes[0].id,
                evento_id: null,
                fecha_pedido: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // Hace 15 días
                fecha_entrega: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                estado: 'entregado',
                tipo_pedido: 'regular',
                subtotal: 125.75,
                descuento: 12.58,
                total: 113.17,
                adelanto: 50.00,
                saldo_pendiente: 63.17,
                metodo_pago: 'mixto',
                notas: 'Pedido con descuento especial',
                productos: [
                    { producto_id: productos[6].id, cantidad: 5, precio_unitario: productos[6].precio_venta },
                    { producto_id: productos[7].id, cantidad: 2, precio_unitario: productos[7].precio_venta }
                ]
            },
            {
                numero_pedido: 'FL1675089600005',
                cliente_id: clientes[1].id,
                evento_id: null,
                fecha_pedido: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Hace 2 días
                fecha_entrega: new Date().toISOString().split('T')[0], // Hoy
                estado: 'preparando',
                tipo_pedido: 'regular',
                subtotal: 67.25,
                descuento: 0,
                total: 67.25,
                adelanto: 0,
                saldo_pendiente: 67.25,
                metodo_pago: 'efectivo',
                notas: 'Pedido en preparación',
                productos: [
                    { producto_id: productos[8].id, cantidad: 3, precio_unitario: productos[8].precio_venta },
                    { producto_id: productos[9].id, cantidad: 1, precio_unitario: productos[9].precio_venta }
                ]
            }
        ];

        // Insertar pedidos y sus detalles
        for (const pedido of pedidosEjemplo) {
            try {
                // Insertar pedido
                const result = await this.runQuery(
                    `INSERT INTO pedidos (numero_pedido, cliente_id, evento_id, fecha_pedido, fecha_entrega, 
                     estado, tipo_pedido, subtotal, descuento, total, adelanto, saldo_pendiente, 
                     metodo_pago, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [pedido.numero_pedido, pedido.cliente_id, pedido.evento_id, pedido.fecha_pedido,
                     pedido.fecha_entrega, pedido.estado, pedido.tipo_pedido, pedido.subtotal,
                     pedido.descuento, pedido.total, pedido.adelanto, pedido.saldo_pendiente,
                     pedido.metodo_pago, pedido.notas]
                );

                // Insertar detalles del pedido
                for (const detalle of pedido.productos) {
                    const subtotalDetalle = detalle.cantidad * detalle.precio_unitario;
                    await this.runQuery(
                        `INSERT INTO pedido_detalles (pedido_id, producto_id, cantidad, precio_unitario, 
                         subtotal) VALUES (?, ?, ?, ?, ?)`,
                        [result.id, detalle.producto_id, detalle.cantidad, detalle.precio_unitario, subtotalDetalle]
                    );
                }
            } catch (error) {
                console.error('Error insertando pedido de ejemplo:', error);
            }
        }

        console.log('Pedidos de ejemplo insertados correctamente');
    }

    async insertSampleProviders() {
        // Verificar si ya hay proveedores
        const proveedoresCount = await this.getQuery("SELECT COUNT(*) as count FROM proveedores");
        if (proveedoresCount.count > 0) {
            console.log('Ya existen proveedores en la base de datos');
            return;
        }

        const proveedoresEjemplo = [
            {
                nombre: 'Flores del Campo S.L.',
                contacto: 'María García',
                telefono: '+34 91 123 4567',
                email: 'pedidos@floresdelcampo.es',
                direccion: 'Calle de las Flores, 15',
                ciudad: 'Madrid',
                codigo_postal: '28001',
                condiciones_pago: '30 días',
                descuento_proveedor: 5.0,
                notas: 'Proveedor principal de flores frescas'
            },
            {
                nombre: 'Viveros Barcelona',
                contacto: 'Josep Martín',
                telefono: '+34 93 234 5678',
                email: 'comercial@viverosbarcelona.com',
                direccion: 'Avda. Catalunya, 42',
                ciudad: 'Barcelona',
                codigo_postal: '08001',
                condiciones_pago: '45 días',
                descuento_proveedor: 3.5,
                notas: 'Especialistas en plantas de interior'
            },
            {
                nombre: 'Jardinería Valencia',
                contacto: 'Carmen López',
                telefono: '+34 96 345 6789',
                email: 'info@jardineriavalencia.es',
                direccion: 'Plaza del Jardín, 8',
                ciudad: 'Valencia',
                codigo_postal: '46001',
                condiciones_pago: '60 días',
                descuento_proveedor: 7.0,
                notas: 'Accesorios y herramientas de jardinería'
            }
        ];

        for (const proveedor of proveedoresEjemplo) {
            try {
                await this.runQuery(`
                    INSERT INTO proveedores (
                        nombre, contacto, telefono, email, direccion, ciudad,
                        codigo_postal, condiciones_pago, descuento_proveedor, notas
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    proveedor.nombre, proveedor.contacto, proveedor.telefono,
                    proveedor.email, proveedor.direccion, proveedor.ciudad,
                    proveedor.codigo_postal, proveedor.condiciones_pago,
                    proveedor.descuento_proveedor, proveedor.notas
                ]);
            } catch (error) {
                console.error('Error insertando proveedor de ejemplo:', error);
            }
        }

        console.log('Proveedores de ejemplo insertados correctamente');
    }

    async insertSampleProductProviders() {
        // Obtener algunos productos y proveedores para crear relaciones
        const productos = await this.allQuery("SELECT id FROM productos LIMIT 10");
        const proveedores = await this.allQuery("SELECT id FROM proveedores");

        if (productos.length === 0 || proveedores.length === 0) {
            console.log('No hay productos o proveedores para crear relaciones');
            return;
        }

        const relaciones = [];
        
        // Asignar proveedores a productos de manera aleatoria
        productos.forEach((producto, index) => {
            const proveedorIndex = index % proveedores.length;
            const proveedor = proveedores[proveedorIndex];
            
            relaciones.push({
                producto_id: producto.id,
                proveedor_id: proveedor.id,
                codigo_proveedor: `PROV-${proveedor.id}-${producto.id}`,
                precio_compra: Math.round((Math.random() * 10 + 5) * 100) / 100,
                cantidad_minima: Math.floor(Math.random() * 5) + 1,
                tiempo_entrega_dias: Math.floor(Math.random() * 10) + 3,
                es_proveedor_principal: true
            });
        });

        for (const relacion of relaciones) {
            try {
                await this.runQuery(`
                    INSERT INTO productos_proveedores (
                        producto_id, proveedor_id, codigo_proveedor, precio_compra,
                        cantidad_minima, tiempo_entrega_dias, es_proveedor_principal
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [
                    relacion.producto_id, relacion.proveedor_id, relacion.codigo_proveedor,
                    relacion.precio_compra, relacion.cantidad_minima, relacion.tiempo_entrega_dias,
                    relacion.es_proveedor_principal
                ]);
            } catch (error) {
                console.error('Error insertando relación producto-proveedor:', error);
            }
        }

        console.log('Relaciones productos-proveedores insertadas correctamente');
    }

    async insertSampleMovements() {
        // Obtener algunos productos para crear movimientos
        const productos = await this.allQuery("SELECT id, stock_actual FROM productos LIMIT 5");

        if (productos.length === 0) {
            console.log('No hay productos para crear movimientos');
            return;
        }

        const movimientos = [
            {
                producto_id: productos[0].id,
                tipo_movimiento: 'entrada',
                cantidad: 20,
                stock_anterior: productos[0].stock_actual,
                stock_nuevo: productos[0].stock_actual + 20,
                motivo: 'Compra inicial',
                referencia: 'COMP-001',
                usuario: 'Sistema',
                fecha: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                producto_id: productos[1].id,
                tipo_movimiento: 'salida',
                cantidad: 5,
                stock_anterior: productos[1].stock_actual,
                stock_nuevo: productos[1].stock_actual - 5,
                motivo: 'Venta',
                referencia: 'VENTA-001',
                usuario: 'Sistema',
                fecha: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                producto_id: productos[2].id,
                tipo_movimiento: 'ajuste',
                cantidad: -2,
                stock_anterior: productos[2].stock_actual,
                stock_nuevo: productos[2].stock_actual - 2,
                motivo: 'Producto dañado',
                referencia: 'AJUSTE-001',
                usuario: 'Admin',
                fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];

        for (const mov of movimientos) {
            try {
                await this.runQuery(`
                    INSERT INTO inventario_movimientos (
                        producto_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo,
                        motivo, referencia, usuario, fecha_movimiento
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    mov.producto_id, mov.tipo_movimiento, mov.cantidad,
                    mov.stock_anterior, mov.stock_nuevo, mov.motivo,
                    mov.referencia, mov.usuario, mov.fecha
                ]);
            } catch (error) {
                console.error('Error insertando movimiento de ejemplo:', error);
            }
        }

        console.log('Movimientos de inventario de ejemplo insertados correctamente');
    }

    // ============= MÉTODOS DE INVENTARIO AVANZADO =============

    // Alertas de stock bajo
    async getAlertasStock() {
        const productos = await this.allQuery(`
            SELECT 
                p.id,
                p.nombre,
                p.stock_actual,
                p.stock_minimo,
                p.precio_venta,
                c.nombre as categoria,
                CASE 
                    WHEN p.stock_actual <= 0 THEN 'sin_stock'
                    WHEN p.stock_actual <= p.stock_minimo * 0.5 THEN 'critico'
                    WHEN p.stock_actual <= p.stock_minimo THEN 'bajo'
                    ELSE 'normal'
                END as nivel_alerta,
                (p.stock_minimo - p.stock_actual) as stock_sugerido
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.stock_actual <= p.stock_minimo AND p.activo = 1
            ORDER BY 
                CASE 
                    WHEN p.stock_actual <= 0 THEN 1
                    WHEN p.stock_actual <= p.stock_minimo * 0.5 THEN 2
                    ELSE 3
                END,
                p.stock_actual ASC
        `);

        return productos;
    }

    // Predicción de demanda basada en histórico
    async getPrediccionDemanda(productoId = null, dias = 30) {
        let whereClause = '';
        let params = [dias];
        
        if (productoId) {
            whereClause = 'AND pd.producto_id = ?';
            params.push(productoId);
        }

        return this.allQuery(`
            SELECT 
                p.id,
                p.nombre,
                p.stock_actual,
                COALESCE(AVG(pd.cantidad), 0) as promedio_diario,
                COALESCE(AVG(pd.cantidad) * ?, 0) as demanda_prevista,
                COALESCE(MAX(pd.cantidad), 0) as pico_maximo,
                COUNT(pd.id) as dias_con_ventas,
                p.stock_actual - COALESCE(AVG(pd.cantidad) * ?, 0) as stock_proyectado
            FROM productos p
            LEFT JOIN pedido_detalles pd ON p.id = pd.producto_id
            LEFT JOIN pedidos pe ON pd.pedido_id = pe.id
            WHERE pe.fecha_pedido >= DATE('now', '-' || ? || ' days') 
                AND pe.estado IN ('entregado', 'confirmado') ${whereClause}
            GROUP BY p.id, p.nombre, p.stock_actual
            HAVING p.stock_actual > 0
            ORDER BY demanda_prevista DESC
        `, [...params, dias, dias]);
    }

    // Gestión de proveedores
    async getProveedores() {
        return this.allQuery(`
            SELECT 
                p.*,
                COUNT(pp.id) as productos_suministrados,
                COALESCE(AVG(oc.total), 0) as promedio_pedidos
            FROM proveedores p
            LEFT JOIN productos_proveedores pp ON p.id = pp.proveedor_id AND pp.activo = 1
            LEFT JOIN ordenes_compra oc ON p.id = oc.proveedor_id 
                AND oc.fecha_orden >= DATE('now', '-90 days')
            WHERE p.activo = 1
            GROUP BY p.id
            ORDER BY p.nombre
        `);
    }

    async crearProveedor(proveedor) {
        const result = await this.runQuery(`
            INSERT INTO proveedores (
                nombre, contacto, telefono, email, direccion, ciudad, 
                codigo_postal, pais, condiciones_pago, descuento_proveedor, notas
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            proveedor.nombre, proveedor.contacto, proveedor.telefono,
            proveedor.email, proveedor.direccion, proveedor.ciudad,
            proveedor.codigo_postal, proveedor.pais || 'España',
            proveedor.condiciones_pago, proveedor.descuento_proveedor || 0,
            proveedor.notas
        ]);
        return result;
    }

    async actualizarProveedor(id, proveedor) {
        return this.runQuery(`
            UPDATE proveedores SET 
                nombre = ?, contacto = ?, telefono = ?, email = ?,
                direccion = ?, ciudad = ?, codigo_postal = ?, pais = ?,
                condiciones_pago = ?, descuento_proveedor = ?, notas = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            proveedor.nombre, proveedor.contacto, proveedor.telefono,
            proveedor.email, proveedor.direccion, proveedor.ciudad,
            proveedor.codigo_postal, proveedor.pais,
            proveedor.condiciones_pago, proveedor.descuento_proveedor,
            proveedor.notas, id
        ]);
    }

    async eliminarProveedor(id) {
        return this.runQuery('UPDATE proveedores SET activo = 0 WHERE id = ?', [id]);
    }

    // Productos próximos a vencer
    async getProductosVencimiento(dias = 30) {
        return this.allQuery(`
            SELECT 
                p.id,
                p.nombre,
                p.stock_actual,
                p.fecha_vencimiento,
                c.nombre as categoria,
                CAST(JULIANDAY(p.fecha_vencimiento) - JULIANDAY('now') AS INTEGER) as dias_restantes,
                CASE 
                    WHEN p.fecha_vencimiento <= DATE('now', '+7 days') THEN 'critico'
                    WHEN p.fecha_vencimiento <= DATE('now', '+15 days') THEN 'alto'
                    WHEN p.fecha_vencimiento <= DATE('now', '+30 days') THEN 'medio'
                    ELSE 'bajo'
                END as nivel_urgencia
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.fecha_vencimiento IS NOT NULL 
                AND p.fecha_vencimiento <= DATE('now', '+' || ? || ' days')
                AND p.stock_actual > 0
                AND p.activo = 1
            ORDER BY p.fecha_vencimiento ASC
        `, [dias]);
    }

    // Generar orden de compra automática
    async generarOrdenCompra(productos) {
        const numeroOrden = 'OC' + Date.now();
        const proveedoresMap = new Map();

        // Agrupar productos por proveedor principal
        for (const producto of productos) {
            const proveedorInfo = await this.getQuery(`
                SELECT pp.proveedor_id, pp.precio_compra, pr.nombre as proveedor_nombre
                FROM productos_proveedores pp
                JOIN proveedores pr ON pp.proveedor_id = pr.id
                WHERE pp.producto_id = ? AND pp.es_proveedor_principal = 1 AND pp.activo = 1
                LIMIT 1
            `, [producto.producto_id]);

            if (proveedorInfo) {
                if (!proveedoresMap.has(proveedorInfo.proveedor_id)) {
                    proveedoresMap.set(proveedorInfo.proveedor_id, {
                        proveedor_id: proveedorInfo.proveedor_id,
                        proveedor_nombre: proveedorInfo.proveedor_nombre,
                        productos: []
                    });
                }
                
                proveedoresMap.get(proveedorInfo.proveedor_id).productos.push({
                    ...producto,
                    precio_compra: proveedorInfo.precio_compra
                });
            }
        }

        const ordenesCreadas = [];

        // Crear una orden por proveedor
        for (const [proveedorId, data] of proveedoresMap) {
            const numeroOrdenProveedor = `${numeroOrden}-${proveedorId}`;
            let subtotal = 0;

            const ordenResult = await this.runQuery(`
                INSERT INTO ordenes_compra (
                    numero_orden, proveedor_id, fecha_entrega_esperada,
                    subtotal, total, estado, created_by
                ) VALUES (?, ?, DATE('now', '+7 days'), 0, 0, 'pendiente', 'Sistema')
            `, [numeroOrdenProveedor, proveedorId]);

            // Añadir detalles de productos
            for (const prod of data.productos) {
                const lineTotal = prod.cantidad * prod.precio_compra;
                subtotal += lineTotal;

                await this.runQuery(`
                    INSERT INTO orden_compra_detalles (
                        orden_id, producto_id, cantidad_pedida, precio_unitario, subtotal
                    ) VALUES (?, ?, ?, ?, ?)
                `, [ordenResult.id, prod.producto_id, prod.cantidad, prod.precio_compra, lineTotal]);
            }

            // Actualizar totales de la orden
            await this.runQuery(`
                UPDATE ordenes_compra SET subtotal = ?, total = ? WHERE id = ?
            `, [subtotal, subtotal, ordenResult.id]);

            ordenesCreadas.push({
                id: ordenResult.id,
                numero_orden: numeroOrdenProveedor,
                proveedor: data.proveedor_nombre,
                total: subtotal,
                productos: data.productos.length
            });
        }

        return ordenesCreadas;
    }

    // Obtener órdenes de compra
    async getOrdenesCompra() {
        return this.allQuery(`
            SELECT 
                oc.*,
                pr.nombre as proveedor_nombre,
                pr.contacto as proveedor_contacto,
                COUNT(ocd.id) as total_items,
                COALESCE(SUM(ocd.cantidad_pedida), 0) as total_cantidad
            FROM ordenes_compra oc
            JOIN proveedores pr ON oc.proveedor_id = pr.id
            LEFT JOIN orden_compra_detalles ocd ON oc.id = ocd.orden_id
            GROUP BY oc.id
            ORDER BY oc.created_at DESC
        `);
    }

    async getOrdenesCompraByProveedor(proveedorId) {
        return this.allQuery(`
            SELECT 
                oc.*,
                pr.nombre as proveedor_nombre,
                pr.contacto as proveedor_contacto,
                COUNT(ocd.id) as total_items,
                COALESCE(SUM(ocd.cantidad_pedida), 0) as total_cantidad,
                COALESCE(SUM(ocd.cantidad_pedida * ocd.precio_unitario), 0) as total_valor
            FROM ordenes_compra oc
            JOIN proveedores pr ON oc.proveedor_id = pr.id
            LEFT JOIN orden_compra_detalles ocd ON oc.id = ocd.orden_id
            WHERE oc.proveedor_id = ?
            GROUP BY oc.id
            ORDER BY oc.created_at DESC
        `, [proveedorId]);
    }

    // Actualizar estado de orden de compra
    async actualizarOrdenCompra(id, estado, fechaEntrega = null) {
        let query = 'UPDATE ordenes_compra SET estado = ?, updated_at = CURRENT_TIMESTAMP';
        let params = [estado];

        if (fechaEntrega && estado === 'recibida') {
            query += ', fecha_entrega_real = ?';
            params.push(fechaEntrega);
        }

        query += ' WHERE id = ?';
        params.push(id);

        return this.runQuery(query, params);
    }

    // Análisis completo de inventario
    async getAnalisisInventario() {
        const estadisticas = await this.getQuery(`
            SELECT 
                COUNT(*) as total_productos,
                SUM(CASE WHEN stock_actual <= stock_minimo THEN 1 ELSE 0 END) as productos_stock_bajo,
                SUM(CASE WHEN stock_actual = 0 THEN 1 ELSE 0 END) as productos_sin_stock,
                SUM(stock_actual * precio_compra) as valor_inventario_compra,
                SUM(stock_actual * precio_venta) as valor_inventario_venta,
                AVG(stock_actual) as promedio_stock
            FROM productos 
            WHERE activo = 1
        `);

        const rotacion = await this.allQuery(`
            SELECT 
                p.id,
                p.nombre,
                p.stock_actual,
                COALESCE(SUM(pd.cantidad), 0) as vendido_30dias,
                CASE 
                    WHEN p.stock_actual > 0 AND SUM(pd.cantidad) > 0 
                    THEN ROUND(p.stock_actual / (SUM(pd.cantidad) / 30.0), 1)
                    ELSE 999
                END as dias_stock,
                CASE 
                    WHEN p.stock_actual > 0 AND SUM(pd.cantidad) > 0 
                    THEN ROUND((SUM(pd.cantidad) / 30.0) / p.stock_actual * 100, 1)
                    ELSE 0
                END as rotacion_porcentaje
            FROM productos p
            LEFT JOIN pedido_detalles pd ON p.id = pd.producto_id
            LEFT JOIN pedidos pe ON pd.pedido_id = pe.id 
                AND pe.fecha_pedido >= DATE('now', '-30 days')
                AND pe.estado IN ('entregado', 'confirmado')
            WHERE p.activo = 1
            GROUP BY p.id, p.nombre, p.stock_actual
            ORDER BY dias_stock ASC
            LIMIT 20
        `);

        return {
            estadisticas,
            productos_rotacion_lenta: rotacion.filter(p => p.dias_stock > 60),
            productos_rotacion_rapida: rotacion.filter(p => p.dias_stock <= 30),
            productos_sin_movimiento: rotacion.filter(p => p.vendido_30dias === 0)
        };
    }

    // Actualizar stock mínimo
    async actualizarStockMinimo(productoId, stockMinimo) {
        return this.runQuery(
            'UPDATE productos SET stock_minimo = ? WHERE id = ?',
            [stockMinimo, productoId]
        );
    }

    // Registrar movimiento de inventario
    async registrarMovimientoInventario(movimiento) {
        return this.runQuery(`
            INSERT INTO inventario_movimientos (
                producto_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo,
                motivo, referencia, usuario
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            movimiento.producto_id, movimiento.tipo_movimiento,
            movimiento.cantidad, movimiento.stock_anterior || 0, movimiento.stock_nuevo || 0,
            movimiento.motivo, movimiento.referencia, movimiento.usuario
        ]);
    }

    // Obtener movimientos de inventario
    async getMovimientosInventario(filtros = {}) {
        let whereClause = 'WHERE 1=1';
        let params = [];

        if (filtros.producto_id) {
            whereClause += ' AND m.producto_id = ?';
            params.push(filtros.producto_id);
        }

        if (filtros.tipo_movimiento) {
            whereClause += ' AND m.tipo_movimiento = ?';
            params.push(filtros.tipo_movimiento);
        }

        if (filtros.fecha_desde) {
            whereClause += ' AND DATE(m.fecha_movimiento) >= ?';
            params.push(filtros.fecha_desde);
        }

        if (filtros.fecha_hasta) {
            whereClause += ' AND DATE(m.fecha_movimiento) <= ?';
            params.push(filtros.fecha_hasta);
        }

        return this.allQuery(`
            SELECT 
                m.*,
                p.nombre as producto_nombre,
                c.nombre as categoria
            FROM inventario_movimientos m
            JOIN productos p ON m.producto_id = p.id
            LEFT JOIN categorias c ON p.categoria_id = c.id
            ${whereClause}
            ORDER BY m.fecha_movimiento DESC
            LIMIT ${filtros.limite || 100}
        `, params);
    }

    // Métodos de consulta
    async runQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    async getQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async allQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Métodos específicos para la floristería
    async getProductos() {
        return this.allQuery(`
            SELECT p.*, c.nombre as categoria_nombre, c.icono as categoria_icono
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.activo = TRUE
            ORDER BY c.nombre, p.nombre
        `);
    }

    async getClientes() {
        return this.allQuery(`
            SELECT * FROM clientes 
            WHERE activo = TRUE 
            ORDER BY nombre, apellidos
        `);
    }

    async getEventos() {
        return this.allQuery(`
            SELECT * FROM eventos 
            WHERE activo = TRUE 
            ORDER BY fecha_inicio DESC
        `);
    }

    async getPedidos() {
        return this.allQuery(`
            SELECT p.*, c.nombre as cliente_nombre, c.apellidos as cliente_apellidos,
                   e.nombre as evento_nombre
            FROM pedidos p
            LEFT JOIN clientes c ON p.cliente_id = c.id
            LEFT JOIN eventos e ON p.evento_id = e.id
            ORDER BY p.fecha_pedido DESC
        `);
    }

    async getEstadisticasGenerales() {
        const stats = {};
        
        stats.totalProductos = (await this.getQuery("SELECT COUNT(*) as count FROM productos WHERE activo = TRUE")).count;
        stats.totalClientes = (await this.getQuery("SELECT COUNT(*) as count FROM clientes WHERE activo = TRUE")).count;
        stats.pedidosPendientes = (await this.getQuery("SELECT COUNT(*) as count FROM pedidos WHERE estado IN ('pendiente', 'confirmado', 'preparando')")).count;
        stats.eventosActivos = (await this.getQuery("SELECT COUNT(*) as count FROM eventos WHERE activo = TRUE AND fecha_fin >= date('now')")).count;
        
        // Productos con stock bajo
        stats.stockBajo = await this.allQuery(`
            SELECT nombre, stock_actual, stock_minimo 
            FROM productos 
            WHERE stock_actual <= stock_minimo AND activo = TRUE
        `);
        
        // Ventas del mes actual
        const ventasMes = await this.getQuery(`
            SELECT COALESCE(SUM(total), 0) as total 
            FROM pedidos 
            WHERE estado = 'entregado' 
            AND strftime('%Y-%m', fecha_pedido) = strftime('%Y-%m', 'now')
        `);
        stats.ventasMesActual = ventasMes.total;
        
        return stats;
    }

    // ========== MÉTODOS PARA REPORTES ==========
    
    async getVentasReporte(dias = 30) {
        // Ventas por día en el período especificado
        const ventasDiarias = await this.allQuery(`
            SELECT 
                DATE(fecha_pedido) as fecha,
                COUNT(*) as pedidos,
                COALESCE(SUM(total), 0) as total_ventas,
                COALESCE(SUM(subtotal), 0) as subtotal,
                COALESCE(AVG(total), 0) as ticket_promedio
            FROM pedidos 
            WHERE estado IN ('entregado', 'confirmado') 
            AND DATE(fecha_pedido) >= DATE('now', '-' || ? || ' days')
            GROUP BY DATE(fecha_pedido)
            ORDER BY fecha DESC
        `, [dias]);

        // KPIs del período
        const kpis = await this.getQuery(`
            SELECT 
                COUNT(*) as total_pedidos,
                COALESCE(SUM(total), 0) as total_ventas,
                COALESCE(AVG(total), 0) as ticket_promedio,
                COUNT(DISTINCT cliente_id) as clientes_activos
            FROM pedidos 
            WHERE estado IN ('entregado', 'confirmado')
            AND DATE(fecha_pedido) >= DATE('now', '-' || ? || ' days')
        `, [dias]);

        return {
            ventasDiarias,
            kpis
        };
    }

    async getProductosTopVentas(limite = 10, dias = 30) {
        return this.allQuery(`
            SELECT 
                p.nombre,
                p.codigo_producto,
                c.nombre as categoria,
                c.icono as categoria_icono,
                SUM(pd.cantidad) as cantidad_vendida,
                SUM(pd.subtotal) as total_ventas,
                AVG(pd.precio_unitario) as precio_promedio,
                COUNT(DISTINCT pe.id) as pedidos_count
            FROM pedido_detalles pd
            JOIN productos p ON pd.producto_id = p.id
            JOIN categorias c ON p.categoria_id = c.id
            JOIN pedidos pe ON pd.pedido_id = pe.id
            WHERE pe.estado IN ('entregado', 'confirmado')
            AND DATE(pe.fecha_pedido) >= DATE('now', '-' || ? || ' days')
            GROUP BY p.id
            ORDER BY cantidad_vendida DESC
            LIMIT ?
        `, [dias, limite]);
    }

    async getEstadosPedidos() {
        return this.allQuery(`
            SELECT 
                estado,
                COUNT(*) as cantidad,
                COALESCE(SUM(total), 0) as valor_total
            FROM pedidos 
            WHERE DATE(fecha_pedido) >= DATE('now', '-30 days')
            GROUP BY estado
            ORDER BY cantidad DESC
        `);
    }

    async getClientesPorTipo() {
        return this.allQuery(`
            SELECT 
                tipo_cliente,
                COUNT(*) as cantidad,
                COALESCE(AVG(total_compras), 0) as compra_promedio,
                COALESCE(SUM(total_compras), 0) as total_compras
            FROM clientes 
            WHERE activo = TRUE
            GROUP BY tipo_cliente
            ORDER BY cantidad DESC
        `);
    }

    async getEventosRentables(limite = 5, dias = 365) {
        return this.allQuery(`
            SELECT 
                e.nombre,
                e.tipo_evento,
                e.fecha_inicio,
                e.fecha_fin,
                COUNT(p.id) as pedidos_generados,
                COALESCE(SUM(p.total), 0) as ventas_totales,
                COALESCE(AVG(p.total), 0) as ticket_promedio
            FROM eventos e
            LEFT JOIN pedidos p ON e.id = p.evento_id 
                AND p.estado IN ('entregado', 'confirmado')
                AND DATE(p.fecha_pedido) >= DATE('now', '-' || ? || ' days')
            WHERE e.activo = TRUE
            GROUP BY e.id
            HAVING pedidos_generados > 0
            ORDER BY ventas_totales DESC
            LIMIT ?
        `, [dias, limite]);
    }

    async getRotacionInventario() {
        return this.allQuery(`
            SELECT 
                c.nombre as categoria,
                c.icono,
                COUNT(p.id) as productos_total,
                COALESCE(SUM(CASE WHEN pd.id IS NOT NULL THEN 1 ELSE 0 END), 0) as productos_vendidos,
                COALESCE(SUM(pd.cantidad), 0) as unidades_vendidas,
                COALESCE(SUM(pd.subtotal), 0) as valor_vendido
            FROM categorias c
            LEFT JOIN productos p ON c.id = p.categoria_id AND p.activo = TRUE
            LEFT JOIN pedido_detalles pd ON p.id = pd.producto_id
            LEFT JOIN pedidos pe ON pd.pedido_id = pe.id 
                AND pe.estado IN ('entregado', 'confirmado')
                AND DATE(pe.fecha_pedido) >= DATE('now', '-30 days')
            GROUP BY c.id
            ORDER BY valor_vendido DESC
        `);
    }

    async getDetalleVentas(dias = 30, busqueda = '', limite = 100) {
        let params = [dias];
        let whereClause = `
            WHERE p.estado IN ('entregado', 'confirmado')
            AND DATE(p.fecha_pedido) >= DATE('now', '-' || ? || ' days')
        `;
        
        if (busqueda) {
            whereClause += ` AND (
                c.nombre LIKE '%' || ? || '%' 
                OR p.numero_pedido LIKE '%' || ? || '%'
                OR c.apellidos LIKE '%' || ? || '%'
            )`;
            params.push(busqueda, busqueda, busqueda);
        }

        params.push(limite);

        return this.allQuery(`
            SELECT 
                p.fecha_pedido,
                p.numero_pedido,
                c.nombre || ' ' || COALESCE(c.apellidos, '') as cliente_nombre,
                GROUP_CONCAT(pr.nombre, ', ') as productos,
                p.subtotal,
                p.descuento,
                p.total,
                p.estado,
                (p.total - COALESCE(SUM(pr.precio_compra * pd.cantidad), 0)) as margen
            FROM pedidos p
            LEFT JOIN clientes c ON p.cliente_id = c.id
            LEFT JOIN pedido_detalles pd ON p.id = pd.pedido_id
            LEFT JOIN productos pr ON pd.producto_id = pr.id
            ${whereClause}
            GROUP BY p.id
            ORDER BY p.fecha_pedido DESC
            LIMIT ?
        `, params);
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error cerrando la base de datos:', err);
                } else {
                    console.log('Conexión a la base de datos cerrada');
                }
            });
        }
    }
}

module.exports = FlowerShopDatabase;
