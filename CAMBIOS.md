# Cambios Realizados - Sistema SAVISER

## Resumen
Se solucionó el error 401 en el registro y se centralizaron todas las solicitudes HTTP usando axios.

## Cambios Principales

### 1. Backend - Ruta de Registro Agregada
**Archivo:** `backend/src/routes/auth.js`
- ✅ Se agregó la ruta `POST /api/auth/register` que faltaba
- ✅ Validación de correo duplicado
- ✅ Hash de contraseñas con bcryptjs
- ✅ Generación automática de token JWT al registrarse

### 2. Servicio API Centralizado
**Archivo:** `src/services/api.ts` (NUEVO)
- ✅ Cliente axios configurado con baseURL automática
- ✅ Interceptor para agregar token en todas las peticiones
- ✅ Interceptor para manejo de errores 401 (logout automático)
- ✅ APIs organizadas por módulos:
  - `authAPI` - Login y registro
  - `patientsAPI` - Gestión de pacientes
  - `appointmentsAPI` - Gestión de citas
  - `triageAPI` - Gestión de triajes
  - `consultationsAPI` - Gestión de consultas
  - `dashboardAPI` - Estadísticas del dashboard
  - `doctorsAPI` - Gestión de doctores

### 3. Hook Personalizado
**Archivo:** `src/hooks/useAPI.ts` (NUEVO)
- ✅ Hook reutilizable para todas las peticiones API
- ✅ Manejo centralizado de loading y errores
- ✅ Interfaz simple y consistente para todos los dashboards

### 4. Componente Login Actualizado
**Archivo:** `src/components/Login.tsx`
- ✅ Usa `authAPI` en lugar de fetch directo
- ✅ Mejor manejo de errores
- ✅ Registro ahora funcional con inicio de sesión automático

## Solución del Error 401

### Problema Original
El error 401 ocurría porque:
1. No existía la ruta `/api/auth/register` en el backend
2. El frontend intentaba hacer POST a una ruta inexistente
3. El servidor respondía con 401 Unauthorized

### Solución Implementada
1. ✅ Agregada ruta de registro en el backend con validaciones
2. ✅ Todas las llamadas ahora usan axios con manejo de errores
3. ✅ Login automático después del registro exitoso

## Estructura de Archivos

```
src/
├── services/
│   └── api.ts              # Servicio centralizado de API
├── hooks/
│   └── useAPI.ts           # Hook para peticiones HTTP
└── components/
    ├── Login.tsx           # Actualizado con authAPI
    └── dashboards/         # Listos para usar useAPI hook
```

## Uso del Servicio API

### Ejemplo en Login
```typescript
import { authAPI } from '../services/api';

// Login
const response = await authAPI.login({
  documentType,
  documentNumber,
  password
});

// Registro
const response = await authAPI.register({
  name,
  email,
  documentType,
  documentNumber,
  password,
  role
});
```

### Ejemplo con Hook
```typescript
import { useAPI } from '../hooks/useAPI';

const { patients, loading, error } = useAPI();

// Obtener todos los pacientes
const data = await patients.getAll();

// Crear paciente
await patients.create(newPatientData);
```

## Ventajas de la Nueva Arquitectura

1. **Centralización**: Un solo punto de configuración para todas las peticiones
2. **Mantenibilidad**: Más fácil actualizar URLs o agregar interceptores
3. **Consistencia**: Mismo formato de respuesta y error en toda la app
4. **Seguridad**: Token agregado automáticamente en cada petición
5. **Debugging**: Más fácil rastrear problemas de red

## Próximos Pasos Recomendados

1. Actualizar los dashboards para usar el hook `useAPI`
2. Agregar manejo de refresh token
3. Implementar retry logic para peticiones fallidas
4. Agregar cache para peticiones frecuentes

## Comandos de Instalación

```bash
# Instalar dependencias
npm install

# Instalar dependencias del backend
cd backend && npm install

# Iniciar backend
npm run backend

# Iniciar frontend (en otra terminal)
npm run dev
```

## Variables de Entorno

Asegúrate de tener el archivo `.env` en la raíz del proyecto:

```env
VITE_API_URL=http://localhost:3000
```

## Usuarios de Prueba

Para login (sin base de datos):
- **Documento:** 12345678 - **Rol:** Empresa
- **Documento:** 87654321 - **Rol:** Recepción
- **Documento:** 11111111 - **Rol:** Consultorio
- **Documento:** 22222222 - **Rol:** Enfermería

Para registro:
Puedes crear un nuevo usuario desde el formulario de registro.
