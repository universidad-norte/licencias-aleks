# 📚 Sistema de Gestión y Asignación de Licencias ALEKS

Sistema web desarrollado con **Google Apps Script** e **HTML5 / Bootstrap 5** para automatizar la asignación, cobro, control de inventario y consulta de licencias de la plataforma educativa **ALEKS**.

---

## 📋 Tabla de Contenidos
1. [Estructura de la Base de Datos (Google Sheets)](#1-estructura-de-la-base-de-datos-google-sheets)
2. [Guía de Uso: Portal de Administración (Cajas)](#2-guía-de-uso-portal-de-administración-cajas)
3. [Guía de Uso: Portal del Alumno](#3-guía-de-uso-portal-del-alumno)
4. [Lógica de Negocio y Reglas de Vigencia](#4-lógica-de-negocio-y-reglas-de-vigencia)
5. [Configuración y Despliegue](#5-configuración-y-despliegue)

---

## 1. Estructura de la Base de Datos (Google Sheets)

El sistema utiliza un único libro de **Google Sheets** que contiene **2 pestañas obligatorias**. Es fundamental mantener exactos los nombres de las pestañas y las cabeceras en la **Fila 1**.

### Pestaña 1: `ListadoAlumnos`
Almacena el censo general de estudiantes, las licencias asignadas y el registro de pagos realizado en cajas.

| Columna | Nombre de la Cabecera | Descripción / Ejemplo |
| :---: | :--- | :--- |
| **A** | `Hora` | Horario de clase (Ej. `08:00`) |
| **B** | `Salon` | Salón asignado (Ej. `A-102`) |
| **C** | `materia` | Nombre de la asignatura |
| **D** | `nombre_maestro` | Nombre del docente a cargo |
| **E** | `matricula` | Identificador único del alumno (Ej. `A0123456`) |
| **F** | `nombre_alumno` | Nombre completo del estudiante |
| **G** | `correo_alumno` | Correo electrónico para el envío de licencia |
| **H** | `licencia_aleks` | Código asignado automáticamente desde inventario |
| **I** | `nivel` | Nivel académico (`Preparatoria` o `Universidad`) |
| **J** | `vigencia` | Duración del acceso (`1 Año`, `4 Meses` o `2 Meses`) |
| **K** | `fecha_pago` | Fecha en que se registró el pago (`dd/MMM/yyyy`) |
| **L** | `fecha_vencimiento` | Fecha límite calculada automáticamente (`dd/MMM/yyyy`) |
| **M** | `cajera` | Nombre o ID del personal que cobró |
| **N** | `folio_recibo` | Folio físico o digital del recibo de caja |
| **O** | `estatus_envio` | Estatus de notificación por correo (`Enviado`) |

---

### Pestaña 2: `LicenciasAleks`
Funciona como el **inventario o stock** de códigos comprados a ALEKS.

| Columna | Nombre de la Cabecera | Descripción / Valores Aceptados |
| :---: | :--- | :--- |
| **A** | `codigo_licencia` | Código único provisto por ALEKS (Ej. `ALEKS-PREPA-001`) |
| **B** | `nivel` | `Preparatoria` o `Universidad` |
| **C** | `vigencia` | `1 Año`, `4 Meses` o `2 Meses` |
| **D** | `estatus` | **`Disponible`** (Libre para asignar) o **`Asignada`** |
| **E** | `matricula_asignada` | Matrícula del alumno a quien se le vinculó la licencia |

---

## 2. Guía de Uso: Portal de Administración (Cajas)

Diseñado para uso exclusivo del personal administrativo/cajeras. Permite asociar cobros, asignar licencias y enviar notificaciones.

### Flujo de Operación:

1. **Acceso al Portal:**
   * Ingresar con la clave maestra de administrador.
2. **Búsqueda del Alumno:**
   * Introducir los tres datos de validación: **Hora**, **Salón** y **Matrícula**.
   * Presionar **"Buscar Alumno"**. El sistema recuperará el registro desde la pestaña `ListadoAlumnos`.
3. **Selección del Producto (Licencia):**
   * Seleccionar el **Nivel Académico** (`Preparatoria` o `Universidad`).
   * Seleccionar la **Vigencia** contratada por el alumno.
4. **Registro de Pago:**
   * Indicar la **Fecha de Pago**, el **Nombre de la Cajera** y el **Folio del Recibo**.
   * *El sistema mostrará una vista previa de la Fecha Límite de Vencimiento calculada.*
5. **Asignación y Envíos:**
   * Hacer clic en **"Asignar Licencia, Registrar Pago y Enviar Correo"**.
   * **Proceso automático:**
     * Busca la primera licencia disponible en `LicenciasAleks` que coincida con el nivel y la vigencia.
     * Cambia el estatus de la licencia a `Asignada` y le vincula la matrícula.
     * Actualiza la pestaña `ListadoAlumnos` con los datos de pago, fechas en formato `dd/MMM/yyyy` y la licencia obtenida.
     * Envía un correo electrónico automático al alumno con su código y fecha límite de acceso.

---

## 3. Guía de Uso: Portal del Alumno

Portal autoconsulta optimizado, rápido y accesible desde cualquier dispositivo móvil o de escritorio.

### Pasos para el Estudiante:
