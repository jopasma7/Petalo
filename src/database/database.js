const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class FlowerShopDatabase {
    constructor() {
        this.dbPath = path.join(__dirname, '..', '..', 'data', 'floristeria.db');
        this.db = null;

        const dataDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    }

    async connect() {
        this.db = new Database(this.dbPath);
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('foreign_keys = ON');
        console.log('Conectado a la base de datos SQLite');
        this.initializeTables();
    }

    initializeTables() {
        const tables = [
            `CREATE TABLE IF NOT EXISTS categorias (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL UNIQUE,
                descripcion TEXT,
                icono TEXT DEFAULT '🌸',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
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
                temporada TEXT,
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
            `CREATE TABLE IF NOT EXISTS clientes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                apellidos TEXT,
                telefono TEXT,
                email TEXT,
                direccion TEXT,
                fecha_nacimiento DATE,
                tipo_cliente TEXT DEFAULT 'regular',
                descuento_porcentaje DECIMAL(5,2) DEFAULT 0,
                total_compras DECIMAL(10,2) DEFAULT 0,
                ultima_compra DATE,
                notas TEXT,
                activo BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS eventos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                descripcion TEXT,
                fecha_inicio DATE NOT NULL,
                fecha_fin DATE NOT NULL,
                tipo_evento TEXT,
                demanda_esperada TEXT,
                productos_destacados TEXT,
                descuento_especial DECIMAL(5,2) DEFAULT 0,
                preparacion_dias INTEGER DEFAULT 7,
                notas TEXT,
                activo BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS pedidos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                numero_pedido TEXT UNIQUE NOT NULL,
                cliente_id INTEGER,
                evento_id INTEGER,
                fecha_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_entrega DATE,
                estado TEXT DEFAULT 'pendiente',
                tipo_pedido TEXT DEFAULT 'regular',
                subtotal DECIMAL(10,2) DEFAULT 0,
                descuento DECIMAL(10,2) DEFAULT 0,
                impuestos DECIMAL(10,2) DEFAULT 0,
                total DECIMAL(10,2) DEFAULT 0,
                adelanto DECIMAL(10,2) DEFAULT 0,
                saldo_pendiente DECIMAL(10,2) DEFAULT 0,
                metodo_pago TEXT,
                direccion_entrega TEXT,
                instrucciones_especiales TEXT,
                notas TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (cliente_id) REFERENCES clientes (id),
                FOREIGN KEY (evento_id) REFERENCES eventos (id)
            )`,
            `CREATE TABLE IF NOT EXISTS pedido_detalles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pedido_id INTEGER NOT NULL,
                producto_id INTEGER NOT NULL,
                cantidad INTEGER NOT NULL,
                precio_unitario DECIMAL(10,2) NOT NULL,
                subtotal DECIMAL(10,2) NOT NULL,
                personalizacion TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (pedido_id) REFERENCES pedidos (id) ON DELETE CASCADE,
                FOREIGN KEY (producto_id) REFERENCES productos (id)
            )`,
            `CREATE TABLE IF NOT EXISTS inventario_movimientos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                producto_id INTEGER NOT NULL,
                tipo_movimiento TEXT NOT NULL,
                cantidad INTEGER NOT NULL,
                stock_anterior INTEGER,
                stock_nuevo INTEGER,
                motivo TEXT,
                referencia TEXT,
                fecha_movimiento DATETIME DEFAULT CURRENT_TIMESTAMP,
                usuario TEXT,
                FOREIGN KEY (producto_id) REFERENCES productos (id)
            )`,
            `CREATE TABLE IF NOT EXISTS reservas_eventos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                evento_id INTEGER NOT NULL,
                cliente_id INTEGER NOT NULL,
                producto_id INTEGER NOT NULL,
                cantidad_reservada INTEGER NOT NULL,
                fecha_reserva DATETIME DEFAULT CURRENT_TIMESTAMP,
                estado TEXT DEFAULT 'reservado',
                notas TEXT,
                FOREIGN KEY (evento_id) REFERENCES eventos (id),
                FOREIGN KEY (cliente_id) REFERENCES clientes (id),
                FOREIGN KEY (producto_id) REFERENCES productos (id)
            )`,
            `CREATE TABLE IF NOT EXISTS tipos_cliente (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL UNIQUE,
                color TEXT DEFAULT '#6b7280',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS tipos_evento (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL UNIQUE,
                color TEXT DEFAULT '#6b7280',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS configuracion (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                clave TEXT UNIQUE NOT NULL,
                valor TEXT NOT NULL,
                descripcion TEXT,
                tipo TEXT DEFAULT 'text',
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
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
                condiciones_pago TEXT,
                descuento_proveedor DECIMAL(5,2) DEFAULT 0,
                activo BOOLEAN DEFAULT 1,
                notas TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
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
            `CREATE TABLE IF NOT EXISTS ordenes_compra (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                numero_orden TEXT UNIQUE NOT NULL,
                proveedor_id INTEGER NOT NULL,
                fecha_orden DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_entrega_esperada DATE,
                fecha_entrega_real DATE,
                estado TEXT DEFAULT 'pendiente',
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
            `CREATE TABLE IF NOT EXISTS predicciones_demanda (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                producto_id INTEGER NOT NULL,
                periodo TEXT NOT NULL,
                fecha_inicio DATE NOT NULL,
                fecha_fin DATE NOT NULL,
                demanda_prevista INTEGER NOT NULL,
                demanda_real INTEGER DEFAULT 0,
                confianza DECIMAL(5,2) DEFAULT 0,
                metodo_calculo TEXT,
                parametros_calculo TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (producto_id) REFERENCES productos (id)
            )`,
            `CREATE TABLE IF NOT EXISTS alertas_inventario (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                producto_id INTEGER NOT NULL,
                tipo_alerta TEXT NOT NULL,
                descripcion TEXT NOT NULL,
                nivel_prioridad TEXT DEFAULT 'media',
                fecha_generada DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_vencimiento DATETIME,
                estado TEXT DEFAULT 'activa',
                accion_recomendada TEXT,
                usuario_asignado TEXT,
                fecha_resolucion DATETIME,
                notas_resolucion TEXT,
                FOREIGN KEY (producto_id) REFERENCES productos (id)
            )`
        ];

        for (const sql of tables) {
            this.db.prepare(sql).run();
        }

        // Tipos de cliente por defecto — siempre garantizados
        // Migración: marcar ventas rápidas antiguas que no tienen tipo_pedido
        try {
            this.db.prepare(
                `UPDATE pedidos SET tipo_pedido = 'venta_rapida'
                 WHERE (tipo_pedido IS NULL OR tipo_pedido = '') AND notas = 'Venta rápida'`
            ).run();
        } catch (_) {}

        console.log('Tablas inicializadas correctamente');
    }

    // ─── Core query helpers ───────────────────────────────────────────────────

    runQuery(sql, params = []) {
        const stmt = this.db.prepare(sql);
        const info = stmt.run(params);
        return { id: info.lastInsertRowid, changes: info.changes };
    }

    getQuery(sql, params = []) {
        return this.db.prepare(sql).get(params);
    }

    allQuery(sql, params = []) {
        return this.db.prepare(sql).all(params);
    }

    // ─── Sample data ──────────────────────────────────────────────────────────

    clearAllData() {
        const tables = [
            'inventario_movimientos', 'orden_compra_detalles', 'ordenes_compra',
            'productos_proveedores', 'pedido_detalles', 'pedidos',
            'proveedores', 'clientes', 'eventos', 'productos', 'categorias', 'configuracion'
        ];
        this.db.pragma('foreign_keys = OFF');
        for (const t of tables) {
            try { this.db.prepare(`DELETE FROM ${t}`).run(); } catch (_) {}
            try { this.db.prepare(`DELETE FROM sqlite_sequence WHERE name = '${t}'`).run(); } catch (_) {}
        }
        this.db.pragma('foreign_keys = ON');
        console.log('Todos los datos eliminados correctamente');
    }

    async insertSampleData(lang = 'es') {
        const count = this.getQuery("SELECT COUNT(*) as count FROM productos");
        if (count.count > 0) {
            console.log('La base de datos ya contiene datos de ejemplo');
            return;
        }

        try {
            const isEn = lang === 'en';

            const categorias = isEn ? [
                ['Fresh Flowers',    'Cut fresh flowers',              '🌹'],
                ['Indoor Plants',    'Plants for indoor decoration',   '🌱'],
                ['Outdoor Plants',   'Plants for garden and balcony',  '🌿'],
                ['Planters',         'Containers for plants',          '🏺'],
                ['Accessories',      'Pots, soil, fertilisers',        '🛠️'],
                ['Special Bouquets', 'Bouquets and compositions',      '💐'],
            ] : [
                ['Flores Naturales',  'Flores frescas cortadas',             '🌹'],
                ['Plantas de Interior','Plantas para decoración interior',   '🌱'],
                ['Plantas de Exterior','Plantas para jardín y balcón',       '🌿'],
                ['Jardineras',         'Contenedores para plantas y flores', '🏺'],
                ['Accesorios',         'Macetas, tierra, fertilizantes',     '🛠️'],
                ['Arreglos Especiales','Bouquets y composiciones',           '💐'],
            ];

            for (const [nombre, descripcion, icono] of categorias) {
                this.runQuery(`INSERT INTO categorias (nombre, descripcion, icono) VALUES (?, ?, ?)`, [nombre, descripcion, icono]);
            }

            const productos = isEn ? [
                ['Red Roses',          1, 'Fresh red roses',              2.50, 4.00, 60, 15, 'unit',   'all_year',  1, 7,    'Field Flowers',    'FL001'],
                ['White Roses',        1, 'Elegant white roses',          2.50, 4.00, 50, 10, 'unit',   'all_year',  1, 7,    'Field Flowers',    'FL002'],
                ['Carnations',         1, 'Colourful mixed carnations',   1.50, 2.50, 80, 20, 'unit',   'all_year',  1, 10,   'Field Flowers',    'FL003'],
                ['Sunflowers',         1, 'Large bright sunflowers',      3.00, 5.00, 40,  8, 'unit',   'summer',    1, 5,    'Field Flowers',    'FL004'],
                ['Pothos',             2, 'Easy-care hanging plant',      8.00,15.00, 20,  4, 'unit',   'all_year',  0, null, 'Green Nursery',    'PI001'],
                ['Sansevieria',        2, 'Resilient decorative plant',  12.00,22.00, 15,  3, 'unit',   'all_year',  0, null, 'Green Nursery',    'PI002'],
                ['Geraniums',          3, 'Flowering plants for balconies',6.00,12.00,30,  8, 'unit',   'spring',    0, null, 'Botanical Garden', 'PE001'],
                ['Lavender',           3, 'Perennial aromatic plant',     8.00,16.00, 20,  5, 'unit',   'all_year',  0, null, 'Botanical Garden', 'PE002'],
                ['Small Planter',      4, 'Ceramic planter 20cm',         5.00,12.00, 60, 15, 'unit',   'all_year',  0, null, 'Spanish Ceramics', 'JA001'],
                ['All-purpose Soil',   5, 'Universal plant substrate',    3.00, 6.00, 80, 20, 'bag',    'all_year',  0, null, 'AgriSupply',       'AC001'],
            ] : [
                ['Rosas Rojas',         1, 'Rosas rojas frescas',                 2.50, 4.00,  60, 15, 'unidad', 'todo_año',  1, 7,    'Flores del Campo',  'FL001'],
                ['Rosas Blancas',       1, 'Rosas blancas elegantes',             2.50, 4.00,  50, 10, 'unidad', 'todo_año',  1, 7,    'Flores del Campo',  'FL002'],
                ['Claveles',            1, 'Claveles variados de colores',         1.50, 2.50,  80, 20, 'unidad', 'todo_año',  1, 10,   'Flores del Campo',  'FL003'],
                ['Girasoles',           1, 'Girasoles grandes y brillantes',       3.00, 5.00,  40,  8, 'unidad', 'verano',    1, 5,    'Flores del Campo',  'FL004'],
                ['Pothos',              2, 'Planta colgante de fácil cuidado',     8.00,15.00,  20,  4, 'unidad', 'todo_año',  0, null, 'Vivero Verde',      'PI001'],
                ['Sansevieria',         2, 'Planta resistente y decorativa',      12.00,22.00,  15,  3, 'unidad', 'todo_año',  0, null, 'Vivero Verde',      'PI002'],
                ['Geranios',            3, 'Plantas florales para balcones',       6.00,12.00,  30,  8, 'unidad', 'primavera', 0, null, 'Jardín Botánico',   'PE001'],
                ['Lavanda',             3, 'Planta aromática perenne',             8.00,16.00,  20,  5, 'unidad', 'todo_año',  0, null, 'Jardín Botánico',   'PE002'],
                ['Jardinera Pequeña',   4, 'Jardinera de cerámica 20cm',           5.00,12.00,  60, 15, 'unidad', 'todo_año',  0, null, 'Cerámica Española', 'JA001'],
                ['Tierra Universal',    5, 'Sustrato universal para plantas',      3.00, 6.00,  80, 20, 'saco',   'todo_año',  0, null, 'AgriSupply',        'AC001'],
            ];

            for (const producto of productos) {
                this.runQuery(
                    `INSERT INTO productos (nombre, categoria_id, descripcion, precio_compra, precio_venta,
                     stock_actual, stock_minimo, unidad_medida, temporada, perecedero, dias_caducidad,
                     proveedor, codigo_producto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    producto
                );
            }

            const eventos = isEn ? [
                ['Mother\'s Day',   'High demand for flowers',          '2026-05-10', '2026-05-10', 'Seasonal',    'high',   null, 15, 10, 'Special promotion on roses'],
                ['Valentine\'s Day','Day of love',                      '2027-02-14', '2027-02-14', 'Seasonal',    'high',   null, 20,  7, 'Extra stock of red and white roses'],
                ['Spring Opening',  'Summer flower season',             '2026-06-01', '2026-08-31', 'Seasonal',    'medium', null,  5, 14, 'Promote sunflowers and geraniums'],
            ] : [
                ['Día de las Madres', 'Alta demanda de flores',         '2026-05-03', '2026-05-03', 'Temporal',    'alta',   null, 15, 10, 'Promoción especial en rosas'],
                ['San Valentín 2027', 'Día de los enamorados',          '2027-02-14', '2027-02-14', 'Temporal',    'alta',   null, 20,  7, 'Stock extra de rosas rojas y blancas'],
                ['Verano 2026',       'Temporada de flores de verano',  '2026-06-21', '2026-09-22', 'Temporal',    'media',  null,  5, 14, 'Potenciar girasoles y geranios'],
            ];

            for (const evento of eventos) {
                this.runQuery(
                    `INSERT INTO eventos (nombre, descripcion, fecha_inicio, fecha_fin, tipo_evento,
                     demanda_esperada, productos_destacados, descuento_especial, preparacion_dias, notas)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    evento
                );
            }

            const clientes = isEn ? [
                ['Emma',    'Johnson',    '555 123 4567', 'emma@email.com',    '12 Main Street, New York',  'Regular',  0.00],
                ['James',   'Williams',   '555 234 5678', 'james@email.com',   '45 Central Ave, New York',  'VIP',     10.00],
                ['Sophie',  'Brown',      '555 345 6789', 'sophie@email.com',  '7 Park Road, New York',     'Frequent', 5.00],
                ['GreenCo', 'Events Ltd', '555 456 7890', 'orders@greenco.com','Industry Park 22, New York','Corporate',8.00],
            ] : [
                ['María',   'González López',  '612 345 678', 'maria@email.com',   'Calle Principal 12, Madrid',    'Regular',   0.00],
                ['Juan',    'Pérez Martín',    '623 456 789', 'juan@email.com',    'Avenida Central 45, Madrid',    'VIP',       10.00],
                ['Ana',     'Rodríguez Silva', '634 567 890', 'ana@email.com',     'Plaza Mayor 7, Madrid',         'Frecuente', 5.00],
                ['Empresa', 'Flores S.L.',     '910 123 456', 'compras@flores.es', 'Polígono Industrial 22, Madrid','Empresa',   8.00],
            ];

            for (const cliente of clientes) {
                this.runQuery(
                    `INSERT INTO clientes (nombre, apellidos, telefono, email, direccion, tipo_cliente, descuento_porcentaje)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    cliente
                );
            }

            const configuracion = [
                ['iva_porcentaje', isEn ? '0' : '21', 'Tax percentage'],
                ['empresa_nombre', isEn ? 'My Flower Shop' : 'Mi Floristería', 'Business name'],
                ['empresa_direccion', '', 'Address'],
                ['empresa_telefono', '', 'Phone'],
                ['dias_alerta_caducidad', '3', 'Days ahead for expiry alerts'],
                ['backup_automatico', 'true', 'Enable automatic backup'],
            ];

            for (const [clave, valor, descripcion] of configuracion) {
                this.runQuery(`INSERT INTO configuracion (clave, valor, descripcion) VALUES (?, ?, ?)`, [clave, valor, descripcion]);
            }

            const tiposCliente = isEn ? [
                ['New',        '#6b7280'],
                ['Regular',    '#3b82f6'],
                ['Frequent',   '#f59e0b'],
                ['VIP',        '#8b5cf6'],
                ['Corporate',  '#0ea5e9'],
                ['Wholesale',  '#10b981'],
            ] : [
                ['Nuevo',      '#6b7280'],
                ['Regular',    '#3b82f6'],
                ['Frecuente',  '#f59e0b'],
                ['VIP',        '#8b5cf6'],
                ['Empresa',    '#0ea5e9'],
                ['Mayorista',  '#10b981'],
            ];
            for (const [nombre, color] of tiposCliente) {
                this.db.prepare(`INSERT OR IGNORE INTO tipos_cliente (nombre, color) VALUES (?, ?)`).run(nombre, color);
            }

            const tiposEvento = isEn ? [
                ['Wedding',    '#ec4899'],
                ['Birthday',   '#f59e0b'],
                ['Baptism',    '#0ea5e9'],
                ['Funeral',    '#6b7280'],
                ['Corporate',  '#3b82f6'],
                ['Seasonal',   '#10b981'],
            ] : [
                ['Boda',       '#ec4899'],
                ['Cumpleaños', '#f59e0b'],
                ['Comunión',   '#8b5cf6'],
                ['Bautizo',    '#0ea5e9'],
                ['Funeral',    '#6b7280'],
                ['Corporativo','#3b82f6'],
                ['Temporal',   '#10b981'],
            ];
            for (const [nombre, color] of tiposEvento) {
                this.db.prepare(`INSERT OR IGNORE INTO tipos_evento (nombre, color) VALUES (?, ?)`).run(nombre, color);
            }

            this.insertSampleOrders();
            this.insertSampleProviders();
            this.insertSampleProductProviders();
            this.insertSampleMovements();

            console.log('Datos de ejemplo insertados correctamente');
        } catch (error) {
            console.error('Error insertando datos de ejemplo:', error);
        }
    }

    insertSampleOrders() {
        const pedidosCount = this.getQuery("SELECT COUNT(*) as count FROM pedidos");
        if (pedidosCount.count > 0) return;

        const clientes = this.allQuery("SELECT id FROM clientes ORDER BY id LIMIT 3");
        const productos = this.allQuery("SELECT id, precio_venta FROM productos ORDER BY id LIMIT 10");
        if (clientes.length === 0 || productos.length === 0) return;

        const pedidosEjemplo = [
            { num: 'FL1675089600001', ci: 0, ei: null, dias: 5, estado: 'aprobado',  tipo: 'regular', sub: 45.00, desc: 0, total: 45.00, adelanto: 0, saldo: 45.00, pago: 'efectivo', prods: [{pi: 0, q: 3}, {pi: 1, q: 2}] },
            { num: 'FL1675089600002', ci: 1, ei: null, dias: 8, estado: 'aprobado',  tipo: 'regular', sub: 78.50, desc: 5.00, total: 73.50, adelanto: 20, saldo: 53.50, pago: 'tarjeta', prods: [{pi: 2, q: 1}, {pi: 3, q: 4}] },
            { num: 'FL1675089600003', ci: 2, ei: null, dias: 12, estado: 'aprobado', tipo: 'regular', sub: 92.00, desc: 0, total: 92.00, adelanto: 30, saldo: 62.00, pago: 'transferencia', prods: [{pi: 4, q: 2}, {pi: 5, q: 1}] },
            { num: 'FL1675089600004', ci: 0, ei: null, dias: 15, estado: 'aprobado', tipo: 'regular', sub: 125.75, desc: 12.58, total: 113.17, adelanto: 50, saldo: 63.17, pago: 'mixto', prods: [{pi: 6, q: 5}, {pi: 7, q: 2}] },
            { num: 'FL1675089600005', ci: 1, ei: null, dias: 2, estado: 'pendiente', tipo: 'regular', sub: 67.25, desc: 0, total: 67.25, adelanto: 0, saldo: 67.25, pago: 'efectivo', prods: [{pi: 8, q: 3}, {pi: 9, q: 1}] }
        ];

        for (const p of pedidosEjemplo) {
            try {
                const fecha = new Date(Date.now() - p.dias * 86400000).toISOString();
                const r = this.runQuery(
                    `INSERT INTO pedidos (numero_pedido, cliente_id, evento_id, fecha_pedido, fecha_entrega,
                     estado, tipo_pedido, subtotal, descuento, total, adelanto, saldo_pendiente, metodo_pago)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [p.num, clientes[p.ci].id, p.ei, fecha,
                     new Date(Date.now() - (p.dias - 2) * 86400000).toISOString().split('T')[0],
                     p.estado, p.tipo, p.sub, p.desc, p.total, p.adelanto, p.saldo, p.pago]
                );
                for (const d of p.prods) {
                    if (!productos[d.pi]) continue;
                    const pv = productos[d.pi].precio_venta;
                    this.runQuery(
                        `INSERT INTO pedido_detalles (pedido_id, producto_id, cantidad, precio_unitario, subtotal)
                         VALUES (?, ?, ?, ?, ?)`,
                        [r.id, productos[d.pi].id, d.q, pv, d.q * pv]
                    );
                }
            } catch (e) {
                console.error('Error insertando pedido de ejemplo:', e);
            }
        }
        console.log('Pedidos de ejemplo insertados correctamente');
    }

    insertSampleProviders() {
        const count = this.getQuery("SELECT COUNT(*) as count FROM proveedores");
        if (count.count > 0) return;

        const proveedores = [
            ['Flores del Campo S.L.', 'María García', '+34 91 123 4567', 'pedidos@floresdelcampo.es', 'Calle de las Flores, 15', 'Madrid', '28001', '30 días', 5.0, 'Proveedor principal de flores frescas'],
            ['Viveros Barcelona', 'Josep Martín', '+34 93 234 5678', 'comercial@viverosbarcelona.com', 'Avda. Catalunya, 42', 'Barcelona', '08001', '45 días', 3.5, 'Especialistas en plantas de interior'],
            ['Jardinería Valencia', 'Carmen López', '+34 96 345 6789', 'info@jardineriavalencia.es', 'Plaza del Jardín, 8', 'Valencia', '46001', '60 días', 7.0, 'Accesorios y herramientas']
        ];

        for (const p of proveedores) {
            try {
                this.runQuery(`
                    INSERT INTO proveedores (nombre, contacto, telefono, email, direccion, ciudad,
                        codigo_postal, condiciones_pago, descuento_proveedor, notas)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, p);
            } catch (e) {
                console.error('Error insertando proveedor:', e);
            }
        }
        console.log('Proveedores de ejemplo insertados correctamente');
    }

    insertSampleProductProviders() {
        const productos = this.allQuery("SELECT id FROM productos LIMIT 10");
        const proveedores = this.allQuery("SELECT id FROM proveedores");
        if (productos.length === 0 || proveedores.length === 0) return;

        productos.forEach((producto, index) => {
            const proveedor = proveedores[index % proveedores.length];
            try {
                this.runQuery(`
                    INSERT INTO productos_proveedores (producto_id, proveedor_id, codigo_proveedor,
                        precio_compra, cantidad_minima, tiempo_entrega_dias, es_proveedor_principal)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [producto.id, proveedor.id, `PROV-${proveedor.id}-${producto.id}`,
                     Math.round((Math.random() * 10 + 5) * 100) / 100,
                     Math.floor(Math.random() * 5) + 1,
                     Math.floor(Math.random() * 10) + 3, 1]
                );
            } catch (e) {
                console.error('Error insertando relación producto-proveedor:', e);
            }
        });
        console.log('Relaciones productos-proveedores insertadas correctamente');
    }

    insertSampleMovements() {
        const productos = this.allQuery("SELECT id, stock_actual FROM productos LIMIT 3");
        if (productos.length === 0) return;

        const movimientos = [
            { p: 0, tipo: 'entrada', qty: 20, motivo: 'Compra inicial', ref: 'COMP-001', dias: 5 },
            { p: 1, tipo: 'salida', qty: 5, motivo: 'Venta', ref: 'VENTA-001', dias: 3 },
            { p: 2, tipo: 'ajuste', qty: -2, motivo: 'Producto dañado', ref: 'AJUSTE-001', dias: 2 }
        ];

        for (const m of movimientos) {
            const prod = productos[m.p];
            if (!prod) continue;
            try {
                const fecha = new Date(Date.now() - m.dias * 86400000).toISOString();
                this.runQuery(`
                    INSERT INTO inventario_movimientos (producto_id, tipo_movimiento, cantidad,
                        stock_anterior, stock_nuevo, motivo, referencia, usuario, fecha_movimiento)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [prod.id, m.tipo, m.qty, prod.stock_actual, prod.stock_actual + m.qty,
                     m.motivo, m.ref, 'Sistema', fecha]
                );
            } catch (e) {
                console.error('Error insertando movimiento:', e);
            }
        }
        console.log('Movimientos de inventario de ejemplo insertados correctamente');
    }

    // ─── Inventory advanced ───────────────────────────────────────────────────

    getAlertasStock() {
        return this.allQuery(`
            SELECT p.id, p.nombre, p.stock_actual, p.stock_minimo, p.precio_venta,
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
                END, p.stock_actual ASC`);
    }

    getPrediccionDemanda(productoId = null, dias = 30) {
        let sql = `
            SELECT p.id, p.nombre, p.stock_actual,
                COALESCE(AVG(pd.cantidad), 0) as promedio_diario,
                COALESCE(AVG(pd.cantidad) * ?, 0) as demanda_prevista,
                COALESCE(MAX(pd.cantidad), 0) as pico_maximo,
                COUNT(pd.id) as dias_con_ventas,
                p.stock_actual - COALESCE(AVG(pd.cantidad) * ?, 0) as stock_proyectado
            FROM productos p
            LEFT JOIN pedido_detalles pd ON p.id = pd.producto_id
            LEFT JOIN pedidos pe ON pd.pedido_id = pe.id
            WHERE pe.fecha_pedido >= DATE('now', '-' || ? || ' days')
                AND pe.estado IN ('aprobado')`;
        const params = [dias, dias, dias];
        if (productoId) { sql += ' AND pd.producto_id = ?'; params.push(productoId); }
        sql += ' GROUP BY p.id, p.nombre, p.stock_actual HAVING p.stock_actual > 0 ORDER BY demanda_prevista DESC';
        return this.allQuery(sql, params);
    }

    getProveedores() {
        return this.allQuery(`
            SELECT p.*, COUNT(pp.id) as productos_suministrados,
                COALESCE(AVG(oc.total), 0) as promedio_pedidos
            FROM proveedores p
            LEFT JOIN productos_proveedores pp ON p.id = pp.proveedor_id AND pp.activo = 1
            LEFT JOIN ordenes_compra oc ON p.id = oc.proveedor_id
                AND oc.fecha_orden >= DATE('now', '-90 days')
            WHERE p.activo = 1
            GROUP BY p.id ORDER BY p.nombre`);
    }

    crearProveedor(proveedor) {
        return this.runQuery(`
            INSERT INTO proveedores (nombre, contacto, telefono, email, direccion, ciudad,
                codigo_postal, pais, condiciones_pago, descuento_proveedor, notas)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [proveedor.nombre, proveedor.contacto, proveedor.telefono, proveedor.email,
             proveedor.direccion, proveedor.ciudad, proveedor.codigo_postal,
             proveedor.pais || 'España', proveedor.condiciones_pago,
             proveedor.descuento_proveedor || 0, proveedor.notas]);
    }

    actualizarProveedor(id, proveedor) {
        return this.runQuery(`
            UPDATE proveedores SET nombre=?, contacto=?, telefono=?, email=?, direccion=?,
                ciudad=?, codigo_postal=?, pais=?, condiciones_pago=?, descuento_proveedor=?,
                notas=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
            [proveedor.nombre, proveedor.contacto, proveedor.telefono, proveedor.email,
             proveedor.direccion, proveedor.ciudad, proveedor.codigo_postal, proveedor.pais,
             proveedor.condiciones_pago, proveedor.descuento_proveedor, proveedor.notas, id]);
    }

    eliminarProveedor(id) {
        return this.runQuery('UPDATE proveedores SET activo = 0 WHERE id = ?', [id]);
    }

    getProductosVencimiento(dias = 30) {
        return this.allQuery(`
            SELECT p.id, p.nombre, p.stock_actual, p.fecha_vencimiento, c.nombre as categoria,
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
                AND p.stock_actual > 0 AND p.activo = 1
            ORDER BY p.fecha_vencimiento ASC`, [dias]);
    }

    generarOrdenCompra(productos) {
        const numeroOrden = 'OC' + Date.now();
        const proveedoresMap = new Map();

        for (const producto of productos) {
            const proveedorInfo = this.getQuery(`
                SELECT pp.proveedor_id, pp.precio_compra, pr.nombre as proveedor_nombre
                FROM productos_proveedores pp
                JOIN proveedores pr ON pp.proveedor_id = pr.id
                WHERE pp.producto_id = ? AND pp.es_proveedor_principal = 1 AND pp.activo = 1
                LIMIT 1`, [producto.producto_id]);

            if (proveedorInfo) {
                if (!proveedoresMap.has(proveedorInfo.proveedor_id)) {
                    proveedoresMap.set(proveedorInfo.proveedor_id, {
                        proveedor_id: proveedorInfo.proveedor_id,
                        proveedor_nombre: proveedorInfo.proveedor_nombre,
                        productos: []
                    });
                }
                proveedoresMap.get(proveedorInfo.proveedor_id).productos.push({
                    ...producto, precio_compra: proveedorInfo.precio_compra
                });
            }
        }

        const ordenesCreadas = [];
        for (const [proveedorId, data] of proveedoresMap) {
            const numeroOrdenProveedor = `${numeroOrden}-${proveedorId}`;
            let subtotal = 0;

            const ordenResult = this.runQuery(`
                INSERT INTO ordenes_compra (numero_orden, proveedor_id, fecha_entrega_esperada,
                    subtotal, total, estado, created_by)
                VALUES (?, ?, DATE('now', '+7 days'), 0, 0, 'pendiente', 'Sistema')`,
                [numeroOrdenProveedor, proveedorId]);

            for (const prod of data.productos) {
                const lineTotal = prod.cantidad * prod.precio_compra;
                subtotal += lineTotal;
                this.runQuery(`
                    INSERT INTO orden_compra_detalles (orden_id, producto_id, cantidad_pedida,
                        precio_unitario, subtotal)
                    VALUES (?, ?, ?, ?, ?)`,
                    [ordenResult.id, prod.producto_id, prod.cantidad, prod.precio_compra, lineTotal]);
            }

            this.runQuery(
                'UPDATE ordenes_compra SET subtotal = ?, total = ? WHERE id = ?',
                [subtotal, subtotal, ordenResult.id]
            );

            ordenesCreadas.push({
                id: ordenResult.id, numero_orden: numeroOrdenProveedor,
                proveedor: data.proveedor_nombre, total: subtotal,
                productos: data.productos.length
            });
        }
        return ordenesCreadas;
    }

    crearOrdenDirecta({ proveedor_id, fecha_orden, estado = 'pendiente', notas = null, items = [] }) {
        const numeroOrden = 'OC-' + Date.now();
        const result = this.runQuery(`
            INSERT INTO ordenes_compra (numero_orden, proveedor_id, fecha_orden, subtotal, total,
                estado, notas, created_by)
            VALUES (?, ?, ?, 0, 0, ?, ?, 'Sistema')`,
            [numeroOrden, proveedor_id, fecha_orden, estado, notas]);

        let total = 0;
        for (const item of items) {
            const producto = this.getQuery(`SELECT precio_compra FROM productos WHERE id = ?`, [item.producto_id]);
            const precio = item.precio_unitario || producto?.precio_compra || 0;
            const subtotal = precio * item.cantidad;
            total += subtotal;
            this.runQuery(`
                INSERT INTO orden_compra_detalles (orden_id, producto_id, cantidad_pedida, precio_unitario, subtotal)
                VALUES (?, ?, ?, ?, ?)`,
                [result.id, item.producto_id, item.cantidad, precio, subtotal]);
        }
        if (total > 0) {
            this.runQuery(`UPDATE ordenes_compra SET subtotal = ?, total = ? WHERE id = ?`, [total, total, result.id]);
        }

        return { id: result.id, numero_orden: numeroOrden };
    }

    getOrdenesCompra() {
        return this.allQuery(`
            SELECT oc.*, pr.nombre as proveedor_nombre, pr.contacto as proveedor_contacto,
                COUNT(ocd.id) as total_items,
                COALESCE(SUM(ocd.cantidad_pedida), 0) as total_cantidad
            FROM ordenes_compra oc
            JOIN proveedores pr ON oc.proveedor_id = pr.id
            LEFT JOIN orden_compra_detalles ocd ON oc.id = ocd.orden_id
            GROUP BY oc.id ORDER BY oc.created_at DESC`);
    }

    getOrdenesCompraByProveedor(proveedorId) {
        return this.allQuery(`
            SELECT oc.*, pr.nombre as proveedor_nombre, pr.contacto as proveedor_contacto,
                COUNT(ocd.id) as total_items,
                COALESCE(SUM(ocd.cantidad_pedida), 0) as total_cantidad,
                COALESCE(SUM(ocd.cantidad_pedida * ocd.precio_unitario), 0) as total_valor
            FROM ordenes_compra oc
            JOIN proveedores pr ON oc.proveedor_id = pr.id
            LEFT JOIN orden_compra_detalles ocd ON oc.id = ocd.orden_id
            WHERE oc.proveedor_id = ?
            GROUP BY oc.id ORDER BY oc.created_at DESC`, [proveedorId]);
    }

    getDetallesOrden(ordenId) {
        return this.allQuery(`
            SELECT ocd.*, p.nombre as producto_nombre, p.codigo_producto
            FROM orden_compra_detalles ocd
            JOIN productos p ON ocd.producto_id = p.id
            WHERE ocd.orden_id = ?
            ORDER BY p.nombre`, [ordenId]);
    }

    actualizarOrdenCompra(id, estado, fechaEntrega = null) {
        const ordenActual = this.getQuery(`SELECT estado FROM ordenes_compra WHERE id = ?`, [id]);
        let query = 'UPDATE ordenes_compra SET estado = ?, updated_at = CURRENT_TIMESTAMP';
        const params = [estado];
        if (estado === 'recibida') { query += ', fecha_entrega_real = CURRENT_DATE'; }
        query += ' WHERE id = ?';
        params.push(id);
        this.runQuery(query, params);

        // Incrementar stock solo la primera vez que se marca como recibida
        if (estado === 'recibida' && ordenActual && ordenActual.estado !== 'recibida') {
            const detalles = this.allQuery(
                `SELECT producto_id, cantidad_pedida FROM orden_compra_detalles WHERE orden_id = ?`, [id]
            );
            for (const d of detalles) {
                const prod = this.getQuery('SELECT stock_actual FROM productos WHERE id = ?', [d.producto_id]);
                const stockAnterior = prod ? prod.stock_actual : 0;
                const stockNuevo = stockAnterior + d.cantidad_pedida;
                this.runQuery(
                    `UPDATE productos SET stock_actual = stock_actual + ? WHERE id = ?`,
                    [d.cantidad_pedida, d.producto_id]
                );
                this._insertMovimiento(d.producto_id, 'entrada', d.cantidad_pedida, stockAnterior, stockNuevo,
                    'Recepción de orden de compra', `Orden #${id}`);
            }
        }
    }

    getAnalisisInventario() {
        const estadisticas = this.getQuery(`
            SELECT COUNT(*) as total_productos,
                SUM(CASE WHEN stock_actual <= stock_minimo THEN 1 ELSE 0 END) as productos_stock_bajo,
                SUM(CASE WHEN stock_actual = 0 THEN 1 ELSE 0 END) as productos_sin_stock,
                SUM(stock_actual * precio_compra) as valor_inventario_compra,
                SUM(stock_actual * precio_venta) as valor_inventario_venta,
                AVG(stock_actual) as promedio_stock
            FROM productos WHERE activo = 1`);

        const rotacion = this.allQuery(`
            SELECT p.id, p.nombre, p.stock_actual,
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
                AND pe.estado IN ('aprobado')
            WHERE p.activo = 1
            GROUP BY p.id, p.nombre, p.stock_actual
            ORDER BY dias_stock ASC LIMIT 20`);

        return {
            estadisticas,
            productos_rotacion_lenta: rotacion.filter(p => p.dias_stock > 60),
            productos_rotacion_rapida: rotacion.filter(p => p.dias_stock <= 30),
            productos_sin_movimiento: rotacion.filter(p => p.vendido_30dias === 0)
        };
    }

    actualizarStockMinimo(productoId, stockMinimo) {
        return this.runQuery('UPDATE productos SET stock_minimo = ? WHERE id = ?', [stockMinimo, productoId]);
    }

    _insertMovimiento(productoId, tipo, cantidad, stockAnterior, stockNuevo, motivo, referencia) {
        try {
            this.runQuery(`
                INSERT INTO inventario_movimientos (producto_id, tipo_movimiento, cantidad,
                    stock_anterior, stock_nuevo, motivo, referencia, usuario)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'Sistema')`,
                [productoId, tipo, cantidad, stockAnterior, stockNuevo, motivo, referencia]);
        } catch (_) {}
    }

    registrarMovimientoInventario(movimiento) {
        const prod = this.getQuery('SELECT stock_actual FROM productos WHERE id = ?', [movimiento.producto_id]);
        if (!prod) throw new Error('Producto no encontrado');

        const stockAnterior = prod.stock_actual;
        const tipo = (movimiento.tipo_movimiento || '').toLowerCase();
        let delta = movimiento.cantidad;
        if (tipo === 'salida') delta = -Math.abs(delta);
        else if (tipo === 'entrada' || tipo === 'devolucion') delta = Math.abs(delta);
        const stockNuevo = Math.max(0, stockAnterior + delta);

        this.runQuery('UPDATE productos SET stock_actual = ? WHERE id = ?', [stockNuevo, movimiento.producto_id]);

        return this.runQuery(`
            INSERT INTO inventario_movimientos (producto_id, tipo_movimiento, cantidad,
                stock_anterior, stock_nuevo, motivo, referencia, usuario)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [movimiento.producto_id, movimiento.tipo_movimiento, movimiento.cantidad,
             stockAnterior, stockNuevo, movimiento.motivo, movimiento.referencia,
             movimiento.usuario || 'Usuario']);
    }

    getMovimientosInventario(filtros = {}) {
        let where = 'WHERE 1=1';
        const params = [];
        if (filtros.producto_id) { where += ' AND m.producto_id = ?'; params.push(filtros.producto_id); }
        if (filtros.tipo_movimiento) { where += ' AND m.tipo_movimiento = ?'; params.push(filtros.tipo_movimiento); }
        if (filtros.fecha_desde) { where += ' AND DATE(m.fecha_movimiento) >= ?'; params.push(filtros.fecha_desde); }
        if (filtros.fecha_hasta) { where += ' AND DATE(m.fecha_movimiento) <= ?'; params.push(filtros.fecha_hasta); }

        return this.allQuery(`
            SELECT m.*, p.nombre as producto_nombre, c.nombre as categoria
            FROM inventario_movimientos m
            JOIN productos p ON m.producto_id = p.id
            LEFT JOIN categorias c ON p.categoria_id = c.id
            ${where}
            ORDER BY m.fecha_movimiento DESC
            LIMIT ${filtros.limite || 100}`, params);
    }

    // ─── Entity CRUD ──────────────────────────────────────────────────────────

    getProductos() {
        return this.allQuery(`
            SELECT p.id, p.nombre, p.codigo_producto, p.categoria_id, p.descripcion,
                   p.precio_compra, p.precio_venta, p.stock_actual, p.stock_minimo,
                   p.unidad_medida, p.temporada, p.perecedero, p.dias_caducidad,
                   p.proveedor, p.activo, p.created_at, p.updated_at,
                   CASE WHEN p.imagen_url IS NOT NULL THEN 1 ELSE 0 END as tiene_imagen,
                   c.nombre as categoria_nombre, c.icono as categoria_icono
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.activo = 1 ORDER BY c.nombre, p.nombre`);
    }

    getProductoImagen(id) {
        const row = this.getQuery(`SELECT imagen_url FROM productos WHERE id = ?`, [id]);
        return row?.imagen_url || null;
    }

    getClientes() {
        try { this.db.prepare(`ALTER TABLE clientes ADD COLUMN imagen TEXT`).run(); } catch (_) {}
        return this.allQuery(`
            SELECT c.id, c.nombre, c.apellidos, c.telefono, c.email, c.direccion,
                   c.fecha_nacimiento, c.tipo_cliente, c.descuento_porcentaje,
                   c.notas, c.activo, c.created_at, c.updated_at,
                   CASE WHEN c.imagen IS NOT NULL THEN 1 ELSE 0 END as tiene_imagen,
                   COALESCE(SUM(CASE WHEN p.estado = 'aprobado' THEN p.total ELSE 0 END), 0) as total_compras,
                   MAX(p.fecha_pedido) as ultima_compra,
                   COUNT(p.id) as num_encargos
            FROM clientes c
            LEFT JOIN pedidos p ON c.id = p.cliente_id
            WHERE c.activo = 1
            GROUP BY c.id
            ORDER BY c.nombre, c.apellidos`);
    }

    getClienteImagen(id) {
        const row = this.getQuery(`SELECT imagen FROM clientes WHERE id = ?`, [id]);
        return row?.imagen || null;
    }

    getEventos() {
        return this.allQuery(`SELECT * FROM eventos WHERE activo = TRUE ORDER BY fecha_inicio DESC`);
    }

    getPedidos() {
        return this.allQuery(`
            SELECT p.*, c.nombre as cliente_nombre, c.apellidos as cliente_apellidos,
                e.nombre as evento_nombre
            FROM pedidos p
            LEFT JOIN clientes c ON p.cliente_id = c.id
            LEFT JOIN eventos e ON p.evento_id = e.id
            ORDER BY p.fecha_pedido DESC`);
    }

    getDetallesPedido(pedidoId) {
        return this.allQuery(`
            SELECT pd.*, pr.nombre as nombre, pr.nombre as producto_nombre
            FROM pedido_detalles pd
            LEFT JOIN productos pr ON pd.producto_id = pr.id
            WHERE pd.pedido_id = ?`, [pedidoId]);
    }

    getConfiguracion() {
        const rows = this.allQuery(`SELECT clave, valor FROM configuracion`);
        const result = {};
        rows.forEach(r => { result[r.clave] = r.valor; });
        return result;
    }

    setConfiguracion(datos) {
        const upsert = this.db.prepare(
            `INSERT INTO configuracion (clave, valor, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor, updated_at = CURRENT_TIMESTAMP`
        );
        const run = this.db.transaction((obj) => {
            for (const [clave, valor] of Object.entries(obj)) {
                upsert.run(clave, String(valor ?? ''));
            }
        });
        run(datos);
    }

    getEstadisticasGenerales() {
        const stats = {};
        stats.totalProductos = this.getQuery("SELECT COUNT(*) as count FROM productos WHERE activo = TRUE").count;
        stats.totalClientes = this.getQuery("SELECT COUNT(*) as count FROM clientes WHERE activo = TRUE").count;
        stats.pedidosPendientes = this.getQuery("SELECT COUNT(*) as count FROM pedidos WHERE estado = 'pendiente'").count;
        stats.eventosActivos = this.getQuery("SELECT COUNT(*) as count FROM eventos WHERE activo = TRUE AND fecha_fin >= date('now')").count;
        stats.stockBajo = this.allQuery(`SELECT nombre, stock_actual, stock_minimo FROM productos WHERE stock_actual <= stock_minimo AND activo = TRUE`);
        stats.ventasMesActual = this.getQuery(`SELECT COALESCE(SUM(total), 0) as total FROM pedidos WHERE estado = 'aprobado' AND strftime('%Y-%m', fecha_pedido) = strftime('%Y-%m', 'now')`).total;
        stats.ventasHoy = this.getQuery(`SELECT COALESCE(SUM(total), 0) as total FROM pedidos WHERE estado = 'aprobado' AND DATE(fecha_pedido) = DATE('now')`).total;
        return stats;
    }

    // ─── Reports ──────────────────────────────────────────────────────────────

    getVentasReporte(dias = 30) {
        const ventasDiarias = this.allQuery(`
            SELECT DATE(fecha_pedido) as fecha, COUNT(*) as pedidos,
                COALESCE(SUM(total), 0) as total_ventas,
                COALESCE(SUM(subtotal), 0) as subtotal,
                COALESCE(AVG(total), 0) as ticket_promedio
            FROM pedidos
            WHERE estado IN ('aprobado')
                AND DATE(fecha_pedido) >= DATE('now', '-' || ? || ' days')
            GROUP BY DATE(fecha_pedido) ORDER BY fecha DESC`, [dias]);

        const kpis = this.getQuery(`
            SELECT COUNT(*) as total_pedidos, COALESCE(SUM(total), 0) as total_ventas,
                COALESCE(AVG(total), 0) as ticket_promedio,
                COUNT(DISTINCT cliente_id) as clientes_activos
            FROM pedidos
            WHERE estado IN ('aprobado')
                AND DATE(fecha_pedido) >= DATE('now', '-' || ? || ' days')`, [dias]);

        return { ventasDiarias, kpis };
    }

    getProductosTopVentas(limite = 10, dias = 30) {
        return this.allQuery(`
            SELECT p.nombre, p.codigo_producto, c.nombre as categoria, c.icono as categoria_icono,
                SUM(pd.cantidad) as cantidad_vendida, SUM(pd.subtotal) as total_ventas,
                AVG(pd.precio_unitario) as precio_promedio, COUNT(DISTINCT pe.id) as pedidos_count
            FROM pedido_detalles pd
            JOIN productos p ON pd.producto_id = p.id
            JOIN categorias c ON p.categoria_id = c.id
            JOIN pedidos pe ON pd.pedido_id = pe.id
            WHERE pe.estado IN ('aprobado')
                AND DATE(pe.fecha_pedido) >= DATE('now', '-' || ? || ' days')
            GROUP BY p.id ORDER BY cantidad_vendida DESC LIMIT ?`, [dias, limite]);
    }

    getEstadosPedidos() {
        return this.allQuery(`
            SELECT estado, COUNT(*) as cantidad, COALESCE(SUM(total), 0) as valor_total
            FROM pedidos WHERE DATE(fecha_pedido) >= DATE('now', '-30 days')
            GROUP BY estado ORDER BY cantidad DESC`);
    }

    getClientesPorTipo() {
        return this.allQuery(`
            SELECT tipo_cliente, COUNT(*) as cantidad,
                COALESCE(AVG(total_compras), 0) as compra_promedio,
                COALESCE(SUM(total_compras), 0) as total_compras
            FROM clientes WHERE activo = TRUE
            GROUP BY tipo_cliente ORDER BY cantidad DESC`);
    }

    getEventosRentables(limite = 5, dias = 365) {
        return this.allQuery(`
            SELECT e.nombre, e.tipo_evento, e.fecha_inicio, e.fecha_fin,
                COUNT(p.id) as pedidos_generados,
                COALESCE(SUM(p.total), 0) as ventas_totales,
                COALESCE(AVG(p.total), 0) as ticket_promedio
            FROM eventos e
            LEFT JOIN pedidos p ON e.id = p.evento_id
                AND p.estado IN ('aprobado')
                AND DATE(p.fecha_pedido) >= DATE('now', '-' || ? || ' days')
            WHERE e.activo = TRUE
            GROUP BY e.id HAVING pedidos_generados > 0
            ORDER BY ventas_totales DESC LIMIT ?`, [dias, limite]);
    }

    getRotacionInventario() {
        return this.allQuery(`
            SELECT c.nombre as categoria, c.icono,
                COUNT(p.id) as productos_total,
                COALESCE(SUM(CASE WHEN pd.id IS NOT NULL THEN 1 ELSE 0 END), 0) as productos_vendidos,
                COALESCE(SUM(pd.cantidad), 0) as unidades_vendidas,
                COALESCE(SUM(pd.subtotal), 0) as valor_vendido
            FROM categorias c
            LEFT JOIN productos p ON c.id = p.categoria_id AND p.activo = TRUE
            LEFT JOIN pedido_detalles pd ON p.id = pd.producto_id
            LEFT JOIN pedidos pe ON pd.pedido_id = pe.id
                AND pe.estado IN ('aprobado')
                AND DATE(pe.fecha_pedido) >= DATE('now', '-30 days')
            GROUP BY c.id ORDER BY valor_vendido DESC`);
    }

    getDetalleVentas(dias = 30, busqueda = '', limite = 100) {
        let where = `WHERE p.estado IN ('aprobado') AND DATE(p.fecha_pedido) >= DATE('now', '-' || ? || ' days')`;
        const params = [dias];
        if (busqueda) {
            where += ` AND (c.nombre LIKE '%' || ? || '%' OR p.numero_pedido LIKE '%' || ? || '%' OR c.apellidos LIKE '%' || ? || '%')`;
            params.push(busqueda, busqueda, busqueda);
        }
        params.push(limite);
        return this.allQuery(`
            SELECT p.fecha_pedido, p.numero_pedido,
                c.nombre || ' ' || COALESCE(c.apellidos, '') as cliente_nombre,
                GROUP_CONCAT(pr.nombre, ', ') as productos,
                p.subtotal, p.descuento, p.total, p.estado,
                (p.total - COALESCE(SUM(pr.precio_compra * pd.cantidad), 0)) as margen
            FROM pedidos p
            LEFT JOIN clientes c ON p.cliente_id = c.id
            LEFT JOIN pedido_detalles pd ON p.id = pd.pedido_id
            LEFT JOIN productos pr ON pd.producto_id = pr.id
            ${where}
            GROUP BY p.id ORDER BY p.fecha_pedido DESC LIMIT ?`, params);
    }

    close() {
        if (this.db) {
            this.db.close();
            console.log('Conexión a la base de datos cerrada');
        }
    }
}

module.exports = FlowerShopDatabase;
