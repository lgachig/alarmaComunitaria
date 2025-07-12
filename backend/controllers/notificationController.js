// Controlador de notificaciones
let wsServer;

const setWebSocketServer = (server) => {
  wsServer = server;
};

// Enviar notificación (requiere autenticación)
const sendNotification = (req, res) => {
  try {
    const { title, message, alertType, location, imageUrl } = req.body;
    if (!title || !message || !location) {
      return res.status(400).json({
        message: 'Título, mensaje y ubicación son requeridos'
      });
    }
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
    
    const notifications = wsServer.getNotifications();
    notifications.push(notification);
    wsServer.broadcast({ type: 'new_notification', notification });
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creando notificación:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener notificaciones (requiere autenticación)
const getNotifications = (req, res) => {
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
};

// Notificación de prueba
const testNotification = (req, res) => {
  try {
    const { title, message, alertType, location, imageUrl } = req.body;
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
    const notifications = wsServer.getNotifications();
    notifications.push(notification);
    wsServer.broadcast({ type: 'new_notification', notification });
    res.json({
      success: true,
      notification,
      connectedClients: wsServer.getConnectedClients().length
    });
  } catch (error) {
    console.error('Error creando notificación de prueba:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Ver clientes conectados
const getConnectedClients = (req, res) => {
  const clients = wsServer.getConnectedClients();
  res.json({
    connectedClients: clients,
    count: clients.length
  });
};

module.exports = {
  setWebSocketServer,
  sendNotification,
  getNotifications,
  testNotification,
  getConnectedClients
};
