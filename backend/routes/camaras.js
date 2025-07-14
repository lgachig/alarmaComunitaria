const express = require('express');
const { 
  registerCamara, 
  updateCamara, 
  getCamaras, 
  getCamaraById, 
  deleteCamara, 
  getNearbyCamaras, 
  updateCamaraStatus 
} = require('../controllers/camaraController.js');

const router = express.Router();

// Middleware de autenticación (asumiendo que ya existe)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token requerido' });
  }
  // Aquí iría la verificación del token JWT
  // Por ahora, asumimos que req.user se establece en el middleware
  next();
};

// Rutas públicas (para el backend Python)
router.post('/status', updateCamaraStatus); // Actualizar estado desde backend Python

// Rutas protegidas (requieren autenticación)
router.post('/', authenticateToken, registerCamara); // Registrar nueva cámara
router.put('/:camera_id', authenticateToken, updateCamara); // Actualizar cámara
router.delete('/:camera_id', authenticateToken, deleteCamara); // Eliminar cámara

// Rutas de consulta
router.get('/', getCamaras); // Obtener todas las cámaras (con filtros)
router.get('/nearby', getNearbyCamaras); // Obtener cámaras cercanas
router.get('/:camera_id', getCamaraById); // Obtener una cámara específica

module.exports = router; 