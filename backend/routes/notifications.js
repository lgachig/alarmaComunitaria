const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Get all notifications
router.get('/', authenticateToken, (req, res) => {
  try {
    // Get notifications from WebSocket server
    const notifications = req.app.locals.notificationServer.getNotifications();

    // Sort by timestamp (newest first)
    const sortedNotifications = notifications.sort((a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    res.json(sortedNotifications);
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Create new notification
router.post('/', authenticateToken, (req, res) => {
  try {
    const { title, message, alertType, location, imageUrl } = req.body;

    // Validate required fields
    if (!title || !message || !location) {
      return res.status(400).json({
        message: 'Título, mensaje y ubicación son requeridos'
      });
    }

    // Create notification object
    const notification = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      title,
      message,
      timestamp: new Date(),
      isRead: false,
      sender: {
        userId: req.user.userId || req.user.id,
        email: req.user.email,
        name: req.user.name
      },
      metadata: {
        alertType: alertType || 'general',
        location,
        imageUrl
      }
    };

    // Add to notifications list
    const notifications = req.app.locals.notificationServer.getNotifications();
    notifications.push(notification);

    // Keep only last 100 notifications
    if (notifications.length > 100) {
      notifications.splice(0, notifications.length - 100);
    }

    // Broadcast to all connected clients
    req.app.locals.notificationServer.broadcast({
      type: 'new_notification',
      notification
    });

    console.log(`📢 Notification created by ${req.user.email}: ${title}`);

    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const notifications = req.app.locals.notificationServer.getNotifications();

    const notification = notifications.find(n => n.id === id);
    if (!notification) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }

    notification.isRead = true;

    // Broadcast update to all clients
    req.app.locals.notificationServer.broadcast({
      type: 'notification_updated',
      notificationId: id,
      isRead: true
    });

    console.log(`✅ Notification ${id} marked as read by ${req.user.email}`);

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Mark all notifications as read
router.patch('/read-all', authenticateToken, (req, res) => {
  try {
    const notifications = req.app.locals.notificationServer.getNotifications();

    notifications.forEach(notification => {
      notification.isRead = true;
    });

    // Broadcast update to all clients
    req.app.locals.notificationServer.broadcast({
      type: 'all_notifications_read'
    });

    console.log(`✅ All notifications marked as read by ${req.user.email}`);

    res.json({ message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const notifications = req.app.locals.notificationServer.getNotifications();

    const notificationIndex = notifications.findIndex(n => n.id === id);
    if (notificationIndex === -1) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }

    // Check if user is the sender or has admin privileges
    const notification = notifications[notificationIndex];
    if (notification.sender.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permisos para eliminar esta notificación' });
    }

    notifications.splice(notificationIndex, 1);

    // Broadcast deletion to all clients
    req.app.locals.notificationServer.broadcast({
      type: 'notification_deleted',
      notificationId: id
    });

    console.log(`🗑️ Notification ${id} deleted by ${req.user.email}`);

    res.json({ message: 'Notificación eliminada' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Get connected clients (admin only)
router.get('/clients', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const clients = req.app.locals.notificationServer.getConnectedClients();
    res.json(clients);
  } catch (error) {
    console.error('Error getting connected clients:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
