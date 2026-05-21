# Pétalo — Manual de Usuario

**Versión 1.0.0** · Software de gestión para floristerías

---

## Índice

1. [Introducción](#1-introducción)
2. [Instalación](#2-instalación)
3. [Activación de la licencia](#3-activación-de-la-licencia)
4. [Primer inicio y configuración](#4-primer-inicio-y-configuración)
5. [Dashboard — Vista general](#5-dashboard--vista-general)
6. [Productos](#6-productos)
7. [Clientes](#7-clientes)
8. [Pedidos](#8-pedidos)
9. [Eventos](#9-eventos)
10. [Inventario](#10-inventario)
11. [Reportes](#11-reportes)
12. [Venta rápida (TPV)](#12-venta-rápida-tpv)
13. [Notificaciones](#13-notificaciones)
14. [Configuración](#14-configuración)
15. [Exportación de datos](#15-exportación-de-datos)
16. [Preguntas frecuentes](#16-preguntas-frecuentes)
17. [Soporte](#17-soporte)

---

## 1. Introducción

Pétalo es una aplicación de escritorio diseñada específicamente para la gestión integral de floristerías. Desde el catálogo de productos hasta el control de pedidos, eventos, clientes y proveedores — todo desde un único programa que funciona sin conexión a internet.

### ¿Qué puedes hacer con Pétalo?

- Gestionar tu catálogo de productos con control de stock en tiempo real
- Registrar y consultar clientes con su historial de compras y preferencias
- Crear y hacer seguimiento de pedidos de principio a fin
- Planificar eventos especiales como bodas, bautizos o funerales
- Controlar el inventario, recibir alertas de stock bajo y gestionar proveedores
- Generar reportes visuales de ventas, pedidos y rendimiento
- Exportar datos en PDF, Excel o CSV
- Realizar ventas rápidas desde el TPV integrado

### Funcionamiento offline

Pétalo almacena todos los datos directamente en tu equipo mediante una base de datos local. No necesitas conexión a internet para trabajar. La conexión solo es necesaria en el momento de activar la licencia.

---

## 2. Instalación

### Requisitos del sistema

| Requisito | Mínimo |
|-----------|--------|
| Sistema operativo | Windows 10 (64 bits) o posterior |
| RAM | 256 MB |
| Espacio en disco | 200 MB libres |
| Conexión a internet | Solo para la activación de la licencia |

### Pasos de instalación

1. Descarga el archivo `Petalo.Setup.1.0.0.exe` desde la página oficial o desde el enlace de descarga que recibiste.
2. Haz doble clic sobre el instalador.
3. Si Windows muestra una advertencia de seguridad, haz clic en **"Más información"** y luego en **"Ejecutar de todas formas"**. Esto es normal en aplicaciones que no provienen de la Microsoft Store.
4. Sigue los pasos del instalador. Pétalo se instalará automáticamente.
5. Al finalizar, se creará un acceso directo en el escritorio y en el menú de inicio.

---

## 3. Activación de la licencia

Al abrir Pétalo por primera vez, verás la pantalla de activación de licencia.

### Período de prueba

Pétalo incluye **1 día de prueba gratuita** con todas las funcionalidades disponibles. No se requiere tarjeta de crédito para comenzar. Al hacer clic en **"Iniciar prueba gratuita"**, el programa se abrirá directamente.

### Activar con licencia

Si ya dispones de una licencia:

1. En la pantalla de activación, introduce tu **clave de licencia** en el campo correspondiente.
2. Asegúrate de tener conexión a internet en este momento.
3. Haz clic en **"Activar"**.
4. Si la clave es válida, Pétalo se abrirá con acceso completo y sin límite de tiempo.

### Comprar una licencia

Puedes adquirir una licencia desde [lottuscompany.com/petalo](https://lottuscompany.com/petalo). Una vez completado el pago, recibirás la clave de licencia por correo electrónico.

> **Nota:** La licencia está vinculada al equipo donde se activa. Si necesitas cambiar de equipo, contacta con soporte.

---

## 4. Primer inicio y configuración

Al entrar por primera vez, Pétalo lanzará un **asistente de bienvenida** que te guiará por los pasos iniciales:

1. **Selección de idioma** — Elige entre Español e Inglés. Puedes cambiarlo en cualquier momento desde Configuración.
2. **Datos de la empresa** — Introduce el nombre de tu floristería, dirección y teléfono. Estos datos aparecerán en los documentos PDF que generes.
3. **Datos de ejemplo** — El asistente puede cargar datos de muestra para que explores la aplicación sin necesidad de introducir nada desde cero. Puedes eliminarlos cuando quieras.

Una vez completado el asistente, accederás al **Dashboard principal**.

---

## 5. Dashboard — Vista general

El Dashboard es la pantalla de inicio de Pétalo. Muestra de un vistazo el estado actual de tu negocio.

### Tarjetas de KPIs

En la parte superior encontrarás cuatro indicadores principales:

| Indicador | Descripción |
|-----------|-------------|
| **Pedidos pendientes** | Número de pedidos que aún no han sido entregados |
| **Ventas del mes** | Importe total facturado en el mes actual |
| **Total clientes** | Clientes registrados en la base de datos |
| **Alertas de stock** | Productos por debajo del nivel mínimo de stock |

Puedes hacer clic en cualquier tarjeta para ir directamente a la sección correspondiente.

### Pedidos de hoy

Lista los pedidos con entrega programada para el día actual, con su estado y cliente asignado.

### Acciones rápidas

Botones de acceso directo para las operaciones más habituales: venta rápida, nuevo pedido, nuevo cliente, ver inventario, nuevo evento y ver reportes.

### Panel lateral del Dashboard

- **Alertas urgentes** — Productos en situación crítica de stock que requieren atención inmediata.
- **Próximos eventos** — Los eventos más cercanos en el tiempo (bodas, bautizos, etc.) para que nunca te pille por sorpresa.

### Barra lateral de estadísticas

En la parte inferior del menú lateral encontrarás tres cifras actualizadas en tiempo real:

- **Ventas hoy** — Importe vendido durante el día actual.
- **Stock bajo** — Número de productos con stock insuficiente.
- **Entregas hoy** — Pedidos con entrega prevista para hoy. Al hacer clic accedes directamente a esa lista.

---

## 6. Productos

La sección de **Productos** es el catálogo completo de tu floristería. Aquí gestionas todo lo que vendes.

### Ver el catálogo

Los productos se muestran en una tabla con las columnas: código, nombre, categoría, stock actual, precio de venta, estado y acciones.

Puedes **filtrar por categoría** usando el desplegable superior, o **buscar** por nombre o código usando el campo de búsqueda.

### Añadir un producto

1. Haz clic en el botón **"Nuevo producto"**.
2. Rellena el formulario:
   - **Imagen** — Opcional. Puedes subir una foto del producto.
   - **Nombre** — Nombre descriptivo del producto.
   - **Código** — Se genera automáticamente. No es necesario que lo introduzcas.
   - **Categoría** — Agrupa los productos por tipo (flores, plantas, complementos, etc.). Puedes gestionar las categorías desde el propio formulario.
   - **Precio de compra** — Lo que te cuesta el producto a ti.
   - **Precio de venta** — Lo que cobra el cliente.
   - **Temporada** — Indica si el producto es de temporada o está disponible todo el año.
   - **Stock actual** — Cantidad disponible en este momento.
   - **Stock mínimo** — Cuando el stock baje de esta cifra, Pétalo te avisará con una alerta.
   - **Descripción** — Notas adicionales sobre el producto.
3. Haz clic en **"Guardar"**.

### Editar o eliminar un producto

En la columna de acciones de cada fila encontrarás los botones para **editar** o **eliminar** el producto. Los productos eliminados pasan a un estado inactivo (no se borran permanentemente), por lo que puedes recuperarlos si lo necesitas.

### Gestionar categorías

Desde el formulario de producto, junto al campo "Categoría", encontrarás el botón **"Gestionar"**. Desde ahí puedes crear, editar y eliminar las categorías que uses en tu floristería.

---

## 7. Clientes

La sección de **Clientes** centraliza toda la información de las personas y empresas que compran en tu floristería.

### Ver clientes

Los clientes se muestran en tarjetas visuales con su nombre, foto (si la tiene), tipo de cliente y datos de contacto rápido.

Puedes buscar cualquier cliente por nombre usando el campo de búsqueda superior.

### Añadir un cliente

1. Haz clic en **"Nuevo cliente"**.
2. Rellena el formulario:

   **Datos personales:**
   - Foto (opcional)
   - Nombre completo
   - Email
   - Teléfono
   - Dirección

   **Datos comerciales:**
   - **Tipo de cliente** — Por ejemplo: particular, empresa, mayorista, etc. Puedes gestionar los tipos desde el propio formulario.
   - **Presupuesto habitual** — Importe aproximado que suele gastar este cliente. Útil para reportes de segmentación.
   - **Preferencias florales** — Notas sobre qué tipo de flores o arreglos prefiere.
   - **Ocasiones importantes** — Cumpleaños, aniversarios u otras fechas que quieras recordar.
   - **Notas** — Cualquier información adicional relevante.

3. Haz clic en **"Guardar"**.

### Historial de un cliente

Al hacer clic sobre una tarjeta de cliente, se abre su **historial completo**: todos los pedidos que ha realizado, con fechas, importes y estado. Es ideal para tener un contexto rápido antes de atender a un cliente habitual.

---

## 8. Pedidos

La sección de **Pedidos** (también llamados encargos) gestiona todo lo que tus clientes te piden, desde que lo solicitan hasta que lo entregan.

### Pestañas de estado

Los pedidos se organizan en tres pestañas:

- **Pendientes** — Pedidos recibidos que aún no han sido entregados.
- **Aprobados** — Pedidos entregados o completados.
- **Cancelados** — Pedidos que no se han llevado a cabo.

Cada pestaña muestra el número de pedidos en ese estado.

### Crear un nuevo pedido

1. Haz clic en **"Nuevo pedido"**.
2. Rellena la información:
   - **Cliente** — Selecciona o crea el cliente en el momento.
   - **Fecha de entrega** — Cuándo hay que tener el pedido listo.
   - **Productos** — Añade los productos del pedido con su cantidad y precio.
   - **Notas** — Instrucciones especiales, dedicatorias o cualquier detalle del encargo.
3. Guarda el pedido.

### Gestionar un pedido

Cada pedido muestra en la lista: cliente, fecha de entrega, importe total y estado. Puedes abrirlo para ver el detalle completo, editarlo o cambiar su estado (de pendiente a aprobado, o cancelarlo).

> **Consejo:** Los pedidos del día aparecen siempre destacados en el Dashboard para que no pierdas ninguna entrega.

---

## 9. Eventos

Los **Eventos** permiten planificar y gestionar ocasiones especiales que requieren preparación anticipada: bodas, bautizos, comuniones, funerales, graduaciones, etc.

### ¿Para qué sirven los eventos?

Un evento en Pétalo no es solo una fecha en el calendario. Sirve para:

- Planificar con antelación las necesidades de stock para esa fecha.
- Aplicar descuentos especiales a los pedidos asociados al evento.
- Visualizar en el Dashboard los próximos eventos para no perder nada de vista.
- Que el sistema tenga en cuenta la demanda esperada al hacer predicciones de inventario.

### Crear un evento

1. Haz clic en **"Nuevo evento"**.
2. Rellena el formulario:
   - **Nombre del evento** — Por ejemplo: "Boda García-López".
   - **Tipo de evento** — Boda, bautizo, funeral, etc. Puedes gestionar los tipos desde el formulario.
   - **Demanda esperada** — Baja, media, alta o extrema. Indica cuánto volumen de trabajo generará este evento.
   - **Fecha de inicio y fin** — El período del evento.
   - **Descuento especial** — Porcentaje de descuento aplicado a los pedidos de este evento.
   - **Días de preparación** — Cuántos días antes hay que empezar a prepararlo. El sistema te avisará con antelación.
   - **Descripción** — Notas adicionales sobre el evento.
3. Haz clic en **"Guardar"**.

---

## 10. Inventario

El **Inventario** es el módulo más completo de Pétalo. Se divide en seis pestañas que cubren todos los aspectos del control de stock.

### Pestaña: Dashboard de inventario

Vista general del estado del inventario con cuatro KPIs:

- **Total de productos** en catálogo
- **Productos con stock bajo**
- **Valor total del inventario** (stock actual × precio de compra)
- **Rotación promedio** de productos

Incluye también dos gráficos:
- **Análisis de rotación** — Clasifica los productos en rotación rápida (verde), lenta (amarillo) y con stock crítico (rojo).
- **Sin movimiento** — Lista los productos que llevan más tiempo sin venderse ni recibir entradas de stock.

### Pestaña: Alertas

Muestra todos los productos que han superado el umbral mínimo de stock, organizados por nivel de urgencia:

- **Sin stock** — No queda ninguna unidad.
- **Crítico** — Quedan muy pocas unidades.
- **Bajo** — Por debajo del mínimo configurado.

Puedes filtrar por nivel y generar automáticamente una orden de compra para los productos en alerta.

### Pestaña: Predicción

Pétalo analiza el historial de ventas y movimientos de stock para estimar cuánto stock necesitarás en los próximos días. La tabla de predicción muestra por producto:

- Stock actual
- Demanda estimada
- Stock proyectado
- Acción recomendada (reponer, vigilar, sin acción)

El gráfico muestra la evolución prevista de la demanda.

### Pestaña: Proveedores

Registra y gestiona los proveedores de tu floristería. Para cada proveedor puedes guardar:

- Nombre y datos de contacto
- Productos que suministran
- Historial de órdenes de compra realizadas

### Pestaña: Órdenes de compra

Gestiona las compras que realizas a tus proveedores. Cada orden puede estar en uno de estos estados:

| Estado | Significado |
|--------|-------------|
| **Pendiente** | Orden creada, aún no enviada al proveedor |
| **Enviada** | Orden enviada, esperando recepción |
| **Recibida** | Mercancía recibida, stock actualizado automáticamente |
| **Cancelada** | Orden anulada |

Puedes crear órdenes manualmente o generarlas automáticamente desde la pestaña de Alertas.

### Pestaña: Movimientos

Registro completo de todas las entradas y salidas de stock. Tipos de movimiento disponibles:

- **Entrada** — Recepción de mercancía de un proveedor.
- **Salida** — Consumo por una venta o pedido.
- **Ajuste** — Corrección manual de inventario (por ejemplo, tras un recuento físico).
- **Devolución** — Mercancía devuelta al proveedor o recibida de un cliente.

Puedes filtrar los movimientos por fecha y tipo, y registrar nuevos movimientos manualmente cuando sea necesario.

---

## 11. Reportes

La sección de **Reportes** ofrece una visión analítica del rendimiento de tu floristería.

### Período de análisis

En la parte superior puedes seleccionar el período que quieres analizar: últimos 7 días, 30 días, 90 días o 365 días.

### KPIs principales

- **Total de ventas** — Importe total facturado en el período seleccionado.
- **Total de pedidos** — Número de pedidos completados.
- **Clientes activos** — Clientes que han realizado al menos un pedido en el período.
- **Ticket promedio** — Importe medio por pedido.

Cada KPI incluye una tendencia comparativa respecto al período anterior.

### Gráficos

- **Ventas** — Evolución diaria o semanal del importe facturado.
- **Estado de pedidos** — Distribución de pedidos por estado (pendiente, aprobado, cancelado).
- **Rotación por categoría** — Qué categorías de productos tienen mayor movimiento.

### Rankings

- **Productos más vendidos** — Top de productos por volumen de ventas.
- **Segmentación de clientes** — Distribución por tipo de cliente.
- **Eventos más frecuentes** — Tipos de eventos que generan más trabajo.

### Detalle de ventas

Tabla completa con cada pedido del período: fecha, número, cliente, productos, importe total, estado y margen. Puedes buscar cualquier venta por nombre de cliente o producto.

---

## 12. Venta rápida (TPV)

La **Venta rápida** es un terminal de punto de venta simplificado, pensado para ventas en mostrador que no necesitan todo el proceso de un pedido formal.

### Cómo usar la venta rápida

1. Haz clic en el botón **"Venta rápida"** del menú lateral o del Dashboard.
2. Añade los productos de la venta buscándolos por nombre o código.
3. Ajusta las cantidades si es necesario.
4. Selecciona el método de pago.
5. Confirma la venta.

El stock se descuenta automáticamente y la venta queda registrada en los reportes.

> **Acceso rápido:** También puedes abrir la venta rápida desde el botón flotante (+) en cualquier pantalla.

---

## 13. Notificaciones

El **centro de notificaciones** reúne todos los avisos del sistema en un único lugar. Accede haciendo clic en el icono de campana en la barra superior.

### Tipos de notificaciones

- Alertas de stock bajo o crítico
- Pedidos con entrega programada para hoy
- Eventos próximos que requieren preparación
- Cualquier aviso relevante del sistema

### Gestionar notificaciones

Puedes marcar las notificaciones como leídas individualmente o todas a la vez. También puedes limpiar las ya leídas para mantener el centro ordenado.

Las pestañas **"Sin leer"** y **"Todas"** permiten filtrar rápidamente.

---

## 14. Configuración

Accede a la configuración desde el icono de engranaje en la barra superior.

### Datos de la empresa

Nombre, dirección y teléfono de tu floristería. Esta información aparece en los encabezados de los documentos PDF que genera Pétalo.

### Seguridad

Cambia la contraseña de acceso a la aplicación. Para ello necesitas introducir la contraseña actual y la nueva dos veces para confirmar.

> **Contraseña por defecto:** `1234` — cámbiala tras el primer inicio de sesión.

### Preferencias

- **Moneda** — Euro (€), Dólar ($) o Libra (£).
- **Formato de fecha** — DD/MM/YYYY, MM/DD/YYYY o YYYY-MM-DD.
- **Idioma** — Español o Inglés. El cambio se aplica de inmediato.

### Información del sistema

Muestra la versión instalada, el tipo de base de datos (SQLite) y los datos de contacto de soporte.

Desde aquí también puedes:
- **Exportar todos los datos** — Genera una copia de seguridad de toda la información.
- **Limpiar caché** — Elimina archivos temporales si la aplicación presenta comportamientos extraños.

---

## 15. Exportación de datos

Pétalo permite exportar información en tres formatos:

| Formato | Uso recomendado |
|---------|-----------------|
| **CSV** | Compatible con cualquier programa (Excel, Google Sheets, etc.) |
| **Excel (.xlsx)** | Abre directamente en Microsoft Excel con formato de tabla |
| **PDF** | Documento listo para imprimir o enviar por correo |

### Cómo exportar

1. Ve a **Configuración → Exportar datos**, o usa el botón de exportación disponible en algunas secciones.
2. Selecciona qué datos quieres exportar (productos, clientes, pedidos, etc.).
3. Elige el formato.
4. Haz clic en **"Exportar"**. El archivo se guardará en la carpeta de descargas de tu equipo.

---

## 16. Preguntas frecuentes

**¿Necesito conexión a internet para usar Pétalo?**
No. Pétalo funciona completamente offline. Solo necesitas conexión para activar la licencia la primera vez.

**¿Puedo instalar Pétalo en más de un ordenador?**
La licencia activa Pétalo en un único equipo. Si necesitas instalarlo en otro, contacta con soporte para gestionar el cambio.

**¿Qué pasa si pierdo mi clave de licencia?**
Escríbenos a bblottus@gmail.com desde el correo con el que realizaste la compra y te la reenviaremos.

**¿Los datos eliminados se pueden recuperar?**
Sí. Pétalo usa eliminación lógica: los registros eliminados quedan marcados como inactivos pero no se borran de la base de datos. Si necesitas recuperar algo, contacta con soporte.

**¿Cómo hago una copia de seguridad?**
Ve a **Configuración → Exportar datos** y exporta todos los datos en Excel o CSV. Guarda ese archivo en un lugar seguro (nube, disco externo, etc.).

**¿Cómo cambio el idioma?**
Ve a **Configuración → Preferencias** y selecciona el idioma deseado. El cambio se aplica de inmediato sin necesidad de reiniciar.

**¿Puedo personalizar las categorías de productos, tipos de cliente y tipos de evento?**
Sí. Desde el formulario de cada entidad encontrarás el botón **"Gestionar"** para añadir, editar o eliminar los tipos que uses en tu negocio.

**¿Pétalo genera facturas?**
Actualmente Pétalo genera documentos PDF de pedidos y reportes, pero no facturas oficiales con numeración fiscal. Para facturación legal recomendamos complementarlo con un programa de facturación.

---

## 17. Soporte

Si tienes algún problema o pregunta que no encuentres respuesta en este manual, contacta con nosotros:

**Correo:** bblottus@gmail.com
**Tiempo de respuesta habitual:** menos de 24 horas

Al escribir, incluye:
- La versión de Pétalo que tienes instalada (visible en Configuración → Información del sistema)
- Una descripción del problema o la pregunta
- Si es posible, una captura de pantalla

---

*Pétalo v1.0.0 — Lottus Company · Todos los derechos reservados*
