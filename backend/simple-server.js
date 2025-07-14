// =========================
//        IMPORTS
// =========================
const express = require('express');
const cors = require('cors');
const http = require('http');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// --- Controllers ---
const userController = require('./controllers/userController');
const notificationController = require('./controllers/notificationController');
const puntosController = require('./controllers/puntosController');
const NotificationWebSocketServer = require('./websocket-server');

// --- Importar routers ---
const puntosRouter = require('./routes/puntos');
const usersRouter = require('./routes/users');
const notificationsRouterFactory = require('./routes/notifications');
const camarasRouter = require('./routes/camaras');

// --- Modelos ---
const Camara = require('./models/Camara').default || require('./models/Camara');
const User = require('./models/User').User || require('./models/User');

// --- Funciones auxiliares ---
const haversine = (lat1, lon1, lat2, lon2) => {
  const toRad = (x) => x * Math.PI / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// =========================
//   CONFIGURACIÓN GLOBAL
// =========================
const app = express();
const server = http.createServer(app);
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'tu_jwt_secret_super_seguro';

// =========================
//   CONEXIÓN A MONGODB
// =========================
mongoose.connect('mongodb+srv://elluis20026:CRUZlucho.com@practica.81cgj.mongodb.net/alarmaComunitaria', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB conectado exitosamente');
})
.catch((error) => {
  console.error('❌ Error conectando a MongoDB:', error);
});

// =========================
//      MIDDLEWARES
// =========================
app.use(cors());
app.use(express.json());

// =========================
//   INICIALIZACIÓN WS
// =========================
const wsServer = new NotificationWebSocketServer(server, JWT_SECRET);
app.locals.notificationServer = wsServer;
notificationController.setWebSocketServer(wsServer);

// =========================
//      RUTA DE PRUEBA
// =========================
app.get('/', (req, res) => {
  res.json({ message: 'API de Alarma Comunitaria funcionando' });
});

// =========================
//      AUTENTICACIÓN
// =========================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token requerido' });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// =========================
//         RUTAS
// =========================
// --- Usar routers ---
app.use('/api/puntos', puntosRouter);
app.use('/api', usersRouter);
app.use('/api/notifications', notificationsRouterFactory(wsServer, authenticateToken));
app.use('/api/camaras', camarasRouter);

// Endpoints para eventos de cámara
app.post('/api/detalle', async (req, res) => {
  try {
    const { camera_id, nombre, location, estado, alert_level, video_url, tipo_evento } = req.body;
    if (!camera_id || !location) {
      return res.status(400).json({ error: 'camera_id y location son requeridos' });
    }
    
    // Verificar si la cámara existe
    const camara = await Camara.findOne({ camera_id });
    if (!camara) {
      return res.status(404).json({ error: 'Cámara no encontrada. Debe registrarse primero.' });
    }
    
    // Actualizar o registrar cámara
    const update = {
      nombre,
      ubicacion: {
        coordinates: [location.longitude, location.latitude]
      },
      estado: estado || 'alerta',
      alert_level: alert_level || 'alta',
      video_url,
      ultima_actividad: new Date()
    };
    
    await Camara.findOneAndUpdate(
      { camera_id },
      { $set: update }
    );
    
    // Obtener usuarios conectados (simulado: todos los usuarios)
    const usuarios = await User.find({}, 'name email ubicacion');
    const usuariosCercanos = usuarios.filter(u => {
      if (!u.ubicacion?.coordinates) return false;
      const dist = haversine(
        location.latitude,
        location.longitude,
        u.ubicacion.coordinates[1], // lat
        u.ubicacion.coordinates[0]  // lon
      );
      return dist < 1.0; // 1 km de radio
    });
    
    // Notificar a usuarios cercanos vía WebSocket
    wsServer.broadcast({
      type: 'alerta_camara',
      camera_id,
      nombre,
      ubicacion: location,
      estado: update.estado,
      alert_level: update.alert_level,
      video_url,
      tipo_evento,
      usuariosCercanos: usuariosCercanos.map(u => u.email)
    });
    
    res.json({ message: 'Evento de cámara procesado', camara, usuariosCercanos });
  } catch (err) {
    res.status(500).json({ error: 'Error procesando evento de cámara', details: err.message });
  }
});

app.post('/api/estado', async (req, res) => {
  try {
    const { camera_id, status } = req.body;
    if (!camera_id || !status) {
      return res.status(400).json({ error: 'camera_id y status son requeridos' });
    }
    
    const camara = await Camara.findOneAndUpdate(
      { camera_id },
      { $set: { estado: status, ultima_actividad: new Date() } },
      { new: true }
    );
    
    res.json({ message: 'Estado de cámara actualizado', camara });
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando estado de cámara', details: err.message });
  }
});

// =========================
//   INICIAR SERVIDOR
// =========================
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🔌 WebSocket server iniciado`);
  console.log(`📊 URL: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket URL: ws://localhost:${PORT}/ws`);
});
