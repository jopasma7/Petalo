
# 🌸 Floristería Manager Pro

¡Bienvenido a **Floristería Manager Pro**! Esta aplicación de escritorio moderna y profesional está diseñada para la gestión integral de floristerías, permitiendo controlar productos, clientes, eventos, pedidos, inventario, reportes y configuración de empresa desde una interfaz visual atractiva y fácil de usar.

---

## ✨ Características principales

- **Dashboard interactivo**: Estadísticas clave, ventas del mes, stock bajo y próximos eventos.
- **Gestión de productos**: CRUD completo, búsqueda, filtrado por categoría y control de stock.
- **Gestión de clientes**: CRUD, búsqueda avanzada y seguimiento de compras.
- **Gestión de eventos**: Registro y administración de eventos especiales.
- **Gestión de pedidos**: Control de pedidos, estados, fechas y totales.
- **📦 Inventario Avanzado**: 
  - **Dashboard de inventario** con resumen de stock y alertas
  - **Alertas inteligentes** de stock bajo y productos críticos
  - **Predicción de demanda** con análisis automático
  - **🏪 Gestión de proveedores** con tarjetas visuales y bordes mejorados
  - **📋 Órdenes de compra** automáticas y manuales
  - **📝 Movimientos de inventario** con registro detallado
- **Reportes**: Gráficas de ventas y productos más vendidos.
- **Configuración**: Personalización de datos de la empresa.
- **🎨 Modales profesionales**: Diseño limpio sin redundancias de texto
- **Diseño responsive y moderno**: Basado en CSS Grid y glassmorphism.
- **Navegación lateral y superior**: Acceso rápido a todas las secciones.
- **Botón flotante de acciones rápidas**.

---

## 🆕 Últimas actualizaciones

### ✅ Mejoras de UI/UX
- **🎯 Títulos de modales optimizados**: Eliminación de texto redundante "Profesional" en modales de productos y proveedores
- **🖼️ Tarjetas de proveedores mejoradas**: Bordes visibles y bien definidos para mejor separación visual
- **🎨 CSS optimizado**: Eliminación de definiciones duplicadas y conflictos de estilos

### ✅ Sistema de Inventario Avanzado
- **📊 Dashboard de inventario** con métricas clave y visualización de alertas
- **⚠️ Sistema de alertas inteligentes** para stock bajo y productos críticos
- **🔮 Predicción de demanda** basada en patrones de ventas
- **🏪 Módulo de proveedores** con gestión completa CRUD
- **📋 Gestión de órdenes de compra** automáticas y manuales
- **📝 Registro de movimientos** de inventario con seguimiento detallado

### ✅ Mejoras técnicas
- **🔧 Corrección de CSS**: Eliminación de clases duplicadas que causaban conflictos
- **🎨 Estilos consistentes**: Uso de variables CSS para colores y espaciado uniformes
- **🚀 Rendimiento mejorado**: Optimización de carga de datos y eventos

---

## 🛠️ Tecnologías utilizadas

- **Electron v30**: Entorno de escritorio multiplataforma.
- **HTML5 + CSS3 (Grid, variables, glassmorphism)**: Interfaz moderna y adaptable.
- **JavaScript (ES6+)**: Lógica de la aplicación y manejo de eventos.
- **SQLite**: Base de datos local para persistencia de datos.

---

## 📂 Estructura del proyecto

```
Floristeria/
├── main.js
├── package.json
├── README.md
├── data/
│   └── floristeria.db
├── src/
│   ├── preload.js
│   ├── database/
│   │   └── database.js
│   ├── js/
│   │   └── main.js
│   ├── scripts/
│   ├── styles/
│   │   └── main.css
│   └── views/
│       └── index.html
```

---

## 🚀 ¿Qué puedes hacer con Floristería Manager Pro?

- **📊 Visualizar el estado general del negocio** en el Dashboard principal
- **🌸 Gestionar productos**: Añadir, editar, eliminar y buscar productos, controlar stock y categorías
- **👥 Gestionar clientes**: Registrar nuevos clientes, editar información y consultar historial de compras
- **🎉 Gestionar eventos**: Programar y administrar eventos especiales (bodas, funerales, etc.)
- **📋 Gestionar pedidos**: Crear, filtrar y actualizar pedidos con diferentes estados
- **📦 Controlar inventario avanzado**:
  - Ver dashboard completo con métricas y alertas
  - Recibir alertas automáticas de stock bajo
  - Analizar predicciones de demanda
  - Gestionar proveedores con interfaz visual moderna
  - Crear órdenes de compra automáticas y manuales
  - Registrar movimientos de inventario detallados
- **📈 Generar reportes**: Visualizar ventas y productos destacados mediante gráficas interactivas
- **⚙️ Configurar datos de la empresa**: Personalizar información básica de la floristería

### 🎯 Características especiales del inventario

- **🤖 Generación automática de órdenes**: El sistema sugiere qué comprar basándose en stock mínimo
- **📊 Análisis predictivo**: Predicción de demanda basada en histórico de ventas
- **🏪 Gestión visual de proveedores**: Tarjetas con información completa y bordes bien definidos
- **⚡ Alertas en tiempo real**: Notificaciones instantáneas para productos críticos
- **📝 Trazabilidad completa**: Seguimiento detallado de todos los movimientos de stock

---

## 📦 Instalación y ejecución

1. **Clona el repositorio:**
   ```bash
   git clone <URL-del-repositorio>
   cd Floristeria
   ```
2. **Instala las dependencias:**
   ```bash
   npm install
   ```
3. **Ejecuta la aplicación:**
   ```bash
   npm start
   ```

---

## 📝 Notas adicionales

- El proyecto está en desarrollo activo. ¡Se irán añadiendo nuevas funcionalidades y mejoras visuales!
- Los commits se realizan en español y con iconos para mayor claridad y estilo.
- Si tienes sugerencias o encuentras algún bug, no dudes en abrir un issue.

---

## 👨‍💻 Autor

- Desarrollado por [Tu Nombre]
- Contacto: [tu-email@ejemplo.com]

---

¡Gracias por usar Floristería Manager Pro! 🌸

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
- **productos**: Flores, plantas, jardineras, accesorios con control de stock
- **clientes**: Información completa de clientes y historial
- **eventos**: Semana Santa, bodas, funerales y eventos especiales
- **pedidos**: Pedidos regulares y para eventos con estados
- **📦 proveedores**: Información de proveedores y contactos *(NUEVO)*
- **📋 ordenes_compra**: Órdenes de compra automáticas y manuales *(NUEVO)*
- **📝 movimientos_inventario**: Registro detallado de movimientos de stock *(NUEVO)*
- **inventario**: Stock actual de productos con alertas
- **ventas**: Registro de transacciones y análisis

### 🆕 Nuevas tablas implementadas:
- **⚠️ alertas_stock**: Sistema de alertas automáticas para productos críticos
- **🔮 prediccion_demanda**: Análisis predictivo basado en patrones de venta
- **📊 inventario_dashboard**: Métricas y KPIs del inventario

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

- [ ] 💳 Integración con sistemas de pago
- [ ] ☁️ Sincronización en la nube
- [ ] 📱 App móvil complementaria
- [ ] 📲 Integración con redes sociales
- [ ] 🧾 Sistema de facturación electrónica
- [ ] 📧 Notificaciones por email a proveedores
- [ ] 📊 Reportes avanzados de inventario
- [ ] 🔄 Sincronización automática con proveedores
- [ ] 📦 Códigos de barras y QR para productos
- [ ] 🎯 Optimización de rutas de entrega

### 🚧 En desarrollo activo:
- [ ] 🤖 IA para predicción de demanda más precisa
- [ ] 📈 Dashboard de analytics avanzado
- [ ] 🔔 Sistema de notificaciones push
- [ ] 💼 Módulo de contabilidad básica

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
