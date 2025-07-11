const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

// Crear un token JWT de prueba
const JWT_SECRET = 'tu_jwt_secret_super_seguro';
const testToken = jwt.sign(
  {
    userId: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User'
  },
  JWT_SECRET,
  { expiresIn: '24h' }
);

console.log('🔑 Token de prueba generado:', testToken);

// Conectar al WebSocket
const ws = new WebSocket(`ws://localhost:3000/ws?token=${testToken}`);

ws.on('open', () => {
  console.log('✅ Conectado al WebSocket');

  // Enviar una notificación de prueba
  const testNotification = {
    title: 'Alerta de Prueba',
    message: 'Esta es una notificación de prueba desde el script',
    alertType: 'test',
    location: 'Quito, Ecuador',
    imageUrl: 'https://via.placeholder.com/300x200'
  };

  const message = {
    type: 'send_notification',
    notification: testNotification
  };

  console.log('📤 Enviando notificación de prueba:', message);
  ws.send(JSON.stringify(message));
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    console.log('📨 Mensaje recibido:', message);
  } catch (error) {
    console.error('Error parsing message:', error);
  }
});

ws.on('close', (code, reason) => {
  console.log('❌ WebSocket cerrado. Código:', code, 'Razón:', reason);
});

ws.on('error', (error) => {
  console.error('❌ Error en WebSocket:', error);
});

// Cerrar después de 10 segundos
setTimeout(() => {
  console.log('🔄 Cerrando conexión...');
  ws.close();
  process.exit(0);
}, 10000);
