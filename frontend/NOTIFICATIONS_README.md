# 🚨 Sistema de Notificaciones en Tiempo Real

Sistema completo de notificaciones para la aplicación de Alarma Comunitaria, implementado con Angular 17 y WebSocket para comunicación en tiempo real.

## 📋 Características Principales

### ✅ Funcionalidades Implementadas
- **Botón de notificación** con formulario para enviar alertas
- **Alertas visuales** que aparecen automáticamente
- **Panel de historial** con filtros y búsqueda
- **Comunicación WebSocket** en tiempo real
- **Persistencia local** de notificaciones
- **Diseño responsive** compatible con móviles
- **Integración con JWT** para autenticación
- **Badges de notificaciones** no leídas
- **Filtrado por tipo** de alerta
- **Búsqueda de notificaciones**

### 🎯 Tipos de Alertas Soportados
- 🚨 **Emergencia**: Situaciones críticas
- 💰 **Robo**: Reportes de robos
- 🛡️ **Seguridad**: Información de seguridad
- 📢 **General**: Anuncios generales

## 🏗️ Arquitectura del Sistema

### 📁 Estructura de Archivos
```
src/app/
├── Components/
│   ├── notification-button/          # Botón principal y formulario
│   ├── alert-popup/                  # Alertas visuales emergentes
│   ├── notifications-panel/          # Panel de historial
│   └── notification-demo/            # Componente de demostración
├── services/
│   ├── notification.service.ts       # Lógica principal
│   ├── websocket.service.ts          # Comunicación WebSocket
│   └── storage.service.ts            # Persistencia local
└── Share/interface/
    └── notification.interface.ts     # Interfaces TypeScript
```

### 🔧 Componentes Principales

#### 1. NotificationButtonComponent
- **Función**: Botón principal para enviar alertas
- **Características**:
  - Formulario integrado para crear alertas
  - Validación de campos
  - Indicador de conexión WebSocket
  - Badge de notificaciones no leídas

#### 2. AlertPopupComponent
- **Función**: Muestra alertas emergentes
- **Características**:
  - Aparece automáticamente para nuevas notificaciones
  - Auto-ocultar después de 8 segundos
  - Barra de progreso visual
  - Botones de acción (cerrar, marcar como leída)

#### 3. NotificationsPanelComponent
- **Función**: Historial completo de notificaciones
- **Características**:
  - Filtrado por tipo de alerta
  - Búsqueda de texto
  - Marcado como leída/no leída
  - Eliminación de notificaciones
  - Acciones en lote

### 🔌 Servicios

#### NotificationService
- Gestión centralizada de notificaciones
- Comunicación con el backend
- Persistencia local
- Estado reactivo con RxJS

#### WebSocketService
- Conexión WebSocket en tiempo real
- Reconexión automática
- Manejo de errores
- Integración con JWT

## 🚀 Cómo Usar

### 1. Acceder al Sistema
Navega a `/notifications` en tu aplicación (requiere autenticación).

### 2. Enviar una Alerta
1. Haz clic en el botón **"Enviar Alerta"**
2. Completa el formulario:
   - **Tipo de Alerta**: Selecciona el tipo apropiado
   - **Título**: Título descriptivo de la alerta
   - **Mensaje**: Descripción detallada
   - **Ubicación**: Dirección o ubicación específica
   - **URL de Imagen** (opcional): Enlace a imagen relevante
3. Haz clic en **"Enviar Alerta"**

### 3. Ver Historial
1. Haz clic en el botón **"Notificaciones"**
2. Usa los filtros para buscar por tipo
3. Usa la barra de búsqueda para encontrar notificaciones específicas
4. Marca notificaciones como leídas o elimínalas

### 4. Notificaciones Automáticas
- Las nuevas alertas aparecen automáticamente como popups
- Se marcan automáticamente como no leídas
- El badge muestra el número de notificaciones no leídas

## 🔧 Configuración del Backend

### Endpoints Requeridos
```javascript
// GET /api/notifications - Obtener notificaciones
// POST /api/notifications - Crear notificación
// PATCH /api/notifications/:id/read - Marcar como leída
// PATCH /api/notifications/read-all - Marcar todas como leídas
// DELETE /api/notifications/:id - Eliminar notificación
```

### WebSocket
```javascript
// Conectar: ws://localhost:3000/ws?token=JWT_TOKEN
// Enviar notificación: { type: 'send_notification', notification: {...} }
// Recibir notificación: { type: 'notification', notification: {...} }
```

### Modelo de Notificación
```typescript
interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  metadata?: {
    alertType: string;
    location: string;
    imageUrl?: string;
  };
}
```

## 📱 Diseño Responsive

El sistema está completamente optimizado para dispositivos móviles:

- **Desktop**: Layout de dos columnas
- **Tablet**: Layout adaptativo
- **Mobile**: Layout de una columna con controles optimizados

### Breakpoints
- `768px`: Transición a layout móvil
- `480px`: Optimizaciones para pantallas pequeñas

## 🎨 Personalización

### Colores por Tipo de Alerta
```scss
.alert-emergency { border-color: #ff4757; }
.alert-theft { border-color: #ffa502; }
.alert-security { border-color: #2ed573; }
.alert-general { border-color: #3742fa; }
```

### Variables CSS Personalizables
```scss
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --success-color: #4CAF50;
  --danger-color: #f44336;
  --warning-color: #ffc107;
}
```

## 🔒 Seguridad

- **Autenticación JWT**: Todas las operaciones requieren token válido
- **Validación de entrada**: Formularios con validación completa
- **Sanitización**: Prevención de XSS en contenido de notificaciones
- **CORS**: Configuración apropiada para comunicación cross-origin

## 🐛 Solución de Problemas

### WebSocket no conecta
1. Verifica que el servidor esté ejecutándose en `ws://localhost:3000`
2. Confirma que el token JWT sea válido
3. Revisa la consola del navegador para errores

### Notificaciones no aparecen
1. Verifica la conexión WebSocket
2. Confirma que el backend esté enviando el formato correcto
3. Revisa los logs del servidor

### Problemas de persistencia
1. Verifica que localStorage esté habilitado
2. Confirma que no haya errores de JSON parsing
3. Revisa el espacio disponible en el navegador

## 📈 Próximas Mejoras

- [ ] Notificaciones push del navegador
- [ ] Sonidos de alerta personalizables
- [ ] Geolocalización automática
- [ ] Notificaciones programadas
- [ ] Exportación de historial
- [ ] Estadísticas de alertas
- [ ] Integración con mapas
- [ ] Notificaciones por email/SMS

## 🤝 Contribución

Para contribuir al sistema de notificaciones:

1. Fork el repositorio
2. Crea una rama para tu feature
3. Implementa los cambios
4. Añade tests si es necesario
5. Envía un pull request

## 📄 Licencia

Este sistema de notificaciones es parte del proyecto Alarma Comunitaria y está bajo la misma licencia del proyecto principal. 
