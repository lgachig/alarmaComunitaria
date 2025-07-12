const express = require('express');
const { upsertCamara, getCamaras, getCamaraById } = require('../controllers/camaraController.js');

const router = express.Router();

// Registrar o actualizar cámara
router.post('/', upsertCamara);
// Obtener todas las cámaras
router.get('/', getCamaras);
// Obtener una cámara por camera_id
router.get('/:camera_id', getCamaraById);

module.exports = router; 