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

            console.log('Datos de ejemplo insertados correctamente');
        } catch (error) {
            console.error('Error insertando datos de ejemplo:', error);
        }
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
