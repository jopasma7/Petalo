# 🌸 Sistema de Gestión de Floristería

**Sistema completo de gestión empresarial especializado para floristerías**, desarrollado con tecnologías modernas para optimizar todas las operaciones del negocio.

![Versión](https://img.shields.io/badge/versión-1.0.0-green.svg)
![Licencia](https://img.shields.io/badge/licencia-MIT-blue.svg)
![Electron](https://img.shields.io/badge/Electron-30.0.0-brightgreen.svg)
![SQLite](https://img.shields.io/badge/SQLite3-5.1.7-orange.svg)

## 📋 Tabla de Contenidos

- [Características Principales](#-características-principales)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Instalación](#-instalación)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Base de Datos](#-base-de-datos)
- [Funcionalidades Destacadas](#-funcionalidades-destacadas)
- [Capturas de Pantalla](#-capturas-de-pantalla)
- [Uso](#-uso)
- [Contribución](#-contribución)

## 🌟 Características Principales

### 📊 Dashboard Inteligente
- **Estadísticas en tiempo real** con métricas clave del negocio
- **Monitoreo automático de inventario** con alertas de stock bajo
- **Panel de ventas del mes** con formateo de moneda
- **Próximos eventos importantes** para planificación anticipada
- **Actividad reciente** del sistema

### � Gestión Avanzada de Productos
- **Catálogo completo** con códigos únicos y categorización
- **Categorías especializadas**: Flores frescas, Plantas, Jardineras, Arreglos, Accesorios
- **Control de stock inteligente** con niveles mínimos configurables
- **Gestión de precios** y códigos de barras
- **Filtros dinámicos** por categoría y disponibilidad
- **CRUD completo** con validaciones

### 👥 Sistema de Clientes CRM
- **Base de datos completa** con información de contacto
- **Historial detallado** de compras y gastos totales
- **Segmentación de clientes** VIP y regulares
- **Gestión de preferencias** y fechas especiales
- **Estadísticas de fidelización**

### 🎉 Gestión de Eventos Estacionales
- **Eventos pre-configurados**: Día de las Madres, Semana Santa, San Valentín, Navidad
- **Productos especializados** para cada temporada
- **Niveles de demanda**: Extrema, Alta, Media
- **Planificación anticipada** con calendario de eventos
- **Jardineras especiales** para Semana Santa
- **Reservas anticipadas** para fechas importantes

### � Sistema Completo de Pedidos
- **Estados de seguimiento**: Pendiente → Confirmado → Preparando → Listo → Entregado
- **Detalles completos** por cada línea de pedido
- **Cálculo automático** de totales e impuestos
- **Historial completo** de transacciones
- **Filtros por estado** y rango de fechas
- **Impresión de comprobantes**

### 📊 Control Total de Inventario
- **Movimientos detallados** de entrada y salida
- **Trazabilidad completa** de productos
- **Reportes de rotación** de inventario
- **Alertas automáticas** de reposición
- **Gestión de proveedores**
- **Control de mermas** y pérdidas

### 📈 Reportes y Análisis Empresarial
- **Dashboard de ventas** por período
- **Productos más vendidos** y análisis de tendencias
- **Análisis de comportamiento** de clientes
- **Reportes de rentabilidad** por categoría
- **Exportación a PDF/Excel**
- **Gráficos interactivos**

## 🛠️ Tecnologías Utilizadas

### Backend y Desktop
- **Electron 30.0.0** - Framework multiplataforma para aplicaciones de escritorio
- **SQLite3 5.1.7** - Base de datos relacional ligera y eficiente
- **Node.js** - Runtime de JavaScript para el backend
- **Context Isolation** - Seguridad avanzada entre procesos

### Frontend y UI/UX
- **HTML5** - Estructura semántica moderna
- **CSS3** - Diseño responsivo con variables CSS y animaciones
- **JavaScript ES6+** - Lógica de aplicación con clases y async/await
- **Diseño responsivo** - Adaptable a diferentes resoluciones

### Seguridad y Arquitectura
- **Preload Scripts** - Comunicación segura entre procesos
- **IPC (Inter-Process Communication)** - Manejo seguro de datos
- **Context Bridge** - Aislamiento de contextos de seguridad
- **Validación de datos** - Sanitización en frontend y backend

## 🚀 Instalación

### Prerrequisitos
- **Node.js** (versión 16 o superior)
- **npm** (incluido con Node.js)
- **Git** (para clonar el repositorio)

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/jopasma7/Trabajos.git
   cd Trabajos/Floristeria
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Ejecutar la aplicación**
   ```bash
   npm start
   ```

### Scripts Disponibles

- `npm start` - Ejecutar la aplicación en modo producción
- `npm run dev` - Ejecutar en modo desarrollo con recarga automática
- `npm run build` - Construir la aplicación para distribución
- `npm test` - Ejecutar pruebas (si están configuradas)

## 📁 Estructura del Proyecto

```
Floristeria/
├── 📁 src/
│   ├── 📁 database/
│   │   └── database.js          # Gestión de base de datos SQLite
│   ├── 📁 views/
│   │   └── index.html           # Interfaz principal de usuario
│   ├── 📁 styles/
│   │   └── main.css             # Estilos CSS con tema de floristería
│   ├── 📁 js/
│   │   └── main.js              # Lógica principal de la aplicación
│   └── preload.js               # Script de preload para seguridad
├── 📁 .vscode/
│   └── tasks.json               # Tareas automatizadas de VS Code
├── main.js                      # Proceso principal de Electron
├── package.json                 # Configuración del proyecto y dependencias
├── README.md                    # Este archivo
└── Floristeria.code-workspace   # Workspace de VS Code
```

## 🗄️ Base de Datos

### Esquema de Datos (8 Tablas Interconectadas)

#### 📋 **categorias**
- Clasificación de productos (Flores, Plantas, Jardineras, etc.)
- Gestión jerárquica de categorías

#### 🌺 **productos**
- Inventario completo con códigos únicos
- Precios, stock actual y mínimo
- Relación con categorías

#### 👤 **clientes**
- Información completa de contacto
- Historial de compras y estadísticas
- Segmentación y preferencias

#### 🎊 **eventos**
- Eventos estacionales y especiales
- Niveles de demanda configurables
- Productos especializados por evento

#### 🛒 **pedidos**
- Órdenes de venta con estados de seguimiento
- Información del cliente y fechas
- Cálculos automáticos de totales

#### 📝 **pedido_detalles**
- Líneas detalladas de cada pedido
- Cantidad, precios y subtotales
- Trazabilidad por producto

#### 📊 **inventario_movimientos**
- Historial completo de movimientos
- Entrada, salida y ajustes de inventario
- Motivos y responsables

#### 🎯 **reservas_eventos**
- Reservas anticipadas para eventos
- Gestión de capacidad por evento
- Estados de reserva

### Datos de Ejemplo Incluidos

El sistema incluye datos de ejemplo para facilitar la evaluación:

- **50+ productos** en diversas categorías
- **Clientes de ejemplo** con historial
- **Eventos estacionales** pre-configurados
- **Pedidos de muestra** en diferentes estados
- **Movimientos de inventario** de ejemplo

## ✨ Funcionalidades Destacadas

### 🌸 Especialización para Floristerías
- **Gestión estacional** optimizada para fechas especiales
- **Jardineras para Semana Santa** con demanda extrema
- **Arreglos especializados** por ocasión
- **Control de frescura** para flores cortadas
- **Gestión de proveedores** de flores

### 🎨 Interfaz Intuitiva
- **Tema visual especializado** con colores de floristería
- **Navegación fluida** entre secciones
- **Formularios inteligentes** con validación
- **Notificaciones en tiempo real**
- **Modales responsive** para formularios

### 📱 Diseño Responsive
- **Adaptable a diferentes pantallas**
- **Mobile-friendly** para tablets
- **Componentes escalables**
- **Tipografía legible** en todas las resoluciones

### 🔒 Seguridad Avanzada
- **Context Isolation** habilitado
- **Node Integration** deshabilitado en renderer
- **Preload scripts** para comunicación segura
- **Validación de datos** en múltiples capas

## 🎯 Uso del Sistema

### Primer Uso
1. **Ejecutar la aplicación** con `npm start`
2. **Explorar el dashboard** con estadísticas iniciales
3. **Revisar productos de ejemplo** en diferentes categorías
4. **Crear nuevos productos** según tu inventario
5. **Registrar clientes** y sus preferencias
6. **Gestionar pedidos** desde creación hasta entrega

### Flujo de Trabajo Típico
1. **Morning Dashboard Check** - Revisar métricas del día
2. **Inventory Management** - Actualizar stock y precios
3. **Order Processing** - Gestionar pedidos pendientes
4. **Customer Service** - Atender consultas y nuevos pedidos
5. **Evening Reports** - Generar reportes de ventas

### Gestión de Eventos Estacionales
1. **Planificación anticipada** - Configurar eventos futuros
2. **Stock preparation** - Ajustar inventario para demanda
3. **Product specialization** - Crear productos específicos
4. **Customer notifications** - Informar sobre ofertas especiales

## 🎉 Casos de Uso Especiales

### 🌿 Semana Santa - Gestión de Jardineras
Durante Semana Santa, la demanda de jardineras alcanza niveles extremos. El sistema facilita:

- **📅 Planificación Anticipada**: Evento pre-configurado con demanda "Extrema"
- **📊 Estimación de Stock**: Basada en análisis de temporadas anteriores
- **🎯 Pre-reservas**: Sistema de reservas para clientes regulares
- **⚠️ Alertas de Inventario**: Notificaciones automáticas de reposición
- **📦 Gestión de Entregas**: Programación de entregas durante toda la semana
- **💰 Precios Dinámicos**: Ajuste de precios según demanda y disponibilidad

### 💐 Bodas y Eventos Especiales
- **📋 Catálogo Especializado**: Arreglos específicos para bodas
- **💵 Cotizaciones Personalizadas**: Sistema de presupuestos detallados
- **📅 Cronograma de Preparación**: Timeline de preparación del evento
- **✅ Lista de Tareas**: Control de tareas pre-evento
- **📸 Galería de Referencias**: Imágenes de trabajos anteriores

### 🏪 Operaciones Diarias
- **⚡ Ventas Rápidas**: Interface optimizada para ventas rápidas
- **📊 Dashboard en Tiempo Real**: Métricas actualizadas automáticamente
- **📞 Gestión de Proveedores**: Contactos y órdenes de compra
- **🧮 Cálculos Automáticos**: Precios, descuentos e impuestos

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Por favor:

1. **Fork** el repositorio
2. **Crear una rama** para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. **Abrir un Pull Request**

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

**Desarrollado con ❤️ para optimizar la gestión de floristerías**

---

### 🔗 Enlaces Útiles

- [Documentación de Electron](https://www.electronjs.org/docs)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Node.js Documentation](https://nodejs.org/docs/)

### 📞 Soporte

Para soporte técnico o consultas sobre el sistema, por favor crear un **Issue** en el repositorio de GitHub.

---

*Sistema desarrollado especialmente para modernizar y optimizar la gestión de floristerías, combinando funcionalidad empresarial con diseño intuitivo.*
│   │   └── database.js   # Gestión de base de datos
│   ├── views/
│   │   └── index.html    # Interfaz principal
│   ├── styles/
│   │   └── main.css      # Estilos de la aplicación
│   ├── scripts/
│   │   └── main.js       # Lógica de la aplicación
│   └── preload.js        # Script de preload de Electron
└── data/                 # Base de datos (excluida del repositorio)
```

## 🗃️ Esquema de Base de Datos

### Tablas Principales:
- **productos**: Flores, plantas, jardineras, accesorios
- **clientes**: Información de clientes
- **eventos**: Semana Santa, bodas, etc.
- **pedidos**: Pedidos regulares y para eventos
- **inventario**: Stock actual de productos
- **ventas**: Registro de transacciones

## 🚀 Desarrollo

### Comandos Disponibles:
```bash
npm start          # Ejecutar en modo desarrollo
npm run build      # Construir para distribución
npm run pack       # Empaquetar sin instalador
npm run dist       # Crear instalador
```

### Modo Desarrollo:
```bash
npm run dev        # Ejecutar con herramientas de desarrollo
```

## 📝 Funcionalidades por Implementar

- [ ] Integración con sistemas de pago
- [ ] Sincronización en la nube
- [ ] App móvil complementaria
- [ ] Integración con redes sociales
- [ ] Sistema de facturación electrónica

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/NuevaFuncionalidad`)
3. Commit tus cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/NuevaFuncionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para detalles.

## 📞 Contacto

Para soporte o consultas sobre el sistema de gestión de floristería, contacta a través del repositorio de GitHub.

---

🌸 **Hecho con ❤️ para hacer crecer tu floristería** 🌸
