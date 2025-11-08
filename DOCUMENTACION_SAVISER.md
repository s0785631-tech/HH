# Documentación del Proyecto — Sistema de Gestión Médica "SAVISER"

## Tabla de Contenidos
1. [Descripción de la Problemática](#1-descripción-de-la-problemática)
2. [Justificación](#2-justificación)
3. [Objetivo General](#3-objetivo-general)
4. [Objetivos Específicos](#4-objetivos-específicos)
5. [Descripción Detallada de la Solución Planteada](#5-descripción-detallada-de-la-solución-planteada)
   - [5.1. Arquitectura General](#51-arquitectura-general)
   - [5.2. Tecnologías Utilizadas](#52-tecnologías-utilizadas)
   - [5.3. Diseño de la Base de Datos](#53-diseño-de-la-base-de-datos)
   - [5.4. Desarrollo del Backend (API REST)](#54-desarrollo-del-backend-api-rest)
   - [5.5. Desarrollo del Frontend (Aplicación React)](#55-desarrollo-del-frontend-aplicación-react)
   - [5.6. Integración Frontend–Backend](#56-integración-frontend-backend)
6. [Resultados y Discusión](#6-resultados-y-discusión)
7. [Configuración y Despliegue](#7-configuración-y-despliegue)

---

## 1. Descripción de la Problemática

Los centros médicos y clínicas enfrentan desafíos significativos en la gestión integral de sus operaciones diarias. El sistema tradicional de manejo de pacientes, citas médicas, triajes y consultas se realiza frecuentemente de forma manual o mediante sistemas fragmentados, lo que genera:

- **Procesos ineficientes**: El registro manual de pacientes, programación de citas y documentación de consultas consume tiempo excesivo y es propenso a errores humanos.
- **Falta de centralización**: La información médica se encuentra dispersa en diferentes sistemas o documentos físicos, dificultando el acceso rápido y la trazabilidad del historial del paciente.
- **Problemas de comunicación**: La coordinación entre diferentes roles (recepción, enfermería, médicos y administración) carece de un flujo de información estructurado.
- **Gestión de triaje deficiente**: La clasificación de pacientes por prioridad médica no cuenta con un sistema estandarizado que permita un seguimiento adecuado.
- **Documentación médica manual**: La generación de historias clínicas, recetas médicas y reportes se realiza de forma manual, aumentando el tiempo de atención y la posibilidad de errores.

Específicamente, se identificó un problema crítico de autenticación (error 401) que impedía el registro de nuevos usuarios en el sistema, comprometiendo la seguridad y funcionalidad básica de la plataforma.

## 2. Justificación

El desarrollo del sistema SAVISER surge como respuesta a la necesidad urgente de digitalizar y optimizar los procesos médicos en centros de salud.

La implementación de una plataforma web integral permitirá:

- **Centralizar la información médica** en una base de datos segura y accesible.
- **Automatizar procesos críticos** como el registro de pacientes, programación de citas y gestión de triajes.
- **Mejorar la comunicación** entre diferentes roles mediante dashboards especializados.
- **Garantizar la trazabilidad** completa del paciente desde su ingreso hasta el alta médica.
- **Generar documentación médica** de forma automática y estandarizada.
- **Proporcionar herramientas de análisis** para la toma de decisiones administrativas.

Este proyecto permite aplicar tecnologías modernas de desarrollo web, integrando React, Node.js y MongoDB para crear una solución robusta y escalable que mejore significativamente la eficiencia operativa de los centros médicos.

## 3. Objetivo General

Desarrollar un sistema web integral de gestión médica para centros de salud que permita administrar pacientes, citas, triajes, consultas médicas y personal médico, mediante una arquitectura cliente-servidor moderna con roles diferenciados y generación automática de documentación médica.

## 4. Objetivos Específicos

1. **Diseñar e implementar** una base de datos NoSQL en MongoDB que soporte las operaciones de gestión médica, incluyendo pacientes, citas, triajes, consultas y personal médico.

2. **Desarrollar una API REST** en Node.js con Express que permita realizar operaciones CRUD sobre todas las entidades del sistema médico.

3. **Implementar una aplicación web** en React con TypeScript que proporcione interfaces específicas para cada rol de usuario (Empresa, Recepción, Consultorio, Enfermería).

4. **Establecer un sistema de autenticación** robusto con JWT que garantice la seguridad y el control de acceso basado en roles.

5. **Integrar funcionalidades de generación de PDF** para historias clínicas, recetas médicas y reportes administrativos.

6. **Validar el correcto funcionamiento** del sistema mediante pruebas de todas las operaciones críticas del flujo médico.

## 5. Descripción Detallada de la Solución Planteada

### 5.1. Arquitectura General

El sistema SAVISER está basado en una arquitectura Cliente–Servidor de tres capas:

- **Capa de Presentación (Frontend)**: Desarrollada con React 18 y TypeScript, proporciona interfaces específicas para cada rol de usuario con diseño responsivo usando Tailwind CSS.
- **Capa de Lógica de Negocio (Backend)**: Implementada en Node.js con Express, gestiona la autenticación, validación de datos, lógica de negocio y comunicación con la base de datos.
- **Capa de Datos**: Gestionada por MongoDB con Mongoose, almacena toda la información estructurada del sistema médico.

El flujo de información sigue el modelo:
```
Usuario → React Dashboard → API Node.js → MongoDB → Respuesta al Usuario
```

### 5.2. Tecnologías Utilizadas

| Tecnología | Descripción |
|------------|-------------|
| **React 18** | Framework frontend para crear interfaces dinámicas y componentes reutilizables |
| **TypeScript** | Superset de JavaScript que añade tipado estático para mayor robustez |
| **Tailwind CSS** | Framework CSS utilitario para diseño responsivo y moderno |
| **Node.js + Express** | Entorno backend para construir la API REST |
| **MongoDB + Mongoose** | Base de datos NoSQL y ODM para modelado de datos |
| **JWT (jsonwebtoken)** | Sistema de autenticación basado en tokens |
| **bcryptjs** | Librería para hash de contraseñas |
| **Axios** | Cliente HTTP para comunicación frontend-backend |
| **jsPDF + html2canvas** | Generación de documentos PDF |
| **Lucide React** | Librería de iconos para la interfaz |

### 5.3. Diseño de la Base de Datos

La base de datos `saviser` contiene las siguientes colecciones principales:

#### **users**
- Almacena información de usuarios del sistema con roles diferenciados
- Campos: `email`, `cedula`, `password`, `role`, `name`, `isActive`

#### **patients**
- Guarda datos completos de pacientes
- Campos: `cedula`, `nombre`, `apellido`, `fechaNacimiento`, `telefono`, `email`, `direccion`, `genero`, `contactoEmergencia`

#### **doctors**
- Información del personal médico
- Campos: `userId`, `nombre`, `apellido`, `especialidad`, `numeroLicencia`, `consultorio`, `horarios`

#### **appointments**
- Gestión de citas médicas
- Campos: `pacienteId`, `medicoId`, `fecha`, `hora`, `motivo`, `estado`

#### **triages**
- Registro de evaluaciones de enfermería
- Campos: `pacienteId`, `sintomas`, `prioridad`, `signosVitales`, `estado`, `enfermeraId`

#### **consultations**
- Consultas médicas completas
- Campos: `pacienteId`, `medicoId`, `triageId`, `motivoConsulta`, `anamnesis`, `examenFisico`, `diagnostico`, `tratamiento`, `medicamentos`, `examenes`

Las relaciones entre colecciones se establecen mediante referencias ObjectId, garantizando la integridad referencial.

### 5.4. Desarrollo del Backend (API REST)

El backend se desarrolló con Node.js y Express, utilizando un enfoque modular:

#### **Estructura Principal**
- `server.js`: Configuración del servidor, middleware y rutas principales
- `routes/`: Contiene todas las rutas organizadas por funcionalidad
- `models/`: Modelos de Mongoose para cada entidad
- `middleware/`: Middleware de autenticación y validación

#### **Rutas Principales Implementadas**

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/auth/login` | POST | Autenticación de usuarios |
| `/api/auth/register` | POST | Registro de nuevos usuarios |
| `/api/patients` | GET/POST/PUT | CRUD de pacientes |
| `/api/doctors` | GET/POST/PUT | Gestión de doctores |
| `/api/appointments` | GET/POST/PUT | Gestión de citas |
| `/api/triage` | GET/POST/PUT | Gestión de triajes |
| `/api/consultations` | GET/POST/PUT | Gestión de consultas |
| `/api/dashboard/stats` | GET | Estadísticas del sistema |

#### **Sistema de Autenticación**
- Implementación de JWT con middleware de verificación
- Hash de contraseñas con bcryptjs
- Control de acceso basado en roles
- Manejo de sesiones y logout automático

### 5.5. Desarrollo del Frontend (Aplicación React)

El frontend se desarrolló con React 18, TypeScript y Tailwind CSS:

#### **Componentes Principales**

**Login Component (`src/components/Login.tsx`)**
- Autenticación por pasos (cédula → contraseña)
- Manejo de errores con modales informativos
- Integración con el servicio de autenticación

**Dashboards Especializados**
- `EmpresaDashboard`: Gestión administrativa, doctores y reportes
- `RecepcionDashboard`: Gestión de pacientes y citas
- `ConsultorioDashboard`: Consultas médicas y generación de documentos
- `EnfermeriaDashboard`: Registro y gestión de triajes

**Componentes de Soporte**
- `UserMenu`: Menú contextual por rol con acciones específicas
- `ErrorModal`: Manejo centralizado de errores
- `SuccessToast`: Notificaciones de éxito

#### **Servicios y Hooks**

**Servicio API Centralizado (`src/services/api.ts`)**
```typescript
// Cliente Axios configurado
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor para JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

**Hook Personalizado (`src/hooks/useAPI.ts`)**
- Manejo centralizado de estados de carga y errores
- Métodos específicos para cada entidad del sistema
- Interfaz consistente para todos los dashboards

### 5.6. Integración Frontend–Backend

La comunicación entre frontend y backend se realiza mediante:

#### **Configuración de Axios**
```typescript
const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    const port = hostname === 'localhost' ? ':3000' : '';
    return `${protocol}//${hostname}${port}`;
  }
  return 'http://localhost:3000';
};
```

#### **Manejo de Autenticación**
- Token JWT almacenado en localStorage
- Interceptor automático para agregar Authorization header
- Logout automático en errores 401
- Validación de sesión al cargar la aplicación

#### **Gestión de Estados**
- Hook `useAPI` para operaciones CRUD
- Estados de loading y error centralizados
- Actualización automática de datos tras operaciones

## 6. Resultados y Discusión

El sistema SAVISER implementado logra satisfacer completamente los objetivos planteados:

### **Principales Logros**

1. **Solución del Error 401**: Se implementó correctamente la ruta de registro en el backend, solucionando el problema crítico de autenticación.

2. **Centralización de la API**: El servicio `api.ts` centraliza todas las peticiones HTTP, mejorando la mantenibilidad y consistencia.

3. **Dashboards Funcionales**: Cada rol cuenta con un dashboard específico que permite realizar todas las operaciones necesarias para su función.

4. **Generación de PDF**: Implementación exitosa de generación automática de historias clínicas y recetas médicas usando jsPDF.

5. **Flujo Médico Completo**: El sistema permite seguir el flujo completo desde el registro del paciente hasta la consulta médica.

### **Funcionalidades Validadas**

- ✅ Registro y autenticación de usuarios por roles
- ✅ Gestión completa de pacientes (CRUD)
- ✅ Programación y gestión de citas médicas
- ✅ Sistema de triaje con prioridades
- ✅ Consultas médicas con prescripciones
- ✅ Generación de documentos PDF
- ✅ Dashboards estadísticos
- ✅ Gestión de personal médico

### **Ventajas de la Arquitectura Implementada**

- **Escalabilidad**: Arquitectura modular que permite agregar nuevas funcionalidades
- **Seguridad**: Sistema robusto de autenticación y autorización
- **Mantenibilidad**: Código organizado y bien documentado
- **Usabilidad**: Interfaces intuitivas adaptadas a cada rol
- **Rendimiento**: Optimización de peticiones y manejo eficiente de estados

En pruebas funcionales, el sistema demostró capacidad para manejar múltiples usuarios simultáneos, mantener la integridad de los datos y proporcionar respuestas rápidas en todas las operaciones críticas.

## 7. Configuración y Despliegue

### **Prerrequisitos**
- Node.js (versión 16 o superior)
- npm o yarn
- MongoDB (local o remoto)

### **Variables de Entorno**
Crear archivo `.env` en la raíz del proyecto:
```env
VITE_API_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/saviser
JWT_SECRET=tu_clave_secreta_jwt
PORT=3000
```

### **Comandos de Instalación**
```bash
# Instalar dependencias del proyecto principal
npm install

# Instalar dependencias del backend
cd backend && npm install

# Volver al directorio raíz
cd ..
```

### **Comandos de Ejecución**
```bash
# Iniciar el backend (puerto 3000)
npm run backend

# En otra terminal, iniciar el frontend (puerto 5173)
npm run dev
```

### **Usuarios de Prueba**
El sistema incluye usuarios predefinidos para testing:

| Cédula | Contraseña | Rol |
|--------|------------|-----|
| 12345678 | 12345678 | Empresa |
| 87654321 | 87654321 | Recepción |
| 11111111 | 11111111 | Consultorio |
| 22222222 | 22222222 | Enfermería |

### **Acceso al Sistema**
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`
- Health Check: `http://localhost:3000/health`

---

**SAVISER** - Servicio de Apoyo a la Vida del Ser Humano  
*Sistema de Gestión Médica Integral*