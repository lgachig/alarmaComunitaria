const express = require('express');
const cors = require('cors');
const http = require('http');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Importar el servidor WebSocket
const NotificationWebSocketServer = require('./websocket-server');

const app = express();
const server = http.createServer(app);
const PORT = 3000;

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'tu_jwt_secret_super_seguro';

// Conectar a MongoDB
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

// Esquema de Usuario
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Hash de contraseña antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

// --- INICIO MODELO PUNTO ---
const { Schema: SchemaPunto, model: modelPunto, Types: TypesPunto } = mongoose;

const puntoSchema = new SchemaPunto({
  tipo: {
    type: String,
    enum: ['robo', 'secuestro', 'camara'],
    required: true
  },
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
  },
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    required: true,
    trim: true
  },
  fecha: {
    type: String,
    default: new Date().toISOString().split('T')[0]
  },
  usuarioId: {
    type: SchemaPunto.Types.ObjectId,
    ref: 'User',
    required: true
  },
  direccion: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

const Punto = modelPunto('Punto', puntoSchema);
// --- FIN MODELO PUNTO ---

// Inicializar WebSocket server
const wsServer = new NotificationWebSocketServer(server, JWT_SECRET);

// Hacer disponible el servidor WebSocket para las rutas
app.locals.notificationServer = wsServer;

// Middleware
app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API de Alarma Comunitaria funcionando' });
});

// Obtener todos los usuarios
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
});

// Registrar usuario
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    // Crear nuevo usuario
    const user = new User({ name, email, password });
    await user.save();

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Login usuario
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Generar JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Middleware para verificar JWT token
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

// Rutas de notificaciones con autenticación
app.post('/api/notifications', authenticateToken, (req, res) => {
  try {
    const { title, message, alertType, location, imageUrl } = req.body;

    // Validar campos requeridos
    if (!title || !message || !location) {
      return res.status(400).json({
        message: 'Título, mensaje y ubicación son requeridos'
      });
    }

    // Crear notificación
    const notification = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      title,
      message,
      timestamp: new Date(),
      isRead: false,
      sender: {
        userId: req.user.userId,
        email: req.user.email,
        name: req.user.name
      },
      metadata: {
        alertType: alertType || 'general',
        location,
        imageUrl
      }
    };

    // Agregar a la lista de notificaciones
    const notifications = wsServer.getNotifications();
    notifications.push(notification);

    // Broadcast a todos los clientes conectados
    wsServer.broadcast({
      type: 'new_notification',
      notification
    });

    console.log(`📢 Notificación enviada por ${req.user.email}: ${title}`);
    console.log(`👥 Clientes conectados: ${wsServer.getConnectedClients().length}`);

    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creando notificación:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.get('/api/notifications', authenticateToken, (req, res) => {
  try {
    const notifications = wsServer.getNotifications();
    const sortedNotifications = notifications.sort((a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    res.json(sortedNotifications);
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// --- INICIO RUTAS PUNTOS ---
// GET todos los puntos
app.get('/api/puntos', async (req, res) => {
  try {
    const puntos = await Punto.find();
    res.json(puntos);
  } catch (err) {
    console.error('Error al obtener puntos:', err);
    res.status(500).json({ error: 'Error al obtener puntos' });
  }
});

// POST crear nuevo punto
app.post('/api/puntos', async (req, res) => {
  try {
    if (!req.body.usuarioId || !TypesPunto.ObjectId.isValid(req.body.usuarioId)) {
      return res.status(400).json({ error: 'ID de usuario inválido o faltante' });
    }
    const puntoData = {
      ...req.body,
      usuarioId: new TypesPunto.ObjectId(req.body.usuarioId)
    };
    const punto = new Punto(puntoData);
    const savedPunto = await punto.save();
    const puntoConUsuario = await Punto.findById(savedPunto._id).populate('usuarioId', 'name email');
    res.status(201).json(puntoConUsuario);
  } catch (err) {
    console.error('Error al guardar punto:', err);
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ errors });
    }
    res.status(500).json({ error: 'Error al guardar el punto' });
  }
});
// --- FIN RUTAS PUNTOS ---

// Ruta para ver clientes conectados
app.get('/api/connected-clients', (req, res) => {
  const clients = wsServer.getConnectedClients();
  res.json({
    connectedClients: clients,
    count: clients.length
  });
});

// Ruta de prueba para crear notificación
app.post('/api/test-notification', (req, res) => {
  try {
    const { title, message, alertType, location, imageUrl } = req.body;

    // Crear notificación de prueba
    const notification = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      title: title || 'Alerta de Prueba',
      message: message || 'Esta es una notificación de prueba',
      timestamp: new Date(),
      isRead: false,
      sender: {
        userId: 'test-user',
        email: 'test@example.com',
        name: 'Test User'
      },
      metadata: {
        alertType: alertType || 'general',
        location: location || 'Quito, Ecuador',
        imageUrl: imageUrl || 'https://via.placeholder.com/300x200'
      }
    };

    // Agregar a la lista de notificaciones
    const notifications = wsServer.getNotifications();
    notifications.push(notification);

    // Broadcast a todos los clientes conectados
    wsServer.broadcast({
      type: 'new_notification',
      notification
    });

    console.log(`📢 Notificación de prueba enviada: ${notification.title}`);
    console.log(`👥 Clientes conectados: ${wsServer.getConnectedClients().length}`);

    res.json({
      success: true,
      notification,
      connectedClients: wsServer.getConnectedClients().length
    });
  } catch (error) {
    console.error('Error creando notificación de prueba:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🔌 WebSocket server iniciado`);
  console.log(`📊 URL: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket URL: ws://localhost:${PORT}/ws`);
});
