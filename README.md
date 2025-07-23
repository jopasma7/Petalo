
# 🌸 Floristería Manager Pro

¡Bienvenido a **Floristería Manager Pro**! Esta aplicación de escritorio moderna y profesional está diseñada para la gestión integral de floristerías, permitiendo controlar productos, clientes, eventos, pedidos, inventario, reportes y configuración de empresa desde una interfaz visual atractiva y fácil de usar.

---

## ✨ Características principales

- **Dashboard interactivo**: Estadísticas clave, ventas del mes, stock bajo y próximos eventos.
- **Gestión de productos**: CRUD completo, búsqueda, filtrado por categoría y control de stock.
- **Gestión de clientes**: CRUD, búsqueda avanzada y seguimiento de compras.
- **Gestión de eventos**: Registro y administración de eventos especiales.
- **Gestión de pedidos**: Control de pedidos, estados, fechas y totales.
- **Inventario**: Resumen de stock y alertas de inventario bajo.
- **Reportes**: Gráficas de ventas y productos más vendidos.
- **Configuración**: Personalización de datos de la empresa.
- **Modales modernos**: Para añadir y editar productos, clientes y eventos.
- **Diseño responsive y moderno**: Basado en CSS Grid y glassmorphism.
- **Navegación lateral y superior**: Acceso rápido a todas las secciones.
- **Botón flotante de acciones rápidas**.

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

- **Visualizar el estado general del negocio** en el Dashboard.
- **Gestionar productos**: Añadir, editar, eliminar y buscar productos, controlar stock y categorías.
- **Gestionar clientes**: Registrar nuevos clientes, editar información y consultar historial de compras.
- **Gestionar eventos**: Programar y administrar eventos especiales.
- **Gestionar pedidos**: Crear, filtrar y actualizar pedidos con diferentes estados.
- **Controlar inventario**: Ver resúmenes y recibir alertas de stock bajo.
- **Generar reportes**: Visualizar ventas y productos destacados mediante gráficas.
- **Configurar datos de la empresa**: Personalizar información básica de la floristería.

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
